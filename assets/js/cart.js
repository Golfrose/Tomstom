import {
    products
} from './config.js';

let cart = [];

const cartIcon = document.getElementById('cart-icon');
const cartCount = document.getElementById('cart-count');
const cartModal = document.getElementById('cart-modal');
const modalItems = document.getElementById('modal-items');
const modalCartTotal = document.getElementById('modal-cart-total');
const clearCartBtn = document.getElementById('clear-cart-btn');

function updateCartDisplay() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;

    if (totalItems > 0) {
        cartIcon.classList.add('visible');
    } else {
        cartIcon.classList.remove('visible');
    }
}

function updateCartModal() {
    modalItems.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        const product = products.find(p => p.id === item.productId);
        const itemTotal = product.price * item.quantity;
        total += itemTotal;

        // --- START: สร้างชื่อแสดงผลแบบใหม่ ---
        const mixName = product.mixes[item.mix];
        const displayName = item.customerName ?
            `${item.customerName} (${mixName})` :
            `${product.name} (${mixName})`;
        // --- END: สร้างชื่อแสดงผลแบบใหม่ ---

        const itemHTML = `
            <div class="modal-item" data-index="${index}">
                <div class="item-details">
                    <strong>${displayName}</strong><br>
                    <span>${item.quantity} ขวด × ${product.price}฿</span>
                </div>
                <div class="item-total">${itemTotal}฿</div>
                <button class="remove-item" data-index="${index}">×</button>
            </div>
        `;
        modalItems.innerHTML += itemHTML;
    });

    modalCartTotal.textContent = total;
    addRemoveItemListeners();
}


function addRemoveItemListeners() {
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            removeItemFromCart(index);
        });
    });
}

function removeItemFromCart(index) {
    cart.splice(index, 1);
    updateCartDisplay();
    updateCartModal();
}


export function addToCart(productId, mix, quantity, customerName) {
    const item = {
        productId,
        mix,
        quantity,
        customerName // เพิ่ม customerName เข้าไปใน object
    };
    cart.push(item);
    updateCartDisplay();
    alert(`เพิ่ม '${customerName || products.find(p=>p.id===productId).name}' ลงในตะกร้าแล้ว`);
}

export function getCart() {
    return cart;
}

export function clearCart() {
    cart = [];
    updateCartDisplay();
    cartModal.style.display = 'none';
}

export function initializeCart() {
    cartIcon.addEventListener('click', () => {
        if (cart.length > 0) {
            updateCartModal();
            cartModal.style.display = 'flex';
        }
    });

    cartModal.addEventListener('click', (e) => {
        if (e.target === cartModal) {
            cartModal.style.display = 'none';
        }
    });

    clearCartBtn.addEventListener('click', () => {
        if (confirm('คุณต้องการล้างตะกร้าทั้งหมดใช่หรือไม่?')) {
            clearCart();
        }
    });
}
