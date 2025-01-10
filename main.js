document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.section');
    
    // استرجاع آخر قسم مفتوح من LocalStorage
    const lastOpenedSectionId = localStorage.getItem('lastOpenedSection');

    // إخفاء جميع الأقسام
    sections.forEach(section => {
        section.style.display = 'none';
    });

    // فتح القسم الأخير إذا كان موجودًا
    if (lastOpenedSectionId) {
        const lastOpenedSection = document.getElementById(lastOpenedSectionId);
        if (lastOpenedSection) {
            lastOpenedSection.style.display = 'block';
        }
    }

    // حفظ القسم المفتوح عند تغييره
    sections.forEach(section => {
        section.addEventListener('click', () => {
            localStorage.setItem('lastOpenedSection', section.id);
        });
    });

    // تحميل البيانات الأخرى
    loadCartFromLocalStorage();
    loadFavoritesFromLocalStorage();

    fetch('product.json')
        .then(response => response.json())
        .then(data => {
            renderProducts(data.categories);
            initializeSwipers(data.categories);
        })
        .catch(error => console.error('خطأ في تحميل المنتجات:', error));
});

function renderProducts(categories) {
    for (const category in categories) {
        const subcategories = categories[category];
        for (const subcategory in subcategories) {
            const section = document.getElementById(subcategory)?.querySelector('.products');
            if (section) {
                subcategories[subcategory].forEach(product => {
                    const productCard = `
                        <div class="product" data-id="${product.id}">
                            <div class="img_produt">
                                <a href="#"><img src="${product.image}" alt="${product.name}"></a>
                            </div>
                            <h2>${product.name}</h2>
                            <div class="price">
                                <p><span>${product.price} جنيه</span></p>
                                <p class="old_price">${product.old_price || ''} جنيه</p>
                            </div>
                            ${product.old_price ? `<div class="discount-badge">خصم ${((product.old_price - product.price) / product.old_price * 100).toFixed(0)}%</div>` : ''}
                            <div class="icons">
                                <span class="btn_add_cart">
                                    <i class="fa-solid fa-cart-shopping"></i>  اضافة 
                                </span>
                                <span class="icon_product">
                                    <i class="fa-regular fa-heart"></i>
                                </span>
                            </div>
                        </div>
                    `;
                    section.insertAdjacentHTML('beforeend', productCard);
                });
            }
        }
    }

    addEventListenersToProducts(); // إضافة مستمعات للعربة والمفضلة
    addNavigationToProductPage(); // إضافة مستمع للتوجيه إلى صفحة المنتج
}


function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.style.display = 'none';
    });

    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.style.display = 'block';
    }
}

function addEventListenersToProducts() {
    document.querySelectorAll('.btn_add_cart').forEach(button => {
        button.addEventListener('click', function () {
            const product = this.closest('.product');
            const productId = product.dataset.id;
            const imgSrc = product.querySelector('img').src;
            const title = product.querySelector('h2').textContent;
            const price = product.querySelector('.price span').textContent;

            addToCart(productId, imgSrc, title, price);
            this.innerHTML = '<i class="fa-solid fa-cart-shopping"></i> تم الإضافة'; // تغيير النص مع الرمز
            this.style.backgroundColor = '#ccc'; // تغيير اللون
            this.disabled = true;
            setTimeout(() => {
                this.style.backgroundColor = '';
                this.innerHTML = '<i class="fa-solid fa-cart-shopping"></i> اضافة  ' // إعادة اللون الأصلي بعد ثانية واحدة
            }, 1000);
            updateCartTotal();
        });
    });

    document.querySelectorAll('.icon_product').forEach(button => {
        button.addEventListener('click', function () {
            const icon = this.querySelector('i');
            const text = this.querySelector('.favorite-text');
            const productId = this.closest('.product').dataset.id;

            if (icon.classList.contains('fa-regular')) {
                icon.classList.replace('fa-regular', 'fa-solid');
                icon.classList.add('fa-solid', 'fa-heart');
                addToFavorites(productId);
            } else {
                icon.classList.remove('fa-solid', 'fa-heart');
                icon.classList.add('fa-regular', 'fa-heart');
                removeFromFavorites(productId);
            }
        });
    });
}

let cartItems = JSON.parse(localStorage.getItem('cart')) || [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

function saveCartToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(cartItems));
}

function loadCartFromLocalStorage() {
    cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    updateCartUI();
}

