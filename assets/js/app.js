// =======================================================
// PART 1: CONFIGURATION (จาก config.js)
// =======================================================
const products = [{
    id: 'water_green',
    name: 'น้ำผสมเงิน',
    price: 100,
    category: 'water',
    mixes: {
        mix_green: 'ผสมเงิน',
        mix_green_b: 'ผสมเงินซี',
        mix_green_s: 'ผสมเงินน้ำตาลสด',
    }
}, {
    id: 'water_red',
    name: 'น้ำผสมแดง',
    price: 100,
    category: 'water',
    mixes: {
        mix_red: 'ผสมแดง',
        mix_red_b: 'ผสมแดงซี',
        mix_red_s: 'ผสมแดงน้ำตาลสด',
    }
}, {
    id: 'water_chicken',
    name: 'น้ำผสมไก่',
    price: 100,
    category: 'water',
    mixes: {
        mix_chicken: 'ผสมไก่',
        mix_chicken_b: 'ผสมไก่ซี',
        mix_chicken_s: 'ผสมไก่น้ำตาลสด',
    }
}, {
    id: 'water_c',
    name: 'น้ำผสมซี',
    price: 100,
    category: 'water',
    mixes: {
        mix_c: 'ผสมซี',
        mix_c_b: 'ผสมซีซี',
        mix_c_s: 'ผสมซีน้ำตาลสด',
    }
}, {
    id: 'med_1',
    name: 'ยาฝาเงิน',
    price: 65,
    category: 'med',
    mixes: {
        med_green_1: 'ยาฝาเงิน',
    }
}, {
    id: 'med_2',
    name: 'ยาฝาแดง',
    price: 65,
    category: 'med',
    mixes: {
        med_red_1: 'ยาฝาแดง',
    }
}, ];


// =======================================================
// PART 2: FIREBASE SETUP (จาก firebase.js)
// =======================================================
let auth, db;
if (typeof firebase !== 'undefined') {
    auth = firebase.auth();
    db = firebase.database();
} else {
    console.error("Firebase SDK not loaded. App will not function correctly.");
    alert("เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล");
}


// =======================================================
// PART 3: GLOBAL VARIABLES & STATE
// =======================================================
let cart = [];


// =======================================================
// PART 4: FUNCTIONS (จากทุกไฟล์ .js)
// =======================================================

