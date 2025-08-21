// cart.js — รองรับชื่อลูกค้า แยกโอน/สด ป้องกัน scroll ด้านหลัง และลบ/แก้ไขได้
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
  // selected mix
  const mixRadio = productCard.querySelector(`input[name="mix-${product}"]:checked`);
  const mix = mixRadio ? mixRadio.value : 'ไม่มี';
  const pricePerUnit = parseFloat(mixRadio ? mixRadio.dataset.price : productCard.dataset.price);
  // calculate total price (promotion for น้ำดิบ)
  let totalPrice = pricePerUnit * quantity;
  if (product === 'น้ำดิบ') {
    totalPrice = Math.floor(quantity / 2) * 120 + (quantity % 2) * 65;
  }
  // read customer name
  const nameInput = productCard.querySelector('.customer-name-input');
  const customerName = nameInput ? nameInput.value.trim() : '';
  const key = `${product}-${mix}-${customerName}`;
  if (cart[key]) {
    cart[key].quantity += quantity;
    cart[key].totalPrice += totalPrice;
  } else {
    // include transfer flag defaulting to false
    cart[key] = { product, mix, quantity, pricePerUnit, totalPrice, customerName, transfer: false };
  }
  quantityInput.value = 0;
  updateCartCount();
  alert(`เพิ่ม ${quantity} ขวด ลงในตะกร้าแล้ว`);
}

export function updateCartCount() {
  let totalItems = 0;
  for (const k in cart) totalItems += cart[k].quantity;
  const counter = document.getElementById('cart-count');
  if (counter) counter.textContent = totalItems;
}

export function removeFromCart(key) {
  if (!cart[key]) return;
  delete cart[key];
  updateCartCount();
  renderCartModal(); // refresh modal and totals
}

export function renderCartModal() {
  const modalItems = document.getElementById('modal-items');
  modalItems.innerHTML = '';
  let totalCartPrice = 0;
  for (const key in cart) {
    const item = cart[key];
    totalCartPrice += item.totalPrice;
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('modal-item');
    // Determine display label: use customer name if provided, fallback to product & mix
    const displayName = item.customerName
      ? `${item.customerName} (${item.mix !== 'ไม่มี' ? item.mix : item.product})`
      : `${item.product}${item.mix !== 'ไม่มี' ? ` (${item.mix})` : ''}`;
    itemDiv.innerHTML = `
      <div class="item-details">
        <div>${displayName}</div>
        <small>${item.quantity} ขวด × ${item.pricePerUnit}฿</small>
      </div>
      <span class="item-total">${item.totalPrice.toLocaleString()}฿</span>
      <!-- เช็คบ็อกซ์เพื่อระบุว่าเป็นการโอนหรือไม่ -->
      <input type="checkbox" class="transfer-checkbox" data-key="${key}" ${item.transfer ? 'checked' : ''} aria-label="โอน">
      <!-- ปุ่มลบรายการ -->
      <button class="remove-item" data-key="${key}" aria-label="ลบรายการ">×</button>
    `;
    modalItems.appendChild(itemDiv);
  }
  document.getElementById('modal-cart-total').textContent = totalCartPrice.toLocaleString();
  const cartModal = document.getElementById('cart-modal');
  cartModal.style.display = 'flex';
  // เมื่อเปิดตะกร้า ให้ปิดการ scroll ของ body
  document.body.style.overflow = 'hidden';

  // bind delete buttons
  modalItems.querySelectorAll('.remove-item').forEach(btn => {
    btn.addEventListener('click', e => removeFromCart(e.currentTarget.dataset.key));
  });

  // bind transfer checkboxes to update transfer flag
  modalItems.querySelectorAll('.transfer-checkbox').forEach(cb => {
    cb.addEventListener('change', e => {
      const key = e.currentTarget.dataset.key;
      if (cart[key]) {
        cart[key].transfer = e.currentTarget.checked;
      }
    });
  });
}

export function clearCart() {
  cart = {};
  updateCartCount();
  const cartModal = document.getElementById('cart-modal');
  cartModal.style.display = 'none';
  // คืนการ scroll ให้กับ body เมื่อปิดตะกร้า
  document.body.style.overflow = '';
}
