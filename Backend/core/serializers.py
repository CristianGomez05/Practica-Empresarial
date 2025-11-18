# Backend/core/serializers.py
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.conf import settings
from django.utils import timezone
from .models import Usuario, Producto, Oferta, Pedido, DetallePedido
import cloudinary.uploader


# ============================================================================
# USUARIO SERIALIZERS
# ============================================================================

class UsuarioSerializer(serializers.ModelSerializer):
    """Serializer para usuarios con información completa"""
    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'rol', 'is_active', 'date_joined'
        ]
        read_only_fields = ['date_joined', 'is_active']


class UsuarioRegistroSerializer(serializers.ModelSerializer):
    """Serializer para el registro de nuevos usuarios"""
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'},
        help_text="La contraseña debe tener al menos 8 caracteres"
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        help_text="Repite la contraseña"
    )

    class Meta:
        model = Usuario
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True}
        }

    def validate_username(self, value):
        """Validar que el username sea único"""
        if Usuario.objects.filter(username=value).exists():
            raise serializers.ValidationError("Este nombre de usuario ya está en uso")
        return value

    def validate_email(self, value):
        """Validar que el email sea único y válido"""
        if Usuario.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este correo electrónico ya está registrado")
        
        if '@' not in value or '.' not in value.split('@')[-1]:
            raise serializers.ValidationError("Ingresa un correo electrónico válido")
        
        return value.lower()

    def validate(self, data):
        """Validar que las contraseñas coincidan"""
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Las contraseñas no coinciden'
            })
        
        password = data['password']
        if len(password) < 8:
            raise serializers.ValidationError({
                'password': 'La contraseña debe tener al menos 8 caracteres'
            })
        
        if not any(c.isalpha() for c in password):
            raise serializers.ValidationError({
                'password': 'La contraseña debe contener al menos una letra'
            })
        
        if not any(c.isdigit() for c in password):
            raise serializers.ValidationError({
                'password': 'La contraseña debe contener al menos un número'
            })
        
        return data

    def create(self, validated_data):
        """Crear el usuario con la contraseña hasheada"""
        validated_data.pop('password_confirm')
        
        usuario = Usuario.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            rol='cliente'
        )
        
        return usuario


# ============================================================================
# PRODUCTO SERIALIZER CON CLOUDINARY
# ============================================================================

class ProductoSerializer(serializers.ModelSerializer):
    """
    Serializer para productos con soporte completo para Cloudinary
    """
    # Campo de solo lectura para la URL de la imagen
    imagen_url = serializers.SerializerMethodField(read_only=True)
    
    # Campos adicionales
    tiene_oferta = serializers.SerializerMethodField()
    oferta_activa = serializers.SerializerMethodField()
    esta_agotado = serializers.SerializerMethodField()
    
    class Meta:
        model = Producto
        fields = [
            'id', 'nombre', 'descripcion', 'precio', 'disponible', 'stock', 
            'imagen', 'imagen_url', 'tiene_oferta', 'oferta_activa', 'esta_agotado'
        ]
        read_only_fields = ['alerta_stock_enviada']
    
    def get_imagen_url(self, obj):
        """
        Retorna la URL completa de la imagen desde Cloudinary
        """
        if obj.imagen:
            try:
                # Cloudinary devuelve la URL completa automáticamente
                if hasattr(obj.imagen, 'url'):
                    return obj.imagen.url
                # Fallback si es string
                return str(obj.imagen)
            except Exception as e:
                print(f"❌ Error obteniendo URL de imagen: {e}")
                return None
        return None
    
    def get_tiene_oferta(self, obj):
        """Verifica si el producto tiene una oferta activa"""
        hoy = timezone.now().date()
        return obj.ofertas.filter(
            fecha_inicio__lte=hoy,
            fecha_fin__gte=hoy
        ).exists()
    
    def get_oferta_activa(self, obj):
        """Retorna la oferta activa si existe"""
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
        """Verifica si el producto está agotado"""
        return obj.stock == 0
    
    def validate_imagen(self, value):
        """
        Valida la imagen subida
        """
        if value:
            # Validar tamaño (5MB máximo)
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError(
                    "La imagen no debe superar los 5MB"
                )
            
            # Validar tipo de archivo
            allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
            if hasattr(value, 'content_type') and value.content_type not in allowed_types:
                raise serializers.ValidationError(
                    "Solo se permiten imágenes JPG, PNG o WEBP"
                )
        
        return value
    
    def to_representation(self, instance):
        """
        Personalizar la representación para devolver imagen_url en lugar de imagen
        """
        representation = super().to_representation(instance)
        
        # Reemplazar el campo 'imagen' con la URL completa
        imagen_url = representation.pop('imagen_url', None)
        representation['imagen'] = imagen_url
        
        # Log para debugging
        if instance.stock == 0:
            print(f"⚠️  Producto agotado: {instance.nombre}")
        
        return representation
    
    def create(self, validated_data):
        """
        Crear producto y subir imagen a Cloudinary
        """
        print(f"\n{'='*60}")
        print(f"📦 Creando producto: {validated_data.get('nombre')}")
        
        imagen = validated_data.get('imagen')
        if imagen:
            print(f"📸 Imagen recibida: {imagen.name} ({imagen.size} bytes)")
            print(f"📸 Content Type: {getattr(imagen, 'content_type', 'unknown')}")
        
        # Django-cloudinary-storage se encarga de subir automáticamente
        producto = Producto.objects.create(**validated_data)
        
        if producto.imagen:
            print(f"✅ Imagen subida a Cloudinary: {producto.imagen.url}")
        else:
            print(f"⚠️  Producto creado sin imagen")
        
        print(f"✅ Producto creado con ID: {producto.id}")
        print(f"{'='*60}\n")
        
        return producto
    
    def update(self, instance, validated_data):
        """
        Actualizar producto y manejar imagen
        """
        print(f"\n{'='*60}")
        print(f"🔄 Actualizando producto: {instance.nombre} (ID: {instance.id})")
        
        # Verificar si hay nueva imagen
        nueva_imagen = validated_data.get('imagen')
        imagen_anterior = instance.imagen
        
        if nueva_imagen:
            print(f"📸 Nueva imagen recibida: {nueva_imagen.name} ({nueva_imagen.size} bytes)")
            
            # Si hay imagen anterior en Cloudinary, eliminarla
            if imagen_anterior and hasattr(settings, 'CLOUDINARY_CLOUD_NAME'):
                try:
                    # Extraer public_id de la URL de Cloudinary
                    if hasattr(imagen_anterior, 'public_id'):
                        public_id = imagen_anterior.public_id
                        print(f"🗑️  Eliminando imagen anterior: {public_id}")
                        cloudinary.uploader.destroy(public_id)
                        print(f"✅ Imagen anterior eliminada de Cloudinary")
                except Exception as e:
                    print(f"⚠️  Error eliminando imagen anterior: {e}")
        else:
            print(f"📸 Manteniendo imagen existente")
        
        # Actualizar campos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        if instance.imagen:
            print(f"✅ Imagen actualizada: {instance.imagen.url}")
        
        print(f"✅ Producto actualizado exitosamente")
        print(f"{'='*60}\n")
        
        return instance


