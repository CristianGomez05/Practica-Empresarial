from django.core.management.base import BaseCommand
from core.models import Usuario
import os

class Command(BaseCommand):
    help = 'Crea un superusuario automáticamente'

    def handle(self, *args, **options):
        email = os.environ.get('ADMIN_EMAIL', 'admin@santaclara.com')
        password = os.environ.get('ADMIN_PASSWORD', 'Admin123456!')
        
        if not Usuario.objects.filter(email=email).exists():
            Usuario.objects.create_superuser(
                email=email,
                password=password,
                nombre='Admin',
                apellido='Santa Clara'
            )
            self.stdout.write(self.style.SUCCESS(f'✅ Superusuario {email} creado exitosamente'))
        else:
            self.stdout.write(self.style.WARNING(f'⚠️ El usuario {email} ya existe'))