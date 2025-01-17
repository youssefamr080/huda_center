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
    loadWishlistFromLocalStorage();

    fetch('product.json')
        .then(response => response.json())
        .then(data => {
            renderProducts(data.categories);
            initializeSwipers(data.categories);
        })
        .catch(error => console.error('خطأ في تحميل المنتجات:', error));
});

document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('search');
    const resultsContainer = document.getElementById('results');
    let productsData;

    fetch('product.json')
        .then(response => response.json())
        .then(data => {
            productsData = data;

            searchInput.addEventListener('input', function () {
                const searchTerm = this.value.trim().toLowerCase();
                resultsContainer.style.display = searchTerm ? 'block' : 'none';
                if (searchTerm.length === 0) return clearResults();
                const results = searchProducts(productsData, searchTerm);
                 displayResults(results);
            });
        })
        .catch(error => console.error('Error fetching products data:', error));

    document.body.addEventListener('click', function (event) {
        if (event.target !== searchInput && !resultsContainer.contains(event.target)) {
            clearResults();
        }
    });

    function searchProducts(productsData, searchTerm) {
        if (!productsData) return [];

        const results = Object.values(productsData.categories).flatMap(category =>
            Object.values(category).flatMap(subcategory =>
                  subcategory.filter(product => product.name.toLowerCase().includes(searchTerm)
                  ).slice(0,6)
              )
          );
         return results.slice(0,6);
      }
      function clearResults() {
        resultsContainer.innerHTML = '';
        resultsContainer.style.display = 'none';
      }
    
    function displayResults(results) {
          resultsContainer.innerHTML = '';

          if (results.length === 0) {
              const noResults = document.createElement('li');
              noResults.textContent = 'لا توجد منتجات مطابقة.';
             resultsContainer.appendChild(noResults);
               return;
             }
        const ul = document.createElement('ul');
           const listItems = results.map(product => {
                const li = document.createElement('li');
                const link = document.createElement('a');
                link.href = `product.html?id=${product.id}`;
                link.textContent = product.name;
                li.appendChild(link);
               return li
            })
  
          ul.append(...listItems);
          resultsContainer.appendChild(ul);
      }
});

function renderProducts(categories) {
    for (const category in categories) {
        const subcategories = categories[category];
        for (const subcategory in subcategories) {
            const section = document.getElementById(subcategory)?.querySelector('.products');
            if (section) {
                subcategories[subcategory].forEach(product => {
                    const mainImage = product.images && product.images.length > 0 ? product.images[0] : product.image;
                    const productCard = `
                        <div class="product" data-id=${product.id}>
                            <div class="img_produt">
                                <a href="#"><img src="${mainImage}" alt="${product.name}"></a>
                            </div>
                            <h2>${product.name}</h2>
                            <div class="price">
                                <p><span>${product.price} جنيه</span></p>
                                <p class="old_price">${product.old_price || ''} جنيه</p>
                            </div>
                            

                            ${product.old_price ? `<div class="discount-badge">خصم ${((product.old_price - product.price) / product.old_price * 100).toFixed(0)}%</div>` : ''}
                    `;
                    section.insertAdjacentHTML('beforeend', productCard);
                });
            }
        }
    }

    addEventListenersToProducts();
    addNavigationToProductPage();
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

           
        });
    });
    
}


function saveCartToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(cartItems));
}

function loadCartFromLocalStorage() {
    cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    updateCartUI();
}
function saveWishlistToLocalStorage() {
    localStorage.setItem('wishlistItems', JSON.stringify(wishlistItems));
}

function loadWishlistFromLocalStorage() {
    wishlistItems = JSON.parse(localStorage.getItem('wishlistItems')) || [];
    updateWishlistUI();
}