# ============================================================================
# OFERTA SERIALIZER
# ============================================================================

class OfertaSerializer(serializers.ModelSerializer):
    """Serializer para ofertas con soporte para múltiples productos"""
    productos = ProductoSerializer(many=True, read_only=True)
    productos_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=True
    )
    dias_restantes = serializers.SerializerMethodField()
    esta_activa = serializers.SerializerMethodField()

    class Meta:
        model = Oferta
        fields = [
            'id', 'titulo', 'descripcion', 'fecha_inicio', 'fecha_fin', 
            'precio_oferta', 'productos', 'productos_ids', 
            'dias_restantes', 'esta_activa'
        ]
    
    def get_dias_restantes(self, obj):
        """Calcula los días restantes de la oferta"""
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
        """Verifica si la oferta está activa"""
        if isinstance(obj, dict):
            return None
        
        try:
            hoy = timezone.now().date()
            return obj.fecha_inicio <= hoy <= obj.fecha_fin
        except (AttributeError, TypeError):
            return None
    
    def validate_productos_ids(self, value):
        """Valida que los IDs de productos existan"""
        if not value:
            raise serializers.ValidationError("Debe seleccionar al menos un producto")
        
        for prod_id in value:
            if not Producto.objects.filter(id=prod_id).exists():
                raise serializers.ValidationError(
                    f"El producto con ID {prod_id} no existe"
                )
        
        return value
    
    def validate(self, data):
        """Validaciones personalizadas"""
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
        
        return data
    
    def create(self, validated_data):
        """Crea la oferta y asocia los productos"""
        print(f"\n{'='*60}")
        print("🎉 CREANDO NUEVA OFERTA")
        print(f"{'='*60}")
        
        productos_ids = validated_data.pop('productos_ids')
        print(f"Productos IDs: {productos_ids}")
        
        # Validar que los productos tengan stock
        productos = Producto.objects.filter(id__in=productos_ids)
        productos_sin_stock = [p.nombre for p in productos if p.stock == 0]
        
        if productos_sin_stock:
            raise serializers.ValidationError({
                'error': f'No puedes crear una oferta con productos agotados: {", ".join(productos_sin_stock)}'
            })
        
        oferta = Oferta.objects.create(**validated_data)
        print(f"✅ Oferta creada: {oferta.titulo} (ID: {oferta.id})")
        
        oferta.productos.set(productos_ids)
        print(f"✅ Productos asociados: {oferta.productos.count()}")
        print(f"{'='*60}\n")
        
        return oferta
    
    def update(self, instance, validated_data):
        """Actualiza la oferta y sus productos"""
        productos_ids = validated_data.pop('productos_ids', None)
        
        # Actualizar campos básicos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Actualizar productos si se proporcionaron
        if productos_ids is not None:
            productos = Producto.objects.filter(id__in=productos_ids)
            productos_sin_stock = [p.nombre for p in productos if p.stock == 0]
            
            if productos_sin_stock:
                raise serializers.ValidationError({
                    'error': f'No puedes actualizar con productos agotados: {", ".join(productos_sin_stock)}'
                })
            
            instance.productos.set(productos_ids)
        
        return instance
    
    def to_representation(self, instance):
        """Personaliza la representación para incluir productos_ids"""
        if isinstance(instance, dict):
            return instance
        
        representation = super().to_representation(instance)
        
        try:
            representation['productos_ids'] = list(
                instance.productos.values_list('id', flat=True)
            )
        except AttributeError:
            representation['productos_ids'] = []
        
        return representation


