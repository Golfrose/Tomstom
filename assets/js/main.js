// Import ฟังก์ชันเริ่มต้นจากทุกไฟล์
import { initializeAuth } from './auth.js';
import { initializeUI } from './ui.js';
import { initializeCart } from './cart.js';
import { initializeSales } from './sales.js';
import { initializeReport } from './report.js';
import { initializeCompare } from './compare.js';

// รอให้ HTML โหลดเสร็จสมบูรณ์ก่อน
document.addEventListener('DOMContentLoaded', () => {
    // 1. เริ่มระบบ Auth เป็นอันดับแรกเสมอ
    initializeAuth();

    // 2. เริ่มการทำงานของส่วนอื่นๆ
    initializeUI();
    initializeCart();
    initializeSales();
    initializeReport();
    initializeCompare();
    setupClock();
    setupNavigation();
});

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });
    const activePage = document.getElementById(`${pageId}-page`);
    if (activePage) {
        activePage.style.display = 'block';
    }
    document.querySelectorAll('.main-nav .nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === pageId);
    });
}

function setupNavigation() {
    document.querySelectorAll('.main-nav .nav-btn').forEach(button => {
        button.addEventListener('click', () => {
            const pageId = button.dataset.page;
            showPage(pageId);
        });
    });
}

function setupClock() {
    const timeEl = document.getElementById('current-time');
    const dateEl = document.getElementById('current-date');
    if (!timeEl || !dateEl) return;
    function updateTime() {
        const now = new Date();
        timeEl.textContent = now.toLocaleTimeString('th-TH');
        dateEl.textContent = now.toLocaleDateString('th-TH', { dateStyle: 'full' });
    }
    updateTime();
    setInterval(updateTime, 1000);
}
