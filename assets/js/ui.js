// ui.js
import './utils/date.js'; // side-effects if needed
import { showPage } from './main.js';

function updateTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = now.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  document.getElementById('current-time').textContent = timeString;
  document.getElementById('current-date').textContent = dateString;
}

document.addEventListener('DOMContentLoaded', () => {
  updateTime();
  setInterval(updateTime, 1000);

  // nav click
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      showPage(btn.dataset.page);
    });
  });
});
