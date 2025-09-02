// customerSearch.js
//
// This module adds customer search functionality to the summary page. A
// text input and button (rendered in index.html) allow the user to
// enter a customer's name and retrieve their cumulative purchase
// history from a backend endpoint. The results are displayed in the
// same layout as the daily report without refreshing the page. If the
// input is left empty and the search button is pressed, the view is
// reset back to the default daily summary by reusing the existing
// loadReport() function from report.js.

import { loadReport, deleteSaleItem } from './report.js';

/**
 * Display a "customer not found" message and clear the report
 * contents. This function resets all summary values and shows a
 * message in the #no-data element to indicate that the search
 * returned no results.
 */
function showNoCustomer() {
  const totalRevenueEl = document.getElementById('total-revenue');
  const totalQuantityLeftEl = document.getElementById('total-quantity-left');
  const quantityUnitEl = document.getElementById('quantity-unit');
  const totalQuantityRightEl = document.getElementById('total-quantity-right');
  const productSummaryListEl = document.getElementById('product-summary-list');
  const reportBody = document.getElementById('report-body');
  const noDataEl = document.getElementById('no-data');
  // Clear totals
  if (totalRevenueEl) totalRevenueEl.textContent = '0';
  if (totalQuantityLeftEl) totalQuantityLeftEl.textContent = '0';
  if (quantityUnitEl) quantityUnitEl.textContent = 'ขวด';
  if (totalQuantityRightEl) totalQuantityRightEl.textContent = '0';
  // Clear lists
  if (productSummaryListEl) productSummaryListEl.innerHTML = '';
  if (reportBody) reportBody.innerHTML = '';
  // Show not found message
  if (noDataEl) {
    noDataEl.textContent = 'ไม่พบลูกค้า';
    noDataEl.style.display = 'block';
  }
}

/**
 * Render customer purchase data into the summary page. This function
 * constructs the summary totals, product summary list and the
 * detailed table similarly to loadReport() but using the customer
 * data returned from the backend. It also wires up delete buttons
 * using deleteSaleItem() imported from report.js.
 *
 * @param {Object} data - Customer profile data returned by the API
 * @param {string} customerName - Name entered by the user for display
 */
