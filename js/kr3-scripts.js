/*
  kr3-scripts.js — скрипт сайта из КР №3 (раньше назывался main.js).
  Временно сохранён без изменений: меню, модальное окно, проверка форм,
  фильтр каталога, страница товара, сводка заказа и кнопка «Наверх».
  В КР №4 эта логика постепенно переносится в отдельные файлы
  (catalog.js, validation.js, modal.js, main.js), после чего файл будет удалён.
*/

// Класс .js на <html> сообщает стилям, что скрипты работают
// и меню с фильтром можно сворачивать.
document.documentElement.classList.add('js');

/* ===============================
   1. Данные о товарах
   =============================== */

// Те же товары, что в карточках каталога.
// Нужны для страницы товара (product.html?id=N) и сводки заказа.
// Совместимое представление для интерфейса КР №3; источник данных один.
const PRODUCTS = products.map(item => ({
  id: item.id, name: item.title, img: item.image, alt: item.alt,
  price: getFinalPrice(item), old: item.discountPercent ? item.price : null,
  stock: item.isAvailable, desc: item.description, specs: item.specs
}));

// Ищем товар по id из адресной строки, например product.html?id=3.
function getProductFromUrl(paramName) {
  const id = Number(new URLSearchParams(window.location.search).get(paramName));
  return PRODUCTS.find((product) => product.id === id);
}

/* ===============================
   2. Мобильное меню
   =============================== */

const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.getElementById('site-nav');

if (navToggle && siteNav) {
  // Кнопка в разметке скрыта (hidden) — показываем её только при работающем JS.
  navToggle.hidden = false;

  const setNavOpen = (isOpen) => {
    siteNav.classList.toggle('site-nav--open', isOpen);
    // aria-expanded сообщает скринридеру, открыто меню или закрыто.
    navToggle.setAttribute('aria-expanded', String(isOpen));
  };

  navToggle.addEventListener('click', () => {
    setNavOpen(navToggle.getAttribute('aria-expanded') !== 'true');
  });

  // Esc закрывает меню и возвращает фокус на кнопку.
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
      setNavOpen(false);
      navToggle.focus();
    }
  });

  // Щелчок вне шапки закрывает меню.
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.page-header')) {
      setNavOpen(false);
    }
  });

  // При переходе на широкий экран сбрасываем состояние меню.
  window.matchMedia('(min-width: 768px)').addEventListener('change', () => {
    setNavOpen(false);
  });
}

/* ===============================
   3. Модальное окно быстрой заявки
   =============================== */

// Получаем модальное окно по id. На страницах без окна будет null.
const orderDialog = document.getElementById('order-dialog');

if (orderDialog) {
  // Скрытое поле, в которое записывается выбранный товар.
  const selectedProductInput = document.getElementById('selected-product');
  // Видимая подпись с названием товара.
  const selectedProductText = document.getElementById('selected-product-text');
  // Кнопка, которая открыла окно: после закрытия вернём на неё фокус.
  let lastTrigger = null;

  // Все кнопки «Заказать» в карточках товаров.
  document.querySelectorAll('.product-card__button').forEach((button) => {
    button.addEventListener('click', () => {
      // Название товара берём из data-атрибута кнопки.
      selectedProductInput.value = button.dataset.product;
      selectedProductText.textContent = button.dataset.product;
      lastTrigger = button;

      // showModal() открывает окно поверх страницы,
      // удерживает фокус внутри и включает закрытие по Esc.
      orderDialog.showModal();
    });
  });

  // Кнопки закрытия окна.
  orderDialog.querySelectorAll('[data-close-dialog]').forEach((button) => {
    button.addEventListener('click', () => {
      orderDialog.close();
    });
  });

  // Щелчок по затемнённому фону тоже закрывает окно.
  orderDialog.addEventListener('click', (event) => {
    if (event.target === orderDialog) {
      orderDialog.close();
    }
  });

  // После закрытия возвращаем фокус туда, откуда окно открыли.
  orderDialog.addEventListener('close', () => {
    if (lastTrigger) {
      lastTrigger.focus();
    }
  });
}

