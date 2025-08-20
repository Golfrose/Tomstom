// sales.js — ฉบับสมบูรณ์ (ก๊อปวางทับได้เลย)
import { auth, database } from './firebase.js';
import { cart, clearCart } from './cart.js';

function hasName(item){
  return !!(item && item.customerName && item.customerName.trim());
}

export function confirmSale() {
  try {
    // 1) ตรวจตะกร้า & การล็อกอิน
    if (Object.keys(cart).length === 0) {
      alert('ไม่มีรายการในตะกร้า!');
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      alert('กรุณาเข้าสู่ระบบก่อน!');
      return;
    }

    // 2) (เลือกได้) บังคับให้กรอกชื่อลูกค้าทุกชิ้นก่อนขาย
    //    ถ้าไม่อยากบังคับ: ลบบล็อก for ตรวจสอบนี้ออกได้
    for (const key in cart) {
      const it = cart[key];
      if (!hasName(it)) {
        alert('กรุณากรอกชื่อลูกค้าก่อนยืนยันการขาย');
        return;
      }
    }

    // 3) อ้าง path ใน Realtime Database
    const salesRef = database.ref('sales/' + user.uid);

    // 4) บันทึกรายการขาย: product = ชื่อลูกค้า (ถ้ามี), mix คงเดิม
    for (const key in cart) {
      const item = cart[key];

      const productToSave = hasName(item) ? item.customerName.trim() : item.product;

      const newSaleRef = salesRef.push();
      newSaleRef.set({
        // ใช้ Date.now() ให้ชัวร์กับ module (ถ้าใช้ firebase v8 global จะเปลี่ยนเป็น ServerValue.TIMESTAMP ก็ได้)
        timestamp   : Date.now(),
        product     : productToSave,          // << สำคัญ: ให้รายงานโชว์เป็น "ชื่อลูกค้า"
        mix         : item.mix,               //      แล้วค่อยเอา mix ไปต่อวงเล็บในหน้ารายงาน
        quantity    : item.quantity,
        pricePerUnit: item.pricePerUnit,
        totalPrice  : item.totalPrice
      });
    }

    // 5) เคลียร์ตะกร้า & แจ้งผล
    clearCart();
    alert('บันทึกการขายเรียบร้อยแล้ว');
  } catch (err) {
    console.error(err);
    alert('เกิดข้อผิดพลาดในการบันทึกการขาย');
  }
}
