# Backend/core/serializers.py
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Usuario, Producto, Oferta, Pedido, DetallePedido
from django.utils import timezone


class UsuarioSerializer(serializers.ModelSerializer):
    """
    Serializer para usuarios con información completa
    """
    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'rol', 'is_active', 'date_joined'
        ]
        read_only_fields = ['date_joined', 'is_active']


class ProductoSerializer(serializers.ModelSerializer):
    """
    Serializer para productos con información adicional incluyendo stock
    """
    tiene_oferta = serializers.SerializerMethodField()
    oferta_activa = serializers.SerializerMethodField()
    esta_agotado = serializers.SerializerMethodField()
    
    class Meta:
        model = Producto
        fields = [
            'id', 'nombre', 'descripcion', 'precio', 
            'disponible', 'imagen', 'stock', 'esta_agotado',
            'tiene_oferta', 'oferta_activa'
        ]
        read_only_fields = ['alerta_stock_enviada']
    
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


class OfertaSerializer(serializers.ModelSerializer):
    """
    Serializer para ofertas con soporte para múltiples productos
    """
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
        """
        Calcula los días restantes de la oferta
        """
        hoy = timezone.now().date()
        if obj.fecha_fin >= hoy:
            delta = obj.fecha_fin - hoy
            return delta.days
        return 0
    
    def get_esta_activa(self, obj):
        """
        Verifica si la oferta está activa
        """
        hoy = timezone.now().date()
        return obj.fecha_inicio <= hoy <= obj.fecha_fin
    
    def validate_productos_ids(self, value):
        """
        Valida que los IDs de productos existan
        """
        if not value:
            raise serializers.ValidationError("Debe seleccionar al menos un producto")
        
        # Verificar que todos los productos existan
        for prod_id in value:
            if not Producto.objects.filter(id=prod_id, disponible=True).exists():
                raise serializers.ValidationError(
                    f"El producto con ID {prod_id} no existe o no está disponible"
                )
        
        return value
    
    def validate(self, data):
        """
        Validaciones personalizadas
        """
        if data.get('fecha_inicio') and data.get('fecha_fin'):
            if data['fecha_fin'] < data['fecha_inicio']:
                raise serializers.ValidationError({
                    'fecha_fin': 'La fecha de fin debe ser posterior a la fecha de inicio'
                })
        
        # Validar que el precio de oferta sea válido
        if data.get('precio_oferta') is not None and data['precio_oferta'] <= 0:
            raise serializers.ValidationError({
                'precio_oferta': 'El precio debe ser mayor a 0'
            })
        
        return data
    
    def create(self, validated_data):
        """
        Crea la oferta y asocia los productos
        """
        productos_ids = validated_data.pop('productos_ids')
        oferta = Oferta.objects.create(**validated_data)
        oferta.productos.set(productos_ids)
        return oferta
    
    def update(self, instance, validated_data):
        """
        Actualiza la oferta y sus productos
        """
        productos_ids = validated_data.pop('productos_ids', None)
        
        # Actualizar campos básicos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Actualizar productos si se proporcionaron
        if productos_ids is not None:
            instance.productos.set(productos_ids)
        
        return instance
    
    def to_representation(self, instance):
        """
        Personaliza la representación para incluir productos_ids
        """
        representation = super().to_representation(instance)
        # Agregar lista de IDs para facilitar edición en frontend
        representation['productos_ids'] = list(instance.productos.values_list('id', flat=True))
        return representation


class DetallePedidoSerializer(serializers.ModelSerializer):
    """
    Serializer para detalles de pedido con información del producto
    """
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
    es_oferta = serializers.SerializerMethodField()  # NUEVO

    class Meta:
        model = DetallePedido
        fields = [
            'id', 'pedido', 'producto', 'producto_id', 
            'producto_nombre', 'cantidad', 'precio_unitario', 'precio_total',
            'es_oferta'  # NUEVO
        ]
        read_only_fields = ['id', 'pedido']
    
    def get_precio_total(self, obj):
        """
        Calcula el precio total del detalle
        """
        return obj.producto.precio * obj.cantidad
    
    def get_es_oferta(self, obj):
        """
        Verifica si el producto tiene una oferta activa
        """
        hoy = timezone.now().date()
        return obj.producto.ofertas.filter(
            fecha_inicio__lte=hoy,
            fecha_fin__gte=hoy
        ).exists()


