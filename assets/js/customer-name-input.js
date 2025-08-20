/* customer-name-input.js – UI injector for custom product name */
(function() {
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  function makeBox(id) {
    const wrap = document.createElement('div');
    wrap.className = 'customer-box';
    const lab = document.createElement('label');
    lab.className = 'sr-only';
    lab.textContent = 'ชื่อลูกค้า';
    lab.htmlFor = `customer-${id}`;
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.id = `customer-${id}`;
    inp.className = 'customer-input';
    inp.placeholder = 'ชื่อลูกค้า (ไม่บังคับ)';
    inp.autocomplete = 'off';
    inp.maxLength = 40;
    wrap.append(lab, inp);
    return wrap;
  }

  function injectInputs() {
    // พยายามค้นหา card ของสินค้าให้ครอบคลุม layout ต่าง ๆ
    const cards = $$('.product-card, .card, .product, [data-product]');
    cards.forEach(card => {
      if (card.__hasCustomerInput) return;
      const addBtn = [...card.querySelectorAll('button')].find(btn =>
        /เพิ่มลงตะกร้า/.test(btn.textContent || '')
      );
      const id = card.getAttribute('data-product')
        || card.getAttribute('data-product-id')
        || card.id
        || Math.random().toString(36).slice(2, 9);
      const box = makeBox(id);
      if (addBtn && addBtn.parentElement) {
        addBtn.parentElement.insertBefore(box, addBtn);  // วางช่องกรอกชื่อลูกค้าเหนือปุ่ม "เพิ่มลงตะกร้า"
      } else {
        card.appendChild(box);
      }
      card.__hasCustomerInput = true;
    });
  }

  function start() {
    injectInputs();
    new MutationObserver(injectInputs).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();