"""
Demo Data Seeder Script for TaskHub
Usage:
    python seed.py
"""
import os
import psycopg2
from urllib.parse import quote_plus
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

load_dotenv()

database_url = os.getenv('DATABASE_URL')
if not database_url:
    pw = quote_plus('qWM6PqxgW?yMEW@')
    database_url = f'postgresql://postgres.qowzmhcydxxfbtrzangl:{pw}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres'
elif 'db.qowzmhcydxxfbtrzangl.supabase.co' in database_url:
    database_url = database_url.replace('db.qowzmhcydxxfbtrzangl.supabase.co:5432', 'aws-0-ap-south-1.pooler.supabase.com:6543')
    database_url = database_url.replace('db.qowzmhcydxxfbtrzangl.supabase.co', 'aws-0-ap-south-1.pooler.supabase.com:6543')
    if 'postgres:' in database_url and 'postgres.qowzmhcydxxfbtrzangl' not in database_url:
        database_url = database_url.replace('postgres:', 'postgres.qowzmhcydxxfbtrzangl:', 1)

conn = psycopg2.connect(database_url)
cur = conn.cursor()

# Fetch existing profiles
cur.execute('SELECT id, email FROM public.profiles;')
user_map = {row[1]: row[0] for row in cur.fetchall()}

# Find anish or default
anish_id = user_map.get('anish130905@gmail.com')
alex_id = user_map.get('alex.chen@example.com')
sarah_id = user_map.get('sarah.connor@example.com')
david_id = user_map.get('david.kim@example.com')

primary_user_id = anish_id or alex_id

now = datetime.now(timezone.utc)

demo_tasks = [
    {
        'title': 'Implement Google OAuth 2.0 with Supabase Auth',
        'description': 'Configure Google Cloud client credentials, redirect URI callbacks, and user session persistence.',
        'priority': 'high',
        'status': 'completed',
        'created_by': david_id or primary_user_id,
        'assigned_to': primary_user_id,
        'due_date': now - timedelta(days=2),
        'completed_at': now - timedelta(days=1),
    },
    {
        'title': 'Set up Supabase Row Level Security (RLS) policies',
        'description': 'Write migration scripts to restrict direct table access and add handle_new_user trigger.',
        'priority': 'high',
        'status': 'completed',
        'created_by': primary_user_id,
        'assigned_to': alex_id,
        'due_date': now - timedelta(days=1),
        'completed_at': now - timedelta(hours=18),
    },
    {
        'title': 'Configure Gmail SMTP notification triggers',
        'description': 'Ensure asynchronous email dispatch on task assignment and status completion without blocking API.',
        'priority': 'urgent',
        'status': 'in_progress',
        'created_by': sarah_id or primary_user_id,
        'assigned_to': primary_user_id,
        'due_date': now + timedelta(days=1),
        'completed_at': None,
    },
    {
        'title': 'Build responsive task management dashboard',
        'description': 'Implement task filtering by status and ownership with clear student-style table view.',
        'priority': 'medium',
        'status': 'completed',
        'created_by': primary_user_id,
        'assigned_to': primary_user_id,
        'due_date': now - timedelta(hours=6),
        'completed_at': now - timedelta(hours=1),
    },
    {
        'title': 'Record Loom walk-through video',
        'description': 'Walk through architecture, code structure, database migrations, and live assignment features.',
        'priority': 'high',
        'status': 'in_progress',
        'created_by': primary_user_id,
        'assigned_to': primary_user_id,
        'due_date': now + timedelta(days=2),
        'completed_at': None,
    },
    {
        'title': 'Deploy Flask API to Railway / Render',
        'description': 'Connect GitHub repo, configure environment variables, and verify live endpoints.',
        'priority': 'urgent',
        'status': 'pending',
        'created_by': primary_user_id,
        'assigned_to': david_id,
        'due_date': now + timedelta(days=3),
        'completed_at': None,
    },
    {
        'title': 'Deploy Next.js frontend to Vercel',
        'description': 'Set up production build on Vercel with NEXT_PUBLIC_API_URL and Supabase credentials.',
        'priority': 'medium',
        'status': 'pending',
        'created_by': sarah_id or primary_user_id,
        'assigned_to': alex_id,
        'due_date': now + timedelta(days=4),
        'completed_at': None,
    },
    {
        'title': 'Prepare technical interview talking points',
        'description': 'Review Flask blueprints, JWKS verification, database triggers, and SMTP threading.',
        'priority': 'low',
        'status': 'pending',
        'created_by': primary_user_id,
        'assigned_to': primary_user_id,
        'due_date': now + timedelta(days=5),
        'completed_at': None,
    }
]

for t in demo_tasks:
    cur.execute('SELECT id FROM public.tasks WHERE title = %s;', (t['title'],))
    if not cur.fetchone():
        cur.execute('''
            INSERT INTO public.tasks (title, description, priority, status, created_by, assigned_to, due_date, completed_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
        ''', (t['title'], t['description'], t['priority'], t['status'], t['created_by'], t['assigned_to'], t['due_date'], t['completed_at']))

conn.commit()
cur.execute('SELECT COUNT(*) FROM public.tasks;')
print(f"Seeding completed successfully! Total tasks in DB: {cur.fetchone()[0]}")
conn.close()
