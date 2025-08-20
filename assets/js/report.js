// report.js
import { auth, database } from './firebase.js';
import { isSameDay } from './utils/date.js';

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
    const filteredData = Object.keys(salesData).map(id => ({ id, ...salesData[id] }))
      .filter(item => isSameDay(new Date(item.timestamp), new Date(selectedDateStr)));

    if (filteredData.length === 0) {
      noDataEl.style.display = 'block';
      return;
    }
    noDataEl.style.display = 'none';

    let totalRevenue = 0, totalQuantity = 0;
    const productSummary = {};

    filteredData.forEach(item => {
      totalRevenue += item.totalPrice;
      totalQuantity += item.quantity;
      const key = `${item.product} (${item.mix})`;
      productSummary[key] = (productSummary[key] || 0) + item.quantity;

      const tr = document.createElement('tr');
      const displayDate = new Date(item.timestamp).toLocaleString('th-TH', {
        day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
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

    for (const k in productSummary) {
      const li = document.createElement('li');
      li.textContent = `${k}: ${productSummary[k]} ขวด`;
      if (k.includes('แลกขวดฟรี')) li.classList.add('report-free');
      productSummaryListEl.appendChild(li);
    }

    // bind edit/delete
    reportBody.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => editSaleItem(btn.dataset.id)));
    reportBody.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', () => deleteSaleItem(btn.dataset.id)));
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
  itemRef.once('value', (snapshot) => {
    const item = snapshot.val();
    if (item) {
      itemRef.update({
        quantity: q,
        totalPrice: q * item.pricePerUnit
      }).then(() => {
        loadReport();
        alert('แก้ไขรายการเรียบร้อย!');
      });
    }
  });
}

export function deleteSaleItem(itemId) {
  if (!confirm('ต้องการลบรายการนี้ใช่ไหม?')) return;
  const user = auth.currentUser;
  const itemRef = database.ref('sales/' + user.uid + '/' + itemId);
  itemRef.remove().then(() => {
    loadReport();
    alert('ลบรายการเรียบร้อย!');
  });
}

/* ===== CustomerName :: REPORT – APPEND-ONLY (ไม่แตะของเดิม) ===== */
(function(){
  const CND = window.CustomerNameData;
  if (!CND) return;

  // ถ้าระบบคุณมี hook ตอน "แปลงเอกสาร → แถวตาราง"
  // เราครอบฟังก์ชันที่พบบ่อยเพื่อแทนชื่อแสดง:
  function wrapRenderRow(name){
    const root = window;
    const fn = root[name];
    if (typeof fn !== 'function' || fn.__wrappedByCustomerName) return;
    const wrapped = function(item, ...rest){
      try{
        if (item) item = Object.assign({}, item, {
          // ให้คอลัมน์สินค้าใช้ displayName
          displayName: CND.getDisplayNameForRender(item)
        });
      } catch {}
      return fn.call(this, item, ...rest);
    };
    Object.defineProperty(wrapped, '__wrappedByCustomerName', { value: true });
    root[name] = wrapped;
  }

  // ชื่อที่พบบ่อยในการเรนเดอร์
  ['renderReportRow', 'renderSaleRow', 'appendReportRow', 'renderTableRow'].forEach(wrapRenderRow);

  // สำหรับโค้ดที่สร้าง HTML เป็นสตริงในลูป:
  // เราครอบฟังก์ชันประกอบแถว (เช่น buildRowHtml(items)) ถ้ามี:
  function wrapRowBuilder(name){
    const root = window;
    const fn = root[name];
    if (typeof fn !== 'function' || fn.__wrappedByCustomerName) return;
    const wrapped = function(items, ...rest){
      try{
        if (Array.isArray(items)) {
          items = items.map(it => {
            if (!it) return it;
            const dn = CND.getDisplayNameForRender(it);
            // ฝังค่าเพื่อให้เทมเพลตเดิมหยิบไปใช้
            return Object.assign({}, it, { displayName: dn });
          });
        }
      } catch {}
      return fn.call(this, items, ...rest);
    };
    Object.defineProperty(wrapped, '__wrappedByCustomerName', { value: true });
    root[name] = wrapped;
  }
  ['buildReportRows', 'buildSaleRows', 'rowsToHtml'].forEach(wrapRowBuilder);

  // สุดท้าย: เฝ้าตาราง—ถ้าหน้าใช้ onSnapshot/โหลดช้า ก็จะมี displayName มาตั้งแต่ข้อมูล ไม่ต้องแก้อีก
  // (ส่วนนี้ไม่ยุ่ง DOM text แต่เผื่อคุณมีเรนเดอร์ callback แบบกำหนดเอง)
})();