/* ===============================
   4. Проверка форм
   =============================== */

// Показываем или убираем текст ошибки под полем.
function setFieldError(field, message) {
  const errorElement = document.getElementById(field.id + '-error');

  if (message) {
    field.setAttribute('aria-invalid', 'true');
  } else {
    field.removeAttribute('aria-invalid');
  }

  if (errorElement) {
    errorElement.textContent = message;
    errorElement.hidden = !message;
  }
}

// Текст ошибки: свой из data-error или стандартный текст браузера.
function getFieldError(field) {
  if (field.checkValidity()) {
    return '';
  }

  return field.dataset.error || field.validationMessage;
}

// Одна и та же проверка работает для всех форм с классом .js-form:
// быстрая заявка в окне, заявка на order.html и форма на contacts.html.
document.querySelectorAll('.js-form').forEach((form) => {
  // Сообщение об успешной отправке указано в data-success.
  const successMessage = document.getElementById(form.dataset.success);

  // Ошибку у поля убираем сразу, как только его исправили.
  form.addEventListener('input', (event) => {
    if (event.target.getAttribute('aria-invalid') === 'true') {
      setFieldError(event.target, getFieldError(event.target));
    }
  });

  form.addEventListener('submit', (event) => {
    // Отменяем стандартную отправку: backend пока не подключён.
    event.preventDefault();

    const fields = Array.from(form.elements).filter((element) => element.willValidate);

    // Проверяем каждое поле и выводим текст ошибки под ним.
    fields.forEach((field) => {
      setFieldError(field, getFieldError(field));
    });

    const firstInvalid = fields.find((field) => !field.checkValidity());

    if (firstInvalid) {
      // Переносим фокус на первое поле с ошибкой:
      // скринридер прочитает подпись поля и текст ошибки (aria-describedby).
      firstInvalid.focus();
      return;
    }

    // Текст появляется в области role="status" — скринридер его озвучит.
    successMessage.textContent = 'Заявка подготовлена. Это учебная форма: данные не отправлены.';
    // Сообщение может оказаться за краем экрана — прокручиваем к нему.
    successMessage.scrollIntoView({ block: 'nearest' });

    // Очищаем форму.
    form.reset();

    // Если форма находится в модальном окне — закрываем его.
    if (orderDialog && orderDialog.contains(form)) {
      orderDialog.close();
    }
  });

  // Кнопка «Очистить» убирает и сообщения об ошибках.
  form.addEventListener('reset', () => {
    Array.from(form.elements).forEach((field) => {
      if (field.id) {
        setFieldError(field, '');
      }
    });
  });
});

/* 5. Фильтр каталога перенесён в catalog.js (КР №4). */

/* ===============================
   6. Страница товара
   =============================== */

const productSection = document.getElementById('product');

