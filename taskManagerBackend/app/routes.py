from flask import Blueprint, jsonify

main = Blueprint('main', __name__)


@main.get('/api/health')
def health_check():
    return jsonify({'status': 'ok'})