class PedidoSerializer(serializers.ModelSerializer):
    """
    Serializer para pedidos con detalles completos (SOLO LECTURA)
    """
    detalles = DetallePedidoSerializer(many=True, read_only=True)
    usuario = UsuarioSerializer(read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    cantidad_items = serializers.SerializerMethodField()
    tiempo_transcurrido = serializers.SerializerMethodField()
    es_oferta = serializers.SerializerMethodField()  # NUEVO

    class Meta:
        model = Pedido
        fields = [
            'id', 'usuario', 'usuario_nombre', 'fecha', 'estado', 
            'estado_display', 'detalles', 'total', 
            'cantidad_items', 'tiempo_transcurrido', 'es_oferta'  # NUEVO
        ]
        read_only_fields = ['id', 'fecha', 'usuario', 'total']
    
    def get_cantidad_items(self, obj):
        """
        Cuenta la cantidad total de items en el pedido
        """
        return sum(detalle.cantidad for detalle in obj.detalles.all())
    
    def get_tiempo_transcurrido(self, obj):
        """
        Calcula el tiempo transcurrido desde que se hizo el pedido
        """
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
        """
        Verifica si el pedido contiene al menos un producto de oferta
        """
        hoy = timezone.now().date()
        for detalle in obj.detalles.all():
            if detalle.producto.ofertas.filter(
                fecha_inicio__lte=hoy,
                fecha_fin__gte=hoy
            ).exists():
                return True
        return False


class PedidoCreateSerializer(serializers.Serializer):
    """
    Serializer específico para crear pedidos desde el frontend
    """
    items = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=False,
        write_only=True
    )
    
    def validate_items(self, items):
        """
        Valida la estructura de los items
        """
        if not items:
            raise serializers.ValidationError("Debe incluir al menos un producto")
            
        for item in items:
            if 'producto' not in item:
                raise serializers.ValidationError("Cada item debe tener 'producto'")
            if 'cantidad' not in item:
                raise serializers.ValidationError("Cada item debe tener 'cantidad'")
            
            if not isinstance(item['cantidad'], int) or item['cantidad'] < 1:
                raise serializers.ValidationError("La cantidad debe ser un entero mayor a 0")
            
            # Validar que el producto existe y está disponible
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
        """
        Crea el pedido con sus detalles
        """
        items_data = validated_data.pop('items')
        usuario = self.context['request'].user
        
        # Crear pedido
        pedido = Pedido.objects.create(
            usuario=usuario,
            estado='recibido',
            total=0  # Se calculará después
        )
        
        # Crear detalles y calcular total
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
        
        # Actualizar total
        pedido.total = total
        pedido.save()
        
        return pedido
    
    def to_representation(self, instance):
        """
        Retorna la representación completa del pedido creado
        """
        return PedidoSerializer(instance, context=self.context).data
    

class UsuarioRegistroSerializer(serializers.ModelSerializer):
    """
    Serializer para el registro de nuevos usuarios
    """
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
        """
        Validar que el username sea único
        """
        if Usuario.objects.filter(username=value).exists():
            raise serializers.ValidationError(
                "Este nombre de usuario ya está en uso"
            )
        return value

    def validate_email(self, value):
        """
        Validar que el email sea único y válido
        """
        if Usuario.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "Este correo electrónico ya está registrado"
            )
        
        # Validación adicional del formato de email
        if '@' not in value or '.' not in value.split('@')[-1]:
            raise serializers.ValidationError(
                "Ingresa un correo electrónico válido"
            )
        
        return value.lower()

    def validate(self, data):
        """
        Validar que las contraseñas coincidan
        """
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Las contraseñas no coinciden'
            })
        
        # Validación adicional de contraseña
        password = data['password']
        if len(password) < 8:
            raise serializers.ValidationError({
                'password': 'La contraseña debe tener al menos 8 caracteres'
            })
        
        # Verificar que tenga al menos una letra y un número
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
        """
        Crear el usuario con la contraseña hasheada
        """
        # Remover password_confirm
        validated_data.pop('password_confirm')
        
        # Crear usuario
        usuario = Usuario.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            rol='cliente'  # Por defecto todos los registrados son clientes
        )
        
        return usuario
    
# ============================================================================
# CUSTOM JWT SERIALIZER - DEBE IR AL FINAL
# ============================================================================

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Serializer personalizado para incluir información adicional en el token JWT
    """
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
        data = super().validate(attrs)
        
        # Agregar información adicional a la respuesta
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'rol': self.user.rol,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
        }
        
        return data