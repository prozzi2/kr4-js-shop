/*
  main.js — общие действия проекта.
  Практическая работа №15: объект товара, функции расчёта
  и безопасный вывод результата на страницу через textContent.
*/

console.log('Файл main.js подключён');
console.log(product);
console.table(product);

// Цена для покупателя: 32000 → «32 000 ₽».
// Функция возвращает строку (return), а не печатает её в консоль.
function formatPrice(price) {
  return `${price.toLocaleString('ru-RU')} ₽`;
}

// Размер скидки в рублях.
function calculateDiscount(price, discountPercent) {
  return price * discountPercent / 100;
}

// Итоговая цена со скидкой. Формула скидки написана в одном месте — в calculateDiscount.
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

console.log(formatPrice(product.price));
console.log(calculateDiscount(product.price, product.discountPercent));
console.log(calculateFinalPrice(product.price, product.discountPercent));
console.log(getProductStatus(product));

const productSummary = createProductSummary(product);
console.log(productSummary);

// main.js подключён на всех страницах, а учебный блок есть только на главной.
// Поэтому перед записью текста проверяем, что элемент найден.
const messageElement = document.querySelector('.js-message');
const productOutputElement = document.querySelector('.product-output');

if (messageElement) {
  messageElement.textContent = 'JavaScript подключён корректно.';
}

if (productOutputElement) {
  // textContent выводит строку как обычный текст, а не как HTML-разметку.
  productOutputElement.textContent = productSummary;

  // Демонстрация: строка с HTML-тегом через textContent показывается как текст
  // и не выполняется. Через innerHTML такой тег стал бы настоящим элементом.
  // const unsafeExample = '<img src=x onerror=alert(1)>';
  // productOutputElement.innerHTML = unsafeExample;   // небезопасно
  // productOutputElement.textContent = unsafeExample; // безопасно
}
