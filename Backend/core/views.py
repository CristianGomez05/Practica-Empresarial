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
from .emails import enviar_alerta_sin_stock
from .models import Usuario, Producto, Oferta, Pedido, DetallePedido
from .serializers import (
    UsuarioSerializer, 
    ProductoSerializer, 
    OfertaSerializer, 
    PedidoSerializer, 
    DetallePedidoSerializer,
    UsuarioRegistroSerializer  
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
    """
    print("\n" + "="*60)
    print("📝 REGISTRO DE USUARIO")
    print("="*60)
    print(f"Datos recibidos: {request.data}")
    
    serializer = UsuarioRegistroSerializer(data=request.data)
    
    if serializer.is_valid():
        print("✅ Datos válidos, creando usuario...")
        usuario = serializer.save()
        
        print(f"\n✅ Usuario creado exitosamente:")
        print(f"   ID: {usuario.id}")
        print(f"   Username: {usuario.username}")
        print(f"   Email: {usuario.email}")
        print(f"   Nombre: {usuario.first_name} {usuario.last_name}")
        print(f"   Rol: {usuario.rol}")
        print(f"   Activo: {usuario.is_active}")
        print(f"   Password hash: {usuario.password[:30]}...")
        print(f"   ¿Password válida?: {usuario.has_usable_password()}")
        
        # 🧪 PROBAR AUTENTICACIÓN INMEDIATAMENTE
        from django.contrib.auth import authenticate
        test_auth = authenticate(
            username=usuario.username, 
            password=request.data.get('password')
        )
        
        if test_auth:
            print(f"   ✅ TEST: Autenticación funciona correctamente")
        else:
            print(f"   ❌ TEST: Autenticación FALLÓ - La contraseña NO se guardó correctamente")
        
        print("="*60 + "\n")
        
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
    
    print(f"❌ Errores de validación: {serializer.errors}")
    print("="*60 + "\n")
    
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
    - Lectura pública (INCLUYE productos agotados)
    - Escritura solo para administradores
    """
    # ⭐ IMPORTANTE: Definir queryset como atributo de clase (requerido por DRF)
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    
    def get_queryset(self):
        """
        ⭐ MOSTRAR TODOS LOS PRODUCTOS, incluso los agotados
        El frontend decide qué mostrar según filtros
        """
        # NO filtrar por disponible - mostrar todos
        queryset = Producto.objects.all().order_by('id')
        
        # Log para debugging
        total = queryset.count()
        disponibles = queryset.filter(stock__gt=0).count()
        agotados = queryset.filter(stock=0).count()
        
        print(f"📦 ProductoViewSet.get_queryset()")
        print(f"   Total: {total} productos")
        print(f"   Disponibles: {disponibles}")
        print(f"   Agotados: {agotados}")
        
        return queryset
    
    def get_permissions(self):
        """
        Permisos: lectura pública, escritura solo admin
        """
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [AllowAny()]
        return [EsAdministrador()]
    
    @action(detail=False, methods=['get'])
    def destacados(self, request):
        """
        Obtiene productos destacados (solo con stock)
        GET /core/productos/destacados/
        """
        productos = Producto.objects.filter(
            stock__gt=0  # Solo productos con stock para destacados
        ).order_by('-precio')[:6]
        serializer = self.get_serializer(productos, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def disponibles(self, request):
        """
        Obtiene solo productos disponibles (con stock)
        GET /core/productos/disponibles/
        """
        productos = Producto.objects.filter(
            stock__gt=0
        ).order_by('nombre')
        serializer = self.get_serializer(productos, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def agotados(self, request):
        """
        Obtiene solo productos agotados
        GET /core/productos/agotados/
        """
        productos = Producto.objects.filter(
            stock=0
        ).order_by('nombre')
        serializer = self.get_serializer(productos, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def buscar(self, request):
        """
        Busca productos por nombre o descripción
        GET /core/productos/buscar/?q=croissant
        Incluye productos agotados en los resultados
        """
        query = request.query_params.get('q', '')
        if query:
            productos = Producto.objects.filter(
                Q(nombre__icontains=query) | Q(descripcion__icontains=query)
            ).order_by('nombre')
        else:
            productos = Producto.objects.all().order_by('nombre')
        
        serializer = self.get_serializer(productos, many=True)
        return Response(serializer.data)


class OfertaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para ofertas
    """
    queryset = Oferta.objects.all()
    serializer_class = OfertaSerializer
    
    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [AllowAny()]
        return [EsAdministrador()]
    
    def get_queryset(self):
        return Oferta.objects.prefetch_related('productos').all()
    
    @action(detail=False, methods=['get'])
    def activas(self, request):
        hoy = timezone.now().date()
        ofertas = Oferta.objects.filter(
            fecha_inicio__lte=hoy,
            fecha_fin__gte=hoy
        ).prefetch_related('productos')
        serializer = self.get_serializer(ofertas, many=True)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        """Crear oferta y enviar correo DESPUÉS de asociar productos"""
        print("\n🎉 Creando oferta...")
        oferta = serializer.save()
        
        # Esperar a que los productos estén asociados
        print(f"✅ Oferta creada: {oferta.titulo}")
        print(f"📦 Productos asociados: {oferta.productos.count()}")
        
        # ⭐ ENVIAR CORREO AHORA QUE YA TIENE PRODUCTOS
        if oferta.productos.count() > 0:
            print(f"📧 Enviando notificación de oferta...")
            try:
                from .emails import enviar_notificacion_oferta
                enviar_notificacion_oferta(oferta.id)
                print(f"✅ Notificación enviada exitosamente\n")
            except Exception as e:
                print(f"❌ Error al enviar notificación: {e}\n")
                import traceback
                traceback.print_exc()
        else:
            print(f"⚠️ No se envió correo: oferta sin productos\n")
    
    def perform_update(self, serializer):
        print("\n🔄 Actualizando oferta...")
        oferta = serializer.save()
        print(f"✅ Oferta actualizada: {oferta.titulo}\n")
    
    def perform_destroy(self, instance):
        print(f"\n🗑️  Eliminando oferta: {instance.titulo}")
        instance.delete()
        print("✅ Oferta eliminada\n")


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

    @transaction.atomic
    def perform_create(self, serializer):
        """
        Crear pedido con detalles, calcular total y REDUCIR STOCK
        """
        items_data = self.request.data.get('items', [])
        
        if not items_data:
            raise Exception('Debe incluir al menos un producto')
        
        print(f"\n{'='*60}")
        print(f"🛒 CREANDO PEDIDO - Usuario: {self.request.user.username}")
        print(f"📦 Items recibidos: {len(items_data)}")
        print(f"{'='*60}\n")
        
        # VALIDACIÓN 1: Verificar que todos los productos existan y estén disponibles
        for item in items_data:
            producto_id = item.get('producto')
            cantidad = item.get('cantidad', 1)
            
            print(f"🔍 Validando producto ID: {producto_id}, Cantidad: {cantidad}")
            
            try:
                producto = Producto.objects.select_for_update().get(id=producto_id)
                print(f"   ✓ Producto encontrado: {producto.nombre}")
                print(f"   📊 Stock actual: {producto.stock}")
                
                # VALIDACIÓN 2: Verificar que haya stock suficiente
                if producto.stock < cantidad:
                    error_msg = (
                        f'Stock insuficiente para {producto.nombre}. '
                        f'Disponible: {producto.stock}, Solicitado: {cantidad}'
                    )
                    print(f"   ❌ {error_msg}")
                    raise Exception(error_msg)
                
                if not producto.disponible:
                    error_msg = f'Producto {producto.nombre} no disponible'
                    print(f"   ❌ {error_msg}")
                    raise Exception(error_msg)
                    
                print(f"   ✓ Validación OK\n")
                    
            except Producto.DoesNotExist:
                error_msg = f'Producto {producto_id} no encontrado'
                print(f"   ❌ {error_msg}\n")
                raise Exception(error_msg)
        
        # Crear el pedido
        pedido = serializer.save(usuario=self.request.user)
        print(f"✅ Pedido #{pedido.id} creado\n")
        
        # Crear detalles, calcular total y REDUCIR STOCK
        total = Decimal('0.00')
        productos_agotados = []
        
        print(f"{'='*60}")
        print(f"📝 PROCESANDO ITEMS Y REDUCIENDO STOCK")
        print(f"{'='*60}\n")
        
        for item_data in items_data:
            producto = Producto.objects.select_for_update().get(id=item_data['producto'])
            cantidad = item_data['cantidad']
            
            # Usar precio personalizado si se proporciona (para ofertas)
            if 'precio_unitario' in item_data:
                precio_unitario = Decimal(str(item_data['precio_unitario']))
                print(f"💰 {producto.nombre}: Precio oferta ₡{precio_unitario}")
            else:
                precio_unitario = producto.precio
                print(f"💰 {producto.nombre}: Precio regular ₡{precio_unitario}")
            
            # Crear detalle del pedido
            DetallePedido.objects.create(
                pedido=pedido,
                producto=producto,
                cantidad=cantidad
            )
            print(f"   ✓ Detalle creado")
            
            # Calcular total
            subtotal = precio_unitario * cantidad
            total += subtotal
            print(f"   💵 Subtotal: ₡{subtotal}")
            
            # ⭐ REDUCIR STOCK (ESTA ES LA PARTE CRÍTICA)
            stock_anterior = producto.stock
            producto.stock -= cantidad
            
            print(f"\n   📦 REDUCCIÓN DE STOCK:")
            print(f"      Producto: {producto.nombre}")
            print(f"      Stock anterior: {stock_anterior}")
            print(f"      Cantidad vendida: {cantidad}")
            print(f"      Stock nuevo: {producto.stock}")
            
            # Si el stock llega a 0, marcar como no disponible
            if producto.stock == 0:
                producto.disponible = False
                productos_agotados.append(producto)
                print(f"      ⚠️  PRODUCTO AGOTADO - Marcado como no disponible")
            elif producto.stock <= 5:
                print(f"      ⚠️  STOCK BAJO - Solo quedan {producto.stock} unidades")
            
            # GUARDAR LOS CAMBIOS EN LA BASE DE DATOS
            producto.save(update_fields=['stock', 'disponible'])
            print(f"      ✅ Cambios guardados en BD\n")
        
        # Actualizar total del pedido
        pedido.total = total
        pedido.save(update_fields=['total'])
        
        print(f"{'='*60}")
        print(f"💵 TOTAL DEL PEDIDO: ₡{total}")
        print(f"{'='*60}\n")
        
        # ⭐ ENVIAR ALERTAS DE STOCK AGOTADO
        if productos_agotados:
            print(f"{'='*60}")
            print(f"📧 ENVIANDO ALERTAS DE STOCK AGOTADO")
            print(f"{'='*60}\n")
            
            for producto_agotado in productos_agotados:
                # Solo enviar si no se ha enviado antes
                if not producto_agotado.alerta_stock_enviada:
                    try:
                        print(f"📧 Enviando alerta para: {producto_agotado.nombre}")
                        enviar_alerta_sin_stock(producto_agotado.id)
                        print(f"   ✅ Alerta enviada\n")
                    except Exception as e:
                        print(f"   ❌ Error al enviar alerta: {e}\n")
        
        print(f"{'='*60}")
        print(f"✨ PEDIDO COMPLETADO EXITOSAMENTE")
        print(f"{'='*60}\n")
        
        # ⭐ ENVIAR CORREO DE CONFIRMACIÓN (AHORA QUE YA TIENE DETALLES)
        print(f"{'='*60}")
        print(f"📧 ENVIANDO CORREO DE CONFIRMACIÓN")
        print(f"{'='*60}\n")
        
        try:
            from .emails import enviar_confirmacion_pedido
            enviar_confirmacion_pedido(pedido.id)
            print(f"✅ Correos de confirmación enviados\n")
        except Exception as e:
            print(f"❌ Error al enviar correos: {e}\n")
            import traceback
            traceback.print_exc()
        
        return pedido
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
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


class DetallePedidoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para detalles de pedidos
    """
    queryset = DetallePedido.objects.select_related('producto', 'pedido').all()
    serializer_class = DetallePedidoSerializer
    permission_classes = [IsAuthenticated]