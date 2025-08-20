import { products } from './config.js';
import { addToCart } from './cart.js';

function renderProducts() {
    const productListWater = document.getElementById('product-list-water');
    const productListMed = document.getElementById('product-list-med');
    
    if (!productListWater || !productListMed) return;

    productListWater.innerHTML = '';
    productListMed.innerHTML = '';

    products.forEach(product => {
        const mixOptionsHTML = Object.entries(product.mixes).map(([key, name], index) => `
            <label class="mix-option">
                <input type="radio" name="mix-${product.id}" value="${key}" ${index === 0 ? 'checked' : ''}>
                <span>${name}</span>
            </label>
        `).join('');

        const productCardHTML = `
            <div class="product-card" data-product-id="${product.id}">
                <h3>${product.name}</h3>
                <span class="price">${product.price} บาท/ขวด</span>
                <div class="customer-name-container">
                    <input type="text" class="customer-name-input" placeholder="ชื่อลูกค้า (ถ้ามี)">
                </div>
                <div class="mix-options">${mixOptionsHTML}</div>
                <div class="quantity-control">
                    <button class="quantity-btn" data-action="decrease">-</button>
                    <input type="number" class="quantity-input" value="0" min="0">
                    <button class="quantity-btn" data-action="increase">+</button>
                </div>
                <button class="add-to-cart-btn">เพิ่มลงตะกร้า</button>
            </div>
        `;

        if (product.category === 'water') {
            productListWater.innerHTML += productCardHTML;
        } else if (product.category === 'med') {
            productListMed.innerHTML += productCardHTML;
        }
    });

    addEventListenersToCards();
}

function addEventListenersToCards() {
    document.querySelectorAll('.product-card').forEach(card => {
        const productId = card.dataset.productId;
        const quantityInput = card.querySelector('.quantity-input');
        const decreaseBtn = card.querySelector('.quantity-btn[data-action="decrease"]');
        const increaseBtn = card.querySelector('.quantity-btn[data-action="increase"]');
        const addToCartBtn = card.querySelector('.add-to-cart-btn');

        decreaseBtn.addEventListener('click', () => {
            let currentValue = parseInt(quantityInput.value);
            if (currentValue > 0) {
                quantityInput.value = currentValue - 1;
            }
        });

        increaseBtn.addEventListener('click', () => {
            let currentValue = parseInt(quantityInput.value);
            quantityInput.value = currentValue + 1;
        });

        addToCartBtn.addEventListener('click', () => {
            const selectedMix = card.querySelector(`input[name="mix-${productId}"]:checked`).value;
            const quantity = parseInt(quantityInput.value);
            const customerNameInput = card.querySelector('.customer-name-input');
            const customerName = customerNameInput.value.trim();

            if (quantity > 0) {
                addToCart(productId, selectedMix, quantity, customerName);
                quantityInput.value = 0;
                customerNameInput.value = '';
            } else {
                alert('กรุณาระบุจำนวนสินค้า');
            }
        });
    });
}

function setupCategorySelector() {
    const selectors = document.querySelectorAll('.category-selector .category-card');
    const waterColumn = document.getElementById('product-column-water');
    const medColumn = document.getElementById('product-column-med');

    if (!waterColumn || !medColumn || selectors.length === 0) return;

    selectors.forEach(selector => {
        selector.addEventListener('click', () => {
            selectors.forEach(s => s.classList.remove('active'));
            selector.classList.add('active');
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

export function initializeUI() {
    renderProducts();
    setupCategorySelector();
}