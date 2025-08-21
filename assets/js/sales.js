// sales.js — ensure transfer flag is saved
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
    const newSaleRef = salesRef.push();
    newSaleRef.set({
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      product: item.product,
      mix: item.mix,
      quantity: item.quantity,
      pricePerUnit: item.pricePerUnit,
      totalPrice: item.totalPrice,
      customerName: item.customerName || '',
      // บันทึกสถานะ transfer เป็น boolean
      transfer: !!item.transfer,
    });
  }
  clearCart();
  alert('บันทึกการขายเรียบร้อย!');
}
