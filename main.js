// Initialize IndexedDB
let db;
const dbName = 'productsDB';
const dbVersion = 1;

const request = indexedDB.open(dbName, dbVersion);

request.onerror = (event) => {
    console.error("Database error:", event.target.errorCode);
};

request.onupgradeneeded = (event) => {
    db = event.target.result;
    // Create object stores (tables) if they don't exist
   if (!db.objectStoreNames.contains('cart')) {
         db.createObjectStore('cart', { keyPath: 'uniqueId' });
       }
    if (!db.objectStoreNames.contains('wishlist')) {
        db.createObjectStore('wishlist', { keyPath: 'uniqueId' });
    }
};

request.onsuccess = async (event) => {
    db = event.target.result;
    // Load data from IndexedDB once the database is ready
   await loadCartFromIndexedDB();
  await  loadWishlistFromIndexedDB();
  loadGiftFromLocalStorage();

};


// --- Helper Functions for IndexedDB ---

function getObjectStore(storeName, mode) {
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
}
function getAllFromIndexedDB(storeName) {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error("Database not initialized yet."));
        return;
      }
        const store = getObjectStore(storeName, 'readonly');
        const getAllRequest = store.getAll();
        getAllRequest.onsuccess = (event) => {
            resolve(event.target.result);
        };
        getAllRequest.onerror = (event) => {
             reject(new Error(`Error getting data from ${storeName}: ${event.target.error}`));
        };
    });
}
function addToIndexedDB(storeName, item) {
  return new Promise((resolve, reject) => {
      if (!db) {
          reject(new Error("Database not initialized yet."));
          return;
      }
      const store = getObjectStore(storeName, 'readwrite');
      const addRequest = store.put(item);
      addRequest.onsuccess = () => {
        resolve();
      };
     addRequest.onerror = (event) => {
          reject(new Error(`Error adding to ${storeName}: ${event.target.error}`));
        };
  });
}

function deleteFromIndexedDB(storeName, id) {
   return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error("Database not initialized yet."));
            return;
        }
        const store = getObjectStore(storeName, 'readwrite');
        const deleteRequest = store.delete(id);

        deleteRequest.onsuccess = () => {
            resolve();
        };
        deleteRequest.onerror = (event) => {
            reject(new Error(`Error deleting from ${storeName}: ${event.target.error}`));
       };
   });
}

// --- Cart Functions ---

let cartItems = [];


async function saveCartToIndexedDB() {
    try {
        const store = getObjectStore('cart', 'readwrite');

         // Clear existing cart items
          const clearRequest = store.clear();
            await new Promise((resolve, reject) => {
                clearRequest.onsuccess = resolve;
                clearRequest.onerror = reject;
            });


        // Add each item to the object store
        for (const item of cartItems) {
             await addToIndexedDB('cart', item);
        }
     } catch (error) {
         console.error("Error saving cart to IndexedDB:", error);
    }
}

async function loadCartFromIndexedDB() {
  return   getAllFromIndexedDB('cart')
        .then(items => {
            cartItems = items;
             return updateCartUI();

        })
        .catch(error => console.error("Error loading cart from IndexedDB:", error));
}


// --- Wishlist Functions ---

let wishlistItems = [];


async function saveWishlistToIndexedDB() {
     try {
          const store = getObjectStore('wishlist', 'readwrite');

          // Clear existing wishlist items
           const clearRequest = store.clear();
             await new Promise((resolve, reject) => {
                 clearRequest.onsuccess = resolve;
                 clearRequest.onerror = reject;
             });


        // Add each item to the object store
         for (const item of wishlistItems) {
           await addToIndexedDB('wishlist', item);
        }
    } catch (error) {
           console.error("Error saving wishlist to IndexedDB:", error);
       }
}

 async function loadWishlistFromIndexedDB() {
     return getAllFromIndexedDB('wishlist')
        .then(items => {
             wishlistItems = items;
            return updateWishlistUI();

        })
        .catch(error => console.error("Error loading wishlist from IndexedDB:", error));
}

// --- Gift Functions ---

let giftItems = [];

function saveGiftToLocalStorage() {
    localStorage.setItem('giftItems', JSON.stringify(giftItems));
}

