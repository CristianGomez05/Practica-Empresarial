# Backend/core/serializers.py
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.conf import settings
from django.utils import timezone
from .models import Usuario, Producto, Oferta, ProductoOferta, Pedido, DetallePedido, Sucursal
import cloudinary.uploader


# ============================================================================
# SUCURSAL SERIALIZER (NUEVO)
# ============================================================================

class SucursalSerializer(serializers.ModelSerializer):
    """Serializer para sucursales"""
    productos_count = serializers.SerializerMethodField()
    ofertas_count = serializers.SerializerMethodField()
    usuarios_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Sucursal
        fields = [
            'id', 'nombre', 'telefono', 'direccion', 'activa', 
            'fecha_creacion', 'productos_count', 'ofertas_count', 'usuarios_count'
        ]
        read_only_fields = ['fecha_creacion']
    
    def get_productos_count(self, obj):
        """Cuenta productos de la sucursal"""
        return obj.productos.count()
    
    def get_ofertas_count(self, obj):
        """Cuenta ofertas de la sucursal"""
        return obj.ofertas.count()
    
    def get_usuarios_count(self, obj):
        """Cuenta usuarios asignados a la sucursal"""
        return obj.usuarios.filter(rol__in=['administrador', 'administrador_general']).count()


# ============================================================================
# USUARIO SERIALIZERS (ACTUALIZADOS)
# ============================================================================

class UsuarioSerializer(serializers.ModelSerializer):
    """Serializer para usuarios con información completa"""
    sucursal_nombre = serializers.CharField(source='sucursal.nombre', read_only=True)
    sucursal_data = SucursalSerializer(source='sucursal', read_only=True)
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'rol', 'is_active', 'date_joined', 'sucursal', 
            'sucursal_nombre', 'sucursal_data', 'password'
        ]
        read_only_fields = ['date_joined']
        extra_kwargs = {
            'sucursal': {'required': False, 'allow_null': True}  # ⭐ Permitir null
        }
    
    def validate(self, data):
        """Validaciones personalizadas"""
        rol = data.get('rol', self.instance.rol if self.instance else None)
        sucursal = data.get('sucursal', self.instance.sucursal if self.instance else None)
        
        # ⭐ Solo validar sucursal para administradores regulares
        if rol == 'administrador' and not sucursal:
            # Advertencia, pero no error - permitir crear sin sucursal
            print(f"⚠️ Creando administrador sin sucursal asignada")
        
        return data
    
    def create(self, validated_data):
        """Crear usuario con contraseña hasheada"""
        password = validated_data.pop('password', None)
        
        usuario = Usuario.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=password or Usuario.objects.make_random_password(),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            rol=validated_data.get('rol', 'cliente'),
            sucursal=validated_data.get('sucursal', None),
            is_active=validated_data.get('is_active', True)
        )
        
        print(f"✅ Usuario creado: {usuario.username} (Rol: {usuario.rol})")
        if usuario.sucursal:
            print(f"   Sucursal: {usuario.sucursal.nombre}")
        else:
            print(f"   Sin sucursal asignada")
        
        return usuario
    
    def update(self, instance, validated_data):
        """Actualizar usuario"""
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        
        print(f"🔄 Usuario actualizado: {instance.username}")
        return instance


# ============================================================================
# PRODUCTO SERIALIZER (ACTUALIZADO CON SUCURSAL)
# ============================================================================

