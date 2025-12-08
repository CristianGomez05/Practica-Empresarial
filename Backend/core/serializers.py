# Backend/core/serializers.py
# ⭐⭐⭐ CORREGIDO: Reducción de stock + Envío de emails + tipo_entrega

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.conf import settings
from django.utils import timezone
from .models import Usuario, Producto, Oferta, ProductoOferta, Pedido, DetallePedido, Sucursal
import cloudinary.uploader


# ============================================================================
# SUCURSAL SERIALIZER (⭐ CORREGIDO)
# ============================================================================

class SucursalSerializer(serializers.ModelSerializer):
    """Serializer para sucursales con conteos correctos"""
    total_productos = serializers.SerializerMethodField()
    total_ofertas = serializers.SerializerMethodField()
    total_admins = serializers.SerializerMethodField()
    
    # ⭐ LEGACY: Mantener compatibilidad con código antiguo
    productos_count = serializers.SerializerMethodField()
    ofertas_count = serializers.SerializerMethodField()
    usuarios_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Sucursal
        fields = [
            'id', 'nombre', 'telefono', 'direccion', 'activa', 
            'fecha_creacion', 
            # Nuevos campos
            'total_productos', 'total_ofertas', 'total_admins',
            # Legacy (para compatibilidad)
            'productos_count', 'ofertas_count', 'usuarios_count'
        ]
        read_only_fields = ['fecha_creacion']
    
    def get_total_productos(self, obj):
        """Conteo de productos de esta sucursal"""
        return obj.productos.count()
    
    def get_total_ofertas(self, obj):
        """Conteo de ofertas de esta sucursal"""
        return obj.ofertas.count()
    
    def get_total_admins(self, obj):
        """Conteo de administradores asignados a esta sucursal"""
        return obj.usuarios.filter(
            rol__in=['administrador', 'administrador_general']
        ).count()
    
    # ⭐ LEGACY: Métodos antiguos para compatibilidad
    def get_productos_count(self, obj):
        return self.get_total_productos(obj)
    
    def get_ofertas_count(self, obj):
        return self.get_total_ofertas(obj)
    
    def get_usuarios_count(self, obj):
        return self.get_total_admins(obj)


# ============================================================================
# USUARIO SERIALIZERS
# ============================================================================

class UsuarioSerializer(serializers.ModelSerializer):
    """Serializer para usuarios con información completa"""
    sucursal_nombre = serializers.CharField(source='sucursal.nombre', read_only=True)
    sucursal_data = SucursalSerializer(source='sucursal', read_only=True)
    password = serializers.CharField(write_only=True, required=False)
    tiene_domicilio = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'rol', 'is_active', 'date_joined', 'sucursal', 
            'sucursal_nombre', 'sucursal_data', 'password',
            'domicilio', 'tiene_domicilio'
        ]
        read_only_fields = ['date_joined', 'tiene_domicilio']
        extra_kwargs = {
            'sucursal': {'required': False, 'allow_null': True}
        }
    
    def validate(self, data):
        rol = data.get('rol', self.instance.rol if self.instance else None)
        sucursal = data.get('sucursal', self.instance.sucursal if self.instance else None)
        
        if rol == 'administrador' and not sucursal:
            print(f"⚠️ Creando administrador sin sucursal asignada")
        
        return data
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        
        usuario = Usuario.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=password or Usuario.objects.make_random_password(),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            rol=validated_data.get('rol', 'cliente'),
            sucursal=validated_data.get('sucursal', None),
            domicilio=validated_data.get('domicilio', ''),
            is_active=validated_data.get('is_active', True)
        )
        
        print(f"✅ Usuario creado: {usuario.username} (Rol: {usuario.rol})")
        if usuario.sucursal:
            print(f"   Sucursal: {usuario.sucursal.nombre}")
        
        return usuario
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        print(f"🔄 Usuario actualizado: {instance.username}")
        return instance


# ============================================================================
# PRODUCTO SERIALIZER
# ============================================================================

