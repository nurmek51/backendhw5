from celery import Celery
import os

CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_BACKEND_URL = os.getenv("CELERY_BACKEND_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "backend_celery",
    broker=CELERY_BROKER_URL,
    backend=CELERY_BACKEND_URL,
    include=["src.tasks"], # We will create src/tasks.py later
)

celery_app.conf.update(task_track_started=True)

# Optional: Basic Celery Beat configuration if you want to define schedules directly here
# celery_app.conf.beat_schedule = {
#     'add-every-30-seconds': {
#         'task': 'src.tasks.add_task',
#         'schedule': 30.0,
#         'args': (16, 16)
#     },
# }
# celery_app.conf.timezone = 'UTC' 