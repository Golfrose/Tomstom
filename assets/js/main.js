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
function createProductRow({ product, mix = 'ไม่มี', price, promo }) {
  // Create a row representing a single product/mix combination. The
  // caller must provide a `product` (base name), a `mix` label
  // indicating the flavour or option, a numeric `price` and an
  // optional `promo` string for display in the cart. Unlike the
  // original version, this function no longer renders radio buttons
  // for mix selection; each row corresponds to one specific mix.
  const row = document.createElement('div');
  row.className = 'product-row';
  row.dataset.product = product;
  row.dataset.mix = mix;
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

  // Details: display product name and, if applicable, the mix label on
  // a separate line. We intentionally omit price on the sale page
  // since it will be shown in the cart.
  const details = document.createElement('div');
  details.className = 'details';
  const displayName = document.createElement('span');
  displayName.className = 'product-name';
  displayName.textContent = product;
  details.appendChild(displayName);
  if (mix && mix !== 'ไม่มี') {
    const mixEl = document.createElement('span');
    mixEl.className = 'product-mix';
    mixEl.textContent = mix;
    details.appendChild(mixEl);
  }
  row.appendChild(details);

  // Checkbox to add the selected quantity to the cart. When checked
  // the item is added and the checkbox resets immediately.
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.className = 'add-checkbox';
  cb.addEventListener('change', (e) => {
    if (e.target.checked) {
      addToCart(row);
      e.target.checked = false;
    }
  });
  row.appendChild(cb);
  return row;
}

// -----------------------------------------------------------------------------
// Product data definitions
//
// Define the initial product lists. These objects are defined at module
// scope so they can be mutated by the admin control handlers. Each
// product entry contains a `product` (base name), a `mix` label and
// a numeric `price`. Promotions such as the น้ำดิบ deal can be
// indicated with a `promo` string.
export const products = {
  /**
   * Water category menu. Each entry represents a single menu item
   * without a secondary mix option (mix is set to 'ไม่มี'). Prices
   * are 100 Baht per bottle except for the promotions and freebies.
   * The order here determines how items flow into the two columns on
   * the sale page (first eight to the left column, next eight to the
   * right column via CSS).
   */
  water: [
    { product: 'ผสมเงิน', mix: 'ไม่มี', price: 100 },
    { product: 'ผสมเงินซิ', mix: 'ไม่มี', price: 100 },
    { product: 'ผสมเงินสด', mix: 'ไม่มี', price: 100 },
    { product: 'ผสมแดง', mix: 'ไม่มี', price: 100 },
    { product: 'ผสมแดงซิ', mix: 'ไม่มี', price: 100 },
    { product: 'ผสมแดงสด', mix: 'ไม่มี', price: 100 },
    { product: 'ผสมไก่', mix: 'ไม่มี', price: 100 },
    { product: 'ผสมไก่ซิ', mix: 'ไม่มี', price: 100 },
    // Items after the eighth will appear on the right side of the water list
    { product: 'ผสมไก่สด', mix: 'ไม่มี', price: 100 },
    { product: 'ผสมซี', mix: 'ไม่มี', price: 100 },
    { product: 'ผสมซีซิ', mix: 'ไม่มี', price: 100 },
    { product: 'ผสมซีสด', mix: 'ไม่มี', price: 100 },
    { product: 'น้ำดิบ', mix: 'ไม่มี', price: 65, promo: '2 ขวด 120 บาท' },
    { product: 'แลกฟรี', mix: 'ไม่มี', price: 0 },
    { product: 'แลกฟรีซิ', mix: 'ไม่มี', price: 20 },
    { product: 'แลกฟรีสด', mix: 'ไม่มี', price: 20 },
  ],
  /**
   * Medicine category menu. Items have no mix options.
   */
  med: [
    { product: 'ยาฝาเงิน', mix: 'ไม่มี', price: 80 },
    { product: 'ยาฝาแดง', mix: 'ไม่มี', price: 90 },
    { product: 'ยาไก่', mix: 'ไม่มี', price: 80 },
    { product: 'ยาซี', mix: 'ไม่มี', price: 80 },
  ],
  /**
   * Other category menu. Oishi and fresh sugar with updated prices.
   */
  other: [
    { product: 'โออิซิ', mix: 'ไม่มี', price: 25 },
    { product: 'น้ำตาลสด', mix: 'ไม่มี', price: 20 },
  ],
};

