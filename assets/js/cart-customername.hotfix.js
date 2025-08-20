/* CART HOTFIX – force displayName -> productName/name */
(function(){
  function ensureDisplayName(it){
    if(!it) return it;
    const dn = (it.displayName || (function(){
      const cn = (it.customerName||'').trim();
      const right = (it.option || it.mix || it.productName || it.name || it.product || '').trim();
      const rightShow = right && right !== 'ไม่มี' ? right : '';
      if (cn && rightShow) return `${cn} (${rightShow})`;
      if (cn) return cn;
      const base = it.productName || it.name || it.product || '';
      return `${base}${rightShow?` (${rightShow})`:''}`;
    })() || '').trim();

    if(!dn) return it;

    if (it.productName && it.productName !== dn && !it._productNameOriginal) it._productNameOriginal = it.productName;
    if (it.name && it.name !== dn && !it._nameOriginal) it._nameOriginal = it.name;

    it.displayName = dn;
    it.productName = dn;
    it.name        = dn;
    return it;
  }

  function applyToCart(){
    if (!Array.isArray(window.CART)) return;
    window.CART.forEach(ensureDisplayName);
  }

  (function wrap(){
    const C = window.CART;
    if (!Array.isArray(C) || C.__dnWrapped) return;
    const _push = C.push.bind(C);
    C.push = function(...items){
      const patched = items.map(ensureDisplayName);
      return _push(...patched);
    };
    Object.defineProperty(C, '__dnWrapped', { value:true });
  })();

  document.addEventListener('click',(e)=>{
    const t=e.target.closest('button,a');
    if(!t) return;
    const s=(t.textContent||'').trim();
    if(/เพิ่มลงตะกร้า|ตะกร้า|สรุปรายการสั่งซื้อ|ยืนยันการขาย/.test(s)){ applyToCart(); }
  });

  setTimeout(applyToCart,0);
})();
