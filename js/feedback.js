function showToast(message) {
  const status = document.querySelector('[data-shop-status]');
  if (status) status.textContent = message;
}
