// Firebase client initialization (public config; safe to expose)
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC8yYWxiOH6HRHtBpPA5Qe3_ryV5BKS8m8",
  authDomain: "tomstom-8.firebaseapp.com",
  databaseURL: "https://tomstom-8-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tomstom-8",
  storageBucket: "tomstom-8.firebasestorage.app",
  messagingSenderId: "595696774612",
  appId: "1:595696774612:web:83f068cfa637f7a26d3a41"
};
// If you're using modular SDK v9+:
// import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
// const app = initializeApp(firebaseConfig);
// For namespaced (compat) SDK (v8 style), include firebase-app.js in HTML and then:
if (window.firebase && firebase.initializeApp) {
  window._tomstomFirebaseApp = firebase.initializeApp(firebaseConfig);
}
