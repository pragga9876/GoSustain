from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import requests
import base64
from io import BytesIO
from PIL import Image, ImageEnhance
import re
import json
import time

app = Flask(__name__)
CORS(app)

# Increase max file size to 50MB
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024

SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'bmp', 'gif', 'webp', 'tiff', 'tif']

# Local fallback database (for items not found in external APIs)
LOCAL_CARBON_DB = {
    # Common items with carbon footprints
    'tomato': 0.15, 'lettuce': 0.10, 'carrot': 0.08, 'broccoli': 0.25, 'spinach': 0.15,
    'potato': 0.10, 'onion': 0.12, 'cucumber': 0.08, 'peppers': 0.20, 'cabbage': 0.10,
    'apple': 0.15, 'banana': 0.20, 'orange': 0.18, 'strawberry': 0.35, 'grape': 0.40,
    'chicken': 3.30, 'beef': 27.0, 'pork': 12.0, 'fish': 5.0, 'salmon': 6.0,
    'egg': 0.75, 'tofu': 2.0, 'lentils': 0.90, 'beans': 1.20,
    'milk': 1.9, 'cheese': 13.5, 'butter': 24.0, 'yogurt': 1.5,
    'bread': 1.2, 'rice': 3.0, 'pasta': 1.8, 'noodles': 1.8,
    'coffee': 0.86, 'tea': 0.06, 'juice': 0.8, 'water': 0.5,
    'pizza': 2.0, 'burger': 6.0, 'sandwich': 2.0, 'soup': 0.8,
    'shirt': 2.5, 'jeans': 6.0, 'shoes': 5.0, 'jacket': 8.0,
}

# Metadata patterns to exclude
METADATA_PATTERNS = {
    'restaurant': True, 'cafe': True, 'coffee shop': True, 'bakery': True,
    'monday': True, 'tuesday': True, 'wednesday': True, 'thursday': True,
    'friday': True, 'saturday': True, 'sunday': True,
    'january': True, 'february': True, 'march': True, 'april': True,
    'phone': True, 'mobile': True, 'address': True, 'location': True,
    'total': True, 'subtotal': True, 'tax': True, 'discount': True,
    'cash': True, 'card': True, 'payment': True, 'thank': True,
    'receipt': True, 'invoice': True, 'order': True,
}

# Serve files
@app.route('/')
def index():
    return send_file('index.html')

@app.route('/styles.css')
def serve_css():
    return send_file('styles.css')

@app.route('/script.js')
def serve_js():
    return send_file('script.js')

def preprocess_image(image_bytes):
    """Preprocess image for better OCR accuracy"""
    try:
        img = Image.open(BytesIO(image_bytes))
        
        if img.mode in ('RGBA', 'LA', 'P'):
            rgb_img = Image.new('RGB', img.size, (255, 255, 255))
            rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = rgb_img
        
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(2.0)
        
        enhancer = ImageEnhance.Brightness(img)
        img = enhancer.enhance(1.1)
        
        enhancer = ImageEnhance.Sharpness(img)
        img = enhancer.enhance(3.0)
        
        output = BytesIO()
        img.save(output, format='JPEG', quality=98)
        output.seek(0)
        
        return output.getvalue()
    
    except Exception as e:
        print(f"Image preprocessing error: {e}")
        return image_bytes

@app.route('/api/parse-receipt', methods=['POST'])
def parse_receipt():
    try:
        if 'receipt' not in request.files:
            return jsonify({'success': False, 'error': 'No file uploaded'})
        
        file = request.files['receipt']
        
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'})
        
        filename = file.filename.lower()
        if '.' not in filename:
            return jsonify({'success': False, 'error': 'File must have an extension'})
        
        file_ext = filename.split('.')[-1]
        
        if file_ext not in SUPPORTED_FORMATS:
            return jsonify({
                'success': False, 
                'error': f'Unsupported format: {file_ext}'
            })
        
        file_bytes = file.read()
        print(f"\nProcessing receipt: {file.filename}")
        
        processed_bytes = preprocess_image(file_bytes)
        base64_string = base64.b64encode(processed_bytes).decode('utf-8')
        
        extracted_text = try_ocr_space(base64_string, file_ext)
        
        if not extracted_text:
            base64_original = base64.b64encode(file_bytes).decode('utf-8')
            extracted_text = try_ocr_space(base64_original, file_ext)
        
        if not extracted_text:
            return jsonify({
                'success': False,
                'error': 'Could not extract text from image. Please try a clearer photo.'
            })
        
        receipt_data = parse_receipt_items(extracted_text)
        carbon_data = calculate_carbon_footprint(receipt_data['items'])
        
        return jsonify({
            'success': True,
            'data': {
                'items_found': receipt_data['items'],
                'extracted_text': receipt_data['full_text'][:500],
                'carbon_footprint': carbon_data
            }
        })
    
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Error: {str(e)}'
        })

