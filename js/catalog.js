/*
  catalog.js — каталог товаров.
  Карточки создаются из массива products через document.createElement(),
  поиск, фильтры и сортировка меняют состояние catalogState,
  после чего каталог перерисовывается (updateCatalog).
*/

/* ---------- 1. Элементы страницы ---------- */

const productsContainer = document.querySelector('[data-products-container]');
const searchInput = document.querySelector('#catalog-search');
const categoryFilter = document.querySelector('#category-filter');
const genderFilter = document.querySelector('#gender-filter');
const priceFilter = document.querySelector('#price-filter');
const priceFilterOutput = document.querySelector('#price-filter-output');
const stockFilter = document.querySelector('#stock-filter');
const sortSelect = document.querySelector('#sort-select');
const catalogCount = document.querySelector('.catalog-count');
const catalogEmpty = document.querySelector('.catalog-empty');
const filtersPanel = document.querySelector('#catalog-filters');
const filtersToggle = document.querySelector('.filters-toggle');

/* ---------- 2. Состояние каталога ---------- */

// Всё, что выбрал пользователь, хранится в одном объекте.
// Интерфейс — отображение этого состояния.
const catalogState = {
  query: '',
  category: 'all',
  gender: 'all',
  maxPrice: priceFilter ? Number(priceFilter.max) : Infinity,
  onlyAvailable: false,
  sort: 'default'
};

/* ---------- 3. Подготовка данных ---------- */

function searchProducts(items, query) {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery === '') {
    return items;
  }

  return items.filter((item) => {
    return item.title.toLowerCase().includes(normalizedQuery);
  });
}

function filterProductsByCategory(items, category) {
  if (category === 'all') {
    return items;
  }

  return items.filter((item) => item.category === category);
}

function filterProductsByGender(items, gender) {
  if (gender === 'all') {
    return items;
  }

  return items.filter((item) => item.gender === gender);
}

// Цена сравнивается с учётом скидки — так, как её видит покупатель.
function filterProductsByPrice(items, maxPrice) {
  return items.filter((item) => getFinalPrice(item) <= maxPrice);
}

function filterAvailableProducts(items, onlyAvailable) {
  if (!onlyAvailable) {
    return items;
  }

  return items.filter((item) => item.isAvailable);
}

// sort() меняет массив, поэтому сортируем копию [...items].
function sortProducts(items, sortType) {
  const productsCopy = [...items];

  if (sortType === 'price-asc') {
    return productsCopy.sort((a, b) => getFinalPrice(a) - getFinalPrice(b));
  }

  if (sortType === 'price-desc') {
    return productsCopy.sort((a, b) => getFinalPrice(b) - getFinalPrice(a));
  }

  if (sortType === 'title-asc') {
    return productsCopy.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
  }

  if (sortType === 'rating-desc') {
    return productsCopy.sort((a, b) => b.rating - a.rating);
  }

  return productsCopy;
}

// Все условия применяются по очереди к результату предыдущего шага.
function getPreparedProducts(items, state) {
  let result = [...items];

  result = searchProducts(result, state.query);
  result = filterProductsByCategory(result, state.category);
  result = filterProductsByGender(result, state.gender);
  result = filterProductsByPrice(result, state.maxPrice);
  result = filterAvailableProducts(result, state.onlyAvailable);
  result = sortProducts(result, state.sort);

  return result;
}

/* ---------- 4. Карточка товара ---------- */

// srcset из трёх размеров одного изображения: 320w, 480w, 640w.
function buildSrcset(imageName, extension) {
  return [320, 480, 640]
    .map((width) => `images/${imageName}-${width}.${extension} ${width}w`)
    .join(', ');
}

