// compare.js
// Implements sales comparison across different dates or date ranges. This
// module is largely unchanged from the original project. It fetches
// all sales for the current user, filters them by the selected
// product and dates, then displays quantity and revenue comparisons
// along with a bar chart.

import { auth, database } from './firebase.js';
import { isSameDay, formatDateThai } from './utils/date.js';

/**
 * Populate the product dropdown with all products the current user has
 * sold. Includes a special option to compare all products. Called
 * whenever the compare page is shown.
 */
export function populateProductSelect() {
  const productSelect = document.getElementById('product-select');
  productSelect.innerHTML = '';
  const user = auth.currentUser;
  if (!user) return;
  const salesRef = database.ref('sales/' + user.uid);
  salesRef.once('value', (snapshot) => {
    const data = snapshot.val();
    const setP = new Set();
    if (data) Object.values(data).forEach((s) => setP.add(s.product));
    const defaultOption = new Option('เลือกสินค้า...', '');
    const allItems = new Option('สินค้าทั้งหมด', 'all');
    productSelect.add(defaultOption);
    productSelect.add(allItems);
    Array.from(setP).forEach((p) => productSelect.add(new Option(p, p)));
  });
}

/**
 * Switch between comparison modes (day-to-day or date-range) by
 * toggling which form is visible. Clears previous comparison data.
 * @param {string} mode
 */
export function switchCompareMode(mode) {
  document.querySelectorAll('.compare-mode-form').forEach((f) => f.classList.remove('active'));
  document.getElementById(mode + '-mode').classList.add('active');
  clearComparison();
}

/**
 * Clear the comparison result area and display the no data message.
 */
export function clearComparison() {
  document.getElementById('detailed-comparison-result').innerHTML = '';
  document.getElementById('no-comparison-data').style.display = 'block';
}

/**
 * Entry point when the compare button is clicked. Validates inputs
 * based on the selected mode and triggers data loading and display.
 */
export function compareSales() {
  const mode = document.getElementById('compare-mode-select').value;
  const selectedProduct = document.getElementById('product-select').value;
  document.getElementById('no-comparison-data').style.display = 'none';
  if (!selectedProduct) {
    alert('กรุณาเลือกสินค้าที่ต้องการเปรียบเทียบ');
    return;
  }
  const user = auth.currentUser;
  if (!user) return;
  const salesRef = database.ref('sales/' + user.uid);
  salesRef.once('value', (snapshot) => {
    const salesData = snapshot.val();
    if (!salesData) {
      document.getElementById('no-comparison-data').style.display = 'block';
      return;
    }
    let salesData1 = [],
      salesData2 = [],
      label1,
      label2,
      comparisonProducts;
    if (mode === 'day-to-day') {
      const d1 = document.getElementById('compare-date-1').value;
      const d2 = document.getElementById('compare-date-2').value;
      if (!d1 || !d2) {
        alert('กรุณาเลือกวันที่ทั้งสองวัน');
        return;
      }
      const D1 = new Date(d1),
        D2 = new Date(d2);
      salesData1 = Object.values(salesData).filter((i) => isSameDay(new Date(i.timestamp), D1));
      salesData2 = Object.values(salesData).filter((i) => isSameDay(new Date(i.timestamp), D2));
      label1 = formatDateThai(d1);
      label2 = formatDateThai(d2);
    } else {
      const s1 = document.getElementById('start-date-1').value;
      const e1 = document.getElementById('end-date-1').value;
      const s2 = document.getElementById('start-date-2').value;
      const e2 = document.getElementById('end-date-2').value;
      if (!s1 || !e1 || !s2 || !e2) {
        alert('กรุณาเลือกช่วงวันที่ทั้งสองช่วง');
        return;
      }
      const S1 = new Date(s1),
        E1 = new Date(e1);
      const S2 = new Date(s2),
        E2 = new Date(e2);
      salesData1 = Object.values(salesData).filter((i) => {
        const d = new Date(i.timestamp);
        return d >= S1 && d <= new Date(E1.getFullYear(), E1.getMonth(), E1.getDate(), 23, 59, 59);
      });
      salesData2 = Object.values(salesData).filter((i) => {
        const d = new Date(i.timestamp);
        return d >= S2 && d <= new Date(E2.getFullYear(), E2.getMonth(), E2.getDate(), 23, 59, 59);
      });
      label1 = 'ช่วงที่ 1';
      label2 = 'ช่วงที่ 2';
    }
    if (selectedProduct === 'all') {
      const setAll = new Set();
      salesData1.forEach((i) => setAll.add(i.product));
      salesData2.forEach((i) => setAll.add(i.product));
      comparisonProducts = Array.from(setAll);
    } else {
      comparisonProducts = [selectedProduct];
    }
    const comp = {
      [label1]: comparisonProducts.map((p) => calc(salesData1, p)),
      [label2]: comparisonProducts.map((p) => calc(salesData2, p)),
    };
    updateComparisonDisplay(comparisonProducts, comp, [label1, label2]);
  });
}

// Helpers
function calc(data, productName) {
  let q = 0,
    r = 0;
  data
    .filter((i) => i.product === productName)
    .forEach((i) => {
      q += i.quantity;
      r += i.totalPrice;
    });
  return { quantity: q, revenue: r };
}

function updateComparisonDisplay(products, data, labels) {
  const resultDiv = document.getElementById('detailed-comparison-result');
  const noDataEl = document.getElementById('no-comparison-data');
  resultDiv.innerHTML = '';
  const s1 = data[labels[0]];
  const s2 = data[labels[1]];
  const hasData = s1.some((s) => s.quantity > 0) || s2.some((s) => s.quantity > 0);
  if (!hasData) {
    noDataEl.style.display = 'block';
    return;
  }
  noDataEl.style.display = 'none';
  const table = document.createElement('table');
  table.classList.add('comparison-result-table');
  const header = `
    <tr>
      <th>สินค้า</th>
      <th colspan="2">${labels[0]}</th>
      <th colspan="2">${labels[1]}</th>
    </tr>
    <tr>
      <th></th>
      <th>จำนวน</th><th>จำนวนเงิน</th>
      <th>จำนวน</th><th>จำนวนเงิน</th>
    </tr>
  `;
  let body = '';
  products.forEach((p, idx) => {
    body += `
      <tr>
        <td>${p}</td>
        <td>${s1[idx].quantity}</td>
        <td>${s1[idx].revenue.toLocaleString()}</td>
        <td>${s2[idx].quantity}</td>
        <td>${s2[idx].revenue.toLocaleString()}</td>
      </tr>
    `;
  });
  table.innerHTML = header + body;
  resultDiv.appendChild(table);
  // Draw chart using Chart.js
  const chartContainer = document.querySelector('.chart-container');
  chartContainer.innerHTML = '<canvas id="comparisonChart"></canvas>';
  const ctx = document.getElementById('comparisonChart');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: products,
      datasets: [
        { label: `ยอดขาย (บาท) - ${labels[0]}`, data: s1.map((x) => x.revenue) },
        { label: `ยอดขาย (บาท) - ${labels[1]}`, data: s2.map((x) => x.revenue) },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'ยอดขาย (บาท)' } },
      },
    },
  });
}
