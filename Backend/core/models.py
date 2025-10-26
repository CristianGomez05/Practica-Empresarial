# Backend/core/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser

# Usuario personalizado
class Usuario(AbstractUser):
    ROLES = [
        ('cliente', 'Cliente'),
        ('administrador', 'Administrador'),
    ]
    rol = models.CharField(max_length=20, choices=ROLES, default='cliente')

    def __str__(self):
        return f"{self.username} ({self.rol})"


class Producto(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    disponible = models.BooleanField(default=True)
    imagen = models.URLField(blank=True, null=True)  # URL de imagen

    def __str__(self):
        return self.nombre


class Oferta(models.Model):
    titulo = models.CharField(max_length=100)
    descripcion = models.TextField()
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name="ofertas")

    def __str__(self):
        return f"{self.titulo} - {self.producto.nombre}"


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

    def __str__(self):
        return f"Pedido {self.id} - {self.usuario.username}"


class DetallePedido(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name="detalles")
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.cantidad} x {self.producto.nombre} (Pedido {self.pedido.id})"