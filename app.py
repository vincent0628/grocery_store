from flask import Flask, render_template, jsonify, request
import json
import os
from backup_manager import BackupManager

app = Flask(__name__)

# 初始化備份管理器
backup_manager = BackupManager()

ITEMS_FILE = 'item_prices.json'
STANDARD_PRICES_FILE = 'standard_prices.json'
CUSTOMER_PRICES_FILE = 'customer_prices.json'


def read_items():
    if not os.path.exists(ITEMS_FILE):
        return []
    with open(ITEMS_FILE, encoding='utf-8') as f:
        return json.load(f)


def write_items(items):
    with open(ITEMS_FILE, 'w', encoding='utf-8') as f:
        json.dump(items, f, ensure_ascii=False, indent=2)


def read_standard_prices():
    if not os.path.exists(STANDARD_PRICES_FILE):
        return []
    with open(STANDARD_PRICES_FILE, encoding='utf-8') as f:
        return json.load(f)


def write_standard_prices(prices):
    with open(STANDARD_PRICES_FILE, 'w', encoding='utf-8') as f:
        json.dump(prices, f, ensure_ascii=False, indent=2)


def read_customer_prices():
    if not os.path.exists(CUSTOMER_PRICES_FILE):
        return {}
    with open(CUSTOMER_PRICES_FILE, encoding='utf-8') as f:
        return json.load(f)


def write_customer_prices(customer_prices):
    with open(CUSTOMER_PRICES_FILE, 'w', encoding='utf-8') as f:
        json.dump(customer_prices, f, ensure_ascii=False, indent=2)


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/items', methods=['GET'])
def get_items():
    search = request.args.get('search', '').lower()
    items = read_items()
    if search:
        # 為搜尋結果保持原始索引
        filtered_items = []
        for idx, item in enumerate(items):
            if search in item['name'].lower():
                item_with_index = item.copy()
                item_with_index['original_index'] = idx
                filtered_items.append(item_with_index)
        return jsonify(filtered_items)
    else:
        # 為所有商品添加原始索引
        items_with_index = []
        for idx, item in enumerate(items):
            item_with_index = item.copy()
            item_with_index['original_index'] = idx
            items_with_index.append(item_with_index)
        return jsonify(items_with_index)

@app.route('/items', methods=['POST'])
def add_item():
    # 在修改前建立自動備份
    backup_manager.create_backup('auto', '新增商品前自動備份')
    
    items = read_items()
    data = request.json
    items.append({'name': data['name'], 'price': float(data['price'])})
    write_items(items)
    return jsonify({'success': True})

@app.route('/items/<int:item_id>', methods=['PUT'])
def update_item(item_id):
    # 在修改前建立自動備份
    backup_manager.create_backup('auto', '編輯商品前自動備份')
    
    items = read_items()
    if 0 <= item_id < len(items):
        data = request.json
        items[item_id]['name'] = data['name']
        items[item_id]['price'] = float(data['price'])
        write_items(items)
        return jsonify({'success': True})
    return jsonify({'error': 'Item not found'}), 404

