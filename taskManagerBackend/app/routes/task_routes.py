import uuid
from datetime import datetime, timezone
from flask import Blueprint, jsonify, request, g, current_app
from sqlalchemy import or_, and_
from app.database import db
from app.models.task import Task
from app.models.profile import Profile
from app.services.auth_service import require_auth
from app.services.email_service import EmailService

task_bp = Blueprint('task_bp', __name__)

@task_bp.get('')
@require_auth
def get_tasks():
    current_user_id = g.current_user.id
    
    # Query parameters
    status_filter = request.args.get('status')
    priority_filter = request.args.get('priority')
    assignment_filter = request.args.get('filter', 'all') # 'all', 'assigned_to_me', 'created_by_me'
    search_query = request.args.get('search', '').strip()
    sort_by = request.args.get('sort_by', 'created_at')
    order = request.args.get('order', 'desc')

    query = Task.query

    # Assignment filter
    if assignment_filter == 'assigned_to_me':
        query = query.filter(Task.assigned_to == current_user_id)
    elif assignment_filter == 'created_by_me':
        query = query.filter(Task.created_by == current_user_id)

    # Status filter
    if status_filter and status_filter in ['pending', 'in_progress', 'completed']:
        query = query.filter(Task.status == status_filter)

    # Priority filter
    if priority_filter and priority_filter in ['low', 'medium', 'high', 'urgent']:
        query = query.filter(Task.priority == priority_filter)

    # Search filter
    if search_query:
        search_pattern = f"%{search_query}%"
        query = query.filter(
            or_(
                Task.title.ilike(search_pattern),
                Task.description.ilike(search_pattern)
            )
        )

    # Sorting
    sort_column = getattr(Task, sort_by, Task.created_at)
    if order == 'asc':
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    tasks = query.all()

    # Calculate statistics for the dashboard
    all_tasks = Task.query.all()
    stats = {
        'total': len(all_tasks),
        'pending': sum(1 for t in all_tasks if t.status == 'pending'),
        'in_progress': sum(1 for t in all_tasks if t.status == 'in_progress'),
        'completed': sum(1 for t in all_tasks if t.status == 'completed'),
        'assigned_to_me': sum(1 for t in all_tasks if t.assigned_to == current_user_id),
        'created_by_me': sum(1 for t in all_tasks if t.created_by == current_user_id)
    }

    return jsonify({
        'tasks': [t.to_dict() for t in tasks],
        'stats': stats
    })

@task_bp.get('/<task_id>')
@require_auth
def get_task(task_id):
    try:
        t_uuid = uuid.UUID(task_id)
    except ValueError:
        return jsonify({'error': 'Invalid task ID format'}), 400

    task = Task.query.get(t_uuid)
    if not task:
        return jsonify({'error': 'Task not found'}), 404

    return jsonify({'task': task.to_dict()})

@task_bp.post('')
@require_auth
def create_task():
    data = request.get_json() or {}
    
    title = data.get('title', '').strip()
    if not title:
        return jsonify({'error': 'Title is required'}), 400

    description = data.get('description', '').strip()
    priority = data.get('priority', 'medium').lower()
    if priority not in ['low', 'medium', 'high', 'urgent']:
        priority = 'medium'

    status = data.get('status', 'pending').lower()
    if status not in ['pending', 'in_progress', 'completed']:
        status = 'pending'

    due_date_str = data.get('due_date')
    due_date = None
    if due_date_str:
        try:
            # Handle ISO string from frontend
            clean_date_str = due_date_str.replace('Z', '+00:00')
            due_date = datetime.fromisoformat(clean_date_str)
        except ValueError:
            pass

    assigned_to_id = data.get('assigned_to')
    assignee_uuid = None
    assignee_profile = None

    if assigned_to_id:
        try:
            assignee_uuid = uuid.UUID(assigned_to_id)
            assignee_profile = Profile.query.get(assignee_uuid)
        except ValueError:
            pass

    new_task = Task(
        title=title,
        description=description,
        status=status,
        priority=priority,
        due_date=due_date,
        created_by=g.current_user.id,
        assigned_to=assignee_uuid
    )

    if status == 'completed':
        new_task.completed_at = datetime.now(timezone.utc)

    db.session.add(new_task)
    db.session.commit()

    # Trigger email notification to assignee via Gmail
    if assignee_profile:
        EmailService.send_task_assigned_notification(
            task_title=new_task.title,
            task_desc=new_task.description,
            priority=new_task.priority,
            due_date=new_task.due_date.strftime('%B %d, %Y') if new_task.due_date else None,
            creator_name=g.current_user.full_name or g.current_user.email,
            assignee_name=assignee_profile.full_name or assignee_profile.email,
            assignee_email=assignee_profile.email,
            app_config=current_app.config
        )

    return jsonify({
        'message': 'Task created successfully',
        'task': new_task.to_dict()
    }), 201

