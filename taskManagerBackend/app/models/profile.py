from datetime import datetime, timezone
from sqlalchemy.dialects.postgresql import UUID
from app.database import db

class Profile(db.Model):
    __tablename__ = 'profiles'
    __table_args__ = {'schema': 'public'}

    id = db.Column(UUID(as_uuid=True), primary_key=True)
    email = db.Column(db.Text, unique=True, nullable=False, index=True)
    full_name = db.Column(db.Text, nullable=True)
    avatar_url = db.Column(db.Text, nullable=True)
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

    def to_dict(self):
        return {
            'id': str(self.id),
            'email': self.email,
            'full_name': self.full_name or self.email.split('@')[0],
            'avatar_url': self.avatar_url or '',
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Profile {self.email}>"
