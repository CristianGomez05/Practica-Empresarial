# Backend/core/urls.py

from django.urls import path, include
from rest_framework import routers
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView
from . import views
from .views_auth import LoginView
from .serializers import CustomTokenObtainPairSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

# Router
router = routers.DefaultRouter()
router.register(r'usuarios', views.UsuarioViewSet)
router.register(r'productos', views.ProductoViewSet)
router.register(r'ofertas', views.OfertaViewSet)
router.register(r'pedidos', views.PedidoViewSet, basename='pedido')
router.register(r'detalles-pedido', views.DetallePedidoViewSet)
router.register(r'sucursales', views.SucursalViewSet)  # ⭐ NUEVO

urlpatterns = [
    # Router (sin prefijo adicional)
    path('', include(router.urls)),
    
    # Auth
    path('auth/login/', LoginView.as_view(), name='custom_login'),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('registro/', views.registro_usuario, name='registro'),
    
    # dj-rest-auth
    path('auth/', include('dj_rest_auth.urls')),
    path('auth/registration/', include('dj_rest_auth.registration.urls')),
]