let cart = [];

const cartIcon = document.getElementById('cart-icon');
const cartCount = document.getElementById('cart-count');
const cartModal = document.getElementById('cart-modal');
const modalItems = document.getElementById('modal-items');
const modalCartTotal = document.getElementById('modal-cart-total');
const clearCartBtn = document.getElementById('clear-cart-btn');

// ฟังก์ชันสำหรับเพิ่มสินค้าลงตะกร้า
export function addToCart(productData) {
    const existingItemIndex = cart.findIndex(item =>
        item.id === productData.id &&
        item.mix === productData.mix &&
        item.customerName === productData.customerName &&
        item.paymentMethod === 'cash'
    );

    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += productData.quantity;
    } else {
        cart.push(productData);
    }
    updateCartUI();
}

// ฟังก์ชันสำหรับลบสินค้าออกจากตะกร้า
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

// ฟังก์ชันสำหรับล้างตะกร้า
export function clearCart() {
    cart = [];
    updateCartUI();
}

// ฟังก์ชันสำหรับอัปเดตหน้าตาของตะกร้า
export function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    cartIcon.style.display = totalItems > 0 ? 'flex' : 'none';

    if (cart.length === 0) {
        modalItems.innerHTML = '<p style="text-align:center; opacity:0.7;">ตะกร้าว่างเปล่า</p>';
        modalCartTotal.textContent = 0;
        return;
    }

    let itemsHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        const isTransfer = item.paymentMethod === 'transfer';
        const customerDisplay = item.customerName ? ` <strong>(${item.customerName})</strong>` : '';

        itemsHTML += `
            <div class="modal-item" data-index="${index}">
                <div class="item-details">
                    ${item.name} - ${item.mix}${customerDisplay}
                    <br>
                    <small>${item.quantity} x ${item.price} บาท</small>
                </div>
                <div class="item-total">${itemTotal} บาท</div>
                <div class="item-actions">
                    <label class="payment-method-toggle" title="ติ๊กเพื่อระบุว่า 'โอน'">
                        <input type="checkbox" class="payment-checkbox" data-index="${index}" ${isTransfer ? 'checked' : ''}>
                        <span class="payment-method-checkmark"></span>
                    </label>
                    <button class="remove-item" data-index="${index}">&times;</button>
                </div>
            </div>
        `;
    });

    modalItems.innerHTML = itemsHTML;
    modalCartTotal.textContent = total;
}

// เพิ่ม Event Listeners
cartIcon.addEventListener('click', () => {
    updateCartUI(); // อัปเดต UI ทุกครั้งที่เปิด Modal
    cartModal.style.display = 'flex';
});

cartModal.addEventListener('click', (e) => {
    const target = e.target;
    if (target.id === 'cart-modal' || target.closest('.cancel-btn')) {
        cartModal.style.display = 'none';
    }
    if (target.classList.contains('remove-item')) {
        removeFromCart(target.dataset.index);
    }
});

cartModal.addEventListener('change', (e) => {
    if (e.target.classList.contains('payment-checkbox')) {
        const index = e.target.dataset.index;
        if (cart[index]) {
            cart[index].paymentMethod = e.target.checked ? 'transfer' : 'cash';
        }
    }
});

clearCartBtn.addEventListener('click', () => {
    if (confirm('คุณต้องการล้างตะกร้าทั้งหมดใช่หรือไม่?')) {
        clearCart();
    }
});

export function getCart() {
    return cart;
}