class ProductoSerializer(serializers.ModelSerializer):
    """
    Serializer para productos con soporte completo para Cloudinary y Sucursal
    """
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
        """Retorna la URL completa de la imagen desde Cloudinary"""
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
        """Valida la imagen subida"""
        if value:
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError(
                    "La imagen no debe superar los 5MB"
                )
            
            allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
            if hasattr(value, 'content_type') and value.content_type not in allowed_types:
                raise serializers.ValidationError(
                    "Solo se permiten imágenes JPG, PNG o WEBP"
                )
        
        return value
    
    def to_representation(self, instance):
        """Personalizar la representación para devolver imagen_url en lugar de imagen"""
        representation = super().to_representation(instance)
        imagen_url = representation.pop('imagen_url', None)
        representation['imagen'] = imagen_url
        
        if instance.stock == 0:
            print(f"⚠️  Producto agotado: {instance.nombre}")
        
        return representation
    
    def create(self, validated_data):
        """Crear producto y subir imagen a Cloudinary"""
        print(f"\n{'='*60}")
        print(f"📦 Creando producto: {validated_data.get('nombre')}")
        
        imagen = validated_data.get('imagen')
        if imagen:
            print(f"📸 Imagen recibida: {imagen.name} ({imagen.size} bytes)")
        
        producto = Producto.objects.create(**validated_data)
        
        if producto.imagen:
            print(f"✅ Imagen subida a Cloudinary: {producto.imagen.url}")
        
        print(f"✅ Producto creado con ID: {producto.id}")
        print(f"   Sucursal: {producto.sucursal.nombre}")
        print(f"{'='*60}\n")
        
        return producto
    
    def update(self, instance, validated_data):
        """Actualizar producto y manejar imagen"""
        print(f"\n{'='*60}")
        print(f"🔄 Actualizando producto: {instance.nombre} (ID: {instance.id})")
        
        nueva_imagen = validated_data.get('imagen')
        imagen_anterior = instance.imagen
        
        if nueva_imagen:
            print(f"📸 Nueva imagen recibida: {nueva_imagen.name}")
            
            if imagen_anterior and hasattr(settings, 'CLOUDINARY_CLOUD_NAME'):
                try:
                    if hasattr(imagen_anterior, 'public_id'):
                        public_id = imagen_anterior.public_id
                        print(f"🗑️  Eliminando imagen anterior: {public_id}")
                        cloudinary.uploader.destroy(public_id)
                except Exception as e:
                    print(f"⚠️  Error eliminando imagen anterior: {e}")
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        print(f"✅ Producto actualizado exitosamente")
        print(f"{'='*60}\n")
        
        return instance


# ============================================================================
# OFERTA SERIALIZERS (ACTUALIZADOS CON SUCURSAL)
# ============================================================================

class ProductoOfertaSerializer(serializers.ModelSerializer):
    """Serializer para productos con cantidades en ofertas"""
    producto = ProductoSerializer(read_only=True)
    producto_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = ProductoOferta
        fields = ['id', 'producto', 'producto_id', 'cantidad']
    
    def validate_cantidad(self, value):
        """Validar que la cantidad sea mayor a 0"""
        if value < 1:
            raise serializers.ValidationError("La cantidad debe ser al menos 1")
        return value