function saveFavoritesToLocalStorage() {
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function loadFavoritesFromLocalStorage() {
    favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    updateFavoritesUI();
}

function addToCart(productId, imgSrc, title, price, quantity = 1) {
    const existingItem = cartItems.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        const product = { id: productId, imgSrc, title, price, quantity };
        cartItems.push(product);
    }
    saveCartToLocalStorage();
    updateCartUI();
}

function removeFromCart(productId) {
    cartItems = cartItems.filter(item => item.id !== productId);
    saveCartToLocalStorage();
    updateCartUI();
}

function updateCartQuantity(productId, increment) {
    const item = cartItems.find(item => item.id === productId);
    if (item) {
        item.quantity += increment;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCartToLocalStorage();
            updateCartUI();
        }
    }
}

function updateCartUI() {
    const cartItemsContainer = document.querySelector('.items_in_cart');
    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = '';
    let totalPrice = 0;
    let totalQuantity = 0;

    if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = `
            <p class="empty-cart-message">السلة فاضيه يباشا املاها شوية</p>
            <div class="empty-cart-icon">
                <i class="fa-solid fa-cart-arrow-down"></i>
            </div>
        `;
    } else {
        cartItems.forEach(item => {
            const cartItemHTML = `
                <div class="item_cart">
                    <img src="${item.imgSrc}" alt="${item.title}">
                    <div class="cart-item-details">
                        <h4>${item.title}</h4>
                        <p>${item.price} </p>
                        <div class="quantity_controls">
                            <button onclick="updateCartQuantity('${item.id}', -1)">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="updateCartQuantity('${item.id}', 1)">+</button>
                        </div>
                    </div>
                    <button class="delete_item" onclick="removeFromCart('${item.id}')"><i class="fa fa-trash"></i></button>
                </div>
            `;
            cartItemsContainer.insertAdjacentHTML('beforeend', cartItemHTML);
            totalPrice += parseFloat(item.price) * item.quantity;
            totalQuantity += item.quantity;
        });
    }

    document.querySelectorAll('.count_item').forEach(el => el.textContent = totalQuantity);
    document.querySelectorAll('.price_cart_total').forEach(el => el.textContent = `${totalPrice} جنيه`);
}

function updateFavoritesUI() {
    const favoritesContainer = document.querySelector('.favorites-container');
    if (!favoritesContainer) return;

    favoritesContainer.innerHTML = '';
    favorites.forEach(productId => {
        const product = document.querySelector(`.product[data-id="${productId}"]`);
        if (product) {
            favoritesContainer.appendChild(product.cloneNode(true));
        }
    });
}

function toggleFavorite(productId) {
    if (favorites.includes(productId)) {
        favorites = favorites.filter(id => id !== productId);
    } else {
        favorites.push(productId);
    }
    saveFavoritesToLocalStorage();
    updateFavoritesUI();
}

window.addEventListener('load', () => {
    loadCartFromLocalStorage();
    loadFavoritesFromLocalStorage();
});

var cart = document.querySelector('.cart');
function open_cart() {
    cart.classList.add("active");
}
function close_cart() {
    cart.classList.remove("active");
}
// Format price with Egyptian Pound currency
function formatPrice(price) {
    return `${price.toFixed(2)} جنيه`;
}

// Generate unique invoice ID
function generateInvoiceId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `INV-${timestamp}-${random}`;
}

// Format the current date and time
function formatDateTime() {
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    };
    return new Date().toLocaleDateString('ar-EG', options);
}

