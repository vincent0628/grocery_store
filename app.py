from flask import Flask, render_template, jsonify, request
import json
import os

app = Flask(__name__)

ITEMS_FILE = 'item_prices.json'

def read_items():
    if not os.path.exists(ITEMS_FILE):
        return []
    with open(ITEMS_FILE, encoding='utf-8') as f:
        return json.load(f)

def write_items(items):
    with open(ITEMS_FILE, 'w', encoding='utf-8') as f:
        json.dump(items, f, ensure_ascii=False, indent=2)

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
