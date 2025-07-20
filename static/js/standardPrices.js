// 標準售價管理模組
class StandardPricesManager {
    constructor(app) {
        this.app = app;
    }

    async fetchStandardPrices(search = '') {
        let url = '/standard-prices';
        if (search) url += '?search=' + encodeURIComponent(search);
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            this.app.standardPrices = data;
            this.renderStandardPrices();
        } catch (error) {
            console.error('Error fetching standard prices:', error);
        }
    }

    renderStandardPrices() {
        const pricesDiv = document.getElementById('standard-prices');
        if (!pricesDiv) return;
        
        pricesDiv.innerHTML = '';
        this.app.standardPrices.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = 'item';
            
            if (this.app.editingStandardIdx === idx) {
                div.innerHTML = `
                    <span>${item.name}</span>
                    <input type="number" id="editStandardPrice${idx}" value="${item.standard_price}" step="0.01">
                    <div class="item-actions">
                        <button onclick="standardPricesManager.saveStandardEdit(${idx})">儲存</button>
                        <button onclick="standardPricesManager.cancelStandardEdit()">取消</button>
                    </div>
                `;
            } else {
                div.innerHTML = `
                    <span>${item.name}</span>
                    <span class="price-info">
                        <small>成本: $${item.cost_price.toFixed(2)}</small><br>
                        <span class="price-cell">
                            <span class="price-dollar">$</span>
                            <span class="price-value">${item.standard_price.toFixed(2)}</span>
                        </span>
                    </span>
                    <div class="item-actions">
                        <button onclick="standardPricesManager.editStandardPrice(${idx})">編輯</button>
                    </div>
                `;
            }
            pricesDiv.appendChild(div);
        });
    }

    editStandardPrice(idx) {
        this.app.editingStandardIdx = idx;
        this.renderStandardPrices();
    }

    async saveStandardEdit(idx) {
        const price = parseFloat(document.getElementById('editStandardPrice' + idx).value);
        if (isNaN(price)) return;
        
        const item = this.app.standardPrices[idx];
        
        try {
            await fetch('/standard-prices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: item.name, price: price })
            });
            
            this.app.editingStandardIdx = null;
            this.fetchStandardPrices(document.getElementById('standardSearchInput').value);
        } catch (error) {
            console.error('Error saving standard price:', error);
        }
    }

    cancelStandardEdit() {
        this.app.editingStandardIdx = null;
        this.renderStandardPrices();
    }

    searchStandardPrices() {
        const search = document.getElementById('standardSearchInput').value;
        this.fetchStandardPrices(search);
    }
}

// 全域函數（為了向後兼容HTML中的onclick事件）
function searchStandardPrices() {
    standardPricesManager.searchStandardPrices();
}