class ProductoSerializer(serializers.ModelSerializer):
    imagen_url = serializers.SerializerMethodField(read_only=True)
    tiene_oferta = serializers.SerializerMethodField()
    oferta_activa = serializers.SerializerMethodField()
    esta_agotado = serializers.SerializerMethodField()
    sucursal_nombre = serializers.CharField(source='sucursal.nombre', read_only=True)
    
    class Meta:
        model = Producto
        fields = [
            'id', 'nombre', 'descripcion', 'precio', 'disponible', 'stock', 
            'imagen', 'imagen_url', 'tiene_oferta', 'oferta_activa', 'esta_agotado',
            'sucursal', 'sucursal_nombre'
        ]
        read_only_fields = ['alerta_stock_enviada', 'alerta_stock_bajo_enviada']
    
    def get_imagen_url(self, obj):
        if obj.imagen:
            try:
                if hasattr(obj.imagen, 'url'):
                    return obj.imagen.url
                return str(obj.imagen)
            except Exception as e:
                print(f"❌ Error obteniendo URL de imagen: {e}")
                return None
        return None
    
    def get_tiene_oferta(self, obj):
        hoy = timezone.now().date()
        return obj.ofertas.filter(
            fecha_inicio__lte=hoy,
            fecha_fin__gte=hoy
        ).exists()
    
    def get_oferta_activa(self, obj):
        hoy = timezone.now().date()
        oferta = obj.ofertas.filter(
            fecha_inicio__lte=hoy,
            fecha_fin__gte=hoy
        ).first()
        
        if oferta:
            return {
                'id': oferta.id,
                'titulo': oferta.titulo,
                'descripcion': oferta.descripcion,
                'precio_oferta': float(oferta.precio_oferta),
                'fecha_inicio': oferta.fecha_inicio,
                'fecha_fin': oferta.fecha_fin
            }
        return None
    
    def get_esta_agotado(self, obj):
        return obj.stock == 0
    
    def validate_imagen(self, value):
        if value:
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("La imagen no debe superar los 5MB")
            
            allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
            if hasattr(value, 'content_type') and value.content_type not in allowed_types:
                raise serializers.ValidationError("Solo se permiten imágenes JPG, PNG o WEBP")
        
        return value
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        imagen_url = representation.pop('imagen_url', None)
        representation['imagen'] = imagen_url
        
        if instance.stock == 0:
            print(f"⚠️  Producto agotado: {instance.nombre}")
        
        return representation
    
    def create(self, validated_data):
        print(f"\n{'='*60}")
        print(f"📦 Creando producto: {validated_data.get('nombre')}")
        
        producto = Producto.objects.create(**validated_data)
        
        if producto.imagen:
            print(f"✅ Imagen subida a Cloudinary: {producto.imagen.url}")
        
        print(f"✅ Producto creado con ID: {producto.id}")
        print(f"   Sucursal: {producto.sucursal.nombre}")
        print(f"{'='*60}\n")
        
        return producto


# ============================================================================
# OFERTA SERIALIZERS (SECCIÓN MODIFICADA)
# ============================================================================

class ProductoOfertaSerializer(serializers.ModelSerializer):
    producto = ProductoSerializer(read_only=True)
    producto_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = ProductoOferta
        fields = ['id', 'producto', 'producto_id', 'cantidad']
    
    def validate_cantidad(self, value):
        if value < 1:
            raise serializers.ValidationError("La cantidad debe ser al menos 1")
        return value


