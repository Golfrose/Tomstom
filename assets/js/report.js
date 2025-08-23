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
  const totalQuantityEl = document.getElementById('total-quantity');
  const productSummaryListEl = document.getElementById('product-summary-list');
  const noDataEl = document.getElementById('no-data');
  reportBody.innerHTML = '';
  productSummaryListEl.innerHTML = '';
  totalRevenueEl.textContent = '0';
  totalQuantityEl.textContent = '0';
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
      .filter((item) => isSameDay(new Date(item.timestamp), new Date(selectedDateStr)));
    if (filteredData.length === 0) {
      noDataEl.style.display = 'block';
      return;
    }
    noDataEl.style.display = 'none';
    let totalRevenue = 0,
      totalQuantity = 0;
    let transferRevenue = 0;
    const productSummary = {};
    filteredData.forEach((item) => {
      totalRevenue += item.totalPrice;
      totalQuantity += item.quantity;
      const isTransfer =
        item.transfer === true || item.transfer === 'true' || item.transfer === 1 || item.transfer === '1';
      if (isTransfer) {
        transferRevenue += item.totalPrice;
      }
      const summaryKey = `${item.product} (${item.mix})`;
      productSummary[summaryKey] = (productSummary[summaryKey] || 0) + item.quantity;
      const tr = document.createElement('tr');
      const displayDate = new Date(item.timestamp).toLocaleString('th-TH', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      const displayLabel = item.customerName
        ? `${item.customerName} (${item.mix !== 'ไม่มี' ? item.mix : item.product})`
        : `${item.product}${item.mix !== 'ไม่มี' ? ` (${item.mix})` : ''}`;
      if (isTransfer) {
        tr.style.color = 'red';
      }
      tr.innerHTML = `
        <td>${displayDate}</td>
        <td>${displayLabel}</td>
        <td>${item.quantity}</td>
        <td>${item.pricePerUnit}</td>
        <td>${item.totalPrice.toLocaleString()}</td>
        <td>
          <button class="edit-btn" data-id="${item.id}">แก้</button>
          <button class="delete-btn" data-id="${item.id}">ลบ</button>
        </td>
      `;
      reportBody.appendChild(tr);
    });
    totalRevenueEl.innerHTML = `${totalRevenue.toLocaleString()} / ${transferRevenue.toLocaleString()} `;
    totalQuantityEl.textContent = totalQuantity.toLocaleString();
    for (const k in productSummary) {
      const li = document.createElement('li');
      li.textContent = `${k}: ${productSummary[k]} ขวด`;
      if (k.includes('แลกขวดฟรี')) li.classList.add('report-free');
      productSummaryListEl.appendChild(li);
    }
    // Attach edit/delete handlers
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