if (productSection) {
  // Без параметра id страница показывает товар, записанный в HTML.
  const requestedId = new URLSearchParams(location.search).get('id');
  const product = requestedId === null ? PRODUCTS[0] : getProductFromUrl('id');
  if (!product) {
    productSection.textContent = 'Товар не найден. Вернитесь в каталог.';
  }

  if (product) {
    const setText = (id, text) => {
      document.getElementById(id).textContent = text;
    };

    // Собираем srcset из трёх размеров одного изображения.
    const buildSrcset = (extension) =>
      [320, 480, 640]
        .map((width) => 'images/' + product.img + '-' + width + '.' + extension + ' ' + width + 'w')
        .join(', ');

    document.title = product.name + ' — Shop_ot_bob';
    setText('product-title', product.name);
    setText('product-crumb', product.name);
    setText('product-description', product.desc);

    const priceElement = document.getElementById('product-price');
    priceElement.textContent = formatPrice(product.price);

    if (product.old) {
      const oldPrice = document.createElement('del');
      oldPrice.textContent = formatPrice(product.old);
      priceElement.append(' ', oldPrice);
    }

    const stockElement = document.getElementById('product-stock');
    stockElement.textContent = product.stock ? 'В наличии' : 'Нет в наличии';
    stockElement.classList.toggle('product__stock--out', !product.stock);

    const image = document.getElementById('product-image');
    document.getElementById('product-image-webp').srcset = buildSrcset('webp');
    image.srcset = buildSrcset('jpg');
    image.src = 'images/' + product.img + '-640.jpg';
    image.alt = product.alt;

    // Строки таблицы характеристик.
    const specsBody = document.getElementById('product-specs');
    specsBody.textContent = '';

    Object.entries(product.specs).forEach(([name, value]) => {
      const row = specsBody.insertRow();
      const header = document.createElement('th');

      header.scope = 'row';
      header.textContent = name;
      row.append(header);
      row.insertCell().textContent = value;
    });

    document.getElementById('product-order-link').href = 'order.html?product=' + product.id;
    document.getElementById('product-quick-order').dataset.product = product.name;
    document.getElementById('product-quick-order').disabled = !product.stock;
    const add = document.createElement('button');
    add.type = 'button'; add.className = 'button';
    add.textContent = product.stock ? 'В корзину' : 'Нет в наличии';
    add.disabled = !product.stock;
    add.addEventListener('click', () => showToast(addToCart(product.id) ? 'Товар добавлен в корзину.' : 'Достигнут лимит: 10 шт.'));
    document.querySelector('.product__actions').append(add);
  }
}

/* ===============================
   7. Сводка заказа на order.html
   =============================== */

const orderSummary = document.getElementById('order-summary');

if (orderSummary) {
  const productSelect = document.getElementById('order-product');
  const quantityInput = document.getElementById('order-quantity');
  const pageForm = productSelect.form;
  productSelect.replaceChildren(new Option('Выберите товар', ''));
  products.forEach(item => {
    const option = new Option(`${item.title} — ${formatPrice(getFinalPrice(item))}${item.isAvailable ? '' : ' — нет в наличии'}`, String(item.id));
    option.disabled = !item.isAvailable;
    productSelect.append(option);
  });

  const DELIVERY_PRICE = 500;
  const FREE_DELIVERY_FROM = 30000;

  // Товар можно передать в адресе: order.html?product=3.
  const productFromUrl = getProductFromUrl('product');

  if (productFromUrl && productFromUrl.stock) {
    productSelect.value = String(productFromUrl.id);
  }

  const updateSummary = () => {
    const product = PRODUCTS.find((item) => item.id === Number(productSelect.value));
    const quantity = Math.min(Math.max(Number(quantityInput.value) || 1, 1), 10);
    const isCourier = pageForm.elements.delivery.value === 'courier';
    const goods = product ? product.price * quantity : 0;
    const delivery = isCourier && goods > 0 && goods < FREE_DELIVERY_FROM ? DELIVERY_PRICE : 0;

    const setText = (id, text) => {
      document.getElementById(id).textContent = text;
    };

    setText('summary-product', product ? product.name : 'не выбран');
    setText('summary-quantity', quantity + ' шт.');
    setText('summary-goods', formatPrice(goods));
    setText('summary-delivery', delivery ? formatPrice(delivery) : 'бесплатно');
    setText('summary-total', formatPrice(goods + delivery));
  };

  pageForm.addEventListener('input', updateSummary);
  pageForm.addEventListener('reset', () => {
    setTimeout(updateSummary, 0);
  });

  updateSummary();
}

/* ===============================
   8. Кнопка «Наверх»
   =============================== */

const backToTop = document.querySelector('.back-to-top');

if (backToTop) {
  // Кнопка появляется, когда страница прокручена больше чем на экран.
  const toggleBackToTop = () => {
    backToTop.hidden = window.scrollY < window.innerHeight;
  };

  window.addEventListener('scroll', toggleBackToTop, { passive: true });
  toggleBackToTop();
}