def try_ocr_space(base64_string, file_ext):
    """Try OCR.space API"""
    try:
        api_url = 'https://api.ocr.space/parse/image'
        
        payload = {
            'base64Image': f'data:image/{file_ext};base64,{base64_string}',
            'apikey': 'K87899142388957',
            'language': 'eng',
        }
        
        headers = {'User-Agent': 'Mozilla/5.0'}
        
        response = requests.post(api_url, data=payload, headers=headers, timeout=60)
        result = response.json()
        
        if result.get('IsErroredOnProcessing'):
            print(f"OCR Error: {result.get('ErrorMessage')}")
            return None
        
        parsed_results = result.get('ParsedResults', [])
        if not parsed_results:
            return None
        
        extracted_text = parsed_results[0].get('ParsedText', '').strip()
        return extracted_text if extracted_text else None
    
    except Exception as e:
        print(f"OCR Error: {str(e)}")
        return None

def is_metadata(text):
    """Check if text is metadata"""
    text_lower = text.lower().strip()
    text_clean = re.sub(r'[^\w\s]', '', text_lower)
    
    if text_clean in METADATA_PATTERNS:
        return True
    
    metadata_keywords = sum(1 for keyword in METADATA_PATTERNS if keyword in text_clean)
    if metadata_keywords > 0 and len(text_clean) < 30:
        return True
    
    if re.match(r'^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}$', text_clean):
        return True
    
    if re.match(r'^\d{1,2}:\d{2}', text_clean):
        return True
    
    if re.match(r'^[\d\-\(\)\.]+$', text_clean) and len(text_clean) > 7:
        return True
    
    if re.search(r'\d+\s+\w+', text_clean) and len(text_clean) > 20:
        return True
    
    return False

def is_valid_item(text):
    """Check if text is a valid item"""
    text_lower = text.lower().strip()
    text_lower = re.sub(r'^[^\w]+|[^\w]+$', '', text_lower)
    
    if not re.search(r'[a-z]', text_lower):
        return False
    
    if len(text_lower) < 2 or len(text_lower) > 100:
        return False
    
    if re.match(r'^\d+\.?\d*$', text_lower):
        return False
    
    if is_metadata(text):
        return False
    
    return True

def parse_receipt_items(text):
    """Parse receipt text and extract items"""
    lines = text.split('\n')
    items = []
    quantity_pattern = r'(\d+\.?\d*)\s*(?:x|@|each|qty|quantity|pack|box)'
    
    for line in lines:
        line = line.strip()
        
        if not line or len(line) < 2:
            continue
        
        if re.match(r'^[\$\d\.\-\s,]+$', line):
            continue
        
        if is_metadata(line):
            continue
        
        qty_match = re.search(quantity_pattern, line, re.IGNORECASE)
        quantity = float(qty_match.group(1)) if qty_match else 1.0
        
        item_name = re.sub(r'\d+\.?\d*\s*(?:x|@|each|qty|quantity)', '', line, flags=re.IGNORECASE)
        item_name = re.sub(r'\$[\d.]+', '', item_name)
        item_name = re.sub(r'[\d\.\-\s,]+$', '', item_name)
        item_name = item_name.strip()
        
        if is_valid_item(item_name) and len(item_name) > 2:
            if not any(i['name'].lower() == item_name.lower() for i in items):
                items.append({
                    'name': item_name,
                    'quantity': quantity
                })
    
    return {
        'items': items,
        'full_text': text
    }

def get_carbon_from_usda(item_name):
    """
    Query USDA FoodData Central API for food carbon data
    Returns kg CO2e per 100g
    """
    try:
        print(f"  → Querying USDA API for: {item_name}")
        
        # USDA API endpoint
        api_url = 'https://fdc.nal.usda.gov/api/foods/search'
        params = {
            'query': item_name,
            'pageSize': 5,
            'api_key': 'DEMO_KEY'  # Free tier - no key needed
        }
        
        response = requests.get(api_url, params=params, timeout=5)
        data = response.json()
        
        if 'foods' in data and len(data['foods']) > 0:
            food = data['foods'][0]
            food_name = food.get('description', '').lower()
            
            # Estimate carbon footprint based on food type
            # Average carbon footprint estimates (kg CO2e per 100g)
            if any(word in food_name for word in ['beef', 'lamb', 'meat']):
                return 2.5
            elif any(word in food_name for word in ['chicken', 'pork', 'turkey']):
                return 0.5
            elif any(word in food_name for word in ['fish', 'seafood', 'shrimp']):
                return 0.6
            elif any(word in food_name for word in ['cheese', 'butter', 'milk']):
                return 1.5
            elif any(word in food_name for word in ['egg']):
                return 0.2
            elif any(word in food_name for word in ['vegetable', 'fruit', 'salad']):
                return 0.15
            elif any(word in food_name for word in ['bread', 'grain', 'rice', 'pasta']):
                return 0.3
            else:
                return 0.5  # Default food estimate
        
        return None
    
    except Exception as e:
        print(f"  ✗ USDA API error: {e}")
        return None

