# api/management/commands/create_superuser.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Create a superuser if none exists'

    def handle(self, *args, **options):
        User = get_user_model()
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@agroconnect.com', 'admin123')
            self.stdout.write(self.style.SUCCESS('✅ Superuser "admin" created with password "admin123"'))
        else:
            self.stdout.write('ℹ️ Superuser "admin" already exists')