// --- CART FUNCTIONS (จาก cart.js) ---
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
                <div class="item-details"><strong>${displayName}</strong><br><span>${item.quantity} ขวด × ${product.price}฿</span></div>
                <div class="item-total">${itemTotal}฿</div>
                <button class="remove-item" data-index="${index}">×</button>
            </div>`;
        modalItems.innerHTML += itemHTML;
    });
    modalCartTotal.textContent = total;
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            cart.splice(index, 1);
            updateCartDisplay();
            updateCartModal();
        });
    });
}

function addToCart(productId, mix, quantity, customerName) {
    cart.push({ productId, mix, quantity, customerName });
    updateCartDisplay();
    alert(`เพิ่ม '${customerName || products.find(p => p.id === productId).name}' ลงในตะกร้าแล้ว`);
}

function clearCart() {
    cart = [];
    updateCartDisplay();
    const cartModal = document.getElementById('cart-modal');
    if (cartModal) cartModal.style.display = 'none';
}


// --- UI FUNCTIONS (จาก ui.js) ---
function renderProducts() {
    const productListWater = document.getElementById('product-list-water');
    const productListMed = document.getElementById('product-list-med');
    if (!productListWater || !productListMed) return;
    productListWater.innerHTML = '';
    productListMed.innerHTML = '';
    products.forEach(product => {
        const mixOptionsHTML = Object.entries(product.mixes).map(([key, name], index) => `<label class="mix-option"><input type="radio" name="mix-${product.id}" value="${key}" ${index === 0 ? 'checked' : ''}><span>${name}</span></label>`).join('');
        const productCardHTML = `
            <div class="product-card" data-product-id="${product.id}">
                <h3>${product.name}</h3><span class="price">${product.price} บาท/ขวด</span>
                <div class="customer-name-container"><input type="text" class="customer-name-input" placeholder="ชื่อลูกค้า (ถ้ามี)"></div>
                <div class="mix-options">${mixOptionsHTML}</div>
                <div class="quantity-control">
                    <button class="quantity-btn" data-action="decrease">-</button><input type="number" class="quantity-input" value="0" min="0"><button class="quantity-btn" data-action="increase">+</button>
                </div><button class="add-to-cart-btn">เพิ่มลงตะกร้า</button>
            </div>`;
        if (product.category === 'water') productListWater.innerHTML += productCardHTML;
        else if (product.category === 'med') productListMed.innerHTML += productCardHTML;
    });
    document.querySelectorAll('.product-card').forEach(card => {
        const productId = card.dataset.productId;
        const quantityInput = card.querySelector('.quantity-input');
        card.querySelector('.quantity-btn[data-action="decrease"]').addEventListener('click', () => { if (parseInt(quantityInput.value) > 0) quantityInput.value = parseInt(quantityInput.value) - 1; });
        card.querySelector('.quantity-btn[data-action="increase"]').addEventListener('click', () => { quantityInput.value = parseInt(quantityInput.value) + 1; });
        card.querySelector('.add-to-cart-btn').addEventListener('click', () => {
            const quantity = parseInt(quantityInput.value);
            if (quantity > 0) {
                const selectedMix = card.querySelector(`input[name="mix-${productId}"]:checked`).value;
                const customerName = card.querySelector('.customer-name-input').value.trim();
                addToCart(productId, selectedMix, quantity, customerName);
                quantityInput.value = 0;
                card.querySelector('.customer-name-input').value = '';
            } else alert('กรุณาระบุจำนวนสินค้า');
        });
    });
}


// --- SALES & REPORT FUNCTIONS (จาก sales.js, report.js) ---
function confirmSale() {
    if (cart.length === 0) return alert('ตะกร้าว่างเปล่า');
    const now = new Date();
    const saleId = now.getTime();
    const dateStr = now.toISOString().split('T')[0];
    const saleData = { timestamp: saleId, items: {}, total: 0 };
    let totalSaleAmount = 0;
    cart.forEach((item, index) => {
        const product = products.find(p => p.id === item.productId);
        const itemTotal = product.price * item.quantity;
        totalSaleAmount += itemTotal;
        saleData.items[`item_${index}`] = { productId: item.productId, productName: product.name, mix: product.mixes[item.mix], quantity: item.quantity, price: product.price, total: itemTotal, customerName: item.customerName || '' };
    });
    saleData.total = totalSaleAmount;
    db.ref(`sales/${dateStr}/${saleId}`).set(saleData).then(() => { alert('บันทึกการขายสำเร็จ!'); clearCart(); }).catch(error => { console.error("Error saving sale: ", error); alert('เกิดข้อผิดพลาดในการบันทึกการขาย'); });
}

function loadReport() { /* ... โค้ดส่วน Report ... */ }
function initializeReport() { /* ... โค้ดส่วน Report ... */ }
function initializeCompare() { /* ... โค้ดส่วน Compare ... */ }


// --- MAIN APP INITIALIZATION (จาก main.js, auth.js) ---
function initializeApp() {

    // PART A: AUTHENTICATION
    const loginForm = document.getElementById('login-form');
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const logoutBtn = document.getElementById('logout-btn');
    const authErrorMessage = document.getElementById('auth-error-message');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            auth.signInWithEmailAndPassword(loginForm.email.value, loginForm.password.value)
                .catch(error => { authErrorMessage.textContent = "อีเมลหรือรหัสผ่านไม่ถูกต้อง"; });
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => auth.signOut());
    }

    auth.onAuthStateChanged(user => {
        if (user) {
            authContainer.style.display = 'none';
            appContainer.style.display = 'block';
            logoutBtn.style.display = 'block';
        } else {
            authContainer.style.display = 'flex';
            appContainer.style.display = 'none';
            logoutBtn.style.display = 'none';
        }
    });

    // PART B: SETUP UI & EVENTS (เมื่อ login สำเร็จแล้ว)
    renderProducts();

    // Setup Navigation
    document.querySelectorAll('.main-nav .nav-btn').forEach(button => {
        button.addEventListener('click', () => {
            const pageId = button.dataset.page;
            document.querySelectorAll('.page').forEach(page => page.style.display = 'none');
            document.getElementById(`${pageId}-page`).style.display = 'block';
            document.querySelectorAll('.main-nav .nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.page === pageId));
        });
    });

    // Setup Category Selector
    const selectors = document.querySelectorAll('.category-selector .category-card');
    const waterColumn = document.getElementById('product-column-water');
    const medColumn = document.getElementById('product-column-med');
    selectors.forEach(selector => {
        selector.addEventListener('click', () => {
            selectors.forEach(s => s.classList.remove('active'));
            selector.classList.add('active');
            const category = selector.dataset.category;
            waterColumn.style.display = (category === 'water') ? 'block' : 'none';
            medColumn.style.display = (category === 'med') ? 'block' : 'none';
        });
    });

    // Setup Cart
    const cartIcon = document.getElementById('cart-icon');
    const cartModal = document.getElementById('cart-modal');
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const confirmSaleBtn = document.getElementById('confirm-sale-btn');

    cartIcon.addEventListener('click', () => { if (cart.length > 0) { updateCartModal(); cartModal.style.display = 'flex'; } });
    cartModal.addEventListener('click', (e) => { if (e.target === cartModal) cartModal.style.display = 'none'; });
    clearCartBtn.addEventListener('click', () => { if (confirm('ต้องการล้างตะกร้าใช่หรือไม่?')) clearCart(); });
    confirmSaleBtn.addEventListener('click', confirmSale);

    // Setup Clock
    const timeEl = document.getElementById('current-time');
    const dateEl = document.getElementById('current-date');
    const updateClock = () => {
        const now = new Date();
        timeEl.textContent = now.toLocaleTimeString('th-TH');
        dateEl.textContent = now.toLocaleDateString('th-TH', { dateStyle: 'full' });
    };
    updateClock();
    setInterval(updateClock, 1000);
}


// =======================================================
// START THE APP!
// =======================================================
document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase !== 'undefined') {
        initializeApp();
    }
});