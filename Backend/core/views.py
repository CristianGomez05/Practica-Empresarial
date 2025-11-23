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
from .models import Usuario, Producto, Oferta, ProductoOferta, Pedido, DetallePedido
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
    """ViewSet para gestionar productos con soporte de imágenes en Cloudinary"""
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_queryset(self):
        return Producto.objects.all().order_by('-id')
    
    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [AllowAny()]
        return [EsAdministrador()]
    
    def create(self, request, *args, **kwargs):
        print(f"\n{'='*60}")
        print(f"📥 POST /api/productos/ - Creando producto")
        
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
            print(f"{'='*60}\n")
            raise
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        print(f"\n{'='*60}")
        print(f"🔄 PUT /api/productos/{instance.id}/ - Actualizando producto")
        
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
            print(f"{'='*60}\n")
            raise
    
    def perform_create(self, serializer):
        cache.delete('productos_list')
        producto = serializer.save()
        
        try:
            from .emails import enviar_notificacion_nuevo_producto
            enviar_notificacion_nuevo_producto(producto.id)
        except Exception as e:
            print(f"⚠️  Error enviando notificación: {e}")
    
    def perform_update(self, serializer):
        cache.delete('productos_list')
        serializer.save()
    
    def perform_destroy(self, instance):
        if instance.imagen:
            try:
                import cloudinary.uploader
                if hasattr(instance.imagen, 'public_id'):
                    cloudinary.uploader.destroy(instance.imagen.public_id)
            except Exception as e:
                print(f"⚠️  Error eliminando imagen: {e}")
        
        cache.delete('productos_list')
        instance.delete()
    
    @action(detail=False, methods=['get'])
    def disponibles(self, request):
        productos = Producto.objects.filter(stock__gt=0, disponible=True).order_by('nombre')
        serializer = self.get_serializer(productos, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def agotados(self, request):
        productos = Producto.objects.filter(stock=0).order_by('nombre')
        serializer = self.get_serializer(productos, many=True)
        return Response(serializer.data)


class OfertaViewSet(viewsets.ModelViewSet):
    queryset = Oferta.objects.all()
    serializer_class = OfertaSerializer
    
    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [AllowAny()]
        return [EsAdministrador()]
    
    def get_queryset(self):
        return Oferta.objects.prefetch_related(
            Prefetch('productooferta_set', queryset=ProductoOferta.objects.select_related('producto'))
        ).all()
    
    def create(self, request, *args, **kwargs):
        """Crear oferta con productos y cantidades"""
        print(f"\n{'='*60}")
        print(f"📥 POST /api/ofertas/ - Creando oferta")
        print(f"📋 Data recibida: {request.data}")
        print(f"{'='*60}\n")
        
        # ⭐ IMPORTANTE: Validar que productos_data existe
        if 'productos_data' not in request.data:
            # Si viene productos_ids (formato antiguo), convertir a productos_data
            if 'productos_ids' in request.data:
                print("⚠️  Detectado formato antiguo (productos_ids), convirtiendo...")
                productos_ids = request.data.get('productos_ids', [])
                request.data['productos_data'] = [
                    {'producto_id': pid, 'cantidad': 1}
                    for pid in productos_ids
                ]
            else:
                return Response({
                    'error': 'Se requiere productos_data con formato: [{"producto_id": 1, "cantidad": 2}, ...]'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            
            headers = self.get_success_headers(serializer.data)
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED,
                headers=headers
            )
        except Exception as e:
            print(f"❌ Error creando oferta: {str(e)}")
            print(f"❌ Validation errors: {serializer.errors if hasattr(serializer, 'errors') else 'N/A'}")
            print(f"{'='*60}\n")
            
            return Response({
                'error': str(e),
                'validation_errors': serializer.errors if hasattr(serializer, 'errors') else None
            }, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, *args, **kwargs):
        """Actualizar oferta con productos y cantidades"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        print(f"\n{'='*60}")
        print(f"🔄 PUT /api/ofertas/{instance.id}/ - Actualizando oferta")
        print(f"📋 Data recibida: {request.data}")
        print(f"{'='*60}\n")
        
        # ⭐ Convertir productos_ids a productos_data si viene en formato antiguo
        if 'productos_ids' in request.data and 'productos_data' not in request.data:
            print("⚠️  Detectado formato antiguo (productos_ids), convirtiendo...")
            productos_ids = request.data.get('productos_ids', [])
            request.data['productos_data'] = [
                {'producto_id': pid, 'cantidad': 1}
                for pid in productos_ids
            ]
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            
            if getattr(instance, '_prefetched_objects_cache', None):
                instance._prefetched_objects_cache = {}
            
            return Response(serializer.data)
        except Exception as e:
            print(f"❌ Error actualizando oferta: {str(e)}")
            print(f"{'='*60}\n")
            
            return Response({
                'error': str(e),
                'validation_errors': serializer.errors if hasattr(serializer, 'errors') else None
            }, status=status.HTTP_400_BAD_REQUEST)
    
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
    
        print(f"✅ Oferta creada: {oferta.titulo} (ID: {oferta.id})")
        
        # Contar productos asociados
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