// Изображение товара: WebP для современных браузеров и JPEG как запасной вариант.
function createProductPicture(item, sizes) {
  const picture = document.createElement('picture');

  const source = document.createElement('source');
  source.type = 'image/webp';
  source.srcset = buildSrcset(item.image, 'webp');
  source.sizes = sizes;

  const image = document.createElement('img');
  image.classList.add('product-card__image');
  image.src = `images/${item.image}-480.jpg`;
  image.srcset = buildSrcset(item.image, 'jpg');
  image.sizes = sizes;
  image.alt = item.alt;
  image.width = 640;
  image.height = 640;
  image.loading = 'lazy';

  picture.append(source, image);
  return picture;
}

// Цена: итоговая и, если есть скидка, зачёркнутая старая.
function createPriceElement(item, className) {
  const price = document.createElement('p');
  price.classList.add(className);
  price.textContent = formatPrice(getFinalPrice(item));

  if (item.discountPercent > 0) {
    const hiddenLabel = document.createElement('span');
    hiddenLabel.classList.add('visually-hidden');
    hiddenLabel.textContent = 'Старая цена:';

    const oldPrice = document.createElement('del');
    oldPrice.textContent = formatPrice(item.price);

    price.append(' ', hiddenLabel, ' ', oldPrice);
  }

  return price;
}

function createProductCard(item, sizes = '(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 280px') {
  const card = document.createElement('article');
  card.classList.add('product-card');
  card.dataset.productId = String(item.id);

  if (!item.isAvailable) {
    card.classList.add('product-card--unavailable');
  }

  const body = document.createElement('div');
  body.classList.add('product-card__body');

  // Метка: своя из данных или размер скидки.
  const badgeText = item.discountPercent > 0 ? `Скидка −${item.discountPercent}%` : item.badge;

  if (badgeText) {
    const badge = document.createElement('p');
    badge.classList.add('product-card__badge');
    badge.textContent = badgeText;
    body.append(badge);
  }

  const title = document.createElement('h3');
  title.classList.add('product-card__title');

  const titleLink = document.createElement('a');
  titleLink.href = `product.html?id=${item.id}`;
  titleLink.textContent = item.title;
  title.append(titleLink);

  const meta = document.createElement('p');
  meta.classList.add('product-card__meta');
  meta.textContent = `★ ${item.rating.toFixed(1)} · ${categoryNames[item.category]}`;

  const description = document.createElement('p');
  description.classList.add('product-card__description');
  description.textContent = item.description;

  const price = createPriceElement(item, 'product-card__price');

  const status = document.createElement('p');
  status.classList.add('product-card__status');
  status.classList.toggle('product-card__status--out', !item.isAvailable);
  status.textContent = getProductStatus(item);

  const actions = document.createElement('div');
  actions.classList.add('product-card__actions');

  const moreLink = document.createElement('a');
  moreLink.classList.add('button', 'button--ghost');
  moreLink.href = `product.html?id=${item.id}`;
  moreLink.textContent = 'Подробнее';
  moreLink.setAttribute('aria-label', `Подробнее: ${item.title}`);

  const cartButton = document.createElement('button');
  cartButton.classList.add('button', 'product-card__button');
  cartButton.type = 'button';
  cartButton.textContent = 'В корзину';
  cartButton.dataset.action = 'add-to-cart';
  cartButton.dataset.productId = String(item.id);
  cartButton.setAttribute('aria-label', `В корзину: ${item.title}`);

  if (!item.isAvailable) {
    cartButton.disabled = true;
    cartButton.textContent = 'Нет в наличии';
  }

  actions.append(moreLink, cartButton);
  body.append(title, meta, description, price, status, actions);
  card.append(createProductPicture(item, sizes), body);

  return card;
}

/* ---------- 5. Вывод каталога ---------- */

// Склонение: 1 товар, 2 товара, 5 товаров.
function pluralizeProducts(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return 'товар';
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return 'товара';
  }

  return 'товаров';
}

function renderProducts(productsToRender) {
  // Очищаем контейнер, иначе карточки добавятся к старым.
  productsContainer.textContent = '';

  if (catalogCount) {
    catalogCount.textContent = `Найдено: ${productsToRender.length} ${pluralizeProducts(productsToRender.length)}`;
  }

  if (catalogEmpty) {
    catalogEmpty.hidden = productsToRender.length > 0;
  }

  productsToRender.forEach((item) => {
    productsContainer.append(createProductCard(item));
  });
}

