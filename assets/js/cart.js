// cart.js
// Cart management for the updated sale page. The cart is represented
// as an object keyed by a combination of product and mix. Each entry
// stores quantity, price per unit and total price. This module
// provides functions to change quantities in the UI, add items to the
// cart when a checkbox is ticked, remove items, render the cart modal
// and clear the cart.

export let cart = {};

/**
 * Adjust the quantity in the quantity input associated with a plus or minus
 * button. The button element should live inside a `.quantity-control`
 * container. A positive change increases the value, a negative change
 * decreases it but not below zero.
 * @param {HTMLElement} btnEl The +/- button clicked
 * @param {number} change The increment (+1 or -1)
 */
export function changeQuantity(btnEl, change) {
  const input = btnEl.closest('.quantity-control').querySelector('.quantity-input');
  let quantity = parseInt(input.value || '0', 10) + change;
  if (isNaN(quantity) || quantity < 0) quantity = 0;
  input.value = quantity;
  updateCartCount();
}

/**
 * Add the selected quantity of a product row to the cart. This function
 * reads data attributes from the provided row element to determine the
 * product name, base price and any selected mix option. It then
 * calculates the total price (including special promotions such as the
 * น้ำดิบ 2-for-120 deal) and updates the cart. After adding, the
 * quantity input is reset to zero.
 * @param {HTMLElement} row The `.product-row` element representing a product
 */
export function addToCart(row) {
  // Read product, mix and price from data attributes. Each row
  // represents one specific product/mix combination so there are no
  // radio buttons in the new design. We still honour the promotion
  // for น้ำดิบ.
  const product = row.dataset.product;
  const mix = row.dataset.mix || 'ไม่มี';
  const pricePerUnit = parseFloat(row.dataset.price);
  const quantityInput = row.querySelector('.quantity-input');
  const quantity = parseInt(quantityInput.value || '0', 10);
  if (!quantity || quantity <= 0) {
    alert('กรุณาใส่จำนวนสินค้าก่อน');
    return;
  }
  // Compute total price. Special promotion for 'น้ำดิบ': 2 bottles for
  // 120 บาท instead of 65 × 2. If the quantity has pairs of two,
  // charge 120 for each pair and the regular price for any leftover.
  let totalPrice = pricePerUnit * quantity;
  if (product === 'น้ำดิบ') {
    const pairs = Math.floor(quantity / 2);
    const remainder = quantity % 2;
    // Promotion: 2 bottles for 120 baht instead of 65 × 2.
    totalPrice = pairs * 120 + remainder * 65;
  }
  // Use a key combining product and mix so identical items merge
  const key = `${product}-${mix}`;
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
    };
  }
  // Reset quantity input
  quantityInput.value = 0;
  updateCartCount();
}

/**
 * Update the cart count displayed on the floating cart icon. This sums
 * the quantities of all entries in the cart.
 */
export function updateCartCount() {
  let totalItems = 0;
  for (const key in cart) {
    totalItems += cart[key].quantity;
  }
  const counter = document.getElementById('cart-count');
  if (counter) counter.textContent = totalItems;
}

/**
 * Remove an item from the cart by its key. After deleting the entry,
 * the cart modal is re-rendered and the cart count updated.
 * @param {string} key
 */
export function removeFromCart(key) {
  if (!cart[key]) return;
  delete cart[key];
  updateCartCount();
  renderCartModal();
}

/**
 * Render the contents of the cart inside the modal. Each entry is
 * displayed with its name (customer name is applied at sale time),
 * quantity, unit price and total. A remove button allows deleting
 * individual entries. The modal will disable scrolling of the
 * underlying page and enable pointer events only within itself.
 */
export function renderCartModal() {
  const modalItems = document.getElementById('modal-items');
  modalItems.innerHTML = '';
  let totalCartPrice = 0;
  for (const key in cart) {
    const item = cart[key];
    totalCartPrice += item.totalPrice;
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('modal-item');
    // Compose a display name. If mix is 'ไม่มี' then just show product.
    const displayName = item.mix && item.mix !== 'ไม่มี' ? `${item.product} (${item.mix})` : item.product;
    // Each row shows name, quantity × price and total along with a
    // remove button. Per-item transfer checkboxes have been removed;
    // the global transfer option in the modal footer now controls the
    // payment type for all items.
    itemDiv.innerHTML = `
      <span class="modal-item-name">${displayName}</span>
      <span class="modal-item-qty">${item.quantity} × ${item.pricePerUnit.toLocaleString()}฿</span>
      <span class="modal-item-total">${item.totalPrice.toLocaleString()}฿</span>
      <button class="remove-item" data-key="${key}"><i class="fas fa-times"></i></button>
    `;
    modalItems.appendChild(itemDiv);
  }
  // Update total price
  const totalEl = document.getElementById('modal-cart-total');
  if (totalEl) totalEl.textContent = totalCartPrice.toLocaleString();
  // Show modal and disable background interactions
  const cartModal = document.getElementById('cart-modal');
  if (cartModal) cartModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  document.body.style.pointerEvents = 'none';
  cartModal.style.pointerEvents = 'auto';
  // Attach remove handlers
  modalItems.querySelectorAll('.remove-item').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const key = e.currentTarget.dataset.key;
      removeFromCart(key);
    });
  });
}

/**
 * Clear the entire cart and hide the modal. Also resets the buyer name
 * and transfer checkbox. This should be called after a successful
 * sale or when the user chooses to clear their cart.
 */
export function clearCart() {
  cart = {};
  updateCartCount();
  const cartModal = document.getElementById('cart-modal');
  if (cartModal) cartModal.style.display = 'none';
  document.body.style.overflow = '';
  document.body.style.pointerEvents = '';
  // Reset buyer info and transfer checkbox
  const buyerInput = document.getElementById('buyer-name-input');
  const transferGlobal = document.getElementById('global-transfer-checkbox');
  if (buyerInput) buyerInput.value = '';
  if (transferGlobal) transferGlobal.checked = false;
}
