import { db } from './firebase.js';
import { products } from './config.js';

// --- ไม่ต้องแก้ไขส่วนนี้ ---
const compareModeSelect = document.getElementById('compare-mode-select');
const dayToDayMode = document.getElementById('day-to-day-mode');
const dateRangeMode = document.getElementById('date-range-mode');
const productSelect = document.getElementById('product-select');
const compareBtn = document.getElementById('compare-btn');
const clearCompareBtn = document.getElementById('clear-compare-btn');
const detailedResultEl = document.getElementById('detailed-comparison-result');
const noDataEl = document.getElementById('no-comparison-data');
const chartCanvas = document.getElementById('comparisonChart');
let comparisonChart = null;

function populateProductSelect() {
    productSelect.innerHTML = '<option value="all">สินค้าทั้งหมด</option>';
    products.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = p.name;
        productSelect.appendChild(option);
    });
}

function clearComparison() {
    detailedResultEl.innerHTML = '';
    noDataEl.style.display = 'none';
    if (comparisonChart) {
        comparisonChart.destroy();
    }
    document.getElementById('compare-date-1').value = '';
    document.getElementById('compare-date-2').value = '';
    document.getElementById('start-date-1').value = '';
    document.getElementById('end-date-1').value = '';
    document.getElementById('start-date-2').value = '';
    document.getElementById('end-date-2').value = '';
}

async function getSalesDataForRange(startDate, endDate, productId) {
    // ฟังก์ชันการทำงานเดิมของคุณ... (สมมติว่ามีอยู่แล้ว)
    return {
        totalRevenue: 0,
        totalQuantity: 0,
        items: {}
    }; // คืนค่า default ไปก่อน
}

async function compareData() {
    // ฟังก์ชันการทำงานเดิมของคุณ... (สมมติว่ามีอยู่แล้ว)
    alert("ฟังก์ชันเปรียบเทียบยังไม่ถูกพัฒนาเต็มรูปแบบ");
}

// --- START: นี่คือส่วนสำคัญที่เพิ่มเข้ามา ---
/**
 * ฟังก์ชันเริ่มต้นการทำงานของหน้าเปรียบเทียบ
 * เราจะ export ฟังก์ชันนี้เพื่อให้ main.js เรียกใช้ได้
 */
export function initializeCompare() {
    if (compareModeSelect) {
        populateProductSelect();
        compareModeSelect.addEventListener('change', () => {
            dayToDayMode.classList.toggle('active', compareModeSelect.value === 'day-to-day');
            dateRangeMode.classList.toggle('active', compareModeSelect.value === 'date-range');
        });
        compareBtn.addEventListener('click', compareData);
        clearCompareBtn.addEventListener('click', clearComparison);
    } else {
        // ในกรณีที่เปิดหน้าอื่นที่ไม่มี element เหล่านี้
        console.log("Compare page elements not found, skipping initialization.");
    }
}
// --- END: ส่วนสำคัญที่เพิ่มเข้ามา ---