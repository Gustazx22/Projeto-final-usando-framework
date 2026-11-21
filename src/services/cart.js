export const CART_STORAGE_KEY = "farmavida-cart";
export const MAX_CART_QUANTITY = 99;
export const MAX_CART_LINES = 50;

export function normalizeCartItem(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const id = Number(value.id);
  const price = Number(value.price);
  const quantity = Number(value.quantity);
  if (
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    !Number.isFinite(price) ||
    price < 0 ||
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    typeof value.name !== "string" ||
    !value.name.trim() ||
    typeof value.image !== "string" ||
    typeof value.category !== "string"
  )
    return null;

  return {
    id,
    name: value.name.trim().slice(0, 200),
    image: value.image,
    category: value.category,
    price: Math.round(price * 100) / 100,
    ...(value.requiresPrescription === true
      ? { requiresPrescription: true }
      : {}),
    quantity: Math.min(quantity, MAX_CART_QUANTITY),
  };
}

export function sanitizeCart(raw) {
  if (!Array.isArray(raw)) return [];
  const unique = new Map();
  for (const rawItem of raw) {
    const item = normalizeCartItem(rawItem);
    if (!item) continue;
    const previous = unique.get(item.id);
    if (previous) {
      unique.set(item.id, {
        ...previous,
        quantity: Math.min(
          MAX_CART_QUANTITY,
          previous.quantity + item.quantity,
        ),
      });
    } else if (unique.size < MAX_CART_LINES) {
      unique.set(item.id, item);
    }
  }
  return [...unique.values()];
}

export function readStoredCart(storage) {
  try {
    const target = storage === undefined ? globalThis.localStorage : storage;
    return sanitizeCart(JSON.parse(target?.getItem(CART_STORAGE_KEY) || "[]"));
  } catch {
    return [];
  }
}

export function writeStoredCart(items, storage) {
  try {
    const target = storage === undefined ? globalThis.localStorage : storage;
    target?.setItem(CART_STORAGE_KEY, JSON.stringify(sanitizeCart(items)));
    return true;
  } catch {
    return false;
  }
}
