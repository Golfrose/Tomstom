import { db } from './firebase.js';
import { products } from './config.js';
import { getCart, clearCart } from './cart.js';

const productListWater = document.getElementById('product-list-water');
const productListMed = document.getElementById('product-list-med');
const confirmSaleBtn = document.getElementById('confirm-sale-btn');

// ฟังก์ชันสำหรับสร้าง HTML ของการ์ดสินค้า
function createProductCard(product) {
    const hasMixOptions = product.mixes && product.mixes.length > 0;

    const mixOptionsHTML = hasMixOptions ?
        `<div class="mix-options">
            ${product.mixes.map((mix, index) => `
                <label class="mix-option">
                    <input type="radio" name="mix-${product.id}" value="${mix}" ${index === 0 ? 'checked' : ''}>
                    <span>${mix}</span>
                </label>
            `).join('')}
        </div>` : '';

    return `
        <div class="product-card" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}">
            <h3>${product.name}</h3>
            <span class="price">${product.price} บาท/${product.unit || 'หน่วย'}</span>
            
            <input type="text" class="customer-name-input" placeholder="ชื่อผู้ซื้อ (ถ้ามี)">
            
            ${mixOptionsHTML}

            <div class="quantity-control">
                <button class="quantity-btn" data-action="decrease">-</button>
                <input type="number" value="1" min="1" class="quantity-input">
                <button class="quantity-btn" data-action="increase">+</button>
            </div>
            <button class="add-to-cart-btn">เพิ่มลงตะกร้า</button>
        </div>
    `;
}

// ฟังก์ชันสำหรับแสดงสินค้าบนหน้าเว็บ
export function renderProducts() {
    productListWater.innerHTML = products
        .filter(p => p.category === 'water')
        .map(createProductCard)
        .join('');

    productListMed.innerHTML = products
        .filter(p => p.category === 'med')
        .map(createProductCard)
        .join('');
}

// ฟังก์ชันสำหรับยืนยันการขายและบันทึกข้อมูล
async function confirmSale() {
    const cart = getCart();
    if (cart.length === 0) {
        alert('ตะกร้าว่างเปล่า!');
        return;
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

    const saleRecord = {
        timestamp: now.getTime(),
        items: cart,
        total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    };

    try {
        await db.ref(`sales/${dateStr}`).push(saleRecord);
        alert('บันทึกการขายสำเร็จ!');
        clearCart();
        document.getElementById('cart-modal').style.display = 'none';
    } catch (error) {
        console.error("Error saving sale: ", error);
        alert('เกิดข้อผิดพลาดในการบันทึกการขาย');
    }
}

// เพิ่ม Event Listener ให้กับปุ่มยืนยันการขาย
confirmSaleBtn.addEventListener('click', confirmSale);