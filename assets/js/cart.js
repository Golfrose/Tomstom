import { auth, database } from './firebase.js';
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
  const quantity = parseInt(quantityInput.value || '0', 10);

  if (!quantity || quantity <= 0) {
    alert('กรุณาเลือกจำนวนให้ถูกต้อง');
    return;
  }

  // mix/ราคา
  const mixRadio = productCard.querySelector(`input[name="mix-${product}"]:checked`);
  const mix = mixRadio ? mixRadio.value : 'ไม่มี';
  const pricePerUnit = parseFloat(mixRadio ? mixRadio.dataset.price : productCard.dataset.price);

  // ✅ อ่านชื่อลูกค้าจากช่องที่เราใส่ไว้บนการ์ด
  const customerInput = productCard.querySelector('.customer-input');
  const customerName = (customerInput?.value || '').trim();

  // แสดงผลในตะกร้า
  const displayName = customerName
    ? `${customerName}${mix !== 'ไม่มี' ? ` (${mix})` : ''}`
    : `${product}${mix !== 'ไม่มี' ? ` (${mix})` : ''}`;

  // คิดเงินตาม logic เดิม
  let totalPrice = pricePerUnit * quantity;
  if (product === 'น้ำดิบ') {
    totalPrice = Math.floor(quantity / 2) * 120 + (quantity % 2) * 65;
  }

  // ใช้ key เดิม (ระวังอย่าชน) — เพิ่มชื่อลูกค้าเข้าไปเพื่อแยกรายการให้ถูก
  const key = `${product}::${mix}::${customerName || '-'}`;

  if (cart[key]) {
    cart[key].quantity += quantity;
    cart[key].totalPrice += totalPrice;
  } else {
    cart[key] = {
      product,          // ชื่อสินค้าแท้
      mix,
      quantity,
      pricePerUnit,
      totalPrice,
      customerName,     // ✅ เก็บชื่อลูกค้า
      displayName       // ✅ เก็บชื่อที่ต้องการแสดงผล
    };
  }

  // บันทึกลงฐานข้อมูลเพื่อให้ข้อมูล sync ข้ามอุปกรณ์
  if (auth.currentUser) {
    database.ref('cart/' + auth.currentUser.uid).child(key).set(cart[key]);
  }

  quantityInput.value = 0;
  updateCartCount();
  alert(`เพิ่ม ${quantity} ขวด ลงในตะกร้าแล้ว`);
}

export function updateCartCount() {
  let totalItems = 0;
  for (const k in cart) {
    totalItems += cart[k].quantity;
  }
  document.getElementById('cart-count').textContent = totalItems;
}

export function removeFromCart(key) {
  if (!cart[key]) return;
  delete cart[key];
  // ลบจากฐานข้อมูลด้วยเพื่อให้ข้อมูลตรงกันแบบเรียลไทม์
  if (auth.currentUser) {
    database.ref('cart/' + auth.currentUser.uid + '/' + key).remove();
  }
  updateCartCount();
  renderCartModal();  // รีเฟรช modal และยอดรวม
}

export function renderCartModal() {
  const modalItems = document.getElementById('modal-items');
  modalItems.innerHTML = '';
  let totalCartPrice = 0;

  for (const key in cart) {
    const item = cart[key];
    totalCartPrice += item.totalPrice;

    // ✅ ใช้ displayName ถ้ามี (เช่น "กอล์ฟ (ผสมเงิน)")
    const lineName = (item.displayName && item.displayName.trim())
      ? item.displayName.trim()
      : `${item.product}${item.mix !== 'ไม่มี' ? ` (${item.mix})` : ''}`;

    const itemDiv = document.createElement('div');
    itemDiv.classList.add('modal-item');
    itemDiv.innerHTML = `
      <button class="remove-item" data-key="${key}" aria-label="ลบรายการ">×</button>
      <div class="item-details">
        <div>${lineName}</div>
        <small>${item.quantity} ขวด × ${item.pricePerUnit}฿</small>
      </div>
      <span class="item-total">${item.totalPrice.toLocaleString()}฿</span>
    `;
    modalItems.appendChild(itemDiv);
  }

  document.getElementById('modal-cart-total').textContent = totalCartPrice.toLocaleString();
  document.getElementById('cart-modal').style.display = 'flex';

  // ปุ่มลบ
  modalItems.querySelectorAll('.remove-item').forEach(btn => {
    btn.addEventListener('click', (e) => removeFromCart(e.currentTarget.dataset.key));
  });
}

export function clearCart() {
  cart = {};
  updateCartCount();
  document.getElementById('cart-modal').style.display = 'none';
  // ล้างข้อมูลตะกร้าในฐานข้อมูลเมื่อยืนยันคำสั่งซื้อเสร็จ
  if (auth.currentUser) {
    database.ref('cart/' + auth.currentUser.uid).remove();
  }
}

export function initCartSync() {
  const user = auth.currentUser;
  if (!user) return;
  const cartRef = database.ref('cart/' + user.uid);
  // รวมรายการที่อาจอยู่ใน local ก่อนล็อกอิน เข้ากับของในฐานข้อมูล
  cartRef.once('value').then(snapshot => {
    const serverCart = snapshot.val() || {};
    for (const key in cart) {
      if (serverCart[key]) {
        serverCart[key].quantity += cart[key].quantity;
        serverCart[key].totalPrice += cart[key].totalPrice;
      } else {
        serverCart[key] = cart[key];
      }
    }
    cart = serverCart;
    cartRef.set(serverCart);
    // เริ่มฟังการเปลี่ยนแปลงแบบเรียลไทม์ของตะกร้าสินค้า
    cartRef.on('value', snap => {
      cart = snap.val() || {};
      updateCartCount();
      // ถ้า modal ตะกร้ากำลังเปิดอยู่ ให้รีเฟรชรายการใน modal
      if (document.getElementById('cart-modal').style.display === 'flex') {
        renderCartModal();
      }
    });
  });
}

export function detachCartSync() {
  const user = auth.currentUser;
  if (user) {
    database.ref('cart/' + user.uid).off('value');
  }
}