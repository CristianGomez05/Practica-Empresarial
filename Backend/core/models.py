# Backend/core/models.py

from django.db import models
from django.contrib.auth.models import AbstractUser
from cloudinary.models import CloudinaryField

# ============================================================================
# USUARIO
# ============================================================================
class Usuario(AbstractUser):
    ROLES = [
        ('cliente', 'Cliente'),
        ('administrador', 'Administrador'),
    ]
    rol = models.CharField(max_length=20, choices=ROLES, default='cliente')

    def __str__(self):
        return f"{self.username} ({self.rol})"


# ============================================================================
# PRODUCTO (CON CLOUDINARY)
# ============================================================================
class Producto(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    disponible = models.BooleanField(default=True)
    stock = models.PositiveIntegerField(
        default=0, 
        help_text='Cantidad disponible en inventario'
    )
    alerta_stock_enviada = models.BooleanField(
        default=False, 
        help_text='Indica si ya se envió la notificación de stock agotado'
    )
    
    # ⭐⭐⭐ USAR CloudinaryField en lugar de ImageField ⭐⭐⭐
    imagen = CloudinaryField(
        'imagen',
        blank=True,
        null=True,
        folder='productos/',  # Carpeta en Cloudinary
        transformation={
            'quality': 'auto',
            'fetch_format': 'auto'
        }
    )

    class Meta:
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        ordering = ['-id']

    def __str__(self):
        return self.nombre
    
    @property
    def esta_agotado(self):
        """Verifica si el producto está agotado"""
        return self.stock == 0
    
    def reducir_stock(self, cantidad):
        """Reduce el stock del producto"""
        if self.stock >= cantidad:
            self.stock -= cantidad
            if self.stock == 0:
                self.disponible = False
            self.save()
            return True
        return False


# ============================================================================
# OFERTA
# ============================================================================
class Oferta(models.Model):
    titulo = models.CharField(max_length=100)
    descripcion = models.TextField()
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    precio_oferta = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    productos = models.ManyToManyField(Producto, related_name="ofertas")

    class Meta:
        verbose_name = 'Oferta'
        verbose_name_plural = 'Ofertas'
        ordering = ['-fecha_inicio']

    def __str__(self):
        return f"{self.titulo}"
    
    @property
    def productos_disponibles(self):
        """Retorna solo productos con stock disponible"""
        return self.productos.filter(stock__gt=0)


# ============================================================================
# PEDIDO
# ============================================================================
class Pedido(models.Model):
    ESTADOS = [
        ('recibido', 'Recibido'),
        ('en_preparacion', 'En preparación'),
        ('listo', 'Listo'),
        ('entregado', 'Entregado'),
    ]
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name="pedidos")
    fecha = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='recibido')
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        verbose_name = 'Pedido'
        verbose_name_plural = 'Pedidos'
        ordering = ['-fecha']

    def __str__(self):
        return f"Pedido {self.id} - {self.usuario.username}"


# ============================================================================
# DETALLE PEDIDO
# ============================================================================
class DetallePedido(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name="detalles")
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField()

    class Meta:
        verbose_name = 'Detalle de Pedido'
        verbose_name_plural = 'Detalles de Pedidos'

    def __str__(self):
        return f"{self.cantidad} x {self.producto.nombre} (Pedido {self.pedido.id})"