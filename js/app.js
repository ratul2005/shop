document.addEventListener('DOMContentLoaded', () => {

    const cartCountElement = document.querySelector('.cart-btn .cart-count');

    const updateCartCount = () => {
        const cart = JSON.parse(localStorage.getItem('ratulsShopCart')) || [];
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cartCountElement) {
            cartCountElement.textContent = totalItems;
        }
    };

    const themeToggleButton = document.getElementById('theme-toggle');
    if (themeToggleButton) {
        const darkIcon = document.getElementById('theme-toggle-dark-icon');
        const lightIcon = document.getElementById('theme-toggle-light-icon');
        
        const applyTheme = (isDark) => {
            if (isDark) {
                document.body.classList.add('dark-mode');
                darkIcon.style.display = 'none';
                lightIcon.style.display = 'block';
            } else {
                document.body.classList.remove('dark-mode');
                darkIcon.style.display = 'block';
                lightIcon.style.display = 'none';
            }
        };
        
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        let isDarkMode = savedTheme === 'dark' || (savedTheme === null && prefersDark);
        
        applyTheme(isDarkMode);

        themeToggleButton.addEventListener('click', () => {
            const isCurrentlyDark = document.body.classList.contains('dark-mode');
            applyTheme(!isCurrentlyDark);
            localStorage.setItem('theme', !isCurrentlyDark ? 'dark' : 'light');
        });
    }

    const menuToggle = document.querySelector('.mobile-menu-toggle');
    if (menuToggle) {
        const mobileNav = document.querySelector('.mobile-nav-menu');
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('open');
            mobileNav.classList.toggle('open');
            document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : 'auto';
        });
    }

    const header = document.querySelector('.main-header');
    if(header){
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
    
    const searchToggle = document.getElementById('search-toggle');
    const searchOverlay = document.getElementById('search-overlay');
    if (searchToggle) {
        const closeSearch = document.getElementById('close-search');
        const searchInput = document.getElementById('search-input');
        searchToggle.addEventListener('click', () => searchOverlay.classList.add('active'));
        closeSearch.addEventListener('click', () => searchOverlay.classList.remove('active'));
        searchOverlay.addEventListener('click', (e) => {
            if (e.target === searchOverlay) searchOverlay.classList.remove('active');
        });
    }

    const addToCartButton = document.querySelector('.add-to-cart-btn');
    if (addToCartButton) {
        addToCartButton.addEventListener('click', () => {
            const productDetailsSection = document.querySelector('.product-details-section');
            const id = document.querySelector('.product-code').textContent.replace('Product Code: ', '').trim();
            const title = document.querySelector('.product-title').textContent.trim();
            const priceText = document.querySelector('.current-price').textContent;
            const price = parseFloat(priceText.replace('Tk.', '').replace(',', '').trim());
            const image = document.querySelector('.main-image img').src;
            const quantity = parseInt(document.getElementById('quantity').value);

            let cart = JSON.parse(localStorage.getItem('ratulsShopCart')) || [];
            const existingItem = cart.find(item => item.id === id);

            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.push({ id, title, price, image, quantity });
            }

            localStorage.setItem('ratulsShopCart', JSON.stringify(cart));
            updateCartCount();

            const notification = document.getElementById('notification');
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        });
    }


    if (document.querySelector('.cart-section')) {
        const cartItemsContainer = document.getElementById('cart-items-container');
        const emptyCartMessage = document.getElementById('cart-empty-message');
        const summarySubtotal = document.getElementById('summary-subtotal');
        const summaryDelivery = document.getElementById('summary-delivery');
        const summaryDiscount = document.getElementById('summary-discount');
        const summaryTotal = document.getElementById('summary-total');
        const discountRow = document.getElementById('discount-row');
        const originalTotalPriceEl = document.getElementById('original-total-price');
        const couponInput = document.getElementById('coupon-input');
        const applyCouponBtn = document.getElementById('apply-coupon-btn');
        const couponFeedback = document.getElementById('coupon-feedback');
        const confirmOrderBtn = document.getElementById('confirm-order-btn');

        const coupons = {
            'EID20': { type: 'percent', value: 20 },
            'RATUL500': { type: 'fixed', value: 500 },
            'RATUL50': { type: 'percent', value: 50 },
            'FREESHIP': { type: 'delivery', value: 0 }
        };

        let appliedCoupon = null;

        const renderCart = () => {
            const cart = JSON.parse(localStorage.getItem('ratulsShopCart')) || [];
            cartItemsContainer.innerHTML = '';

            if (cart.length === 0) {
                emptyCartMessage.style.display = 'block';
                document.querySelector('.order-summary-column').style.display = 'none';
            } else {
                emptyCartMessage.style.display = 'none';
                document.querySelector('.order-summary-column').style.display = 'block';
                cart.forEach(item => {
                    const itemEl = document.createElement('div');
                    itemEl.className = 'cart-item';
                    itemEl.dataset.id = item.id;
                    itemEl.innerHTML = `
                        <img src="${item.image}" alt="${item.title}" class="cart-item-img">
                        <div class="cart-item-details">
                            <h3 class="cart-item-title">${item.title}</h3>
                            <p class="cart-item-price">Tk. ${item.price.toLocaleString()}</p>
                            <div class="cart-item-quantity">
                                <label>Qty:</label>
                                <input type="number" value="${item.quantity}" min="1" class="quantity-input">
                            </div>
                        </div>
                        <button class="cart-item-remove">&times;</button>
                    `;
                    cartItemsContainer.appendChild(itemEl);
                });
            }
            updateSummary();
            addCartEventListeners();
        };

        const updateSummary = () => {
            const cart = JSON.parse(localStorage.getItem('ratulsShopCart')) || [];
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            let deliveryCharge = 150;
            let discount = 0;

            if (appliedCoupon) {
                const coupon = coupons[appliedCoupon];
                if (coupon.type === 'percent') {
                    discount = subtotal * (coupon.value / 100);
                } else if (coupon.type === 'fixed') {
                    discount = coupon.value;
                } else if (coupon.type === 'delivery') {
                    deliveryCharge = 0;
                }
                discountRow.style.display = 'flex';
                summaryDiscount.textContent = `- Tk. ${discount.toLocaleString()}`;
            } else {
                discountRow.style.display = 'none';
            }
            
            const total = subtotal + deliveryCharge - discount;

            summarySubtotal.textContent = `Tk. ${subtotal.toLocaleString()}`;
            summaryDelivery.textContent = `Tk. ${deliveryCharge.toLocaleString()}`;
            
            if (discount > 0) {
                 originalTotalPriceEl.textContent = `Tk. ${(subtotal + deliveryCharge).toLocaleString()}`;
                 originalTotalPriceEl.style.display = 'inline';
            } else {
                 originalTotalPriceEl.style.display = 'none';
            }
            summaryTotal.textContent = `Tk. ${total.toLocaleString()}`;
        };

        const addCartEventListeners = () => {
            document.querySelectorAll('.cart-item-remove').forEach(button => {
                button.addEventListener('click', (e) => {
                    const itemId = e.target.closest('.cart-item').dataset.id;
                    let cart = JSON.parse(localStorage.getItem('ratulsShopCart')) || [];
                    cart = cart.filter(item => item.id !== itemId);
                    localStorage.setItem('ratulsShopCart', JSON.stringify(cart));
                    renderCart();
                    updateCartCount();
                });
            });

            document.querySelectorAll('.quantity-input').forEach(input => {
                input.addEventListener('change', (e) => {
                    const itemId = e.target.closest('.cart-item').dataset.id;
                    const newQuantity = parseInt(e.target.value);
                    let cart = JSON.parse(localStorage.getItem('ratulsShopCart')) || [];
                    const item = cart.find(i => i.id === itemId);
                    if (item && newQuantity > 0) {
                        item.quantity = newQuantity;
                    }
                    localStorage.setItem('ratulsShopCart', JSON.stringify(cart));
                    renderCart();
                    updateCartCount();
                });
            });
        };
        
        applyCouponBtn.addEventListener('click', () => {
            const code = couponInput.value.toUpperCase();
            if(coupons[code]){
                appliedCoupon = code;
                couponFeedback.textContent = `Coupon "${code}" applied successfully!`;
                couponFeedback.style.color = 'green';
                updateSummary();
            } else {
                appliedCoupon = null;
                couponFeedback.textContent = 'Invalid coupon code.';
                couponFeedback.style.color = 'red';
                updateSummary();
            }
        });

        confirmOrderBtn.addEventListener('click', () => {
            const name = document.getElementById('customer-name').value.trim();

            if (!name) {
                alert('Please fill in your name.');
                return;
            }

            const cart = JSON.parse(localStorage.getItem('ratulsShopCart')) || [];
            let message = "New Order from Ratul's Shop:\n\n";
            message += `*Customer Name:*\n ${name}\n\n`;
            message += "*Order Items:*\n";
            cart.forEach(item => {
                message += `- ${item.title} (Code: ${item.id})\n  Quantity: ${item.quantity}\n  Price: Tk. ${(item.price * item.quantity).toLocaleString()}\n`;
            });
            message += "\n*Summary:*\n";
            message += `Subtotal: ${summarySubtotal.textContent}\n`;
            if(appliedCoupon){
                 message += `Discount (${appliedCoupon}): ${summaryDiscount.textContent}\n`;
            }
            message += `Delivery: ${summaryDelivery.textContent}\n`;
            message += `*Total: ${summaryTotal.textContent}*`;
            
            const whatsappUrl = `https://wa.me/8801302869008?text=${encodeURIComponent(message)}`;
            
            localStorage.removeItem('ratulsShopCart');
            window.location.href = whatsappUrl;
        });

        renderCart();
    }

    const productGrid = document.getElementById('product-grid');
    if (productGrid) {
        const searchInput = document.getElementById('search-input');
        const products = Array.from(productGrid.querySelectorAll('.product-item'));
        const sortSelect = document.getElementById('sort-price');
        const filterSelect = document.getElementById('filter-discount');

        const applyFiltersAndSort = () => {
             products.forEach(p => p.classList.remove('hide'));
            
            const searchTerm = searchInput.value.toLowerCase();
            const filterValue = filterSelect.value;
            
            let visibleProducts = products.filter(product => {
                const productName = product.querySelector('h4').textContent.toLowerCase();
                const productCode = product.dataset.code.toLowerCase();
                const hasDiscount = product.dataset.discount === 'true';
                
                const matchesSearch = !searchTerm || productName.includes(searchTerm) || productCode.includes(searchTerm);
                const matchesFilter = filterValue === 'all' || (filterValue === 'discount' && hasDiscount);
                
                return matchesSearch && matchesFilter;
            });
            
             const visibleIds = visibleProducts.map(p => p.dataset.code);
             products.forEach(p => {
                p.classList.toggle('hide', !visibleIds.includes(p.dataset.code));
             });

            const sortValue = sortSelect.value;
            if (sortValue === 'price-asc') {
                visibleProducts.sort((a, b) => parseFloat(a.dataset.price) - parseFloat(b.dataset.price));
            } else if (sortValue === 'price-desc') {
                visibleProducts.sort((a, b) => parseFloat(b.dataset.price) - parseFloat(a.dataset.price));
            }
            
            visibleProducts.forEach(p => productGrid.appendChild(p));
        };

        if (searchInput) searchInput.addEventListener('input', applyFiltersAndSort);
        if (filterSelect) filterSelect.addEventListener('change', applyFiltersAndSort);
        if (sortSelect) sortSelect.addEventListener('change', applyFiltersAndSort);
    }
    
    updateCartCount();
});
