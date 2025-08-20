/* ==============================================================
   Customer Name Add-on v2.4 (DOM-driven, module-safe, sessionStorage)
   - ช่อง "ชื่อลูกค้า" ใต้ราคาของสินค้า (ทุกการ์ด ทั้งน้ำ/ยา)
   - ตะกร้า: เปลี่ยนเป็น "ชื่อลูกค้า (ตัวเลือก/ชื่อยา)"
   - บันทึก: เปลี่ยนทั้ง "ตาราง/เลย์เอาต์ div" ให้เป็น "ชื่อลูกค้า (ตัวเลือก/ชื่อยา)"
   - ส่วนสรุปรายการด้านบน: แทนเป็น "ชื่อลูกค้า (ตัวเลือก/ชื่อยา) : จำนวน"
   - จำข้อมูลไว้ใน sessionStorage เพื่อให้แทนชื่อได้แม้ DOM เปลี่ยนหรือโหลดใหม่
   - ไม่แตะ Firebase/โครงสร้างข้อมูลเดิม
   ============================================================== */

(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // --- storage helpers (session, ไม่คงค้างข้ามแท็บ) ---
  const STK_NEW = 'custName:newItems';    // รายการเพิ่งเพิ่มลงตะกร้า
  const STK_SAVED = 'custName:savedItems';// รายการที่ยืนยันขายไปแล้ว ใช้แทนชื่อในหน้าบันทึก

  const store = {
    get(key){ try { return JSON.parse(sessionStorage.getItem(key) || '[]'); } catch { return []; } },
    set(key,val){ try { sessionStorage.setItem(key, JSON.stringify(val)); } catch {} },
    pushNew(entry){
      const arr = store.get(STK_NEW);
      arr.push(entry);
      store.set(STK_NEW, arr);
    },
    moveNewToSaved(count){
      const arr = store.get(STK_NEW);
      const take = arr.splice(0, count);              // เอาตัวหน้าสุดตามลำดับเพิ่มลงตะกร้า
      store.set(STK_NEW, arr);
      const saved = store.get(STK_SAVED);
      saved.push(...take);
      store.set(STK_SAVED, saved);
      return take;
    }
  };

  // ---------- UI: กล่อง input ใต้ราคา ----------
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
    box.appendChild(label); box.appendChild(input);
    return box;
  }

  function injectInputs() {
    const cards = $$('.product-card, .card, .product, [data-product-id]');
    cards.forEach((card) => {
      if (card.__hasCustomerBox) return;
      const pid = card.getAttribute('data-product-id') || card.id || rand();
      const addBtn = Array.from(card.querySelectorAll('button')).find(b => /เพิ่มลงตะกร้า/.test(b.textContent || ''));
      const box = makeCustomerBox(pid);
      if (addBtn && addBtn.parentElement) addBtn.parentElement.insertBefore(box, addBtn);
      else card.appendChild(box);
      card.__hasCustomerBox = true;
    });
  }
  function rand(){ try{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0].toString(36);}catch{ return Math.random().toString(36).slice(2,9);} }

  // ---------- ดักตอนกด "เพิ่มลงตะกร้า" ----------
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button');
    if (!btn || !/เพิ่มลงตะกร้า/.test(btn.textContent || '')) return;

    const card = btn.closest('.product-card, .card, .product, [data-product-id]');
    const name = (card && $('.customer-input', card) && $('.customer-input', card).value.trim()) || '';

    // ชื่อสินค้าเดิม (กันเคสยาไม่มีตัวเลือก)
    let rawProduct = '';
    const title = card && (card.querySelector('h3, h2, .title, .name, .product-title'));
    if (title) rawProduct = (title.textContent || '').trim();

    // ตัวเลือกที่เลือก (ถ้ามี)
    let option = '';
    try {
      const checked = card.querySelector('input[type="radio"]:checked');
      if (checked) {
        const labelEl = checked.closest('label') || checked.parentElement;
        if (labelEl && labelEl.textContent) option = labelEl.textContent.trim();
        if (!option && checked.nextElementSibling && checked.nextElementSibling.textContent)
          option = checked.nextElementSibling.textContent.trim();
      }
    } catch {}

    // บันทึกลงคิวใหม่ (จะดึงไปใช้ทั้งในตะกร้าและตอนยืนยัน)
    store.pushNew({name, option, rawProduct, ts: Date.now()});

    // อัปเดตตะกร้าให้เห็นผลทันที
    setTimeout(updateCartNames, 180);
  });

  // ---------- ฟอร์แมตชื่อ ----------
  function makeDisplay(name, optionOrRaw) {
    const right = (optionOrRaw || '').trim();
    if (!name) return null;
    return `${name} (${right || 'ไม่ระบุ'})`;
  }

  // ---------- อัปเดต "ตะกร้า" ----------
  function updateCartNames() {
    const containers = $$('.modal, .cart-modal, .cart, [data-cart], .swal2-popup, .drawer');
    if (!containers.length) return;
    const newQ = store.get(STK_NEW).slice(); // clone เพื่ออ่านอย่างเดียว

    containers.forEach((c) => {
      // หา element ที่เป็นชื่อสินค้าในรายการ (แต่ไม่ใช่ราคา/ปุ่ม)
      const nameEls =
        $$('.name', c).length ? $$('.name', c)
        : $$('.title', c).length ? $$('.title', c)
        : Array.from(c.querySelectorAll('div, span, p')).filter(el => {
            const t = (el.textContent || '').trim();
            return t && !/บาท|฿|\d+\s*[x×]/.test(t);
          });

      nameEls.forEach((el) => {
        if (el.dataset.custApplied === '1') return;
        const original = (el.textContent || '').trim();              // อาจเป็น "น้ำผสมเงิน (ผสมเงิน)" หรือ "ยาไก่"
        const m = original.match(/^(.*?)\s*\((.+)\)$/);
        const optionOrRaw = m ? m[2] : original;

        // จับคิวตามลำดับ (ตัวแรกที่ยังไม่ได้ใช้)
        const idx = newQ.findIndex(q => q && q.name);
        if (idx === -1) return;
        const q = newQ.splice(idx, 1)[0];

        const final = makeDisplay(q.name, q.option || optionOrRaw);
        if (final) {
          el.textContent = final;
          el.dataset.custApplied = '1';
        }
      });
    });
  }
  const moCart = new MutationObserver(() => updateCartNames());
  moCart.observe(document.body, { childList: true, subtree: true });

  // ---------- กด "ยืนยันการขาย" ----------
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button');
    if (!btn || !/ยืนยันการขาย/.test(btn.textContent || '')) return;

    // ประเมินจำนวนรายการในตะกร้า (ประมาณจาก modal ที่เปิดอยู่)
    let cartCount = 1;
    const containers = $$('.modal, .cart-modal, [data-cart], .swal2-popup, .drawer');
    if (containers[0]) {
      const items = containers[0].querySelectorAll('.cart-item, li, .item');
      if (items && items.length) cartCount = items.length;
    }
    // ย้ายข้อมูลจากคิว NEW ไปคิว SAVED ตามจำนวนชิ้นที่ยืนยัน
    store.moveNewToSaved(cartCount);

    // ให้เวลาหน้าบันทึกเรนเดอร์
    setTimeout(() => {
      updateSalesTableNames();
      updateSoldSummaryBlock();
    }, 450);
  });

  // ---------- บันทึก: ตาราง/เลย์เอาต์ div ----------
  function updateSalesTableNames() {
    const saved = store.get(STK_SAVED);
    if (!saved.length) return;

    // 1) table (มีหัวคอลัมน์ "สินค้า")
    const tables = $$('table');
    let touched = 0;
    tables.forEach((table) => {
      const ths = Array.from(table.querySelectorAll('thead th, tr th'));
      const col = ths.findIndex(th => /สินค้า/.test((th.textContent || '')));
      if (col === -1) return;

      const rows = Array.from(table.querySelectorAll('tbody tr'));
      rows.slice(-saved.length).forEach((tr, i) => {
        const td = tr.children[col];
        if (!td || td.dataset.custApplied === '1') return;
        const original = (td.textContent || '').trim();
        const m = original.match(/^(.*?)\s*\((.+)\)$/);
        const optionOrRaw = m ? m[2] : original;
        const q = saved[i]; // จับตามลำดับล่าสุด
        const final = makeDisplay(q.name, q.option || optionOrRaw);
        if (final) {
          td.textContent = final;
          td.dataset.custApplied = '1';
          touched++;
        }
      });
    });

    // 2) ถ้าไม่ใช่ table ให้ลอง div‑rows
    if (!touched) {
      const scope = document; // กว้างทั้งหน้า
      const rows = Array.from(scope.querySelectorAll('section, .row, .item, li, article, .card'));
      let i = 0;
      rows.forEach(el => {
        if (i >= saved.length) return;
        // หา element ที่น่าจะเป็นชื่อสินค้า
        const nameEl = Array.from(el.querySelectorAll('div,span,p')).find(k => {
          const t = (k.textContent || '').trim();
          if (!t) return false;
          if (/บาท|฿|\b\d+\b/.test(t)) return false;
          return /[ก-๙A-Za-z]/.test(t);
        });
        if (!nameEl || nameEl.dataset.custApplied === '1') return;
        const original = (nameEl.textContent || '').trim();
        const m = original.match(/^(.*?)\s*\((.+)\)$/);
        const optionOrRaw = m ? m[2] : original;
        const q = saved[i++];
        const final = makeDisplay(q.name, q.option || optionOrRaw);
        if (final) {
          nameEl.textContent = final;
          nameEl.dataset.custApplied = '1';
        }
      });
    }
  }

  // ---------- บล็อก "รายการสินค้าที่ขายได้ (สรุป)" ----------
  function updateSoldSummaryBlock() {
    const saved = store.get(STK_SAVED);
    if (!saved.length) return;

    // หาโซนหัวข้อที่มีคำว่า "รายการสินค้าที่ขายได้"
    const heads = $$('h1,h2,h3,h4').filter(h => /รายการสินค้าที่ขายได้/.test((h.textContent || '').trim()));
    heads.forEach(h => {
      const box = h.parentElement; if (!box) return;
      // ชี้ไปหา <ul>/<ol>/div ที่มีบรรทัดสรุป
      const lines = Array.from(box.querySelectorAll('li, p, div')).filter(el => {
        const t = (el.textContent || '').trim();
        return t && /ขวด/.test(t); // มีคำว่า "ขวด"
      });
      // เปลี่ยนเฉพาะบรรทัดล่าสุดตามจำนวนที่เพิ่งขาย
      saved.slice(-lines.length).forEach((q, idx) => {
        const line = lines[idx]; if (!line) return;
        // ดึง "(...)" เดิมถ้ามี เพื่อใช้เป็น option ถ้าไม่ได้เลือกไว้
        const m = (line.textContent || '').trim().match(/\((.+)\)/);
        const optionOrRaw = q.option || (m ? m[1] : (line.textContent || '').trim());
        const display = makeDisplay(q.name, optionOrRaw);
        if (display) {
          // คงจำนวนท้ายบรรทัดเดิม เช่น ": 1 ขวด"
          const tail = (line.textContent || '').split(':').slice(1).join(':') || '';
          line.textContent = display + (tail ? `: ${tail.trim()}` : '');
        }
      });
    });
  }

  // ---------- start ----------
  function start() {
    injectInputs();
    const mo = new MutationObserver(() => injectInputs());
    mo.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();