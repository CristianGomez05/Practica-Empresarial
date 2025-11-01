# Backend/core/views.py
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q, Sum, Count
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from django.db import transaction
from .emails import enviar_alerta_stock_agotado
from .models import Usuario, Producto, Oferta, Pedido, DetallePedido
from .serializers import (
    UsuarioSerializer, 
    ProductoSerializer, 
    OfertaSerializer, 
    PedidoSerializer, 
    DetallePedidoSerializer,
    UsuarioRegistroSerializer  # Ya está importado desde serializers.py
)
from .permissions import EsAdministrador, EsClienteOAdmin


# ============================================================================
# NUEVO: Endpoint de Registro
# ============================================================================
@api_view(['POST'])
@permission_classes([AllowAny])
def registro_usuario(request):
    """
    Endpoint para registrar nuevos usuarios
    POST /core/registro/
    Body: {
        "username": "usuario123",
        "email": "usuario@example.com",
        "password": "contraseña_segura",
        "first_name": "Nombre",
        "last_name": "Apellido"
    }
    """
    serializer = UsuarioRegistroSerializer(data=request.data)
    
    if serializer.is_valid():
        usuario = serializer.save()
        return Response({
            'message': 'Usuario registrado exitosamente',
            'user': {
                'id': usuario.id,
                'username': usuario.username,
                'email': usuario.email,
                'first_name': usuario.first_name,
                'last_name': usuario.last_name,
                'rol': usuario.rol
            }
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [EsAdministrador]
    
    @action(detail=False, methods=['get', 'patch'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        Endpoint para obtener/actualizar información del usuario actual
        GET /core/usuarios/me/
        PATCH /core/usuarios/me/
        """
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        
        elif request.method == 'PATCH':
            # Permitir actualizar solo ciertos campos
            allowed_fields = ['first_name', 'last_name']
            data = {k: v for k, v in request.data.items() if k in allowed_fields}
            
            serializer = self.get_serializer(request.user, data=data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            
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
        # Usar prefetch_related porque ahora productos es ManyToMany
        return Oferta.objects.prefetch_related('productos').all()
    
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
        ).prefetch_related('productos')
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
    
    @transaction.atomic
    def perform_create(self, serializer):
        """
        Crear pedido con detalles, calcular total y REDUCIR STOCK
        """
        items_data = self.request.data.get('items', [])
        
        if not items_data:
            return Response({
                'error': 'Debe incluir al menos un producto'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # VALIDACIÓN 1: Verificar que todos los productos existan y estén disponibles
        for item in items_data:
            try:
                producto = Producto.objects.select_for_update().get(
                    id=item['producto'], 
                    disponible=True
                )
                
                # VALIDACIÓN 2: Verificar que haya stock suficiente
                if producto.stock < item['cantidad']:
                    return Response({
                        'error': f'Stock insuficiente para {producto.nombre}. '
                                f'Disponible: {producto.stock}, Solicitado: {item["cantidad"]}'
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
            except Producto.DoesNotExist:
                return Response({
                    'error': f'Producto {item["producto"]} no disponible'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Crear el pedido
        pedido = serializer.save(usuario=self.request.user)
        
        # Crear detalles, calcular total y REDUCIR STOCK
        total = Decimal('0.00')
        productos_agotados = []
        
        for item_data in items_data:
            producto = Producto.objects.select_for_update().get(id=item_data['producto'])
            cantidad = item_data['cantidad']
            
            # Usar precio personalizado si se proporciona (para ofertas)
            if 'precio_unitario' in item_data:
                precio_unitario = Decimal(str(item_data['precio_unitario']))
            else:
                precio_unitario = producto.precio
            
            # Crear detalle del pedido
            DetallePedido.objects.create(
                pedido=pedido,
                producto=producto,
                cantidad=cantidad
            )
            
            # Calcular total
            total += precio_unitario * cantidad
            
            # ⭐ REDUCIR STOCK
            stock_anterior = producto.stock
            producto.stock -= cantidad
            
            # Si el stock llega a 0, marcar como no disponible
            if producto.stock == 0:
                producto.disponible = False
                productos_agotados.append(producto)
                print(f"⚠️ Producto {producto.nombre} (ID: {producto.id}) se ha AGOTADO")
            
            producto.save(update_fields=['stock', 'disponible'])
            
            print(f"📦 Stock reducido: {producto.nombre} | "
                  f"Anterior: {stock_anterior} | Nuevo: {producto.stock}")
        
        # Actualizar total del pedido
        pedido.total = total
        pedido.save(update_fields=['total'])
        
        # ⭐ ENVIAR ALERTAS DE STOCK AGOTADO
        for producto_agotado in productos_agotados:
            # Solo enviar si no se ha enviado antes
            if not producto_agotado.alerta_stock_enviada:
                try:
                    enviar_alerta_stock_agotado(producto_agotado.id)
                except Exception as e:
                    print(f"❌ Error al enviar alerta para {producto_agotado.nombre}: {e}")
        
        return pedido


class PedidoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para pedidos
    - Clientes: solo ven y crean sus propios pedidos
    - Administradores: ven todos los pedidos y pueden cambiar estados
    - Soporta precios personalizados para ofertas
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
        Ahora soporta precios personalizados para ofertas
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
        total = Decimal('0.00')
        
        for item_data in items_data:
            producto = Producto.objects.get(id=item_data['producto'])
            cantidad = item_data['cantidad']
            
            # Usar precio personalizado si se proporciona (para ofertas)
            if 'precio_unitario' in item_data:
                precio_unitario = Decimal(str(item_data['precio_unitario']))
            else:
                precio_unitario = producto.precio
            
            DetallePedido.objects.create(
                pedido=pedido,
                producto=producto,
                cantidad=cantidad
            )
            
            total += precio_unitario * cantidad
        
        pedido.total = total
        pedido.save()
        
        return pedido
    
    @action(detail=True, methods=['patch'], permission_classes=[EsAdministrador])
    def cambiar_estado(self, request, pk=None):
        """
        Cambiar el estado de un pedido (solo administradores)
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
        
        serializer = self.get_serializer(pedido)
        return Response({
            'message': 'Estado actualizado',
            'pedido': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def mis_pedidos(self, request):
        """
        Obtiene todos los pedidos del usuario actual
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
        """
        por_estado = Pedido.objects.values('estado').annotate(
            total=Count('id')
        )
        
        total_ventas = Pedido.objects.aggregate(
            total=Sum('total')
        )['total'] or 0
        
        mes_actual = timezone.now().replace(day=1)
        pedidos_mes = Pedido.objects.filter(
            fecha__gte=mes_actual
        ).count()
        
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