// Send invoice via WhatsApp
function sendInvoiceViaWhatsApp() {
    const storedCartItems = JSON.parse(localStorage.getItem('cart')) || [];
    const totalPrice = document.querySelector('.price_cart_total').textContent;
    const itemCount = document.querySelector('.count_item').textContent;
    const invoiceId = generateInvoiceId();
    const dateTime = formatDateTime();

    let message = `️📜 *فاتورة جديدة من متجرك*\n`;
message += `========================================\n`; // تحسين شكل الخط
message += `🧾 *رقم الفاتورة:* ${invoiceId}\n`;
message += `⏰ *التاريخ والوقت:* ${dateTime}\n`;
message += `========================================\n\n`;

message += `🛒 *تفاصيل الطلب:*\n\n`; // مسافة إضافية قبل التفاصيل

if (storedCartItems.length === 0) { // التحقق من وجود عناصر في السلة
    message += `🚫 لا يوجد منتجات في سلة التسوق.\n`;
} else {
    storedCartItems.forEach((item, index) => {
        message += `🔹 *المنتج ${index + 1}:*\n`; // عنوان المنتج بشكل أوضح
        message += `  🆔 *ID:* ${item.id}\n`;     // تنسيق النقطة
        message += `  📦 *الاسم:* ${item.title}\n`;
        message += `  🔢 *الكمية:* ${item.quantity}\n`;
        message += `  💵 *السعر للوحدة:* ${item.price} \n`; // توضيح السعر للوحدة
        message += `  💰 *الإجمالي:* ${parseFloat(item.price) * item.quantity} جنيه\n`; // إضافة إجمالي سعر المنتج
        message += `----------------------------------------\n`; // تحسين شكل الفاصل
    });

    message += `\n📊 *ملخص الطلب:*\n`; // مسافة إضافية قبل الملخص
    message += `  🛍️ *عدد المنتجات:* ${itemCount}\n`;
    message += `  💳 *المجموع الكلي:* ${totalPrice} \n`;
    message += `========================================\n\n`; // تحسين شكل الخط
}

message += `🤝 *شكرًا لتسوقك معنا!* \n`;
message += `📞 *للاستفسارات، تواصل معنا عبر واتساب على هذا الرقم.*\n`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappLink = `https://wa.me/201026972523?text=${encodedMessage}`;
    window.open(whatsappLink, '_blank');

    clearCart();
}

// Clear the cart
function clearCart() {
    cartItems = [];
    saveCartToLocalStorage();
    updateCartUI();
    document.querySelectorAll('.count_item').forEach(el => el.textContent = '0');
    document.querySelectorAll('.price_cart_total').forEach(el => el.textContent = '0 جنيه');
}
function shareWebsite()
{
    if (navigator.share)
    {
        navigator.share({
            title: 'الهدى سنتر',
            text: 'تفضل بزيارة موقع الهدى سنتر!',
            url: window.location.href
        }).then(() =>
        {
            console.log('Thanks for sharing!');
        }).catch((error) =>
        {
            console.error('Error sharing:', error);
        });
    } else
    {
        alert('المشاركة غير مدعومة في هذا المتصفح.');
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const menuTitle = document.getElementById('menu-title');
    const submenuLinks = document.querySelectorAll('.submenu-link');
    const menu = document.querySelector('.menu');

    submenuLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            const title = event.target.getAttribute('data-title');
            menuTitle.textContent = title;
            if (window.innerWidth <= 768) {
                menu.classList.remove('active');
            }
        });
    });

    // Update the menu title based on the current page
    const currentPage = window.location.pathname.split('/').pop();
    const currentLink = Array.from(submenuLinks).find(link => link.getAttribute('href') === currentPage);
    if (currentLink) {
        menuTitle.textContent = currentLink.getAttribute('data-title');
    }

    // Toggle menu on small screens
    document.querySelector('.menu-toggle').addEventListener('click', () => {
        menu.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
        if (!menu.contains(event.target) && !event.target.matches('.menu-toggle')) {
            menu.classList.remove('active');
        }
    });
});

// Dark mode
document.addEventListener('DOMContentLoaded', () => {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        document.body.classList.toggle('dark-theme');
    } else if (currentTheme === 'light') {
        document.body.classList.remove('dark-theme');
    } else if (prefersDarkScheme.matches) {
        document.body.classList.add('dark-theme');
    }

    darkModeToggle.addEventListener('click', () => {
        if (document.body.classList.contains('dark-theme')) {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        }
    });
});
// Initialize Swiper

// Add navigation to product page
function addNavigationToProductPage() {
    console.log("Function addNavigationToProductPage() is running.");
    document.querySelectorAll('.product img').forEach(img => {
        img.addEventListener('click', function () {
            const productId = img.closest('.product').dataset.id;
            if (productId) {
                window.location.href = `product.html?id=${productId}`;
            }
        });
    });
}

function renderImageGallery(images) {
    return `
        <div class="image-gallery">
            ${images.map(img => `<img src="${img}" alt="صورة إضافية">`).join('')}
        </div>
    `;
}
var swiper = new Swiper(".mySwiper", {
    scrollbar: {
      el: ".swiper-scrollbar",
      hide: true,
    },
    autoplay: {
      delay: 3000,
      disableOnInteraction: false,
    },
    loop: true,
  });

