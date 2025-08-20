/* SALES HOTFIX – ensure saved productName/name is displayName */
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

  ['saveSales','confirmSale','checkout','finalizeSale'].forEach(fnName=>{
    const fn = window[fnName];
    if (typeof fn !== 'function' || fn.__dnWrapped) return;
    const wrapped = function(payload, ...rest){
      try{
        if (Array.isArray(payload)) {
          payload = payload.map(ensureDisplayName);
        } else if (payload && Array.isArray(payload.items)) {
          payload.items = payload.items.map(ensureDisplayName);
        } else if (payload && typeof payload==='object') {
          ensureDisplayName(payload);
        }
      }catch{}
      return fn.call(this, payload, ...rest);
    };
    Object.defineProperty(wrapped,'__dnWrapped',{value:true});
    window[fnName]=wrapped;
  });

  document.addEventListener('click',(e)=>{
    const b=e.target.closest('button');
    if(!b || !/ยืนยันการขาย/.test((b.textContent||'').trim())) return;
    if(Array.isArray(window.CART)){
      window.CART = window.CART.map(ensureDisplayName);
    }
  });
})();
