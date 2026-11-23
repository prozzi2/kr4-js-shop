/*
  validation.js — проверка формы заявки на order.html.
  Ошибки выводятся под полями через textContent, без alert().
  Поле с ошибкой получает aria-invalid="true", а текст ошибки
  уже связан с полем через aria-describedby в HTML.
*/

const orderForm = document.querySelector('.order-form[data-validate="order"]');

if (orderForm) {
  const productSelect = orderForm.querySelector('#order-product');
  const quantityInput = orderForm.querySelector('#order-quantity');
  const nameInput = orderForm.querySelector('#order-name');
  const emailInput = orderForm.querySelector('#order-email');
  const phoneInput = orderForm.querySelector('#order-phone');
  const agreementInput = orderForm.querySelector('#order-agreement');

  const formMessage = orderForm.querySelector('.form-message');

  // Элемент ошибки ищется по id поля: order-name → order-name-error.
  function getErrorElement(input) {
    return document.getElementById(`${input.id}-error`);
  }

  function showError(input, message) {
    const errorElement = getErrorElement(input);
    errorElement.textContent = message;
    errorElement.hidden = false;
    input.setAttribute('aria-invalid', 'true');
  }

  function clearError(input) {
    const errorElement = getErrorElement(input);
    errorElement.textContent = '';
    errorElement.hidden = true;
    input.removeAttribute('aria-invalid');
  }

  function validateProduct() {
    const item = findProductById(products, Number(productSelect.value));
    if (!item || !item.isAvailable) {
      showError(productSelect, 'Выберите товар.');
      return false;
    }

    clearError(productSelect);
    return true;
  }

  function validateQuantity() {
    // value — строка. Пустая строка дала бы Number('') === 0, поэтому проверяем её отдельно.
    const rawValue = quantityInput.value.trim();
    const quantity = Number(rawValue);

    if (rawValue === '' || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      showError(quantityInput, 'Укажите количество от 1 до 10.');
      return false;
    }

    clearError(quantityInput);
    return true;
  }

  function validateName() {
    const value = nameInput.value.trim();

    if (value.length < 2) {
      showError(nameInput, 'Введите имя не короче 2 символов.');
      return false;
    }

    clearError(nameInput);
    return true;
  }

  function validateEmail() {
    const value = emailInput.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(value)) {
      showError(emailInput, 'Введите корректный e-mail, например name@mail.ru.');
      return false;
    }

    clearError(emailInput);
    return true;
  }

  // Проверяются содержательные цифры: 11 цифр, первая — 7 или 8.
  function validatePhone() {
    const digits = phoneInput.value.replace(/\D/g, '');

    if (digits.length !== 11 || !['7', '8'].includes(digits[0])) {
      showError(phoneInput, 'Введите номер из 11 цифр, например +7 (900) 000-00-00.');
      return false;
    }

    clearError(phoneInput);
    return true;
  }

  function validateAgreement() {
    if (!agreementInput.checked) {
      showError(agreementInput, 'Отметьте согласие на обработку данных.');
      return false;
    }

    clearError(agreementInput);
    return true;
  }

  // Поле и функция его проверки — в одном массиве.
  const validators = [
    [productSelect, validateProduct],
    [quantityInput, validateQuantity],
    [nameInput, validateName],
    [emailInput, validateEmail],
    [phoneInput, validatePhone],
    [agreementInput, validateAgreement]
  ];

  function showFormMessage(text, type) {
    formMessage.textContent = text;
    formMessage.classList.remove('form-message--error', 'form-message--success');
    formMessage.classList.add(`form-message--${type}`);
  }

  orderForm.addEventListener('submit', (event) => {
    // Отменяем обычную отправку: сервера пока нет.
    event.preventDefault();

    // map вызывает все проверки, чтобы ошибки появились сразу у всех полей.
    const results = validators.map(([, validate]) => validate());
    const isFormValid = results.every(Boolean);

    if (!isFormValid) {
      showFormMessage('Проверьте поля формы.', 'error');

      // Фокус — на первое поле с ошибкой.
      const firstInvalid = validators.find(([input]) => input.getAttribute('aria-invalid') === 'true');
      firstInvalid[0].focus();
      return;
    }

    const requestData = {
      productId: Number(productSelect.value),
      quantity: Number(quantityInput.value),
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      phone: phoneInput.value.trim()
    };

    console.log('Форма прошла учебную проверку; данные не отправлены.');
    // Персональные данные не записываются в консоль или хранилище.

    showFormMessage('Форма прошла учебную проверку. Данные не отправлены.', 'success');
    orderForm.reset();
    showFormMessage('Заявка подготовлена. Данные не отправлены.', 'success');
  });

  // Первая проверка — когда пользователь уходит с поля (blur).
  // Если ошибка уже показана, поле перепроверяется при каждом вводе,
  // и сообщение исчезает, как только значение стало правильным.
  validators.forEach(([input, validate]) => {
    input.addEventListener('blur', validate);
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') {
        validate();
      }
    });
  });

  // Кнопка «Очистить» убирает и ошибки.
  orderForm.addEventListener('reset', () => {
    validators.forEach(([input]) => clearError(input));
    formMessage.textContent = '';
  });
}
