/*
  cart.js — корзина, избранное и промокоды.

  Состояние корзины — массив cart из объектов { productId, quantity }.
  Хранится только id и количество: название и цена всегда берутся
  из актуального массива products, поэтому в корзине не бывает устаревших цен.
  После каждого изменения корзина сохраняется в localStorage,
  а счётчик в шапке и страница корзины обновляются.
*/

const MAX_QUANTITY = 10;
const DELIVERY_PRICE = 500;
const FREE_DELIVERY_FROM = 30000;

// Учебные промокоды: код → скидка в процентах.
const PROMO_CODES = {
  ARM10: 10,
  STUDENT5: 5
};

/* ---------- 1. Восстановление состояния из localStorage ---------- */

// Из хранилища может прийти что угодно (ручная правка, старая версия сайта),
// поэтому каждую позицию проверяем: id существует, количество — целое от 1 до 10.
function isValidCartItem(item) {
  return (
    item !== null &&
    typeof item === 'object' &&
    Number.isInteger(item.productId) &&
    Number.isInteger(item.quantity) &&
    item.quantity >= 1 &&
    item.quantity <= MAX_QUANTITY &&
    findProductById(products, item.productId) !== undefined
  );
}

function loadCart() {
  const savedCart = loadFromStorage(STORAGE_KEYS.cart, []);

  if (!Array.isArray(savedCart)) {
    return [];
  }

  const unique = new Map();
  savedCart.filter(isValidCartItem).forEach(item => {
    if (findProductById(products, item.productId).isAvailable) {
      unique.set(item.productId, { productId: item.productId, quantity: Math.min(MAX_QUANTITY, (unique.get(item.productId)?.quantity || 0) + item.quantity) });
    }
  });
  return [...unique.values()];
}

function loadFavorites() {
  const savedFavorites = loadFromStorage(STORAGE_KEYS.favorites, []);

  if (!Array.isArray(savedFavorites)) {
    return [];
  }

  return savedFavorites.filter((id) => findProductById(products, id) !== undefined);
}

function loadPromo() {
  const savedCode = loadFromStorage(STORAGE_KEYS.promo, '');
  return Object.hasOwn(PROMO_CODES, savedCode) ? savedCode : '';
}

let cart = loadCart();
let favorites = loadFavorites();
let promoCode = loadPromo();

/* ---------- 2. Действия с корзиной ---------- */

function saveCart() {
  saveToStorage(STORAGE_KEYS.cart, cart);
  updateCartCounters();
  renderCartPage();
  renderOrderSummary();
}

function findCartItem(productId) {
  return cart.find((item) => item.productId === productId);
}

// Возвращает true, если товар добавлен, и false, если добавить нельзя.
function addToCart(productId, quantity = 1) {
  const item = findProductById(products, productId);

  if (!item || !item.isAvailable || !Number.isInteger(quantity) || quantity < 1) {
    return false;
  }

  const cartItem = findCartItem(productId);

  if (cartItem) {
    if (cartItem.quantity >= MAX_QUANTITY) {
      return false;
    }

    cartItem.quantity = Math.min(cartItem.quantity + quantity, MAX_QUANTITY);
  } else {
    cart.push({ productId, quantity: Math.min(quantity, MAX_QUANTITY) });
  }

  saveCart();
  return true;
}

function setCartQuantity(productId, quantity) {
  const cartItem = findCartItem(productId);

  if (!cartItem || !Number.isInteger(quantity)) {
    return;
  }

  // Количество всегда остаётся в пределах от 1 до 10.
  cartItem.quantity = Math.min(Math.max(quantity, 1), MAX_QUANTITY);
  saveCart();
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.productId !== productId);
  saveCart();
}

function clearCart() {
  cart = [];
  saveCart();
}

/* ---------- 3. Расчёты (reduce) ---------- */

