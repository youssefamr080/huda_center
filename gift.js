document.addEventListener('DOMContentLoaded', () => {

    // Elements
    const giftProductsContainer = document.getElementById('gift-products');
    const packsOptionsContainer = document.getElementById('packs-options');
    const boxesOptionsContainer = document.getElementById('boxes-options');
    const sweetsOptionsContainer = document.getElementById('sweets-options');
    const wrappingOptionsContainer = document.getElementById('wrapping-options');
    const giftTotalElement = document.getElementById('giftTotal');
    const noteArea = document.getElementById('note-area');
    const confirmButton = document.getElementById('confirmButton');

    // Container for Added Items
    const addedItemsContainer = document.getElementById('added-items');
    const addedSweetsContainer = document.createElement('div');
    const addedPackagingContainer = document.createElement('div');
    const addedWrapsContainer = document.createElement('div');

    // Append the containers to the main container
    addedItemsContainer.appendChild(addedSweetsContainer);
    addedItemsContainer.appendChild(addedPackagingContainer);
    addedItemsContainer.appendChild(addedWrapsContainer);

    addedSweetsContainer.classList.add('added-sweets-container');
    addedPackagingContainer.classList.add('added-packaging-container');
    addedWrapsContainer.classList.add('added-wraps-container');

    addedSweetsContainer.innerHTML = `<h3> الحلويات </h3>`;
    addedPackagingContainer.innerHTML = `<h3> التعبئة </h3>`;
    addedWrapsContainer.innerHTML = `<h3> التغليف </h3>`;

    // Selected Options
    let selectedPackage = null;
    let selectedSweets = [];
    let selectedWraps = [];

    // Load Data from JSON and LocalStorage
    loadData();

    async function loadData() {
        const giftDataString = localStorage.getItem('giftData');
        let giftData = giftDataString ? JSON.parse(giftDataString) : [];

        let totalPrice = 0;
        if (giftData.length === 0) {
            giftProductsContainer.innerHTML = '<p class="empty-gift-message"> لا يوجد منتجات بالهدية. </p>';
            return;
        }


        // Display Gift Products
        renderGiftProducts(giftData);


        // get gift Data
        const response = await fetch('gift.json');
        const giftJSON = await response.json();

        // Render Packaging Options
        renderPackagingOptions(giftJSON.packaging, packsOptionsContainer, boxesOptionsContainer);

        //Render Sweets Options
        renderOptions(giftJSON.sweets, sweetsOptionsContainer, 'sweet');

        // Render Wrapping Options
        renderOptions(giftJSON.decorations, wrappingOptionsContainer, 'wrap');


        // Initialize Swiper
        initSwiper();


        // Calculate Total and Display
        calculateTotal();


        window.removeFromGiftPage = (productId) => {
            giftData = giftData.filter(item => item.productId !== productId);
            localStorage.setItem('giftData', JSON.stringify(giftData));
            renderGiftProducts(giftData);
            calculateTotal();
            location.reload()
        };
    }

    function initSwiper() {

        const packsSwiper = new Swiper('.packs-swiper', {
            slidesPerView: 'auto',
            spaceBetween: 10,
            navigation: {
                nextEl: '.packs-swiper .swiper-button-next',
                prevEl: '.packs-swiper .swiper-button-prev',
            },
        });


        const boxesSwiper = new Swiper('.boxes-swiper', {
            slidesPerView: 'auto',
            spaceBetween: 10,
            navigation: {
                nextEl: '.boxes-swiper .swiper-button-next',
                prevEl: '.boxes-swiper .swiper-button-prev',
            },
        });



        const sweetsSwiper = new Swiper('.sweets-swiper', {
            slidesPerView: 'auto',
            spaceBetween: 10,
            navigation: {
                nextEl: '.sweets-swiper .swiper-button-next',
                prevEl: '.sweets-swiper .swiper-button-prev',
            },

        });


        const wrappingSwiper = new Swiper('.wrapping-swiper', {
            slidesPerView: 'auto',
            spaceBetween: 10,
            navigation: {
                nextEl: '.wrapping-swiper .swiper-button-next',
                prevEl: '.wrapping-swiper .swiper-button-prev',
            },
        });
    }


    function renderGiftProducts(giftData) {
        giftProductsContainer.innerHTML = '';
        let totalPrice = 0;
        if (giftData.length === 0) {
            giftProductsContainer.innerHTML = '<p class="empty-gift-message"> لا يوجد منتجات بالهدية. </p>';
            return;
        }
        giftData.forEach((item) => {
            const price = parseFloat(item.price);
            const itemTotalPrice = price * parseInt(item.quantity);
            totalPrice += itemTotalPrice;
            const giftItemElement = document.createElement('div');
            giftItemElement.classList.add('gift-item');
            giftItemElement.innerHTML = `
                      <img src="${item.image}" alt="${item.title}">
                       <h4>${item.title}</h4>
                         <p> السعر : ${item.price}</p>
                         <p class="quantity">الكمية: ${item.quantity}</p>
                          <button class="remove-item-btn" onclick="removeFromGiftPage('${item.productId}')">ازالة</button>
                        <p class="item-total-price">المجموع: ${itemTotalPrice.toFixed(2)}</p>

                     `;
            giftProductsContainer.appendChild(giftItemElement);
        });
    }


    function renderPackagingOptions(packagingData, packsContainer, boxesContainer) {
        const { boxes, packs } = packagingData;
        packsContainer.innerHTML = '';
        boxesContainer.innerHTML = '';

        renderOptions(packs, packsContainer, 'pack');
        renderOptions(boxes, boxesContainer, 'box');


        packsContainer.addEventListener('click', (event) => {
            const selectedOption = event.target.closest('.pack-item');
            if (!selectedOption) return;
            const allOptions = packsContainer.querySelectorAll('.pack-item')

            allOptions.forEach(item => {
                item.classList.remove('selected-package');
            });

            selectedOption.classList.add('selected-package');
            selectedPackage = selectedOption;

            renderAddedPackage();
            calculateTotal();
        });


        boxesContainer.addEventListener('click', (event) => {
            const selectedOption = event.target.closest('.box-item');
            if (!selectedOption) return;
            const allOptions = boxesContainer.querySelectorAll('.box-item')

            allOptions.forEach(item => {
                item.classList.remove('selected-package');
            });

            selectedOption.classList.add('selected-package');
            selectedPackage = selectedOption;

            renderAddedPackage();
            calculateTotal();
        });

    }


    function renderOptions(options, container, type) {
        container.innerHTML = '';
        options.forEach(option => {
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
            } else if (type === 'box') {
                optionElement.classList.add('packaging-item');
            } else if (type === 'pack') {
                optionElement.classList.add('packaging-item');
            }


            container.appendChild(optionElement);

            const addButton = optionElement.querySelector('.add-option-btn');
            addButton.addEventListener('click', () => {
                if (type === 'sweet') {
                    toggleOption(option, selectedSweets, optionElement, 'selected-sweet');
                    updateAddedSweetItem(option, addedSweetsContainer);

                } else if (type === 'wrap') {
                    toggleOption(option, selectedWraps, optionElement, 'selected-wrap');
                     renderAddedItem(option, addedWrapsContainer, 'wrap');
                }
                calculateTotal();
            });


        });
    }

    function updateAddedSweetItem(option, container) {
      const quantityElement = document.querySelector(`.quantity-value[data-id="${option.id}"]`);
       const quantity = quantityElement ? parseInt(quantityElement.textContent) : 0;
        let existingItem = container.querySelector(`[data-id="${option.id}"]`);

        if (quantity > 0) {
            if (existingItem) {
                existingItem.querySelector('.item-quantity').textContent = quantity;
            } else {
                renderAddedItem(option, container, 'sweet', quantity);
            }
        } else {
             removeAddedItem(option, container);
        }

    }

    function toggleOption(option, selectedArray, element, selectedClass) {
        const isSelected = selectedArray.some(item => item.id === option.id);
        const addButton = element.querySelector('.add-option-btn');

        if (isSelected) {
            selectedArray = selectedArray.filter(item => item.id !== option.id);
            element.classList.remove(selectedClass);
            addButton.textContent = 'إضافة';
            removeAddedItem(option, selectedArray === selectedSweets ? addedSweetsContainer : addedWrapsContainer);

             if (selectedArray === selectedSweets) {
                    const addedItem  =   addedSweetsContainer.querySelector(`[data-id="${option.id}"]`)
                if (addedItem)  {
                      const quantityElement = document.querySelector(`.quantity-value[data-id="${option.id}"]`);
                    quantityElement.textContent = 0;
                   }
                }

           const index = selectedArray.findIndex(item => item.id === option.id);
            if (index > -1) {
                selectedArray.splice(index, 1);
            }


        } else {
            selectedArray.push(option);
            element.classList.add(selectedClass);
            addButton.textContent = 'إزالة';
             if (selectedArray === selectedSweets) {
              renderQuantityControls(element, option);
           }
        }


        if (selectedArray === selectedSweets) {
            selectedSweets = selectedArray;
        } else if (selectedArray === selectedWraps) {
            selectedWraps = selectedArray;
        }
    }


    function renderQuantityControls(element, option) {
        const quantityControls = document.createElement('div');
        quantityControls.classList.add('quantity-controls');
        quantityControls.innerHTML = `
        <button class="quantity-btn minus" data-id="${option.id}">-</button>
        <span class="quantity-value" data-id="${option.id}">0</span>
        <button class="quantity-btn plus" data-id="${option.id}">+</button>
    `;
        element.appendChild(quantityControls);


        const minusButton = quantityControls.querySelector('.quantity-btn.minus');
        const plusButton = quantityControls.querySelector('.quantity-btn.plus');
        const quantityValueSpan = quantityControls.querySelector('.quantity-value');


        minusButton.addEventListener('click', () => {
            let currentQuantity = parseInt(quantityValueSpan.textContent);
            if (currentQuantity > 0) {
                quantityValueSpan.textContent = currentQuantity - 1;
                updateAddedSweetItem(option, addedSweetsContainer)
                  calculateTotal();
            }
        });
        plusButton.addEventListener('click', () => {
            let currentQuantity = parseInt(quantityValueSpan.textContent);
            quantityValueSpan.textContent = currentQuantity + 1;
            updateAddedSweetItem(option, addedSweetsContainer)
             calculateTotal();
        });
    }


   function renderAddedItem(option, container, type, quantity = 1) {
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
         removeButton.addEventListener('click', () => {
         if (type === 'sweet') {
                toggleOption(option, selectedSweets,   document.querySelector(`.sweets-item[data-id="${option.id}"]`) , 'selected-sweet');
                 updateAddedSweetItem(option, addedSweetsContainer)
           }else if (type === 'wrap') {
                toggleOption(option, selectedWraps,   document.querySelector(`.wrapping-item[data-id="${option.id}"]`), 'selected-wrap');
              removeAddedItem(option, addedWrapsContainer);
          }  else  if (type === 'pack' ||  type === 'box'){
                selectedPackage = null;
               renderAddedPackage();
             const allOptions =  document.querySelectorAll('.box-item, .pack-item')

              allOptions.forEach(item => {
                  item.classList.remove('selected-package');
              });
         }

          calculateTotal();
      });


    }

    function removeAddedItem(option, container) {
       const itemToRemove = container.querySelector(`[data-id="${option.id}"]`);
        if (itemToRemove) {
             container.removeChild(itemToRemove);
        }
    }



    function renderAddedPackage() {
        addedPackagingContainer.innerHTML = `<h3> التعبئة </h3>`;
        if (selectedPackage) {
            const addedItemElement = document.createElement('div');
            addedItemElement.classList.add('added-item');
            addedItemElement.innerHTML = `
             <img src="${selectedPackage.querySelector('img').src}" alt="${selectedPackage.querySelector('p').textContent}">
                <p>${selectedPackage.querySelector('p').textContent}</p>
                <p class="item-price"> السعر: ${selectedPackage.dataset.price} جنيه</p>
                 <span class="remove-added-item" data-id="${selectedPackage.dataset.id}"></span>

            `;
            addedPackagingContainer.appendChild(addedItemElement);

          const removeButton = addedItemElement.querySelector('.remove-added-item');
             removeButton.addEventListener('click', () => {
               selectedPackage = null;
              renderAddedPackage();
             const allOptions =  document.querySelectorAll('.box-item, .pack-item')

            allOptions.forEach(item => {
                  item.classList.remove('selected-package');
              });
                  calculateTotal();
        });
        }
    }


    function calculateTotal() {
        const giftDataString = localStorage.getItem('giftData');
        let giftData = giftDataString ? JSON.parse(giftDataString) : [];
        let totalPrice = 0;
        if (giftData.length > 0) {
            giftData.forEach((item) => {
                const price = parseFloat(item.price);
                const itemTotalPrice = price * parseInt(item.quantity);
                totalPrice += itemTotalPrice;
            });
        }

        let packagePrice = 0;
        if (selectedPackage) {
            packagePrice = parseFloat(selectedPackage.dataset.price);
        }


        let sweetPrice = 0;
          selectedSweets.forEach(sweet => {
            const quantityElement = document.querySelector(`.quantity-value[data-id="${sweet.id}"]`);
             const quantity = parseInt(quantityElement.textContent)
             sweetPrice += parseFloat(sweet.price) * quantity
         })

        let wrappingPrice = 0;
        selectedWraps.forEach(wrap => {
            wrappingPrice += parseFloat(wrap.price);
        })


        let total = totalPrice + packagePrice + sweetPrice + wrappingPrice;
        giftTotalElement.textContent = total.toFixed(2);
    }

    confirmButton.addEventListener('click', async function () {

        let packValue;
         if (selectedPackage) {
            packValue = selectedPackage.querySelector('p').textContent
        }


        const sweetValues = selectedSweets.map(sweet => {
            const quantityElement = document.querySelector(`.quantity-value[data-id="${sweet.id}"]`);
            const quantity = parseInt(quantityElement.textContent);
             return `${sweet.name} (${quantity})`;

        });

       const wrapValues = selectedWraps.map(wrap => wrap.name)


        const note = noteArea.value;


        let message = `️ 📜*طلب هدية جديد من متجرك*\n`;
        message += `========================================\n`;
        message += `🎁 *تفاصيل الهدية:*\n\n`;


        const giftDataString = localStorage.getItem('giftData');
        const giftData = giftDataString ? JSON.parse(giftDataString) : [];


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
         setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);

    });
});