/**
 * Mount all product rows to their respective category lists. Update
 * this function whenever you add or remove products or categories. The
 * structure of each product object should match the parameter for
 * createProductRow().
 */
function mountProducts() {
  // Map categories to DOM containers. Only water, med and other are
  // present; mix and free categories have been removed. The data
  // structure `products` (defined outside this function) stores the
  // current product lists and can be mutated by admin controls.
  const categories = {
    water: { items: products.water, container: document.getElementById('product-list-water') },
    med: { items: products.med, container: document.getElementById('product-list-med') },
    other: { items: products.other, container: document.getElementById('product-list-other') },
  };
  // Clear any existing rows and append new ones
  Object.values(categories).forEach(({ items, container }) => {
    if (!container) return;
    container.innerHTML = '';
    items.forEach((item) => {
      container.appendChild(createProductRow(item));
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

  // Admin controls: add, remove and edit products. These prompt the
  // user for basic information and mutate the `products` object.
  const addBtn = document.getElementById('add-product-btn');
  const removeBtn = document.getElementById('remove-product-btn');
  const editBtn = document.getElementById('edit-product-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const category = prompt('เลือกหมวด (water, med, other):');
      if (!category || !products[category]) {
        alert('หมวดไม่ถูกต้อง');
        return;
      }
      const productName = prompt('ชื่อสินค้า:');
      if (!productName) return;
      let mix = 'ไม่มี';
      if (category === 'water') {
        mix = prompt('รส/ผสม (เช่น ผสมเงิน, ผสมเงินซิ เป็นต้น):') || 'ไม่มี';
      }
      const priceStr = prompt('ราคาต่อหน่วย (ตัวเลข):');
      const price = parseFloat(priceStr);
      if (isNaN(price)) {
        alert('ราคาผิดพลาด');
        return;
      }
      products[category].push({ product: productName, mix, price });
      mountProducts();
    });
  }
  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      const category = prompt('เลือกหมวดของสินค้าที่ต้องการลบ (water, med, other):');
      if (!category || !products[category]) {
        alert('หมวดไม่ถูกต้อง');
        return;
      }
      const productName = prompt('ชื่อสินค้า:');
      if (!productName) return;
      let mix = 'ไม่มี';
      if (category === 'water') {
        mix = prompt('รส/ผสมที่ต้องการลบ (หรือเว้นว่างถ้าสินค้าไม่มีผสม):') || 'ไม่มี';
      }
      const idx = products[category].findIndex((item) => item.product === productName && item.mix === mix);
      if (idx === -1) {
        alert('ไม่พบสินค้าที่ระบุ');
        return;
      }
      products[category].splice(idx, 1);
      mountProducts();
    });
  }
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      const category = prompt('เลือกหมวดของสินค้าที่ต้องการแก้ไข (water, med, other):');
      if (!category || !products[category]) {
        alert('หมวดไม่ถูกต้อง');
        return;
      }
      const productName = prompt('ชื่อสินค้า:');
      if (!productName) return;
      let mix = 'ไม่มี';
      if (category === 'water') {
        mix = prompt('รส/ผสมที่ต้องการแก้ไข (หรือเว้นว่างถ้าสินค้าไม่มีผสม):') || 'ไม่มี';
      }
      const item = products[category].find((p) => p.product === productName && p.mix === mix);
      if (!item) {
        alert('ไม่พบสินค้าที่ระบุ');
        return;
      }
      const newPriceStr = prompt('กรุณาระบุราคาใหม่:', item.price);
      const newPrice = parseFloat(newPriceStr);
      if (isNaN(newPrice)) {
        alert('ราคาผิดพลาด');
        return;
      }
      item.price = newPrice;
      mountProducts();
    });
  }
});
