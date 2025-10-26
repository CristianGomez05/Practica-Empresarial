# Backend/core/views.py
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Usuario, Producto, Oferta, Pedido, DetallePedido
from .serializers import (
    UsuarioSerializer, 
    ProductoSerializer, 
    OfertaSerializer, 
    PedidoSerializer, 
    DetallePedidoSerializer
)
from .permissions import EsAdministrador, EsClienteOAdmin


# --- Usuarios (solo administradores pueden ver todos) ---
class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [EsAdministrador]


# --- Productos (públicos para lectura, admin para CRUD) ---
class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.filter(disponible=True)
    serializer_class = ProductoSerializer
    
    def get_permissions(self):
        # Lecturas públicas (GET) para todos
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [AllowAny()]
        return [EsAdministrador()]


# --- Ofertas (públicas para lectura, admin para CRUD) ---
class OfertaViewSet(viewsets.ModelViewSet):
    queryset = Oferta.objects.all()
    serializer_class = OfertaSerializer
    
    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [AllowAny()]
        return [EsAdministrador()]
    
    def get_queryset(self):
        # Retornar ofertas con información del producto
        return Oferta.objects.select_related('producto').all()


# --- Pedidos (clientes solo los suyos, admin todos) ---
class PedidoViewSet(viewsets.ModelViewSet):
    serializer_class = PedidoSerializer
    permission_classes = [IsAuthenticated, EsClienteOAdmin]

    def get_queryset(self):
        user = self.request.user
        # Administrador ve todos los pedidos
        if user.rol == 'administrador':
            return Pedido.objects.select_related('usuario').prefetch_related('detalles__producto').all()
        # Cliente solo ve sus pedidos
        return Pedido.objects.filter(usuario=user).prefetch_related('detalles__producto').all()

    def perform_create(self, serializer):
        # Asocia automáticamente el pedido al usuario autenticado
        pedido = serializer.save(usuario=self.request.user)
        
        # Crear los detalles del pedido desde el request
        items_data = self.request.data.get('items', [])
        total = 0
        
        for item_data in items_data:
            producto = Producto.objects.get(id=item_data['producto'])
            cantidad = item_data['cantidad']
            
            DetallePedido.objects.create(
                pedido=pedido,
                producto=producto,
                cantidad=cantidad
            )
            
            total += producto.precio * cantidad
        
        # Actualizar el total del pedido si no viene en el request
        if not serializer.validated_data.get('total'):
            pedido.total = total
            pedido.save()
        
        return pedido


# --- Detalles de Pedido (solo accesibles dentro del pedido) ---
class DetallePedidoViewSet(viewsets.ModelViewSet):
    queryset = DetallePedido.objects.select_related('producto', 'pedido').all()
    serializer_class = DetallePedidoSerializer
    permission_classes = [IsAuthenticated]