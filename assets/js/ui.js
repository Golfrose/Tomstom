import {
    products
} from './config.js';
import {
    addToCart
} from './cart.js';

/**
 * สร้างการ์ดสินค้าทั้งหมดลงในหน้าเว็บ
 * โดยจะมีการเพิ่มช่องสำหรับกรอก "ชื่อลูกค้า" ในการ์ดสินค้าทุกใบ
 */
function renderProducts() {
    const productListWater = document.getElementById('product-list-water');
    const productListMed = document.getElementById('product-list-med');
    productListWater.innerHTML = '';
    productListMed.innerHTML = '';

    products.forEach(product => {
        // สร้าง HTML สำหรับตัวเลือกส่วนผสม (mix options)
        const mixOptionsHTML = Object.entries(product.mixes).map(([key, name], index) => `
            <label class="mix-option">
                <input type="radio" name="mix-${product.id}" value="${key}" ${index === 0 ? 'checked' : ''}>
                <span>${name}</span>
            </label>
        `).join('');

        // สร้าง HTML สำหรับการ์ดสินค้า 1 ใบ (Product Card)
        const productCardHTML = `
            <div class="product-card" data-product-id="${product.id}">
                <h3>${product.name}</h3>
                <span class="price">${product.price} บาท/ขวด</span>
                
                <!-- START: เพิ่มช่องใส่ชื่อลูกค้าตรงนี้ -->
                <div class="customer-name-container">
                    <input type="text" class="customer-name-input" placeholder="ชื่อลูกค้า (ถ้ามี)">
                </div>
                <!-- END: เพิ่มช่องใส่ชื่อลูกค้า -->

                <div class="mix-options">
                    ${mixOptionsHTML}
                </div>
                <div class="quantity-control">
                    <button class="quantity-btn" data-action="decrease">-</button>
                    <input type="number" class="quantity-input" value="0" min="0">
                    <button class="quantity-btn" data-action="increase">+</button>
                </div>
                <button class="add-to-cart-btn">เพิ่มลงตะกร้า</button>
            </div>
        `;

        // แยกการ์ดที่สร้างเสร็จแล้วไปใส่ในคอลัมน์ที่ถูกต้อง (น้ำ หรือ ยา)
        if (product.category === 'water') {
            productListWater.innerHTML += productCardHTML;
        } else if (product.category === 'med') {
            productListMed.innerHTML += productCardHTML;
        }
    });

    // หลังจากสร้าง HTML เสร็จแล้ว ให้เพิ่ม Event Listener ให้กับปุ่มต่างๆ
    addEventListenersToCards();
}

/**
 * เพิ่ม Event Listener ให้กับปุ่มต่างๆ ในการ์ดสินค้าแต่ละใบ
 */
function addEventListenersToCards() {
    document.querySelectorAll('.product-card').forEach(card => {
        const productId = card.dataset.productId;
        const quantityInput = card.querySelector('.quantity-input');
        const decreaseBtn = card.querySelector('.quantity-btn[data-action="decrease"]');
        const increaseBtn = card.querySelector('.quantity-btn[data-action="increase"]');
        const addToCartBtn = card.querySelector('.add-to-cart-btn');

        // ปุ่มลดจำนวน
        decreaseBtn.addEventListener('click', () => {
            let currentValue = parseInt(quantityInput.value);
            if (currentValue > 0) {
                quantityInput.value = currentValue - 1;
            }
        });

        // ปุ่มเพิ่มจำนวน
        increaseBtn.addEventListener('click', () => {
            let currentValue = parseInt(quantityInput.value);
            quantityInput.value = currentValue + 1;
        });

        // ปุ่ม "เพิ่มลงตะกร้า"
        addToCartBtn.addEventListener('click', () => {
            const selectedMix = card.querySelector('input[name="mix-' + productId + '"]:checked').value;
            const quantity = parseInt(quantityInput.value);
            
            // ดึงค่าจากช่อง "ชื่อลูกค้า" มาใช้งาน
            const customerNameInput = card.querySelector('.customer-name-input');
            const customerName = customerNameInput.value.trim(); // .trim() เพื่อตัดช่องว่างหน้า-หลัง

            if (quantity > 0) {
                // ส่งข้อมูลทั้งหมด (รวมถึงชื่อลูกค้า) ไปยังฟังก์ชัน addToCart
                addToCart(productId, selectedMix, quantity, customerName);
                
                // รีเซ็ตค่าในฟอร์มหลังเพิ่มลงตะกร้าสำเร็จ
                quantityInput.value = 0;
                customerNameInput.value = ''; // รีเซ็ตช่องชื่อลูกค้าให้ว่าง
            } else {
                alert('กรุณาระบุจำนวนสินค้า');
            }
        });
    });
}

/**
 * ตั้งค่าการทำงานของปุ่มเลือกหมวดหมู่ (สำหรับมุมมองมือถือ)
 */
function setupCategorySelector() {
    const selectors = document.querySelectorAll('.category-selector .category-card');
    const waterColumn = document.getElementById('product-column-water');
    const medColumn = document.getElementById('product-column-med');

    selectors.forEach(selector => {
        selector.addEventListener('click', () => {
            // ทำให้ปุ่มที่กด active
            selectors.forEach(s => s.classList.remove('active'));
            selector.classList.add('active');

            // แสดง/ซ่อนคอลัมน์สินค้าตามหมวดหมู่ที่เลือก
            const category = selector.dataset.category;
            if (category === 'water') {
                waterColumn.style.display = 'block';
                medColumn.style.display = 'none';
            } else {
                medColumn.style.display = 'block';
                waterColumn.style.display = 'none';
            }
        });
    });
}

/**
 * ฟังก์ชันเริ่มต้นการทำงานของ UI ทั้งหมด
 * จะถูกเรียกใช้จากไฟล์ main.js
 */
export function initializeUI() {
    renderProducts();
    setupCategorySelector();
}
