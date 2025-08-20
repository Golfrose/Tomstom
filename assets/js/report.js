import {
    db
} from './firebase.js';

const reportDateInput = document.getElementById('report-date');
const loadReportBtn = document.getElementById('load-report-btn');
const reportBody = document.getElementById('report-body');
const totalRevenueEl = document.getElementById('total-revenue');
const totalQuantityEl = document.getElementById('total-quantity');
const productSummaryList = document.getElementById('product-summary-list');
const noDataEl = document.getElementById('no-data');

function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function loadReport() {
    const date = reportDateInput.value;
    if (!date) {
        alert('กรุณาเลือกวันที่');
        return;
    }

    const salesRef = db.ref(`sales/${date}`);
    salesRef.on('value', (snapshot) => {
        const salesData = snapshot.val();
        reportBody.innerHTML = '';
        productSummaryList.innerHTML = '';
        totalRevenueEl.textContent = '0';
        totalQuantityEl.textContent = '0';

        if (!salesData) {
            noDataEl.style.display = 'block';
            return;
        }

        noDataEl.style.display = 'none';

        let grandTotalRevenue = 0;
        let grandTotalQuantity = 0;
        const productSummary = {};

        // Sort sales by timestamp
        const sortedSales = Object.entries(salesData).sort((a, b) => a[1].timestamp - b[1].timestamp);

        for (const [saleId, sale] of sortedSales) {
            grandTotalRevenue += sale.total;
            for (const itemId in sale.items) {
                const item = sale.items[itemId];
                grandTotalQuantity += item.quantity;

                // --- START: สร้างชื่อแสดงผลแบบใหม่สำหรับสรุป ---
                const displayName = item.customerName ?
                    `${item.customerName} (${item.mix})` :
                    `${item.productName} (${item.mix})`;
                // --- END: สร้างชื่อแสดงผลแบบใหม่สำหรับสรุป ---

                productSummary[displayName] = (productSummary[displayName] || 0) + item.quantity;

                const row = `
                    <tr data-sale-id="${saleId}" data-item-id="${itemId}" data-date="${date}">
                        <td>${formatTime(sale.timestamp)}</td>
                        <td>${displayName}</td>
                        <td>${item.quantity}</td>
                        <td>${item.price}</td>
                        <td>${item.total}</td>
                        <td>
                            <button class="delete-btn" title="ลบรายการนี้">ลบ</button>
                        </td>
                    </tr>
                `;
                reportBody.innerHTML += row;
            }
        }

        totalRevenueEl.textContent = grandTotalRevenue.toLocaleString();
        totalQuantityEl.textContent = grandTotalQuantity;

        for (const [name, qty] of Object.entries(productSummary)) {
            productSummaryList.innerHTML += `<li>${name}: ${qty} ขวด</li>`;
        }

        addDeleteListeners();
    });
}

function addDeleteListeners() {
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            const {
                saleId,
                itemId,
                date
            } = row.dataset;
            if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?')) {
                deleteSaleItem(date, saleId, itemId);
            }
        });
    });
}

async function deleteSaleItem(date, saleId, itemId) {
    const saleRef = db.ref(`sales/${date}/${saleId}`);
    try {
        const snapshot = await saleRef.once('value');
        const saleData = snapshot.val();

        if (!saleData) return;

        const itemToDelete = saleData.items[itemId];
        const newTotal = saleData.total - itemToDelete.total;

        // ถ้ามี item เหลือมากกว่า 1, แค่ลบ item และอัพเดท total
        if (Object.keys(saleData.items).length > 1) {
            await saleRef.update({
                total: newTotal,
                [`items/${itemId}`]: null
            });
        } else {
            // ถ้าเป็น item สุดท้าย, ลบ sale record ทั้งหมด
            await saleRef.remove();
        }
        alert('ลบรายการสำเร็จ');
    } catch (error) {
        console.error("Error deleting item: ", error);
        alert('เกิดข้อผิดพลาดในการลบ');
    }
}


export function initializeReport() {
    reportDateInput.valueAsDate = new Date();
    loadReportBtn.addEventListener('click', loadReport);
    loadReport(); // Load report for today on initial load
}
