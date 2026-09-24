from flask import Blueprint, jsonify

main = Blueprint('main', __name__)

@main.get('/api/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'Task Manager Backend API',
        'version': '1.0.0'
    })
