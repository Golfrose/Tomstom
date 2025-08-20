import { onAuthStateChanged } from './auth.js';
import { setupUI } from './ui.js';
import { renderProducts } from './sales.js';
import { addToCart } from './cart.js';
import { initReportPage } from './report.js';
import { initComparePage } from './compare.js';

function handleSalePageInteractions(e) {
    const target = e.target;
    const card = target.closest('.product-card');
    if (!card) return;

    // จัดการปุ่ม เพิ่ม/ลด จำนวน
    if (target.classList.contains('quantity-btn')) {
        const input = card.querySelector('.quantity-input');
        let value = parseInt(input.value);
        if (target.dataset.action === 'increase') {
            value++;
        } else {
            value = Math.max(1, value - 1);
        }
        input.value = value;
    }

    // จัดการปุ่ม "เพิ่มลงตะกร้า"
    if (target.classList.contains('add-to-cart-btn')) {
        const selectedMixInput = card.querySelector('input[name^="mix-"]:checked');
        
        // สำหรับสินค้าที่ไม่มี mix options
        const mixValue = selectedMixInput ? selectedMixInput.value : 'standard';

        if (!mixValue && card.querySelector('.mix-options')) {
            alert('กรุณาเลือกชนิดของสินค้า');
            return;
        }

        const productData = {
            id: card.dataset.id,
            name: card.dataset.name,
            price: parseInt(card.dataset.price),
            quantity: parseInt(card.querySelector('.quantity-input').value),
            mix: mixValue,
            customerName: card.querySelector('.customer-name-input').value.trim(),
            paymentMethod: 'cash' // ค่าเริ่มต้นเป็นเงินสด
        };

        addToCart(productData);
        // รีเซ็ตค่าใน card หลังจากเพิ่มลงตะกร้า
        card.querySelector('.quantity-input').value = 1;
        card.querySelector('.customer-name-input').value = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(user => {
        setupUI(user);
        if (user) {
            renderProducts();
            initReportPage();
            initComparePage();
            
            // เพิ่ม Event Listener หลักสำหรับหน้าขาย
            const salePage = document.getElementById('sale-page');
            salePage.addEventListener('click', handleSalePageInteractions);
        }
    });
});