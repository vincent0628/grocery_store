// 主初始化文件
document.addEventListener('DOMContentLoaded', function() {
    // 確保groceryApp已經創建
    if (!window.groceryApp) {
        console.error('GroceryApp not found!');
        return;
    }
    
    // 初始化所有管理器
    window.inventoryManager = window.groceryApp.inventoryManager;
    window.standardPricesManager = window.groceryApp.standardPricesManager;
    window.customerPricesManager = window.groceryApp.customerPricesManager;
    window.backupManager = window.groceryApp.backupManager;
    
    // 設置表單事件監聽器
    const addForm = document.getElementById('addForm');
    if (addForm) {
        addForm.addEventListener('submit', function(event) {
            event.preventDefault();
            inventoryManager.addItem(event);
        });
    }
    
    // 設置搜尋輸入框事件監聽器
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            inventoryManager.searchItems();
        });
    }
    
    const standardSearchInput = document.getElementById('standardSearchInput');
    if (standardSearchInput) {
        standardSearchInput.addEventListener('input', function() {
            standardPricesManager.searchStandardPrices();
        });
    }
    
    const customerSearchInput = document.getElementById('customerSearchInput');
    if (customerSearchInput) {
        customerSearchInput.addEventListener('input', function() {
            customerPricesManager.searchCustomerPrices();
        });
    }
    
    // 設置客戶選擇器事件監聽器
    const customerSelect = document.getElementById('customerSelect');
    if (customerSelect) {
        customerSelect.addEventListener('change', function() {
            customerPricesManager.loadCustomerPrices();
        });
    }
    
    // 初始載入所有數據
    inventoryManager.fetchItems();
    standardPricesManager.fetchStandardPrices();
    customerPricesManager.fetchCustomers();
    
    console.log('雜貨店應用程式已初始化完成');
});
