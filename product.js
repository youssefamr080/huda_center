// Initialize cart and favorites from localStorage
let cartItems = JSON.parse(localStorage.getItem('cart')) || [];
let wishlistItems = JSON.parse(localStorage.getItem('wishlistItems')) || [];
let currentDisplayedImage = ''; // Track current displayed image
let selectedColor = ''; // Track current selected color

// Save cart to localStorage
function saveCartToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(cartItems));
}
// Load cart from localStorage
function loadCartFromLocalStorage() {
    cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    updateCartUI();
}

// Save wishlist to localStorage
function saveWishlistToLocalStorage() {
    localStorage.setItem('wishlistItems', JSON.stringify(wishlistItems));
}

// Load wishlist from localStorage
function loadWishlistFromLocalStorage() {
    wishlistItems = JSON.parse(localStorage.getItem('wishlistItems')) || [];
    updateWishlistUI();
}
// Fetch product details based on productId
const params = new URLSearchParams(window.location.search);
const productId = params.get('id');

if (productId) {
    fetch('product.json')
        .then(response => response.json())
        .then(data => {
            let product = findProductById(data, productId);

            if (product) {
                renderProductDetails(product);
                const similarProducts = findSimilarProducts(data, product, 6);
                renderSimilarProducts(similarProducts);
            } else {
                document.getElementById('product-details').innerHTML = '<p>عذرًا، المنتج غير موجود.</p>';
            }
        })
        .catch(error => console.error('خطأ في تحميل تفاصيل المنتج:', error));
} else {
    document.getElementById('product-details').innerHTML = '<p>لم يتم تحديد المنتج.</p>';
}

// Function to find a product by its ID
function findProductById(data, productId) {
    for (const category in data.categories) {
        for (const subcategory in data.categories[category]) {
            const product = data.categories[category][subcategory].find(p => p.id == productId);
            if (product) return product;
        }
    }
    return null;
}
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

// Function to find similar products
function findSimilarProducts(data, currentProduct, limit) {
    if (!currentProduct || !currentProduct.name) return []; // prevent empty names and non-existing products

    const productName = currentProduct.name.toLowerCase();
    let similarProducts = [];

    for (const category in data.categories) {
        for (const subcategory in data.categories[category]) {
            const products = data.categories[category][subcategory];
            similarProducts = similarProducts.concat(
                products.filter(product =>
                    product.id !== currentProduct.id &&
                    product.name.toLowerCase().includes(productName.split(' ')[0])
                )
            )
        }
    }


    return similarProducts
        .sort(() => 0.5 - Math.random()) // Sort randomly (prevent showing similar order all the time )
        .slice(0, limit);
}

