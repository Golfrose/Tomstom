/* ==============================================================
   Customer Name Add-on v2.2 (DOM-driven / module-safe)
   - รองรับทั้งหมวดน้ำ/ยา + หน้า "บันทึก/สรุป" ที่ทำด้วย table หรือ div
   - ถ้าไม่มีวงเล็บในชื่อเดิม (เช่น "ยาไก่") จะเป็น "ชื่อลูกค้า (ยาไก่)"
   - ไม่แตะ Firebase/โค้ดหลัก
   ============================================================== */

(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // เก็บคิวตามลำดับการ "เพิ่มลงตะกร้า"
  const custQueue = [];

  /* ---------- ใส่ input ใต้ราคาทุกการ์ด ---------- */
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

  function injectInputs() {
    const cards = $$('.product-card, .card, .product, [data-product-id]');
    cards.forEach((card) => {
      if (card.__hasCustomerBox) return;
      const pid = card.getAttribute('data-product-id') || card.id || cryptoRandom();
      const addBtn = Array.from(card.querySelectorAll('button'))
        .find((b) => /เพิ่มลงตะกร้า/.test(b.textContent || ''));
      const box = makeCustomerBox(pid);
      if (addBtn && addBtn.parentElement) addBtn.parentElement.insertBefore(box, addBtn);
      else card.appendChild(box);
      card.__hasCustomerBox = true;
    });
  }

  function cryptoRandom() {
    try { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0].toString(36); }
    catch { return Math.random().toString(36).slice(2, 9); }
  }

  /* ---------- เวลา “เพิ่มลงตะกร้า” เก็บชื่อลูกค้า + ตัวเลือก ---------- */
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    if (!/เพิ่มลงตะกร้า/.test(btn.textContent || '')) return;

    const card = btn.closest('.product-card, .card, .product, [data-product-id]');
    const name = (card && $('.customer-input', card) && $('.customer-input', card).value.trim()) || '';

    let rawProduct = '';
    const titleGuess = card && (card.querySelector('h3, h2, .title, .name, .product-title'));
    if (titleGuess) rawProduct = titleGuess.textContent.trim();

    let option = '';
    try {
      const checked = card.querySelector('input[type="radio"]:checked');
      if (checked) {
        const labelEl = checked.closest('label') || checked.parentElement;
        if (labelEl && labelEl.textContent.trim()) option = labelEl.textContent.trim();
        if (!option && checked.nextElementSibling && checked.nextElementSibling.textContent)
          option = checked.nextElementSibling.textContent.trim();
      }
    } catch {}

    custQueue.push({ name, option, rawProduct, ts: Date.now() });
    setTimeout(updateCartNames, 200);
  });

  /* ---------- อัปเดตชื่อใน “ตะกร้า” ---------- */
  function updateCartNames() {
    const containers = $$('.modal, .cart-modal, .cart, [data-cart], .swal2-popup, .drawer');
    if (!containers.length) return;

    containers.forEach((container) => {
      const nameEls =
        $$('.name', container).length ? $$('.name', container)
        : $$('.title', container).length ? $$('.title', container)
        : Array.from(container.querySelectorAll('div, p, span')).filter(el => {
            const t = (el.textContent || '').trim();
            const priceLike = /บาท|฿|\d+\s*[x×]/.test(t);
            return t && !priceLike;
          });

      nameEls.forEach((el) => {
        if (el.dataset.custApplied === '1') return;
        const original = (el.textContent || '').trim();   // เช่น "น้ำผสมเงิน (ผสมเงิน)" หรือ "ยาไก่"

        const qIndex = custQueue.findIndex(e => e.name);  // จับคิวตัวแรกที่มีชื่อจริง
        if (qIndex === -1) return;
        const q = custQueue.splice(qIndex, 1)[0];

        const m = original.match(/^(.*?)\s*\((.+)\)$/);
        const option = q.option || (m ? m[2] : original); // ถ้าไม่เจอวงเล็บ → ใช้ original เป็น option
        el.textContent = `${q.name} (${option})`;
        el.dataset.custApplied = '1';
      });
    });
  }

  const moCart = new MutationObserver(() => updateCartNames());
  moCart.observe(document.body, { childList: true, subtree: true });

  /* ---------- กด “ยืนยันการขาย” แล้วไปแทนชื่อในหน้า “บันทึก/สรุป” ---------- */
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    if (!/ยืนยันการขาย/.test(btn.textContent || '')) return;
    // ให้เวลาหน้าบันทึกเรนเดอร์ก่อน
    setTimeout(updateSalesPageNames, 400);
  });

  // หา “โซนสรุป/บันทึก” ให้ครอบทั้ง table และ div‑list
  function getReportScopes() {
    const scopes = [];
    // ลองจับด้วย id/class ที่พบบ่อย
    scopes.push(...$$('#summary-page, .summary-page, #sales-report, .sales-report, #report, .report'));
    // เผื่อหน้าไม่มี class เฉพาะ ให้หา section ที่หัวเรื่องมีคำว่า "สรุปยอดขาย" หรือ "รายการสินค้าที่ขายได้"
    const headings = $$('h1,h2,h3,h4').filter(h =>
      /สรุปยอดขาย|รายการสินค้าที่ขายได้/.test((h.textContent || '').trim())
    );
    headings.forEach(h => scopes.push(h.closest('section') || h.parentElement));
    // อย่างน้อยส่ง body กลับไป (สุดท้าย)
    if (!scopes.length) scopes.push(document.body);
    return Array.from(new Set(scopes.filter(Boolean)));
  }

  function updateSalesPageNames() {
    const scopes = getReportScopes();
    scopes.forEach(scope => {
      // เคสจริงอาจเป็น table หรือ div-row
      const productCells = [];

      // 1) table: หาคอลัมน์ "สินค้า"
      const tables = $$('table', scope);
      tables.forEach((table) => {
        const ths = Array.from(table.querySelectorAll('thead th, tr th'));
        const col = ths.findIndex(th => /สินค้า/.test((th.textContent || '')));
        if (col !== -1) {
          const rows = Array.from(table.querySelectorAll('tbody tr'));
          rows.forEach(tr => {
            const td = tr.children[col];
            if (td) productCells.push(td);
          });
        }
      });

      // 2) div‑list: หาแถวที่ดูเป็นรายการขาย (มีราคา/จำนวน/รวมข้าง ๆ)
      if (!productCells.length) {
        const rows = Array.from(scope.querySelectorAll('div, li, article')).filter(el => {
          const t = (el.textContent || '').trim();
          // ต้องมีตัวเลข/ราคาอยู่ใกล้ ๆ (แบบหน้าในรูป)
          return /\b\d+\b/.test(t) && /บาท|฿/.test(t) || /ราคา|รวม|จำนวน|ต่อหน่วย/.test(t);
        });
        // ในแต่ละ row เลือก element ที่น่าจะเป็น "ชื่อสินค้า"
        rows.forEach(row => {
          // เลือกบล็อกที่มีข้อความหลายบรรทัด (ชื่อ + วงเล็บ)
          const candidates = Array.from(row.querySelectorAll('div, p, span')).filter(el => {
            const t = (el.textContent || '').trim();
            if (!t) return false;
            // ตัดตัวเลข/ราคา/ปุ่ม
            if (/บาท|฿|\b\d+\b/.test(t)) return false;
            // มักอยู่คอลัมน์ชื่อ ซึ่งเป็นข้อความไทยยาว ๆ
            return /[ก-๙A-Za-z]/.test(t);
          });
          // เลือกตัวแรกพอ
          if (candidates[0]) productCells.push(candidates[0]);
        });
      }

      // แทนชื่อใน cell ที่หาได้ ตามคิว
      productCells.forEach(cell => {
        if (cell.dataset.custApplied === '1') return;

        const original = (cell.textContent || '').trim(); // "น้ำผสมเงิน (ผสมเงิน)" หรือ "ยาไก่"
        const qIndex = custQueue.findIndex(e => e.name);
        if (qIndex === -1) return;
        const q = custQueue.splice(qIndex, 1)[0];

        const m = original.match(/^(.*?)\s*\((.+)\)$/);
        const option = q.option || (m ? m[2] : original);
        cell.textContent = `${q.name} (${option})`;
        cell.dataset.custApplied = '1';
      });
    });
  }

  /* ---------- start ---------- */
  function start() {
    injectInputs();
    const mo = new MutationObserver(() => injectInputs());
    mo.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();