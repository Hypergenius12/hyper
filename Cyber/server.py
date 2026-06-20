from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

API_KEY = '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'
API_URL = 'https://openrouter.ai/api/v1/chat/completions'

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {API_KEY}',
        'HTTP-Referer': request.headers.get('HTTP-Referer', 'http://localhost:7000'),
        'X-Title': 'EXODUS'
    }
    
    try:
        response = requests.post(API_URL, headers=headers, json=data)
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({'error': {'message': str(e)}}), 500

if __name__ == '__main__':
    print("Backend proxy running on http://localhost:5000")
    app.run(port=5000, debug=True)