# ============================================================================
# PEDIDO SERIALIZERS
# ============================================================================

class DetallePedidoSerializer(serializers.ModelSerializer):
    """Serializer para detalles de pedido con información del producto"""
    producto = ProductoSerializer(read_only=True)
    producto_id = serializers.PrimaryKeyRelatedField(
        queryset=Producto.objects.all(), 
        source='producto', 
        write_only=True
    )
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
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
            'producto_nombre', 'cantidad', 'precio_unitario', 'precio_total',
            'es_oferta'
        ]
        read_only_fields = ['id', 'pedido']
    
    def get_precio_total(self, obj):
        """Calcula el precio total del detalle"""
        return obj.producto.precio * obj.cantidad
    
    def get_es_oferta(self, obj):
        """Verifica si el producto tiene una oferta activa"""
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
    cantidad_items = serializers.SerializerMethodField()
    tiempo_transcurrido = serializers.SerializerMethodField()
    es_oferta = serializers.SerializerMethodField()

    class Meta:
        model = Pedido
        fields = [
            'id', 'usuario', 'usuario_nombre', 'fecha', 'estado', 
            'estado_display', 'detalles', 'total', 
            'cantidad_items', 'tiempo_transcurrido', 'es_oferta'
        ]
        read_only_fields = ['id', 'fecha', 'usuario', 'total']
    
    def get_cantidad_items(self, obj):
        """Cuenta la cantidad total de items en el pedido"""
        return sum(detalle.cantidad for detalle in obj.detalles.all())
    
    def get_tiempo_transcurrido(self, obj):
        """Calcula el tiempo transcurrido desde que se hizo el pedido"""
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
        """Verifica si el pedido contiene al menos un producto de oferta"""
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
    
    def create(self, validated_data):
        """Crea el pedido con sus detalles"""
        items_data = validated_data.pop('items')
        usuario = self.context['request'].user
        
        pedido = Pedido.objects.create(
            usuario=usuario,
            estado='recibido',
            total=0
        )
        
        total = 0
        for item in items_data:
            producto = Producto.objects.get(id=item['producto'])
            cantidad = item['cantidad']
            
            DetallePedido.objects.create(
                pedido=pedido,
                producto=producto,
                cantidad=cantidad
            )
            
            total += producto.precio * cantidad
        
        pedido.total = total
        pedido.save()
        
        return pedido
    
    def to_representation(self, instance):
        """Retorna la representación completa del pedido creado"""
        return PedidoSerializer(instance, context=self.context).data


# ============================================================================
# CUSTOM JWT SERIALIZER
# ============================================================================

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Serializer personalizado que permite login con username O email"""
    username_field = 'username'
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Agregar campos personalizados al payload del token
        token['username'] = user.username
        token['email'] = user.email
        token['rol'] = user.rol
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        
        return token
    
    def validate(self, attrs):
        """Permite autenticación con username o email"""
        from django.contrib.auth import authenticate
        
        username_or_email = attrs.get('username')
        password = attrs.get('password')
        
        print(f"\n{'='*60}")
        print(f"🔐 INTENTO DE LOGIN: {username_or_email}")
        print(f"{'='*60}")
        
        # Intentar por username
        user = authenticate(
            request=self.context.get('request'),
            username=username_or_email,
            password=password
        )
        
        if user:
            print(f"✅ Login exitoso por USERNAME: {user.username}")
        
        # Si no funciona, intentar por email
        if not user:
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
                    print(f"❌ Contraseña incorrecta")
                
            except Usuario.DoesNotExist:
                print(f"❌ No existe usuario con email: {username_or_email}")
        
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
            }
        }
        
        return data