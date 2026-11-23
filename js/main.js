/*
  main.js — общие действия проекта.
  Практическая работа №15: функции расчёта и безопасный вывод через textContent.
  Практическая работа №16: массив товаров и методы массивов
  (map, filter, find, sort, reduce), поиск, фильтр, сортировка и статистика.
*/

console.log('Файл main.js подключён');
console.table(products);

/* ---------- Функции для одного товара (ПР №15) ---------- */

// Цена для покупателя: 32000 → «32 000 ₽».
function formatPrice(price) {
  return `${price.toLocaleString('ru-RU')} ₽`;
}

// Размер скидки в рублях.
function calculateDiscount(price, discountPercent) {
  return price * discountPercent / 100;
}

// Итоговая цена со скидкой.
function calculateFinalPrice(price, discountPercent) {
  const discountValue = calculateDiscount(price, discountPercent);
  return price - discountValue;
}

// Статус товара по логическому полю isAvailable.
function getProductStatus(item) {
  if (item.isAvailable) {
    return 'В наличии';
  }

  return 'Нет в наличии';
}

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

// Поиск по названию без учёта регистра и лишних пробелов.
function searchProducts(items, query) {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery === '') {
    return items;
  }

  return items.filter((item) => {
    return item.title.toLowerCase().includes(normalizedQuery);
  });
}

// Фильтр по категории: 'all' — все товары.
function filterProductsByCategory(items, category) {
  if (category === 'all') {
    return items;
  }

  return items.filter((item) => {
    return item.category === category;
  });
}

// Сортировка по цене. [...items] — копия: исходный массив products не меняется.
function sortProductsByPrice(items, direction = 'asc') {
  const productsCopy = [...items];

  if (direction === 'desc') {
    return productsCopy.sort((a, b) => b.price - a.price);
  }

  return productsCopy.sort((a, b) => a.price - b.price);
}

// find: первый товар с нужным id или undefined.
function findProductById(items, id) {
  return items.find((item) => item.id === id);
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

// Поиск, фильтр и сортировка по очереди — основа будущего каталога.
function getPreparedProducts(items, query, category, sortDirection) {
  let result = [...items];

  result = searchProducts(result, query);
  result = filterProductsByCategory(result, category);
  result = sortProductsByPrice(result, sortDirection);

  return result;
}

/* ---------- Проверка в консоли ---------- */

console.log(getProductTitles(products));
console.table(getAvailableProducts(products));
console.table(searchProducts(products, 'титан'));
console.table(filterProductsByCategory(products, 'sport'));
console.table(sortProductsByPrice(products, 'asc'));
console.table(sortProductsByPrice(products, 'desc'));

const selectedProduct = findProductById(products, 3);

if (selectedProduct) {
  console.log(`Найден товар: ${selectedProduct.title}`);
} else {
  console.log('Товар не найден');
}

console.log(calculateTotalPrice(products));
console.log(countAvailableProducts(products));
console.log(calculateAveragePrice(products));
console.table(getPreparedProducts(products, 'рука', 'daily', 'asc'));
console.log(createProductSummary(products[3]));

/* ---------- Вывод на страницу ---------- */

// Элементы есть только на главной, поэтому проверяем их перед записью.
const messageElement = document.querySelector('.js-message');
const productOutputElement = document.querySelector('.product-output');

if (messageElement) {
  messageElement.textContent = 'Массив товаров и функции обработки данных подключены.';
}

if (productOutputElement) {
  // Строки собираются в массив и объединяются через перевод строки.
  productOutputElement.textContent = [
    `Всего товаров: ${products.length}`,
    `Товаров в наличии: ${countAvailableProducts(products)}`,
    `Средняя цена: ${formatPrice(calculateAveragePrice(products))}`,
    `Самый дешёвый: ${createProductSummary(sortProductsByPrice(products, 'asc')[0])}`,
    `Результатов поиска «титан»: ${searchProducts(products, 'титан').length}`
  ].join('\n');
}