function updateCatalog() {
  const preparedProducts = getPreparedProducts(products, catalogState);
  renderProducts(preparedProducts);
}

/* ---------- 6. Обработчики событий ---------- */

if (searchInput) {
  searchInput.addEventListener('input', (event) => {
    catalogState.query = event.target.value;
    updateCatalog();
  });
}

if (categoryFilter) {
  categoryFilter.addEventListener('change', (event) => {
    catalogState.category = event.target.value;
    updateCatalog();
  });
}

if (genderFilter) {
  genderFilter.addEventListener('change', (event) => {
    catalogState.gender = event.target.value;
    updateCatalog();
  });
}

if (priceFilter) {
  priceFilter.addEventListener('input', (event) => {
    // Значение из поля — строка, переводим в число.
    catalogState.maxPrice = Number(event.target.value);
    priceFilterOutput.textContent = formatPrice(catalogState.maxPrice);
    updateCatalog();
  });
}

if (stockFilter) {
  stockFilter.addEventListener('change', (event) => {
    catalogState.onlyAvailable = event.target.checked;
    updateCatalog();
  });
}

if (sortSelect) {
  sortSelect.addEventListener('change', (event) => {
    catalogState.sort = event.target.value;
    updateCatalog();
  });
}

// Сброс: возвращаем поля и состояние к начальным значениям.
function resetCatalogFilters() {
  catalogState.sort = 'default';
  sortSelect.value = 'default';
  catalogState.query = '';
  catalogState.category = 'all';
  catalogState.gender = 'all';
  catalogState.maxPrice = Number(priceFilter.max);
  catalogState.onlyAvailable = false;

  searchInput.value = '';
  categoryFilter.value = 'all';
  genderFilter.value = 'all';
  priceFilter.value = priceFilter.max;
  priceFilterOutput.textContent = formatPrice(catalogState.maxPrice);
  stockFilter.checked = false;

  updateCatalog();
}

document.querySelectorAll('[data-reset-filters]').forEach((button) => {
  button.addEventListener('click', resetCatalogFilters);
});

// Сворачиваемый фильтр на телефоне и планшете.
if (filtersToggle && filtersPanel) {
  filtersToggle.hidden = false;

  filtersToggle.addEventListener('click', () => {
    const isOpen = filtersToggle.getAttribute('aria-expanded') !== 'true';

    filtersPanel.classList.toggle('catalog-filters--open', isOpen);
    filtersToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

/* ---------- 7. Делегирование событий ---------- */

// Один обработчик на контейнер обслуживает кнопки всех карточек,
// даже тех, что появятся после следующей перерисовки.
if (productsContainer) {
  productsContainer.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action="add-to-cart"]');

    if (!button) {
      return;
    }

    // dataset всегда хранит строки — переводим id в число.
    const productId = Number(button.dataset.productId);
    const selectedItem = findProductById(products, productId);

    if (!selectedItem) {
      console.warn('Товар не найден:', productId);
      return;
    }

    showToast(addToCart(productId) ? `«${selectedItem.title}» добавлен в корзину.` : 'Нельзя добавить товар: нет в наличии или достигнут лимит 10 шт.');
  });
}

/* ---------- 8. Первый вывод ---------- */

if (productsContainer) {
  // Категорию можно передать в адресе: catalog.html?category=sport.
  // Берём только известные значения — неизвестные игнорируем.
  const categoryFromUrl = new URLSearchParams(window.location.search).get('category');

  if (categoryFromUrl && Object.hasOwn(categoryNames, categoryFromUrl)) {
    catalogState.category = categoryFromUrl;
    categoryFilter.value = categoryFromUrl;
  }

  updateCatalog();
} else {
  console.warn('Контейнер товаров не найден. Проверьте data-products-container.');
}