class OfertaSerializer(serializers.ModelSerializer):
    productos_con_cantidad = ProductoOfertaSerializer(
        source='productooferta_set',
        many=True,
        read_only=True
    )
    
    productos_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=True,
        help_text="Lista de productos con formato: [{'producto_id': 1, 'cantidad': 2}, ...]"
    )
    
    dias_restantes = serializers.SerializerMethodField()
    esta_activa = serializers.SerializerMethodField()
    sucursal_nombre = serializers.CharField(source='sucursal.nombre', read_only=True)

    class Meta:
        model = Oferta
        fields = [
            'id', 'titulo', 'descripcion', 'fecha_inicio', 'fecha_fin', 
            'precio_oferta', 'productos_con_cantidad', 'productos_data',
            'dias_restantes', 'esta_activa', 'sucursal', 'sucursal_nombre'
        ]
    
    def get_dias_restantes(self, obj):
        if isinstance(obj, dict):
            return None
        
        try:
            hoy = timezone.now().date()
            if obj.fecha_fin >= hoy:
                delta = obj.fecha_fin - hoy
                return delta.days
            return 0
        except (AttributeError, TypeError):
            return None
    
    def get_esta_activa(self, obj):
        if isinstance(obj, dict):
            return None
        
        try:
            hoy = timezone.now().date()
            return obj.fecha_inicio <= hoy <= obj.fecha_fin
        except (AttributeError, TypeError):
            return None
        
    def validate_productos_data(self, value):
        if not value:
            raise serializers.ValidationError("Debe incluir al menos un producto")
        
        for item in value:
            if 'producto_id' not in item:
                raise serializers.ValidationError("Cada producto debe tener 'producto_id'")
            
            if 'cantidad' not in item:
                raise serializers.ValidationError("Cada producto debe tener 'cantidad'")
            
            cantidad = item['cantidad']
            if not isinstance(cantidad, int) or cantidad < 1:
                raise serializers.ValidationError(
                    f"La cantidad debe ser un entero mayor a 0, recibido: {cantidad}"
                )
            
            producto_id = item['producto_id']
            if not Producto.objects.filter(id=producto_id).exists():
                raise serializers.ValidationError(
                    f"El producto con ID {producto_id} no existe"
                )
        
        return value
    
    def validate(self, data):
        """⭐ CORREGIDO: Validación inteligente de sucursal"""
        fecha_inicio = data.get('fecha_inicio')
        fecha_fin = data.get('fecha_fin')
        
        if fecha_inicio and fecha_fin:
            if fecha_fin < fecha_inicio:
                raise serializers.ValidationError({
                    'fecha_fin': 'La fecha de fin debe ser posterior a la fecha de inicio'
                })
        
        precio_oferta = data.get('precio_oferta')
        if precio_oferta is not None and precio_oferta <= 0:
            raise serializers.ValidationError({
                'precio_oferta': 'El precio debe ser mayor a 0'
            })
        
        # ⭐ CRÍTICO: Solo validar productos si están siendo actualizados
        sucursal = data.get('sucursal')
        productos_data = data.get('productos_data')
        
        # Si hay sucursal Y productos_data (ambos están siendo enviados)
        if sucursal and productos_data:
            productos_ids = [p['producto_id'] for p in productos_data]
            
            # Verificar que todos los productos pertenezcan a la sucursal
            productos_otra_sucursal = Producto.objects.filter(
                id__in=productos_ids
            ).exclude(sucursal=sucursal)
            
            if productos_otra_sucursal.exists():
                nombres = ', '.join([p.nombre for p in productos_otra_sucursal])
                raise serializers.ValidationError({
                    'productos_data': f'Los siguientes productos no pertenecen a la sucursal seleccionada: {nombres}'
                })
        
        # ⭐ NUEVO: Validación para cuando se actualiza solo la sucursal
        # Si estamos en actualización (self.instance existe) y solo se cambió sucursal
        if self.instance and sucursal and not productos_data:
            # Obtener productos actuales de la oferta
            productos_actuales = ProductoOferta.objects.filter(
                oferta=self.instance
            ).values_list('producto_id', flat=True)
            
            if productos_actuales:
                # Verificar que los productos actuales pertenezcan a la nueva sucursal
                productos_incompatibles = Producto.objects.filter(
                    id__in=productos_actuales
                ).exclude(sucursal=sucursal)
                
                if productos_incompatibles.exists():
                    nombres = ', '.join([p.nombre for p in productos_incompatibles])
                    raise serializers.ValidationError({
                        'sucursal': f'No puedes cambiar a esta sucursal porque los siguientes productos no le pertenecen: {nombres}. Debes actualizar los productos también.'
                    })
        
        return data
    
    def create(self, validated_data):
        print(f"\n{'='*60}")
        print("🎉 CREANDO NUEVA OFERTA CON CANTIDADES")
        print(f"{'='*60}")
        
        productos_data = validated_data.pop('productos_data')
        
        oferta = Oferta.objects.create(**validated_data)
        print(f"✅ Oferta creada: {oferta.titulo} (ID: {oferta.id})")
        print(f"   Sucursal: {oferta.sucursal.nombre}")
        
        for item in productos_data:
            producto = Producto.objects.get(id=item['producto_id'])
            
            ProductoOferta.objects.create(
                oferta=oferta,
                producto=producto,
                cantidad=item['cantidad']
            )
            
            print(f"   ✓ {item['cantidad']}x {producto.nombre}")
        
        print(f"{'='*60}\n")
        
        return oferta
    
    def update(self, instance, validated_data):
        """⭐ CORREGIDO: Actualización inteligente de oferta"""
        print(f"\n{'='*60}")
        print("✏️ ACTUALIZANDO OFERTA")
        print(f"   Oferta ID: {instance.id}")
        print(f"   Título: {instance.titulo}")
        print(f"{'='*60}")
        
        productos_data = validated_data.pop('productos_data', None)
        
        # ⭐ Registrar cambios
        cambios = []
        
        # Actualizar campos básicos
        for attr, value in validated_data.items():
            old_value = getattr(instance, attr)
            if old_value != value:
                cambios.append(f"{attr}: {old_value} → {value}")
                if attr == 'sucursal':
                    old_sucursal = old_value.nombre if old_value else 'Sin sucursal'
                    new_sucursal = value.nombre if value else 'Sin sucursal'
                    print(f"   🏪 Cambio de sucursal: {old_sucursal} → {new_sucursal}")
            setattr(instance, attr, value)
        
        instance.save()
        
        if cambios:
            print(f"   ✏️ Campos actualizados:")
            for cambio in cambios:
                print(f"      • {cambio}")
        
        # ⭐ Si se enviaron productos, actualizar la relación
        if productos_data is not None:
            print(f"   🔄 Actualizando productos...")
            
            # Eliminar productos antiguos
            ProductoOferta.objects.filter(oferta=instance).delete()
            print(f"      🗑️ Productos antiguos eliminados")
            
            # Crear nuevas relaciones con cantidades
            for item in productos_data:
                producto = Producto.objects.get(id=item['producto_id'])
                ProductoOferta.objects.create(
                    oferta=instance,
                    producto=producto,
                    cantidad=item['cantidad']
                )
                print(f"      ✓ {item['cantidad']}x {producto.nombre} (Sucursal: {producto.sucursal.nombre})")
        else:
            print(f"   ℹ️ Productos no modificados")
        
        print(f"{'='*60}\n")
        
        return instance
    
    def to_representation(self, instance):
        if isinstance(instance, dict):
            return instance
        
        representation = super().to_representation(instance)
        
        try:
            productos_oferta = ProductoOferta.objects.filter(oferta=instance).select_related('producto')
            representation['productos_data'] = [
                {
                    'producto_id': po.producto.id,
                    'cantidad': po.cantidad
                }
                for po in productos_oferta
            ]
        except AttributeError:
            representation['productos_data'] = []
        
        return representation


