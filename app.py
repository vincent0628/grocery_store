from flask import Flask, render_template, jsonify, request
import json
import os

app = Flask(__name__)

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
        items = [item for item in items if search in item['name'].lower()]
    return jsonify(items)

@app.route('/items', methods=['POST'])
def add_item():
    items = read_items()
    data = request.json
    items.append({'name': data['name'], 'price': float(data['price'])})
    write_items(items)
    return jsonify({'success': True})

@app.route('/items/<int:item_id>', methods=['PUT'])
def update_item(item_id):
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


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