function loadGiftFromLocalStorage() {
    const storedGiftItems = localStorage.getItem('giftItems');
    giftItems = storedGiftItems ? JSON.parse(storedGiftItems) : [];
    updateGiftUI();
}
function clearGift() {
    giftItems = [];
    saveGiftToLocalStorage();
    updateGiftUI();
}

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
        button.addEventListener('click', async function () {
            const product = this.closest('.product');
            const productId = product.dataset.id;
            const imgSrc = product.querySelector('img').src;
            const title = product.querySelector('h2').textContent;
            const price = product.querySelector('.price span').textContent;
           // Retrieve the product from allProducts object
              const productData = await findProductData(productId);
            if (productData) {
             addToCart(productId, imgSrc, title, price, productData.amount, productData.colors && productData.colors[0]);
              } else {
                    console.error('Product not found in product data:', productId);
                 }

        });
    });

}


async function addToCart(productId, imgSrc, title, price, availableQuantity, color) { // Accept availableQuantity and color
     const uniqueId = `${productId}-${color}`;
    const existingItem = cartItems.find(item => item.uniqueId === uniqueId);

    if (existingItem) {
        if (existingItem.quantity < availableQuantity) {  // check if product amount is more than existing item quantity
            existingItem.quantity += 1;
          await saveCartToIndexedDB();
            updateCartUI();

        } else {
            showOutOfStockMessage(); // Show message if over the amount
        }
    } else {
        if (availableQuantity > 0) { // Add if amount is greater than 0

            const product = { uniqueId: uniqueId, id: productId, imgSrc, title, price, quantity: 1, color:color };
            cartItems.push(product);
           await  saveCartToIndexedDB();
            updateCartUI();

        } else {
            showOutOfStockMessage(); // Show message if over the amount

        }
    }


}
// Function to add product to wishlist
async function addToWishlist(productId, imgSrc, title, price, color) {
       const uniqueId = `${productId}-${color}`;
     const existingItem = wishlistItems.find(item => item.uniqueId === uniqueId);
    if (!existingItem) {
          const product = { uniqueId: uniqueId, id: productId, imgSrc, title, price, color:color };
        wishlistItems.push(product);
        await  saveWishlistToIndexedDB();
        updateWishlistUI();
    }
}
// Function to add product to gift
async function addToGift(productId, imgSrc, title, price, availableQuantity, color) {
    const uniqueId = `${productId}-${color}`;
     const existingItem = giftItems.find(item => item.uniqueId === uniqueId);
     if (existingItem) {
         if (existingItem.quantity < availableQuantity) {
              existingItem.quantity += 1;
               saveGiftToLocalStorage();
              updateGiftUI();
              return 'added';
          } else {
              return 'max_quantity_reached';
          }
      } else {
           if (availableQuantity > 0) {
               const product = { uniqueId: uniqueId, id: productId, imgSrc, title, price, color: color, quantity: 1 };
            giftItems.push(product);
             saveGiftToLocalStorage();
              updateGiftUI();
              return 'added';
        } else {
             showOutOfStockMessage();
               return 'out_of_stock';
          }
    }

}

function showMaxQuantityMessage() {
    const message = document.createElement('div');
    message.textContent = 'مفيش تاني';
    message.classList.add('max-quantity-message');
    document.body.appendChild(message);

    setTimeout(() => {
        message.remove();
    }, 1500);
}
function showOutOfStockMessage() {
    const message = document.createElement('div');
    message.textContent = 'خلص والله';
    message.classList.add('out-of-stock-message');
    document.body.appendChild(message);

    setTimeout(() => {
        message.remove();
    }, 1500);
}