# ============================================================================
# PEDIDO SERIALIZERS
# ============================================================================

class DetallePedidoSerializer(serializers.ModelSerializer):
    producto = ProductoSerializer(read_only=True)
    producto_id = serializers.PrimaryKeyRelatedField(
        queryset=Producto.objects.all(), 
        source='producto', 
        write_only=True
    )
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    sucursal_nombre = serializers.SerializerMethodField()
    precio_unitario = serializers.DecimalField(
        source='producto.precio', 
        read_only=True,
        max_digits=10,
        decimal_places=2
    )
    precio_total = serializers.SerializerMethodField()
    es_oferta = serializers.SerializerMethodField()

    class Meta:
        model = DetallePedido
        fields = [
            'id', 'pedido', 'producto', 'producto_id', 
            'producto_nombre', 'sucursal_nombre', 'cantidad', 'precio_unitario', 'precio_total',
            'es_oferta'
        ]
        read_only_fields = ['id', 'pedido']
    
    def get_sucursal_nombre(self, obj):
        try:
            if obj.producto and obj.producto.sucursal:
                return obj.producto.sucursal.nombre
            return "Sin sucursal"
        except Exception:
            return "Sin sucursal"
    
    def get_precio_total(self, obj):
        return obj.producto.precio * obj.cantidad
    
    def get_es_oferta(self, obj):
        hoy = timezone.now().date()
        return obj.producto.ofertas.filter(
            fecha_inicio__lte=hoy,
            fecha_fin__gte=hoy
        ).exists()