@task_bp.put('/<task_id>')
@require_auth
def update_task(task_id):
    try:
        t_uuid = uuid.UUID(task_id)
    except ValueError:
        return jsonify({'error': 'Invalid task ID format'}), 400

    task = Task.query.get(t_uuid)
    if not task:
        return jsonify({'error': 'Task not found'}), 404

    data = request.get_json() or {}
    prev_status = task.status
    prev_assigned_to = task.assigned_to

    if 'title' in data:
        title = data['title'].strip()
        if not title:
            return jsonify({'error': 'Title cannot be empty'}), 400
        task.title = title

    if 'description' in data:
        task.description = data['description'].strip()

    if 'priority' in data:
        priority = data['priority'].lower()
        if priority in ['low', 'medium', 'high', 'urgent']:
            task.priority = priority

    if 'status' in data:
        new_status = data['status'].lower()
        if new_status in ['pending', 'in_progress', 'completed']:
            task.status = new_status
            if new_status == 'completed' and prev_status != 'completed':
                task.completed_at = datetime.now(timezone.utc)
            elif new_status != 'completed':
                task.completed_at = None

    if 'due_date' in data:
        due_date_str = data['due_date']
        if due_date_str:
            try:
                task.due_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00'))
            except ValueError:
                pass
        else:
            task.due_date = None

    new_assigned_uuid = None
    new_assignee_profile = None
    if 'assigned_to' in data:
        assigned_to_id = data['assigned_to']
        if assigned_to_id:
            try:
                new_assigned_uuid = uuid.UUID(assigned_to_id)
                new_assignee_profile = Profile.query.get(new_assigned_uuid)
                task.assigned_to = new_assigned_uuid
            except ValueError:
                task.assigned_to = None
        else:
            task.assigned_to = None

    task.updated_at = datetime.now(timezone.utc)
    db.session.commit()

    # If newly assigned to someone else, send assignment notification
    if new_assignee_profile and new_assigned_uuid != prev_assigned_to:
        EmailService.send_task_assigned_notification(
            task_title=task.title,
            task_desc=task.description,
            priority=task.priority,
            due_date=task.due_date.strftime('%B %d, %Y') if task.due_date else None,
            creator_name=g.current_user.full_name or g.current_user.email,
            assignee_name=new_assignee_profile.full_name or new_assignee_profile.email,
            assignee_email=new_assignee_profile.email,
            app_config=current_app.config
        )

    # If task was newly marked as completed, send task completion notification
    if task.status == 'completed' and prev_status != 'completed':
        completer_name = g.current_user.full_name or g.current_user.email

        # Notify creator if different from completer
        if task.creator and task.creator.email != g.current_user.email:
            EmailService.send_task_completed_notification(
                task_title=task.title,
                completer_name=completer_name,
                recipient_name=task.creator.full_name or task.creator.email,
                recipient_email=task.creator.email,
                app_config=current_app.config
            )

        # Also notify assignee if different from completer and creator
        if task.assignee and task.assignee.email != g.current_user.email and task.assignee.email != (task.creator.email if task.creator else None):
            EmailService.send_task_completed_notification(
                task_title=task.title,
                completer_name=completer_name,
                recipient_name=task.assignee.full_name or task.assignee.email,
                recipient_email=task.assignee.email,
                app_config=current_app.config
            )

    return jsonify({
        'message': 'Task updated successfully',
        'task': task.to_dict()
    })

@task_bp.delete('/<task_id>')
@require_auth
def delete_task(task_id):
    try:
        t_uuid = uuid.UUID(task_id)
    except ValueError:
        return jsonify({'error': 'Invalid task ID format'}), 400

    task = Task.query.get(t_uuid)
    if not task:
        return jsonify({'error': 'Task not found'}), 404

    # Allow creator or assignee to delete task
    if task.created_by != g.current_user.id and task.assigned_to != g.current_user.id:
        return jsonify({'error': 'Unauthorized to delete this task'}), 403

    db.session.delete(task)
    db.session.commit()

    return jsonify({
        'message': 'Task deleted successfully',
        'id': task_id
    })
