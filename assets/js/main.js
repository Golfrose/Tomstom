// main.js
// Entry point for mounting products on the sale page and wiring up
// interactions between the cart and other parts of the application. It
// defines the `showPage` function used by the navigation bar and
// creates product rows for each category. The arrays below can be
// updated to add or remove products or categories.

import { changeQuantity, addToCart, renderCartModal, updateCartCount, clearCart } from './cart.js';
import { confirmSale } from './sales.js';
import { loadReport } from './report.js';
import { populateProductSelect, switchCompareMode, clearComparison, compareSales } from './compare.js';

/**
 * Show a page by its identifier. Hides all other pages first. When
 * opening the summary or compare pages, initialise their contents.
 * @param {string} pageId
 */
export function showPage(pageId) {
  document.querySelectorAll('.page').forEach((p) => (p.style.display = 'none'));
  const pageEl = document.getElementById(`${pageId}-page`);
  if (pageEl) pageEl.style.display = 'block';
  if (pageId === 'summary') {
    const today = new Date().toISOString().slice(0, 10);
    const reportDateInput = document.getElementById('report-date');
    if (reportDateInput) reportDateInput.value = today;
    loadReport();
  }
  if (pageId === 'compare') {
    populateProductSelect();
    switchCompareMode('day-to-day');
    document.getElementById('day-to-day-mode').classList.add('active');
  }
}

/**
 * Create a product row element for the sale page. Each row contains
 * quantity controls, optional mix options and a checkbox to add the
 * selected quantity to the cart. After adding, the quantity resets
 * and the checkbox is unchecked.
 * @param {{name:string, price:number, mixes?:Array<{label:string, price:number}>, promo?:string}} param0
 */
function createProductRow({ name, price, mixes = [], promo }) {
  const row = document.createElement('div');
  row.className = 'product-row';
  row.dataset.product = name;
  row.dataset.price = price;
  if (promo) row.dataset.promo = promo;

  // Quantity control: minus button, input, plus button
  const qtyControl = document.createElement('div');
  qtyControl.className = 'quantity-control';
  qtyControl.innerHTML = `
    <button class="qty-minus">-</button>
    <input type="number" class="quantity-input" value="0" min="0" readonly />
    <button class="qty-plus">+</button>
  `;
  row.appendChild(qtyControl);

  // Bind quantity buttons
  qtyControl.querySelector('.qty-minus').addEventListener('click', (e) => changeQuantity(e.currentTarget, -1));
  qtyControl.querySelector('.qty-plus').addEventListener('click', (e) => changeQuantity(e.currentTarget, 1));

  // Details: display product name and price. Even though the user
  // requested not to repeat the name elsewhere, a compact label helps
  // users orient themselves. The full name will still appear in the
  // cart.
  const details = document.createElement('div');
  details.className = 'details';
  details.innerHTML = `
    <span class="product-name">${name}</span>
    <span class="product-price">${price.toLocaleString()}฿${promo ? ` (${promo})` : ''}</span>
  `;
  row.appendChild(details);

  // Mix options, if provided
  if (mixes && mixes.length > 0) {
    const mixContainer = document.createElement('div');
    mixContainer.className = 'mix-options';
    mixes.forEach((m, idx) => {
      const optionId = `mix-${name}-${idx}`;
      const wrapper = document.createElement('label');
      wrapper.className = 'mix-option';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `mix-${name}`;
      input.value = m.label;
      input.dataset.price = m.price;
      if (idx === 0) input.checked = true;
      const span = document.createElement('span');
      span.textContent = m.label;
      wrapper.appendChild(input);
      wrapper.appendChild(span);
      mixContainer.appendChild(wrapper);
    });
    row.appendChild(mixContainer);
  }

  // Checkbox to add selected quantity to cart
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.className = 'add-checkbox';
  // When checked, add to cart and immediately uncheck
  cb.addEventListener('change', (e) => {
    if (e.target.checked) {
      addToCart(row);
      // Reset checkbox
      e.target.checked = false;
    }
  });
  row.appendChild(cb);
  return row;
}

/**
 * Mount all product rows to their respective category lists. Update
 * this function whenever you add or remove products or categories. The
 * structure of each product object should match the parameter for
 * createProductRow().
 */
