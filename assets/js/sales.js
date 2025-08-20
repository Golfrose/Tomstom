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
    product: productToSave,   // ✅ ใช้ชื่อที่ลูกค้ากรอก ถ้าไม่มีใช้ product
    mix: item.mix,
    quantity: item.quantity,
    pricePerUnit: item.pricePerUnit,
    totalPrice: item.totalPrice
  });
}
  clearCart();
  alert('บันทึกการขายเรียบร้อย!');
}
/* ===== CustomerName :: SALES – APPEND-ONLY (ไม่แตะของเดิม) ===== */
(function(){
  const CND = window.CustomerNameData;

  // ช่วยตกแต่ง saleItems ก่อน save
  function decorateSaleItem(item){
    try{
      // ถ้ามีแล้วก็คืนเดิม
      if (item.displayName && (item.customerName || item.option || item.productName)) return item;

      const patched = CND.cartItemToSaleItem({
        productId   : item.productId || item.id,
        productName : item.productName || item.name,
        option      : item.option || '',
        qty         : item.qty ?? 1,
        price       : item.price ?? 0,
        customerName: item.customerName || ''
      });
      // ผสานกับฟิลด์เดิม (เช่น barcode, discount ฯลฯ)
      return Object.assign({}, item, patched);
    }catch(e){ return item; }
  }

  // เฝ้าการคลิก "ยืนยันการขาย" แล้วพยายามตกแต่งข้อมูลที่กำลังจะ save
  document.addEventListener('click', (ev)=>{
    const btn = ev.target.closest('button');
    if (!btn || !/ยืนยันการขาย/.test(btn.textContent||'')) return;

    // เผื่อโค้ดเดิมดึงจาก window.CART หรือตัวแปร global อื่น—เราจะตกแต่งทันที
    setTimeout(()=>{
      if (Array.isArray(window.CART)) {
        window.CART = window.CART.map(it=>{
          if (it?.displayName) return it;
          const product = { id: it?.productId || it?.id, name: it?.productName || it?.name };
          const patched = CND.makeCartItemBase({
            product, option: it?.option || '', qty: it?.qty ?? 1, price: it?.price ?? 0, customerName: it?.customerName || ''
          });
        return Object.assign({}, it, patched);
        });
      }
    }, 0);
  });

  // 👉 ถ้าคุณมีฟังก์ชัน save/checkout แบบชัดเจน เช่น window.saveSales(items)
  // ปรับเป็น wrapper อัตโนมัติ:
  function wrapSaveFunction(name){
    const root = window;
    const fn = root[name];
    if (typeof fn !== 'function' || fn.__wrappedByCustomerName) return;
    const wrapped = function(items, ...rest){
      try{
        if (Array.isArray(items)) {
          items = items.map(decorateSaleItem);
        } else if (items && Array.isArray(items.items)) {
          items.items = items.items.map(decorateSaleItem);
        }
      } catch {}
      return fn.call(this, items, ...rest);
    };
    Object.defineProperty(wrapped, '__wrappedByCustomerName', { value: true });
    root[name] = wrapped;
  }

  // ลองครอบชื่อที่พบบ่อย
  ['saveSales', 'confirmSale', 'checkout', 'finalizeSale'].forEach(wrapSaveFunction);
})();