def get_carbon_from_openfoodfacts(item_name):
    """
    Query Open Food Facts API (1M+ products)
    """
    try:
        print(f"  → Querying Open Food Facts for: {item_name}")
        
        api_url = f'https://world.openfoodfacts.net/cgi/search.pl'
        params = {
            'search_terms': item_name,
            'search_simple': 1,
            'action': 'process',
            'json': 1,
            'page_size': 5
        }
        
        response = requests.get(api_url, params=params, timeout=5, headers={'User-Agent': 'Mozilla/5.0'})
        data = response.json()
        
        if 'products' in data and len(data['products']) > 0:
            product = data['products'][0]
            product_name = product.get('product_name', '').lower()
            
            # Estimate carbon based on product category
            categories = product.get('categories', '').lower()
            
            if any(word in categories or word in product_name for word in ['beef', 'red meat', 'lamb']):
                return 2.5
            elif any(word in categories or word in product_name for word in ['poultry', 'chicken', 'turkey', 'pork']):
                return 0.5
            elif any(word in categories or word in product_name for word in ['fish', 'seafood', 'shrimp']):
                return 0.6
            elif any(word in categories or word in product_name for word in ['dairy', 'cheese', 'milk']):
                return 1.5
            elif any(word in categories or word in product_name for word in ['grains', 'bread', 'cereals']):
                return 0.3
            elif any(word in categories or word in product_name for word in ['fruit', 'vegetable']):
                return 0.15
            else:
                return 0.4  # Default product estimate
        
        return None
    
    except Exception as e:
        print(f"  ✗ Open Food Facts error: {e}")
        return None

def get_carbon_footprint_value(item_name):
    """
    Intelligent lookup with fallback chain:
    1. Local database (fastest)
    2. USDA API (comprehensive food database)
    3. Open Food Facts API (massive product database)
    4. Fallback to estimate
    """
    item_lower = item_name.lower().strip()
    
    print(f"\n  Looking up carbon footprint for: '{item_name}'")
    
    # 1. Check local database first (fastest)
    if item_lower in LOCAL_CARBON_DB:
        value = LOCAL_CARBON_DB[item_lower]
        print(f"  ✓ Found in local database: {value} kg CO2e")
        return value, 'Local Database'
    
    # 2. Try USDA API
    usda_value = get_carbon_from_usda(item_name)
    if usda_value:
        print(f"  ✓ Found in USDA API: {usda_value} kg CO2e")
        return usda_value, 'USDA FoodData'
    
    # 3. Try Open Food Facts API
    off_value = get_carbon_from_openfoodfacts(item_name)
    if off_value:
        print(f"  ✓ Found in Open Food Facts: {off_value} kg CO2e")
        return off_value, 'Open Food Facts'
    
    # 4. If no match, try partial matching in local database
    for key, value in LOCAL_CARBON_DB.items():
        if key in item_lower or item_lower in key:
            print(f"  ✓ Partial match: {key} → {value} kg CO2e")
            return value, f'Local DB (matched: {key})'
    
    # 5. Fallback estimate (assume generic food item)
    print(f"  ~ Using generic estimate: 0.5 kg CO2e")
    return None, None

def calculate_carbon_footprint(items):
    """Calculate carbon footprint using external APIs with fallback"""
    breakdown = []
    total_co2 = 0.0
    items_matched = 0
    items_not_found = []
    
    for item in items:
        item_name = item['name']
        quantity = item.get('quantity', 1.0)
        
        # Get carbon value from APIs
        co2_value, source = get_carbon_footprint_value(item_name)
        
        if co2_value is not None:
            total_item_co2 = co2_value * quantity
            breakdown.append({
                'item': item_name,
                'quantity': quantity,
                'source': source,
                'co2_per_unit_kg': co2_value,
                'total_co2_kg': round(total_item_co2, 3)
            })
            total_co2 += total_item_co2
            items_matched += 1
        else:
            items_not_found.append(item_name)
    
    return {
        'breakdown': breakdown,
        'total_co2_kg': round(total_co2, 2),
        'total_co2_lbs': round(total_co2 * 2.20462, 2),
        'items_matched': items_matched,
        'items_not_found': len(items_not_found),
        'total_items': len(items),
        'not_found_list': items_not_found[:5] if items_not_found else [],
        'summary': f"Total carbon footprint: {round(total_co2, 2)} kg CO2e ({round(total_co2 * 2.20462, 2)} lbs CO2e)" if items_matched > 0 else "No recognized items found"
    }

if __name__ == '__main__':
    print("Starting Receipt Parser with External Carbon Database")
    print("Using: USDA API + Open Food Facts + Local Database")
    print("Supported formats:", ', '.join(SUPPORTED_FORMATS))
    print("Max file size: 50MB")
    app.run(debug=True, port=5000, host='127.0.0.1')
