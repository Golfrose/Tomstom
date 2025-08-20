// ===== Cart (ฉบับสมบูรณ์) =====
export const cart = {}; // เก็บตาม key: product::mix::customer

function normalizeText(s){ return (s||'').toString().trim(); }
function computeDisplayName({product, mix, customerName}){
  const right = (mix && mix !== 'ไม่มี') ? ` (${mix})` : '';
  return customerName ? `${customerName}${right}` : `${product}${right}`;
}

export function updateCartCount(){
  const count = Object.values(cart).reduce((n,it)=>n+it.quantity,0);
  const badge = document.getElementById('cart-count');
  if (badge) badge.textContent = count;
}

export function removeFromCart(key){
  if (cart[key]) delete cart[key];
  renderCartModal();
  updateCartCount();
}

export function clearCart(){
  for (const k in cart) delete cart[k];
  updateCartCount();
  const modal = document.getElementById('cart-modal');
  if (modal) modal.style.display = 'none';
}

export function addToCart(productCard){
  const product = productCard.dataset.product || productCard.getAttribute('data-product') || '';
  const quantityInput = productCard.querySelector('.quantity-input');
  const quantity = parseInt(quantityInput?.value || '0', 10);
  if (!quantity || quantity <= 0) { alert('กรุณาเลือกจำนวนให้ถูกต้อง'); return; }

  // mix + ราคา
  const mixRadio = productCard.querySelector(`input[name="mix-${product}"]:checked`);
  const mix = mixRadio ? mixRadio.value : 'ไม่มี';
  const pricePerUnit = parseFloat(mixRadio ? mixRadio.dataset.price : productCard.dataset.price);

  // ชื่อลูกค้า
  const customerInput = productCard.querySelector('.customer-input');
  const customerName = normalizeText(customerInput?.value);

  // โปรโมชั่นเดิม (ปรับตามของคุณได้)
  let totalPrice = pricePerUnit * quantity;
  if (product === 'น้ำดิบ') {
    totalPrice = Math.floor(quantity / 2) * 120 + (quantity % 2) * 65;
  }

  // แยก key ด้วยลูกค้า เพื่อไม่ไปรวมยอดกันมั่ว
  const key = `${product}::${mix}::${customerName || '-'}`;

  if (cart[key]) {
    cart[key].quantity += quantity;
    cart[key].totalPrice += totalPrice;
  } else {
    cart[key] = {
      product,
      mix,
      quantity,
      pricePerUnit,
      totalPrice,
      customerName,
      displayName: computeDisplayName({product, mix, customerName})
    };
  }

  if (quantityInput) quantityInput.value = 0;
  updateCartCount();
  alert(`เพิ่ม ${quantity} ขวด ลงในตะกร้าแล้ว`);
}

export function renderCartModal(){
  const modal = document.getElementById('cart-modal');
  const modalItems = document.getElementById('modal-items');
  const sumEl = document.getElementById('modal-cart-total');
  if(!modal || !modalItems || !sumEl) return;

  modalItems.innerHTML = '';
  let totalCartPrice = 0;

  for (const key in cart) {
    const item = cart[key];
    totalCartPrice += item.totalPrice;

    const lineName = item.displayName || computeDisplayName(item);

    const itemDiv = document.createElement('div');
    itemDiv.classList.add('modal-item');
    itemDiv.innerHTML = `
      <button class="remove-item" data-key="${key}" aria-label="ลบรายการ">×</button>
      <div class="item-details">
        <div class="item-name">${lineName}</div>
        <small>${item.quantity} ขวด × ${item.pricePerUnit}฿</small>
      </div>
      <span class="item-total">${item.totalPrice.toLocaleString()}฿</span>
    `;
    modalItems.appendChild(itemDiv);
  }

  sumEl.textContent = totalCartPrice.toLocaleString();
  modal.style.display = 'flex';

  modalItems.querySelectorAll('.remove-item').forEach(btn=>{
    btn.addEventListener('click', (e)=> removeFromCart(e.currentTarget.dataset.key));
  });
}

// ปุ่มพื้นฐาน (ถ้ายังไม่มีการ bind ในไฟล์อื่น)
export function bindCartButtons(){
  const openBtn = document.getElementById('open-cart');
  const closeBtn = document.getElementById('close-cart');
  openBtn && openBtn.addEventListener('click', renderCartModal);
  closeBtn && closeBtn.addEventListener('click', ()=>{ document.getElementById('cart-modal').style.display='none'; });
}

// auto-bind เมื่อ DOM พร้อม
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindCartButtons);
} else {
  bindCartButtons();
}
