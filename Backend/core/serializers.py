# Backend/core/serializers.py
from rest_framework import serializers
from .models import Usuario, Producto, Oferta, Pedido, DetallePedido


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'rol', 'is_active', 'date_joined']
        read_only_fields = ['date_joined']


class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = ['id', 'nombre', 'descripcion', 'precio', 'disponible', 'imagen']
    
    # Agregar campo imagen como URL si no existe
    imagen = serializers.SerializerMethodField()
    
    def get_imagen(self, obj):
        # Si tienes imágenes guardadas, retorna la URL
        # Por ahora, retorna placeholder
        return None


class OfertaSerializer(serializers.ModelSerializer):
    producto = ProductoSerializer(read_only=True)
    producto_id = serializers.PrimaryKeyRelatedField(
        queryset=Producto.objects.all(), 
        source='producto', 
        write_only=True
    )

    class Meta:
        model = Oferta
        fields = [
            'id', 
            'titulo', 
            'descripcion', 
            'fecha_inicio', 
            'fecha_fin', 
            'producto', 
            'producto_id'
        ]


class DetallePedidoSerializer(serializers.ModelSerializer):
    producto = ProductoSerializer(read_only=True)
    producto_id = serializers.PrimaryKeyRelatedField(
        queryset=Producto.objects.all(), 
        source='producto', 
        write_only=True
    )
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    precio_total = serializers.SerializerMethodField()

    class Meta:
        model = DetallePedido
        fields = [
            'id', 
            'pedido', 
            'producto', 
            'producto_id', 
            'producto_nombre',
            'cantidad',
            'precio_total'
        ]
    
    def get_precio_total(self, obj):
        return obj.producto.precio * obj.cantidad


class PedidoSerializer(serializers.ModelSerializer):
    detalles = DetallePedidoSerializer(many=True, read_only=True)
    usuario = UsuarioSerializer(read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    items = serializers.ListField(write_only=True, required=False)

    class Meta:
        model = Pedido
        fields = [
            'id', 
            'usuario', 
            'fecha', 
            'estado', 
            'detalles', 
            'total',
            'items'
        ]
        read_only_fields = ['fecha']