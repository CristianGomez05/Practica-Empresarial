# Backend/core/models.py
# ⭐ ACTUALIZADO: Agregado estado 'cancelado' para pedidos

from django.db import models
from django.contrib.auth.models import AbstractUser
from cloudinary.models import CloudinaryField

# ============================================================================
# SUCURSAL
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
# USUARIO
# ============================================================================
class Usuario(AbstractUser):
    ROLES = [
        ('cliente', 'Cliente'),
        ('administrador', 'Administrador'),
        ('administrador_general', 'Administrador General'),
    ]
    rol = models.CharField(max_length=25, choices=ROLES, default='cliente')
    
    sucursal = models.ForeignKey(
        Sucursal,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='usuarios',
        help_text='Sucursal asignada (solo para administradores)'
    )
    
    domicilio = models.TextField(
        blank=True,
        null=True,
        help_text='Dirección de entrega del cliente'
    )

    def __str__(self):
        return f"{self.username} ({self.rol})"
    
    @property
    def tiene_domicilio(self):
        """Verifica si el usuario tiene domicilio configurado"""
        return bool(self.domicilio and self.domicilio.strip())


# ============================================================================
# PRODUCTO
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
    
    sucursal = models.ForeignKey(
        Sucursal,
        on_delete=models.CASCADE,
        related_name='productos',
        help_text='Sucursal a la que pertenece este producto',
        null=True,
        blank=True
    )
    
    alerta_stock_enviada = models.BooleanField(
        default=False, 
        help_text='Indica si ya se envió la notificación de stock agotado (=0)'
    )
    alerta_stock_bajo_enviada = models.BooleanField(
        default=False, 
        help_text='Indica si ya se envió la notificación de stock bajo (≤10 unidades)'
    )
    
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
        return self.stock == 0
    
    @property
    def tiene_stock_bajo(self):
        return 0 < self.stock <= 10
    
    def reducir_stock(self, cantidad):
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
    
    sucursal = models.ForeignKey(
        Sucursal,
        on_delete=models.CASCADE,
        related_name='ofertas',
        help_text='Sucursal a la que pertenece esta oferta',
        null=True,
        blank=True
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
        return self.productos.filter(stock__gt=0)
    
    def get_productos_con_cantidad(self):
        return ProductoOferta.objects.filter(oferta=self).select_related('producto')


class ProductoOferta(models.Model):
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
# PEDIDO (⭐ ACTUALIZADO CON FECHA_COMPLETADO Y AUTO-DELETE)
# ============================================================================
class Pedido(models.Model):
    ESTADOS = [
        ('recibido', 'Recibido'),
        ('en_preparacion', 'En preparación'),
        ('listo', 'Listo'),
        ('entregado', 'Entregado'),
        ('cancelado', 'Cancelado'),
    ]
    
    TIPOS_ENTREGA = [
        ('domicilio', 'Entrega a Domicilio'),
        ('recoger', 'Recoger en Sucursal'),
    ]
    
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name="pedidos")
    fecha = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='recibido')
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # ⭐ NUEVO: Registrar cuándo se completó/canceló el pedido
    fecha_completado = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Fecha en que el pedido fue entregado o cancelado'
    )
    
    direccion_entrega = models.TextField(
        blank=True,
        null=True,
        help_text='Dirección de entrega del pedido (copia del domicilio del usuario)'
    )
    
    tipo_entrega = models.CharField(
        max_length=20,
        choices=TIPOS_ENTREGA,
        default='domicilio',
        help_text='Tipo de entrega del pedido'
    )

    class Meta:
        verbose_name = 'Pedido'
        verbose_name_plural = 'Pedidos'
        ordering = ['-fecha']

    def __str__(self):
        return f"Pedido {self.id} - {self.usuario.username} ({self.get_tipo_entrega_display()})"
    
    @property
    def es_domicilio(self):
        """Verifica si es entrega a domicilio"""
        return self.tipo_entrega == 'domicilio'
    
    @property
    def es_recoger(self):
        """Verifica si es para recoger en sucursal"""
        return self.tipo_entrega == 'recoger'
    
    @property
    def puede_cancelarse(self):
        """El pedido solo puede cancelarse si está en estado 'recibido'"""
        return self.estado == 'recibido'
    
    # ⭐⭐⭐ NUEVO: Validar si se puede eliminar
    @property
    def puede_eliminarse(self):
        """
        El pedido puede eliminarse si:
        1. NO está en estado 'en_preparacion' o 'listo'
        2. Si está 'entregado' o 'cancelado', debe tener más de 48 horas
        """
        # No se puede eliminar si está en preparación o listo
        if self.estado in ['en_preparacion', 'listo']:
            return False
        
        # Si está entregado o cancelado, verificar las 48 horas
        if self.estado in ['entregado', 'cancelado']:
            if not self.fecha_completado:
                # Si no tiene fecha_completado, usar fecha de creación como fallback
                fecha_referencia = self.fecha
            else:
                fecha_referencia = self.fecha_completado
            
            tiempo_transcurrido = timezone.now() - fecha_referencia
            return tiempo_transcurrido >= timedelta(hours=48)
        
        # Estados 'recibido' pueden eliminarse siempre
        return True
    
    # ⭐⭐⭐ NUEVO: Método para actualizar fecha_completado automáticamente
    def save(self, *args, **kwargs):
        # Si el estado cambió a 'entregado' o 'cancelado' y no tiene fecha_completado
        if self.estado in ['entregado', 'cancelado'] and not self.fecha_completado:
            self.fecha_completado = timezone.now()
            print(f"✅ Pedido #{self.id} marcado como {self.estado} - Auto-delete en 48h")
        
        super().save(*args, **kwargs)
    
    # ⭐⭐⭐ NUEVO: Obtener tiempo restante hasta auto-delete
    @property
    def tiempo_hasta_auto_delete(self):
        """Retorna el tiempo restante hasta que el pedido sea auto-eliminado"""
        if self.estado not in ['entregado', 'cancelado']:
            return None
        
        if not self.fecha_completado:
            fecha_referencia = self.fecha
        else:
            fecha_referencia = self.fecha_completado
        
        tiempo_transcurrido = timezone.now() - fecha_referencia
        tiempo_restante = timedelta(hours=48) - tiempo_transcurrido
        
        if tiempo_restante.total_seconds() <= 0:
            return "Listo para eliminar"
        
        horas = int(tiempo_restante.total_seconds() // 3600)
        return f"{horas}h restantes"


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


# ============================================================================
# CAMBIOS REALIZADOS:
# ============================================================================
# 1. Pedido.ESTADOS: Agregado ('cancelado', 'Cancelado')
# 2. Pedido: Agregada propiedad 'puede_cancelarse' (bool)