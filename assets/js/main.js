// modified_main.js
// This file contains the full logic for the sale system but has been updated to
// support four product categories (water, med, mix and free) and a dynamic
// category selector. The original version only had water and med categories.

import { auth } from './firebase.js';
import {
  changeQuantity,
  addToCart,
  renderCartModal,
  updateCartCount,
  clearCart,
} from './cart.js';
import { confirmSale } from './sales.js';
import { loadReport } from './report.js';
import {
  populateProductSelect,
  switchCompareMode,
  clearComparison,
  compareSales,
} from './compare.js';

/**
 * Display a page by id and perform any page‑specific initialisation.
 * Unchanged from the original implementation.
 *
 * @param {string} pageId The id of the page to show (sale, summary, compare)
 */
export function showPage(pageId) {
  // hide all pages then display the selected one
  document.querySelectorAll('.page').forEach(p => (p.style.display = 'none'));
  document.getElementById(`${pageId}-page`).style.display = 'block';
  if (pageId === 'summary') {
    const today = new Date().toISOString().slice(0, 10);
    document.getElementById('report-date').value = today;
    loadReport();
  }
  if (pageId === 'compare') {
    populateProductSelect();
    switchCompareMode('day-to-day');
    document.getElementById('day-to-day-mode').classList.add('active');
  }
}

/**
 * Helper to generate a single product card. Each card includes:
 *  - product name
 *  - price per unit (with optional promo text)
 *  - list of mix options (radio buttons) if provided
 *  - quantity controls (+/– buttons and numeric input)
 *  - add to cart button
 * The structure and styling mirror the original implementation so that
 * behaviour in the cart remains unchanged.
 *
 * @param {Object} params Product definition containing name, price, mixes and promo
 * @returns {HTMLElement} A DOM element representing the card
 */
function createProductCard({ name, price, mixes, promo }) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.dataset.product = name;
  card.dataset.price = price;
  const mixesHTML =
    mixes && mixes.length
      ? mixes
          .map((m, i) => {
            return `
            <label class="mix-option">
              <input type="radio" name="mix-${name}" value="${m.label}" data-mix-price="${m.price}" ${i === 0 ? 'checked' : ''}/>
              <span>${m.label} (+${m.price} บาท)</span>
            </label>
          `;
          })
          .join('')
      : '';
  card.innerHTML = `
    <h3>${name}</h3>
    <span class="price">${price} บาท/ขวด${promo ? \` (\${promo})\` : ''}</span>
    <div class="mix-options">${mixesHTML}</div>
    <div class="quantity-control">
      <button class="qty-minus">-</button>
      <input type="number" class="qty-input" value="0" min="0" />
      <button class="qty-plus">+</button>
    </div>
    <button class="add-to-cart-btn">เพิ่มลงตะกร้า</button>
  `;
  // Bind quantity buttons and add-to-cart button
  card
    .querySelector('.qty-minus')
    .addEventListener('click', e => changeQuantity(e.currentTarget, -1));
  card
    .querySelector('.qty-plus')
    .addEventListener('click', e => changeQuantity(e.currentTarget, 1));
  card
    .querySelector('.add-to-cart-btn')
    .addEventListener('click', () => addToCart(card));
  return card;
}

/**
 * Populate the product lists for each category. The original code only
 * contained water and medicine categories. This version adds two new
 * categories: mix and free. The data for the existing categories has been
 * preserved verbatim from the original code (including mix options and promo
 * pricing), except that any free items have been moved from the water
 * category into the new free category for clarity.
 */
