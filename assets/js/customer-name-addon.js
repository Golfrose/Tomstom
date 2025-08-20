/* ==============================================================
   Customer Name Add-on v2.5 (DOM-driven, module-safe, sessionStorage)
   - ตะกร้า: เปลี่ยนเฉพาะชื่อใน "แถวสินค้า" ไม่แตะหัวเรื่อง/ปุ่ม
   - บันทึก: หา cell ด้วยการ "แมตช์ข้อความ" (ตัวเลือกในวงเล็บ หรือชื่อดิบ)
   - สรุปด้านบน: แทนบรรทัดล่าสุดให้เป็น "ชื่อลูกค้า (ตัวเลือก/ชื่อยา) : จำนวน"
   - ไม่แตะ Firebase/โครงสร้างข้อมูลเดิม
   ============================================================== */

(function () {
  const $ = (s, c=document)=>c.querySelector(s);
  const $$ = (s, c=document)=>Array.from(c.querySelectorAll(s));

  // ---- session storage queues ----
  const K_NEW   = 'custName:newItems';
  const K_SAVED = 'custName:savedItems';
  const store = {
    get(k){ try{return JSON.parse(sessionStorage.getItem(k)||'[]')}catch{return[]} },
    set(k,v){ try{sessionStorage.setItem(k,JSON.stringify(v))}catch{} },
    pushNew(e){ const a=this.get(K_NEW); a.push(e); this.set(K_NEW,a); },
    moveNewToSaved(n){
      const a=this.get(K_NEW); const take=a.splice(0, n);
      this.set(K_NEW,a);
      const s=this.get(K_SAVED); s.push(...take); this.set(K_SAVED,s);
      return take;
    }
  };

  // ---- UI: insert input under price on each product card ----
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

  // ---- when "เพิ่มลงตะกร้า": capture customer name + option/raw ----
  document.addEventListener('click', e=>{
    const btn=e.target.closest('button');
    if(!btn || !/เพิ่มลงตะกร้า/.test(btn.textContent||'')) return;

    const card=btn.closest('.product-card, .card, .product, [data-product-id]');
    const name=(card && $('.customer-input',card) && $('.customer-input',card).value.trim())||'';

    let rawProduct='';
    const titleGuess=card && card.querySelector('h3, h2, .title, .name, .product-title');
    if(titleGuess) rawProduct=(titleGuess.textContent||'').trim();

    let option='';
    try{
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

  // ---- helpers ----
  const makeDisplay=(name,right)=>name?`${name} (${(right||'').trim()||'ไม่ระบุ'})`:null;
  const isHeading=(el)=>/^H[1-4]$/.test(el.tagName)||el.classList.contains('modal-title')||el.classList.contains('header')||el.getAttribute('role')==='heading';

  // ---- update names inside CART modal (rows only) ----
  function updateCartNames(){
    const containers=$$('.modal, .cart-modal, [data-cart], .swal2-popup, .drawer');
    if(!containers.length) return;
    const queue=store.get(K_NEW).slice(); // read-only copy

    containers.forEach(c=>{
      // หา "แถวสินค้า" ชัด ๆ ก่อน
      const rows = $$('.cart-item', c);
      let nameNodes = [];
      if(rows.length){
        rows.forEach(r=>{
          let nm = $('.item-name, .name, .title', r) ||
                   [...r.querySelectorAll('div,span,p')].find(x=>{
                      const t=(x.textContent||'').trim();
                      if(!t||isHeading(x)) return false;
                      return !/บาท|฿|\d+\s*[x×]/.test(t);
                    });
          if(nm) nameNodes.push(nm);
        });
      }else{
        // fallback: รายการเป็น <li> หรือ div ธรรมดา
        const lis=[...c.querySelectorAll('.cart-list > li, ul li')];
        if(lis.length){
          lis.forEach(li=>{
            const nm=$('.item-name, .name, .title', li) ||
                     [...li.querySelectorAll('div,span,p')].find(x=>{
                        const t=(x.textContent||'').trim();
                        if(!t||isHeading(x)) return false;
                        return !/บาท|฿|\d+\s*[x×]/.test(t);
                      });
            if(nm) nameNodes.push(nm);
          });
        }
      }

      nameNodes.forEach(el=>{
        if(el.dataset.custApplied==='1') return;
        const original=(el.textContent||'').trim();           // e.g. "น้ำผสมเงิน (ผสมเงิน)" or "ยาไก่"
        const m=original.match(/^(.*?)\s*\((.+)\)$/);
        const optionOrRaw = m ? m[2] : original;

        const idx=queue.findIndex(q=>q && q.name);
        if(idx===-1) return;
        const q=queue.splice(idx,1)[0];

        const final=makeDisplay(q.name, q.option || optionOrRaw);
        if(final){ el.textContent=final; el.dataset.custApplied='1'; }
      });
    });
  }
  const moCart=new MutationObserver(()=>updateCartNames());
  moCart.observe(document.body,{childList:true,subtree:true});

  // ---- when "ยืนยันการขาย": move queue -> saved, then patch report ----
  document.addEventListener('click', e=>{
    const btn=e.target.closest('button');
    if(!btn || !/ยืนยันการขาย/.test(btn.textContent||'')) return;

    // ประมาณจำนวนรายการในตะกร้าที่กำลังยืนยัน
    let count=1;
    const cont=$$('.modal, .cart-modal, [data-cart], .swal2-popup, .drawer')[0];
    if(cont){
      const items = $$('.cart-item', cont).length ? $$('.cart-item', cont) : $$('.cart-list > li', cont);
      if(items && items.length) count=items.length;
    }
    store.moveNewToSaved(count);

    setTimeout(()=>{
      updateSalesTableNames();
      updateSoldSummaryBlock();
    }, 350);
  });

  // ---- REPORT: table/div rows ----
  function updateSalesTableNames(){
    const saved=store.get(K_SAVED);
    if(!saved.length) return;

    // 1) table-based
    const tables=$$('table');
    tables.forEach(table=>{
      const ths=[...table.querySelectorAll('thead th, tr th')];
      const idx=ths.findIndex(th=>/สินค้า/.test((th.textContent||'')));
      if(idx===-1) return;

      const tds=[...table.querySelectorAll(`tbody tr td:nth-child(${idx+1})`)];
      saved.forEach(q=>{
        // หา cell ตัวแรกที่ยังไม่ได้แทน และ "ข้อความเดิม" ตรงกับ option/raw
        const target = tds.find(td=>{
          if(td.dataset.custApplied==='1') return false;
          const text=(td.textContent||'').trim();
          const m=text.match(/^(.*?)\s*\((.+)\)$/);
          const opt = m ? m[2] : text;        // ถ้าไม่มีวงเล็บ → ใช้ชื่อเดิมทั้งก้อนไป
          return (q.option && opt.includes(q.option)) || (!q.option && (opt.includes(q.rawProduct)||opt===text));
        });
        if(target){
          const text=(target.textContent||'').trim();
          const m=text.match(/^(.*?)\s*\((.+)\)$/);
          const opt = q.option || (m ? m[2] : text);
          const disp=makeDisplay(q.name, opt);
          if(disp){ target.textContent=disp; target.dataset.custApplied='1'; }
        }
      });
    });

    // 2) div-list fallback
    const blocks=$$('#report, .report, #sales-report, .sales-report, #summary-page, .summary-page, body');
    blocks.forEach(scope=>{
      saved.forEach(q=>{
        // หา “บล็อกแถวสินค้า” ที่ยังไม่ได้แทนชื่อและมีคำว่า ราคา/รวม/จำนวน อยู่ใกล้ ๆ
        const row=[...scope.querySelectorAll('.row, .item, li, article, .card')].find(r=>{
          if(r.dataset.custHandled==='1') return false;
          const hasMeta=/(ราคา|รวม|จำนวน|ต่อหน่วย|บาท|฿)/.test((r.textContent||''));
          const nameEl = [...r.querySelectorAll('div,span,p')].find(x=>{
            const t=(x.textContent||'').trim();
            if(!t || /บาท|฿|\b\d+\b/.test(t)) return false;
            return /[ก-๙A-Za-z]/.test(t);
          });
          if(!hasMeta || !nameEl) return false;
          const text=(nameEl.textContent||'').trim();
          const m=text.match(/^(.*?)\s*\((.+)\)$/);
          const opt=m?m[2]:text;
          return (q.option && opt.includes(q.option)) || (!q.option && (opt.includes(q.rawProduct)||opt===text));
        });
        if(row){
          const nameEl = $('.item-name, .name, .title', row) ||
                         [...row.querySelectorAll('div,span,p')].find(x=>{
                           const t=(x.textContent||'').trim(); return t && !/บาท|฿|\b\d+\b/.test(t);
                         });
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

  // ---- Top "รายการสินค้าที่ขายได้ (สรุป)" ----
  function updateSoldSummaryBlock(){
    const saved=store.get(K_SAVED);
    if(!saved.length) return;
    const heads=$$('h1,h2,h3,h4').filter(h=>/รายการสินค้าที่ขายได้/.test((h.textContent||'').trim()));
    heads.forEach(h=>{
      const box=h.parentElement; if(!box) return;
      const lines=[...box.querySelectorAll('li, p, div')].filter(el=>/ขวด/.test((el.textContent||'')));
      // เปลี่ยนเฉพาะรายการล่าสุดตามที่เพิ่งยืนยัน
      const slice = saved.slice(-lines.length);
      slice.forEach((q, i)=>{
        const line=lines[i]; if(!line) return;
        const text=(line.textContent||'').trim();
        const m=text.match(/\((.+)\)/);
        const opt=q.option || (m?m[1]:text);
        // เก็บปลายบรรทัด (": 1 ขวด" เป็นต้น)
        const tail = text.includes(':') ? text.split(':').slice(1).join(':').trim() : '';
        const disp=makeDisplay(q.name,opt);
        line.textContent = disp + (tail?`: ${tail}`:'');
      });
    });
  }

  // ---- start / observers ----
  function start(){
    injectInputs();
    new MutationObserver(()=>injectInputs()).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();