function mountProducts() {
  // Define products per category. Names and mixes are based on the
  // original Tomstom offerings. Additional categories can be added
  // freely (e.g. other) with their own products.
  const water = [
    {
      name: 'ผสมเงิน',
      price: 100,
      mixes: [
        { label: 'ผสมเงิน', price: 100 },
        { label: 'ผสมเงินซิ', price: 100 },
        { label: 'ผสมเงินน้ำตาลสด', price: 100 },
      ],
    },
    {
      name: 'ผสมแดง',
      price: 100,
      mixes: [
        { label: 'ผสมแดง', price: 100 },
        { label: 'ผสมแดงซิ', price: 100 },
        { label: 'ผสมแดงน้ำตาลสด', price: 100 },
      ],
    },
    {
      name: 'ผสมไก่',
      price: 100,
      mixes: [
        { label: 'ผสมไก่', price: 100 },
        { label: 'ผสมไก่ซิ', price: 100 },
        { label: 'ผสมไก่น้ำตาลสด', price: 100 },
      ],
    },
    {
      name: 'ผสมซี',
      price: 100,
      mixes: [
        { label: 'ผสมซี', price: 100 },
        { label: 'ผสมซีซิ', price: 100 },
        { label: 'ผสมซีน้ำตาลสด', price: 100 },
      ],
    },
    { name: 'น้ำดิบ', price: 65, mixes: [], promo: '2 ขวด 120 บาท' },
    {
      name: 'แลกขวดฟรี',
      price: 0,
      mixes: [
        { label: 'แลกฟรี', price: 0 },
        { label: 'แลกฟรีผสมซิ', price: 20 },
        { label: 'แลกฟรีผสมน้ำตาลสด', price: 20 },
      ],
    },
  ];

  const med = [
    { name: 'ยาฝาเงิน', price: 80, mixes: [] },
    { name: 'ยาฝาแดง', price: 90, mixes: [] },
    { name: 'ยาไก่', price: 80, mixes: [] },
    { name: 'ยาซี', price: 80, mixes: [] },
  ];

  // Define mix category items. These can mirror water mixes or be
  // entirely new beverages. Here we reuse some of the water mixes but
  // label them distinctly to indicate they are part of the mix menu.
  const mix = [
    {
      name: 'มิกซ์เงิน',
      price: 120,
      mixes: [
        { label: 'มิกซ์เงิน', price: 120 },
        { label: 'มิกซ์เงินซิ', price: 120 },
        { label: 'มิกซ์เงินน้ำตาลสด', price: 120 },
      ],
    },
    {
      name: 'มิกซ์แดง',
      price: 120,
      mixes: [
        { label: 'มิกซ์แดง', price: 120 },
        { label: 'มิกซ์แดงซิ', price: 120 },
        { label: 'มิกซ์แดงน้ำตาลสด', price: 120 },
      ],
    },
    {
      name: 'มิกซ์ไก่',
      price: 120,
      mixes: [
        { label: 'มิกซ์ไก่', price: 120 },
        { label: 'มิกซ์ไก่ซิ', price: 120 },
        { label: 'มิกซ์ไก่น้ำตาลสด', price: 120 },
      ],
    },
    {
      name: 'มิกซ์ซี',
      price: 120,
      mixes: [
        { label: 'มิกซ์ซี', price: 120 },
        { label: 'มิกซ์ซีซิ', price: 120 },
        { label: 'มิกซ์ซีน้ำตาลสด', price: 120 },
      ],
    },
  ];

  const free = [
    {
      name: 'แลกขวดฟรี',
      price: 0,
      mixes: [
        { label: 'แลกฟรี', price: 0 },
        { label: 'แลกฟรีผสมซิ', price: 20 },
        { label: 'แลกฟรีผสมน้ำตาลสด', price: 20 },
      ],
    },
  ];

  const other = [
    { name: 'โออิซิ', price: 20, mixes: [] },
    { name: 'น้ำตาลสด', price: 20, mixes: [] },
  ];

  // Map categories to DOM containers
  const categories = {
    water: { items: water, container: document.getElementById('product-list-water') },
    med: { items: med, container: document.getElementById('product-list-med') },
    mix: { items: mix, container: document.getElementById('product-list-mix') },
    free: { items: free, container: document.getElementById('product-list-free') },
    other: { items: other, container: document.getElementById('product-list-other') },
  };
  // Clear any existing rows and append new ones
  Object.values(categories).forEach(({ items, container }) => {
    if (!container) return;
    container.innerHTML = '';
    items.forEach((product) => {
      container.appendChild(createProductRow(product));
    });
  });
}

// When the DOM is ready, mount products and wire up event handlers
document.addEventListener('DOMContentLoaded', () => {
  mountProducts();
  updateCartCount();
  // Cart icon shows the cart modal
  document.getElementById('cart-icon').addEventListener('click', renderCartModal);
  document.getElementById('confirm-sale-btn').addEventListener('click', confirmSale);
  document.getElementById('clear-cart-btn').addEventListener('click', clearCart);
  document.getElementById('load-report-btn').addEventListener('click', loadReport);
  document.getElementById('compare-mode-select').addEventListener('change', (e) => switchCompareMode(e.target.value));
  document.getElementById('clear-compare-btn').addEventListener('click', clearComparison);
  document.getElementById('compare-btn').addEventListener('click', compareSales);
});
