# Backend/core/urls.py
# ⭐ COMPLETO: Incluye todos los endpoints incluyendo /usuarios/me/

from django.urls import path, include
from rest_framework import routers
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView
from . import views
from .views_auth import LoginView
from .serializers import CustomTokenObtainPairSerializer
from .views_reportes import estadisticas, exportar_reporte


class CustomTokenObtainPairView(TokenObtainPairView):
    """Vista personalizada para login con serializer customizado"""
    serializer_class = CustomTokenObtainPairSerializer


# ============================================================================
# ROUTER
# ============================================================================

router = routers.DefaultRouter()
router.register(r'usuarios', views.UsuarioViewSet)
router.register(r'productos', views.ProductoViewSet)
router.register(r'ofertas', views.OfertaViewSet)
router.register(r'pedidos', views.PedidoViewSet, basename='pedido')
router.register(r'detalles-pedido', views.DetallePedidoViewSet)
router.register(r'sucursales', views.SucursalViewSet)


# ============================================================================
# URLPATTERNS
# ============================================================================

urlpatterns = [
    # Router (incluye automáticamente /usuarios/me/ gracias al @action en UsuarioViewSet)
    path('', include(router.urls)),
    
    # Auth endpoints
    path('auth/login/', LoginView.as_view(), name='custom_login'),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('registro/', views.registro_usuario, name='registro'),

    # Reportes endpoints
    path('reportes/estadisticas/', estadisticas, name='reportes_estadisticas'),
    path('reportes/exportar/', exportar_reporte, name='reportes_exportar'),
    
    # dj-rest-auth (opcional si lo usas)
    path('auth/', include('dj_rest_auth.urls')),
    path('auth/registration/', include('dj_rest_auth.registration.urls')),
]


# ============================================================================
# ENDPOINTS DISPONIBLES
# ============================================================================
"""
USUARIOS:
  GET     /api/usuarios/              - Listar usuarios (según permisos)
  POST    /api/usuarios/              - Crear usuario (solo admin_general)
  GET     /api/usuarios/{id}/         - Ver usuario específico
  PUT     /api/usuarios/{id}/         - Actualizar usuario (solo admin_general)
  PATCH   /api/usuarios/{id}/         - Actualizar parcial (solo admin_general)
  DELETE  /api/usuarios/{id}/         - Eliminar usuario (solo admin_general)
  GET     /api/usuarios/me/           - Ver perfil propio ⭐ NUEVO
  PATCH   /api/usuarios/me/           - Actualizar perfil propio (domicilio) ⭐ NUEVO

SUCURSALES:
  GET     /api/sucursales/            - Listar sucursales
  POST    /api/sucursales/            - Crear sucursal (solo admins)
  GET     /api/sucursales/{id}/       - Ver sucursal específica
  PUT     /api/sucursales/{id}/       - Actualizar sucursal (solo admins)
  PATCH   /api/sucursales/{id}/       - Actualizar parcial (solo admins)
  DELETE  /api/sucursales/{id}/       - Eliminar sucursal (solo admins)
  GET     /api/sucursales/activas/    - Listar solo sucursales activas

PRODUCTOS:
  GET     /api/productos/             - Listar productos (filtrado por sucursal)
  POST    /api/productos/             - Crear producto (solo admins)
  GET     /api/productos/{id}/        - Ver producto específico
  PUT     /api/productos/{id}/        - Actualizar producto (solo admins)
  PATCH   /api/productos/{id}/        - Actualizar parcial (solo admins)
  DELETE  /api/productos/{id}/        - Eliminar producto (solo admins)

OFERTAS:
  GET     /api/ofertas/               - Listar ofertas (filtrado por sucursal)
  POST    /api/ofertas/               - Crear oferta (solo admins)
  GET     /api/ofertas/{id}/          - Ver oferta específica
  PUT     /api/ofertas/{id}/          - Actualizar oferta (solo admins)
  PATCH   /api/ofertas/{id}/          - Actualizar parcial (solo admins)
  DELETE  /api/ofertas/{id}/          - Eliminar oferta (solo admins)

PEDIDOS:
  GET     /api/pedidos/               - Listar pedidos (según permisos)
  POST    /api/pedidos/               - Crear pedido (valida domicilio) ⭐ ACTUALIZADO
  GET     /api/pedidos/{id}/          - Ver pedido específico
  PATCH   /api/pedidos/{id}/cambiar_estado/ - Cambiar estado del pedido

DETALLES PEDIDO:
  GET     /api/detalles-pedido/       - Listar detalles (solo lectura)
  GET     /api/detalles-pedido/{id}/  - Ver detalle específico

AUTH:
  POST    /api/auth/login/            - Login con username o email
  POST    /api/token/                 - Obtener token JWT
  POST    /api/token/refresh/         - Refrescar token JWT
  POST    /api/registro/              - Registrar nuevo usuario

REPORTES:
  GET     /api/reportes/estadisticas/ - Estadísticas generales
  POST    /api/reportes/exportar/     - Exportar reporte
"""