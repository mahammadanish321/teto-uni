import os
from urllib.parse import quote_plus
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'task-manager-jwt-secret-key-2026')
    
    # Supabase Configuration
    SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://qowzmhcydxxfbtrzangl.supabase.co').rstrip('/')
    SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'sb_publishable_mOc3dW_eS63LUursi357Jw_rBsKOGaX')
    
    # Database Configuration (PostgreSQL on Supabase)
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        pw = quote_plus('qWM6PqxgW?yMEW@')
        database_url = f'postgresql://postgres.qowzmhcydxxfbtrzangl:{pw}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres'
    
    # Supabase direct hostname (db.*.supabase.co) only resolves to IPv6,
    # which Render containers cannot route. Automatically route through IPv4 pooler.
    if database_url and 'db.qowzmhcydxxfbtrzangl.supabase.co' in database_url:
        database_url = database_url.replace('db.qowzmhcydxxfbtrzangl.supabase.co:5432', 'aws-0-ap-south-1.pooler.supabase.com:6543')
        database_url = database_url.replace('db.qowzmhcydxxfbtrzangl.supabase.co', 'aws-0-ap-south-1.pooler.supabase.com:6543')
        if 'postgres:' in database_url and 'postgres.qowzmhcydxxfbtrzangl' not in database_url:
            database_url = database_url.replace('postgres:', 'postgres.qowzmhcydxxfbtrzangl:', 1)

    # Handle postgres:// vs postgresql:// for SQLAlchemy compatibility
    if database_url and database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
        
    SQLALCHEMY_DATABASE_URI = database_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 5,
        'max_overflow': 10,
        'pool_timeout': 30,
        'pool_recycle': 1800,
        'pool_pre_ping': True,
    }
    
    # Gmail SMTP Configuration
    GMAIL_USER = os.getenv('GMAIL_USER', '')
    GMAIL_APP_PASSWORD = os.getenv('GMAIL_APP_PASSWORD', '')
    SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.gmail.com')
    SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
    
    # Frontend URL for CORS and notification links
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000').rstrip('/')
