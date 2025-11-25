from django.core.management.base import BaseCommand
from core.models import Usuario

class Command(BaseCommand):
    help = 'Crea un superadmin en Railway'

    def handle(self, *args, **options):
        username = 'superadmin'
        email = 'superadmin@santaclara.com'
        password = 'SuperAdmin2024!'
        
        # Verificar si ya existe
        if Usuario.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING(f'⚠️ Usuario {username} ya existe'))
            usuario = Usuario.objects.get(username=username)
            self.stdout.write(self.style.SUCCESS(f'Username: {usuario.username}'))
            self.stdout.write(self.style.SUCCESS(f'Email: {usuario.email}'))
            self.stdout.write(self.style.SUCCESS(f'Rol: {usuario.rol}'))
            return
        
        try:
            admin = Usuario.objects.create_superuser(
                username=username,
                email=email,
                password=password,
                first_name='Super',
                last_name='Administrador',
                rol='administrador_general'
            )
            
            self.stdout.write(self.style.SUCCESS('\n' + '='*60))
            self.stdout.write(self.style.SUCCESS('✅ SUPERADMIN CREADO EN RAILWAY'))
            self.stdout.write(self.style.SUCCESS('='*60))
            self.stdout.write(self.style.SUCCESS(f'Username: {username}'))
            self.stdout.write(self.style.SUCCESS(f'Email: {email}'))
            self.stdout.write(self.style.SUCCESS(f'Password: {password}'))
            self.stdout.write(self.style.SUCCESS(f'Rol: {admin.rol}'))
            self.stdout.write(self.style.SUCCESS('='*60 + '\n'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Error: {str(e)}'))