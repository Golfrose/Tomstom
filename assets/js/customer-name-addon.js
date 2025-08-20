/* ==============================================================
   Customer Name Add-on v3 (stable, no-Firebase)
   - ใส่ช่อง "ชื่อลูกค้า" ใต้ราคาทุกการ์ด (น้ำ/ยา)
   - ตะกร้า: แทนชื่อเฉพาะ "แถวสินค้า" ไม่แตะหัว/ท้ายโมดัล
   - ยืนยันการขาย: ไปแทนในตารางบันทึก และบล็อก "รายการสินค้าที่ขายได้ (สรุป)"
   - ไม่แตะฐานข้อมูล, ไม่ชนโค้ดเดิม
   ============================================================== */
(function () {
  const $  = (s, c=document)=>c.querySelector(s);
  const $$ = (s, c=document)=>Array.from(c.querySelectorAll(s));

  // คิวจำข้อมูลตามลำดับที่ "เพิ่มลงตะกร้า"
  const queue = [];

  /* ---------- UI: ช่องชื่อลูกค้าใต้ปุ่มเพิ่ม ---------- */
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

  // เลือก “แถวสินค้า” ในโมดัลให้แม่น (กันหัว/ท้าย)
  function getCartItemRows(container){
    const scope = container.querySelector('.cart-list') || container;
    const blocks=[...scope.querySelectorAll('.cart-item, li, .item, .row, .card, div')];
    return blocks.filter(b=>{
      const txt=(b.textContent||'').trim();
      if(!txt) return false;
      if(/สรุปรายการสั่งซื้อ|ยืนยันการขาย|ล้างตะกร้า/.test(txt)) return false;
      const hasPrice   = /฿/.test(txt) || /บาท/.test(txt);
      const hasQtyLine = /[x×]\s*\d+/.test(txt) || /×/.test(txt);
      const rmBtn = !![...b.querySelectorAll('button')].find(x=>{
        const t=(x.textContent||'').trim();
        const aria=(x.getAttribute('aria-label')||'')+(x.title||'');
        return /x|×|ลบ/.test(t) || /ลบ|remove|delete/i.test(aria);
      });
      return (hasPrice && hasQtyLine) || (hasPrice && rmBtn);
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
    setTimeout(updateCartNames, 120);
  });

  /* ---------- อัปเดตชื่อใน "ตะกร้า" ---------- */
  function updateCartNames(){
    const containers=$$('.modal, .cart-modal, [data-cart], .swal2-popup, .drawer');
    if(!containers.length) return;

    // ใช้สำเนาคิวเพื่อจับตามลำดับ (แต่ไม่ทำให้คิวจริงหาย)
    const q = queue.slice();

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

    // ประมาณจำนวนแถวจากตะกร้า แล้วดึงของคิวออกตามนั้น
    let count=1;
    const cont=$$('.modal, .cart-modal, [data-cart], .swal2-popup, .drawer')[0];
    if(cont) count = getCartItemRows(cont).length || 1;

    const used = queue.splice(0, count);  // ของที่เพิ่งขายไป

    // รอให้หน้า "บันทึก" เรนเดอร์ แล้วแทนชื่อ
    setTimeout(()=>{
      patchReportTable(used);
      patchSoldSummary(used);
    }, 360);
  });

  function patchReportTable(used){
    if(!used.length) return;

    // 1) table
    const tables=$$('table');
    tables.forEach(table=>{
      const ths=[...table.querySelectorAll('thead th, tr th')];
      const idx=ths.findIndex(th=>/สินค้า/.test((th.textContent||'')));
      if(idx===-1) return;
      const tds=[...table.querySelectorAll(`tbody tr td:nth-child(${idx+1})`)];
      let i=0;
      tds.forEach(td=>{
        if(i>=used.length) return;
        if(td.dataset.custApplied==='1') return;

        const text=(td.textContent||'').trim();
        const m=text.match(/^(.*?)\s*\((.+)\)$/);
        const opt=m?m[2]:text;
        const u=used[i++];
        const disp=makeDisplay(u.name, u.option || opt);
        if(disp){ td.textContent=disp; td.dataset.custApplied='1'; }
      });
    });

    // 2) div-list fallback
    const scopes=$$('#report, .report, #sales-report, .sales-report, #summary-page, .summary-page, body');
    scopes.forEach(scope=>{
      let i=0;
      const rows=[...scope.querySelectorAll('.row, .item, li, article, .card')].filter(r=>{
        const t=(r.textContent||'');
        const hasMeta=/(ราคา|รวม|จำนวน|ต่อหน่วย|บาท|฿)/.test(t);
        const nameEl=pickNameElement(r);
        return hasMeta && nameEl;
      });
      rows.forEach(r=>{
        if(i>=used.length) return;
        const nameEl=pickNameElement(r);
        if(!nameEl || nameEl.dataset.custApplied==='1') return;

        const text=(nameEl.textContent||'').trim();
        const m=text.match(/^(.*?)\s*\((.+)\)$/);
        const opt=m?m[2]:text;
        const u=used[i++];
        const disp=makeDisplay(u.name, u.option || opt);
        if(disp){ nameEl.textContent=disp; nameEl.dataset.custApplied='1'; }
      });
    });
  }

  function patchSoldSummary(used){
    if(!used.length) return;
    const heads=$$('h1,h2,h3,h4').filter(h=>/รายการสินค้าที่ขายได้/.test((h.textContent||'').trim()));
    heads.forEach(h=>{
      const box=h.parentElement; if(!box) return;
      const lines=[...box.querySelectorAll('li, p, div')].filter(el=>/ขวด/.test((el.textContent||'')));
      const take=used.slice(0, lines.length);
      take.forEach((u,i)=>{
        const line=lines[i]; if(!line) return;
        const txt=(line.textContent||'').trim();
        const m=txt.match(/\((.+)\)/);
        const opt=u.option || (m?m[1]:txt);
        const tail=txt.includes(':')?txt.split(':').slice(1).join(':').trim():'';
        const disp=makeDisplay(u.name, opt);
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