// ui.js
// Responsible for updating the current time/date display and handling
// navigation and category switching on the sales page.

import './utils/date.js'; // side-effects for date formatting if needed
import { showPage } from './main.js';

// Update the dashboard clock every second
function updateTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const dateString = now.toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeEl = document.getElementById('current-time');
  const dateEl = document.getElementById('current-date');
  if (timeEl) timeEl.textContent = timeString;
  if (dateEl) dateEl.textContent = dateString;
}

document.addEventListener('DOMContentLoaded', () => {
  updateTime();
  setInterval(updateTime, 1000);

  // Navigation: switch between pages
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      showPage(btn.dataset.page);
    });
  });

  // Category switching: show only the selected product list
  document.querySelectorAll('.category-card').forEach((card) => {
    card.addEventListener('click', () => {
      // Highlight active card
      document
        .querySelectorAll('.category-card')
        .forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
      // Show corresponding product list
      const category = card.dataset.category;
      document.querySelectorAll('.product-list').forEach((list) => list.classList.remove('active'));
      const activeList = document.getElementById(`product-list-${category}`);
      if (activeList) activeList.classList.add('active');
    });
  });
});