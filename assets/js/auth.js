// auth.js
// Handles user authentication state changes and login/logout events. This
// module mirrors the original project's behaviour but works with the
// updated UI. When the user logs in, it shows the application and
// default to the sale page. When logged out, it displays the login
// form.

import { auth } from './firebase.js';

// Grab references to key elements. Some may be null before DOMContentLoaded
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const logoutBtn = document.getElementById('logout-btn');

auth.onAuthStateChanged((user) => {
  if (user) {
    // hide auth, show app
    if (authContainer) authContainer.style.display = 'none';
    if (appContainer) appContainer.style.display = 'block';
    // show nav and cart icon
    document.querySelector('.main-nav').style.display = 'flex';
    document.getElementById('cart-icon').style.display = 'flex';
    if (logoutBtn) logoutBtn.style.display = 'block';
    // ensure only sale page is visible by default
    document.querySelectorAll('.page').forEach((p) => (p.style.display = 'none'));
    document.getElementById('sale-page').style.display = 'block';
    // highlight sale nav button
    document.querySelector('.nav-btn.active')?.classList.remove('active');
    document.querySelector('.nav-btn[data-page="sale"]').classList.add('active');
  } else {
    // show login form
    if (authContainer) authContainer.style.display = 'flex';
    if (appContainer) appContainer.style.display = 'none';
  }
});

// Handle login form submission
document.getElementById('login-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('auth-error-message');
  if (errorDiv) errorDiv.textContent = '';
  auth
    .signInWithEmailAndPassword(email, password)
    .catch((error) => {
      if (!errorDiv) return;
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorDiv.textContent = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      } else {
        errorDiv.textContent = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ' + error.message;
      }
    });
});

// Logout button
logoutBtn?.addEventListener('click', () => auth.signOut());
