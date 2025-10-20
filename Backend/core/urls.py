from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views_auth import LoginView
from .views import UsuarioViewSet, ProductoViewSet, OfertaViewSet, PedidoViewSet, DetallePedidoViewSet

router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet)
router.register(r'productos', ProductoViewSet)
router.register(r'ofertas', OfertaViewSet)
router.register(r'pedidos', PedidoViewSet)
router.register(r'detalles', DetallePedidoViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', LoginView.as_view(), name='login'),
]
