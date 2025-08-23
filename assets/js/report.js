// report.js
// Generate and display sales reports. This module was copied from the
// original project with minimal changes to support the updated UI. It
// filters sales by date and calculates totals, product summaries and
// transfer totals. Each row in the report includes edit and delete
// buttons which call back into this module.

import { auth, database } from './firebase.js';
import { isSameDay } from './utils/date.js';

/**
 * Load sales data for the selected date and render it in the report
 * table. Calculates total revenue, quantity sold and transfer revenue
 * separately.
 */
export function loadReport() {
  const selectedDateStr = document.getElementById('report-date').value;
  const reportBody = document.getElementById('report-body');
  const totalRevenueEl = document.getElementById('total-revenue');
  // Elements for displaying total quantities. total-quantity-left shows
  // the number of bottles sold, quantity-unit displays the unit label
  // (usually "ขวด"), and total-quantity-right shows the sum of all
  // non-bottle units sold. The previous element with id
  // "total-quantity" has been split into these three parts.
  const totalQuantityLeftEl = document.getElementById('total-quantity-left');
  const quantityUnitEl = document.getElementById('quantity-unit');
  const totalQuantityRightEl = document.getElementById('total-quantity-right');
  const productSummaryListEl = document.getElementById('product-summary-list');
  const noDataEl = document.getElementById('no-data');
  reportBody.innerHTML = '';
  productSummaryListEl.innerHTML = '';
  totalRevenueEl.textContent = '0';
  // Reset quantity displays
  if (totalQuantityLeftEl) totalQuantityLeftEl.textContent = '0';
  if (quantityUnitEl) quantityUnitEl.textContent = 'ขวด';
  if (totalQuantityRightEl) totalQuantityRightEl.textContent = '0';
  const user = auth.currentUser;
  if (!user) return;
  const salesRef = database.ref('sales/' + user.uid);
  salesRef.once('value', (snapshot) => {
    const salesData = snapshot.val();
    if (!salesData) {
      noDataEl.style.display = 'block';
      return;
    }
    const filteredData = Object.keys(salesData)
      .map((id) => ({ id, ...salesData[id] }))
      .filter((rec) => isSameDay(new Date(rec.timestamp), new Date(selectedDateStr)));
    if (filteredData.length === 0) {
      noDataEl.style.display = 'block';
      return;
    }
    noDataEl.style.display = 'none';
    // Prepare totals and product summary. Summary values hold quantity and unit.
    let totalRevenue = 0;
    let transferRevenue = 0;
    let totalQuantity = 0;
    // Track quantities by unit. bottleCount counts items measured in 'ขวด',
    // while otherCount aggregates all other units. These values are
    // displayed as `bottleCount ขวด / otherCount` in the summary box.
    let bottleCount = 0;
    let otherCount = 0;
    const productSummary = {};
    function accumulateSummary(key, quantity, unit) {
      if (!productSummary[key]) {
        productSummary[key] = { quantity: 0, unit };
      }
      productSummary[key].quantity += quantity;
    }
    // Loop through each sale record
    filteredData.forEach((rec) => {
      const isTransfer =
        rec.transfer === true ||
        rec.transfer === 'true' ||
        rec.transfer === 1 ||
        rec.transfer === '1';
      if (rec.items && Array.isArray(rec.items)) {
        // Aggregated sale
        totalRevenue += rec.totalPrice;
        totalQuantity += rec.totalQuantity || rec.items.reduce((sum, itm) => sum + itm.quantity, 0);
        if (isTransfer) transferRevenue += rec.totalPrice;
        const saleItems = rec.items;
        const displayDate = new Date(rec.timestamp).toLocaleString('th-TH', {
          day: 'numeric',
          month: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        const customerName = rec.customerName || '';
        saleItems.forEach((itm, index) => {
          // Accumulate bottle vs other unit counts
          const currentUnit = itm.unit || 'ขวด';
          if (currentUnit === 'ขวด') {
            bottleCount += itm.quantity;
          } else {
            otherCount += itm.quantity;
          }
          // Build summary key
          const summaryKey =
            itm.mix && itm.mix !== 'ไม่มี'
              ? `${itm.product} (${itm.mix})`
              : itm.product;
          accumulateSummary(summaryKey, itm.quantity, itm.unit || 'ขวด');
          const tr = document.createElement('tr');
          // Set transfer class if sale is transfer
          if (isTransfer) tr.classList.add('transfer-row');
          // Determine if current item is a free item
          const isFree =
            itm.product.includes('แลกฟรี') ||
            (itm.mix && itm.mix.includes('แลกฟรี'));
          // Date cell
          const dateTd = document.createElement('td');
          dateTd.textContent = index === 0 ? displayDate : '';
          tr.appendChild(dateTd);
          // Name cell
          const nameTd = document.createElement('td');
          let itemName = itm.product;
          if (itm.mix && itm.mix !== 'ไม่มี') itemName += ` (${itm.mix})`;
          if (index === 0 && customerName) {
            nameTd.innerHTML = `<span class="customer-name">${customerName}</span> · <span class="${
              isFree ? 'free-label' : ''
            }">${itemName}</span>`;
          } else {
            nameTd.innerHTML = `&bull; <span class="${
              isFree ? 'free-label' : ''
            }">${itemName}</span>`;
          }
          tr.appendChild(nameTd);
          // Quantity cell with unit
          const qtyTd = document.createElement('td');
          qtyTd.textContent = `${itm.quantity} ${itm.unit || ''}`.trim();
          tr.appendChild(qtyTd);
          // Total cell: only show on last row of sale
          const totalTd = document.createElement('td');
          totalTd.textContent = index === saleItems.length - 1 ? rec.totalPrice.toLocaleString() : '';
          tr.appendChild(totalTd);
          // Actions cell: only on last row
          const actionsTd = document.createElement('td');
          if (index === saleItems.length - 1) {
            // For aggregated sale, editing is disabled
            actionsTd.innerHTML = `
              <button class="delete-btn" data-id="${rec.id}">ลบ</button>
            `;
            // Mark end of sale group to draw yellow border at the bottom
            tr.classList.add('sale-group-end');
          }
          tr.appendChild(actionsTd);
          // Mark each row as part of an aggregated sale group for vertical yellow borders
          tr.classList.add('sale-group');
          reportBody.appendChild(tr);
        });
      } else {
        // Legacy single-item sale
        totalRevenue += rec.totalPrice;
        totalQuantity += rec.quantity;
        if (isTransfer) transferRevenue += rec.totalPrice;
        // Accumulate bottle vs other unit counts for legacy sales
        {
          const unit = rec.unit || 'ขวด';
          if (unit === 'ขวด') {
            bottleCount += rec.quantity;
          } else {
            otherCount += rec.quantity;
          }
        }
        const displayDate = new Date(rec.timestamp).toLocaleString('th-TH', {
          day: 'numeric',
          month: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        const tr = document.createElement('tr');
        // Determine if this sale is a free item
        const isFree =
          rec.product.includes('แลกฟรี') ||
          (rec.mix && rec.mix.includes('แลกฟรี'));
        if (isTransfer) tr.classList.add('transfer-row');
        // Build summary key
        const summaryKey =
          rec.mix && rec.mix !== 'ไม่มี'
            ? `${rec.product} (${rec.mix})`
            : rec.product;
        accumulateSummary(summaryKey, rec.quantity, rec.unit || 'ขวด');
        // Date cell
        const dateTd = document.createElement('td');
        dateTd.textContent = displayDate;
        tr.appendChild(dateTd);
        // Name cell
        const nameTd = document.createElement('td');
        let itemName = rec.product;
        if (rec.mix && rec.mix !== 'ไม่มี') itemName += ` (${rec.mix})`;
        nameTd.innerHTML = `<span class="${isFree ? 'free-label' : ''}">${itemName}</span>`;
        tr.appendChild(nameTd);
        // Quantity cell with unit
        const qtyTd = document.createElement('td');
        qtyTd.textContent = `${rec.quantity} ${rec.unit || ''}`.trim();
        tr.appendChild(qtyTd);
        // Total cell: show total price
        const totalTd = document.createElement('td');
        totalTd.textContent = rec.totalPrice.toLocaleString();
        tr.appendChild(totalTd);
        // Actions cell: allow edit and delete for legacy items
        const actionsTd = document.createElement('td');
        actionsTd.innerHTML = `
          <button class="edit-btn" data-id="${rec.id}">แก้</button>
          <button class="delete-btn" data-id="${rec.id}">ลบ</button>
        `;
        tr.appendChild(actionsTd);
        // Add a separator line after each legacy sale
        tr.classList.add('sale-separator');
        reportBody.appendChild(tr);
      }
    });
    // Update totals. Show total revenue (cash + transfer) on the left and transfer revenue on the right.
    // Use the .total-value class for the combined revenue so it appears green like cash in the original design.
    totalRevenueEl.innerHTML = `<span class="total-value">${totalRevenue.toLocaleString()}</span> / <span class="transfer-value">${transferRevenue.toLocaleString()}</span>`;
    // Update quantity summary. Display bottles on the left and
    // non‑bottle units on the right separated by a slash. The right
    // number will be styled red via CSS.
    if (totalQuantityLeftEl) totalQuantityLeftEl.textContent = bottleCount.toLocaleString();
    // Show the unit only if there are bottles sold; otherwise leave blank
    if (quantityUnitEl) quantityUnitEl.textContent = bottleCount > 0 ? 'ขวด' : '';
    if (totalQuantityRightEl) totalQuantityRightEl.textContent = otherCount.toLocaleString();
    // Populate product summary list
    for (const k in productSummary) {
      const li = document.createElement('li');
      const { quantity, unit } = productSummary[k];
      li.textContent = `${k}: ${quantity} ${unit}`;
      // Highlight free items in the summary list
      if (k.includes('แลกฟรี')) {
        li.classList.add('report-free');
      }
      productSummaryListEl.appendChild(li);
    }
    // Attach edit/delete handlers for legacy items and delete for aggregated sales
    reportBody.querySelectorAll('.edit-btn').forEach((btn) =>
      btn.addEventListener('click', function () {
        editSaleItem(this.dataset.id);
      }),
    );
    reportBody.querySelectorAll('.delete-btn').forEach((btn) =>
      btn.addEventListener('click', function () {
        deleteSaleItem(this.dataset.id);
      }),
    );
  });
}

/**
 * Prompt the user for a new quantity and update the selected sale item.
 * @param {string} itemId
 */
export function editSaleItem(itemId) {
  const newQuantity = prompt('แก้ไขจำนวน:');
  const q = parseInt(newQuantity, 10);
  if (isNaN(q) || q <= 0) {
    alert('จำนวนไม่ถูกต้อง');
    return;
  }
  const user = auth.currentUser;
  const itemRef = database.ref('sales/' + user.uid + '/' + itemId);
  itemRef.once('value', (snapshot) => {
    const item = snapshot.val();
    if (item) {
      itemRef
        .update({
          quantity: q,
          totalPrice: q * item.pricePerUnit,
        })
        .then(() => {
          loadReport();
          alert('แก้ไขรายการเรียบร้อย!');
        });
    }
  });
}

/**
 * Delete a sale item after user confirmation.
 * @param {string} itemId
 */
export function deleteSaleItem(itemId) {
  if (!confirm('ต้องการลบรายการนี้ใช่ไหม?')) return;
  const user = auth.currentUser;
  const itemRef = database.ref('sales/' + user.uid + '/' + itemId);
  itemRef.remove().then(() => {
    loadReport();
    alert('ลบรายการเรียบร้อย!');
  });
}
