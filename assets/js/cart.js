// cart.js — เวอร์ชันใส่ปุ่มกากบาทลบรายการในโมดัล
export let cart = {};

export function changeQuantity(inputEl, change) {
  const input = inputEl.closest('.quantity-control').querySelector('.quantity-input');
  let quantity = parseInt(input.value || '0') + change;
  if (quantity < 0) quantity = 0;
  input.value = quantity;
  updateCartCount();
}

export function addToCart(productCard) {
  const product = productCard.dataset.product;
  const quantityInput = productCard.querySelector('.quantity-input');
  const quantity = parseInt(quantityInput.value || '0');

  if (quantity <= 0) {
    alert('กรุณาใส่จำนวนสินค้าก่อน');
    return;
  }

  const mixRadio = productCard.querySelector(`input[name="mix-${product}"]:checked`);
  const mix = mixRadio ? mixRadio.value : 'ไม่มี';
  const pricePerUnit = parseFloat(mixRadio ? mixRadio.dataset.price : productCard.dataset.price);

  let totalPrice = pricePerUnit * quantity;
  // โปรโมชัน: น้ำดิบ 2 ขวด 120
  if (product === 'น้ำดิบ') {
    totalPrice = Math.floor(quantity / 2) * 120 + (quantity % 2) * 65;
  }

  const key = `${product}-${mix}`;
  if (cart[key]) {
    cart[key].quantity += quantity;
    cart[key].totalPrice += totalPrice;
  } else {
    cart[key] = { product, mix, quantity, pricePerUnit, totalPrice };
  }

  quantityInput.value = 0;
  updateCartCount();
  alert(`เพิ่ม ${quantity} ขวด ลงในตะกร้าแล้ว`);
}

export function updateCartCount() {
  let totalItems = 0;
  for (const k in cart) totalItems += cart[k].quantity;
  document.getElementById('cart-count').textContent = totalItems;
}

/* ---------- ใหม่: ลบรายการจากตะกร้า ---------- */
export function removeFromCart(key){
  if(!cart[key]) return;
  delete cart[key];
  updateCartCount();
  renderCartModal();  // รีเฟรช modal และยอดรวม
}

/* ---------- อัปเดต: ใส่ปุ่มกากบาท × ในแต่ละแถว ---------- */
export function renderCartModal() {
  const modalItems = document.getElementById('modal-items');
  modalItems.innerHTML = '';
  let totalCartPrice = 0;

  for (const key in cart) {
    const item = cart[key];
    totalCartPrice += item.totalPrice;

    const itemDiv = document.createElement('div');
    itemDiv.classList.add('modal-item');
    itemDiv.innerHTML = `
      <button class="remove-item" data-key="${key}" aria-label="ลบรายการ">×</button>
      <div class="item-details">
        <div>${item.product} ${item.mix !== 'ไม่มี' ? `(${item.mix})` : ''}</div>
        <small>${item.quantity} ขวด × ${item.pricePerUnit}฿</small>
      </div>
      <span class="item-total">${item.totalPrice.toLocaleString()}฿</span>
    `;
    modalItems.appendChild(itemDiv);
  }

  document.getElementById('modal-cart-total').textContent = totalCartPrice.toLocaleString();
  document.getElementById('cart-modal').style.display = 'flex';

  // bind ปุ่มลบทุกรายการ
  modalItems.querySelectorAll('.remove-item').forEach(btn => {
    btn.addEventListener('click', (e) => removeFromCart(e.currentTarget.dataset.key));
  });
}

export function clearCart() {
  cart = {};
  updateCartCount();
  document.getElementById('cart-modal').style.display = 'none';
}
/* ===== CustomerName :: CART – APPEND-ONLY (ไม่แตะของเดิม) ===== */
(function(){
  const CND = window.CustomerNameData;

  // อ่านชื่อ/ตัวเลือกจากการ์ด (จากหน้าขาย) — ใช้ตอนกดเพิ่ม
  function getCustomerNameFromCard(cardEl){
    const el = cardEl && cardEl.querySelector('.customer-input');
    return el ? el.value.trim() : '';
  }
  function getOptionFromCard(cardEl){
    try{
      const chk = cardEl && cardEl.querySelector('input[type="radio"]:checked');
      if(!chk) return '';
      const lbl = chk.closest('label') || chk.parentElement;
      if (lbl && lbl.textContent) return lbl.textContent.trim();
      if (chk.nextElementSibling && chk.nextElementSibling.textContent) return chk.nextElementSibling.textContent.trim();
    }catch{}
    return '';
  }

  // ถ้าระบบคุณมี global CART (Array) เราจะ "ครอบ" ให้ auto-decorate ตอน push
  function wrapCartArrayWhenReady(){
    const tryWrap = ()=>{
      const root = window;
      const CART = root.CART;
      if (!Array.isArray(CART) || CART.__wrappedByCustomerName) return false;

      // เก็บของเดิม
      const _push = CART.push.bind(CART);
      Object.defineProperty(CART, '__wrappedByCustomerName', { value: true });

      // ครอบ push: ถ้า item ขาดฟิลด์ → เติมให้
      CART.push = function(...items){
        const patched = items.map(it=>{
          try{
            // ถ้ามีอยู่แล้วก็ข้าม
            if (it && (it.displayName || it.customerName)) return it;

            const product = {
              id: it?.productId || it?.id,
              name: it?.productName || it?.name
            };
            const option = it?.option || '';
            const qty    = it?.qty ?? 1;
            const price  = it?.price ?? 0;

            // พยายามอ่าน customerName จากการ์ดสุดท้ายที่กด (ถ้ามี event)
            let customerName = '';
            if (window.__lastAddCardEl) {
              customerName = getCustomerNameFromCard(window.__lastAddCardEl) || '';
            }

            const withName = CND.makeCartItemBase({ product, option, qty, price, customerName });

            // ผสานกลับกับฟิลด์เดิม (เช่น discount ฯลฯ)
            return Object.assign({}, it, withName);
          }catch(e){ return it; }
        });
        return _push(...patched);
      };

      return true;
    };
    // ลองครอบทันที และลองอีกสักพักเผื่อ CART ถูกกำหนดทีหลัง
    if (!tryWrap()){
      let n = 0;
      const t = setInterval(()=>{ if (tryWrap() || ++n>50) clearInterval(t); }, 200);
    }
  }

  // เวลา "กดเพิ่มลงตะกร้า" ให้บันทึกการ์ดที่กดล่าสุดไว้ เพื่ออ่านชื่อลูกค้า
  document.addEventListener('click', (ev)=>{
    const btn = ev.target.closest('button');
    if (!btn || !/เพิ่มลงตะกร้า/.test(btn.textContent||'')) return;
    window.__lastAddCardEl = btn.closest('.product-card, .card, .product, [data-product-id]') || null;
    // ถ้าระบบคุณเรียก addToCart(product) ภายใน handler เดิม → CART.push จะโดนครอบแล้ว
    // ถ้าระบบคุณ "ไม่ใช้ CART" ให้บอกชื่อฟังก์ชัน addToCart มา เดี๋ยวผมเขียน wrapper ให้ตรงชื่อ
  });

  // ตอน render ตะกร้า ถ้าโค้ดเดิมใช้ item.productName → เราพยายามเปลี่ยน textcontent เป็น displayName ให้ “ก่อนสร้าง HTML”
  // วิธีนี้ขึ้นกับโค้ดเดิม — แต่เมื่อ CART มี displayName แล้ว โค้ดเดิมส่วนใหญ่จะหยิบมาใช้เอง
  wrapCartArrayWhenReady();
})();
