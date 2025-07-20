// 客戶報價管理模組
class CustomerPricesManager {
    constructor(app) {
        this.app = app;
    }

    async fetchCustomers() {
        try {
            const response = await fetch('/customers');
            const data = await response.json();
            this.app.customers = data;
            this.renderCustomerSelect();
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    }

    renderCustomerSelect() {
        const select = document.getElementById('customerSelect');
        if (!select) return;
        
        select.innerHTML = '<option value="">請選擇客戶</option>';
        this.app.customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer;
            option.textContent = customer;
            if (customer === this.app.currentCustomer) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }

    showAddCustomerForm() {
        const form = document.getElementById('add-customer-form');
        if (form) form.style.display = 'block';
    }

    hideAddCustomerForm() {
        const form = document.getElementById('add-customer-form');
        const input = document.getElementById('newCustomerName');
        if (form) form.style.display = 'none';
        if (input) input.value = '';
    }

    async addCustomer() {
        const nameInput = document.getElementById('newCustomerName');
        if (!nameInput) return;
        
        const name = nameInput.value.trim();
        if (!name) return;
        
        try {
            // Add customer by creating an empty price entry
            await fetch(`/customer-prices/${encodeURIComponent(name)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'dummy', price: 0 })
            });
            
            this.hideAddCustomerForm();
            this.fetchCustomers();
            this.app.currentCustomer = name;
            document.getElementById('customerSelect').value = name;
            this.loadCustomerPrices();
        } catch (error) {
            console.error('Error adding customer:', error);
        }
    }

    async deleteCustomer() {
        const customerName = this.app.currentCustomer;
        if (!customerName) {
            alert('請先選擇要刪除的客戶');
            return;
        }
        
        if (!confirm(`確定要刪除客戶 "${customerName}" 嗎？這將會刪除該客戶的所有報價資料。`)) {
            return;
        }
        
        try {
            const response = await fetch(`/customers/${encodeURIComponent(customerName)}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                alert('客戶刪除成功！');
                this.app.currentCustomer = '';
                this.app.customerCart = {};
                document.getElementById('customerSelect').value = '';
                document.getElementById('customer-prices').innerHTML = '';
                this.renderCustomerCart();
                this.fetchCustomers();
            } else {
                alert('刪除客戶失敗！');
            }
        } catch (error) {
            console.error('Error deleting customer:', error);
            alert('刪除客戶時發生錯誤！');
        }
    }

    loadCustomerPrices() {
        const newCustomer = document.getElementById('customerSelect').value;
        if (newCustomer !== this.app.currentCustomer) {
            this.app.customerCart = {}; // 清空購物車
            this.renderCustomerCart();
        }
        this.app.currentCustomer = newCustomer;
        if (!this.app.currentCustomer) {
            document.getElementById('customer-prices').innerHTML = '';
            return;
        }
        this.fetchCustomerPrices();
    }

    async fetchCustomerPrices(search = '') {
        if (!this.app.currentCustomer) return;
        
        let url = `/customer-prices/${encodeURIComponent(this.app.currentCustomer)}`;
        if (search) url += '?search=' + encodeURIComponent(search);
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            this.app.customerPrices = data;
            this.renderCustomerPrices();
        } catch (error) {
            console.error('Error fetching customer prices:', error);
        }
    }

