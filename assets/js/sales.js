// sales.js
// Handles saving cart items to the database when the sale is confirmed.
// The global buyer name and transfer checkbox are applied to all items
// in the cart at save time. After saving, the cart is cleared.

import { auth, database } from './firebase.js';
import { cart, clearCart } from './cart.js';

/**
 * Confirm the sale: for each item currently in the cart, create a new
 * entry in the user's sales list in the Realtime Database. Apply the
 * global buyer name and transfer flag. After saving all items,
 * clear the cart and reset the modal.
 */
export function confirmSale() {
  if (Object.keys(cart).length === 0) {
    alert('ไม่มีรายการในตะกร้า!');
    return;
  }
  const user = auth.currentUser;
  if (!user) {
    alert('กรุณาเข้าสู่ระบบก่อน');
    return;
  }
  const buyerNameInput = document.getElementById('buyer-name-input');
  const transferGlobalCheckbox = document.getElementById('global-transfer-checkbox');
  const customerName = buyerNameInput ? buyerNameInput.value.trim() : '';
  const transferFlag = transferGlobalCheckbox ? transferGlobalCheckbox.checked : false;
  const salesRef = database.ref('sales/' + user.uid);
  // Build aggregated sale record. Each cart entry becomes an item in the sale.
  const saleItems = [];
  let totalPrice = 0;
  let totalQuantity = 0;
  for (const key in cart) {
    const item = cart[key];
    saleItems.push({
      product: item.product,
      mix: item.mix,
      unit: item.unit,
      quantity: item.quantity,
      pricePerUnit: item.pricePerUnit,
      totalPrice: item.totalPrice,
    });
    totalPrice += item.totalPrice;
    totalQuantity += item.quantity;
  }
  const newSaleRef = salesRef.push();
  newSaleRef.set({
    timestamp: firebase.database.ServerValue.TIMESTAMP,
    customerName: customerName || '',
    transfer: transferFlag,
    items: saleItems,
    totalPrice: totalPrice,
    totalQuantity: totalQuantity,
  });
  clearCart();
  alert('บันทึกการขายเรียบร้อย!');
}
