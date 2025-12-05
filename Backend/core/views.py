# Backend/core/views.py
# ⭐ CORREGIDO: PedidoViewSet usa PedidoCreateSerializer correctamente

from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
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
    PedidoCreateSerializer,  # ⭐ NUEVO: Import
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
# USUARIO VIEWSET
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
        
        if user.rol == 'administrador_general':
            print(f"🔓 Admin General - Mostrando TODOS los usuarios")
            return Usuario.objects.all().order_by('-date_joined')
        
        elif user.rol == 'administrador':
            print(f"👁️ Admin Regular - Solo puede VER usuarios")
            return Usuario.objects.all().order_by('-date_joined')
        
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
    
    @action(detail=False, methods=['get', 'patch'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        Endpoint para que el usuario gestione su propio perfil
        GET /api/usuarios/me/ - Ver perfil
        PATCH /api/usuarios/me/ - Actualizar perfil (first_name, last_name, domicilio)
        """
        user = request.user
        
        if request.method == 'GET':
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        
        elif request.method == 'PATCH':
            allowed_fields = ['first_name', 'last_name', 'domicilio']
            data = {k: v for k, v in request.data.items() if k in allowed_fields}
            
            print(f"\n{'='*60}")
            print(f"🔄 Actualizando perfil de: {user.username}")
            if 'domicilio' in data:
                print(f"📍 Nuevo domicilio: {data['domicilio'][:50]}...")
            print(f"{'='*60}\n")
            
            serializer = self.get_serializer(user, data=data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            
            return Response(serializer.data)


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
# PRODUCTO VIEWSET
# ============================================================================

class ProductoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar productos con filtro de sucursal"""
    serializer_class = ProductoSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_queryset(self):
        """⭐ CORREGIDO: Filtrar productos por sucursal correctamente"""
        user = self.request.user
        queryset = Producto.objects.all()
        
        # ⭐ CRÍTICO: Filtrar por parámetro 'sucursal' en query params
        sucursal_id = self.request.query_params.get('sucursal', None)
        
        print(f"\n{'='*60}")
        print(f"🔍 ProductoViewSet.get_queryset()")
        print(f"   Usuario: {user.username if user.is_authenticated else 'Anónimo'}")
        print(f"   Rol: {user.rol if user.is_authenticated else 'N/A'}")
        print(f"   Query Param 'sucursal': {sucursal_id}")
        print(f"{'='*60}")
        
        # ⭐ Si viene parámetro sucursal, filtrar por ella (prioridad)
        if sucursal_id:
            queryset = queryset.filter(sucursal_id=sucursal_id)
            print(f"✅ Filtrando por sucursal_id={sucursal_id}")
            print(f"📊 Productos encontrados: {queryset.count()}")
            return queryset.order_by('-id')
        
        # Si no hay parámetro, aplicar lógica por rol
        if not user.is_authenticated or user.rol == 'cliente':
            queryset = queryset.filter(sucursal__activa=True)
            print(f"👤 Cliente/Anónimo - Mostrando productos de sucursales activas")
        elif user.rol == 'administrador_general':
            print(f"👑 Admin General - Mostrando TODOS los productos")
        elif user.rol == 'administrador' and user.sucursal:
            queryset = queryset.filter(sucursal=user.sucursal)
            print(f"🔒 Admin Regular - Solo productos de {user.sucursal.nombre}")
        else:
            queryset = Producto.objects.none()
            print(f"⚠️ Sin permisos - No hay productos")
        
        print(f"📊 Total productos: {queryset.count()}")
        print(f"{'='*60}\n")
        
        return queryset.order_by('-id')
    
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
        
        if user.rol == 'administrador' and user.sucursal:
            producto = serializer.save(sucursal=user.sucursal)
            print(f"✅ Producto creado en sucursal: {user.sucursal.nombre}")
            print(f"   ID: {producto.id}, Nombre: {producto.nombre}")
        else:
            cache.delete('productos_list')
            producto = serializer.save()
            print(f"✅ Producto creado: {producto.nombre} (ID: {producto.id})")
            if producto.sucursal:
                print(f"   Sucursal: {producto.sucursal.nombre}")
        
        print(f"{'='*60}\n")
        
        try:
            from .emails import enviar_notificacion_nuevo_producto
            enviar_notificacion_nuevo_producto(producto.id)
        except Exception as e:
            print(f"⚠️ Error enviando notificación: {e}")


# ============================================================================
# OFERTA VIEWSET
# ============================================================================

class OfertaViewSet(viewsets.ModelViewSet):
    serializer_class = OfertaSerializer
    
    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [AllowAny()]
        return [EsAdministrador()]
    
    def get_queryset(self):
        """⭐ CORREGIDO: Filtrar ofertas por sucursal correctamente"""
        user = self.request.user
        
        base_queryset = Oferta.objects.prefetch_related(
            Prefetch('productooferta_set', queryset=ProductoOferta.objects.select_related('producto'))
        )
        
        # ⭐ CRÍTICO: Filtrar por parámetro 'sucursal' en query params
        sucursal_id = self.request.query_params.get('sucursal', None)
        
        print(f"\n{'='*60}")
        print(f"🔍 OfertaViewSet.get_queryset()")
        print(f"   Usuario: {user.username if user.is_authenticated else 'Anónimo'}")
        print(f"   Rol: {user.rol if user.is_authenticated else 'N/A'}")
        print(f"   Query Param 'sucursal': {sucursal_id}")
        print(f"{'='*60}")
        
        # ⭐ Si viene parámetro sucursal, filtrar por ella (prioridad)
        if sucursal_id:
            queryset = base_queryset.filter(sucursal_id=sucursal_id)
            print(f"✅ Filtrando por sucursal_id={sucursal_id}")
            print(f"📊 Ofertas encontradas: {queryset.count()}")
            return queryset.all()
        
        # Si no hay parámetro, aplicar lógica por rol
        if not user.is_authenticated or user.rol == 'cliente':
            queryset = base_queryset.filter(sucursal__activa=True)
            print(f"👤 Cliente/Anónimo - Mostrando ofertas de sucursales activas")
        elif user.rol == 'administrador_general':
            queryset = base_queryset
            print(f"👑 Admin General - Mostrando TODAS las ofertas")
        elif user.rol == 'administrador' and user.sucursal:
            queryset = base_queryset.filter(sucursal=user.sucursal)
            print(f"🔒 Admin Regular - Solo ofertas de {user.sucursal.nombre}")
        else:
            queryset = Oferta.objects.none()
            print(f"⚠️ Sin permisos - No hay ofertas")
        
        print(f"📊 Total ofertas: {queryset.count()}")
        print(f"{'='*60}\n")
        
        return queryset.all()
    
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
# PEDIDO VIEWSET  (CANCELADO Y ELIMINACIÓN CON RESTRICCIONES)
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

    def get_serializer_class(self):
        if self.action == 'create':
            return PedidoCreateSerializer
        return PedidoSerializer

    @transaction.atomic
    def perform_create(self, serializer):
        # ... código existente ...
        pass
    
    # ⭐⭐⭐ NUEVO: Método para eliminar pedidos con validaciones
    def destroy(self, request, *args, **kwargs):
        """
        Elimina un pedido solo si cumple con las restricciones:
        1. No está en estado 'en_preparacion' o 'listo'
        2. Si está 'entregado' o 'cancelado', debe tener más de 48 horas
        3. Solo admins pueden eliminar (de su sucursal o todas si es admin_general)
        """
        pedido = self.get_object()
        user = request.user
        
        print(f"\n{'='*60}")
        print(f"🗑️  SOLICITUD DE ELIMINACIÓN DE PEDIDO")
        print(f"   Pedido ID: {pedido.id}")
        print(f"   Usuario: {user.username} (Rol: {user.rol})")
        print(f"   Estado del pedido: {pedido.estado}")
        print(f"{'='*60}")
        
        # ⭐ VALIDACIÓN 1: Solo administradores pueden eliminar
        if user.rol not in ['administrador', 'administrador_general']:
            print(f"🚫 Acceso denegado - Solo administradores")
            return Response({
                'error': 'Solo los administradores pueden eliminar pedidos',
                'codigo': 'PERMISO_DENEGADO'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # ⭐ VALIDACIÓN 2: Admin regular solo puede eliminar de su sucursal
        if user.rol == 'administrador':
            if not user.sucursal:
                print(f"🚫 Admin sin sucursal asignada")
                return Response({
                    'error': 'No tienes una sucursal asignada',
                    'codigo': 'SIN_SUCURSAL'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Verificar que el pedido pertenece a su sucursal
            pedido_sucursales = set(
                detalle.producto.sucursal_id 
                for detalle in pedido.detalles.all() 
                if detalle.producto.sucursal
            )
            
            if user.sucursal.id not in pedido_sucursales:
                print(f"🚫 Pedido no pertenece a la sucursal del admin")
                return Response({
                    'error': f'Este pedido no pertenece a tu sucursal ({user.sucursal.nombre})',
                    'codigo': 'SUCURSAL_INCORRECTA'
                }, status=status.HTTP_403_FORBIDDEN)
        
        # ⭐ VALIDACIÓN 3: Verificar si el pedido puede eliminarse
        if not pedido.puede_eliminarse:
            print(f"🚫 Pedido no puede eliminarse - Estado: {pedido.estado}")
            
            # Mensaje específico según el estado
            if pedido.estado in ['en_preparacion', 'listo']:
                mensaje = f'No se puede eliminar un pedido en estado "{pedido.get_estado_display()}". Solo puedes eliminar pedidos que estén en estado "Recibido", o pedidos completados/cancelados después de 48 horas.'
                codigo = 'ESTADO_NO_PERMITIDO'
            
            elif pedido.estado in ['entregado', 'cancelado']:
                tiempo_restante = pedido.tiempo_hasta_auto_delete
                mensaje = f'Este pedido fue {pedido.get_estado_display().lower()} recientemente. Podrás eliminarlo después de 48 horas. {tiempo_restante}'
                codigo = 'TIEMPO_INSUFICIENTE'
            
            else:
                mensaje = 'Este pedido no puede eliminarse en este momento'
                codigo = 'NO_ELIMINABLE'
            
            return Response({
                'error': mensaje,
                'codigo': codigo,
                'estado_actual': pedido.estado,
                'puede_eliminarse': False,
                'tiempo_hasta_auto_delete': pedido.tiempo_hasta_auto_delete
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # ⭐ ELIMINAR PEDIDO
        print(f"✅ Validaciones pasadas - Eliminando pedido...")
        pedido_id = pedido.id
        usuario_nombre = pedido.usuario.username
        
        try:
            pedido.delete()
            print(f"✅ Pedido #{pedido_id} eliminado exitosamente")
            print(f"{'='*60}\n")
            
            return Response({
                'message': f'Pedido #{pedido_id} eliminado exitosamente',
                'pedido_id': pedido_id,
                'usuario': usuario_nombre
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            print(f"❌ Error eliminando pedido: {e}")
            print(f"{'='*60}\n")
            return Response({
                'error': 'Error al eliminar el pedido',
                'detalle': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def cambiar_estado(self, request, pk=None):
        """Cambiar estado del pedido (solo admins)"""
        pedido = self.get_object()
        nuevo_estado = request.data.get('estado')
        
        # Solo admins pueden cambiar el estado manualmente
        if request.user.rol not in ['administrador', 'administrador_general']:
            return Response({
                'error': 'No tienes permisos para cambiar el estado del pedido'
            }, status=status.HTTP_403_FORBIDDEN)
        
        estados_validos = ['recibido', 'en_preparacion', 'listo', 'entregado', 'cancelado']
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
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def cancelar(self, request, pk=None):
        """
        Permite al cliente cancelar su pedido.
        Solo funciona si el pedido está en estado 'recibido'.
        """
        pedido = self.get_object()
        user = request.user
        
        print(f"\n{'='*60}")
        print(f"❌ SOLICITUD DE CANCELACIÓN")
        print(f"   Pedido ID: {pedido.id}")
        print(f"   Usuario: {user.username}")
        print(f"   Estado actual: {pedido.estado}")
        print(f"{'='*60}")
        
        # Verificar que el pedido pertenece al usuario
        if pedido.usuario != user and user.rol not in ['administrador', 'administrador_general']:
            print(f"🚫 Usuario no autorizado para cancelar este pedido")
            return Response({
                'error': 'No tienes permiso para cancelar este pedido'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Verificar que el pedido puede cancelarse
        if not pedido.puede_cancelarse:
            print(f"🚫 Pedido no se puede cancelar - Estado: {pedido.estado}")
            return Response({
                'error': f'No puedes cancelar este pedido porque ya está en estado "{pedido.get_estado_display()}". Solo los pedidos en estado "Recibido" pueden cancelarse.',
                'estado_actual': pedido.estado
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Cambiar estado a cancelado
        estado_anterior = pedido.estado
        pedido.estado = 'cancelado'
        pedido.save(update_fields=['estado'])
        
        print(f"✅ Pedido #{pedido.id} cancelado exitosamente")
        print(f"   Estado: {estado_anterior} → cancelado")
        print(f"{'='*60}\n")
        
        serializer = self.get_serializer(pedido)
        return Response({
            'message': 'Pedido cancelado exitosamente',
            'pedido': serializer.data
        }, status=status.HTTP_200_OK)
    
# ============================================================================
# DETALLE PEDIDO VIEWSET
# ============================================================================
     
class DetallePedidoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DetallePedido.objects.select_related('producto', 'pedido').all()
    serializer_class = DetallePedidoSerializer
    permission_classes = [IsAuthenticated]


# ============================================================================
# VISTA PARA OAUTH CANCELADO
# ============================================================================

from django.shortcuts import redirect
from django.views.generic import View

class LoginCancelledView(View):
    """
    Redirecciona al login del frontend cuando el usuario cancela el OAuth
    """
    def get(self, request):
        print("⚠️ Usuario canceló el login de Google")
        
        frontend_url = 'https://practica-empresarial-production.up.railway.app'
        
        return redirect(f'{frontend_url}/login?cancelled=true')