    renderCustomerPrices() {
        const pricesDiv = document.getElementById('customer-prices');
        if (!pricesDiv) return;
        
        pricesDiv.innerHTML = '';
        this.app.customerPrices.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = 'item';
            
            if (this.app.editingCustomerIdx === idx) {
                div.innerHTML = `
                    <span>${item.name}</span>
                    <input type="number" id="editCustomerPrice${idx}" value="${item.customer_price}" step="0.01">
                    <div class="item-actions">
                        <button onclick="customerPricesManager.saveCustomerEdit(${idx})">儲存</button>
                        <button onclick="customerPricesManager.cancelCustomerEdit()">取消</button>
                    </div>
                `;
            } else {
                div.innerHTML = `
                    <span>${item.name}</span>
                    <span class="price-info">
                        <small>標準: $${item.standard_price.toFixed(2)}</small><br>
                        <span class="price-cell">
                            <span class="price-dollar">$</span>
                            <span class="price-value">${item.customer_price.toFixed(2)}</span>
                        </span>
                    </span>
                    <div class="item-actions">
                        <button onclick="customerPricesManager.addToCustomerCart(${idx})">加入購物車</button>
                        <button onclick="customerPricesManager.editCustomerPrice(${idx})">編輯</button>
                    </div>
                `;
            }
            pricesDiv.appendChild(div);
        });
    }

    editCustomerPrice(idx) {
        this.app.editingCustomerIdx = idx;
        this.renderCustomerPrices();
    }

    async saveCustomerEdit(idx) {
        const price = parseFloat(document.getElementById('editCustomerPrice' + idx).value);
        if (isNaN(price)) return;
        
        const item = this.app.customerPrices[idx];
        
        try {
            await fetch(`/customer-prices/${encodeURIComponent(this.app.currentCustomer)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: item.name, price: price })
            });
            
            this.app.editingCustomerIdx = null;
            this.fetchCustomerPrices(document.getElementById('customerSearchInput').value);
        } catch (error) {
            console.error('Error saving customer price:', error);
        }
    }

    cancelCustomerEdit() {
        this.app.editingCustomerIdx = null;
        this.renderCustomerPrices();
    }

    searchCustomerPrices() {
        const search = document.getElementById('customerSearchInput').value;
        this.fetchCustomerPrices(search);
    }

    // Customer Cart Functions
    addToCustomerCart(idx) {
        if (!this.app.currentCustomer) {
            alert('請先選擇客戶');
            return;
        }
        
        const item = this.app.customerPrices[idx];
        if (this.app.customerCart[idx]) {
            this.app.customerCart[idx]++;
        } else {
            this.app.customerCart[idx] = 1;
        }
        this.renderCustomerCart();
    }

    removeFromCustomerCart(idx) {
        if (this.app.customerCart[idx]) {
            this.app.customerCart[idx]--;
            if (this.app.customerCart[idx] <= 0) {
                delete this.app.customerCart[idx];
            }
        }
        this.renderCustomerCart();
    }

    renderCustomerCart() {
        const cartDiv = document.getElementById('customer-cart');
        if (!cartDiv) return;
        
        cartDiv.innerHTML = '';
        let total = 0;
        
        Object.keys(this.app.customerCart).forEach(idx => {
            const item = this.app.customerPrices[idx];
            if (!item) return; // 防止商品不存在
            
            const qty = this.app.customerCart[idx];
            const itemTotal = item.customer_price * qty;
            total += itemTotal;
            
            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <span>${item.name} x ${qty}</span>
                <span>$${itemTotal.toFixed(2)}</span>
                <button onclick="customerPricesManager.removeFromCustomerCart(${idx})">移除</button>
            `;
            cartDiv.appendChild(div);
        });
        
        const totalElement = document.getElementById('customer-total');
        if (totalElement) {
            totalElement.textContent = total.toFixed(2);
        }
    }

    clearCustomerCart() {
        if (Object.keys(this.app.customerCart).length === 0) return;
        
        if (confirm('確定要清空購物車嗎？')) {
            this.app.customerCart = {};
            this.renderCustomerCart();
        }
    }

    printCustomerQuote() {
        if (!this.app.currentCustomer) {
            alert('請先選擇客戶');
            return;
        }
        
        if (Object.keys(this.app.customerCart).length === 0) {
            alert('購物車是空的，無法列印報價單');
            return;
        }
        
        let quoteContent = `客戶：${this.app.currentCustomer}\n`;
        quoteContent += `報價日期：${new Date().toLocaleDateString('zh-TW')}\n`;
        quoteContent += '\n商品明細：\n';
        quoteContent += '-'.repeat(40) + '\n';
        
        let total = 0;
        Object.keys(this.app.customerCart).forEach(idx => {
            const item = this.app.customerPrices[idx];
            if (!item) return;
            
            const qty = this.app.customerCart[idx];
            const itemTotal = item.customer_price * qty;
            total += itemTotal;
            
            quoteContent += `${item.name}\n`;
            quoteContent += `  單價：$${item.customer_price.toFixed(2)} x ${qty} = $${itemTotal.toFixed(2)}\n`;
        });
        
        quoteContent += '-'.repeat(40) + '\n';
        quoteContent += `總計：$${total.toFixed(2)}\n`;
        
        // 開啟新視窗來列印
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>報價單 - ${this.app.currentCustomer}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                    h1 { color: #333; }
                    .quote-header { margin-bottom: 20px; }
                    .quote-items { margin: 20px 0; }
                    .quote-total { font-weight: bold; font-size: 18px; margin-top: 20px; }
                    pre { white-space: pre-wrap; }
                </style>
            </head>
            <body>
                <h1>雜貨店 - 客戶報價單</h1>
                <pre>${quoteContent}</pre>
                <script>window.print();</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }
}

// 全域函數（為了向後兼容HTML中的onclick事件）
function showAddCustomerForm() {
    customerPricesManager.showAddCustomerForm();
}

function hideAddCustomerForm() {
    customerPricesManager.hideAddCustomerForm();
}

function addCustomer() {
    customerPricesManager.addCustomer();
}

function loadCustomerPrices() {
    customerPricesManager.loadCustomerPrices();
}

function searchCustomerPrices() {
    customerPricesManager.searchCustomerPrices();
}

function clearCustomerCart() {
    customerPricesManager.clearCustomerCart();
}

function printCustomerQuote() {
    customerPricesManager.printCustomerQuote();
}

function deleteCustomer() {
    customerPricesManager.deleteCustomer();
}
