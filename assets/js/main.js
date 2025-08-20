// main.js
import { auth } from './firebase.js';
import { changeQuantity, addToCart, renderCartModal, updateCartCount, clearCart } from './cart.js';
import { confirmSale } from './sales.js';
import { loadReport } from './report.js';
import { populateProductSelect, switchCompareMode, clearComparison, compareSales } from './compare.js';

export function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  document.getElementById(`${pageId}-page`).style.display = 'block';
  if (pageId === 'summary') {
    const today = new Date().toISOString().slice(0,10);
    document.getElementById('report-date').value = today;
    loadReport();
  }
  if (pageId === 'compare') {
    populateProductSelect();
    switchCompareMode('day-to-day');
    document.getElementById('day-to-day-mode').classList.add('active');
  }
}

// Seed products (static as per original)
function createProductCard({name, price, mixes, promo}) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.dataset.product = name;
  card.dataset.price = price;
  const mixesHTML = mixes && mixes.length ? mixes.map((m,i)=>`
    <label class="mix-option">
      <input type="radio" name="mix-${name}" value="${m.label}" data-price="${m.price}" ${i===0?'checked':''}> ${m.label}
    </label>`).join('') : `<input type="hidden" name="mix-${name}" value="ไม่มี">`;

  card.innerHTML = `
    <h3>${name}</h3>
    <span class="price">${price} บาท/ขวด${promo?` (${promo})`:''}</span>
    <div class="mix-options">${mixesHTML}</div>
    <div class="quantity-control">
      <button class="qty-minus">-</button>
      <input type="number" value="0" min="0" class="quantity-input">
      <button class="qty-plus">+</button>
    </div>
    <button class="add-to-cart-btn">เพิ่มลงตะกร้า</button>
  `;
  // bind
  card.querySelector('.qty-minus').addEventListener('click', (e)=> changeQuantity(e.currentTarget, -1));
  card.querySelector('.qty-plus').addEventListener('click', (e)=> changeQuantity(e.currentTarget, 1));
  card.querySelector('.add-to-cart-btn').addEventListener('click', ()=> addToCart(card));
  return card;
}

function mountProducts() {
  const water = [
    { name:'น้ำผสมเงิน', price:100, mixes:[{label:'ผสมเงิน', price:100},{label:'ผสมเงินซิ', price:100},{label:'ผสมเงินน้ำตาลสด', price:100}]},
    { name:'น้ำผสมแดง', price:100, mixes:[{label:'ผสมแดง', price:100},{label:'ผสมแดงซิ', price:100},{label:'ผสมแดงน้ำตาลสด', price:100}]},
    { name:'น้ำผสมไก่', price:100, mixes:[{label:'ผสมไก่', price:100},{label:'ผสมไก่ซิ', price:100},{label:'ผสมไก่น้ำตาลสด', price:100}]},
    { name:'น้ำผสมซี', price:100, mixes:[{label:'ผสมซี', price:100},{label:'ผสมซีซิ', price:100},{label:'ผสมซีน้ำตาลสด', price:100}]},
    { name:'น้ำดิบ', price:65, mixes:[], promo:'2 ขวด 120 บาท' },
    { name:'แลกขวดฟรี', price:0, mixes:[{label:'แลกฟรี', price:0},{label:'แลกฟรีผสมซิ', price:20},{label:'แลกฟรีผสมน้ำตาลสด', price:20}]}
  ];
  const med = [
    { name:'ยาฝาเงิน', price:80, mixes:[] },
    { name:'ยาฝาแดง', price:90, mixes:[] },
    { name:'ยาไก่', price:80, mixes:[] },
    { name:'ยาซี', price:80, mixes:[] }
  ];
  const waterList = document.getElementById('product-list-water');
  const medList = document.getElementById('product-list-med');
  water.forEach(p => waterList.appendChild(createProductCard(p)));
  med.forEach(p => medList.appendChild(createProductCard(p)));
}

document.addEventListener('DOMContentLoaded', () => {
  mountProducts();
  updateCartCount();

  document.getElementById('cart-icon').addEventListener('click', renderCartModal);
  document.getElementById('confirm-sale-btn').addEventListener('click', confirmSale);
  document.getElementById('clear-cart-btn').addEventListener('click', clearCart);

  document.getElementById('load-report-btn').addEventListener('click', loadReport);

  document.getElementById('compare-mode-select').addEventListener('change', (e)=> switchCompareMode(e.target.value));
  document.getElementById('clear-compare-btn').addEventListener('click', clearComparison);
  document.getElementById('compare-btn').addEventListener('click', compareSales);
});
