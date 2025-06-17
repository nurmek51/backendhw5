from .celery_worker import celery_app

@celery_app.task
def example_task(a, b):
    print(f"Executing example_task with {a} and {b}")
    return a + b 