class PedidoSerializer(serializers.ModelSerializer):
    """Serializer para pedidos con detalles completos (SOLO LECTURA)"""
    detalles = DetallePedidoSerializer(many=True, read_only=True)
    usuario = UsuarioSerializer(read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    tipo_entrega_display = serializers.CharField(source='get_tipo_entrega_display', read_only=True)
    cantidad_items = serializers.SerializerMethodField()
    tiempo_transcurrido = serializers.SerializerMethodField()
    es_oferta = serializers.SerializerMethodField()
    es_domicilio = serializers.BooleanField(read_only=True)
    es_recoger = serializers.BooleanField(read_only=True)
    puede_cancelarse = serializers.BooleanField(read_only=True)
    puede_eliminarse = serializers.BooleanField(read_only=True)
    tiempo_hasta_auto_delete = serializers.CharField(read_only=True)
    fecha_completado = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Pedido
        fields = [
            'id', 'usuario', 'usuario_nombre', 'fecha', 'estado', 
            'estado_display', 'detalles', 'total', 
            'cantidad_items', 'tiempo_transcurrido', 'es_oferta',
            'direccion_entrega', 'tipo_entrega', 'tipo_entrega_display',
            'es_domicilio', 'es_recoger', 'puede_cancelarse',
            'puede_eliminarse', 'tiempo_hasta_auto_delete', 'fecha_completado'
        ]
        read_only_fields = [
            'id', 'fecha', 'usuario', 'total', 'direccion_entrega', 
            'tipo_entrega', 'fecha_completado'
        ]
    
    def get_cantidad_items(self, obj):
        return sum(detalle.cantidad for detalle in obj.detalles.all())
    
    def get_tiempo_transcurrido(self, obj):
        from django.utils import timezone
        ahora = timezone.now()
        delta = ahora - obj.fecha
        
        if delta.days > 0:
            return f"Hace {delta.days} día{'s' if delta.days > 1 else ''}"
        elif delta.seconds >= 3600:
            horas = delta.seconds // 3600
            return f"Hace {horas} hora{'s' if horas > 1 else ''}"
        elif delta.seconds >= 60:
            minutos = delta.seconds // 60
            return f"Hace {minutos} minuto{'s' if minutos > 1 else ''}"
        else:
            return "Hace un momento"
    
    def get_es_oferta(self, obj):
        from django.utils import timezone
        hoy = timezone.now().date()
        for detalle in obj.detalles.all():
            if detalle.producto.ofertas.filter(
                fecha_inicio__lte=hoy,
                fecha_fin__gte=hoy
            ).exists():
                return True
        return False


class PedidoCreateSerializer(serializers.Serializer):
    """Serializer específico para crear pedidos desde el frontend"""
    items = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=False,
        write_only=True
    )
    tipo_entrega = serializers.ChoiceField(
        choices=['domicilio', 'recoger'],
        default='domicilio',
        help_text='Tipo de entrega: domicilio o recoger'
    )
    
    def validate_items(self, items):
        """Valida la estructura de los items"""
        if not items:
            raise serializers.ValidationError("Debe incluir al menos un producto")
            
        for item in items:
            if 'producto' not in item:
                raise serializers.ValidationError("Cada item debe tener 'producto'")
            if 'cantidad' not in item:
                raise serializers.ValidationError("Cada item debe tener 'cantidad'")
            
            if not isinstance(item['cantidad'], int) or item['cantidad'] < 1:
                raise serializers.ValidationError("La cantidad debe ser un entero mayor a 0")
            
            try:
                producto = Producto.objects.get(id=item['producto'])
                if not producto.disponible:
                    raise serializers.ValidationError(
                        f"El producto '{producto.nombre}' no está disponible"
                    )
            except Producto.DoesNotExist:
                raise serializers.ValidationError(
                    f"El producto con ID {item['producto']} no existe"
                )
        
        return items
    
    def validate(self, data):
        """⭐ ACTUALIZADO: Validación según tipo de entrega"""
        request = self.context.get('request')
        tipo_entrega = data.get('tipo_entrega', 'domicilio')
        
        if request and request.user:
            # Si es entrega a domicilio, validar que tenga domicilio
            if tipo_entrega == 'domicilio':
                if not request.user.tiene_domicilio:
                    raise serializers.ValidationError({
                        'domicilio': 'Debes configurar tu domicilio para entrega a domicilio',
                        'codigo': 'DOMICILIO_REQUERIDO'
                    })
            # Si es para recoger, no se requiere domicilio
        
        return data
    
    def create(self, validated_data):
        """⭐⭐⭐ CORREGIDO: Crear pedido + Reducir stock + Enviar emails"""
        items_data = validated_data.pop('items')
        tipo_entrega = validated_data.get('tipo_entrega', 'domicilio')
        usuario = self.context['request'].user
        
        print(f"\n{'='*60}")
        print(f"🛒 CREANDO PEDIDO - Usuario: {usuario.username}")
        print(f"📦 Tipo de entrega: {tipo_entrega}")
        print(f"{'='*60}")
        
        # ⭐ CRÍTICO: Solo guardar dirección si es entrega a domicilio
        direccion_entrega = None
        if tipo_entrega == 'domicilio':
            direccion_entrega = usuario.domicilio
            print(f"📍 Domicilio: {direccion_entrega}")
        else:
            print(f"🏪 Cliente recogerá en sucursal (sin dirección)")
        
        # ⭐ Crear pedido con tipo_entrega y dirección según corresponda
        pedido = Pedido.objects.create(
            usuario=usuario,
            estado='recibido',
            total=0,
            tipo_entrega=tipo_entrega,
            direccion_entrega=direccion_entrega
        )
        
        print(f"✅ Pedido #{pedido.id} creado")
        if pedido.direccion_entrega:
            print(f"📍 Dirección de entrega: {pedido.direccion_entrega}")
        else:
            print(f"🏪 Para recoger en sucursal")
        print()
        
        total = 0
        for item in items_data:
            producto = Producto.objects.get(id=item['producto'])
            cantidad = item['cantidad']
            
            # ⭐⭐⭐ CRÍTICO: REDUCIR STOCK DEL PRODUCTO
            if producto.stock >= cantidad:
                producto.stock -= cantidad
                if producto.stock == 0:
                    producto.disponible = False
                producto.save()
                print(f"   📦 Stock reducido: {producto.nombre} ({producto.stock + cantidad} → {producto.stock})")
            else:
                # Si no hay suficiente stock, revertir pedido
                pedido.delete()
                raise serializers.ValidationError({
                    'stock': f'Stock insuficiente para {producto.nombre}. Disponible: {producto.stock}, Solicitado: {cantidad}'
                })
            
            # Crear detalle del pedido
            DetallePedido.objects.create(
                pedido=pedido,
                producto=producto,
                cantidad=cantidad
            )
            
            total += producto.precio * cantidad
            print(f"   ✓ {cantidad}x {producto.nombre} - ₡{producto.precio * cantidad}")
        
        pedido.total = total
        pedido.save()
        
        print(f"💵 TOTAL: ₡{total}")
        print(f"{'='*60}\n")
        
        # ⭐⭐⭐ NUEVO: ENVIAR EMAILS DE CONFIRMACIÓN
        print(f"📧 Programando envío de correos de confirmación...")
        try:
            import threading
            import time
            from .emails import enviar_confirmacion_pedido
            
            def enviar_email():
                try:
                    # ⭐ CRÍTICO: Pequeño delay para asegurar que el pedido esté en DB
                    time.sleep(0.5)  # 500ms de espera
                    enviar_confirmacion_pedido(pedido.id)
                    print(f"✅ Correos de confirmación enviados para pedido #{pedido.id}\n")
                except Exception as e:
                    print(f"❌ Error enviando correos: {e}\n")
                    import traceback
                    traceback.print_exc()
            
            thread = threading.Thread(target=enviar_email)
            thread.daemon = True
            thread.start()
            print(f"✅ Email programado en background\n")
        except Exception as e:
            print(f"❌ Error programando email: {e}\n")
        
        return pedido
    
    # ⭐ NO necesitamos to_representation() porque lo manejamos en views.py