class OfertaSerializer(serializers.ModelSerializer):
    """Serializer para ofertas con cantidades de productos y sucursal"""
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
        
    def validate_productos_data(self, value):
        """Valida la estructura de productos_data"""
        if not value:
            raise serializers.ValidationError("Debe incluir al menos un producto")
        
        for item in value:
            if 'producto_id' not in item:
                raise serializers.ValidationError(
                    "Cada producto debe tener 'producto_id'"
                )
            
            if 'cantidad' not in item:
                raise serializers.ValidationError(
                    "Cada producto debe tener 'cantidad'"
                )
            
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
        
        # ⭐ VALIDAR: Que los productos pertenezcan a la misma sucursal de la oferta
        sucursal = data.get('sucursal')
        productos_data = data.get('productos_data', [])
        
        if sucursal and productos_data:
            productos_ids = [p['producto_id'] for p in productos_data]
            productos_otra_sucursal = Producto.objects.filter(
                id__in=productos_ids
            ).exclude(sucursal=sucursal)
            
            if productos_otra_sucursal.exists():
                nombres = ', '.join([p.nombre for p in productos_otra_sucursal])
                raise serializers.ValidationError({
                    'productos_data': f'Los siguientes productos no pertenecen a la sucursal seleccionada: {nombres}'
                })
        
        return data
    
    def create(self, validated_data):
        """Crea la oferta y asocia los productos con cantidades"""
        print(f"\n{'='*60}")
        print("🎉 CREANDO NUEVA OFERTA CON CANTIDADES")
        print(f"{'='*60}")
        
        productos_data = validated_data.pop('productos_data')
        print(f"📦 Productos a agregar: {len(productos_data)}")
        
        oferta = Oferta.objects.create(**validated_data)
        print(f"✅ Oferta creada: {oferta.titulo} (ID: {oferta.id})")
        print(f"   Sucursal: {oferta.sucursal.nombre}")
        
        for item in productos_data:
            producto_id = item['producto_id']
            cantidad = item['cantidad']
            
            producto = Producto.objects.get(id=producto_id)
            
            if producto.stock == 0:
                print(f"⚠️  Advertencia: {producto.nombre} está agotado")
            
            ProductoOferta.objects.create(
                oferta=oferta,
                producto=producto,
                cantidad=cantidad
            )
            
            print(f"   ✓ {cantidad}x {producto.nombre}")
        
        print(f"✅ {len(productos_data)} producto(s) asociado(s)")
        print(f"{'='*60}\n")
        
        return oferta
    
    def update(self, instance, validated_data):
        """Actualiza la oferta y sus productos con cantidades"""
        print(f"\n{'='*60}")
        print(f"🔄 ACTUALIZANDO OFERTA: {instance.titulo}")
        print(f"{'='*60}")
        
        productos_data = validated_data.pop('productos_data', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if productos_data is not None:
            ProductoOferta.objects.filter(oferta=instance).delete()
            print(f"🗑️  Relaciones anteriores eliminadas")
            
            for item in productos_data:
                producto_id = item['producto_id']
                cantidad = item['cantidad']
                
                producto = Producto.objects.get(id=producto_id)
                
                if producto.stock == 0:
                    print(f"⚠️  Advertencia: {producto.nombre} está agotado")
                
                ProductoOferta.objects.create(
                    oferta=instance,
                    producto=producto,
                    cantidad=cantidad
                )
                
                print(f"   ✓ {cantidad}x {producto.nombre}")
            
            print(f"✅ {len(productos_data)} producto(s) actualizado(s)")
        
        print(f"✅ Oferta actualizada exitosamente")
        print(f"{'='*60}\n")
        
        return instance
    
    def to_representation(self, instance):
        """Personaliza la representación para incluir productos_data"""
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
# PEDIDO SERIALIZERS (sin cambios en la estructura)
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
    # ⭐ NUEVO: Agregar sucursal del producto
    sucursal_nombre = serializers.CharField(source='producto.sucursal.nombre', read_only=True)
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
            'producto_nombre', 'sucursal_nombre', 'cantidad', 'precio_unitario', 'precio_total',  # ⭐ Agregar sucursal_nombre
            'es_oferta'
        ]
        read_only_fields = ['id', 'pedido']


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
# CUSTOM JWT SERIALIZER (ACTUALIZADO CON SUCURSAL)
# ============================================================================

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Serializer personalizado que permite login con username O email e incluye sucursal"""
    username_field = 'username'
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        token['username'] = user.username
        token['email'] = user.email
        token['rol'] = user.rol
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        
        # ⭐ NUEVO: Agregar información de sucursal al token
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
        
        # ⭐ FIX 1: Primero verificar si es un email
        user = None
        
        # Si contiene @, es un email
        if '@' in username_or_email:
            try:
                print(f"🔍 Buscando por email...")
                usuario_obj = Usuario.objects.get(email=username_or_email.lower())
                print(f"✅ Usuario encontrado: {usuario_obj.username}")
                
                # ⭐ FIX 2: Autenticar con el USERNAME del objeto, no con el email
                user = authenticate(
                    request=self.context.get('request'),
                    username=usuario_obj.username,  # ⭐ USAR USERNAME, NO EMAIL
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
            # Si no contiene @, es un username
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
        
        # Validar resultado final
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
            }
        }
        
        return data