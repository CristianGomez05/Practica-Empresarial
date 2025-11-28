# Backend/core/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from .models import Usuario, Producto, Oferta, Pedido, DetallePedido, Sucursal
from .serializers import (
    UsuarioSerializer, ProductoSerializer, OfertaSerializer,
    PedidoSerializer, PedidoCreateSerializer, DetallePedidoSerializer, SucursalSerializer
)
from .permissions import EsAdministrador, EsClienteOAdmin
from .emails import ejecutar_email_background


class SucursalViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de sucursales"""
    serializer_class = SucursalSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Admin General: Ve todas las sucursales
        Admin Regular: Solo ve su sucursal
        Cliente: No tiene acceso
        """
        user = self.request.user
        
        if user.rol == 'administrador_general':
            return Sucursal.objects.all()
        elif user.rol == 'administrador' and user.sucursal:
            return Sucursal.objects.filter(id=user.sucursal.id)
        else:
            return Sucursal.objects.none()
    
    @action(detail=False, methods=['get'], url_path='activas')
    def activas(self, request):
        """Endpoint para obtener solo sucursales activas"""
        queryset = self.get_queryset().filter(activa=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class UsuarioViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de usuarios"""
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Admin General: Ve todos los usuarios
        Admin Regular: Ve todos los usuarios (solo lectura excepto creación)
        Cliente: Solo ve su propio perfil
        """
        user = self.request.user
        
        if user.rol == 'administrador_general':
            # Admin General ve todos
            return Usuario.objects.all()
        elif user.rol == 'administrador':
            # Admin Regular ve todos los usuarios
            return Usuario.objects.all()
        else:
            # Clientes solo ven su perfil
            return Usuario.objects.filter(id=user.id)
    
    def get_permissions(self):
        """
        Admin General: Puede hacer todo
        Admin Regular: Solo puede crear usuarios, no modificar ni eliminar
        """
        if self.action in ['update', 'partial_update', 'destroy']:
            # Solo Admin General puede modificar/eliminar usuarios
            return [IsAuthenticated()]
        return super().get_permissions()
    
    def update(self, request, *args, **kwargs):
        """Solo Admin General puede actualizar usuarios"""
        if request.user.rol != 'administrador_general':
            return Response(
                {'error': 'Solo el Administrador General puede modificar usuarios'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        """Solo Admin General puede actualizar parcialmente usuarios"""
        if request.user.rol != 'administrador_general':
            return Response(
                {'error': 'Solo el Administrador General puede modificar usuarios'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().partial_update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Solo Admin General puede eliminar usuarios"""
        if request.user.rol != 'administrador_general':
            return Response(
                {'error': 'Solo el Administrador General puede eliminar usuarios'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class ProductoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de productos"""
    serializer_class = ProductoSerializer
    permission_classes = [EsAdministrador]
    
    def get_queryset(self):
        """
        Filtrar productos según el rol y sucursal del usuario
        
        - Admin General: Ve todos los productos de todas las sucursales
        - Admin Regular: Solo ve productos de SU sucursal
        - Cliente: Ve todos los productos disponibles
        """
        user = self.request.user
        queryset = Producto.objects.all()
        
        # Filtro por sucursal del admin regular
        if user.is_authenticated and user.rol == 'administrador':
            if user.sucursal:
                queryset = queryset.filter(sucursal=user.sucursal)
            else:
                # Si no tiene sucursal asignada, no ve nada
                return Producto.objects.none()
        
        # Filtro opcional por parámetro (para Admin General)
        sucursal_id = self.request.query_params.get('sucursal', None)
        if sucursal_id:
            queryset = queryset.filter(sucursal_id=sucursal_id)
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Al crear un producto:
        - Admin General: Puede asignar cualquier sucursal
        - Admin Regular: Auto-asigna su sucursal
        """
        user = self.request.user
        
        if user.rol == 'administrador':
            # Admin Regular: forzar su sucursal
            if not user.sucursal:
                raise serializers.ValidationError({
                    'error': 'Tu usuario no tiene una sucursal asignada. Contacta al administrador.'
                })
            serializer.save(sucursal=user.sucursal)
        else:
            # Admin General: puede elegir
            serializer.save()


class OfertaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de ofertas"""
    serializer_class = OfertaSerializer
    permission_classes = [EsAdministrador]
    
    def get_queryset(self):
        """
        Filtrar ofertas según el rol y sucursal del usuario
        
        - Admin General: Ve todas las ofertas
        - Admin Regular: Solo ve ofertas de SU sucursal
        - Cliente: Ve todas las ofertas activas
        """
        user = self.request.user
        queryset = Oferta.objects.prefetch_related('productos', 'productooferta_set')
        
        # Filtro por sucursal del admin regular
        if user.is_authenticated and user.rol == 'administrador':
            if user.sucursal:
                queryset = queryset.filter(sucursal=user.sucursal)
            else:
                # Si no tiene sucursal asignada, no ve nada
                return Oferta.objects.none()
        
        # Filtro opcional por parámetro (para Admin General)
        sucursal_id = self.request.query_params.get('sucursal', None)
        if sucursal_id:
            queryset = queryset.filter(sucursal_id=sucursal_id)
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Al crear una oferta:
        - Admin General: Puede asignar cualquier sucursal
        - Admin Regular: Auto-asigna su sucursal
        """
        user = self.request.user
        
        if user.rol == 'administrador':
            # Admin Regular: forzar su sucursal
            if not user.sucursal:
                raise serializers.ValidationError({
                    'error': 'Tu usuario no tiene una sucursal asignada. Contacta al administrador.'
                })
            oferta = serializer.save(sucursal=user.sucursal)
        else:
            # Admin General: puede elegir
            oferta = serializer.save()
        
        # Enviar emails en background
        from .emails import enviar_notificacion_oferta
        ejecutar_email_background(enviar_notificacion_oferta, oferta.id)
        
        return oferta


class PedidoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de pedidos"""
    permission_classes = [EsClienteOAdmin]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PedidoCreateSerializer
        return PedidoSerializer
    
    def get_queryset(self):
        """
        Filtrar pedidos según el rol y sucursal
        
        - Admin General: Ve todos los pedidos
        - Admin Regular: Ve pedidos de productos de SU sucursal
        - Cliente: Solo ve sus propios pedidos
        """
        user = self.request.user
        
        if user.rol == 'administrador_general':
            # Admin General ve todos los pedidos
            queryset = Pedido.objects.all()
        elif user.rol == 'administrador':
            # Admin Regular solo ve pedidos que contengan productos de su sucursal
            if user.sucursal:
                queryset = Pedido.objects.filter(
                    detalles__producto__sucursal=user.sucursal
                ).distinct()
            else:
                return Pedido.objects.none()
        else:
            # Cliente solo ve sus propios pedidos
            queryset = Pedido.objects.filter(usuario=user)
        
        return queryset.select_related('usuario').prefetch_related('detalles__producto')
    
    def perform_create(self, serializer):
        """Crear pedido y enviar notificaciones"""
        pedido = serializer.save()
        
        # Enviar emails en background
        from .emails import enviar_confirmacion_pedido
        ejecutar_email_background(enviar_confirmacion_pedido, pedido.id)
        
        return pedido
    
    @action(detail=True, methods=['patch'], url_path='cambiar_estado')
    def cambiar_estado(self, request, pk=None):
        """Cambiar el estado de un pedido"""
        pedido = self.get_object()
        nuevo_estado = request.data.get('estado')
        
        estados_validos = ['recibido', 'en_preparacion', 'listo', 'entregado']
        if nuevo_estado not in estados_validos:
            return Response(
                {'error': f'Estado inválido. Debe ser uno de: {", ".join(estados_validos)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        pedido.estado = nuevo_estado
        pedido.save()
        
        # Enviar notificación al cliente
        from .emails import enviar_actualizacion_estado
        ejecutar_email_background(enviar_actualizacion_estado, pedido.id)
        
        serializer = self.get_serializer(pedido)
        return Response(serializer.data)


class DetallePedidoViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet de solo lectura para detalles de pedidos"""
    queryset = DetallePedido.objects.all()
    serializer_class = DetallePedidoSerializer
    permission_classes = [IsAuthenticated]