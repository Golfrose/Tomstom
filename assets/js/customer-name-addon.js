/* ==============================================================
   Customer Name Add-on
   - แทรกช่อง "ชื่อลูกค้า" ใต้ราคาของสินค้า (ทุกการ์ด ทั้งน้ำ/ยา)
   - แนบชื่อลูกค้าเข้า item ตอน "เพิ่มลงตะกร้า"
   - แสดงผลชื่อเป็น "ชื่อลูกค้า(ตัวเลือก)" ในตะกร้าและบันทึก
   - ไม่แก้โครงสร้าง/ชื่อฟิลด์ Firebase เดิม
   ============================================================== */

(function () {
  // ---------- helpers ----------
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // กล่อง input "ชื่อลูกค้า"
  function makeCustomerBox(productId) {
    const box = document.createElement('div');
    box.className = 'customer-box';

    const label = document.createElement('label');
    label.className = 'sr-only';
    label.setAttribute('for', `customer-${productId}`);
    label.textContent = 'ชื่อลูกค้า';

    const input = document.createElement('input');
    input.id = `customer-${productId}`;
    input.className = 'customer-input';
    input.type = 'text';
    input.placeholder = 'ชื่อลูกค้า (ไม่บังคับ)';
    input.autocomplete = 'off';
    input.inputMode = 'text';
    input.maxLength = 40;

    box.appendChild(label);
    box.appendChild(input);
    return box;
  }

  // รวมชื่อที่จะแสดง
  function formatItemDisplayName(item) {
    const prodName = item.productName || item.name || item.title || '';
    const option =
      item.optionName ||
      item.variantName ||
      item.selectedOption ||
      item.option ||
      '';
    const left = (item.customerName && String(item.customerName).trim()) || prodName;
    return option ? `${left} (${option})` : left;
  }

  // ---------- 1) แทรก input ใต้ราคาทุกการ์ด ----------
  function injectInputs() {
    // การ์ดสินค้าที่มีปุ่ม "เพิ่มลงตะกร้า" (เลือกกว้างๆให้ครอบทุกเคส)
    const cards = $$('.product-card, .card, .product, [data-product-id]');
    cards.forEach((card) => {
      if (card.__hasCustomerBox) return;

      const pid =
        card.getAttribute('data-product-id') ||
        card.id ||
        Math.random().toString(36).slice(2, 9);

      // จุดวาง: ก่อนปุ่ม "เพิ่มลงตะกร้า" ถ้าไม่เจอให้วางด้านบนสุดของการ์ด
      const addBtn = Array.from(card.querySelectorAll('button'))
        .find((b) => /เพิ่มลงตะกร้า/.test(b.textContent || ''));

      const box = makeCustomerBox(pid);
      if (addBtn && addBtn.parentElement) {
        addBtn.parentElement.insertBefore(box, addBtn);
      } else {
        card.insertBefore(box, card.firstChild);
      }

      card.__hasCustomerBox = true;
    });
  }

  const ready = () => {
    injectInputs();
    // ถ้ามีการโหลดการ์ดเพิ่มภายหลัง (SPA) ให้เฝ้าดูและแทรกให้เอง
    const mo = new MutationObserver(() => injectInputs());
    mo.observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
  } else {
    ready();
  }

  // ---------- 2) แนบชื่อลูกค้าเข้า item ตอนเพิ่มลงตะกร้า ----------
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    if (!/เพิ่มลงตะกร้า/.test(btn.textContent || '')) return;
    const card = btn.closest('.product-card, .card, .product, [data-product-id]');
    document.__lastClickedAddCard = card || null;
  });

  const wrapAdd = () => {
    const g = window;
    const orig = g.addItemToCart || g.addToCart || g.pushToCart;
    if (!orig || orig.__wrappedCustomer) return;

    const wrapped = function (item) {
      try {
        const card = document.__lastClickedAddCard;
        const name =
          (card && $('.customer-input', card) && $('.customer-input', card).value.trim()) ||
          '';
        if (name) item.customerName = name;
        item.__displayName = formatItemDisplayName(item);
      } catch (e) {}
      return orig.apply(this, arguments);
    };
    wrapped.__wrappedCustomer = true;
    if (g.addItemToCart) g.addItemToCart = wrapped;
    else if (g.addToCart) g.addToCart = wrapped;
    else if (g.pushToCart) g.pushToCart = wrapped;
  };

  // ---------- 3) ปรับชื่อที่แสดงในตะกร้าให้เป็นแบบใหม่ ----------
  const wrapRenderCart = () => {
    const g = window;
    const orig = g.renderCart || g.showCart || g.updateCartView;
    if (!orig || orig.__wrappedCustomer) return;

    const wrapped = function () {
      const res = orig.apply(this, arguments);

      // หลังวาดตะกร้า: พยายามแทนชื่อเป็น "ชื่อลูกค้า(ตัวเลือก)"
      const rows =
        $$('.cart-item').length ? $$('.cart-item')
        : $$('.cart-list li').length ? $$('.cart-list li')
        : $$('.cart .item');

      rows.forEach((row) => {
        let nameEl =
          $('.name', row) ||
          $('.title', row) ||
          row.querySelector('div,span,p');
        if (!nameEl) return;

        // ถ้าฝัง item เป็น data-* ให้ใช้
        let item = null;
        try {
          if (row.dataset.item) item = JSON.parse(row.dataset.item);
        } catch (e) {}
        // fallback: ใช้ชื่อที่เคยฟอร์แมตไว้
        if (item && (item.customerName || item.optionName || item.productName)) {
          nameEl.textContent = formatItemDisplayName(item);
        } else if (row.__displayName) {
          nameEl.textContent = row.__displayName;
        }
      });

      return res;
    };
    wrapped.__wrappedCustomer = true;
    if (g.renderCart) g.renderCart = wrapped;
    else if (g.showCart) g.showCart = wrapped;
    else if (g.updateCartView) g.updateCartView = wrapped;
  };

  // ---------- 4) ก่อนบันทึก/ยืนยันขาย ให้ตั้งชื่อแสดงผลในรายการ ----------
  const wrapSave = () => {
    const g = window;
    const orig = g.saveSale || g.confirmSale || g.checkout || g.finishOrder;
    if (!orig || orig.__wrappedCustomer) return;

    const wrapped = function (cartItems /* ...args */) {
      try {
        if (Array.isArray(cartItems)) {
          cartItems.forEach((item) => {
            item.displayName = formatItemDisplayName(item);
          });
        } else if (g.cart && Array.isArray(g.cart.items)) {
          g.cart.items.forEach((item) => {
            item.displayName = formatItemDisplayName(item);
          });
        }
      } catch (e) {}
      return orig.apply(this, arguments);
    };
    wrapped.__wrappedCustomer = true;

    if (g.saveSale) g.saveSale = wrapped;
    else if (g.confirmSale) g.confirmSale = wrapped;
    else if (g.checkout) g.checkout = wrapped;
    else if (g.finishOrder) g.finishOrder = wrapped;
  };

  // ---------- 5) รอจนฟังก์ชันหลักพร้อม แล้วค่อย wrap ----------
  const hookTimer = setInterval(() => {
    try {
      wrapAdd();
      wrapRenderCart();
      wrapSave();
    } catch (e) {}
  }, 200);
  setTimeout(() => clearInterval(hookTimer), 8000);
})();