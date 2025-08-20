import { initializeAuth } from './auth.js';
import { initializeUI } from './ui.js';
import { initializeCart } from './cart.js';
import { initializeSales } from './sales.js';
import { initializeReport } from './report.js';
import { initializeCompare } from './compare.js';

// รอให้ HTML โหลดเสร็จก่อนเริ่มทำงาน JavaScript ทั้งหมด
document.addEventListener('DOMContentLoaded', () => {
    // ตรวจสอบว่าอยู่ในหน้าแอปหลัก ไม่ใช่หน้า login
    const appContainer = document.getElementById('app-container');
    if (appContainer) {
        initializeAuth();
        initializeUI();
        initializeCart();
        initializeSales();
        initializeReport();
        initializeCompare();
        setupClock();
        setupNavigation();
        showPage('sale'); // แสดงหน้าขายเป็นหน้าแรก
    } else {
        // ถ้าอยู่ในหน้า login ก็ให้เริ่มแค่ auth
        initializeAuth();
    }
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
    const navButtons = document.querySelectorAll('.main-nav .nav-btn');
    navButtons.forEach(button => {
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
        const timeString = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        const dateString = now.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        timeEl.textContent = timeString;
        dateEl.textContent = dateString;
    }

    updateTime();
    setInterval(updateTime, 1000);
}