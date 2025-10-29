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
    Serializer para productos con información adicional
    """
    tiene_oferta = serializers.SerializerMethodField()
    oferta_activa = serializers.SerializerMethodField()
    
    class Meta:
        model = Producto
        fields = [
            'id', 'nombre', 'descripcion', 'precio', 
            'disponible', 'imagen', 'tiene_oferta', 'oferta_activa'
        ]
    
    def get_tiene_oferta(self, obj):
        """
        Verifica si el producto tiene una oferta activa
        """
        hoy = timezone.now().date()
        return obj.ofertas.filter(
            fecha_inicio__lte=hoy,
            fecha_fin__gte=hoy
        ).exists()
    
    def get_oferta_activa(self, obj):
        """
        Retorna la oferta activa si existe
        """
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
                'fecha_inicio': oferta.fecha_inicio,
                'fecha_fin': oferta.fecha_fin
            }
        return None


class OfertaSerializer(serializers.ModelSerializer):
    """
    Serializer para ofertas con validaciones
    """
    producto = ProductoSerializer(read_only=True)
    producto_id = serializers.PrimaryKeyRelatedField(
        queryset=Producto.objects.all(), 
        source='producto', 
        write_only=True
    )
    dias_restantes = serializers.SerializerMethodField()
    esta_activa = serializers.SerializerMethodField()

    class Meta:
        model = Oferta
        fields = [
            'id', 'titulo', 'descripcion', 'fecha_inicio', 'fecha_fin', 
            'producto', 'producto_id', 'dias_restantes', 'esta_activa'
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
    
    def validate(self, data):
        """
        Validaciones personalizadas
        """
        if data.get('fecha_inicio') and data.get('fecha_fin'):
            if data['fecha_fin'] < data['fecha_inicio']:
                raise serializers.ValidationError({
                    'fecha_fin': 'La fecha de fin debe ser posterior a la fecha de inicio'
                })
        
        # Validar que la fecha de inicio no sea muy antigua
        if data.get('fecha_inicio'):
            hoy = timezone.now().date()
            if data['fecha_inicio'] < hoy - timezone.timedelta(days=7):
                raise serializers.ValidationError({
                    'fecha_inicio': 'La fecha de inicio no puede ser más de 7 días en el pasado'
                })
        
        return data


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

    class Meta:
        model = DetallePedido
        fields = [
            'id', 'pedido', 'producto', 'producto_id', 
            'producto_nombre', 'cantidad', 'precio_unitario', 'precio_total'
        ]
    
    def get_precio_total(self, obj):
        """
        Calcula el precio total del detalle
        """
        return obj.producto.precio * obj.cantidad


class PedidoSerializer(serializers.ModelSerializer):
    """
    Serializer para pedidos con detalles completos
    """
    detalles = DetallePedidoSerializer(many=True, read_only=True)
    usuario = UsuarioSerializer(read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    items = serializers.ListField(write_only=True, required=False)
    cantidad_items = serializers.SerializerMethodField()
    tiempo_transcurrido = serializers.SerializerMethodField()

    class Meta:
        model = Pedido
        fields = [
            'id', 'usuario', 'usuario_nombre', 'fecha', 'estado', 
            'estado_display', 'detalles', 'total', 'items', 
            'cantidad_items', 'tiempo_transcurrido'
        ]
        read_only_fields = ['fecha', 'usuario']
    
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
    
    def validate_items(self, items):
        """
        Valida que los items del pedido sean válidos
        """
        if not items:
            raise serializers.ValidationError("Debe incluir al menos un producto")
        
        for item in items:
            if 'producto' not in item or 'cantidad' not in item:
                raise serializers.ValidationError(
                    "Cada item debe tener 'producto' y 'cantidad'"
                )
            
            if item['cantidad'] < 1:
                raise serializers.ValidationError(
                    "La cantidad debe ser mayor a 0"
                )
            
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


class PedidoCreateSerializer(serializers.Serializer):
    """
    Serializer específico para crear pedidos desde el frontend
    """
    items = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=False
    )
    
    def validate_items(self, items):
        """
        Valida la estructura de los items
        """
        for item in items:
            if 'producto' not in item:
                raise serializers.ValidationError("Cada item debe tener 'producto'")
            if 'cantidad' not in item:
                raise serializers.ValidationError("Cada item debe tener 'cantidad'")
            
            if not isinstance(item['cantidad'], int) or item['cantidad'] < 1:
                raise serializers.ValidationError("La cantidad debe ser un entero mayor a 0")
        
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
            estado='recibido'
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
        
        # Guardar total
        pedido.total = total
        pedido.save()
        
        return pedido


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