function mountProducts() {
  const water = [
    {
      name: 'น้ำผสมเงิน',
      price: 100,
      mixes: [
        { label: 'ผสมเงิน', price: 100 },
        { label: 'ผสมเงินซิ', price: 100 },
        { label: 'ผสมเงินน้ำตาลสด', price: 100 },
      ],
    },
    {
      name: 'น้ำผสมแดง',
      price: 100,
      mixes: [
        { label: 'ผสมแดง', price: 100 },
        { label: 'ผสมแดงซิ', price: 100 },
        { label: 'ผสมแดงน้ำตาลสด', price: 100 },
      ],
    },
    {
      name: 'น้ำผสมไก่',
      price: 100,
      mixes: [
        { label: 'ผสมไก่', price: 100 },
        { label: 'ผสมไก่ซิ', price: 100 },
        { label: 'ผสมไก่น้ำตาลสด', price: 100 },
      ],
    },
    {
      name: 'น้ำผสมซี',
      price: 100,
      mixes: [
        { label: 'ผสมซี', price: 100 },
        { label: 'ผสมซีซิ', price: 100 },
        { label: 'ผสมซีน้ำตาลสด', price: 100 },
      ],
    },
    { name: 'น้ำดิบ', price: 65, mixes: [], promo: '2 ขวด 120 บาท' },
  ];
  const med = [
    { name: 'ยาฝาเงิน', price: 80, mixes: [] },
    { name: 'ยาฝาแดง', price: 90, mixes: [] },
    { name: 'ยาไก่', price: 80, mixes: [] },
    { name: 'ยาซี', price: 80, mixes: [] },
  ];
  // New mix category: two items with fixed pricing and no mix options
  const mix = [
    { name: 'โออิซิ', price: 25, mixes: [] },
    { name: 'น้ำตาลสด', price: 25, mixes: [] },
  ];
  // New free category: items that were previously grouped under water but
  // logically belong to the free section. Additional free items can be added here.
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
    { name: 'แลกขวดฟรีซิ', price: 20, mixes: [] },
    { name: 'แลกฟรีสด', price: 20, mixes: [] },
  ];
  const waterList = document.getElementById('product-list-water');
  const medList = document.getElementById('product-list-med');
  const mixList = document.getElementById('product-list-mix');
  const freeList = document.getElementById('product-list-free');
  // Clear existing children in case of re‑mounting
  [waterList, medList, mixList, freeList].forEach(list => {
    while (list.firstChild) list.removeChild(list.firstChild);
  });
  water.forEach(p => waterList.appendChild(createProductCard(p)));
  med.forEach(p => medList.appendChild(createProductCard(p)));
  mix.forEach(p => mixList.appendChild(createProductCard(p)));
  free.forEach(p => freeList.appendChild(createProductCard(p)));
}

// Initialise the application once the DOM is fully loaded. This attaches
// event listeners to page navigation, mounts the products and sets up
// category selection. Sale, cart, summary and compare logic remain unchanged.
document.addEventListener('DOMContentLoaded', () => {
  mountProducts();
  updateCartCount();
  // Toggle the cart modal when the cart icon is clicked
  document.getElementById('cart-icon').addEventListener('click', renderCartModal);
  document.getElementById('confirm-sale-btn').addEventListener('click', confirmSale);
  document.getElementById('clear-cart-btn').addEventListener('click', clearCart);
  document.getElementById('load-report-btn').addEventListener('click', loadReport);
  document
    .getElementById('compare-mode-select')
    .addEventListener('change', e => switchCompareMode(e.target.value));
  document
    .getElementById('clear-compare-btn')
    .addEventListener('click', clearComparison);
  document.getElementById('compare-btn').addEventListener('click', compareSales);

  // Setup category selector. When a category card is clicked, it becomes
  // active and the corresponding product list is displayed while others
  // are hidden. This behaviour replaces the original two‑column layout.
  document
    .querySelectorAll('#sale-page .category-card')
    .forEach(card => {
      card.addEventListener('click', () => {
        // Remove active styling from all cards
        document
          .querySelectorAll('#sale-page .category-card')
          .forEach(c => c.classList.remove('active'));
        // Add active styling to the clicked card
        card.classList.add('active');
        const category = card.dataset.category;
        // Hide all product lists
        document
          .querySelectorAll('#sale-page .product-list')
          .forEach(list => (list.style.display = 'none'));
        // Show the selected category's product list
        const activeList = document.getElementById(`product-list-${category}`);
        if (activeList) activeList.style.display = 'grid';
      });
    });
});
