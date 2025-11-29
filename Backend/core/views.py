# Backend/core/views.py
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q, Prefetch
from django.db import transaction
from django.core.cache import cache
from .emails import enviar_alerta_stock_bajo
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Usuario, Producto, Oferta, ProductoOferta, Pedido, DetallePedido, Sucursal

from .serializers import (
    UsuarioSerializer,
    ProductoSerializer, 
    OfertaSerializer, 
    PedidoSerializer, 
    DetallePedidoSerializer,
    SucursalSerializer
)
from .permissions import EsAdministrador, EsClienteOAdmin


@api_view(['POST'])
@permission_classes([AllowAny])
def registro_usuario(request):
    """Endpoint para registrar nuevos usuarios"""
    print("\n" + "="*60)
    print("📝 REGISTRO DE USUARIO")
    print("="*60)
    
    serializer = UsuarioSerializer(data=request.data)
    
    if serializer.is_valid():
        password = request.data.get('password')
        if not password:
            return Response({
                'error': 'La contraseña es requerida'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        usuario = Usuario.objects.create_user(
            username=request.data['username'],
            email=request.data['email'],
            password=password,
            first_name=request.data.get('first_name', ''),
            last_name=request.data.get('last_name', ''),
            rol=request.data.get('rol', 'cliente')
        )
        
        print(f"✅ Usuario creado: {usuario.username}")
        
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
    
    print(f"❌ Errores: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================================================
# USUARIO VIEWSET - COMPLETO Y CORREGIDO
# ============================================================================

class UsuarioViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar usuarios con restricciones por rol"""
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin General: Ve TODOS los usuarios
        if user.rol == 'administrador_general':
            print(f"🔓 Admin General - Mostrando TODOS los usuarios")
            return Usuario.objects.all().order_by('-date_joined')
        
        # Admin Regular: Solo VE pero NO puede modificar
        elif user.rol == 'administrador':
            print(f"👁️ Admin Regular - Solo puede VER usuarios")
            return Usuario.objects.all().order_by('-date_joined')
        
        # Cliente: Solo su perfil
        elif user.rol == 'cliente':
            print(f"🔒 Cliente - Solo su perfil")
            return Usuario.objects.filter(id=user.id)
        
        return Usuario.objects.none()
    
    def create(self, request, *args, **kwargs):
        """Solo admin general puede crear usuarios"""
        user = request.user
        
        print(f"🆕 CREATE - Usuario: {user.username}, Rol: {user.rol}")
        
        if user.rol != 'administrador_general':
            return Response({
                'error': 'Solo el administrador general puede crear usuarios'
            }, status=status.HTTP_403_FORBIDDEN)
        
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """Solo admin general puede editar usuarios"""
        user = request.user
        
        print(f"✏️ UPDATE - Usuario: {user.username}, Rol: {user.rol}")
        
        if user.rol != 'administrador_general':
            return Response({
                'error': 'Solo el administrador general puede modificar usuarios'
            }, status=status.HTTP_403_FORBIDDEN)
        
        return super().update(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        """Solo admin general puede hacer PATCH"""
        user = request.user
        
        print(f"✏️ PATCH - Usuario: {user.username}, Rol: {user.rol}")
        
        if user.rol != 'administrador_general':
            return Response({
                'error': 'Solo el administrador general puede modificar usuarios'
            }, status=status.HTTP_403_FORBIDDEN)
        
        return super().partial_update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Solo admin general puede eliminar usuarios"""
        user = request.user
        instance = self.get_object()
        
        print(f"🗑️ DELETE - Usuario: {user.username}, Rol: {user.rol}")
        
        if user.rol != 'administrador_general':
            return Response({
                'error': 'Solo el administrador general puede eliminar usuarios'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if instance.id == user.id:
            return Response({
                'error': 'No puedes eliminar tu propia cuenta'
            }, status=status.HTTP_403_FORBIDDEN)
        
        return super().destroy(request, *args, **kwargs)


# ============================================================================
# SUCURSAL VIEWSET
# ============================================================================

class SucursalViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar sucursales"""
    queryset = Sucursal.objects.all()
    serializer_class = SucursalSerializer
    permission_classes = [AllowAny]
    
    def get_permissions(self):
        """Solo admins pueden crear/editar/eliminar sucursales"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]
    
    def get_queryset(self):
        """Filtrar sucursales según el rol del usuario"""
        user = self.request.user
        
        if not user.is_authenticated:
            print(f"🏪 Usuario no autenticado - Mostrando sucursales activas")
            return Sucursal.objects.filter(activa=True).order_by('nombre')
        
        if user.rol == 'administrador_general':
            print(f"🏪 Admin General - Mostrando TODAS las sucursales")
            return Sucursal.objects.all().order_by('nombre')
        
        elif user.rol == 'administrador':
            print(f"🏪 Admin Regular - Mostrando sucursales activas")
            return Sucursal.objects.filter(activa=True).order_by('nombre')
        
        elif user.rol == 'cliente':
            print(f"🏪 Cliente - Mostrando sucursales activas")
            return Sucursal.objects.filter(activa=True).order_by('nombre')
        
        return Sucursal.objects.none()
    
    @action(detail=False, methods=['get'])
    def activas(self, request):
        """
        Retorna solo sucursales activas.
        Endpoint: /api/sucursales/activas/
        """
        print(f"\n{'='*60}")
        print(f"🏪 GET /api/sucursales/activas/")
        print(f"{'='*60}")
        
        sucursales = Sucursal.objects.filter(activa=True).order_by('nombre')
        
        print(f"✅ Sucursales activas encontradas: {sucursales.count()}")
        for s in sucursales:
            print(f"   - {s.nombre} (ID: {s.id})")
        print(f"{'='*60}\n")
        
        serializer = self.get_serializer(sucursales, many=True)
        return Response(serializer.data)


# ============================================================================
# PRODUCTO VIEWSET - CORREGIDO
# ============================================================================

class ProductoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar productos con filtro de sucursal"""
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_queryset(self):
        """Filtrar productos según rol y sucursal del usuario"""
        user = self.request.user
        
        if not user.is_authenticated or user.rol == 'cliente':
            return Producto.objects.filter(sucursal__activa=True).order_by('-id')
        
        if user.rol == 'administrador_general':
            sucursal_id = self.request.query_params.get('sucursal')
            if sucursal_id:
                return Producto.objects.filter(sucursal_id=sucursal_id).order_by('-id')
            return Producto.objects.all().order_by('-id')
        
        if user.rol == 'administrador' and user.sucursal:
            return Producto.objects.filter(sucursal=user.sucursal).order_by('-id')
        
        return Producto.objects.none()
    
    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [AllowAny()]
        return [EsAdministrador()]
    
    def perform_create(self, serializer):
        """Auto-asignar sucursal del admin regular al crear"""
        user = self.request.user
        
        print(f"\n{'='*60}")
        print(f"📦 CREANDO PRODUCTO - Usuario: {user.username} (Rol: {user.rol})")
        print(f"{'='*60}")
        
        # ⭐ FIX: Si es admin regular, forzar su sucursal
        if user.rol == 'administrador' and user.sucursal:
            producto = serializer.save(sucursal=user.sucursal)
            print(f"✅ Producto creado en sucursal: {user.sucursal.nombre}")
            print(f"   ID: {producto.id}, Nombre: {producto.nombre}")
        else:
            # Admin general - guardar con la sucursal que viene en el request
            cache.delete('productos_list')
            producto = serializer.save()
            print(f"✅ Producto creado: {producto.nombre} (ID: {producto.id})")
            if producto.sucursal:
                print(f"   Sucursal: {producto.sucursal.nombre}")
        
        print(f"{'='*60}\n")
        
        # Enviar notificación
        try:
            from .emails import enviar_notificacion_nuevo_producto
            enviar_notificacion_nuevo_producto(producto.id)
        except Exception as e:
            print(f"⚠️ Error enviando notificación: {e}")


# ============================================================================
# OFERTA VIEWSET
# ============================================================================

class OfertaViewSet(viewsets.ModelViewSet):
    queryset = Oferta.objects.all()
    serializer_class = OfertaSerializer
    
    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [AllowAny()]
        return [EsAdministrador()]
    
    def get_queryset(self):
        """Filtrar ofertas según rol y sucursal del usuario"""
        user = self.request.user
        
        base_queryset = Oferta.objects.prefetch_related(
            Prefetch('productooferta_set', queryset=ProductoOferta.objects.select_related('producto'))
        )
        
        if not user.is_authenticated or user.rol == 'cliente':
            return base_queryset.filter(sucursal__activa=True).all()
        
        if user.rol == 'administrador_general':
            sucursal_id = self.request.query_params.get('sucursal')
            if sucursal_id:
                return base_queryset.filter(sucursal_id=sucursal_id).all()
            return base_queryset.all()
        
        if user.rol == 'administrador' and user.sucursal:
            return base_queryset.filter(sucursal=user.sucursal).all()
        
        return Oferta.objects.none()
    
    def perform_create(self, serializer):
        """Auto-asignar sucursal del admin regular al crear"""
        user = self.request.user
        
        print("\n🎉 Creando oferta...")
        
        if user.rol == 'administrador' and user.sucursal:
            oferta = serializer.save(sucursal=user.sucursal)
            print(f"✅ Oferta creada en sucursal: {user.sucursal.nombre}")
        else:
            oferta = serializer.save()
            print(f"✅ Oferta creada: {oferta.titulo} (ID: {oferta.id})")
        
        productos_count = ProductoOferta.objects.filter(oferta=oferta).count()
        print(f"📦 Productos asociados: {productos_count}")
    
        if productos_count > 0:
            print(f"📧 Programando notificación en background...")
            try:
                import threading
                from .emails import enviar_notificacion_oferta
            
                def enviar_email():
                    try:
                        enviar_notificacion_oferta(oferta.id)
                        print(f"✅ Notificación enviada\n")
                    except Exception as e:
                        print(f"❌ Error: {e}\n")
            
                thread = threading.Thread(target=enviar_email)
                thread.daemon = True
                thread.start()
                print(f"✅ Email programado\n")
            except Exception as e:
                print(f"❌ Error programando email: {e}\n")


# ============================================================================
# PEDIDO VIEWSET
# ============================================================================

class PedidoViewSet(viewsets.ModelViewSet):
    serializer_class = PedidoSerializer
    permission_classes = [IsAuthenticated, EsClienteOAdmin]

    def get_queryset(self):
        user = self.request.user
        
        base_queryset = Pedido.objects.select_related('usuario').prefetch_related(
            Prefetch('detalles', queryset=DetallePedido.objects.select_related('producto'))
        )
        
        if user.rol == 'administrador_general':
            return base_queryset.all().order_by('-fecha')
        elif user.rol == 'administrador' and user.sucursal:
            return base_queryset.filter(
                detalles__producto__sucursal=user.sucursal
            ).distinct().order_by('-fecha')
        
        return base_queryset.filter(usuario=user).order_by('-fecha')

    @transaction.atomic
    def perform_create(self, serializer):
        items_data = self.request.data.get('items', [])
        
        if not items_data:
            raise Exception('Debe incluir al menos un producto')
        
        print(f"\n{'='*60}")
        print(f"🛒 CREANDO PEDIDO - Usuario: {self.request.user.username}")
        print(f"{'='*60}\n")
        
        productos_ids = [item['producto'] for item in items_data]
        productos = {
            p.id: p for p in Producto.objects.select_for_update().filter(id__in=productos_ids)
        }
        
        for item in items_data:
            producto_id = item['producto']
            cantidad = item['cantidad']
            
            if producto_id not in productos:
                raise Exception(f'Producto {producto_id} no encontrado')
            
            producto = productos[producto_id]
            
            if producto.stock < cantidad:
                raise Exception(
                    f'Stock insuficiente para {producto.nombre}. '
                    f'Disponible: {producto.stock}, Solicitado: {cantidad}'
                )
            
            if not producto.disponible:
                raise Exception(f'Producto {producto.nombre} no disponible')
        
        pedido = serializer.save(usuario=self.request.user)
        print(f"✅ Pedido #{pedido.id} creado\n")
        
        from decimal import Decimal
        total = Decimal('0.00')
        
        for item_data in items_data:
            producto = productos[item_data['producto']]
            cantidad = item_data['cantidad']
            
            precio_unitario = Decimal(str(item_data.get('precio_unitario', producto.precio)))
            
            DetallePedido.objects.create(
                pedido=pedido,
                producto=producto,
                cantidad=cantidad
            )
            
            subtotal = precio_unitario * cantidad
            total += subtotal
            
            stock_anterior = producto.stock
            producto.stock -= cantidad
            
            print(f"📦 {producto.nombre}: {stock_anterior} → {producto.stock}")
            
            if producto.stock == 0:
                producto.disponible = False
                print(f"   🔴 AGOTADO")
            elif producto.stock <= 10:
                print(f"   ⚠️ STOCK BAJO ({producto.stock} unidades)")
            
            producto.save(update_fields=['stock', 'disponible'])
        
        pedido.total = total
        pedido.save(update_fields=['total'])
        
        print(f"\n💵 TOTAL: ₡{total}")
        
        print(f"\n📧 Programando confirmación en background...")
        try:
            import threading
            from .emails import enviar_confirmacion_pedido
    
            def enviar_email():
                try:
                    enviar_confirmacion_pedido(pedido.id)
                    print(f"✅ Correos enviados\n")
                except Exception as e:
                    print(f"❌ Error: {e}\n")
    
            thread = threading.Thread(target=enviar_email)
            thread.daemon = True
            thread.start()
            print(f"✅ Email programado\n")
        except Exception as e:
            print(f"❌ Error programando email: {e}\n")
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def cambiar_estado(self, request, pk=None):
        """Cambiar estado con notificación automática"""
        pedido = self.get_object()
        nuevo_estado = request.data.get('estado')
        
        estados_validos = ['recibido', 'en_preparacion', 'listo', 'entregado']
        if nuevo_estado not in estados_validos:
            return Response({
                'error': f'Estado inválido. Debe ser: {", ".join(estados_validos)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        estado_anterior = pedido.estado
        pedido.estado = nuevo_estado
        pedido.save(update_fields=['estado'])
        
        print(f"🔄 Pedido #{pedido.id}: {estado_anterior} → {nuevo_estado}")
        
        serializer = self.get_serializer(pedido)
        return Response({
            'message': 'Estado actualizado',
            'pedido': serializer.data
        })


class DetallePedidoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DetallePedido.objects.select_related('producto', 'pedido').all()
    serializer_class = DetallePedidoSerializer
    permission_classes = [IsAuthenticated]