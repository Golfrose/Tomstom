// assets/js/customer-name-data.js
(function (w) {
  function buildDisplayName({ customerName, option, productName }) {
    const right = (option || productName || '').trim();
    if (customerName && right) return `${customerName} (${right})`;
    if (customerName) return `${customerName}`;
    return `${productName}${option ? ` (${option})` : ''}`;
  }

  function makeCartItemBase({ product, option, qty = 1, price, customerName = '' }) {
    const productName = product?.name || product?.productName || '';
    const displayName = buildDisplayName({ customerName, option, productName });
    return {
      productId   : product?.id || product?.productId || '',
      productName,
      option      : option || '',
      qty,
      price,
      customerName: customerName || '',
      displayName,
      createdAt   : Date.now()
    };
  }

  function cartItemToSaleItem(cartItem) {
    const displayName = cartItem?.displayName || buildDisplayName({
      customerName: cartItem?.customerName || '',
      option      : cartItem?.option || '',
      productName : cartItem?.productName || ''
    });
    return {
      productId   : cartItem?.productId,
      productName : cartItem?.productName,
      option      : cartItem?.option || '',
      qty         : cartItem?.qty,
      price       : cartItem?.price,
      customerName: cartItem?.customerName || '',
      displayName,
      createdAt   : Date.now()
    };
  }

  function getDisplayNameForRender(item) {
    return item?.displayName || buildDisplayName({
      customerName: item?.customerName || '',
      option      : item?.option || '',
      productName : item?.productName || ''
    });
  }

  w.CustomerNameData = {
    buildDisplayName,
    makeCartItemBase,
    cartItemToSaleItem,
    getDisplayNameForRender
  };
})(window);

/* data hub (optional, harmless) */
window.CustomerNameData = window.CustomerNameData || {
  last: '', set(n){ this.last = (n||'').trim(); }, get(){ return this.last || ''; }
};
