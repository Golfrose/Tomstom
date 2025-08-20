import {
    initializeAuth
} from './auth.js';
import {
    initializeUI
} from './ui.js';
import {
    initializeCart
} from './cart.js';
import {
    initializeSales
} from './sales.js';
import {
    initializeReport
} from './report.js';
import {
    initializeCompare
} from './compare.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. เริ่มต้นระบบ Auth ก่อน
    initializeAuth();

    // 2. เริ่มต้นการทำงานของส่วนต่างๆ
    initializeUI();
    initializeCart();
    initializeSales();
    initializeReport();
    initializeCompare();
    setupClock();
    setupNavigation();

    // 3. แสดงหน้าขายเป็นหน้าแรก
    showPage('sale');
});

/**
 * ฟังก์ชันสำหรับสลับการแสดงผลของหน้าต่างๆ
 * @param {string} pageId - ID ของหน้าที่ต้องการแสดง (เช่น 'sale', 'summary', 'compare')
 */
function showPage(pageId) {
    // ซ่อนทุกหน้าก่อน
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });
    // แสดงเฉพาะหน้าที่เลือก
    const activePage = document.getElementById(`${pageId}-page`);
    if (activePage) {
        activePage.style.display = 'block';
    }

    // อัปเดตสถานะ 'active' ของปุ่ม Navigation
    document.querySelectorAll('.main-nav .nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === pageId);
    });
}

/**
 * ตั้งค่าการทำงานของปุ่ม Navigation หลัก (หน้าขาย, สรุปยอด, เปรียบเทียบ)
 */
function setupNavigation() {
    const navButtons = document.querySelectorAll('.main-nav .nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const pageId = button.dataset.page;
            showPage(pageId);
        });
    });
}

/**
 * ตั้งค่านาฬิกาและวันที่ให้แสดงผลและอัปเดตตลอดเวลา
 */
function setupClock() {
    const timeEl = document.getElementById('current-time');
    const dateEl = document.getElementById('current-date');

    function updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        const dateString = now.toLocaleDateString('th-TH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        timeEl.textContent = timeString;
        dateEl.textContent = dateString;
    }

    updateTime();
    setInterval(updateTime, 1000);
}