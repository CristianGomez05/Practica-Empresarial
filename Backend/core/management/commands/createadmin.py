#Backend/core/management/commands/createadmin.py
from django.core.management.base import BaseCommand
from core.models import Usuario
import os

class Command(BaseCommand):
    help = 'Crea un superusuario automáticamente'

    def handle(self, *args, **options):
        email = os.environ.get('ADMIN_EMAIL', 'admin@santaclara.com')
        password = os.environ.get('ADMIN_PASSWORD', 'Admin123456!')
        username = 'admin'  # Username fijo para el admin
        
        # Verificar si ya existe el usuario por email o username
        if Usuario.objects.filter(email=email).exists():
            self.stdout.write(self.style.WARNING(f'⚠️ Usuario con email {email} ya existe'))
            return
            
        if Usuario.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING(f'⚠️ Usuario con username {username} ya existe'))
            return
        
        try:
            # Crear superusuario con username
            Usuario.objects.create_superuser(
                username=username,
                email=email,
                password=password,
                nombre='Admin',
                apellido='Santa Clara'
            )
            self.stdout.write(self.style.SUCCESS(f'✅ Superusuario creado exitosamente'))
            self.stdout.write(self.style.SUCCESS(f'   Username: {username}'))
            self.stdout.write(self.style.SUCCESS(f'   Email: {email}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Error al crear superusuario: {str(e)}'))