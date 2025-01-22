document.addEventListener('DOMContentLoaded', () => {

  // -- DOM Elements
  const giftProductsContainer = document.getElementById('added-items');
  const packsOptionsContainer = document.getElementById('packs-options');
  const boxesOptionsContainer = document.getElementById('boxes-options');
  const sweetsOptionsContainer = document.getElementById('sweets-options');
  const wrappingOptionsContainer = document.getElementById('wrapping-options');
  const giftTotalElement = document.getElementById('giftTotal');
  const noteArea = document.getElementById('note-area');
  const confirmButton = document.getElementById('confirmButton');

  // Container for Added Options
  const addedPackagingContainer = document.querySelector('.added-packaging-container');
  const addedSweetsContainer = document.querySelector('.added-sweets-container');
  const addedWrapsContainer = document.querySelector('.added-wraps-container');


    const emptyGiftMessage = '<p class="empty-gift-message"> لا يوجد منتجات بالهدية. </p>';

    addedSweetsContainer.innerHTML = `<h3> الحلويات </h3>`;
    addedPackagingContainer.innerHTML = `<h3> التعبئة </h3>`;
    addedWrapsContainer.innerHTML = `<h3> التغليف </h3>`;

  // -- State variables
  let selectedOptions = {
    package: null,
    sweets: [],
    wraps: []
  };

  const STORAGE_KEY = 'giftState';
  let giftData = [];
    // -- Loading State
    const loadingOverlay = document.createElement('div');
    loadingOverlay.classList.add('loading-overlay');
    loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(loadingOverlay);


  // -- Load Data from JSON and LocalStorage
  loadInitialData();


  async function loadInitialData() {
    try {
      showLoading();
      giftData = loadDataFromStorage('giftData');
      renderGiftProducts(giftData);

      const response = await fetch('gift.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const giftJSON = await response.json();
      if (!giftJSON) {
        throw new Error(`invalid json`);
      }

      // Render Options
      renderPackagingOptions(giftJSON.packaging, packsOptionsContainer, boxesOptionsContainer);
      renderOptions(giftJSON.sweets, sweetsOptionsContainer, 'sweet');
      renderOptions(giftJSON.decorations, wrappingOptionsContainer, 'wrap');
      // Restore previously Selected Options
      loadSelectedOptionsFromStorage()
      // Initialize Swiper
      initSwiper();
        calculateTotal();

        window.removeFromGiftPage = (productId) => {
             giftData = giftData.filter(item => item.productId !== productId);
             saveDataToStorage('giftData', giftData);
           renderGiftProducts(giftData);
           calculateTotal();
       };
    } catch (error) {
      console.error('Failed to load or parse data:', error);
      alert('فشل في تحميل البيانات. يرجى المحاولة مرة أخرى.');
    } finally {
      hideLoading();
    }
  }

  function loadDataFromStorage(key) {
       try {
           const storedData = localStorage.getItem(key);
            return storedData ? JSON.parse(storedData) : [];
        }
        catch (error) {
             console.error(`Error loading data from localStorage with key: ${key}`, error);
             return [];
        }
   }

    function saveDataToStorage(key, data) {
      try {
        localStorage.setItem(key, JSON.stringify(data));
       } catch (error) {
         console.error(`Error saving data to localStorage with key: ${key}`, error);
       }
    }

    function loadSelectedOptionsFromStorage() {
      try {
          const storedState = localStorage.getItem(STORAGE_KEY);
          if (storedState) {
              selectedOptions = JSON.parse(storedState);
              if (selectedOptions.package) {
                  renderAddedPackage(selectedOptions.package);
                  updatePackageSelectionUI(selectedOptions.package);
              }
               selectedOptions.sweets.forEach(sweet => {
                   const optionElement = document.querySelector(`.sweets-item[data-id="${sweet.id}"]`);
                  if (optionElement) {
                      markOptionAsSelected(optionElement, 'sweet', sweet);
                       renderQuantityControls(optionElement, sweet);
                         const quantityControls = optionElement.querySelector('.quantity-controls');
                         if (quantityControls){
                           const quantityValueSpan = quantityControls.querySelector('.quantity-value');
                         if (quantityValueSpan) {
                            quantityValueSpan.textContent = sweet.quantity || 0;
                           }
                         }
                      updateAddedSweetItem(sweet, addedSweetsContainer)
                   }
                
              });
              selectedOptions.wraps.forEach(wrap => {
                  const optionElement = document.querySelector(`.wrapping-item[data-id="${wrap.id}"]`);
                  if (optionElement) {
                     markOptionAsSelected(optionElement, 'wrap', wrap);
                  }
              });
          }
      } catch (error) {
         console.error('Error parsing selected options from localStorage', error);
     }
  }
  
  
    function updatePackageSelectionUI(packageData) {
        const allOptions = document.querySelectorAll('.box-item, .pack-item');
        allOptions.forEach(item => {
            if (item.dataset.id === packageData.id) {
                item.classList.add('selected-package');
            } else {
                item.classList.remove('selected-package');
            }
        });
    }

  function updateSelectedOptions(options = null) {
     if(options) {
           selectedOptions =  {...selectedOptions, ...options} ;
       }
       saveDataToStorage(STORAGE_KEY, selectedOptions);
  }

    function markOptionAsSelected(optionElement, type, option) {
      optionElement.classList.add(`selected-${type}`);
        const addButton = optionElement.querySelector('.add-option-btn');
      if (addButton){
            addButton.textContent = 'إزالة';
        }
    if (type === 'sweet') {
       // updateAddedSweetItem(option, addedSweetsContainer);
       } else if (type === 'wrap') {
        renderAddedItem(option, addedWrapsContainer, 'wrap');
        }
  }

    function initSwiper() {
         const swipers = [
          {selector: '.packs-swiper', nextEl: '.packs-swiper .swiper-button-next', prevEl: '.packs-swiper .swiper-button-prev'},
          {selector: '.boxes-swiper', nextEl: '.boxes-swiper .swiper-button-next', prevEl: '.boxes-swiper .swiper-button-prev'},
           {selector: '.sweets-swiper', nextEl: '.sweets-swiper .swiper-button-next', prevEl: '.sweets-swiper .swiper-button-prev'},
            {selector: '.wrapping-swiper', nextEl: '.wrapping-swiper .swiper-button-next', prevEl: '.wrapping-swiper .swiper-button-prev'}
       ];
     swipers.forEach(({selector, nextEl, prevEl}) => {
         new Swiper(selector, {
             slidesPerView: 'auto',
              spaceBetween: 10,
               navigation: { nextEl, prevEl },
         });
      });
    }

  function renderGiftProducts(giftData) {
      if (!giftProductsContainer) return;
      giftProductsContainer.innerHTML = '';
      if (!giftData || giftData.length === 0) {
          giftProductsContainer.innerHTML = emptyGiftMessage;
          return;
      }
      giftData.forEach((item) => {
          const price = parseFloat(item.price);
          const itemTotalPrice = price * parseInt(item.quantity);
          const giftItemElement = document.createElement('div');
          giftItemElement.classList.add('gift-item');
          giftItemElement.innerHTML = `
              <img src="${item.image}" alt="${item.title}">
              <h4>${item.title}</h4>
              <p> السعر : ${item.price}</p>
              <p class="quantity">الكمية: ${item.quantity}</p>
              <button class="remove-item-btn" onclick="removeFromGiftPage('${item.productId}')">ازالة</button>
            `;
          giftProductsContainer.appendChild(giftItemElement);
      });
  }

    function renderPackagingOptions(packagingData, packsContainer, boxesContainer) {
        if (!packsContainer || !boxesContainer) return;
        const { boxes, packs } = packagingData;
        packsContainer.innerHTML = '';
        boxesContainer.innerHTML = '';
        renderOptions(packs, packsContainer, 'pack');
        renderOptions(boxes, boxesContainer, 'box');
        addPackageSelectionHandlers(packsContainer, 'pack')
       addPackageSelectionHandlers(boxesContainer, 'box')
    }

    function addPackageSelectionHandlers(container, type) {
        if (!container) return;
       container.addEventListener('click', (event) => {
            const selectedOption = event.target.closest(`.${type}-item`);
            if (!selectedOption) return;

            const packageData =  {...selectedOption.dataset, name: selectedOption.querySelector('p')?.textContent, image: selectedOption.querySelector('img')?.src};

            updateSelectedOptions({package : packageData});
           updatePackageSelectionUI(packageData)
             renderAddedPackage(packageData);
            calculateTotal();
         });
     }


    function renderOptions(options, container, type) {
        if (!container) return;
        container.innerHTML = '';
        options.forEach(option => {
            const optionElement = createOptionElement(option, type);
            container.appendChild(optionElement);
             const addButton = optionElement.querySelector('.add-option-btn');
             if (addButton) {
                addButton.addEventListener('click', () => {
                     handleOptionSelection(option, optionElement, type);
               });
            }
      });
    }


    function createOptionElement(option, type) {
       const optionElement = document.createElement('div');
      optionElement.classList.add('swiper-slide');
      optionElement.classList.add(`${type}-item`);
       optionElement.dataset.id = option.id;
       optionElement.dataset.price = option.price;
      optionElement.innerHTML = `
           <img src="${option.image}" alt="${option.name}">
          <p>${option.name}</p>
           <p class="option-price"> السعر: ${option.price} جنيه</p>
            <button class="add-option-btn">إضافة</button>
          `;
       if (type === 'sweet') {
          optionElement.classList.add('sweets-item')
       } else if (type === 'wrap') {
           optionElement.classList.add('wrapping-item')
        }  else if (type === 'box' ||  type === 'pack' ) {
         optionElement.classList.add('packaging-item');
        }
       return optionElement;
    }

    function handleOptionSelection(option, element, type) {
      if (!element) return;
  
      let selectedArray, selectedClass;
      switch (type) {
          case 'sweet':
              selectedArray = selectedOptions.sweets;
              selectedClass = 'selected-sweet';
              break;
          case 'wrap':
              selectedArray = selectedOptions.wraps;
              selectedClass = 'selected-wrap';
              break;
          default:
              return;
      }
  
      const isSelected = selectedArray.some(item => item.id === option.id);
      const addButton = element.querySelector('.add-option-btn');
      if (!addButton) return;
  
      let updatedSelectedArray;
  
      if (type === 'sweet') {
          if (!isSelected) {
              // First click for sweets: show quantity controls
                renderQuantityControls(element, option);
                  addButton.textContent = 'إضافة';
                 const handleAddSweet = () => {
                  const quantityElement = element.querySelector('.quantity-value');
                   const quantity = parseInt(quantityElement?.textContent) || 0;
                 if (quantity > 0) {
                         updatedSelectedArray = [...selectedArray, { ...option, quantity: quantity }];
                     element.classList.add(selectedClass);
                      addButton.textContent = 'إزالة';
                       updateAddedSweetItem(option, addedSweetsContainer);
                       removeQuantityControls(element);
                      updateSelectedOptions({ sweets: updatedSelectedArray });
                       addButton.removeEventListener('click', handleAddSweet);
                         addButton.addEventListener('click', handleRemoveSweet);
                   }
                 calculateTotal();
               };
               const handleRemoveSweet = () => {
                 updatedSelectedArray = selectedArray.filter(item => item.id !== option.id);
                  element.classList.remove(selectedClass);
                 addButton.textContent = 'إضافة';
                  removeAddedItem(option, addedSweetsContainer);
                 updateSelectedOptions({ sweets: updatedSelectedArray });
                   addButton.removeEventListener('click', handleRemoveSweet);
                  calculateTotal();
               };
          
              addButton.addEventListener('click', handleAddSweet);
  
          } else {
              // Remove sweet if already added
                updatedSelectedArray = selectedArray.filter(item => item.id !== option.id);
                 element.classList.remove(selectedClass);
                addButton.textContent = 'إضافة';
                 removeAddedItem(option, addedSweetsContainer);
                updateSelectedOptions({ sweets: updatedSelectedArray });
                 calculateTotal();
                  addButton.removeEventListener('click', handleRemoveSweet);
              
            }
      }
    else if (type === 'wrap') {
       if (!isSelected) {
          // First click for wraps: add directly
           updatedSelectedArray = [...selectedArray, { ...option, quantity: 1 }];
          element.classList.add(selectedClass);
           addButton.textContent = 'إزالة';
          renderAddedItem(option, addedWrapsContainer, 'wrap');
            updateSelectedOptions({ wraps: updatedSelectedArray });
            addButton.removeEventListener('click', handleAddOrRemove);
             addButton.addEventListener('click', handleAddOrRemove);

      } else {
          // Remove wrap if already added
          updatedSelectedArray = selectedArray.filter(item => item.id !== option.id);
            element.classList.remove(selectedClass);
           addButton.textContent = 'إضافة';
           removeAddedItem(option, addedWrapsContainer);
          updateSelectedOptions({ wraps: updatedSelectedArray });
             addButton.removeEventListener('click', handleAddOrRemove);
             calculateTotal();
       }
      }
       function handleAddOrRemove(){
             handleOptionSelection(option, element, type);
       }
  }
      function removeQuantityControls(element) {
          const quantityControls = element.querySelector('.quantity-controls');
           if (quantityControls) {
               quantityControls.remove();
          }
     }


 function updateAddedSweetItem(option, container) {
  if (!container) return;
  const quantityElement = document.querySelector(`.quantity-value[data-id="${option.id}"]`);
  const quantity = quantityElement ? parseInt(quantityElement.textContent) : 0;
  let existingItem = container.querySelector(`[data-id="${option.id}"]`);
  if (quantity > 0) {
      if (existingItem) {
          const itemQuantityElement = existingItem.querySelector('.item-quantity');
          if (itemQuantityElement) {
              itemQuantityElement.textContent = quantity;
          }
       } else {
          renderAddedItem(option, container, 'sweet', quantity);
      }
  } else {
       removeAddedItem(option, container);
   }
}



function renderQuantityControls(element, option) {
  if (!element || element.querySelector('.quantity-controls')) return;
  const quantityControls = createQuantityControls(option.id);
    element.appendChild(quantityControls);
  addQuantityControlEvents(quantityControls, option);
}

  function createQuantityControls(optionId) {
      const quantityControls = document.createElement('div');
      quantityControls.classList.add('quantity-controls');
      quantityControls.innerHTML = `
          <button class="quantity-btn minus" data-id="${optionId}">-</button>
          <span class="quantity-value" data-id="${optionId}">0</span>
          <button class="quantity-btn plus" data-id="${optionId}">+</button>
      `;
      return quantityControls;
  }

   function updateInitialQuantity(optionId, quantityControls) {
       if (!quantityControls) return;
      //  Do not update on load
      const quantityValueSpan = quantityControls.querySelector('.quantity-value');
      if(quantityValueSpan){
          quantityValueSpan.textContent = '0'
       }
}
  function addQuantityControlEvents(quantityControls, option) {
      const minusButton = quantityControls.querySelector('.quantity-btn.minus');
      const plusButton = quantityControls.querySelector('.quantity-btn.plus');
      const quantityValueSpan = quantityControls.querySelector('.quantity-value');

      const updateQuantity = (delta) => {
          let currentQuantity = parseInt(quantityValueSpan.textContent);
          const newQuantity = Math.max(0, currentQuantity + delta);
          quantityValueSpan.textContent = newQuantity;
          updateAddedSweetItem(option, addedSweetsContainer);
          calculateTotal();
      };

      minusButton.addEventListener('click', () => updateQuantity(-1));
      plusButton.addEventListener('click', () => updateQuantity(1));
  }



    function renderAddedItem(option, container, type, quantity = 1) {
      if (!container) return;
       const existingItem = container.querySelector(`[data-id="${option.id}"]`);
      if (existingItem && type !== 'sweet') {
         return;
        }
        const addedItemElement = document.createElement('div');
        addedItemElement.classList.add('added-item');
        addedItemElement.dataset.id = option.id;
        let quantityElement = '';
        if (type === 'sweet') {
            quantityElement = ` <span class="item-quantity"> ${quantity} </span> `;
        }
         addedItemElement.innerHTML = `
              <img src="${option.image}" alt="${option.name}">
              <p>${option.name}</p>
                ${quantityElement}
              <p class="item-price"> السعر: ${option.price} جنيه</p>
              <span class="remove-added-item"  data-id="${option.id}"></span>
           `;
         container.appendChild(addedItemElement);
        const removeButton = addedItemElement.querySelector('.remove-added-item');
        if(removeButton){
            removeButton.addEventListener('click', () => {
               handleRemoveAddedItem(option, type);
            });
       }
    }

   function handleRemoveAddedItem(option, type) {
       if (type === 'sweet') {
            toggleOption(option, selectedOptions.sweets, document.querySelector(`.sweets-item[data-id="${option.id}"]`), 'selected-sweet');
               updateAddedSweetItem(option, addedSweetsContainer);
         const sweetItemToRemove = addedSweetsContainer.querySelector(`[data-id="${option.id}"]`);
           if (sweetItemToRemove) {
            addedSweetsContainer.removeChild(sweetItemToRemove);
        }
       } else if (type === 'wrap') {
          toggleOption(option, selectedOptions.wraps,   document.querySelector(`.wrapping-item[data-id="${option.id}"]`), 'selected-wrap');
             removeAddedItem(option, addedWrapsContainer);

        } else if (type === 'pack' || type === 'box'){
           updateSelectedOptions({package : null})
            renderAddedPackage(null)
               const allOptions =  document.querySelectorAll('.box-item, .pack-item')
             allOptions.forEach(item => {
                   item.classList.remove('selected-package');
               });
        }
     calculateTotal();
   }

     function removeAddedItem(option, container) {
          if (!container) return;
            const itemToRemove = container.querySelector(`[data-id="${option.id}"]`);
          if (itemToRemove) {
              itemToRemove.remove();
         }
     }
  function renderAddedPackage(packageOption) {
     if (!addedPackagingContainer) return;
       addedPackagingContainer.innerHTML = `<h3> التعبئة </h3>`;
       if (packageOption) {
         const addedItemElement = document.createElement('div');
        addedItemElement.classList.add('added-item');
          addedItemElement.innerHTML = `
              <img src="${packageOption.image}" alt="${packageOption.name}">
              <p>${packageOption.name}</p>
              <p class="item-price"> السعر: ${packageOption.price} جنيه</p>
              <span class="remove-added-item" data-id="${packageOption.id}"></span>
             `;
        addedPackagingContainer.appendChild(addedItemElement);
         const removeButton = addedItemElement.querySelector('.remove-added-item');
         if(removeButton) {
              removeButton.addEventListener('click', () => {
                  handleRemoveAddedItem(packageOption, packageOption.type)
             });
        }
     }
  }

  function calculateTotal() {
        let totalPrice = 0;
       if (giftData && giftData.length > 0) {
            giftData.forEach((item) => {
               const price = parseFloat(item.price);
                const itemTotalPrice = price * parseInt(item.quantity);
               if(!isNaN(itemTotalPrice)){
                  totalPrice += itemTotalPrice;
              }
           });
       }
      let packagePrice = 0;
       if (selectedOptions.package) {
             const price = parseFloat(selectedOptions.package.price);
              if (!isNaN(price)){
                 packagePrice = price;
              }
        }
     let sweetPrice = 0;
        selectedOptions.sweets.forEach(sweet => {
             const quantityElement = document.querySelector(`.quantity-value[data-id="${sweet.id}"]`);
            const quantity = parseInt(quantityElement?.textContent) || 0 ;
            const price = parseFloat(sweet.price)
           if (!isNaN(price)){
               sweetPrice += price * quantity;
           }
       })
      let wrappingPrice = 0;
     selectedOptions.wraps.forEach(wrap => {
         const price = parseFloat(wrap.price)
            if (!isNaN(price)) {
               wrappingPrice += price;
           }
     })
       let total = totalPrice + packagePrice + sweetPrice + wrappingPrice;
       giftTotalElement.textContent = total.toFixed(2);
   }


 confirmButton.addEventListener('click',  () => {
     prepareAndSendOrder()
    });


  async function prepareAndSendOrder() {
      let packValue;
         if (selectedOptions.package) {
           packValue = selectedOptions.package.name
        }
       const sweetValues = selectedOptions.sweets.map(sweet => {
            const quantityElement = document.querySelector(`.quantity-value[data-id="${sweet.id}"]`);
           const quantity = parseInt(quantityElement?.textContent) || 0;
         return `${sweet.name} (${quantity})`;
        });
       const wrapValues = selectedOptions.wraps.map(wrap => wrap.name);
       const note = noteArea.value;

      let message = `️ 📜*طلب هدية جديد من متجرك*\n`;
       message += `========================================\n`;
       message += `🎁 *تفاصيل الهدية:*\n\n`;

      for (let i = 0; i < giftData.length; i++) {
           const item = giftData[i];
           message += ` *المنتج ${i + 1}:*\n`;
          message += `   *الاسم:* ${item.title}\n`;
         message += `   *الكمية:* ${item.quantity}\n`;
         message += `   *اللون:* ${item.color}\n`;
          message += `   *السعر:* ${item.price} \n`;
           message += `----------------------------------------\n`;
        }
       message += `\n*الاضافات:*\n\n`;
      message += `  *التعبئة :*  ${packValue ? packValue : 'لايوجد'}\n`
      message += ` *الحلويات :* ${sweetValues.length > 0 ? sweetValues.join(', ') : 'لايوجد'}\n`
        message += `  *التغليف :*  ${wrapValues.length > 0 ? wrapValues.join(', ') : 'لايوجد'} \n`
        message += ` *رسالة التهنئة :* ${note ? note : 'لايوجد'} \n\n`
       message += `*ملخص الطلب:*\n`
        message += `*المجموع الكلي:* ${giftTotalElement.textContent} جنيه\n`;
        message += `========================================\n\n`;
       message += ` *شكرًا لتسوقك معنا!* \n`;
        message += ` *للاستفسارات، تواصل معنا عبر واتساب على هذا الرقم.*\n`;
      const encodedMessage = encodeURIComponent(message);
       const whatsappLink = `https://wa.me/201026972523?text=${encodedMessage}`;
      window.open(whatsappLink, '_blank');
      localStorage.removeItem('giftData');
        localStorage.removeItem(STORAGE_KEY)
      setTimeout(() => {
         window.location.href = 'index.html';
      }, 2000);
  }

 function toggleOption(option, selectedArray, element , selectedClass) {
     if (!element) return;
        const index = selectedArray.findIndex(item => item.id === option.id);
            if (index > -1) {
               selectedArray.splice(index, 1);
                  element.classList.remove(selectedClass);
               const addButton = element.querySelector('.add-option-btn')
                if(addButton){
                     addButton.textContent = 'إضافة';
               }
                updateSelectedOptions({ [selectedArray === selectedOptions.sweets ? 'sweets' : 'wraps'] : selectedArray });
          }
     }

    function showLoading() {
      if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
        }
   }


  function hideLoading() {
      if(loadingOverlay) {
         loadingOverlay.style.display = 'none';
         }
    }
});

document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('.section');
  sections.forEach(section => {
      section.style.display = 'none';
  });
  const firstSection = document.getElementById('packaging');
      if (firstSection) {
          firstSection.style.display = 'block';
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
    window.showSection = showSection;
});