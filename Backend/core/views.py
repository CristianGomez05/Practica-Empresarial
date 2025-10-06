from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Usuario, Producto, Oferta, Pedido, DetallePedido
from .serializers import UsuarioSerializer, ProductoSerializer, OfertaSerializer, PedidoSerializer, DetallePedidoSerializer
from .permissions import EsAdministrador, EsClienteOAdmin


# --- Usuarios (solo administradores pueden ver todos) ---
class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [EsAdministrador]


# --- Productos (públicos para lectura, admin para CRUD) ---
class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    permission_classes = [EsAdministrador]

    def get_permissions(self):
        # Lecturas públicas (GET) para todos
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [AllowAny()]
        return [perm() for perm in self.permission_classes]


# --- Ofertas (públicas para lectura, admin para CRUD) ---
class OfertaViewSet(viewsets.ModelViewSet):
    queryset = Oferta.objects.all()
    serializer_class = OfertaSerializer
    permission_classes = [EsAdministrador]

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [AllowAny()]
        return [perm() for perm in self.permission_classes]


# --- Pedidos (clientes solo los suyos, admin todos) ---
class PedidoViewSet(viewsets.ModelViewSet):
    queryset = Pedido.objects.all()
    serializer_class = PedidoSerializer
    permission_classes = [IsAuthenticated, EsClienteOAdmin]

    def get_queryset(self):
        user = self.request.user
        # Administrador ve todos los pedidos
        if user.rol == 'administrador':
            return Pedido.objects.all()
        # Cliente solo ve sus pedidos
        return Pedido.objects.filter(usuario=user)

    def perform_create(self, serializer):
        # Asocia automáticamente el pedido al usuario autenticado
        serializer.save(usuario=self.request.user)


# --- Detalles de Pedido (solo accesibles dentro del pedido) ---
class DetallePedidoViewSet(viewsets.ModelViewSet):
    queryset = DetallePedido.objects.all()
    serializer_class = DetallePedidoSerializer
    permission_classes = [IsAuthenticated]