function addToCart(productId, imgSrc, title, price, availableQuantity) { // Accept availableQuantity
    const existingItem = cartItems.find(item => item.id === productId);

    if (existingItem) {
        if (existingItem.quantity < availableQuantity) {  // check if product amount is more than existing item quantity
            existingItem.quantity += 1;
            saveCartToLocalStorage();
            updateCartUI();

        } else {
            showOutOfStockMessage(); // Show message if over the amount
        }
    } else {
        if (availableQuantity > 0) { // Add if amount is greater than 0

            const product = { id: productId, imgSrc, title, price, quantity: 1 };
            cartItems.push(product);
            saveCartToLocalStorage();
            updateCartUI();

        } else {
            showOutOfStockMessage(); // Show message if over the amount

        }
    }


}
// Function to add product to wishlist
function addToWishlist(productId, imgSrc, title, price) {
    const existingItem = wishlistItems.find(item => item.id === productId);
    if (!existingItem) {
        const product = { id: productId, imgSrc, title, price };
        wishlistItems.push(product);
        saveWishlistToLocalStorage();
        updateWishlistUI();
    }
}
window.updateCartQuantity = function (productId, increment) {
    const item = cartItems.find(item => item.id === productId);
    if (item) {
        findProductData(productId).then((productData) => {
            if (increment > 0 && item.quantity >= productData.amount) {
                showOutOfStockMessage(); // Show out of stock if exceeds product amount

            } else {
                item.quantity += increment;
                if (item.quantity <= 0) {
                    removeFromCart(productId);
                } else {
                    saveCartToLocalStorage();
                    updateCartUI();
                }
            }
        })


    }
};

window.removeFromCart = function (productId) {
    cartItems = cartItems.filter(item => item.id !== productId);
    saveCartToLocalStorage();
    updateCartUI();
        updateWishlistUI(); // Update wishlist UI when cart is changed

};
// Function to remove from wishlist
window.removeFromWishlist = function (productId) {
    wishlistItems = wishlistItems.filter(item => item.id !== productId);
    saveWishlistToLocalStorage();
    updateWishlistUI();
};

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
// Function to move item from wishlist to cart
window.moveToCart = function (productId) {
    findProductData(productId).then((productData) => {
        const existingItemInCart = cartItems.find(item => item.id === productId);
        if (existingItemInCart) {
            showAlreadyInCartMessage(); // Show message if already in cart
        } else {
            const item = wishlistItems.find(item => item.id === productId);
            if (item) {
                addToCart(item.id, item.imgSrc, item.title, item.price, productData.amount); // Pass the amount
                removeFromWishlist(productId);
            }
        }
    })
};
function showAlreadyInCartMessage() {
    const message = document.createElement('div');
    message.textContent = 'هذا المنتج موجود بالفعل في السلة';
    message.classList.add('out-of-stock-message');
    document.body.appendChild(message);

    setTimeout(() => {
        message.remove();
    }, 1500);
}
async function findProductData(productId) {

    return fetch('product.json')
        .then(response => response.json())
        .then(data => {

            for (const category in data.categories) {
                for (const subcategory in data.categories[category]) {
                    const product = data.categories[category][subcategory].find(p => p.id == productId);
                    if (product) return product;
                }
            }
        }).catch((e) => {
            console.error('Error fetching products data:', e)
            return null;
        })



}

function updateCartUI() {
    const cartItemsContainer = document.querySelector('.items_in_cart');
    if (!cartItemsContainer) return;

    // تنظيف العناصر الموجودة
    cartItemsContainer.innerHTML = '';

    let totalPrice = 0;
    let totalQuantity = 0;

    if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = `
            <p class="empty-cart-message">السلة فاضيه يباشا املاها شويه</p>
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
                        <p>${item.price} جنيه</p>
                        <div class="quantity_controls">
                            <button onclick="updateCartQuantity(${item.id}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="updateCartQuantity(${item.id}, 1)">+</button>
                        </div>
                    </div>
                    <button class="delete_item" onclick="removeFromCart(${item.id})"><i class="fa fa-trash"></i></button>
                </div>
            `;
            cartItemsContainer.insertAdjacentHTML('beforeend', cartItemHTML);

            totalPrice += parseFloat(item.price) * item.quantity;
            totalQuantity += item.quantity;
        });
    }

    // تحديث الإحصائيات
    document.querySelectorAll('.cart_count').forEach(el => el.textContent = totalQuantity);
    document.querySelectorAll('.price_cart_total').forEach(el => el.textContent = `${totalPrice} جنيه`);
    document.querySelectorAll('.count_item').forEach(el => el.textContent = totalQuantity);
}


