import { products } from './config.js';

let cart = [];

function updateCartDisplay() {
    const cartIcon = document.getElementById('cart-icon');
    const cartCount = document.getElementById('cart-count');
    if (!cartIcon || !cartCount) return;

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    cartIcon.classList.toggle('visible', totalItems > 0);
}

function updateCartModal() {
    const modalItems = document.getElementById('modal-items');
    const modalCartTotal = document.getElementById('modal-cart-total');
    if (!modalItems || !modalCartTotal) return;

    modalItems.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        const product = products.find(p => p.id === item.productId);
        const itemTotal = product.price * item.quantity;
        total += itemTotal;
        const mixName = product.mixes[item.mix];
        const displayName = item.customerName ? `${item.customerName} (${mixName})` : `${product.name} (${mixName})`;
        const itemHTML = `
            <div class="modal-item" data-index="${index}">
                <div class="item-details">
                    <strong>${displayName}</strong><br>
                    <span>${item.quantity} ขวด × ${product.price}฿</span>
                </div>
                <div class="item-total">${itemTotal}฿</div>
                <button class="remove-item" data-index="${index}">×</button>
            </div>`;
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
    cart.push({ productId, mix, quantity, customerName });
    updateCartDisplay();
    alert(`เพิ่ม '${customerName || products.find(p => p.id === productId).name}' ลงในตะกร้าแล้ว`);
}

export function getCart() {
    return cart;
}

export function clearCart() {
    cart = [];
    updateCartDisplay();
    const cartModal = document.getElementById('cart-modal');
    if (cartModal) {
        cartModal.style.display = 'none';
    }
}

export function initializeCart() {
    const cartIcon = document.getElementById('cart-icon');
    const cartModal = document.getElementById('cart-modal');
    const clearCartBtn = document.getElementById('clear-cart-btn');

    if (!cartIcon || !cartModal || !clearCartBtn) return;

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