// Позиции корзины вместе с данными товара.
function getCartLines() {
  return cart.map((cartItem) => {
    const item = findProductById(products, cartItem.productId);

    return {
      product: item,
      quantity: cartItem.quantity,
      lineTotal: getFinalPrice(item) * cartItem.quantity
    };
  });
}

// Сколько штук товаров в корзине.
function getCartCount() {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

// Стоимость товаров с учётом скидок на сами товары.
function getCartSubtotal() {
  return getCartLines().reduce((sum, line) => sum + line.lineTotal, 0);
}

// Итог заказа: товары − промокод + доставка.
function calculateOrderTotals(deliveryType = 'pickup') {
  const subtotal = getCartSubtotal();
  const promoPercent = promoCode ? PROMO_CODES[promoCode] : 0;
  const promoDiscount = Math.round(subtotal * promoPercent / 100);
  const afterDiscount = subtotal - promoDiscount;

  let delivery = 0;

  if (deliveryType === 'courier' && afterDiscount > 0 && afterDiscount < FREE_DELIVERY_FROM) {
    delivery = DELIVERY_PRICE;
  }

  return {
    count: getCartCount(),
    subtotal,
    promoPercent,
    promoDiscount,
    delivery,
    total: afterDiscount + delivery
  };
}

/* ---------- 4. Промокод ---------- */

// Возвращает объект с результатом, чтобы страница показала понятное сообщение.
function applyPromoCode(rawCode) {
  const code = rawCode.trim().toUpperCase();

  if (code === '') {
    return { ok: false, message: 'Введите промокод.' };
  }

  if (!Object.hasOwn(PROMO_CODES, code)) {
    return { ok: false, message: `Промокод «${code}» не найден.` };
  }

  promoCode = code;
  saveToStorage(STORAGE_KEYS.promo, promoCode);
  saveCart();

  return { ok: true, message: `Промокод ${code} применён: скидка ${PROMO_CODES[code]}%.` };
}

function removePromoCode() {
  promoCode = '';
  removeFromStorage(STORAGE_KEYS.promo);
  saveCart();
}

/* ---------- 5. Избранное ---------- */

function isFavorite(productId) {
  return favorites.includes(productId);
}

// Добавляет товар в избранное или убирает его оттуда. Возвращает новое состояние.
function toggleFavorite(productId) {
  if (isFavorite(productId)) {
    favorites = favorites.filter((id) => id !== productId);
  } else {
    favorites.push(productId);
  }

  saveToStorage(STORAGE_KEYS.favorites, favorites);
  return isFavorite(productId);
}

/* ---------- 6. Счётчик в шапке ---------- */

function updateCartCounters() {
  const count = getCartCount();

  document.querySelectorAll('[data-cart-count]').forEach((counter) => {
    counter.textContent = String(count);
    counter.classList.toggle('cart-count--empty', count === 0);
  });
}

/* ---------- 7. Страница корзины (cart.html) ---------- */

const cartContainer = document.querySelector('[data-cart-container]');
const cartEmptyState = document.querySelector('.cart-empty');
const cartContent = document.querySelector('.cart-content');
const promoForm = document.querySelector('#promo-form');
const promoMessage = document.querySelector('.promo-message');

function setSummaryValue(name, text) {
  document.querySelectorAll(`[data-summary="${name}"]`).forEach((element) => {
    element.textContent = text;
  });
}

function createQuantityButton(action, label, text, productTitle) {
  const button = document.createElement('button');
  button.classList.add('quantity-control__button');
  button.type = 'button';
  button.dataset.action = action;
  button.textContent = text;
  button.setAttribute('aria-label', `${label}: ${productTitle}`);
  return button;
}

function createCartItem(line) {
  const { product: item, quantity, lineTotal } = line;

  const row = document.createElement('li');
  row.classList.add('cart-item');
  row.dataset.productId = String(item.id);

  const image = document.createElement('img');
  image.classList.add('cart-item__image');
  image.src = `images/${item.image}-320.jpg`;
  image.alt = '';
  image.width = 96;
  image.height = 96;

  const info = document.createElement('div');
  info.classList.add('cart-item__info');

  const title = document.createElement('a');
  title.classList.add('cart-item__title');
  title.href = `product.html?id=${item.id}`;
  title.textContent = item.title;

  const unitPrice = document.createElement('p');
  unitPrice.classList.add('cart-item__price');
  unitPrice.textContent = `${formatPrice(getFinalPrice(item))} за шт.`;

  info.append(title, unitPrice);

  // Количество: кнопки −/+ и поле ввода.
  const quantityControl = document.createElement('div');
  quantityControl.classList.add('quantity-control');

  const quantityInput = document.createElement('input');
  quantityInput.classList.add('quantity-control__input');
  quantityInput.type = 'number';
  quantityInput.min = '1';
  quantityInput.max = String(MAX_QUANTITY);
  quantityInput.value = String(quantity);
  quantityInput.inputMode = 'numeric';
  quantityInput.dataset.action = 'set-quantity';
  quantityInput.setAttribute('aria-label', `Количество: ${item.title}`);

  const decreaseButton = createQuantityButton('decrease', 'Уменьшить количество', '−', item.title);
  const increaseButton = createQuantityButton('increase', 'Увеличить количество', '+', item.title);
  decreaseButton.disabled = quantity <= 1;
  increaseButton.disabled = quantity >= MAX_QUANTITY;

  quantityControl.append(decreaseButton, quantityInput, increaseButton);

  const total = document.createElement('p');
  total.classList.add('cart-item__total');
  total.textContent = formatPrice(lineTotal);

  const removeButton = document.createElement('button');
  removeButton.classList.add('button', 'button--ghost', 'cart-item__remove');
  removeButton.type = 'button';
  removeButton.dataset.action = 'remove';
  removeButton.textContent = 'Удалить';
  removeButton.setAttribute('aria-label', `Удалить из корзины: ${item.title}`);

  row.append(image, info, quantityControl, total, removeButton);
  return row;
}

function renderCartPage() {
  if (!cartContainer) {
    return;
  }

  const lines = getCartLines();
  const totals = calculateOrderTotals('pickup');

  cartContainer.textContent = '';
  lines.forEach((line) => cartContainer.append(createCartItem(line)));

  cartEmptyState.hidden = lines.length > 0;
  cartContent.hidden = lines.length === 0;

  setSummaryValue('count', `${totals.count} шт.`);
  setSummaryValue('subtotal', formatPrice(totals.subtotal));
  setSummaryValue('promo', totals.promoDiscount > 0 ? `−${formatPrice(totals.promoDiscount)}` : 'нет');
  setSummaryValue('total', formatPrice(totals.total));

  // Если промокод уже применён, показываем его и кнопку «Убрать».
  const appliedPromo = document.querySelector('.promo-applied');

  if (appliedPromo) {
    appliedPromo.hidden = promoCode === '';
    appliedPromo.querySelector('[data-promo-code]').textContent = promoCode;
  }

  const freeDeliveryNote = document.querySelector('.cart-delivery-note');

  if (freeDeliveryNote) {
    const left = FREE_DELIVERY_FROM - (totals.subtotal - totals.promoDiscount);
    freeDeliveryNote.textContent = left > 0
      ? `До бесплатной доставки курьером осталось ${formatPrice(left)}.`
      : 'Доставка курьером для этого заказа бесплатная.';
  }
}

if (cartContainer) {
  // Делегирование: один обработчик для кнопок всех позиций корзины.
  cartContainer.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');

    if (!button) {
      return;
    }

    const productId = Number(button.closest('.cart-item').dataset.productId);
    const cartItem = findCartItem(productId);

    if (button.dataset.action === 'increase') {
      setCartQuantity(productId, cartItem.quantity + 1);
    }

    if (button.dataset.action === 'decrease') {
      setCartQuantity(productId, cartItem.quantity - 1);
    }

    if (button.dataset.action === 'remove') {
      const item = findProductById(products, productId);
      removeFromCart(productId);
      showToast(`«${item.title}» удалён из корзины.`);
    }

    // После перерисовки старая кнопка исчезла — возвращаем фокус в ту же строку.
    const sameRow = cartContainer.querySelector(`[data-product-id="${productId}"] [data-action="${button.dataset.action}"]`);

    if (sameRow && !sameRow.disabled) {
      sameRow.focus();
    } else {
      cartContainer.closest('section').focus();
    }
  });

  // Ручной ввод количества: change срабатывает, когда пользователь закончил ввод.
  cartContainer.addEventListener('change', (event) => {
    if (event.target.dataset.action !== 'set-quantity') {
      return;
    }

    const productId = Number(event.target.closest('.cart-item').dataset.productId);
    const quantity = Number(event.target.value);

    if (Number.isInteger(quantity)) {
      setCartQuantity(productId, quantity);
    } else {
      renderCartPage();
    }
  });

  const clearCartButton = document.querySelector('[data-clear-cart]');

  if (clearCartButton) {
    clearCartButton.addEventListener('click', () => {
      clearCart();
      showToast('Корзина очищена.');
    });
  }
}