window.updateCartQuantity = async function (productId, increment, color) {
    const uniqueId = `${productId}-${color}`;
    const item = cartItems.find(item => item.uniqueId === uniqueId);
    if (item) {
        findProductData(productId).then(async (productData) => {
            if (increment > 0 && item.quantity >= productData.amount) {
                showMaxQuantityMessage(); // Show out of stock if exceeds product amount
            } else {
                item.quantity += increment;
                if (item.quantity <= 0) {
                   await removeFromCart(productId, color); // Pass color to remove function
                } else {
                   await  saveCartToIndexedDB();
                    updateCartUI();
                }
            }
        })
    }
};
window.updateGiftQuantity = async function (productId, increment, color) {
    const uniqueId = `${productId}-${color}`;
       const item = giftItems.find(item => item.uniqueId === uniqueId);
    if (item) {
        findProductData(productId).then(async (productData) => {
            if (increment > 0 && item.quantity >= productData.amount) {
                showOutOfStockMessage(); // Show out of stock if exceeds product amount
            } else {
               item.quantity += increment;
               if (item.quantity <= 0) {
                    await removeFromGift(productId, color);
                 } else {
                       saveGiftToLocalStorage();
                     updateGiftUI();
                }
          }
    })

    }

};
// Modify the removeFromCart to accept color
window.removeFromCart = async function (productId, color) {
   const uniqueId = `${productId}-${color}`;
    cartItems = cartItems.filter(item => item.uniqueId !== uniqueId);
    await saveCartToIndexedDB();
    updateCartUI();
    updateWishlistUI(); // Update wishlist UI when cart is changed

};
// Function to remove from gift
window.removeFromGift = async function (productId, color) {
    const uniqueId = `${productId}-${color}`;
     giftItems = giftItems.filter(item => item.uniqueId !== uniqueId);
     saveGiftToLocalStorage();
     updateGiftUI();
};
// Function to remove from wishlist
window.removeFromWishlist = async function (productId, color) {
    const uniqueId = `${productId}-${color}`;
    wishlistItems = wishlistItems.filter(item => item.uniqueId !== uniqueId);
    await saveWishlistToIndexedDB();
    updateWishlistUI();
};


