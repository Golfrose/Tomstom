import { db } from './firebase.js';
import { products } from './config.js';

function populateProductSelect() {
    const productSelect = document.getElementById('product-select');
    if (!productSelect) return;
    productSelect.innerHTML = '<option value="all">สินค้าทั้งหมด</option>';
    products.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = p.name;
        productSelect.appendChild(option);
    });
}

export function initializeCompare() {
    const compareModeSelect = document.getElementById('compare-mode-select');
    const dayToDayMode = document.getElementById('day-to-day-mode');
    const dateRangeMode = document.getElementById('date-range-mode');
    const compareBtn = document.getElementById('compare-btn');
    const clearCompareBtn = document.getElementById('clear-compare-btn');

    if (compareModeSelect) {
        populateProductSelect();
        compareModeSelect.addEventListener('change', () => {
            dayToDayMode.classList.toggle('active', compareModeSelect.value === 'day-to-day');
            dateRangeMode.classList.toggle('active', compareModeSelect.value === 'date-range');
        });
        compareBtn.addEventListener('click', () => alert("ฟังก์ชันเปรียบเทียบยังไม่พร้อมใช้งาน"));
        clearCompareBtn.addEventListener('click', () => {
             // Basic clear functionality
            if (document.getElementById('comparisonChart')) {
                const chart = Chart.getChart('comparisonChart');
                if (chart) chart.destroy();
            }
            document.getElementById('detailed-comparison-result').innerHTML = '';
        });
    }
}