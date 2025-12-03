# Backend/core/adapters.py
# ⭐ ACTUALIZADO: Incluye domicilio en tokens OAuth

from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from rest_framework_simplejwt.tokens import RefreshToken
from urllib.parse import urlencode
from django.conf import settings


class FrontendRedirectAccountAdapter(DefaultAccountAdapter):
    """
    Genera tokens JWT y redirige al frontend según el rol del usuario
    ⭐ CRÍTICO: Incluye TODA la información del usuario en el token, incluyendo domicilio
    """
    def get_login_redirect_url(self, request):
        user = request.user
        if not user or not user.is_authenticated:
            return super().get_login_redirect_url(request)

        print(f"\n{'='*60}")
        print(f"🔐 OAUTH LOGIN - Generando tokens")
        print(f"{'='*60}")

        # Generar tokens con información personalizada
        refresh = RefreshToken.for_user(user)
        
        # ⭐ Agregar TODOS los claims personalizados (igual que en serializers.py)
        refresh['username'] = user.username
        refresh['email'] = user.email
        refresh['rol'] = user.rol
        refresh['first_name'] = user.first_name
        refresh['last_name'] = user.last_name
        
        # ⭐⭐⭐ CRÍTICO: Agregar domicilio al token OAuth
        refresh['domicilio'] = user.domicilio or ''
        refresh['tiene_domicilio'] = user.tiene_domicilio
        print(f"🏠 Domicilio: {user.domicilio[:50] if user.domicilio else 'No configurado'}...")
        print(f"✓ Tiene domicilio: {user.tiene_domicilio}")
        
        # Agregar información de sucursal si existe
        if hasattr(user, 'sucursal') and user.sucursal:
            refresh['sucursal_id'] = user.sucursal.id
            refresh['sucursal_nombre'] = user.sucursal.nombre
            print(f"🏪 Sucursal: {user.sucursal.nombre} (ID: {user.sucursal.id})")
        else:
            refresh['sucursal_id'] = None
            refresh['sucursal_nombre'] = None
            print(f"⚠️ Usuario sin sucursal asignada")
        
        access = str(refresh.access_token)
        refresh_str = str(refresh)

        fragment = urlencode({
            "access": access,
            "refresh": refresh_str,
        })

        frontend_url = settings.FRONTEND_URL
        
        # Redirigir a /dashboard SIEMPRE
        # Dashboard.jsx se encargará de procesar tokens y redirigir según rol
        redirect_url = f"{frontend_url}/dashboard#{fragment}"
        
        print(f"🔗 Redirigiendo a: {redirect_url}")
        print(f"👤 Usuario: {user.username} | Email: {user.email} | Rol: {user.rol}")
        print(f"{'='*60}\n")
        
        return redirect_url


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    """
    Adapter personalizado para manejar la información de Google OAuth
    """
    def pre_social_login(self, request, sociallogin):
        """
        Se ejecuta antes de que el usuario se autentique con Google
        """
        if sociallogin.account.provider == 'google':
            email = sociallogin.account.extra_data.get('email')
            print(f"📧 Email de Google: {email}")
            
            if sociallogin.is_existing:
                user = sociallogin.user
                if email and not user.email:
                    user.email = email
                    user.save()
                    print(f"✅ Email actualizado para {user.username}")
    
    def save_user(self, request, sociallogin, form=None):
        """
        Se ejecuta al crear un nuevo usuario desde Google
        ⭐ NUEVO: Inicializar domicilio vacío para nuevos usuarios OAuth
        """
        user = super().save_user(request, sociallogin, form)
        
        if sociallogin.account.provider == 'google':
            extra_data = sociallogin.account.extra_data
            email = extra_data.get('email')
            
            if email and not user.email:
                user.email = email
            
            # ⭐ NUEVO: Asegurar que domicilio esté inicializado
            if not user.domicilio:
                user.domicilio = ''
            
            user.save()
            print(f"✅ Usuario OAuth creado/actualizado: {user.username} -> {email}")
            print(f"🏠 Domicilio inicial: {user.domicilio or 'Vacío (debe configurarse)'}")
        
        return user