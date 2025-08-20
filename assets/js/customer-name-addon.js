/* ==============================================================
   Customer Name Add-on v2.7
   - มือถือ/เดสก์ท็อป: เปลี่ยนชื่อเฉพาะ "แถวสินค้า" ในตะกร้าเท่านั้น
   - กันไม่ให้ไปยุ่งหัวโมดัล/ปุ่มล้างตะกร้า
   - บันทึก + บล็อกสรุป: ทำงานเหมือนเดิม (ไม่แตะ Firebase)
   ============================================================== */

(function () {
  const $ = (s, c=document)=>c.querySelector(s);
  const $$ = (s, c=document)=>Array.from(c.querySelectorAll(s));

  // --- session queues (จำชื่อระหว่างเพิ่ม -> ยืนยัน) ---
  const K_NEW='custName:newItems';
  const K_SAVED='custName:savedItems';
  const store={
    get(k){ try{ return JSON.parse(sessionStorage.getItem(k)||'[]'); }catch{ return []; } },
    set(k,v){ try{ sessionStorage.setItem(k, JSON.stringify(v)); }catch{} },
    pushNew(e){ const a=this.get(K_NEW); a.push(e); this.set(K_NEW,a); },
    moveNewToSaved(n){ const a=this.get(K_NEW); const take=a.splice(0,n); this.set(K_NEW,a);
      const s=this.get(K_SAVED); s.push(...take); this.set(K_SAVED,s); return take; }
  };

  /* ------------ ใส่ช่องชื่อลูกค้าใต้ราคาในการ์ดสินค้า ------------ */
  function makeCustomerBox(id){
    const box=document.createElement('div'); box.className='customer-box';
    const lab=document.createElement('label'); lab.className='sr-only'; lab.htmlFor=`customer-${id}`; lab.textContent='ชื่อลูกค้า';
    const inp=document.createElement('input'); inp.id=`customer-${id}`; inp.className='customer-input';
    inp.type='text'; inp.placeholder='ชื่อลูกค้า (ไม่บังคับ)'; inp.autocomplete='off'; inp.inputMode='text'; inp.maxLength=40;
    box.append(lab, inp); return box;
  }
  function injectInputs(){
    const cards=$$('.product-card, .card, .product, [data-product-id]');
    cards.forEach(card=>{
      if(card.__hasCustomerBox) return;
      const id=card.getAttribute('data-product-id')||card.id||rand();
      const addBtn=[...card.querySelectorAll('button')].find(b=>/เพิ่มลงตะกร้า/.test(b.textContent||''));
      const box=makeCustomerBox(id);
      if(addBtn && addBtn.parentElement) addBtn.parentElement.insertBefore(box, addBtn);
      else card.appendChild(box);
      card.__hasCustomerBox=true;
    });
  }
  function rand(){ try{const a=new Uint32Array(1); crypto.getRandomValues(a); return a[0].toString(36);}catch{return Math.random().toString(36).slice(2,9)} }

  /* --------------- จับตอนกด "เพิ่มลงตะกร้า" ---------------- */
  document.addEventListener('click', e=>{
    const btn=e.target.closest('button'); if(!btn||!/เพิ่มลงตะกร้า/.test(btn.textContent||'')) return;
    const card=btn.closest('.product-card, .card, .product, [data-product-id]');
    const name=(card && $('.customer-input',card) && $('.customer-input',card).value.trim())||'';

    // กันกรณีหมวดยาไม่มีตัวเลือก
    let rawProduct=''; const title=card && card.querySelector('h3, h2, .title, .name, .product-title');
    if(title) rawProduct=(title.textContent||'').trim();

    // เอาตัวเลือกถ้ามี
    let option=''; try{
      const chk=card.querySelector('input[type="radio"]:checked');
      if(chk){
        const lbl=chk.closest('label')||chk.parentElement;
        if(lbl && lbl.textContent) option=lbl.textContent.trim();
        if(!option && chk.nextElementSibling && chk.nextElementSibling.textContent)
          option=chk.nextElementSibling.textContent.trim();
      }
    }catch{}

    store.pushNew({name, option, rawProduct, ts: Date.now()});
    setTimeout(updateCartNames, 120);
  });

  /* ----------------------- Helpers ----------------------- */
  const makeDisplay=(name,right)=>name?`${name} (${(right||'').trim()||'ไม่ระบุ'})`:null;

  // เลือก “แถวสินค้า” ในโมดัล:
  //  - ต้องอยู่ในคอนเทนเนอร์ตะกร้า
  //  - ต้องมี “ราคา (฿)” และ “บรรทัดจำนวนแบบ ×” อยู่ในบล็อกเดียวกัน
  //  - ต้องไม่ใช่หัว/ท้ายที่มีคำว่า สรุปรายการสั่งซื้อ / ยืนยันการขาย / ล้างตะกร้า
  function getCartItemRows(container){
    // ชั้นในที่มักเก็บรายการ
    const scope = container.querySelector('.cart-list') || container;
    const blocks=[...scope.querySelectorAll('.cart-item, li, .item, .row, .card, div')];

    return blocks.filter(b=>{
      const txt=(b.textContent||'').trim();
      if(!txt) return false;
      if(/สรุปรายการสั่งซื้อ|ยืนยันการขาย|ล้างตะกร้า/.test(txt)) return false;

      const hasPrice   = /฿/.test(txt) || /บาท/.test(txt);
      const hasQtyLine = /[x×]\s*\d+/.test(txt) || /×/.test(txt); // “1 ขวด × 100฿” ฯลฯ
      // มีปุ่มลบสีแดง? (ถ้ามีก็ดี แต่ไม่บังคับ)
      const hasRemoveBtn = !![...b.querySelectorAll('button')].find(bu=>{
        const t=(bu.textContent||'').trim();
        const aria=(bu.getAttribute('aria-label')||'')+(bu.title||'');
        return /x|×|ลบ/.test(t) || /ลบ|remove|delete/i.test(aria);
      });

      // เงื่อนไขหลัก: ต้องมีราคา และมีบรรทัดจำนวนแบบ × (กันหัว/ท้าย)
      return (hasPrice && hasQtyLine) || (hasPrice && hasRemoveBtn);
    });
  }

  // หา element ที่เป็น “ชื่อสินค้า” ในแถว
  function pickNameElement(row){
    // ตัวเลือกตาม class ที่พบได้บ่อยก่อน
    const direct = $('.item-name, .name, .title', row);
    if(direct) return direct;

    // heuristic: เอา “บล็อกข้อความที่ยาวสุด” และไม่ใช่ตัวเลข/ราคา/สัญลักษณ์ ×
    const candidates=[...row.querySelectorAll('div, span, p, b, strong')].filter(el=>{
      const t=(el.textContent||'').trim();
      if(!t) return false;
      if(/฿|บาท|[x×]|\b\d+\b/.test(t)) return false;
      return /[ก-๙A-Za-z]/.test(t);
    });
    if(!candidates.length) return null;
    candidates.sort((a,b)=> (b.textContent||'').length - (a.textContent||'').length);
    return candidates[0];
  }

  /* -------------------- อัปเดตชื่อในตะกร้า -------------------- */
  function updateCartNames(){
    const containers=$$('.modal, .cart-modal, [data-cart], .swal2-popup, .drawer');
    if(!containers.length) return;
    const queue=store.get(K_NEW).slice(); // clone ใช้อ่าน

    containers.forEach(c=>{
      const rows=getCartItemRows(c);
      rows.forEach(row=>{
        const nameEl=pickNameElement(row);
        if(!nameEl || nameEl.dataset.custApplied==='1') return;

        const original=(nameEl.textContent||'').trim();        // "น้ำผสมเงิน (ผสมเงิน)" หรือ "ยาไก่"
        const m=original.match(/^(.*?)\s*\((.+)\)$/);
        const optionOrRaw=m?m[2]:original;

        const idx=queue.findIndex(q=>q && q.name);
        if(idx===-1) return;
        const q=queue.splice(idx,1)[0];

        const final=makeDisplay(q.name, q.option || optionOrRaw);
        if(final){ nameEl.textContent=final; nameEl.dataset.custApplied='1'; }
      });
    });
  }
  new MutationObserver(()=>updateCartNames()).observe(document.body,{childList:true,subtree:true});

  /* --------------- ยืนยันการขาย → ไปแก้หน้า “บันทึก” --------------- */
  document.addEventListener('click', e=>{
    const btn=e.target.closest('button'); if(!btn||!/ยืนยันการขาย/.test(btn.textContent||'')) return;

    // นับจำนวนแถวสินค้าในตะกร้า (จาก rows ที่คัดแล้ว)
    let count=1;
    const cont=$$('.modal, .cart-modal, [data-cart], .swal2-popup, .drawer')[0];
    if(cont){ count=getCartItemRows(cont).length || 1; }
    store.moveNewToSaved(count);

    setTimeout(()=>{ patchReportTable(); patchSoldSummary(); }, 360);
  });

  /* ------------------- หน้า “บันทึก/สรุป” ------------------- */
  function patchReportTable(){
    const saved=store.get(K_SAVED); if(!saved.length) return;

    // 1) table: หาคอลัมน์ “สินค้า”
    const tables=$$('table');
    tables.forEach(table=>{
      const ths=[...table.querySelectorAll('thead th, tr th')];
      const idx=ths.findIndex(th=>/สินค้า/.test((th.textContent||'')));
      if(idx===-1) return;
      const tds=[...table.querySelectorAll(`tbody tr td:nth-child(${idx+1})`)];

      saved.forEach(q=>{
        const target = tds.find(td=>{
          if(td.dataset.custApplied==='1') return false;
          const text=(td.textContent||'').trim();
          const m=text.match(/^(.*?)\s*\((.+)\)$/);
          const opt=m?m[2]:text;
          return (q.option && opt.includes(q.option)) || (!q.option && (opt.includes(q.rawProduct)||opt===text));
        });
        if(target){
          const text=(target.textContent||'').trim();
          const m=text.match(/^(.*?)\s*\((.+)\)$/);
          const opt=q.option || (m?m[2]:text);
          const disp=makeDisplay(q.name,opt);
          if(disp){ target.textContent=disp; target.dataset.custApplied='1'; }
        }
      });
    });

    // 2) div-list fallback
    const scopes=$$('#report, .report, #sales-report, .sales-report, #summary-page, .summary-page, body');
    scopes.forEach(scope=>{
      saved.forEach(q=>{
        const row=[...scope.querySelectorAll('.row, .item, li, article, .card')].find(r=>{
          if(r.dataset.custHandled==='1') return false;
          const hasMeta=/(ราคา|รวม|จำนวน|ต่อหน่วย|บาท|฿)/.test((r.textContent||''));
          const nameEl=pickNameElement(r);
          if(!hasMeta || !nameEl) return false;
          const text=(nameEl.textContent||'').trim();
          const m=text.match(/^(.*?)\s*\((.+)\)$/); const opt=m?m[2]:text;
          return (q.option && opt.includes(q.option)) || (!q.option && (opt.includes(q.rawProduct)||opt===text));
        });
        if(row){
          const nameEl=pickNameElement(row);
          if(nameEl){
            const text=(nameEl.textContent||'').trim();
            const m=text.match(/^(.*?)\s*\((.+)\)$/);
            const opt=q.option || (m?m[2]:text);
            const disp=makeDisplay(q.name,opt);
            if(disp){ nameEl.textContent=disp; row.dataset.custHandled='1'; }
          }
        }
      });
    });
  }

  /* --------- บล็อก “รายการสินค้าที่ขายได้ (สรุป)” ข้างบน --------- */
  function patchSoldSummary(){
    const saved=store.get(K_SAVED); if(!saved.length) return;
    const heads=$$('h1,h2,h3,h4').filter(h=>/รายการสินค้าที่ขายได้/.test((h.textContent||'').trim()));
    heads.forEach(h=>{
      const box=h.parentElement; if(!box) return;
      const lines=[...box.querySelectorAll('li, p, div')].filter(el=>/ขวด/.test((el.textContent||'')));
      const slice=saved.slice(-lines.length);
      slice.forEach((q,i)=>{
        const line=lines[i]; if(!line) return;
        const text=(line.textContent||'').trim();
        const m=text.match(/\((.+)\)/); const opt=q.option || (m?m[1]:text);
        const tail=text.includes(':')?text.split(':').slice(1).join(':').trim():'';
        const disp=makeDisplay(q.name,opt);
        line.textContent=disp+(tail?`: ${tail}`:'');
      });
    });
  }

  /* ---------------------- start ---------------------- */
  function start(){
    injectInputs();
    new MutationObserver(()=>injectInputs()).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();