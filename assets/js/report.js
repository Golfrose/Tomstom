import { db } from './firebase.js';

let currentReportDate = '';

function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function loadReport() {
    const reportDateInput = document.getElementById('report-date');
    const reportBody = document.getElementById('report-body');
    const totalRevenueEl = document.getElementById('total-revenue');
    const totalQuantityEl = document.getElementById('total-quantity');
    const productSummaryList = document.getElementById('product-summary-list');
    const noDataEl = document.getElementById('no-data');

    if (!reportDateInput) return; // Exit if not on the summary page

    const date = reportDateInput.value;
    if (!date) {
        alert('กรุณาเลือกวันที่');
        return;
    }
    currentReportDate = date;

    const salesRef = db.ref(`sales/${date}`);
    salesRef.on('value', snapshot => {
        // Only update if the user is still viewing the same date's report
        if (date !== currentReportDate) return;

        const salesData = snapshot.val();
        reportBody.innerHTML = '';
        productSummaryList.innerHTML = '';
        totalRevenueEl.textContent = '0';
        totalQuantityEl.textContent = '0';
        noDataEl.style.display = 'none';

        if (!salesData) {
            noDataEl.style.display = 'block';
            return;
        }

        let grandTotalRevenue = 0, grandTotalQuantity = 0;
        const productSummary = {};
        const sortedSales = Object.entries(salesData).sort((a, b) => a[1].timestamp - b[1].timestamp);

        for (const [saleId, sale] of sortedSales) {
            grandTotalRevenue += sale.total;
            for (const itemId in sale.items) {
                const item = sale.items[itemId];
                grandTotalQuantity += item.quantity;
                const displayName = item.customerName ? `${item.customerName} (${item.mix})` : `${item.productName} (${item.mix})`;
                productSummary[displayName] = (productSummary[displayName] || 0) + item.quantity;

                const row = `
                    <tr data-sale-id="${saleId}" data-item-id="${itemId}" data-date="${date}">
                        <td>${formatTime(sale.timestamp)}</td>
                        <td>${displayName}</td>
                        <td>${item.quantity}</td>
                        <td>${item.price}</td>
                        <td>${item.total}</td>
                        <td><button class="delete-btn">ลบ</button></td>
                    </tr>`;
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
            const { saleId, itemId, date } = row.dataset;
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
        if (Object.keys(saleData.items).length > 1) {
            await saleRef.update({
                total: saleData.total - itemToDelete.total,
                [`items/${itemId}`]: null
            });
        } else {
            await saleRef.remove();
        }
        alert('ลบรายการสำเร็จ');
    } catch (error) {
        console.error("Error deleting item: ", error);
        alert('เกิดข้อผิดพลาดในการลบ');
    }
}

export function initializeReport() {
    const reportDateInput = document.getElementById('report-date');
    const loadReportBtn = document.getElementById('load-report-btn');
    if (reportDateInput && loadReportBtn) {
        reportDateInput.valueAsDate = new Date();
        loadReportBtn.addEventListener('click', loadReport);
    }
}