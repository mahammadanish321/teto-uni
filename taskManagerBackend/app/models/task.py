import uuid
from datetime import datetime, timezone
from sqlalchemy.dialects.postgresql import UUID
from app.database import db

class Task(db.Model):
    __tablename__ = 'tasks'
    __table_args__ = {'schema': 'public'}

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), default='pending', nullable=False, index=True)
    priority = db.Column(db.String(50), default='medium', nullable=False)
    due_date = db.Column(db.DateTime(timezone=True), nullable=True)
    created_by = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey('public.profiles.id', ondelete='CASCADE'),
        nullable=False,
        index=True
    )
    assigned_to = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey('public.profiles.id', ondelete='SET NULL'),
        nullable=True,
        index=True
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    completed_at = db.Column(db.DateTime(timezone=True), nullable=True)

    # Relationships
    creator = db.relationship('Profile', foreign_keys=[created_by], backref=db.backref('created_tasks', lazy='dynamic'))
    assignee = db.relationship('Profile', foreign_keys=[assigned_to], backref=db.backref('assigned_tasks', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': str(self.id),
            'title': self.title,
            'description': self.description or '',
            'status': self.status,
            'priority': self.priority,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'created_by': str(self.created_by),
            'creator': self.creator.to_dict() if self.creator else None,
            'assigned_to': str(self.assigned_to) if self.assigned_to else None,
            'assignee': self.assignee.to_dict() if self.assignee else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
        }

    def __repr__(self):
        return f"<Task {self.title} ({self.status})>"