@app.route('/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    # 在刪除前建立自動備份
    backup_manager.create_backup('auto', '刪除商品前自動備份')
    
    items = read_items()
    if 0 <= item_id < len(items):
        items.pop(item_id)
        write_items(items)
        return jsonify({'success': True})
    return jsonify({'error': 'Item not found'}), 404


# Standard prices endpoints
@app.route('/standard-prices', methods=['GET'])
def get_standard_prices():
    search = request.args.get('search', '').lower()
    items = read_items()
    standard_prices = read_standard_prices()
    
    # Create a mapping of item names to standard prices
    price_map = {price['name']: price for price in standard_prices}
    
    # Merge items with their standard prices
    result = []
    for item in items:
        if search and search not in item['name'].lower():
            continue
        
        standard_price_info = price_map.get(item['name'], {})
        result.append({
            'name': item['name'],
            'cost_price': item['price'],
            'standard_price': standard_price_info.get('price', item['price']),
            'margin': standard_price_info.get('margin', 0)
        })
    
    return jsonify(result)


@app.route('/standard-prices', methods=['POST'])
def update_standard_prices():
    data = request.json
    standard_prices = read_standard_prices()
    
    # Update or add the standard price
    existing_index = None
    for i, price in enumerate(standard_prices):
        if price['name'] == data['name']:
            existing_index = i
            break
    
    price_data = {
        'name': data['name'],
        'price': float(data['price']),
        'margin': float(data.get('margin', 0))
    }
    
    if existing_index is not None:
        standard_prices[existing_index] = price_data
    else:
        standard_prices.append(price_data)
    
    write_standard_prices(standard_prices)
    return jsonify({'success': True})


# Customer prices endpoints
@app.route('/customers', methods=['GET'])
def get_customers():
    customer_prices = read_customer_prices()
    return jsonify(list(customer_prices.keys()))


@app.route('/customer-prices/<customer_name>', methods=['GET'])
def get_customer_prices(customer_name):
    search = request.args.get('search', '').lower()
    items = read_items()
    customer_prices = read_customer_prices()
    standard_prices = read_standard_prices()
    
    # Create mappings
    standard_price_map = {price['name']: price for price in standard_prices}
    customer_price_map = customer_prices.get(customer_name, {})
    
    result = []
    for item in items:
        if search and search not in item['name'].lower():
            continue
        
        standard_price_info = standard_price_map.get(item['name'], {})
        standard_price = standard_price_info.get('price', item['price'])
        customer_price = customer_price_map.get(item['name'], standard_price)
        
        result.append({
            'name': item['name'],
            'cost_price': item['price'],
            'standard_price': standard_price,
            'customer_price': customer_price
        })
    
    return jsonify(result)


@app.route('/customer-prices/<customer_name>', methods=['POST'])
def update_customer_prices(customer_name):
    # 在修改前建立自動備份
    backup_manager.create_backup('auto', f'更新客戶 {customer_name} 報價前自動備份')
    
    data = request.json
    customer_prices = read_customer_prices()
    
    if customer_name not in customer_prices:
        customer_prices[customer_name] = {}
    
    customer_prices[customer_name][data['name']] = float(data['price'])
    
    write_customer_prices(customer_prices)
    return jsonify({'success': True})


@app.route('/customers/<customer_name>', methods=['DELETE'])
def delete_customer(customer_name):
    customer_prices = read_customer_prices()
    if customer_name in customer_prices:
        del customer_prices[customer_name]
        write_customer_prices(customer_prices)
        return jsonify({'success': True})
    return jsonify({'error': 'Customer not found'}), 404


# Backup management endpoints
@app.route('/backups', methods=['GET'])
def list_backups():
    """列出所有備份"""
    backups = backup_manager.list_backups()
    return jsonify(backups)

@app.route('/backups', methods=['POST'])
def create_backup():
    """建立手動備份"""
    data = request.json or {}
    description = data.get('description', '手動備份')
    backup_id = backup_manager.create_backup('manual', description)
    return jsonify({'success': True, 'backup_id': backup_id})

@app.route('/backups/<backup_id>', methods=['GET'])
def get_backup_info(backup_id):
    """獲取備份詳細資訊"""
    backup_info = backup_manager.get_backup_info(backup_id)
    if backup_info:
        return jsonify(backup_info)
    return jsonify({'error': 'Backup not found'}), 404

@app.route('/backups/<backup_id>/restore', methods=['POST'])
def restore_backup(backup_id):
    """還原備份"""
    success = backup_manager.restore_backup(backup_id)
    if success:
        return jsonify({'success': True, 'message': '備份還原成功'})
    return jsonify({'error': '備份還原失敗'}), 400

@app.route('/backups/<backup_id>', methods=['DELETE'])
def delete_backup(backup_id):
    """刪除備份"""
    success = backup_manager.delete_backup(backup_id)
    if success:
        return jsonify({'success': True, 'message': '備份刪除成功'})
    return jsonify({'error': '備份刪除失敗'}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