# ============================================================================
# CUSTOM JWT SERIALIZER
# ============================================================================

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Serializer personalizado que permite login con username O email e incluye domicilio"""
    username_field = 'username'
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        token['username'] = user.username
        token['email'] = user.email
        token['rol'] = user.rol
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        token['domicilio'] = user.domicilio or ''
        token['tiene_domicilio'] = user.tiene_domicilio
        
        if user.sucursal:
            token['sucursal_id'] = user.sucursal.id
            token['sucursal_nombre'] = user.sucursal.nombre
        else:
            token['sucursal_id'] = None
            token['sucursal_nombre'] = None
        
        return token
    
    def validate(self, attrs):
        """Permite autenticación con username o email"""
        from django.contrib.auth import authenticate
        
        username_or_email = attrs.get('username')
        password = attrs.get('password')
        
        print(f"\n{'='*60}")
        print(f"🔐 INTENTO DE LOGIN: {username_or_email}")
        print(f"{'='*60}")
        
        user = None
        
        if '@' in username_or_email:
            try:
                print(f"🔍 Buscando por email...")
                usuario_obj = Usuario.objects.get(email=username_or_email.lower())
                print(f"✅ Usuario encontrado: {usuario_obj.username}")
                
                user = authenticate(
                    request=self.context.get('request'),
                    username=usuario_obj.username,
                    password=password
                )
                
                if user:
                    print(f"✅ Autenticación exitosa con email")
                else:
                    print(f"❌ Contraseña incorrecta para email")
                
            except Usuario.DoesNotExist:
                print(f"❌ No existe usuario con email: {username_or_email}")
                user = None
        else:
            print(f"🔍 Intentando login por username...")
            user = authenticate(
                request=self.context.get('request'),
                username=username_or_email,
                password=password
            )
            
            if user:
                print(f"✅ Login exitoso por USERNAME: {user.username}")
            else:
                print(f"❌ Credenciales incorrectas para username")
        
        if not user:
            print(f"❌ Login fallido")
            print(f"{'='*60}\n")
            raise serializers.ValidationError(
                'Usuario o contraseña incorrectos',
                code='authorization'
            )
        
        if not user.is_active:
            print(f"⚠️ Usuario inactivo: {user.username}")
            print(f"{'='*60}\n")
            raise serializers.ValidationError(
                'Esta cuenta está desactivada',
                code='authorization'
            )
        
        print(f"✅ Login completado: {user.username} (Rol: {user.rol})")
        if user.sucursal:
            print(f"   Sucursal: {user.sucursal.nombre}")
        print(f"   Domicilio: {user.domicilio[:50] if user.domicilio else 'No configurado'}...")
        print(f"{'='*60}\n")
        
        refresh = self.get_token(user)
        
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'rol': user.rol,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'sucursal_id': user.sucursal.id if user.sucursal else None,
                'sucursal_nombre': user.sucursal.nombre if user.sucursal else None,
                'domicilio': user.domicilio or '',
                'tiene_domicilio': user.tiene_domicilio
            }
        }
        
        return data