// Function to render product details
function renderProductDetails(product) {
     const style = document.createElement('style');
  style.textContent = `
  .colors-container {
  margin-top: 10px;
  }
  .colors-container h3 {
    font-size: 1.2rem;
    font-weight: bold;
    margin-bottom: 5px;
  }
    .color-options {
        display: flex;
        gap: 10px;
         flex-wrap: wrap;
    }
    .color-option {
         display: flex;
    align-items: center;
     gap: 5px;
    cursor: pointer;
      padding: 5px 10px;
      border-radius: 5px;
       border: 1px solid #ddd;
    }
      .color-option.selected {
            border: 1px solid #000; /* Highlight border for selected color */
              background-color: #f0f0f0;
        }
    .color-box {
        width: 20px;
        height: 20px;
         border-radius: 50%;
      display: inline-block;
    }
    .color-name {
      font-size: 0.9rem;
         white-space: nowrap;
    }
  `;
    document.head.appendChild(style);
    currentDisplayedImage = product.image; // Initialize with main image
    selectedColor = product.colors && product.colors[0] ? product.colors[0] : ''; // Set the first color as default
    const discount = product.old_price
        ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
        : 0;

    const discountText = discount ? `<p class="discount-text">خصم ${discount}%</p>` : '';

    const amountText = product.amount > 0
        ? `<p class="amount-text">الكمية المتبقية: ${product.amount}</p>`
        : `<p class="amount-text out-of-stock">غير متوفر حاليًا</p>`;

    const colorsHTML = product.colors && product.colors.length > 0 ? `
    <div class="colors-container mt-4">
        <h3 class="text-lg font-semibold mb-2">الألوان المتاحة:</h3>
        <div class="color-options flex gap-2">
            ${product.colors.map(color => `
                <span 
                    class="color-option ${color === selectedColor ? 'selected' : ''} flex items-center gap-1 cursor-pointer"
                    data-color="${color}"
                >
                    <span class="color-box" style="background-color: ${color};"></span>
                    <span class="color-name">${color}</span>
                </span>
            `).join('')}
        </div>
    </div>
` : '';

    const productDetails = `
        <div class="product-container grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="product-images">
                <img id="main-image" src="${product.image}" alt="${product.name}" class="main-image">
                ${product.images ? renderImageGallery(product.images) : ''}
            </div>
            <div class="product-info">
                <h2>${product.name}</h2>
                <div class="price">
                    <p><span>${product.price} جنيه</span></p>
                    <p class="old_price">${product.old_price || ''} جنيه</p>
                </div>
               
                ${discountText}
                ${amountText}
                 ${colorsHTML}
                ${product.description ? `<div class="description mt-4">
                    <h3 class="text-lg font-semibold mb-2">وصف المنتج:</h3>
                    <p>${product.description}</p>
                </div>` : ''}

                <div class="icons">
                    <span class="btn_add_cart ${product.amount <= 0 ? 'out-of-stock-btn' : ''}">
                        <i class="fa-solid fa-cart-shopping"></i> إضافة للسلة
                    </span>
                     <span class="btn_add_wishlist">
                        <i class="fa-regular fa-heart"></i> إضافة للمفضلة
                     </span>
                    <span class="share-button">
                        <i class="fa-solid fa-share-from-square"></i> مشاركة المنتج
                    </span>
                </div>
            </div>
        </div>
        <div id="similar-products" class="mt-12">
            <h2 class="text-2xl font-bold mb-6">منتجات مشابهة</h2>
            <div class="similar-products-grid"></div>
        </div>
    `;

    document.getElementById('product-details').innerHTML = productDetails;
    attachImageGalleryEvents();
    attachColorSelectionEvents(); // Attach events for color selection
    addEventListenersToProduct(product);
    // Disable the add to cart button if out of stock
    const addToCartButton = document.querySelector('.btn_add_cart');
    if (product.amount <= 0 && addToCartButton) {
        addToCartButton.disabled = true;
    }
}



// Function to render image gallery
function renderImageGallery(images) {
    return `
        <div class="image-gallery mt-4 flex gap-2 overflow-x-auto">
            ${images.map(img => `
                <img src="${img}" alt="صورة إضافية" class="w-20 h-20 object-cover rounded cursor-pointer hover:opacity-75 transition-opacity">
            `).join('')}
        </div>
    `;
}
// Function to attach event listeners to color options
function attachColorSelectionEvents() {
    const colorOptions = document.querySelectorAll('.color-option');

    colorOptions.forEach(option => {
        option.addEventListener('click', function () {
            // remove 'selected' class from all options
            colorOptions.forEach(opt => opt.classList.remove('selected'));
            // add 'selected' class to the clicked option
            this.classList.add('selected');
             selectedColor = this.dataset.color;
         });
    });
}
// Function to render similar products
// Function to render similar products
function renderSimilarProducts(products) {

    if (!products || products.length === 0) {
        document.querySelector('.similar-products-grid').innerHTML = '<p>لا توجد منتجات مشابهة حاليًا.</p>';
        return;
    }

    const similarProductsHTML = `
     ${products.map(product => {
       const discount = product.old_price
            ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
            : 0;

        const discountBadge = discount > 0 ? `<span class="discount-badge">خصم ${discount}%</span>` : '';
     return `
        <a href="product.html?id=${product.id}" class="product-card">
         <img src="${product.image}" alt="${product.name}">
           ${discountBadge}
              <div class="info">
                <h4>${product.name}</h4>
                <p class="price">${product.price} جنيه</p>
             </div>
        </a>
     `
  }).join('')}
      
  `;
    document.querySelector('.similar-products-grid').innerHTML = similarProductsHTML;
}

