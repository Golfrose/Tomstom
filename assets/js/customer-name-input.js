/* Customer Name – UI injector (สร้างช่องชื่อลูกค้าใต้ปุ่มเพิ่มลงตะกร้า) */
(function(){
  const $  = (s,c=document)=>c.querySelector(s);
  const $$ = (s,c=document)=>Array.from(c.querySelectorAll(s));

  function makeBox(id){
    const wrap=document.createElement('div');
    wrap.className='customer-box';
    const lab=document.createElement('label');
    lab.className='sr-only';
    lab.textContent='ชื่อลูกค้า';
    lab.htmlFor=`customer-${id}`;
    const inp=document.createElement('input');
    inp.type='text';
    inp.id=`customer-${id}`;
    inp.className='customer-input';
    inp.placeholder='ชื่อลูกค้า (ไม่บังคับ)';
    inp.autocomplete='off';
    inp.maxLength=40;
    wrap.append(lab, inp);
    return wrap;
  }

  function injectInputs(){
    const cards = $$('.product-card, .card, .product, [data-product], [data-product-id]');
    cards.forEach(card=>{
      if(card.__hasCustomerInput) return;
      const addBtn=[...card.querySelectorAll('button')].find(b=>/เพิ่มลงตะกร้า/.test(b.textContent||''));
      const id = card.getAttribute('data-product') || card.getAttribute('data-product-id') || card.id || Math.random().toString(36).slice(2,9);
      const box = makeBox(id);
      if(addBtn && addBtn.parentElement) addBtn.parentElement.insertBefore(box, addBtn);
      else card.appendChild(box);
      card.__hasCustomerInput = true;
    });
  }

  function start(){
    injectInputs();
    new MutationObserver(injectInputs).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