// Function to update wishlist UI
function updateWishlistUI() {
    const wishlistItemsContainer = document.querySelector('.items_in_wishlist');
    if (!wishlistItemsContainer) return;

    wishlistItemsContainer.innerHTML = '';
    let totalQuantity = 0;


    if (wishlistItems.length === 0) {
        wishlistItemsContainer.innerHTML = `
             <p class="empty-wishlist-message"></p>
              <div class="empty-wishlist-icon">
                
             </div>
      `
    } else {

        wishlistItems.forEach(item => {
            const existingItemInCart = cartItems.find(cartItem => cartItem.id === item.id);
             let moveToCartButton;
                if (existingItemInCart) {
                  moveToCartButton = `<button class="btn_wishlist" disabled >موجود في السلة</button>`; // Disable if already in cart
                } else {
                    moveToCartButton = `<button class="btn_wishlist" onclick="moveToCart(${item.id})">نقل الي العربة</button>`
                  }

             const wishlistHTML = `
             <div class="item_wishlist">
                  <img src="${item.imgSrc}" alt="${item.title}">
                <div class="wishlist-item-details">
                      <h4>${item.title}</h4>
                    <p>${item.price} جنيه</p>
                   </div>
                  <div class="wishlist_actions">
                         ${moveToCartButton}
                       <button class="delete_item" onclick="removeFromWishlist(${item.id})"><i class="fa fa-trash"></i></button>
                     </div>
              </div>
        `;
            wishlistItemsContainer.insertAdjacentHTML('beforeend', wishlistHTML);
            totalQuantity++;
        });
    }
    document.querySelectorAll('.wishlist_count').forEach(el => el.textContent = totalQuantity);

}


window.addEventListener('load', () => {
    loadCartFromLocalStorage();
    loadWishlistFromLocalStorage();
});

