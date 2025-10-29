# Backend/core/views.py
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Sum, Count
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Usuario, Producto, Oferta, Pedido, DetallePedido
from .serializers import (
    UsuarioSerializer, 
    ProductoSerializer, 
    OfertaSerializer, 
    PedidoSerializer, 
    DetallePedidoSerializer
)
from .permissions import EsAdministrador, EsClienteOAdmin


class UsuarioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de usuarios
    Solo administradores pueden ver y modificar usuarios
    """
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [EsAdministrador]
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        Endpoint para obtener información del usuario actual
        GET /core/usuarios/me/
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class ProductoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para productos
    - Lectura pública
    - Escritura solo para administradores
    """
    queryset = Producto.objects.filter(disponible=True)
    serializer_class = ProductoSerializer
    
    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [AllowAny()]
        return [EsAdministrador()]
    
    @action(detail=False, methods=['get'])
    def destacados(self, request):
        """
        Obtiene productos destacados (los más caros o con ofertas)
        GET /core/productos/destacados/
        """
        productos = Producto.objects.filter(
            disponible=True
        ).order_by('-precio')[:6]
        serializer = self.get_serializer(productos, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def buscar(self, request):
        """
        Busca productos por nombre o descripción
        GET /core/productos/buscar/?q=croissant
        """
        query = request.query_params.get('q', '')
        if query:
            productos = Producto.objects.filter(
                Q(nombre__icontains=query) | Q(descripcion__icontains=query),
                disponible=True
            )
        else:
            productos = Producto.objects.filter(disponible=True)
        
        serializer = self.get_serializer(productos, many=True)
        return Response(serializer.data)


class OfertaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para ofertas
    - Lectura pública
    - CRUD completo para administradores
    - Envío automático de notificaciones al crear
    """
    queryset = Oferta.objects.all()
    serializer_class = OfertaSerializer
    
    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [AllowAny()]
        return [EsAdministrador()]
    
    def get_queryset(self):
        return Oferta.objects.select_related('producto').all()
    
    @action(detail=False, methods=['get'])
    def activas(self, request):
        """
        Obtiene solo las ofertas activas (vigentes)
        GET /core/ofertas/activas/
        """
        hoy = timezone.now().date()
        ofertas = Oferta.objects.filter(
            fecha_inicio__lte=hoy,
            fecha_fin__gte=hoy
        ).select_related('producto')
        serializer = self.get_serializer(ofertas, many=True)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        """
        Al crear una oferta, se envía notificación automática
        """
        oferta = serializer.save()
        # El signal se encarga de enviar el correo automáticamente
        return Response({
            'message': 'Oferta creada y notificaciones enviadas',
            'oferta': OfertaSerializer(oferta).data
        }, status=status.HTTP_201_CREATED)
    
    def perform_destroy(self, instance):
        """
        Eliminar oferta
        """
        instance.delete()
        return Response({
            'message': 'Oferta eliminada exitosamente'
        }, status=status.HTTP_204_NO_CONTENT)


class PedidoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para pedidos
    - Clientes: solo ven y crean sus propios pedidos
    - Administradores: ven todos los pedidos y pueden cambiar estados
    """
    serializer_class = PedidoSerializer
    permission_classes = [IsAuthenticated, EsClienteOAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.rol == 'administrador':
            return Pedido.objects.select_related('usuario').prefetch_related('detalles__producto').all()
        return Pedido.objects.filter(usuario=user).prefetch_related('detalles__producto').all()

    def perform_create(self, serializer):
        """
        Crear pedido con detalles y calcular total
        POST /core/pedidos/
        Body: {
            "items": [
                {"producto": 1, "cantidad": 2},
                {"producto": 3, "cantidad": 1}
            ]
        }
        """
        items_data = self.request.data.get('items', [])
        
        if not items_data:
            return Response({
                'error': 'Debe incluir al menos un producto'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar que todos los productos existan y estén disponibles
        for item in items_data:
            try:
                producto = Producto.objects.get(id=item['producto'], disponible=True)
            except Producto.DoesNotExist:
                return Response({
                    'error': f'Producto {item["producto"]} no disponible'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Crear el pedido
        pedido = serializer.save(usuario=self.request.user)
        
        # Crear detalles y calcular total
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
        
        # Actualizar total
        pedido.total = total
        pedido.save()
        
        # El signal enviará la confirmación automáticamente
        return pedido
    
    @action(detail=True, methods=['patch'], permission_classes=[EsAdministrador])
    def cambiar_estado(self, request, pk=None):
        """
        Cambiar el estado de un pedido (solo administradores)
        PATCH /core/pedidos/{id}/cambiar_estado/
        Body: {"estado": "en_preparacion"}
        """
        pedido = self.get_object()
        nuevo_estado = request.data.get('estado')
        
        estados_validos = ['recibido', 'en_preparacion', 'listo', 'entregado']
        if nuevo_estado not in estados_validos:
            return Response({
                'error': f'Estado inválido. Debe ser uno de: {", ".join(estados_validos)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        pedido.estado = nuevo_estado
        pedido.save(update_fields=['estado'])
        
        # El signal enviará la notificación automáticamente
        serializer = self.get_serializer(pedido)
        return Response({
            'message': 'Estado actualizado',
            'pedido': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def mis_pedidos(self, request):
        """
        Obtiene todos los pedidos del usuario actual
        GET /core/pedidos/mis_pedidos/
        """
        pedidos = Pedido.objects.filter(
            usuario=request.user
        ).prefetch_related('detalles__producto').order_by('-fecha')
        
        serializer = self.get_serializer(pedidos, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[EsAdministrador])
    def estadisticas(self, request):
        """
        Estadísticas de pedidos (solo administradores)
        GET /core/pedidos/estadisticas/
        """
        # Pedidos por estado
        por_estado = Pedido.objects.values('estado').annotate(
            total=Count('id')
        )
        
        # Total de ventas
        total_ventas = Pedido.objects.aggregate(
            total=Sum('total')
        )['total'] or 0
        
        # Pedidos del mes actual
        mes_actual = timezone.now().replace(day=1)
        pedidos_mes = Pedido.objects.filter(
            fecha__gte=mes_actual
        ).count()
        
        # Productos más vendidos
        mas_vendidos = DetallePedido.objects.values(
            'producto__nombre'
        ).annotate(
            total_vendido=Sum('cantidad')
        ).order_by('-total_vendido')[:5]
        
        return Response({
            'por_estado': list(por_estado),
            'total_ventas': float(total_ventas),
            'pedidos_mes_actual': pedidos_mes,
            'productos_mas_vendidos': list(mas_vendidos)
        })


class DetallePedidoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para detalles de pedidos
    """
    queryset = DetallePedido.objects.select_related('producto', 'pedido').all()
    serializer_class = DetallePedidoSerializer
    permission_classes = [IsAuthenticated]