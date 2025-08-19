// auth.js
import { auth } from './firebase.js';

const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const logoutBtn = document.getElementById('logout-btn');

auth.onAuthStateChanged(user => {
  if (user) {
    authContainer.style.display = 'none';
    appContainer.style.display = 'block';
    document.querySelector('.main-nav').style.display = 'flex';
    document.getElementById('cart-icon').style.display = 'flex';
    logoutBtn.style.display = 'block';
    // default page
    document.querySelector('.nav-btn.active')?.classList.remove('active');
    document.querySelector('.nav-btn[data-page="sale"]').classList.add('active');
    document.getElementById('sale-page').style.display = 'block';
  } else {
    authContainer.style.display = 'flex';
    appContainer.style.display = 'none';
  }
});

document.getElementById('login-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('auth-error-message');
  errorDiv.textContent = '';

  auth.signInWithEmailAndPassword(email, password)
    .catch((error) => {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorDiv.textContent = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      } else {
        errorDiv.textContent = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ' + error.message;
      }
    });
});

logoutBtn?.addEventListener('click', () => auth.signOut());
