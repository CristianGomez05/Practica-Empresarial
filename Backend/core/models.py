# Backend/core/models.py

from django.db import models
from django.contrib.auth.models import AbstractUser
from cloudinary.models import CloudinaryField

# ============================================================================
# SUCURSAL (NUEVO)
# ============================================================================
class Sucursal(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    telefono = models.CharField(max_length=20)
    direccion = models.TextField()
    activa = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Sucursal'
        verbose_name_plural = 'Sucursales'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


# ============================================================================
# USUARIO (ACTUALIZADO)
# ============================================================================
class Usuario(AbstractUser):
    ROLES = [
        ('cliente', 'Cliente'),
        ('administrador', 'Administrador'),
        ('administrador_general', 'Administrador General'),  # ⭐ NUEVO ROL
    ]
    rol = models.CharField(max_length=25, choices=ROLES, default='cliente')
    
    # ⭐ NUEVO: Relación con Sucursal
    sucursal = models.ForeignKey(
        Sucursal,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='usuarios',
        help_text='Sucursal asignada (solo para administradores)'
    )

    def __str__(self):
        return f"{self.username} ({self.rol})"


# ============================================================================
# PRODUCTO (ACTUALIZADO CON SUCURSAL)
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
    
    # ⭐ NUEVO: Relación con Sucursal
    sucursal = models.ForeignKey(
        Sucursal,
        on_delete=models.CASCADE,
        related_name='productos',
        help_text='Sucursal a la que pertenece este producto',
        null=True,  # ⭐ TEMPORAL para la migración
        blank=True  # ⭐ TEMPORAL para la migración
    )
    
    # Alertas de stock
    alerta_stock_enviada = models.BooleanField(
        default=False, 
        help_text='Indica si ya se envió la notificación de stock agotado (=0)'
    )
    alerta_stock_bajo_enviada = models.BooleanField(
        default=False, 
        help_text='Indica si ya se envió la notificación de stock bajo (≤10 unidades)'
    )
    
    # CloudinaryField para imágenes
    imagen = CloudinaryField(
        'imagen',
        blank=True,
        null=True,
        folder='productos/',
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
        return f"{self.nombre} - {self.sucursal.nombre}"
    
    @property
    def esta_agotado(self):
        """Verifica si el producto está agotado"""
        return self.stock == 0
    
    @property
    def tiene_stock_bajo(self):
        """Verifica si el producto tiene stock bajo (≤10)"""
        return 0 < self.stock <= 10
    
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
# OFERTA (ACTUALIZADA CON SUCURSAL)
# ============================================================================
class Oferta(models.Model):
    titulo = models.CharField(max_length=100)
    descripcion = models.TextField()
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    precio_oferta = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # ⭐ NUEVO: Relación con Sucursal
    sucursal = models.ForeignKey(
        Sucursal,
        on_delete=models.CASCADE,
        related_name='ofertas',
        help_text='Sucursal a la que pertenece esta oferta',
        null=True,  # ⭐ TEMPORAL para la migración
        blank=True  # ⭐ TEMPORAL para la migración
    )
    
    productos = models.ManyToManyField(
        Producto, 
        through='ProductoOferta',
        related_name="ofertas"
    )

    class Meta:
        verbose_name = 'Oferta'
        verbose_name_plural = 'Ofertas'
        ordering = ['-fecha_inicio']

    def __str__(self):
        return f"{self.titulo} - {self.sucursal.nombre}"
    
    @property
    def productos_disponibles(self):
        """Retorna solo productos con stock disponible"""
        return self.productos.filter(stock__gt=0)
    
    def get_productos_con_cantidad(self):
        """Retorna productos con sus cantidades"""
        return ProductoOferta.objects.filter(oferta=self).select_related('producto')


# ⭐ Modelo intermedio para cantidades (sin cambios)
class ProductoOferta(models.Model):
    """
    Tabla intermedia que almacena la cantidad de cada producto en una oferta.
    Ejemplo: "2 panes + 1 dona" en el combo
    """
    oferta = models.ForeignKey(Oferta, on_delete=models.CASCADE)
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField(
        default=1,
        help_text='Cantidad de este producto en la oferta'
    )

    class Meta:
        verbose_name = 'Producto en Oferta'
        verbose_name_plural = 'Productos en Ofertas'
        unique_together = ['oferta', 'producto']
        ordering = ['oferta', 'producto']

    def __str__(self):
        return f"{self.cantidad}x {self.producto.nombre} en {self.oferta.titulo}"


# ============================================================================
# PEDIDO (sin cambios)
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
# DETALLE PEDIDO (sin cambios)
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