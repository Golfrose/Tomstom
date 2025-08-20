import { getCart, clearCart } from './cart.js';
import { products } from './config.js';
import { db } from './firebase.js';

function confirmSale() {
    const cart = getCart();
    if (cart.length === 0) {
        alert('ตะกร้าว่างเปล่า');
        return;
    }

    const now = new Date();
    const saleId = now.getTime();
    const dateStr = now.toISOString().split('T')[0];

    const saleData = {
        timestamp: saleId,
        items: {},
        total: 0
    };

    let totalSaleAmount = 0;

    cart.forEach((item, index) => {
        const product = products.find(p => p.id === item.productId);
        const itemTotal = product.price * item.quantity;
        totalSaleAmount += itemTotal;
        saleData.items[`item_${index}`] = {
            productId: item.productId,
            productName: product.name,
            mix: product.mixes[item.mix],
            quantity: item.quantity,
            price: product.price,
            total: itemTotal,
            customerName: item.customerName || ''
        };
    });

    saleData.total = totalSaleAmount;

    db.ref(`sales/${dateStr}/${saleId}`).set(saleData)
        .then(() => {
            alert('บันทึกการขายสำเร็จ!');
            clearCart();
        })
        .catch(error => {
            console.error("Error saving sale: ", error);
            alert('เกิดข้อผิดพลาดในการบันทึกการขาย');
        });
}

export function initializeSales() {
    const confirmSaleBtn = document.getElementById('confirm-sale-btn');
    if (confirmSaleBtn) {
        confirmSaleBtn.addEventListener('click', confirmSale);
    }
}