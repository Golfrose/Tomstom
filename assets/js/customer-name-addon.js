/* ==============================================================
   Customer Name Add-on (DOM-driven / module-safe)
   - ใส่ช่อง "ชื่อลูกค้า" ใต้ราคาของสินค้า (ทุกการ์ด ทั้งน้ำ/ยา)
   - ตอนกด "เพิ่มลงตะกร้า" เก็บชื่อลูกค้า+ตัวเลือกเข้าคิว
   - อัปเดตชื่อในตะกร้า และในตารางบันทึก เป็น "ชื่อ(ตัวเลือก)"
   - ไม่แตะ Firebase และไม่ต้อง wrap ฟังก์ชันใน ES modules
   ============================================================== */

(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // คิวสำหรับชื่อที่เพิ่มเข้าตะกร้า ตามลำดับการกด
  const custQueue = [];

  // ---------- สร้างกล่อง input ใต้ราคาทุกการ์ด ----------
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
      if (addBtn && addBtn.parentElement) {
        addBtn.parentElement.insertBefore(box, addBtn);
      } else {
        card.appendChild(box);
      }
      card.__hasCustomerBox = true;
    });
  }

  function cryptoRandom() {
    try {
      const arr = new Uint32Array(1);
      crypto.getRandomValues(arr);
      return arr[0].toString(36);
    } catch {
      return Math.random().toString(36).slice(2, 9);
    }
  }

  // ---------- จับการกด "เพิ่มลงตะกร้า" เพื่อเก็บชื่อ+ตัวเลือก ----------
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    if (!/เพิ่มลงตะกร้า/.test(btn.textContent || '')) return;

    const card = btn.closest('.product-card, .card, .product, [data-product-id]');
    const name = (card && $('.customer-input', card) && $('.customer-input', card).value.trim()) || '';

    // ดึงชื่อ "ตัวเลือก" ที่ถูกเลือก (เช่น ผสมเงิน / ยาฝาแดง)
    let option = '';
    try {
      // มี input[type=radio]:checked ใกล้ ๆ ไหม
      const checked = card.querySelector('input[type="radio"]:checked');
      if (checked) {
        // พยายามอ่าน label ข้าง ๆ
        const labelEl = checked.closest('label') || checked.parentElement;
        if (labelEl && labelEl.textContent.trim()) option = labelEl.textContent.trim();
        // ถ้า label ไม่ชัด ลองอ่าน sibling text
        if (!option) {
          const sib = checked.nextElementSibling;
          if (sib && sib.textContent.trim()) option = sib.textContent.trim();
        }
      }
      // กันกรณี UI เขียนตัวเลือกเป็น text ธรรมดาพร้อมวงกลม
      if (!option) {
        const maybe = Array.from(card.querySelectorAll('label, .option, .variant, span, p'))
          .find(el => el.matches('.selected, [aria-checked="true"]'));
        if (maybe) option = maybe.textContent.trim();
      }
    } catch {}

    // เก็บเข้าคิว (ถ้าไม่มีชื่อ ให้เก็บว่างไว้—เราจะไม่แทนชื่อในภายหลัง)
    custQueue.push({ name, option, ts: Date.now() });

    // หลังกดแล้วอาจจะเปิด modal ตะกร้า → รอสักครู่แล้วอัปเดตชื่อใน modal
    setTimeout(updateCartNames, 200);
  });

  // ---------- อัปเดตชื่อใน "ตะกร้า" ให้เป็น ชื่อลูกค้า(ตัวเลือก) ----------
  function updateCartNames() {
    // หา modal/กล่องตะกร้าที่เปิดอยู่
    const cartContainers = $$('.modal, .cart-modal, .cart, [data-cart], .swal2-popup, .drawer');
    if (!cartContainers.length) return;

    cartContainers.forEach((container) => {
      // หา element ที่เป็นชื่อรายการ (มักอยู่ซ้ายของราคา)
      const nameEls =
        $$('.name', container).length ? $$('.name', container)
        : $$('.title', container).length ? $$('.title', container)
        : Array.from(container.querySelectorAll('div, p, span')).filter(el => {
            const t = (el.textContent || '').trim();
            // ต้องมีวงเล็บตัวเลือกอยู่แล้ว เช่น "น้ำผสมเงิน (ผสมเงิน)"
            return /\(.*\)/.test(t) && !/บาท/.test(t);
          });

      nameEls.forEach((el) => {
        if (el.dataset.custApplied === '1') return; // กันแทนซ้ำ
        const original = (el.textContent || '').trim();
        const m = original.match(/^(.*?)\s*\((.+)\)$/);
        if (!m) return; // ไม่ใช่รูปแบบ "ชื่อ (ตัวเลือก)" ก็ข้าม
        const optionFromText = m[2];

        // ดูคิวล่าสุดที่มี "name" จริง
        const idx = custQueue.findIndex(q => q.name);
        if (idx === -1) return;
        const { name, option } = custQueue.splice(idx, 1)[0];

        // ใช้ option จากคิว ถ้ามี ไม่งั้นใช้ของเดิมในวงเล็บ
        const finalOption = option || optionFromText;
        el.textContent = `${name} (${finalOption})`;
        el.dataset.custApplied = '1';
      });
    });
  }

  // เฝ้าดู DOM ถ้ามีการอัปเดตตะกร้า ให้พยายามแทนชื่ออีกครั้ง
  const moCart = new MutationObserver(() => updateCartNames());
  moCart.observe(document.body, { childList: true, subtree: true });

  // ---------- ตอน "ยืนยันการขาย" → ไปแทนชื่อในตารางบันทึก ----------
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    if (!/ยืนยันการขาย/.test(btn.textContent || '')) return;

    // หลังกดยืนยัน มักจะปิด modal และเรนเดอร์ตารางบันทึก → รอแล้วค่อยแทน
    setTimeout(updateSalesTableNames, 300);
  });

  function updateSalesTableNames() {
    // หา section ตารางสรุป/บันทึก (ลองจับกว้าง ๆ ตามโครงยอดนิยม)
    const tables = $$('table');
    tables.forEach((table) => {
      // หาหัวคอลัมน์ที่มีคำว่า "สินค้า"
      const ths = Array.from(table.querySelectorAll('thead th, tr th'));
      const productColIndex = ths.findIndex(th => /สินค้า/.test((th.textContent || '')));
      if (productColIndex === -1) return;

      const rows = Array.from(table.querySelectorAll('tbody tr'));
      rows.forEach((tr) => {
        const tds = Array.from(tr.children);
        const cell = tds[productColIndex];
        if (!cell || cell.dataset.custApplied === '1') return;

        const text = (cell.textContent || '').trim();
        const m = text.match(/^(.*?)\s*\((.+)\)$/);
        if (!m) return;
        const optionFromText = m[2];

        // ใช้ชื่อจากคิวสุดท้ายที่ยังเหลืออยู่ (ถ้ายืนยันทีละชิ้นคิวจะเหลือตามจำนวน)
        const idx = custQueue.findIndex(q => q.name);
        if (idx === -1) return;
        const { name, option } = custQueue.splice(idx, 1)[0];

        const finalOption = option || optionFromText;
        cell.textContent = `${name} (${finalOption})`;
        cell.dataset.custApplied = '1';
      });
    });
  }

  // ---------- เริ่มงาน ----------
  function start() {
    injectInputs();
    const mo = new MutationObserver(() => injectInputs());
    mo.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();