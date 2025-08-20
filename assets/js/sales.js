// sales.js
import { auth, database } from './firebase.js';
import { cart, clearCart } from './cart.js';

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
  const salesRef = database.ref('sales/' + user.uid);
  for (const key in cart) {
    const item = cart[key];
    // ถ้ามี customerName ให้ใช้แทน product
    const productToSave = (item.customerName && item.customerName.trim())
      ? item.customerName.trim()
      : item.product;
    const newSaleRef = salesRef.push();
    newSaleRef.set({
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      product: productToSave,   // ✅ ใช้ชื่อที่ลูกค้ากรอก ถ้าไม่มีก็ใช้ชื่อสินค้าเดิม
      mix: item.mix,
      quantity: item.quantity,
      pricePerUnit: item.pricePerUnit,
      totalPrice: item.totalPrice
    });
  }
  clearCart();
  alert('บันทึกการขายเรียบร้อย!');
}