if (promoForm) {
  promoForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const result = applyPromoCode(promoForm.elements.promo.value);

    promoMessage.textContent = result.message;
    promoMessage.classList.toggle('promo-message--error', !result.ok);

    if (result.ok) {
      promoForm.reset();
    }
  });

  document.querySelector('[data-remove-promo]').addEventListener('click', () => {
    removePromoCode();
    promoMessage.textContent = 'Промокод убран.';
    promoMessage.classList.remove('promo-message--error');
  });
}

/* ---------- 8. Сводка заказа (order.html) ---------- */

const orderSummaryList = document.querySelector('[data-order-items]');

function getSelectedDelivery() {
  const checked = document.querySelector('input[name="delivery"]:checked');
  return checked ? checked.value : 'pickup';
}

function renderOrderSummary() {
  if (!orderSummaryList) {
    return;
  }

  const lines = getCartLines();
  const totals = calculateOrderTotals(getSelectedDelivery());

  orderSummaryList.textContent = '';

  lines.forEach((line) => {
    const item = document.createElement('li');
    const name = document.createElement('span');
    const sum = document.createElement('span');

    name.textContent = `${line.product.title} × ${line.quantity}`;
    sum.textContent = formatPrice(line.lineTotal);

    item.append(name, sum);
    orderSummaryList.append(item);
  });

  document.querySelector('.order-cart-empty').hidden = lines.length > 0;
  document.querySelector('.order-totals').hidden = lines.length === 0;

  setSummaryValue('subtotal', formatPrice(totals.subtotal));
  setSummaryValue('promo', totals.promoDiscount > 0 ? `−${formatPrice(totals.promoDiscount)} (${promoCode})` : 'нет');
  setSummaryValue('delivery', totals.delivery > 0 ? formatPrice(totals.delivery) : 'бесплатно');
  setSummaryValue('total', formatPrice(totals.total));
}

/* ---------- 9. Первый вывод и синхронизация вкладок ---------- */

updateCartCounters();
renderCartPage();
renderOrderSummary();

// Если корзину изменили в другой вкладке, событие storage приходит сюда —
// перечитываем данные, чтобы счётчик и страница не показывали старое.
window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEYS.cart || event.key === STORAGE_KEYS.promo) {
    cart = loadCart();
    promoCode = loadPromo();
    updateCartCounters();
    renderCartPage();
    renderOrderSummary();
  }

  if (event.key === STORAGE_KEYS.favorites) {
    favorites = loadFavorites();
  }
});