// Function to attach events to image gallery
function attachImageGalleryEvents() {
    const galleryImages = document.querySelectorAll('.image-gallery img');
    const mainImage = document.getElementById('main-image');

    if (mainImage) {
        currentDisplayedImage = mainImage.src; // Set initial main image
    }

    galleryImages.forEach(img => {
        img.addEventListener('click', () => {
            mainImage.src = img.src;
            currentDisplayedImage = img.src; // Update current displayed image
            galleryImages.forEach(i => i.classList.remove('selected'));
            img.classList.add('selected');
        });
    });
}

// Function to add event listeners to product buttons
function addEventListenersToProduct(product) {
    const addToCartButton = document.querySelector('.btn_add_cart');
    const addToWishlistButton = document.querySelector('.btn_add_wishlist');
    const favoritesButton = document.querySelector('.share-button');

    if (addToCartButton) {
        if (product.amount <= 0) {
            // If the product is out of stock
            addToCartButton.addEventListener('click', function (event) {
                event.preventDefault(); // Prevent default click behavior

                const message = document.createElement('div');
                message.textContent = 'هذا المنتج غير متوفر حاليا';
                message.classList.add('out-of-stock-message'); // Apply CSS class
                document.body.appendChild(message);

                setTimeout(() => {
                    message.remove();
                }, 1500);
            });
        } else {
            addToCartButton.addEventListener('click', function () {
                const productId = product.id;
                const imgSrc = currentDisplayedImage || product.image;
                const title = product.name;
                const price = product.price;

                // Use product.amount to check against actual stock
                addToCart(productId, imgSrc, title, price, product.amount, selectedColor); //Pass amount and color
                //If added successfuly then show success message
                this.innerHTML = '<i class="fa-solid fa-check"></i> تم الإضافة';
                this.style.backgroundColor = '#ccc';
                this.disabled = true;

                setTimeout(() => {
                    this.style.backgroundColor = '';
                    this.innerHTML = '<i class="fa-solid fa-cart-shopping"></i> إضافة للسلة';
                    this.disabled = false;
                }, 1000);
            });
        }
    }
    if (addToWishlistButton) {
        addToWishlistButton.addEventListener('click', function () {
            const productId = product.id;
            const imgSrc = currentDisplayedImage || product.image;
            const title = product.name;
            const price = product.price;

            addToWishlist(productId, imgSrc, title, price);

            this.innerHTML = '<i class="fa-solid fa-check"></i> تم الإضافة';
            this.style.backgroundColor = '#ccc';
            this.disabled = true;

            setTimeout(() => {
                this.style.backgroundColor = '';
                this.innerHTML = '<i class="fa-regular fa-heart"></i> إضافة للمفضلة';
                this.disabled = false;
            }, 1000);
        });
    }

    if (favoritesButton) {
        favoritesButton.addEventListener('click', function () {
            if (navigator.share) {
                navigator.share({
                    title: product.name,
                    text: `شاهد هذا المنتج الرائع: ${product.name}\nالسعر: ${product.price} جنيه`,
                    url: window.location.href
                }).catch(error => console.error('Error sharing:', error));
            } else {
                alert('المشاركة غير مدعومة في هذا المتصفح.');
            }
        });
    }
}
// Function to add product to cart
function addToCart(productId, imgSrc, title, price, availableQuantity, color) { // Accept availableQuantity and color
    const existingItem = cartItems.find(item => item.id === productId && item.color === color);

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

            const product = { id: productId, imgSrc, title, price, quantity: 1, color:color };
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

function showOutOfStockMessage() {
    const message = document.createElement('div');
    message.textContent = 'لا يوجد المزيد من هذا المنتج في المخزون';
    message.classList.add('out-of-stock-message');
    document.body.appendChild(message);

    setTimeout(() => {
        message.remove();
    }, 1500);
}

// تأكد من أن هذه الدوال متاحة بشكل عام
window.updateCartQuantity = function (productId, increment, color) {
    const item = cartItems.find(item => item.id === productId && item.color === color);
    if (item) {
        findProductData(productId).then((productData) => {
            if (increment > 0 && item.quantity >= productData.amount) {
                showOutOfStockMessage(); // Show out of stock if exceeds product amount

            } else {
                item.quantity += increment;
                if (item.quantity <= 0) {
                    removeFromCart(productId, color);
                } else {
                    saveCartToLocalStorage();
                    updateCartUI();
                }
            }
        })


    }
};

window.removeFromCart = function (productId, color) {
    cartItems = cartItems.filter(item => !(item.id === productId && item.color === color));
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

// Function to move item from wishlist to cart
window.moveToCart = function (productId) {
    findProductData(productId).then((productData) => {
        const existingItemInCart = cartItems.find(item => item.id === productId);
        if (existingItemInCart) {
            showAlreadyInCartMessage(); // Show message if already in cart
        } else {
            const item = wishlistItems.find(item => item.id === productId);
            if (item) {
                if (productData && productData.amount > 0) { // check if product amount is greater than 0
                addToCart(item.id, item.imgSrc, item.title, item.price, productData.amount, selectedColor); // Pass the amount and color
                removeFromWishlist(productId);
                }else {
                      showOutOfStockMessage();
                }
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
// Function to update cart UI
function updateCartUI() {
    const cartItemsContainer = document.querySelector('.items_in_cart');
    if (!cartItemsContainer) return;

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
            findProductData(item.id).then((productData) => {
                  const disablePlus = productData && item.quantity >= productData.amount ? 'disabled' : '';

                const cartItemHTML = `
                                    <div class="item_cart">
                                        <img src="${item.imgSrc}" alt="${item.title}">
                                            <div class="cart-item-details">
                                                <h4>${item.title}</h4>
                                                    <p>${item.price} جنيه</p>
                                                     <p style="color:${item.color}">${item.color}</p>
                                                     <div class="quantity_controls">
                                                          <button onclick="updateCartQuantity(${item.id}, -1, '${item.color}')">-</button>
                                                        <span>${item.quantity}</span>
                                                        <button onclick="updateCartQuantity(${item.id}, 1, '${item.color}')" ${disablePlus}>+</button>
                                                    </div>
                                             </div>
                                     <button class="delete_item" onclick="removeFromCart(${item.id}, '${item.color}')"><i class="fa fa-trash"></i></button>
                                  </div>
                                  `;
                cartItemsContainer.insertAdjacentHTML('beforeend', cartItemHTML);
            })
                

            totalPrice += parseFloat(item.price) * item.quantity;
            totalQuantity += item.quantity;
        });
    }

    document.querySelectorAll('.cart_count').forEach(el => el.textContent = totalQuantity);
    document.querySelectorAll('.price_cart_total').forEach(el => el.textContent = `${totalPrice} جنيه`);
    document.querySelectorAll('.count_item').forEach(el => el.textContent = totalQuantity); // تحديث العداد بجانب ايقونة السلة
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
function saveCartToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(cartItems));
}

function saveWishlistToLocalStorage() {
    localStorage.setItem('wishlistItems', JSON.stringify(wishlistItems));
}
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
    const totalPriceElement = document.querySelector('.price_cart_total');
    const itemCountElement = document.querySelector('.cart_count');


    if (!storedCartItems || storedCartItems.length === 0) {

        const noItemsMessage = document.createElement('div');
        noItemsMessage.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 20px;
             border-radius: 10px;
             font-size: 20px;
             font-weight: bold;
              z-index: 999999;
            `;
        noItemsMessage.textContent = 'هو انت لسه حطيت حاجه؟';
        const closeButton = document.createElement('button');
        closeButton.textContent = 'إغلاق';
        closeButton.style.cssText = `
            margin-top: 10px;
            padding: 5px 10px;
             background-color: rgb(202, 23, 23);
               color: white;
                border: none;
              border-radius: 5px;
             cursor: pointer;
            `;
        closeButton.onclick = () => {
            noItemsMessage.remove();
        };
        noItemsMessage.appendChild(closeButton);
        document.body.appendChild(noItemsMessage);

        return;
    }
    const totalPrice = totalPriceElement.textContent
    const itemCount = itemCountElement.textContent;



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
          message += `   *اللون:* ${item.color}\n`;
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
    document.querySelectorAll('.cart_count').forEach(el => el.textContent = '0');
    document.querySelectorAll('.price_cart_total').forEach(el => el.textContent = '0 جنيه');
    document.querySelectorAll('.count_item').forEach(el => el.textContent = '0'); // تحديث العداد بجانب ايقونة السلة
}


// Function to close the product page
function closePage() {
    window.history.back();
}
