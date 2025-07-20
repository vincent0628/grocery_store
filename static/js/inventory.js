// 庫存管理模組
class InventoryManager {
    constructor(app) {
        this.app = app;
    }

    async fetchItems(search = '') {
        let url = '/items';
        if (search) url += '?search=' + encodeURIComponent(search);
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            this.app.items = data;
            this.renderItems();
        } catch (error) {
            console.error('Error fetching items:', error);
        }
    }

    renderItems() {
        const itemsDiv = document.getElementById('items');
        if (!itemsDiv) return;
        
        itemsDiv.innerHTML = '';
        this.app.items.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = 'item';
            
            // 使用原始索引（如果存在）或當前索引
            const realIdx = item.original_index !== undefined ? item.original_index : idx;
            
            if (this.app.editingIdx === realIdx) {
                div.innerHTML = `
                    <input type="text" id="editName${realIdx}" value="${item.name}">
                    <input type="number" id="editPrice${realIdx}" value="${item.price}" step="0.01">
                    <div class="item-actions">
                        <button onclick="inventoryManager.saveEdit(${realIdx})">儲存</button>
                        <button onclick="inventoryManager.cancelEdit()">取消</button>
                    </div>
                `;
            } else {
                div.innerHTML = `
                    <span>${item.name}</span>
                    <span class="price-cell">
                        <span class="price-dollar">$</span>
                        <span class="price-value">${item.price.toFixed(2)}</span>
                    </span>
                    <div class="item-actions">
                        <button onclick="inventoryManager.addToCart(${realIdx})">加入</button>
                        <button onclick="inventoryManager.editItem(${realIdx})">編輯</button>
                        <button onclick="inventoryManager.deleteItem(${realIdx})">刪除</button>
                    </div>
                `;
            }
            itemsDiv.appendChild(div);
        });
    }

    renderCart() {
        const cartDiv = document.getElementById('cart');
        if (!cartDiv) return;
        
        cartDiv.innerHTML = '';
        let total = 0;
        
        Object.keys(this.app.cart).forEach(idx => {
            const item = this.app.items[idx];
            const qty = this.app.cart[idx];
            total += item.price * qty;
            
            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <span>${item.name} x ${qty}</span>
                <span>$${(item.price * qty).toFixed(2)}</span>
                <button onclick="inventoryManager.removeFromCart(${idx})">移除</button>
            `;
            cartDiv.appendChild(div);
        });
        
        const totalElement = document.getElementById('total');
        if (totalElement) {
            totalElement.textContent = total.toFixed(2);
        }
    }

    addToCart(idx) {
        if (this.app.cart[idx]) {
            this.app.cart[idx]++;
        } else {
            this.app.cart[idx] = 1;
        }
        this.renderCart();
    }

    removeFromCart(idx) {
        if (this.app.cart[idx]) {
            this.app.cart[idx]--;
            if (this.app.cart[idx] <= 0) {
                delete this.app.cart[idx];
            }
        }
        this.renderCart();
    }

    async addItem(event) {
        event.preventDefault();
        const name = document.getElementById('addName').value.trim();
        const price = parseFloat(document.getElementById('addPrice').value);
        
        if (!name || isNaN(price)) return;
        
        try {
            await fetch('/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, price })
            });
            
            document.getElementById('addForm').reset();
            const searchInput = document.getElementById('searchInput');
            const searchValue = searchInput ? searchInput.value : '';
            this.fetchItems(searchValue);
        } catch (error) {
            console.error('Error adding item:', error);
        }
    }

    editItem(idx) {
        this.app.editingIdx = idx;
        this.renderItems();
    }

    async saveEdit(idx) {
        const name = document.getElementById('editName' + idx).value.trim();
        const price = parseFloat(document.getElementById('editPrice' + idx).value);
        
        if (!name || isNaN(price)) return;
        
        try {
            await fetch('/items/' + idx, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, price })
            });
            
            this.app.editingIdx = null;
            const searchInput = document.getElementById('searchInput');
            const searchValue = searchInput ? searchInput.value : '';
            this.fetchItems(searchValue);
        } catch (error) {
            console.error('Error saving edit:', error);
        }
    }

    cancelEdit() {
        this.app.editingIdx = null;
        this.renderItems();
    }

    async deleteItem(idx) {
        if (!confirm('確定要刪除這個商品嗎？')) return;
        
        try {
            await fetch('/items/' + idx, { method: 'DELETE' });
            const searchInput = document.getElementById('searchInput');
            const searchValue = searchInput ? searchInput.value : '';
            this.fetchItems(searchValue);
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    }

    searchItems() {
        const search = document.getElementById('searchInput').value;
        this.fetchItems(search);
    }
}

// 全域函數（為了向後相容HTML中的onclick事件）
function addItem(event) {
    inventoryManager.addItem(event);
}

function searchItems() {
    inventoryManager.searchItems();
}

// 庫存管理相關的全域函數
function editItem(idx) {
    inventoryManager.editItem(idx);
}

function saveEdit(idx) {
    inventoryManager.saveEdit(idx);
}

function cancelEdit() {
    inventoryManager.cancelEdit();
}

function deleteItem(idx) {
    inventoryManager.deleteItem(idx);
}

function addToCart(idx) {
    inventoryManager.addToCart(idx);
}

function removeFromCart(idx) {
    inventoryManager.removeFromCart(idx);
}
