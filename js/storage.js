/*
  storage.js — безопасная работа с localStorage.
  localStorage хранит только строки, поэтому значения сохраняются через JSON.stringify(),
  а читаются через JSON.parse(). Если данные повреждены или хранилище недоступно
  (например, приватный режим), возвращается значение по умолчанию — страница не ломается.
*/

// Все ключи в одном месте: так проще найти их в DevTools → Application → Local Storage.
const STORAGE_KEYS = {
  cart: 'shop-ot-bob-cart',
  favorites: 'shop-ot-bob-favorites',
  promo: 'shop-ot-bob-promo',
  theme: 'shop-ot-bob-theme'
};

function loadFromStorage(key, fallbackValue) {
  try {
    const text = localStorage.getItem(key);

    if (text === null) {
      return fallbackValue;
    }

    return JSON.parse(text);
  } catch (error) {
    console.warn(`Не удалось прочитать «${key}» из localStorage:`, error);
    return fallbackValue;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Не удалось сохранить «${key}» в localStorage:`, error);
  }
}

function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Не удалось удалить «${key}» из localStorage:`, error);
  }
}