var cart = document.querySelector('.cart');
function open_cart() {
    cart.classList.add("active");
}
function close_cart() {
    cart.classList.remove("active");
}
var wishlist = document.querySelector('.wishlist');
function open_wishlist() {
    wishlist.classList.add("active");
}
function close_wishlist() {
    wishlist.classList.remove("active");
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
      if (storedCartItems.length === 0) {
        // إنشاء عنصر div لعرض الرسالة
        const noItemsMessage = document.createElement('div');
        noItemsMessage.style.cssText = `
            position: fixed; /* لتثبيت الرسالة في وسط الصفحة */
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%); /* توسيط العنصر تمامًا */
            background-color: rgba(0, 0, 0, 0.7); /* خلفية شفافة */
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-size: 20px;
            font-weight: bold;
            z-index: 999999; /* لجعل الرسالة فوق كل العناصر الأخرى */
        `;
        noItemsMessage.textContent = 'هو انت لسه حطيت حاجه؟';

        // إضافة زر للإغلاق (اختياري)
        const closeButton = document.createElement('button');
        closeButton.textContent = 'إغلاق';
        closeButton.style.cssText = `
            margin-top: 10px;
            padding: 5px 10px;
            background-color:rgb(202, 23, 23); /* لون أخضر */
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        `;
        closeButton.onclick = () => {
            noItemsMessage.remove(); // إزالة الرسالة عند الضغط على زر الإغلاق
        };
        noItemsMessage.appendChild(closeButton);

        document.body.appendChild(noItemsMessage); // إضافة الرسالة إلى الصفحة

        return; // الخروج من الوظيفة وعدم إرسال الفاتورة
    }

    const invoiceId = generateInvoiceId();
    const dateTime = formatDateTime();

    let message = `️ 📜*فاتورة جديدة من متجرك*\n`;
    message += `========================================\n`;
    message += ` *رقم الفاتورة:* ${invoiceId}\n`;
    message += `⏰ *التاريخ والوقت:* ${dateTime}\n`;
    message += `========================================\n\n`;

    message += ` *تفاصيل الطلب:*\n\n`;

    storedCartItems.forEach((item, index) => {
        message += ` *المنتج ${index + 1}:*\n`;
        message += `  🆔 *ID:* ${item.id}\n`;
        message += `   *الاسم:* ${item.title}\n`;
        message += `   *الكمية:* ${item.quantity}\n`;
        message += `   *السعر للوحدة:* ${item.price} \n`;
        message += `  *الإجمالي:* ${parseFloat(item.price) * item.quantity} جنيه\n`;
        message += `----------------------------------------\n`;
    });

    message += `\n *ملخص الطلب:*\n`;
    message += `  ️ *عدد المنتجات:* ${itemCount}\n`;
    message += `   *المجموع الكلي:* ${totalPrice} \n`;
    message += `========================================\n\n`;

    message += ` *شكرًا لتسوقك معنا!* \n`;
    message += ` *للاستفسارات، تواصل معنا عبر واتساب على هذا الرقم.*\n`;

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

  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');


  function closePage() {
      window.history.back();
  }
  document.addEventListener('DOMContentLoaded', function () {
    const navContainer = document.querySelector('.nav-container');
    const prevButton = document.querySelector('.prev-arrow');
    const nextButton = document.querySelector('.next-arrow');
    let scrollInterval;
    const scrollStep = 1;
    const scrollSpeed = 25;

    // التمرير في الاتجاه المحدد
    function scrollNav(direction) {
        navContainer.scrollBy({
            left: direction * scrollStep,
            behavior: 'smooth', // تمرير سلس
        });
    }

    // بدء التمرير التلقائي
    function autoScroll() {
        if (navContainer.scrollLeft + navContainer.offsetWidth >= navContainer.scrollWidth) {
            navContainer.scrollLeft = 0; // العودة إلى البداية عند الوصول للنهاية
        } else {
            scrollNav(1);
        }
    }

    // تشغيل التمرير التلقائي
    function startAutoScroll() {
        scrollInterval = setInterval(autoScroll, scrollSpeed);
    }

    // إيقاف التمرير التلقائي
    function stopAutoScroll() {
        clearInterval(scrollInterval);
    }

    // إضافة أحداث للنقر على الأسهم
    prevButton.addEventListener('click', () => scrollNav(-1));
    nextButton.addEventListener('click', () => scrollNav(1));

    // تشغيل التمرير التلقائي عند تحميل الصفحة
    startAutoScroll();

    // إيقاف التمرير التلقائي عند التفاعل مع الشريط
    navContainer.addEventListener('mouseenter', stopAutoScroll);
    navContainer.addEventListener('mouseleave', startAutoScroll);

    // دعم التمرير باللمس على الهواتف
    navContainer.addEventListener('touchstart', stopAutoScroll);
    navContainer.addEventListener('touchend', startAutoScroll);
});
function searchPerfumes() {
        const input = document.getElementById('searchInput2');
        const filter = input.value.toUpperCase();
        const ul = document.getElementById('perfumeList');
        const li = ul.getElementsByTagName('li');
        const noResults = document.getElementById('noResults');
        let hasResults = false;
    
        for (let i = 0; i < li.length; i++) {
            const txtValue = li[i].textContent || li[i].innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                li[i].style.display = "";
                hasResults = true;
            } else {
                li[i].style.display = "none";
            }
        }
    
        noResults.style.display = hasResults ? "none" : "block";
    }
