// customerSearch.js
//
// Adds customer search functionality to the summary page. A text input and
// button (rendered in index.html) allow the user to enter part of a customer
// name and retrieve their cumulative purchase history from Firebase. The
// results are displayed in the same layout as the daily report without
// refreshing the page. If the input is left empty and the search button
// is pressed, the view is reset back to the default daily summary by reusing
// the existing loadReport() function from report.js.

import { loadReport, deleteSaleItem } from './report.js';
import { auth, database } from './firebase.js';

/**
 * Display a "customer not found" message and clear the report contents.
 * This function resets all summary values and shows a message in the
 * #no-data element to indicate that the search returned no results.
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
 * constructs the summary totals, product summary list and the detailed
 * table similarly to loadReport() but using the customer data returned
 * from buildCustomerProfile(). It also wires up delete buttons using
 * deleteSaleItem() imported from report.js.
 *
 * @param {Object} data - Customer profile data
 * @param {string} customerName - Name entered by the user for display fallback
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
      const isTransfer = rec.transfer === true || rec.transfer === 'true' || rec.transfer === 1 || rec.transfer === '1';
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
          // Show actual customer name if available, otherwise fallback to the search keyword
          const displayName = rec.customerName || customerName;
          nameTd.innerHTML = `<span class="customer-name">${displayName}</span> · <span class="${isFree ? 'free-label' : ''}">${itemName}</span>`;
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

/**
 * Build a summary of sales filtered by customer name. Reads all sales for
 * the current user from Firebase, filters them by a case‑insensitive
 * partial match on the provided name and produces an aggregate summary.
 *
 * @param {string} searchName - partial name to search
 * @returns {Object|null} summary object or null if no matches
 */
async function buildCustomerProfile(searchName) {
  const lowerName = searchName.toLowerCase();
  const user = auth.currentUser;
  if (!user) {
    return null;
  }
  const snapshot = await database.ref('sales/' + user.uid).once('value');
  const salesData = snapshot.val();
  if (!salesData) {
    return null;
  }
  const records = Object.keys(salesData).map((id) => ({ id, ...salesData[id] }));
  // Filter by name containing search string
  const matched = records.filter((rec) => {
    const name = (rec.customerName || '').toLowerCase();
    return name.includes(lowerName);
  });
  if (matched.length === 0) {
    return null;
  }
  // Aggregate totals and build purchases list
  let totalRevenue = 0;
  let bottleCount = 0;
  let otherCount = 0;
  const productSummary = {};
  const purchases = [];
  function accumulateSummary(key, quantity, unit) {
    if (!productSummary[key]) {
      productSummary[key] = { quantity: 0, unit };
    }
    productSummary[key].quantity += quantity;
  }
  matched.forEach((rec) => {
    const isAggregated = rec.items && Array.isArray(rec.items);
    if (isAggregated) {
      totalRevenue += rec.totalPrice || 0;
      rec.items.forEach((itm) => {
        const qty = itm.quantity || 0;
        const unit = itm.unit || 'ขวด';
        if (unit === 'ขวด') bottleCount += qty;
        else otherCount += qty;
        const key = itm.mix && itm.mix !== 'ไม่มี' ? `${itm.product} (${itm.mix})` : itm.product;
        accumulateSummary(key, qty, unit);
      });
      purchases.push({
        id: rec.id,
        timestamp: rec.timestamp,
        transfer: rec.transfer,
        items: rec.items.map((itm) => ({
          product: itm.product,
          mix: itm.mix,
          unit: itm.unit,
          quantity: itm.quantity,
          totalPrice: itm.totalPrice,
        })),
        totalPrice: rec.totalPrice,
        customerName: rec.customerName || '',
      });
    } else {
      const qty = rec.quantity || 0;
      const unit = rec.unit || 'ขวด';
      totalRevenue += rec.totalPrice || (rec.pricePerUnit || 0) * qty;
      if (unit === 'ขวด') bottleCount += qty;
      else otherCount += qty;
      const key = rec.mix && rec.mix !== 'ไม่มี' ? `${rec.product} (${rec.mix})` : rec.product;
      accumulateSummary(key, qty, unit);
      purchases.push({
        id: rec.id,
        timestamp: rec.timestamp,
        transfer: rec.transfer,
        items: [
          {
            product: rec.product,
            mix: rec.mix,
            unit: rec.unit,
            quantity: rec.quantity,
            totalPrice: rec.totalPrice,
          },
        ],
        totalPrice: rec.totalPrice,
        customerName: rec.customerName || '',
      });
    }
  });
  return {
    totalRevenue,
    totalQuantity: {
      bottles: bottleCount,
      others: otherCount,
    },
    productSummary,
    purchases,
  };
}

// Initialise customer search functionality once the DOM is ready. This
// listens for click events on the search button, builds the customer
// profile locally using Firebase and updates the UI. If the input is
// blank, it resets the view to the default daily summary by invoking
// loadReport().
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('customerNameInput');
  const searchButton = document.getElementById('searchButton');
  if (!searchInput || !searchButton) return;
  searchButton.addEventListener('click', async () => {
    const name = searchInput.value.trim();
    // When the input is empty, revert to the standard daily report
    if (name === '') {
      const noDataEl = document.getElementById('no-data');
      if (noDataEl) noDataEl.textContent = 'ไม่พบข้อมูลการขายในวันที่เลือก';
      loadReport();
      return;
    }
    try {
      const data = await buildCustomerProfile(name);
      if (!data) {
        showNoCustomer();
        return;
      }
      updateUIWithCustomerData(data, name);
    } catch (err) {
      showNoCustomer();
    }
  });
});