// Function to move item from wishlist to cart
window.moveToCart = async function (productId, color) {
    findProductData(productId).then(async (productData) => {
             const uniqueId = `${productId}-${color}`;
        const existingItemInCart = cartItems.find(item => item.uniqueId === uniqueId);
        if (existingItemInCart) {
            showAlreadyInCartMessage(); // Show message if already in cart
        } else {
            const item = wishlistItems.find(item => item.uniqueId === uniqueId);
            if (item) {
                 if (!productData || productData.amount <= 0) {
                      showOutOfStockMessage();
                 }else {
                     await addToCart(item.id, item.imgSrc, item.title, item.price, productData.amount, color); // Pass the amount and color
                    await  removeFromWishlist(productId, color);
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
window.completegift =  () => {
    // الحصول على عناصر الهدية
     const giftItems = document.querySelectorAll('.items_in_gift .item_gift');
     // تهيئة مصفوفة لحفظ البيانات
     let giftData = [];
 
     giftItems.forEach(item => {
       const productId = item.dataset.productId.split('-')[0];
          const color = item.dataset.productId.split('-')[1];
          const image = item.querySelector('img').src;
         const title = item.querySelector('h4').textContent;
           const price = item.querySelector('p').textContent;
            const quantity =  item.querySelector('.quantity_controls span').textContent
           giftData.push({productId, image, title, price , color, quantity})
     });
 
     // حفظ بيانات الهدية في localStorage
   localStorage.setItem('giftData', JSON.stringify(giftData));
 
   // إعادة التوجيه إلى صفحة الهدية
      window.location.href = 'gift.html';
 
 };

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

async function updateCartUI() {
  const cartItemsContainer = document.querySelector('.items_in_cart');
  if (!cartItemsContainer) return;

  // مسح محتوى السلة
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
           // انتظار جميع بيانات المنتجات
      for (const item of cartItems) {
            const productData = await findProductData(item.id);
        const disablePlus = productData && item.quantity >= productData.amount ? 'disabled' : '';
         const cartItemHTML = `
                    <div class="item_cart" data-product-id="${item.id}-${item.color}">
                        <img src="${item.imgSrc}" alt="${item.title}">
                        <div class="cart-item-details">
                            <h4>${item.title}</h4>
                            <p>${item.price} جنيه</p>
                             ${item.color ? `<p style="color:${item.color}">${item.color}</p>` : ''}
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
             totalPrice += parseFloat(item.price) * item.quantity;
           totalQuantity += item.quantity;
        }
     }


    // تحديث الإحصائيات
    document.querySelectorAll('.cart_count').forEach(el => el.textContent = totalQuantity);
    document.querySelectorAll('.price_cart_total').forEach(el => el.textContent = `${totalPrice} جنيه`);
    document.querySelectorAll('.count_item').forEach(el => el.textContent = totalQuantity);
}
// Function to update wishlist UI
// Function to update wishlist UI
async function updateWishlistUI() {
    const wishlistItemsContainer = document.querySelector('.items_in_wishlist');
    if (!wishlistItemsContainer) return;

    wishlistItemsContainer.innerHTML = '';
    let totalQuantity = 0;


    if (wishlistItems.length === 0) {
        wishlistItemsContainer.innerHTML = `
             <p class="empty-wishlist-message">مش عاجبك حاجه؟</p>
              <div class="empty-wishlist-icon"><i class="fa-solid fa-heart-crack"></i> 

             </div>
      `
    } else {

        wishlistItems.forEach(item => {
            const existingItemInCart = cartItems.find(cartItem => cartItem.uniqueId === item.uniqueId);
             let moveToCartButton;
                if (existingItemInCart) {
                  moveToCartButton = `<button class="btn_wishlist" disabled >موجود في السلة</button>`; // Disable if already in cart
                } else {
                    moveToCartButton = `<button class="btn_wishlist" onclick="moveToCart(${item.id}, '${item.color}')">نقل الي العربة</button>`
                  }

             const wishlistHTML = `
             <div class="item_wishlist" data-product-id="${item.id}-${item.color}">
                  <img src="${item.imgSrc}" alt="${item.title}">
                <div class="wishlist-item-details">
                      <h4>${item.title}</h4>
                    <p>السعر: ${item.price} جنيه</p>
                   ${item.color ? `<p style="color: ${item.color}">اللون: ${item.color}</p>` : ''}
                   </div>
                  <div class="wishlist_actions">
                         ${moveToCartButton}
                       <button class="delete_item" onclick="removeFromWishlist(${item.id}, '${item.color}')"><i class="fa fa-trash"></i></button>
                     </div>
              </div>
        `;
            wishlistItemsContainer.insertAdjacentHTML('beforeend', wishlistHTML);
            totalQuantity++;
        });
    }
    document.querySelectorAll('.wishlist_count').forEach(el => el.textContent = totalQuantity);

}
// Function to update gift UI
async function updateGiftUI() {
   const giftItemsContainer = document.querySelector('.items_in_gift');
    if (!giftItemsContainer) return;
     giftItemsContainer.innerHTML = '';
     let totalPrice = 0;
     let totalQuantity = 0;
    if (giftItems.length === 0) {
         giftItemsContainer.innerHTML = `
         <p class="empty-gift-message"> مش هتجيب هدية؟ </p>
         <div class="empty-gift-icon">
             <i class="fa-solid fa-gift"></i>
          </div>
         `;
     } else {
      for (const item of giftItems) {
              const productData = await findProductData(item.id);
            const disablePlus = productData && item.quantity >= productData.amount ? 'disabled' : '';

           const giftItemHTML = `
           <div class="item_gift" data-product-id="${item.id}-${item.color}">
               <img src="${item.imgSrc}" alt="${item.title}">
              <div class="gift-item-details">
                 <h4>${item.title}</h4>
                 <p>${item.price} جنيه</p>
                <p style="color: ${item.color}">${item.color}</p>
                  <div class="quantity_controls">
                       <button onclick="updateGiftQuantity(${item.id}, -1, '${item.color}')">-</button>
                        <span>${item.quantity}</span>
                       <button onclick="updateGiftQuantity(${item.id}, 1, '${item.color}')" ${disablePlus}>+</button>
                    </div>
               </div>
               <div class="gift_actions">
                     <button class="delete_item" onclick="removeFromGift(${item.id}, '${item.color}')"><i class="fa fa-trash"></i></button>
                </div>
           </div>
            `;
            giftItemsContainer.insertAdjacentHTML('beforeend', giftItemHTML);
             totalPrice += parseFloat(item.price) * item.quantity;
             totalQuantity += item.quantity;

      }
     }
       document.querySelectorAll('.gift_count').forEach(el => el.textContent = totalQuantity);
     document.querySelectorAll('.price_gift_total').forEach(el => el.textContent = `${totalPrice} جنيه`);

}



window.addEventListener('load', () => {

});
window.addEventListener('DOMContentLoaded', () => {
        // Load cart and wishlist from IndexedDB here
     loadCartFromIndexedDB();
    loadWishlistFromIndexedDB();
      loadGiftFromLocalStorage();
});
var cart = document.querySelector('.cart');
function open_cart() {
    cart.classList.add("active");
}
function close_cart() {
    cart.classList.remove("active");
}

var gift = document.querySelector('.gift');
function open_gift() {
    gift.classList.add("active");
}
function close_gift() {
    gift.classList.remove("active");
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
async function sendInvoiceViaWhatsApp() {
    const storedCartItems = cartItems;
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
   for (let i = 0; i < storedCartItems.length; i++) {
        const item = storedCartItems[i];
         message += ` *المنتج ${i + 1}:*\n`;
        message += `  🆔 *ID:* ${item.id}\n`;
        message += `   *الاسم:* ${item.title}\n`;
        message += `   *الكمية:* ${item.quantity}\n`;
         message += `   *اللون:* ${item.color}\n`;
        message += `   *السعر للوحدة:* ${item.price} \n`;
        message += `  *الإجمالي:* ${parseFloat(item.price) * item.quantity} جنيه\n`;
        message += `----------------------------------------\n`;
    }

    message += `\n *ملخص الطلب:*\n`;
    message += `  ️ *عدد المنتجات:* ${itemCount}\n`;
    message += `   *المجموع الكلي:* ${totalPrice} \n`;
    message += `========================================\n\n`;

    message += ` *شكرًا لتسوقك معنا!* \n`;
    message += ` *للاستفسارات، تواصل معنا عبر واتساب على هذا الرقم.*\n`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappLink = `https://wa.me/201026972523?text=${encodedMessage}`;
    window.open(whatsappLink, '_blank');

    await clearCart();
}
// Clear the cart
async function clearCart() {
    cartItems = [];
    await saveCartToIndexedDB();
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
// Swiper للصور
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


document.addEventListener('DOMContentLoaded', function () {
    const navContainer = document.querySelector('.nav-container');
    const prevButton = document.querySelector('.prev-arrow');
    const nextButton = document.querySelector('.next-arrow');
    const scrollStep = 15;
    let scrollIcon = null;


    function getScrollAmount() {
        return navContainer.firstElementChild.offsetWidth + scrollStep;
    }

    // إضافة أحداث للنقر على الأسهم مع حركة سلسة فقط
    nextButton.addEventListener('click', () => {
        navContainer.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
    });

    prevButton.addEventListener('click', () => {
        navContainer.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
    });

    function addScrollIcon() {
        if (scrollIcon) return; // إذا كانت الأيقونة موجودة، لا تضف واحدة جديدة

        scrollIcon = document.createElement('div');
        scrollIcon.classList.add('scroll-icon');
        scrollIcon.innerHTML = `<i class="fa-solid fa-hand-point-up"></i>`; // أيقونة اليد في البداية
        navContainer.appendChild(scrollIcon);

         let intervalId;
           // إخفاء الأيقونة بعد 5 ثوانٍ
        setTimeout(() => {
            scrollIcon.style.opacity = '0';
             clearInterval(intervalId);
            setTimeout(() => {
                scrollIcon.remove();
                scrollIcon = null; // إعادة تعيين المتغير
                 setTimeout(addScrollIcon, 5 * 60 * 1000) // إظهار الأيقونة بعد 5 دقائق
            }, 1000); // إزالة الأيقونة بعد انتهاء التأثير
        }, 5000);

     }

       addScrollIcon();
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

document.addEventListener('DOMContentLoaded', () => {
    const sendInvoiceButton = document.querySelector('.send-invoice-button');
    if (sendInvoiceButton) {
        sendInvoiceButton.addEventListener('click', sendInvoiceViaWhatsApp);
    }
});
window.addEventListener('pageshow', (event) => {
    if (event.persisted) { // Check if the page is loaded from cache
        loadCartFromIndexedDB();
        loadWishlistFromIndexedDB();
        loadGiftFromLocalStorage();
    }
});
window.addEventListener('DOMContentLoaded', () => {
        // Load cart and wishlist from IndexedDB here
     loadCartFromIndexedDB();
    loadWishlistFromIndexedDB();
      loadGiftFromLocalStorage();
});