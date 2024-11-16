from flask import Flask, jsonify, request, render_template
from web3 import Web3
from datetime import datetime, timezone
import os

# Initialize Flask app
app = Flask(__name__)

# Connect to Ethereum node (via Infura)
INFURA_URL = os.environ["INFURA_API"]
web3 = Web3(Web3.HTTPProvider(INFURA_URL))

# Check connection
if not web3.is_connected():
    print("Failed to connect to Ethereum node")
    exit()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/block/<block_identifier>')
def get_block(block_identifier):
    try:
        if block_identifier.isdigit():
            block = web3.eth.get_block(int(block_identifier))
        else:
            block = web3.eth.get_block(block_identifier)
        
        block_data = {
            "block_number": block.number,
            "timestamp": block.timestamp,
            "transactions": len(block.transactions),
            "miner": block.miner,
            "size": block.size,
            "gas_used": block.gasUsed,
            "gas_limit": block.gasLimit,
            "parent_hash": block.parentHash.hex()
        }
        # Render block data in an HTML template
        return render_template('block.html', block=block_data)
    except Exception as e:
        return render_template('error.html', error_message=str(e)), 400

@app.route('/transaction/<transaction_hash>')
def get_transaction(transaction_hash):
    try:
        transaction = web3.eth.get_transaction(transaction_hash)
        transaction_data = {
            "hash": transaction.hash.hex(),
            "from": transaction['from'],
            "to": transaction['to'],
            "value": web3.fromWei(transaction.value, 'ether'),
            "gas": transaction.gas,
            "gas_price": web3.fromWei(transaction.gasPrice, 'gwei'),
            "nonce": transaction.nonce
        }
        return jsonify(transaction_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    
@app.route('/recent_blocks/<int:count>', methods=['GET'])
def recent_blocks(count):
    try:
        page = request.args.get('page', 1, type=int)  # Default to page 1 if not provided
        blocks_per_page = count  # Number of blocks per page
        latest_block_number = web3.eth.block_number
        
        # Calculate the starting block based on the page
        start_block = latest_block_number - (page - 1) * blocks_per_page
        end_block = start_block - blocks_per_page
        
        blocks = []
        for i in range(start_block, end_block, -1):
            block = web3.eth.get_block(i)
            blocks.append({
                "block_number": block.number,
                "timestamp": block.timestamp,
                "transactions": len(block.transactions),
                "miner": block.miner,
                "size": block.size,
                "baseFeePerGas": block.baseFeePerGas,
                "blobGasUsed": block.blobGasUsed,
                "difficulty": block.difficulty,
                "gasLimit": block.gasLimit,
                "gasUsed": block.gasUsed,
            })
        
        return jsonify(blocks)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.template_filter('datetime')
def datetime_filter(timestamp):
    # Convert the timestamp to a timezone-aware UTC datetime object
    return datetime.fromtimestamp(timestamp, tz=timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)