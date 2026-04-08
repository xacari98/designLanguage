const PRODUCT_CATALOG = {
  pv01: {
    sku: "pv01",
    code: "UNIT / PV-01",
    name: "Peptide Veil",
    price: 84,
    size: "50ML",
    image: "https://unsplash.com/photos/g8PdaI6fC5c/download?force=true&w=1000",
    page: "product-peptide-veil.html",
  },
  sw02: {
    sku: "sw02",
    code: "UNIT / SW-02",
    name: "Signal Wash",
    price: 46,
    size: "120ML",
    image: "https://unsplash.com/photos/qaniwuNUE5k/download?force=true&w=1000",
    page: "product-signal-wash.html",
  },
  nm03: {
    sku: "nm03",
    code: "UNIT / NM-03",
    name: "Night Compression Mask",
    price: 68,
    size: "75ML",
    image: "https://unsplash.com/photos/pd4rqJMd51Q/download?force=true&w=1000",
    page: "product-night-compression-mask.html",
  },
  fs04: {
    sku: "fs04",
    code: "UNIT / FS-04",
    name: "Field Set / Complete",
    price: 188,
    size: "4 UNITS",
    image: "https://unsplash.com/photos/QbHwPe1HE84/download?force=true&w=1000",
    page: "product-field-set.html",
  },
};

const CART_KEY = "aethera-field-cart";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const getCart = () => {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
};

const setCart = (cart) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

const countItems = (cart) => cart.reduce((sum, item) => sum + item.quantity, 0);

const getTotals = (cart) => {
  const subtotal = cart.reduce((sum, item) => {
    const product = PRODUCT_CATALOG[item.sku];
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);
  const shipping = subtotal >= 180 || subtotal === 0 ? 0 : 14;
  return {
    subtotal,
    shipping,
    total: subtotal + shipping,
  };
};

const updateCountBadges = () => {
  const totalItems = countItems(getCart());
  document.querySelectorAll("[data-cart-count]").forEach((node) => {
    node.textContent = String(totalItems).padStart(2, "0");
  });
};

const showToast = (message) => {
  const toast = document.querySelector("[data-toast]");
  const text = document.querySelector("[data-toast-text]");
  if (!toast || !text) return;

  text.textContent = message;
  toast.hidden = false;
  toast.classList.remove("toast-live");
  void toast.offsetWidth;
  toast.classList.add("toast-live");

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.hidden = true;
  }, 1500);
};

const addToCart = (sku, quantity = 1) => {
  const cart = getCart();
  const existing = cart.find((item) => item.sku === sku);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ sku, quantity });
  }
  setCart(cart);
  updateCountBadges();
  const product = PRODUCT_CATALOG[sku];
  if (product) {
    showToast(`${product.name.toUpperCase()} / ${currency.format(product.price)} ADDED`);
  }
};

const bindAddToCartButtons = () => {
  document.querySelectorAll("[data-add-cart]").forEach((button) => {
    button.addEventListener("click", () => {
      const sku = button.dataset.sku;
      if (!PRODUCT_CATALOG[sku]) return;
      addToCart(sku);
      button.textContent = "Added";
      button.disabled = true;
      setTimeout(() => {
        button.textContent = "Add to cart";
        button.disabled = false;
      }, 900);
    });
  });
};

const bindSignupForm = () => {
  const form = document.querySelector("[data-signup-form]");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    showToast("DISPATCH REQUEST LOGGED");
  });
};

const renderCartPage = () => {
  const cartRoot = document.querySelector("[data-cart-root]");
  if (!cartRoot) return;

  const cart = getCart();
  const itemsRoot = cartRoot.querySelector("[data-cart-items]");
  const emptyRoot = cartRoot.querySelector("[data-cart-empty]");
  const totals = getTotals(cart);

  if (!cart.length) {
    emptyRoot.hidden = false;
    itemsRoot.hidden = true;
  } else {
    emptyRoot.hidden = true;
    itemsRoot.hidden = false;
    itemsRoot.innerHTML = cart
      .map((item) => {
        const product = PRODUCT_CATALOG[item.sku];
        if (!product) return "";
        return `
          <article class="cart-line" data-cart-line="${item.sku}">
            <img class="cart-line-image" src="${product.image}" alt="${product.name}" />
            <div class="cart-line-copy">
              <p class="product-code">${product.code}</p>
              <h3><a href="${product.page}">${product.name}</a></h3>
              <p>${product.size}</p>
            </div>
            <div class="cart-line-controls">
              <label class="micro-field">
                QTY
                <input type="number" min="1" value="${item.quantity}" data-qty-input="${item.sku}" />
              </label>
              <strong>${currency.format(product.price * item.quantity)}</strong>
              <button type="button" class="text-button" data-remove-item="${item.sku}">REMOVE</button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  cartRoot.querySelector("[data-subtotal]").textContent = currency.format(totals.subtotal);
  cartRoot.querySelector("[data-shipping]").textContent =
    totals.shipping === 0 ? "FREE" : currency.format(totals.shipping);
  cartRoot.querySelector("[data-total]").textContent = currency.format(totals.total);

  itemsRoot.querySelectorAll("[data-qty-input]").forEach((input) => {
    input.addEventListener("change", () => {
      const nextCart = getCart()
        .map((item) =>
          item.sku === input.dataset.qtyInput
            ? { ...item, quantity: Math.max(1, Number.parseInt(input.value, 10) || 1) }
            : item
        )
        .filter((item) => item.quantity > 0);
      setCart(nextCart);
      updateCountBadges();
      renderCartPage();
    });
  });

  itemsRoot.querySelectorAll("[data-remove-item]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextCart = getCart().filter((item) => item.sku !== button.dataset.removeItem);
      setCart(nextCart);
      updateCountBadges();
      renderCartPage();
      showToast("LINE ITEM REMOVED");
    });
  });
};

document.addEventListener("DOMContentLoaded", () => {
  updateCountBadges();
  bindAddToCartButtons();
  bindSignupForm();
  renderCartPage();
  console.log("AETHERA FIELD SUPPLY / If you're reading this, you're in the archive.");
});
