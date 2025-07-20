// 主應用程式模組
class GroceryStoreApp {
    constructor() {
        this.items = [];
        this.cart = {};
        this.editingIdx = null;
        this.standardPrices = [];
        this.customers = [];
        this.currentCustomer = '';
        this.customerPrices = [];
        this.editingStandardIdx = null;
        this.editingCustomerIdx = null;
        this.customerCart = {}; // 客戶報價頁面的購物車
        
        this.init();
    }
    
    init() {
        // 初始化應用程式
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // 設置事件監聽器
        console.log('GroceryStoreApp initialized');
    }
    
    // Tab management
    showTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        
        // Show selected tab
        document.getElementById(tabName + '-tab').classList.add('active');
        event.target.classList.add('active');
        
        // Load data for the selected tab
        if (tabName === 'standard-prices') {
            this.fetchStandardPrices();
        } else if (tabName === 'customer-prices') {
            this.fetchCustomers();
        } else if (tabName === 'inventory') {
            this.fetchItems();
        }
    }
}

// 創建全域應用程式實例
window.groceryApp = new GroceryStoreApp();

// 全域函數（為了向後兼容HTML中的onclick事件）
function showTab(tabName) {
    window.groceryApp.showTab(tabName);
}
