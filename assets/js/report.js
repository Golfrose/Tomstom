import { db } from './firebase.js';

const reportDateInput = document.getElementById('report-date');
const loadReportBtn = document.getElementById('load-report-btn');
const totalRevenueEl = document.getElementById('total-revenue');
const totalQuantityEl = document.getElementById('total-quantity');
const productSummaryList = document.getElementById('product-summary-list');
const reportBody = document.getElementById('report-body');
const noDataEl = document.getElementById('no-data');

// ฟังก์ชันสำหรับโหลดและแสดงรายงาน
export async function loadReport() {
    const date = reportDateInput.value;
    if (!date) {
        alert('กรุณาเลือกวันที่');
        return;
    }

    const salesRef = db.ref(`sales/${date}`);
    const snapshot = await salesRef.once('value');
    const salesData = snapshot.val();

    totalRevenueEl.textContent = 0;
    totalQuantityEl.textContent = 0;
    productSummaryList.innerHTML = '<li>ไม่มีข้อมูล</li>';
    reportBody.innerHTML = '';

    if (!salesData) {
        noDataEl.style.display = 'block';
        return;
    }

    noDataEl.style.display = 'none';
    let allItems = [];
    Object.keys(salesData).forEach(saleKey => {
        const sale = salesData[saleKey];
        if (sale.items && Array.isArray(sale.items)) {
            sale.items.forEach((item, itemIndex) => {
                allItems.push({
                    ...item,
                    timestamp: sale.timestamp,
                    saleKey: saleKey,
                    itemIndex: itemIndex // เพื่อใช้อ้างอิงสำหรับการลบ/แก้ไข
                });
            });
        }
    });

    allItems.sort((a, b) => a.timestamp - b.timestamp);

    renderReportTable(allItems);
    calculateSummary(allItems);
}

// ฟังก์ชันสำหรับสร้างตารางรายงาน
function renderReportTable(items) {
    reportBody.innerHTML = items.map(item => {
        const dateTime = new Date(item.timestamp);
        const dateStr = dateTime.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const timeStr = dateTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

        const paymentIcon = item.paymentMethod === 'transfer'
            ? `<span class="payment-icon" title="ชำระโดยการโอน">🏦</span>`
            : '';
        
        const displayName = item.customerName
            ? `<strong>${item.customerName}</strong> (${item.mix})`
            : `${item.name} (${item.mix})`;

        return `
            <tr>
                <td>${dateStr}<br><small>${timeStr} น.</small></td>
                <td>${displayName}</td>
                <td>${item.quantity}</td>
                <td>${item.price}</td>
                <td>${item.price * item.quantity}</td>
                <td>
                    <div class="summary-actions">
                        ${paymentIcon}
                        <button class="edit-btn" title="แก้ไข (ยังไม่พร้อมใช้งาน)">แก้</button>
                        <button class="delete-btn" title="ลบรายการนี้" data-date="${reportDateInput.value}" data-sale-key="${item.saleKey}" data-item-index="${item.itemIndex}">ลบ</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ฟังก์ชันสำหรับคำนวณสรุปยอด
function calculateSummary(items) {
    const totalRevenue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    totalRevenueEl.textContent = totalRevenue.toLocaleString();
    totalQuantityEl.textContent = totalQuantity;

    const summary = {};
    items.forEach(item => {
        const key = item.customerName ? `${item.customerName} (${item.mix})` : `${item.name} (${item.mix})`;
        if (!summary[key]) {
            summary[key] = 0;
        }
        summary[key] += item.quantity;
    });

    productSummaryList.innerHTML = Object.entries(summary)
        .map(([name, qty]) => `<li>${name}: ${qty} หน่วย</li>`)
        .join('');
}

// ฟังก์ชันสำหรับลบรายการขาย
async function deleteSaleItem(e) {
    if (!e.target.classList.contains('delete-btn')) return;

    const { date, saleKey, itemIndex } = e.target.dataset;
    
    if (!confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) return;

    try {
        const itemRef = db.ref(`sales/${date}/${saleKey}/items/${itemIndex}`);
        await itemRef.remove();
        
        // ตรวจสอบว่ายังมีรายการอื่นใน sale record หรือไม่
        const saleRef = db.ref(`sales/${date}/${saleKey}/items`);
        const snapshot = await saleRef.once('value');
        if (!snapshot.exists() || snapshot.val() === null) {
            // ถ้าไม่มีแล้ว ให้ลบ sale record ทั้งหมด
            await db.ref(`sales/${date}/${saleKey}`).remove();
        }

        alert('ลบรายการสำเร็จ');
        loadReport(); // โหลดรายงานใหม่
    } catch (error) {
        console.error('Error deleting item:', error);
        alert('เกิดข้อผิดพลาดในการลบ');
    }
}


// ตั้งค่าวันที่เริ่มต้นและเพิ่ม Event Listener
reportDateInput.value = new Date().toISOString().split('T')[0];
loadReportBtn.addEventListener('click', loadReport);
reportBody.addEventListener('click', deleteSaleItem);

// โหลดรายงานครั้งแรกเมื่อเปิดหน้า
export function initReportPage() {
    loadReport();
}