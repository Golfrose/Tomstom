// cart.js — modified to support customer names
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
  // NEW: read customer name
  const nameInput = productCard.querySelector('.customer-name-input');
  const customerName = nameInput ? nameInput.value.trim() : '';
  const key = `${product}-${mix}-${customerName}`;
  if (cart[key]) {
    cart[key].quantity += quantity;
    cart[key].totalPrice += totalPrice;
  } else {
    cart[key] = { product, mix, quantity, pricePerUnit, totalPrice, customerName };
  }
  // reset quantity after adding
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

/* ---------- ใหม่: ลบรายการจากตะกร้า ---------- */
export function removeFromCart(key) {
  if (!cart[key]) return;
  delete cart[key];
  updateCartCount();
  renderCartModal(); // refresh modal and totals
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
    // Determine display label: use customer name if provided, fallback to product & mix
    const displayName = item.customerName
      ? `${item.customerName} (${item.mix !== 'ไม่มี' ? item.mix : item.product})`
      : `${item.product}${item.mix !== 'ไม่มี' ? ` (${item.mix})` : ''}`;
    itemDiv.innerHTML = `
      <button class="remove-item" data-key="${key}" aria-label="ลบรายการ">×</button>
      <div class="item-details">
        <div>${displayName}</div>
        <small>${item.quantity} ขวด × ${item.pricePerUnit}฿</small>
      </div>
      <span class="item-total">${item.totalPrice.toLocaleString()}฿</span>
    `;
    modalItems.appendChild(itemDiv);
  }
  document.getElementById('modal-cart-total').textContent = totalCartPrice.toLocaleString();
  document.getElementById('cart-modal').style.display = 'flex';
  // bind delete buttons
  modalItems.querySelectorAll('.remove-item').forEach(btn => {
    btn.addEventListener('click', e => removeFromCart(e.currentTarget.dataset.key));
  });
}

export function clearCart() {
  cart = {};
  updateCartCount();
  document.getElementById('cart-modal').style.display = 'none';
}
