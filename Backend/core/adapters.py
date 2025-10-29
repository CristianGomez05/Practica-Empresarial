# Backend/core/adapters.py
from allauth.account.adapter import DefaultAccountAdapter
from rest_framework_simplejwt.tokens import RefreshToken
from urllib.parse import urlencode

class FrontendRedirectAccountAdapter(DefaultAccountAdapter):
    """
    Genera tokens JWT y redirige al frontend con el fragmento #access=...&refresh=...
    """
    def get_login_redirect_url(self, request):
        user = request.user
        if not user or not user.is_authenticated:
            return super().get_login_redirect_url(request)

        # Generar tokens con información personalizada
        refresh = RefreshToken.for_user(user)
        
        # Agregar claims personalizados al token
        refresh['username'] = user.username
        refresh['email'] = user.email
        refresh['rol'] = user.rol
        refresh['first_name'] = user.first_name
        refresh['last_name'] = user.last_name
        
        access = str(refresh.access_token)
        refresh_str = str(refresh)

        # Fragmento con los tokens (no se envía en Referer)
        fragment = urlencode({
            "access": access,
            "refresh": refresh_str,
        })

        # IMPORTANTE: Usar la URL correcta del frontend
        frontend_url = "http://localhost:5173/dashboard"
        redirect_url = f"{frontend_url}#{fragment}"
        
        print(f"🔗 Redirigiendo a: {redirect_url}")
        print(f"👤 Usuario: {user.username} | Rol: {user.rol}")
        
        return redirect_url