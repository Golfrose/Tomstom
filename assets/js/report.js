// report.js
import { auth, database } from './firebase.js';

let currentQuery = null;

export function loadReport() {
  const selectedDateStr = document.getElementById('report-date').value;
  const reportBody = document.getElementById('report-body');
  const totalRevenueEl = document.getElementById('total-revenue');
  const totalQuantityEl = document.getElementById('total-quantity');
  const productSummaryListEl = document.getElementById('product-summary-list');
  const noDataEl = document.getElementById('no-data');

  // เคลียร์ข้อมูลเก่าในตารางรายงาน
  reportBody.innerHTML = '';
  productSummaryListEl.innerHTML = '';
  totalRevenueEl.textContent = '0';
  totalQuantityEl.textContent = '0';

  const user = auth.currentUser;
  if (!user) return;
  const salesRef = database.ref('sales/' + user.uid);

  // ยกเลิกการฟังของวันที่ก่อนหน้า (ถ้ามี)
  if (currentQuery) {
    currentQuery.off('value');
    currentQuery = null;
  }

  // ใช้ query เฉพาะรายการขายของวันที่เลือก และฟังข้อมูลแบบเรียลไทม์
  const startTimestamp = new Date(selectedDateStr + 'T00:00:00').getTime();
  const endTimestamp = new Date(selectedDateStr + 'T23:59:59.999').getTime();
  const query = salesRef.orderByChild('timestamp').startAt(startTimestamp).endAt(endTimestamp);
  currentQuery = query;
  query.on('value', snapshot => {
    const salesData = snapshot.val();
    if (!salesData) {
      noDataEl.style.display = 'block';
      reportBody.innerHTML = '';
      productSummaryListEl.innerHTML = '';
      totalRevenueEl.textContent = '0';
      totalQuantityEl.textContent = '0';
      return;
    }
    const items = Object.keys(salesData).map(id => ({ id, ...salesData[id] }));
    if (items.length === 0) {
      noDataEl.style.display = 'block';
      reportBody.innerHTML = '';
      productSummaryListEl.innerHTML = '';
      totalRevenueEl.textContent = '0';
      totalQuantityEl.textContent = '0';
      return;
    }
    noDataEl.style.display = 'none';

    let totalRevenue = 0;
    let totalQuantity = 0;
    const productSummary = {};
    reportBody.innerHTML = '';
    productSummaryListEl.innerHTML = '';

    items.forEach(item => {
      totalRevenue += item.totalPrice;
      totalQuantity += item.quantity;
      const summaryKey = (item.mix && item.mix !== 'ไม่มี')
        ? `${item.product} (${item.mix})`
        : item.product;
      productSummary[summaryKey] = (productSummary[summaryKey] || 0) + item.quantity;

      const tr = document.createElement('tr');
      const displayDate = new Date(item.timestamp).toLocaleString('th-TH', {
        day: 'numeric', month: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      const productClass = item.product.includes('แลกขวดฟรี') ? 'report-free' : '';
      tr.innerHTML = `
        <td>${displayDate}</td>
        <td class="${productClass}">${item.product} ${item.mix !== 'ไม่มี' ? `(${item.mix})` : ''}</td>
        <td>${item.quantity}</td>
        <td>${item.pricePerUnit}</td>
        <td>${item.totalPrice.toLocaleString()}</td>
        <td class="summary-actions">
          <button class="edit-btn" data-id="${item.id}">แก้</button>
          <button class="delete-btn" data-id="${item.id}">ลบ</button>
        </td>
      `;
      reportBody.appendChild(tr);
    });

    totalRevenueEl.textContent = totalRevenue.toLocaleString();
    totalQuantityEl.textContent = totalQuantity.toLocaleString();

    for (const key in productSummary) {
      const li = document.createElement('li');
      li.textContent = `${key}: ${productSummary[key]} ขวด`;
      if (key.includes('แลกขวดฟรี')) {
        li.classList.add('report-free');
      }
      productSummaryListEl.appendChild(li);
    }

    // ผูก event ให้ปุ่มแก้ไข/ลบ หลังจากสร้างแถวตารางแล้ว
    reportBody.querySelectorAll('.edit-btn').forEach(btn =>
      btn.addEventListener('click', () => editSaleItem(btn.dataset.id))
    );
    reportBody.querySelectorAll('.delete-btn').forEach(btn =>
      btn.addEventListener('click', () => deleteSaleItem(btn.dataset.id))
    );
  });
}

export function editSaleItem(itemId) {
  const newQuantity = prompt('แก้ไขจำนวน:');
  const q = parseInt(newQuantity);
  if (isNaN(q) || q <= 0) {
    alert('จำนวนไม่ถูกต้อง');
    return;
  }
  const user = auth.currentUser;
  const itemRef = database.ref('sales/' + user.uid + '/' + itemId);
  itemRef.once('value').then(snapshot => {
    const item = snapshot.val();
    if (item) {
      itemRef.update({
        quantity: q,
        totalPrice: q * item.pricePerUnit
      }).then(() => {
        alert('แก้ไขรายการเรียบร้อย!');
        // การเปลี่ยนแปลงจะสะท้อนในรายงานทันทีผ่านการฟังแบบเรียลไทม์
      });
    }
  });
}

export function deleteSaleItem(itemId) {
  if (!confirm('ต้องการลบรายการนี้ใช่ไหม?')) return;
  const user = auth.currentUser;
  const itemRef = database.ref('sales/' + user.uid + '/' + itemId);
  itemRef.remove().then(() => {
    alert('ลบรายการเรียบร้อย!');
    // การเปลี่ยนแปลงจะสะท้อนในรายงานทันทีผ่านการฟังแบบเรียลไทม์
  });
}