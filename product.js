// Initialize cart and favorites from localStorage
let cartItems = JSON.parse(localStorage.getItem('cart')) || [];
let currentDisplayedImage = ''; // Track current displayed image

// Save cart to localStorage
function saveCartToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(cartItems));
}
// Load cart from localStorage
function loadCartFromLocalStorage() {
    cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    updateCartUI();
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
                const similarProducts = findSimilarProducts(data, product, 4);
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
               productsData = data; // Store fetched product data
  
                searchInput.addEventListener('input', function () {
                  const searchTerm = this.value.trim().toLowerCase(); // Normalize
                    resultsContainer.style.display = searchTerm ? 'block' : 'none'; // hide if empty
                    if (searchTerm.length === 0 ) return clearResults();
                
  
                  const results = searchProducts(productsData, searchTerm);
                 displayResults(results)
              });
          })
            .catch(error => console.error('Error fetching products data:', error));
            
       // add event listener on body to clear resoults on click any where except the resoults div
          document.body.addEventListener('click', function(event) {
                if (event.target !== searchInput && !resultsContainer.contains(event.target)) {
                  clearResults();
            }
  
      });
  
  
  
  function searchProducts(productsData, searchTerm){
       if (!productsData) return [];// if product not fetched don't do anything
  
      let results = [];
       for (const category in productsData.categories) {
              for (const subcategory in productsData.categories[category]) {
                    const categoryProducts = productsData.categories[category][subcategory];
  
            const categoryResults = categoryProducts.filter(product => product.name.toLowerCase().startsWith(searchTerm) ) // get products only if they starts with the word 
  
                 results = results.concat(categoryResults);
             }
       }
       return results.slice(0,6)
  
  }
  function clearResults() {
         resultsContainer.innerHTML = ''; // Clear the results
         resultsContainer.style.display = 'none'; // Hide results container
  }
  function displayResults(results) {
       resultsContainer.innerHTML = ''; // Clear previous results
  
              if (results.length === 0) {
                 const noResults = document.createElement('li')
                       noResults.textContent= 'لا توجد منتجات مطابقه.'
  
                   resultsContainer.appendChild(noResults)
                  
                   return;
              }
  
    const ul = document.createElement('ul');
  
       results.forEach(product =>{
  
          const li = document.createElement('li');
             li.textContent = product.name;
           li.addEventListener('click',()=> window.location.href = `product.html?id=${product.id}` )
              ul.appendChild(li);
           })
  
     resultsContainer.appendChild(ul); // Add new resoults
  
      }
  
  });
  

// Function to find similar products
function findSimilarProducts(data, currentProduct, limit) {
    if(!currentProduct || !currentProduct.name) return []; // prevent empty names and non-existing products

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
    currentDisplayedImage = product.image; // Initialize with main image

    const discount = product.old_price
        ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
        : 0;

    const discountText = discount ? `<p class="discount-text">خصم ${discount}%</p>` : '';

    const amountText = product.amount > 0 
        ? `<p class="amount-text">الكمية المتبقية: ${product.amount}</p>` 
        : `<p class="amount-text out-of-stock">غير متوفر حاليًا</p>`;

    const productDetails = `
        <div class="product-container grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="product-images">
                ${discount ? `<div class="discount-badge">خصم ${discount}%</div>` : ''}
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
                ${product.description ? `<div class="description mt-4">
                    <h3 class="text-lg font-semibold mb-2">وصف المنتج:</h3>
                    <p>${product.description}</p>
                </div>` : ''}

                <div class="icons">
                    <span class="btn_add_cart ${product.amount <= 0 ? 'out-of-stock-btn' : ''}">
                        <i class="fa-solid fa-cart-shopping"></i> إضافة للسلة
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

// Function to render similar products
function renderSimilarProducts(products) {
  
  if (!products || products.length === 0) {
    document.querySelector('.similar-products-grid').innerHTML = '<p>لا توجد منتجات مشابهة حاليًا.</p>';
    return;
  }
  
   const similarProductsHTML = `
     ${products.map(product => `
    <a href="product.html?id=${product.id}" class="product-card">
     <img src="${product.image}" alt="${product.name}">
          <div class="info">
             <h4>${product.name}</h4>
             <p class="price">${product.price} جنيه</p>
            </div>
       </a>
  `).join('')}
      
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
          }else{
              addToCartButton.addEventListener('click', function () {
                const productId = product.id;
                const imgSrc = currentDisplayedImage || product.image;
                const title = product.name;
                const price = product.price;

                addToCart(productId, imgSrc, title, price);

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

// تأكد من أن هذه الدوال متاحة بشكل عام
window.updateCartQuantity = function(productId, increment) {
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
};

window.removeFromCart = function(productId) {
    cartItems = cartItems.filter(item => item.id !== productId);
    saveCartToLocalStorage();
    updateCartUI();
};
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

    document.querySelectorAll('.count_item').forEach(el => el.textContent = totalQuantity);
    document.querySelectorAll('.price_cart_total').forEach(el => el.textContent = `${totalPrice} جنيه`);
}
window.addEventListener('load', () => {
    loadCartFromLocalStorage();
 
});
function saveCartToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(cartItems));
}
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
            background-color:rgb(202, 23, 23);
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


// Function to close the product page
function closePage() {
    window.history.back();
}
