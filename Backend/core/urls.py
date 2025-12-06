# Backend/core/urls.py
# ⭐ ACTUALIZADO: Agregadas rutas de recuperación de contraseña

from django.urls import path, include
from rest_framework import routers
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView
from django.shortcuts import redirect
from django.views.generic import View
from . import views
from .views_auth import LoginView
from .views_password import (
    solicitar_recuperacion_password,
    validar_token_recuperacion,
    restablecer_password,
    cambiar_password
)
from .serializers import CustomTokenObtainPairSerializer
from .views_reportes import estadisticas, exportar_reporte


class CustomTokenObtainPairView(TokenObtainPairView):
    """Vista personalizada para login con serializer customizado"""
    serializer_class = CustomTokenObtainPairSerializer


class LoginCancelledView(View):
    """Redirecciona al login del frontend cuando el usuario cancela el OAuth"""
    def get(self, request):
        print("⚠️ Usuario canceló el login de Google")
        from django.conf import settings
        frontend_url = settings.FRONTEND_URL
        return redirect(f'{frontend_url}/login?cancelled=true')


# ============================================================================
# ROUTER
# ============================================================================

router = routers.DefaultRouter()
router.register(r'usuarios', views.UsuarioViewSet, basename='usuario')
router.register(r'productos', views.ProductoViewSet, basename='producto')
router.register(r'ofertas', views.OfertaViewSet, basename='oferta')
router.register(r'pedidos', views.PedidoViewSet, basename='pedido')
router.register(r'detalles-pedido', views.DetallePedidoViewSet, basename='detallepedido')
router.register(r'sucursales', views.SucursalViewSet, basename='sucursal')


# ============================================================================
# URLPATTERNS
# ============================================================================

urlpatterns = [
    # Router
    path('', include(router.urls)),
    
    # Auth endpoints
    path('auth/login/', LoginView.as_view(), name='custom_login'),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('registro/', views.registro_usuario, name='registro'),

    # ⭐⭐⭐ NUEVOS: Password Reset Endpoints
    path('password/solicitar-recuperacion/', solicitar_recuperacion_password, name='solicitar_recuperacion'),
    path('password/validar-token/', validar_token_recuperacion, name='validar_token'),
    path('password/restablecer/', restablecer_password, name='restablecer_password'),
    path('password/cambiar/', cambiar_password, name='cambiar_password'),

    # OAuth personalization
    path('accounts/3rdparty/login/cancelled/', 
         LoginCancelledView.as_view(), 
         name='socialaccount_login_cancelled'),
    
    # Allauth
    path('accounts/', include('allauth.urls')),

    # Reportes
    path('reportes/estadisticas/', estadisticas, name='reportes_estadisticas'),
    path('reportes/exportar/', exportar_reporte, name='reportes_exportar'),
    
    # dj-rest-auth
    path('auth/', include('dj_rest_auth.urls')),
    path('auth/registration/', include('dj_rest_auth.registration.urls')),
]