function updateUIWithCustomerData(data, customerName) {
  const totalRevenueEl = document.getElementById('total-revenue');
  const totalQuantityLeftEl = document.getElementById('total-quantity-left');
  const quantityUnitEl = document.getElementById('quantity-unit');
  const totalQuantityRightEl = document.getElementById('total-quantity-right');
  const productSummaryListEl = document.getElementById('product-summary-list');
  const reportBody = document.getElementById('report-body');
  const noDataEl = document.getElementById('no-data');
  // Hide "no data" message if present
  if (noDataEl) {
    noDataEl.style.display = 'none';
    noDataEl.textContent = 'ไม่พบข้อมูลการขายในวันที่เลือก';
  }
  // Default totals when data is missing
  const totalRevenue = data?.totalRevenue ?? 0;
  const bottleCount = data?.totalQuantity?.bottles ?? 0;
  const otherCount = data?.totalQuantity?.others ?? 0;
  // Update total revenue
  if (totalRevenueEl) totalRevenueEl.textContent = Number(totalRevenue).toLocaleString();
  // Update quantity counters
  if (totalQuantityLeftEl) totalQuantityLeftEl.textContent = bottleCount;
  if (quantityUnitEl) quantityUnitEl.textContent = 'ขวด';
  if (totalQuantityRightEl) totalQuantityRightEl.textContent = otherCount;
  // Render product summary list
  if (productSummaryListEl) {
    productSummaryListEl.innerHTML = '';
    const summary = data?.productSummary || {};
    Object.keys(summary).forEach((k) => {
      const { quantity, unit } = summary[k];
      const li = document.createElement('li');
      li.textContent = `${k}: ${quantity} ${unit || ''}`.trim();
      // Highlight free items
      if (k.includes('แลกฟรี')) li.classList.add('report-free');
      productSummaryListEl.appendChild(li);
    });
  }
  // Render detailed purchases table
  if (reportBody) {
    reportBody.innerHTML = '';
    const purchases = Array.isArray(data?.purchases) ? data.purchases.slice() : [];
    // Sort by timestamp descending
    purchases.sort((a, b) => {
      const aTime = new Date(a.timestamp || 0).getTime();
      const bTime = new Date(b.timestamp || 0).getTime();
      return bTime - aTime;
    });
    purchases.forEach((rec) => {
      const isTransfer =
        rec.transfer === true || rec.transfer === 'true' || rec.transfer === 1 || rec.transfer === '1';
      const items = Array.isArray(rec.items) ? rec.items : [];
      const displayDate = new Date(rec.timestamp).toLocaleString('th-TH', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      items.forEach((itm, index) => {
        const tr = document.createElement('tr');
        // Apply transfer styling
        if (isTransfer) tr.classList.add('transfer-row');
        // Date column
        const dateTd = document.createElement('td');
        dateTd.textContent = index === 0 ? displayDate : '';
        tr.appendChild(dateTd);
        // Name/Product column
        const nameTd = document.createElement('td');
        let itemName = itm.product;
        if (itm.mix && itm.mix !== 'ไม่มี') itemName += ` (${itm.mix})`;
        const isFree = itm.product?.includes('แลกฟรี') || (itm.mix && itm.mix.includes('แลกฟรี'));
        if (index === 0) {
          // Show customer name on first row
          nameTd.innerHTML = `<span class="customer-name">${customerName}</span> · <span class="${
            isFree ? 'free-label' : ''
          }">${itemName}</span>`;
        } else {
          nameTd.innerHTML = `&bull; <span class="${isFree ? 'free-label' : ''}">${itemName}</span>`;
        }
        tr.appendChild(nameTd);
        // Quantity column
        const qtyTd = document.createElement('td');
        const qty = itm.quantity != null ? itm.quantity : '';
        const unit = itm.unit || '';
        qtyTd.textContent = `${qty} ${unit}`.trim();
        tr.appendChild(qtyTd);
        // Total price column (only on last row)
        const totalTd = document.createElement('td');
        if (index === items.length - 1) {
          const totalPrice = rec.totalPrice != null ? rec.totalPrice : '';
          totalTd.textContent = totalPrice !== '' ? Number(totalPrice).toLocaleString() : '';
        } else {
          totalTd.textContent = '';
        }
        tr.appendChild(totalTd);
        // Actions column
        const actionsTd = document.createElement('td');
        if (index === items.length - 1 && rec.id) {
          actionsTd.innerHTML = `<button class="delete-btn" data-id="${rec.id}">ลบ</button>`;
          tr.classList.add('sale-group-end');
        }
        tr.appendChild(actionsTd);
        // Group classes for aggregated sale formatting
        tr.classList.add('sale-group');
        if (index === 0) tr.classList.add('sale-group-start');
        reportBody.appendChild(tr);
      });
    });
    // Attach delete handlers to new buttons
    reportBody.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', function () {
        const id = this.dataset.id;
        if (id) deleteSaleItem(id);
      });
    });
  }
}

// Initialise customer search functionality once the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('customerNameInput');
  const searchButton = document.getElementById('searchButton');
  if (!searchInput || !searchButton) return;
  searchButton.addEventListener('click', async () => {
    const name = searchInput.value.trim();
    // When the input is empty, revert to the standard daily report
    if (name === '') {
      // Restore original no-data message text
      const noDataEl = document.getElementById('no-data');
      if (noDataEl) noDataEl.textContent = 'ไม่พบข้อมูลการขายในวันที่เลือก';
      loadReport();
      return;
    }
    try {
      const response = await fetch(
        `/api/sales/customer-profile?name=${encodeURIComponent(name)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      if (!response.ok) {
        // 404 or other error => treat as no customer
        showNoCustomer();
        return;
      }
      const data = await response.json();
      if (!data || Object.keys(data).length === 0) {
        showNoCustomer();
        return;
      }
      updateUIWithCustomerData(data, name);
    } catch (err) {
      // On network or parsing errors, show not found
      showNoCustomer();
    }
  });
});