# Backend/core/urls.py
from django.urls import path, include
from rest_framework import routers
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView
from . import views
from .views_auth import LoginView
from .serializers import CustomTokenObtainPairSerializer

# Vista personalizada que usa nuestro serializer
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

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

    # --- Login personalizado ---
    path('auth/login/', LoginView.as_view(), name='custom_login'),

    # --- JWT endpoints con serializer custom (SOPORTA USERNAME O EMAIL) ---
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # --- Registro de usuarios ---
    path('registro/', views.registro_usuario, name='registro'),

    # --- dj-rest-auth (para Google OAuth) ---
    path('auth/', include('dj_rest_auth.urls')),
    path('auth/registration/', include('dj_rest_auth.registration.urls')),
]