from django.contrib import admin
from .models import Usuario, Producto, Oferta, Pedido, DetallePedido

# Personalización básica del panel
@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'rol', 'is_staff', 'is_active', 'date_joined')
    search_fields = ('username', 'email')
    list_filter = ('rol', 'is_active', 'is_staff')
    ordering = ('username',)


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'precio', 'disponible')
    search_fields = ('nombre',)
    list_filter = ('disponible',)
    ordering = ('nombre',)


@admin.register(Oferta)
class OfertaAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'producto', 'fecha_inicio', 'fecha_fin')
    search_fields = ('titulo', 'producto__nombre')
    list_filter = ('fecha_inicio', 'fecha_fin')
    ordering = ('-fecha_inicio',)


class DetallePedidoInline(admin.TabularInline):
    model = DetallePedido
    extra = 1


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ('id', 'usuario', 'fecha', 'estado')
    search_fields = ('usuario__username',)
    list_filter = ('estado', 'fecha')
    inlines = [DetallePedidoInline]
    ordering = ('-fecha',)


@admin.register(DetallePedido)
class DetallePedidoAdmin(admin.ModelAdmin):
    list_display = ('pedido', 'producto', 'cantidad')
    search_fields = ('pedido__id', 'producto__nombre')
    list_filter = ('producto',)
