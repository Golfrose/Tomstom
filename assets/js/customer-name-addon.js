/* ==============================================================
   Customer Name Add-on v3.2 (stable, no-Firebase)
   - มือถือ/เดสก์ท็อป: เปลี่ยนชื่อเฉพาะ "แถวสินค้า" ในตะกร้า (ไม่แตะหัว/ท้าย)
   - ยืนยันการขาย: แทนชื่อในตารางบันทึก (จับแถวล่าสุด) + บล็อกสรุปด้านบน
   ============================================================== */
(function () {
  const $  = (s, c=document)=>c.querySelector(s);
  const $$ = (s, c=document)=>Array.from(c.querySelectorAll(s));

  // คิวตามลำดับ "เพิ่มลงตะกร้า"
  const queue = [];

  /* ---------- ใส่ช่องชื่อลูกค้าใต้ปุ่มเพิ่ม ---------- */
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

  // ปุ่มลบในทุกรูปแบบ
  function isRemoveControl(el){
    if(!el) return false;
    const t=(el.textContent||'').trim();
    const aria=(el.getAttribute('aria-label')||'')+(el.title||'');
    const cls=el.className||'';
    return /x|×|ลบ/.test(t) ||
           /ลบ|remove|delete/i.test(aria+cls);
  }

  // เลือก “แถวสินค้า” ในโมดัลให้แม่น
  function getCartItemRows(container){
    // 1) ถ้ามี .cart-list → ใช้ลูกโดยตรง (กันหัว/ท้ายชัวร์)
    const list = container.querySelector('.cart-list');
    if (list) return Array.from(list.children).filter(el => {
      // กัน element ว่าง/หัวข้อ
      const txt=(el.textContent||'').trim();
      return !!txt && !/สรุปรายการสั่งซื้อ|ยืนยันการขาย|ล้างตะกร้า/.test(txt);
    });

    // 2) fallback: ต้องมี "ปุ่มลบ" อยู่ในแถวนั้น
    const blocks=[...container.querySelectorAll('.cart-item, li, .item, .row, .card, div')];
    return blocks.filter(b=>{
      const txt=(b.textContent||'').trim();
      if(!txt) return false;
      if(/สรุปรายการสั่งซื้อ|ยืนยันการขาย|ล้างตะกร้า/.test(txt)) return false;

      // หา control ที่เป็นปุ่มลบในหลายรูปแบบ
      const hasRemove = !![...b.querySelectorAll('button,a,div[role="button"]')]
        .find(isRemoveControl);
      // มีราคา/บาทด้วย เพื่อกันบล็อกที่ไม่ใช่แถว
      const hasPrice   = /฿/.test(txt) || /บาท/.test(txt);
      return hasRemove && hasPrice;
    });
  }

  function pickNameElement(row){
    const direct = $('.item-name, .name, .title', row);
    if(direct) return direct;
    const cands=[...row.querySelectorAll('div, span, p, b, strong')].filter(el=>{
      const t=(el.textContent||'').trim();
      if(!t) return false;
      if(/฿|บาท|[x×]|\b\d+\b/.test(t)) return false;
      return /[ก-๙A-Za-z]/.test(t);
    });
    if(!cands.length) return null;
    cands.sort((a,b)=>(b.textContent||'').length-(a.textContent||'').length);
    return cands[0];
  }

  /* ---------- เมื่อกด "เพิ่มลงตะกร้า" ---------- */
  document.addEventListener('click', (ev)=>{
    const btn=ev.target.closest('button'); if(!btn||!/เพิ่มลงตะกร้า/.test(btn.textContent||'')) return;
    const card=btn.closest('.product-card, .card, .product, [data-product-id]');

    const nameEl = card && $('.customer-input', card);
    const name   = (nameEl && nameEl.value.trim()) || '';

    // กันเคสยาไม่มีตัวเลือก
    let rawProduct=''; const title=card && card.querySelector('h3, h2, .title, .name, .product-title');
    if(title) rawProduct=(title.textContent||'').trim();

    // ตัวเลือก (ถ้ามี)
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
    // อัปเดตหลังโมดัลเรนเดอร์
    setTimeout(updateCartNames, 120);
  });

  /* ---------- อัปเดตชื่อใน "ตะกร้า" ---------- */
  function updateCartNames(){
    const containers=$$('.modal, .cart-modal, [data-cart], .swal2-popup, .drawer');
    if(!containers.length) return;

    const q = queue.slice(); // สำเนาเพื่ออ่านตามลำดับ

    containers.forEach(c=>{
      const rows=getCartItemRows(c);
      rows.forEach(row=>{
        const nameEl=pickNameElement(row);
        if(!nameEl || nameEl.dataset.custApplied==='1') return;

        const original=(nameEl.dataset.originalText)||(nameEl.dataset.originalText=(nameEl.textContent||'').trim());
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

  /* ---------- กดยืนยันการขาย → ไปแทนชื่อในหน้า "บันทึก" ---------- */
  document.addEventListener('click', (ev)=>{
    const btn=ev.target.closest('button'); if(!btn||!/ยืนยันการขาย/.test(btn.textContent||'')) return;

    // จำนวนชิ้นจากตะกร้าปัจจุบัน
    let count=1;
    const cont=$$('.modal, .cart-modal, [data-cart], .swal2-popup, .drawer')[0];
    if(cont) count = getCartItemRows(cont).length || 1;

    const used = queue.splice(0, count);

    // รอให้หน้า “สรุปยอดขาย” เรนเดอร์
    setTimeout(()=>{
      patchReportTable(used);
      patchSoldSummary(used);
    }, 360);
  });

  // — ตารางบันทึก: จับ "คอลัมน์สินค้า" ของแถวล่าสุด —
  function patchReportTable(used){
    if(!used.length) return;

    // 1) table
    const tables=$$('table');
    tables.forEach(table=>{
      const ths=[...table.querySelectorAll('thead th, tr th')];
      const idx=ths.findIndex(th=>/สินค้า/.test((th.textContent||'')));
      if(idx===-1) return;

      const tds=[...table.querySelectorAll(`tbody tr td:nth-child(${idx+1})`)];
      const targetCells = tds.slice(-used.length); // ← จับแถวล่าสุดเท่านั้น
      targetCells.forEach((td, i)=>{
        if(!used[i]) return;
        const text=(td.textContent||'').trim();
        const m=text.match(/^(.*?)\s*\((.+)\)$/);
        const opt=m?m[2]:text;
        const u=used[i];
        const disp=makeDisplay(u.name, u.option || opt);
        if(disp){ td.textContent=disp; td.dataset.custApplied='1'; }
      });
    });

    // 2) div-list fallback (ถ้าไม่มี table)
    const scopes=$$('#report, .report, #sales-report, .sales-report, #summary-page, .summary-page, body');
    scopes.forEach(scope=>{
      const rows=[...scope.querySelectorAll('.row, .item, li, article, .card')].filter(r=>{
        const t=(r.textContent||'');
        const hasMeta=/(ราคา|รวม|จำนวน|ต่อหน่วย|บาท|฿)/.test(t);
        const nameEl=pickNameElement(r);
        return hasMeta && nameEl;
      });
      const latest = rows.slice(-used.length);
      latest.forEach((r,i)=>{
        if(!used[i]) return;
        const nameEl=pickNameElement(r);
        const text=(nameEl.textContent||'').trim();
        const m=text.match(/^(.*?)\s*\((.+)\)$/);
        const opt=m?m[2]:text;
        const u=used[i];
        const disp=makeDisplay(u.name, u.option || opt);
        if(disp){ nameEl.textContent=disp; nameEl.dataset.custApplied='1'; }
      });
    });
  }

  // — บล็อก “รายการสินค้าที่ขายได้ (สรุป)” —
  function patchSoldSummary(used){
    if(!used.length) return;
    const heads=$$('h1,h2,h3,h4').filter(h=>/รายการสินค้าที่ขายได้/.test((h.textContent||'').trim()));
    heads.forEach(h=>{
      const box=h.parentElement; if(!box) return;
      const lines=[...box.querySelectorAll('li, p, div')].filter(el=>/ขวด/.test((el.textContent||'')));
      const latest = lines.slice(-used.length);
      latest.forEach((line,i)=>{
        const u=used[i]; if(!u) return;
        const txt=(line.textContent||'').trim();
        const m=txt.match(/\((.+)\)/);
        const opt=u.option || (m?m[1]:txt);
        const tail=txt.includes(':')?txt.split(':').slice(1).join(':').trim():'';
        const disp=makeDisplay(u.name,opt);
        line.textContent=disp+(tail?`: ${tail}`:'');
      });
    });
  }

  /* ---------- start ---------- */
  function start(){
    injectInputs();
    new MutationObserver(()=>injectInputs()).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();