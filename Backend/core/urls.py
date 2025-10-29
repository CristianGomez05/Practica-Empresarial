# Backend/core/urls.py
from django.urls import path, include
from rest_framework import routers
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from . import views
from .views_auth import LoginView  # Importar la vista custom

# Crear el router y registrar los ViewSets
router = routers.DefaultRouter()
router.register(r'usuarios', views.UsuarioViewSet)
router.register(r'productos', views.ProductoViewSet)
router.register(r'ofertas', views.OfertaViewSet)
router.register(r'pedidos', views.PedidoViewSet, basename='pedido')
router.register(r'detalles-pedido', views.DetallePedidoViewSet)

urlpatterns = [
    # Router con todos los endpoints REST
    path('', include(router.urls)),

    # --- Login personalizado (NUEVO) ---
    path('auth/login/', LoginView.as_view(), name='custom_login'),

    # --- JWT endpoints (alternativa) ---
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # --- dj-rest-auth (para Google OAuth) ---
    path('auth/', include('dj_rest_auth.urls')),
    path('auth/registration/', include('dj_rest_auth.registration.urls')),
]