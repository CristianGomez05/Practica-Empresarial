# core/adapters.py
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

        # Generar tokens
        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)
        refresh_str = str(refresh)

        # Fragmento con los tokens (no se envía en Referer)
        fragment = urlencode({
            "access": access,
            "refresh": refresh_str,
        })

        frontend_url = "http://localhost:5173/dashboard"
        return f"{frontend_url}#{fragment}"
