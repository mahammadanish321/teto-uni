import smtplib
import threading
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from flask import current_app

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    def _send_smtp_email(to_email: str, subject: str, html_content: str, text_content: str, config: dict):
        gmail_user = config.get('GMAIL_USER', '').strip()
        gmail_password = config.get('GMAIL_APP_PASSWORD', '').strip()
        smtp_host = config.get('SMTP_HOST', 'smtp.gmail.com')
        smtp_port = config.get('SMTP_PORT', 587)

        if not gmail_user or not gmail_password:
            print("\n" + "=" * 65)
            print("📬  [GMAIL SERVICE - DEV MODE / UNCONFIGURED CREDENTIALS]")
            print(f"To: {to_email}")
            print(f"Subject: {subject}")
            print("-" * 65)
            print(text_content.strip())
            print("=" * 65 + "\n")
            logger.info(f"Simulated email sent to {to_email}: {subject}")
            return True

        try:
            msg = MIMEMultipart('alternative')
            msg['From'] = f"Task Manager <{gmail_user}>"
            msg['To'] = to_email
            msg['Subject'] = subject

            msg.attach(MIMEText(text_content, 'plain'))
            msg.attach(MIMEText(html_content, 'html'))

            server = smtplib.SMTP(smtp_host, smtp_port, timeout=15)
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(gmail_user, gmail_password)
            server.sendmail(gmail_user, [to_email], msg.as_string())
            server.quit()
            logger.info(f"Successfully sent Gmail notification to {to_email}")
            print(f"✅ [GMAIL] Notification sent to {to_email}: {subject}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email via Gmail SMTP to {to_email}: {str(e)}")
            print(f"❌ [GMAIL ERROR] Could not send email to {to_email}: {str(e)}")
            return False

    @classmethod
    def send_async(cls, to_email: str, subject: str, html_content: str, text_content: str, config: dict):
        thread = threading.Thread(
            target=cls._send_smtp_email,
            args=(to_email, subject, html_content, text_content, config)
        )
        thread.daemon = True
        thread.start()

    @classmethod
    def send_task_assigned_notification(cls, task_title: str, task_desc: str, priority: str, due_date: str, creator_name: str, assignee_name: str, assignee_email: str, app_config: dict):
        if not assignee_email:
            return

        subject = f"📋 New Task Assigned: {task_title}"
        frontend_url = app_config.get('FRONTEND_URL', 'http://localhost:3000')

        text_content = f"""
Hello {assignee_name or 'there'},

You have been assigned a new task by {creator_name or 'a team member'}:

Task: {task_title}
Priority: {priority.upper()}
Due Date: {due_date or 'No deadline set'}

Description:
{task_desc or 'No description provided.'}

View and update your task at:
{frontend_url}

Best regards,
Task Manager Team
"""

        priority_colors = {
            'urgent': '#dc2626',
            'high': '#ea580c',
            'medium': '#d97706',
            'low': '#16a34a'
        }
        badge_color = priority_colors.get(priority.lower(), '#4b5563')

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 24px; }}
    .container {{ max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; }}
    .header {{ background: #1e293b; color: #ffffff; padding: 24px 32px; }}
    .header h1 {{ margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.5px; }}
    .content {{ padding: 32px; color: #374151; line-height: 1.6; }}
    .task-card {{ background: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0; border-left-width: 4px; }}
    .task-title {{ font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0; }}
    .badge {{ display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; color: #ffffff; background: {badge_color}; text-transform: uppercase; }}
    .meta-row {{ margin-top: 12px; font-size: 14px; color: #64748b; }}
    .btn {{ display: inline-block; background: #2563eb; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 24px; }}
    .footer {{ background: #f8fafc; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Task Manager Notification</h1>
    </div>
    <div class="content">
      <p>Hello <strong>{assignee_name or 'there'}</strong>,</p>
      <p><strong>{creator_name or 'A team member'}</strong> has assigned you a new task:</p>
      
      <div class="task-card">
        <div class="task-title">{task_title}</div>
        <div><span class="badge">{priority.upper()}</span></div>
        <div class="meta-row"><strong>Due Date:</strong> {due_date or 'No deadline specified'}</div>
        <div class="meta-row" style="margin-top: 8px;"><strong>Description:</strong><br>{task_desc or 'No description provided.'}</div>
      </div>

      <a href="{frontend_url}" class="btn">View Task in Dashboard →</a>
    </div>
    <div class="footer">
      Sent automatically by Task Manager App • Hairdrama Tech Assignment
    </div>
  </div>
</body>
</html>
"""
        cls.send_async(assignee_email, subject, html_content, text_content, app_config)

    @classmethod
    def send_task_completed_notification(cls, task_title: str, completer_name: str, recipient_name: str, recipient_email: str, app_config: dict):
        if not recipient_email:
            return

        subject = f"✅ Task Completed: {task_title}"
        frontend_url = app_config.get('FRONTEND_URL', 'http://localhost:3000')

        text_content = f"""
Hello {recipient_name or 'there'},

Great news! The task '{task_title}' has been marked as COMPLETED by {completer_name or 'a team member'}.

View the updated status in your dashboard:
{frontend_url}

Best regards,
Task Manager Team
"""

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 24px; }}
    .container {{ max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; }}
    .header {{ background: #065f46; color: #ffffff; padding: 24px 32px; }}
    .header h1 {{ margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.5px; }}
    .content {{ padding: 32px; color: #374151; line-height: 1.6; }}
    .task-card {{ background: #ecfdf5; border: 1px solid #a7f3d0; border-left: 4px solid #10b981; border-radius: 6px; padding: 20px; margin: 20px 0; }}
    .task-title {{ font-size: 18px; font-weight: 700; color: #064e3b; margin: 0 0 8px 0; }}
    .status-badge {{ display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; color: #ffffff; background: #10b981; }}
    .btn {{ display: inline-block; background: #059669; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 24px; }}
    .footer {{ background: #f8fafc; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Task Completed</h1>
    </div>
    <div class="content">
      <p>Hello <strong>{recipient_name or 'there'}</strong>,</p>
      <p>The following task has been marked as <strong>Completed</strong> by <strong>{completer_name or 'a team member'}</strong>:</p>
      
      <div class="task-card">
        <div class="task-title">{task_title}</div>
        <div><span class="status-badge">COMPLETED</span></div>
      </div>

      <a href="{frontend_url}" class="btn">View in Dashboard →</a>
    </div>
    <div class="footer">
      Sent automatically by Task Manager App • Hairdrama Tech Assignment
    </div>
  </div>
</body>
</html>
"""
        cls.send_async(recipient_email, subject, html_content, text_content, app_config)
