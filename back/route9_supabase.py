from flask import Flask, request, jsonify
from flask_cors import CORS
from back.supabase_config import SupabaseHelper
from datetime import datetime, timedelta
import json

# Import your Flask app instance
from back.app import app

@app.route('/api/workers', methods=['GET'])
def get_workers():
    try:
        # Fetch all workers from Supabase
        workers = SupabaseHelper.get_all('workers')

        # Return the list of workers as JSON
        return jsonify(workers), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/workers', methods=['POST'])
def add_worker():
    try:
        # Get the list of worker details from the request body
        data = request.get_json()

        if not isinstance(data, list):
            return jsonify({'error': 'Invalid input, expected a list of workers'}), 400

        workers_added = []

        # Iterate over the list of workers
        for worker_data in data:
            name = worker_data.get('name')
            number = worker_data.get('number')
            Rate = worker_data.get('Rate')
            Suit = worker_data.get('Suit')
            Jacket = worker_data.get('Jacket')
            Sadri = worker_data.get('Sadri')
            Others = worker_data.get('Others')

            if not name or not number:
                return jsonify({'error': 'Name and number are required fields for all workers'}), 400

            # Create worker data dictionary
            worker_data_dict = {
                'name': name,
                'number': number,
                'Rate': Rate,
                'Suit': Suit,
                'Jacket': Jacket,
                'Sadri': Sadri,
                'Others': Others
            }

            # Add the new worker to Supabase
            new_worker = SupabaseHelper.create('workers', worker_data_dict)

            if new_worker:
                workers_added.append(new_worker)

        # Return a success message with the details of all added workers
        return jsonify({'message': 'Workers added successfully', 'workers': workers_added}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/workers/<int:id>', methods=['DELETE'])
def delete_worker(id):
    try:
        # Check if worker exists
        worker = SupabaseHelper.get_by_id('workers', id)
        if not worker:
            return jsonify({'error': 'Worker not found'}), 404

        # Delete the worker from Supabase
        success = SupabaseHelper.delete('workers', id)
        
        if success:
            return jsonify({'message': f'Worker {worker["name"]} removed successfully'}), 200
        else:
            return jsonify({'error': 'Failed to delete worker'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True) 