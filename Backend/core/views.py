# Backend/core/views.py
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q, Prefetch
from django.db import transaction
from django.core.cache import cache
from .emails import enviar_alerta_sin_stock
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
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


@api_view(['POST'])
@permission_classes([AllowAny])
def registro_usuario(request):
    """Endpoint para registrar nuevos usuarios"""
    print("\n" + "="*60)
    print("📝 REGISTRO DE USUARIO")
    print("="*60)
    
    serializer = UsuarioRegistroSerializer(data=request.data)
    
    if serializer.is_valid():
        usuario = serializer.save()
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


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [EsAdministrador]
    
    @action(detail=False, methods=['get', 'patch'], permission_classes=[IsAuthenticated])
    def me(self, request):
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        
        elif request.method == 'PATCH':
            allowed_fields = ['first_name', 'last_name']
            data = {k: v for k, v in request.data.items() if k in allowed_fields}
            
            serializer = self.get_serializer(request.user, data=data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            
            return Response(serializer.data)


class ProductoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar productos con soporte de imágenes en Cloudinary
    """
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    
    # ⭐ CRÍTICO: Agregar parsers para multipart/form-data
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_queryset(self):
        """Retorna todos los productos ordenados por ID descendente"""
        return Producto.objects.all().order_by('-id')
    
    def get_permissions(self):
        """
        GET: Cualquiera puede ver
        POST/PUT/DELETE: Solo administradores
        """
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [AllowAny()]
        return [EsAdministrador()]
    
    def create(self, request, *args, **kwargs):
        """
        Crear producto con imagen
        POST /api/productos/
        """
        print(f"\n{'='*60}")
        print(f"📥 POST /api/productos/ - Creando producto")
        print(f"📋 Content-Type: {request.content_type}")
        print(f"📋 Data keys: {list(request.data.keys())}")
        
        # Log de datos recibidos
        if 'imagen' in request.FILES:
            imagen = request.FILES['imagen']
            print(f"📸 Imagen recibida: {imagen.name}")
            print(f"📸 Tamaño: {imagen.size} bytes ({imagen.size / 1024:.2f} KB)")
            print(f"📸 Content Type: {imagen.content_type}")
        else:
            print(f"⚠️  No se recibió imagen")
        
        # Usar el serializer
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            
            print(f"✅ Producto creado exitosamente")
            print(f"{'='*60}\n")
            
            headers = self.get_success_headers(serializer.data)
            return Response(
                serializer.data, 
                status=status.HTTP_201_CREATED, 
                headers=headers
            )
        except Exception as e:
            print(f"❌ Error creando producto: {str(e)}")
            print(f"❌ Validation errors: {serializer.errors if hasattr(serializer, 'errors') else 'N/A'}")
            print(f"{'='*60}\n")
            raise
    
    def update(self, request, *args, **kwargs):
        """
        Actualizar producto con o sin imagen
        PUT /api/productos/{id}/
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        print(f"\n{'='*60}")
        print(f"🔄 PUT /api/productos/{instance.id}/ - Actualizando producto")
        print(f"📋 Content-Type: {request.content_type}")
        print(f"📋 Data keys: {list(request.data.keys())}")
        
        if 'imagen' in request.FILES:
            imagen = request.FILES['imagen']
            print(f"📸 Nueva imagen: {imagen.name} ({imagen.size / 1024:.2f} KB)")
        else:
            print(f"📸 Sin nueva imagen - manteniendo existente")
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            
            if getattr(instance, '_prefetched_objects_cache', None):
                instance._prefetched_objects_cache = {}
            
            print(f"✅ Producto actualizado exitosamente")
            print(f"{'='*60}\n")
            
            return Response(serializer.data)
        except Exception as e:
            print(f"❌ Error actualizando producto: {str(e)}")
            print(f"❌ Validation errors: {serializer.errors if hasattr(serializer, 'errors') else 'N/A'}")
            print(f"{'='*60}\n")
            raise
    
    def perform_create(self, serializer):
        """
        Ejecutar después de validar al crear producto
        """
        # Limpiar cache
        cache.delete('productos_list')
        
        # Guardar producto (Cloudinary se encarga de la imagen automáticamente)
        producto = serializer.save()
        
        print(f"💾 Producto guardado en DB con ID: {producto.id}")
        
        # Enviar notificación por email
        try:
            from .emails import enviar_notificacion_nuevo_producto
            print(f"📧 Enviando notificación de nuevo producto...")
            enviar_notificacion_nuevo_producto(producto.id)
            print(f"✅ Notificación enviada")
        except Exception as e:
            print(f"⚠️  Error enviando notificación: {e}")
    
    def perform_update(self, serializer):
        """
        Ejecutar después de validar al actualizar producto
        """
        cache.delete('productos_list')
        serializer.save()
        print(f"💾 Producto actualizado en DB")
    
    def perform_destroy(self, instance):
        """
        Ejecutar al eliminar producto
        """
        print(f"\n🗑️  Eliminando producto ID: {instance.id}")
        
        # Eliminar imagen de Cloudinary si existe
        if instance.imagen:
            try:
                import cloudinary.uploader
                if hasattr(instance.imagen, 'public_id'):
                    public_id = instance.imagen.public_id
                    print(f"🗑️  Eliminando imagen de Cloudinary: {public_id}")
                    cloudinary.uploader.destroy(public_id)
                    print(f"✅ Imagen eliminada de Cloudinary")
            except Exception as e:
                print(f"⚠️  Error eliminando imagen: {e}")
        
        cache.delete('productos_list')
        instance.delete()
        print(f"✅ Producto eliminado de DB\n")
    
    @action(detail=False, methods=['get'])
    def disponibles(self, request):
        """
        Endpoint para obtener solo productos disponibles
        GET /api/productos/disponibles/
        """
        productos = Producto.objects.filter(stock__gt=0, disponible=True).order_by('nombre')
        serializer = self.get_serializer(productos, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def agotados(self, request):
        """
        Endpoint para obtener productos agotados
        GET /api/productos/agotados/
        """
        productos = Producto.objects.filter(stock=0).order_by('nombre')
        serializer = self.get_serializer(productos, many=True)
        return Response(serializer.data)


class OfertaViewSet(viewsets.ModelViewSet):
    # ⭐ CRÍTICO: Definir queryset como atributo de clase
    queryset = Oferta.objects.all()
    serializer_class = OfertaSerializer
    
    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [AllowAny()]
        return [EsAdministrador()]
    
    def get_queryset(self):
        # ⭐ Optimizar con prefetch
        return Oferta.objects.prefetch_related(
            Prefetch('productos', queryset=Producto.objects.all())
        ).all()
    
    @action(detail=False, methods=['get'])
    def activas(self, request):
        from django.utils import timezone
        hoy = timezone.now().date()
        ofertas = self.get_queryset().filter(
            fecha_inicio__lte=hoy,
            fecha_fin__gte=hoy
        )
        serializer = self.get_serializer(ofertas, many=True)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        print("\n🎉 Creando oferta...")
        oferta = serializer.save()
    
        print(f"✅ Oferta creada: {oferta.titulo}")
        print(f"📦 Productos asociados: {oferta.productos.count()}")
    
        if oferta.productos.count() > 0:
            print(f"📧 Programando notificación en background...")
            try:
                # ⭐ Ejecutar en background
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


class PedidoViewSet(viewsets.ModelViewSet):
    serializer_class = PedidoSerializer
    permission_classes = [IsAuthenticated, EsClienteOAdmin]

    def get_queryset(self):
        user = self.request.user
        
        base_queryset = Pedido.objects.select_related('usuario').prefetch_related(
            Prefetch('detalles', queryset=DetallePedido.objects.select_related('producto'))
        )
        
        if user.rol == 'administrador':
            return base_queryset.all().order_by('-fecha')
        return base_queryset.filter(usuario=user).order_by('-fecha')

    @transaction.atomic
    def perform_create(self, serializer):
        items_data = self.request.data.get('items', [])
        
        if not items_data:
            raise Exception('Debe incluir al menos un producto')
        
        print(f"\n{'='*60}")
        print(f"🛒 CREANDO PEDIDO - Usuario: {self.request.user.username}")
        print(f"{'='*60}\n")
        
        # Validar productos con select_for_update
        productos_ids = [item['producto'] for item in items_data]
        productos = {
            p.id: p for p in Producto.objects.select_for_update().filter(id__in=productos_ids)
        }
        
        # Validar stock
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
        
        # Crear pedido
        pedido = serializer.save(usuario=self.request.user)
        print(f"✅ Pedido #{pedido.id} creado\n")
        
        # Procesar items
        from decimal import Decimal
        total = Decimal('0.00')
        productos_agotados = []
        
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
                productos_agotados.append(producto)
                print(f"   ⚠️ AGOTADO")
            
            producto.save(update_fields=['stock', 'disponible'])
        
        pedido.total = total
        pedido.save(update_fields=['total'])
        
        print(f"\n💵 TOTAL: ₡{total}")
        
        # Enviar alertas
        for producto_agotado in productos_agotados:
            if not producto_agotado.alerta_stock_enviada:
                try:
                    enviar_alerta_sin_stock(producto_agotado.id)
                    producto_agotado.alerta_stock_enviada = True
                    producto_agotado.save(update_fields=['alerta_stock_enviada'])
                except Exception as e:
                    print(f"❌ Error alerta: {e}")
        
        # Enviar confirmación
        print(f"\n📧 Programando confirmación en background...")
        try:
            # ⭐ Ejecutar en background
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