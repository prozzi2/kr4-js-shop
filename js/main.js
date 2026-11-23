/*
  main.js — общие действия проекта.
  Практическая работа №15: функции расчёта и безопасный вывод через textContent.
  Практическая работа №16: массив товаров и методы массивов
  (map, filter, find, sort, reduce) и статистика магазина.
  Практическая работа №17: поиск, фильтр и сортировка переехали в catalog.js.
*/



/* ---------- Функции для одного товара (ПР №15) ----------
   formatPrice, calculateDiscount, calculateFinalPrice и getProductStatus
   перенесены в data.js: они нужны и каталогу, и другим страницам. */

// Краткое описание: название, цена со скидкой и статус.
function createProductSummary(item) {
  const finalPrice = calculateFinalPrice(item.price, item.discountPercent);
  const status = getProductStatus(item);

  return `${item.title}: ${formatPrice(finalPrice)}. Статус: ${status}.`;
}

/* ---------- Функции для массива товаров (ПР №16) ---------- */

// map: новый массив из названий товаров.
function getProductTitles(items) {
  return items.map((item) => item.title);
}

// filter: только товары в наличии.
function getAvailableProducts(items) {
  return items.filter((item) => item.isAvailable);
}

// Поиск, фильтр по категории и сортировка перенесены в catalog.js,
// поиск товара по id (findProductById) — в data.js.

// Копия массива, отсортированная по цене. Исходный массив не меняется.
function sortProductsByPrice(items, direction = 'asc') {
  const productsCopy = [...items];

  if (direction === 'desc') {
    return productsCopy.sort((a, b) => b.price - a.price);
  }

  return productsCopy.sort((a, b) => a.price - b.price);
}

// reduce: сумма цен всех товаров.
function calculateTotalPrice(items) {
  return items.reduce((sum, item) => {
    return sum + item.price;
  }, 0);
}

function countAvailableProducts(items) {
  return items.filter((item) => item.isAvailable).length;
}

// Средняя цена. Для пустого массива возвращаем 0, чтобы не делить на ноль.
function calculateAveragePrice(items) {
  if (items.length === 0) {
    return 0;
  }

  const totalPrice = calculateTotalPrice(items);
  return Math.round(totalPrice / items.length);
}

/* ---------- Вывод на страницу ---------- */

// Элементы есть только на главной, поэтому проверяем их перед записью.
const messageElement = document.querySelector('.js-message');
const productOutputElement = document.querySelector('.product-output');

if (messageElement) {
  messageElement.textContent = 'Выберите товар в каталоге — поиск и фильтры помогут найти подходящий вариант.';
}

if (productOutputElement) {
  // Строки собираются в массив и объединяются через перевод строки.
  productOutputElement.textContent = [
    `Всего товаров: ${products.length}`,
    `Товаров в наличии: ${countAvailableProducts(products)}`,
    `Средняя цена: ${formatPrice(calculateAveragePrice(products))}`,
    `Самый дешёвый: ${createProductSummary(sortProductsByPrice(products, 'asc')[0])}`
  ].join('\n');
}
