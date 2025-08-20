/* ==============================================================
   Customer Name Add-on v3.4 (stable)
   - ตะกร้า: ใช้งานได้เหมือน v3.2
   - บันทึก: มี "backlog + retry + observer" ไล่แทนชื่อจนตารางขึ้นจริง
   ============================================================== */
(function () {
  const $  = (s, c=document)=>c.querySelector(s);
  const $$ = (s, c=document)=>Array.from(c.querySelectorAll(s));

  const queue = [];                 // คิวตามลำดับ "เพิ่มลงตะกร้า"
  let backlog = [];                 // ของที่เพิ่งขาย รอแทนในหน้าบันทึก
  let retryTimer = null;            // interval ไล่แพตช์ซ้ำช่วงสั้น ๆ

  /* ---------- ช่องชื่อลูกค้าใต้ปุ่มเพิ่ม ---------- */
  function mkBox(id){
    const wrap=document.createElement('div'); wrap.className='customer-box';
    const lab=document.createElement('label'); lab.className='sr-only'; lab.htmlFor=`customer-${id}`; lab.textContent='ชื่อลูกค้า';
    const inp=document.createElement('input'); inp.id=`customer-${id}`; inp.className='customer-input';
    inp.type='text'; inp.placeholder='ชื่อลูกค้า (ไม่บังคับ)'; inp.autocomplete='off'; inp.inputMode='text'; inp.maxLength=40;
    wrap.append(lab, inp); return wrap;
  }
  function injectInputs(){
    const cards=$$('.product-card, .card, .product, [data-product-id]');
    cards.forEach(card=>{
      if(card.__hasCust) return;
      const id=card.getAttribute('data-product-id')||card.id||Math.random().toString(36).slice(2,9);
      const addBtn=[...card.querySelectorAll('button')].find(b=>/เพิ่มลงตะกร้า/.test(b.textContent||''));
      const box=mkBox(id);
      if(addBtn && addBtn.parentElement) addBtn.parentElement.insertBefore(box, addBtn);
      else card.appendChild(box);
      card.__hasCust = true;
    });
  }

  /* ---------- Helpers ---------- */
  const makeDisplay=(name,right)=>name?`${name} (${(right||'').trim()||'ไม่ระบุ'})`:null;
  const norm = s => (s||'').replace(/\s+/g,' ').trim();

  function isRemoveControl(el){
    if(!el) return false;
    const t=(el.textContent||'').trim();
    const aria=(el.getAttribute('aria-label')||'')+(el.title||'');
    const cls=el.className||'';
    return /x|×|ลบ/.test(t) || /ลบ|remove|delete/i.test(aria+cls);
  }

  function getCartItemRows(container){
    const list = container.querySelector('.cart-list');
    if (list) return Array.from(list.children).filter(el => {
      const txt=norm(el.textContent);
      return !!txt && !/สรุปรายการสั่งซื้อ|ยืนยันการขาย|ล้างตะกร้า/.test(txt);
    });

    const blocks=[...container.querySelectorAll('.cart-item, li, .item, .row, .card, div')];
    return blocks.filter(b=>{
      const txt=norm(b.textContent);
      if(!txt) return false;
      if(/สรุปรายการสั่งซื้อ|ยืนยันการขาย|ล้างตะกร้า/.test(txt)) return false;
      const hasRemove = !![...b.querySelectorAll('button,a,div[role="button"]')].find(isRemoveControl);
      const hasPrice  = /฿/.test(txt) || /บาท/.test(txt);
      return hasRemove && hasPrice;
    });
  }

  function pickNameElement(row){
    const direct = $('.item-name, .name, .title', row);
    if(direct) return direct;
    const cands=[...row.querySelectorAll('div, span, p, b, strong')].filter(el=>{
      const t=norm(el.textContent);
      if(!t) return false;
      if(/฿|บาท|[x×]|\b\d+\b/.test(t)) return false;
      return /[ก-๙A-Za-z]/.test(t);
    });
    if(!cands.length) return null;
    cands.sort((a,b)=>(norm(b.textContent).length)-(norm(a.textContent).length));
    return cands[0];
  }

  /* ---------- เพิ่มลงตะกร้า ---------- */
  document.addEventListener('click', (ev)=>{
    const btn=ev.target.closest('button'); if(!btn||!/เพิ่มลงตะกร้า/.test(btn.textContent||'')) return;
    const card=btn.closest('.product-card, .card, .product, [data-product-id]');

    const nameEl = card && $('.customer-input', card);
    const name   = (nameEl && nameEl.value.trim()) || '';

    let rawProduct=''; const title=card && card.querySelector('h3, h2, .title, .name, .product-title');
    if(title) rawProduct=(title.textContent||'').trim();

    let option=''; try{
      const chk=card.querySelector('input[type="radio"]:checked');
      if(chk){
        const lbl=chk.closest('label')||chk.parentElement;
        if(lbl && lbl.textContent) option=lbl.textContent.trim();
        if(!option && chk.nextElementSibling && chk.nextElementSibling.textContent)
          option=chk.nextElementSibling.textContent.trim();
      }
    }catch{}

    queue.push({ name, option, rawProduct, ts: Date.now() });
    setTimeout(updateCartNames, 120);
  });

  /* ---------- อัปเดตชื่อในตะกร้า ---------- */
  function updateCartNames(){
    const containers=$$('.modal, .cart-modal, [data-cart], .swal2-popup, .drawer');
    if(!containers.length) return;
    const q = queue.slice();

    containers.forEach(c=>{
      const rows=getCartItemRows(c);
      rows.forEach(row=>{
        const nameEl=pickNameElement(row);
        if(!nameEl || nameEl.dataset.custApplied==='1') return;

        const original=(nameEl.dataset.originalText)||(nameEl.dataset.originalText=norm(nameEl.textContent));
        const m = original.match(/^(.*?)\s*\((.+)\)$/);
        const optionOrRaw = m ? m[2] : original;

        const idx=q.findIndex(x=>x && x.name);
        if(idx===-1) return;
        const item=q.splice(idx,1)[0];

        const final=makeDisplay(item.name, item.option || optionOrRaw);
        if(final){ nameEl.textContent=final; nameEl.dataset.custApplied='1'; }
      });
    });
  }
  new MutationObserver(()=>updateCartNames()).observe(document.body,{childList:true,subtree:true});

  /* ---------- ยืนยันการขาย → เก็บ backlog แล้วไล่แพตช์จนสำเร็จ ---------- */
  document.addEventListener('click', (ev)=>{
    const btn=ev.target.closest('button'); if(!btn||!/ยืนยันการขาย/.test(btn.textContent||'')) return;

    let count=1;
    const cont=$$('.modal, .cart-modal, [data-cart], .swal2-popup, .drawer')[0];
    if(cont) count = getCartItemRows(cont).length || 1;

    backlog = queue.splice(0, count);

    // เริ่ม retry ทันที 5 วินาที (ทุก 300ms)
    startRetryPatching();
  });

  function startRetryPatching(){
    const started = Date.now();
    if(retryTimer) clearInterval(retryTimer);
    const tryPatch = () => {
      const ok1 = patchReportTable(backlog);
      const ok2 = patchSoldSummary(backlog);
      // ถ้าทั้งสองอย่างเจออย่างน้อย 1 จุด → ล้าง backlog
      if (ok1 || ok2) backlog = [];
      // ครบเวลา 5 วิ หรือไม่มี backlogแล้ว → หยุด
      if (Date.now() - started > 5000 || backlog.length===0) {
        clearInterval(retryTimer); retryTimer = null;
      }
    };
    // ยิงทันที 1 ครั้ง แล้วตามด้วย interval
    tryPatch();
    retryTimer = setInterval(tryPatch, 300);
  }

  // — ตารางบันทึก: ใช้ "แถวล่าสุด" และคืนค่า boolean ว่ามีการแทนสำเร็จไหม —
  function patchReportTable(used){
    if(!used.length) return false;
    let changed = false;

    // 1) table
    const tables=$$('table');
    tables.forEach(table=>{
      const ths=[...table.querySelectorAll('thead th, tr th')];
      const idx=ths.findIndex(th=>/สินค้า/.test(norm(th.textContent)));
      if(idx===-1) return;

      const tds=[...table.querySelectorAll(`tbody tr td:nth-child(${idx+1})`)];
      if(!tds.length) return;

      const targetCells = tds.slice(-used.length);
      targetCells.forEach((td, i)=>{
        if(!used[i]) return;
        const text=norm(td.textContent);
        const m=text.match(/^(.*?)\s*\((.+)\)$/);
        const opt=m?m[2]:text;
        const u=used[i];
        const disp=makeDisplay(u.name, u.option || opt);
        if(disp && td.textContent!==disp){ td.textContent=disp; td.dataset.custApplied='1'; changed = true; }
      });
    });

    // 2) div-list fallback
    const scopes=$$('#report, .report, #sales-report, .sales-report, #summary-page, .summary-page, body');
    scopes.forEach(scope=>{
      const rows=[...scope.querySelectorAll('.row, .item, li, article, .card')].filter(r=>{
        const t=norm(r.textContent);
        const hasMeta=/(ราคา|รวม|จำนวน|ต่อหน่วย|บาท|฿)/.test(t);
        const nameEl=pickNameElement(r);
        return hasMeta && nameEl;
      });
      if(!rows.length) return;
      const latest = rows.slice(-used.length);
      latest.forEach((r,i)=>{
        if(!used[i]) return;
        const nameEl=pickNameElement(r);
        const text=norm(nameEl.textContent);
        const m=text.match(/^(.*?)\s*\((.+)\)$/);
        const opt=m?m[2]:text;
        const u=used[i];
        const disp=makeDisplay(u.name, u.option || opt);
        if(disp && nameEl.textContent!==disp){ nameEl.textContent=disp; nameEl.dataset.custApplied='1'; changed = true; }
      });
    });

    return changed;
  }

  // — บล็อก “รายการสินค้าที่ขายได้ (สรุป)” —
  function patchSoldSummary(used){
    if(!used.length) return false;
    let changed=false;
    const heads=$$('h1,h2,h3,h4').filter(h=>/รายการสินค้าที่ขายได้/.test(norm(h.textContent)));
    heads.forEach(h=>{
      const box=h.parentElement; if(!box) return;
      const lines=[...box.querySelectorAll('li, p, div')].filter(el=>/ขวด/.test(norm(el.textContent)));
      if(!lines.length) return;
      const latest = lines.slice(-used.length);
      latest.forEach((line,i)=>{
        const u=used[i]; if(!u) return;
        const txt=norm(line.textContent);
        const m=txt.match(/\((.+)\)/);
        const opt=u.option || (m?m[1]:txt);
        const tail=txt.includes(':')?txt.split(':').slice(1).join(':').trim():'';
        const disp=makeDisplay(u.name,opt);
        if(disp && line.textContent!==disp+(tail?`: ${tail}`:'')){
          line.textContent=disp+(tail?`: ${tail}`:''); changed=true;
        }
      });
    });
    return changed;
  }

  /* ---------- start ---------- */
  function start(){
    injectInputs();
    new MutationObserver((muts)=>{
      injectInputs();
      // ถ้ามี backlog ค้าง และมีการเปลี่ยน DOM ให้ลองแพตช์อีก
      if(backlog.length){ patchReportTable(backlog); patchSoldSummary(backlog); }
    }).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();