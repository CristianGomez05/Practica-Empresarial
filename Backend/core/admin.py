# Backend/core/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import Usuario, Producto, Oferta, ProductoOferta, Pedido, DetallePedido


@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'rol_badge', 'is_active', 'is_staff', 'date_joined')
    list_filter = ('rol', 'is_active', 'is_staff', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    readonly_fields = ('date_joined', 'last_login')
    
    fieldsets = (
        ('Información Personal', {
            'fields': ('username', 'email', 'first_name', 'last_name')
        }),
        ('Permisos y Roles', {
            'fields': ('rol', 'is_active', 'is_staff', 'is_superuser')
        }),
        ('Fechas Importantes', {
            'fields': ('date_joined', 'last_login')
        }),
    )
    
    def rol_badge(self, obj):
        """Muestra el rol con un badge de color"""
        colors = {
            'cliente': 'green',
            'administrador': 'blue',
        }
        color = colors.get(obj.rol, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px; font-weight: bold;">{}</span>',
            color, obj.get_rol_display()
        )
    rol_badge.short_description = 'Rol'


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'precio_formateado', 'stock', 'disponible_badge', 'tiene_imagen', 'ofertas_count')
    list_filter = ('disponible',)
    search_fields = ('nombre', 'descripcion')
    ordering = ('nombre',)
    
    fieldsets = (
        ('Información del Producto', {
            'fields': ('nombre', 'descripcion', 'precio', 'stock', 'disponible')
        }),
        ('Imagen', {
            'fields': ('imagen',),
            'description': 'URL de la imagen del producto'
        }),
    )
    
    def precio_formateado(self, obj):
        """Formatea el precio con símbolo de moneda"""
        return format_html(
            '<strong style="color: #d97706;">₡{}</strong>',
            f'{obj.precio:,.2f}'
        )
    precio_formateado.short_description = 'Precio'
    
    def disponible_badge(self, obj):
        """Muestra disponibilidad con badge"""
        if obj.disponible:
            return format_html(
                '<span style="background-color: green; color: white; padding: 3px 10px; '
                'border-radius: 3px;">Disponible</span>'
            )
        return format_html(
            '<span style="background-color: red; color: white; padding: 3px 10px; '
            'border-radius: 3px;">No disponible</span>'
        )
    disponible_badge.short_description = 'Estado'
    
    def tiene_imagen(self, obj):
        """Indica si el producto tiene imagen"""
        if obj.imagen:
            return True
        return False
    tiene_imagen.short_description = 'Imagen'
    tiene_imagen.boolean = True
    
    def ofertas_count(self, obj):
        """Cuenta las ofertas activas del producto"""
        hoy = timezone.now().date()
        count = obj.ofertas.filter(
            fecha_inicio__lte=hoy,
            fecha_fin__gte=hoy
        ).count()
        if count > 0:
            return format_html(
                '<span style="background-color: #fbbf24; color: black; padding: 3px 8px; '
                'border-radius: 3px;">{} oferta(s)</span>',
                count
            )
        return '-'
    ofertas_count.short_description = 'Ofertas Activas'


# ⭐ NUEVO: Inline para productos en ofertas con cantidades
class ProductoOfertaInline(admin.TabularInline):
    model = ProductoOferta
    extra = 1
    fields = ('producto', 'cantidad')
    autocomplete_fields = ['producto']
    verbose_name = 'Producto'
    verbose_name_plural = '🛒 Productos del Combo (con cantidades)'
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "producto":
            kwargs["queryset"] = Producto.objects.filter(disponible=True).order_by('nombre')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(Oferta)
class OfertaAdmin(admin.ModelAdmin):
    list_display = (
        'titulo', 'productos_list', 'precio_oferta', 'estado_badge',
        'fecha_inicio', 'fecha_fin', 'dias_restantes'
    )
    list_filter = ('fecha_inicio', 'fecha_fin')
    search_fields = ('titulo', 'descripcion', 'productos__nombre')
    ordering = ('-fecha_inicio',)
    date_hierarchy = 'fecha_inicio'
    # ⭐ CAMBIO: Usar inline en lugar de filter_horizontal
    inlines = [ProductoOfertaInline]
    
    fieldsets = (
        ('Información de la Oferta', {
            'fields': ('titulo', 'descripcion', 'precio_oferta'),
            'description': '💡 Los productos y sus cantidades se configuran abajo'
        }),
        ('Periodo de Vigencia', {
            'fields': ('fecha_inicio', 'fecha_fin'),
            'description': 'Define cuándo estará activa la oferta'
        }),
    )
    
    def productos_list(self, obj):
        """
        Muestra la lista de productos con cantidades
        """
        productos_oferta = ProductoOferta.objects.filter(oferta=obj).select_related('producto')
        
        if productos_oferta.exists():
            items = []
            for po in productos_oferta[:3]:
                if po.cantidad > 1:
                    items.append(f"{po.cantidad}x {po.producto.nombre}")
                else:
                    items.append(po.producto.nombre)
            
            result = ', '.join(items)
            
            if productos_oferta.count() > 3:
                result += f' y {productos_oferta.count() - 3} más...'
            
            return format_html('<span title="{}">🛒 {}</span>', 
                             'Ver detalles completos en la oferta', 
                             result)
        return '-'
    productos_list.short_description = 'Productos (Cantidades)'
    
    def estado_badge(self, obj):
        """Muestra el estado de la oferta con color"""
        hoy = timezone.now().date()
        
        if obj.fecha_inicio > hoy:
            return format_html(
                '<span style="background-color: #3b82f6; color: white; padding: 3px 10px; '
                'border-radius: 3px;">Próxima</span>'
            )
        elif obj.fecha_fin < hoy:
            return format_html(
                '<span style="background-color: #6b7280; color: white; padding: 3px 10px; '
                'border-radius: 3px;">Expirada</span>'
            )
        else:
            return format_html(
                '<span style="background-color: #10b981; color: white; padding: 3px 10px; '
                'border-radius: 3px;">Activa</span>'
            )
    estado_badge.short_description = 'Estado'
    
    def dias_restantes(self, obj):
        """Calcula días restantes de la oferta"""
        hoy = timezone.now().date()
        
        if obj.fecha_fin >= hoy:
            delta = obj.fecha_fin - hoy
            if delta.days == 0:
                return format_html('<strong style="color: red;">¡Último día!</strong>')
            elif delta.days <= 3:
                return format_html('<strong style="color: orange;">{} días</strong>', delta.days)
            else:
                return f'{delta.days} días'
        return '-'
    dias_restantes.short_description = 'Días Restantes'


class DetallePedidoInline(admin.TabularInline):
    model = DetallePedido
    extra = 0
    readonly_fields = ('producto', 'cantidad', 'precio_unitario', 'subtotal')
    can_delete = False
    
    def precio_unitario(self, obj):
        return f'₡{obj.producto.precio:,.2f}'
    precio_unitario.short_description = 'Precio Unit.'
    
    def subtotal(self, obj):
        total = obj.producto.precio * obj.cantidad
        return f'₡{total:,.2f}'
    subtotal.short_description = 'Subtotal'


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = (
        'id_pedido', 'usuario_link', 'fecha_formateada', 
        'estado_badge', 'total_formateado', 'items_count'
    )
    list_filter = ('estado', 'fecha')
    search_fields = ('id', 'usuario__username', 'usuario__email')
    ordering = ('-fecha',)
    date_hierarchy = 'fecha'
    inlines = [DetallePedidoInline]
    readonly_fields = ('fecha', 'total')
    
    fieldsets = (
        ('Información del Pedido', {
            'fields': ('usuario', 'fecha', 'estado', 'total')
        }),
    )
    
    actions = ['marcar_en_preparacion', 'marcar_listo', 'marcar_entregado']
    
    def id_pedido(self, obj):
        """Muestra el ID con formato"""
        return format_html('<strong>#{}</strong>', obj.id)
    id_pedido.short_description = 'Pedido'
    
    def usuario_link(self, obj):
        """Link al usuario"""
        url = reverse('admin:core_usuario_change', args=[obj.usuario.id])
        return format_html('<a href="{}">{}</a>', url, obj.usuario.username)
    usuario_link.short_description = 'Cliente'
    
    def fecha_formateada(self, obj):
        """Formatea la fecha"""
        return obj.fecha.strftime('%d/%m/%Y %H:%M')
    fecha_formateada.short_description = 'Fecha'
    
    def estado_badge(self, obj):
        """Badge de estado con colores"""
        estados = {
            'recibido': ('#3b82f6', 'Recibido'),
            'en_preparacion': ('#f59e0b', 'En Preparación'),
            'listo': ('#10b981', 'Listo'),
            'entregado': ('#8b5cf6', 'Entregado'),
        }
        color, texto = estados.get(obj.estado, ('#6b7280', obj.get_estado_display()))
        return format_html(
            '<span style="background-color: {}; color: white; padding: 5px 12px; '
            'border-radius: 5px; font-weight: bold;">{}</span>',
            color, texto
        )
    estado_badge.short_description = 'Estado'
    
    def total_formateado(self, obj):
        """Formatea el total"""
        return format_html(
            '<strong style="color: #10b981; font-size: 1.1em;">₡{}</strong>',
            f'{obj.total:,.2f}'
        )
    total_formateado.short_description = 'Total'
    
    def items_count(self, obj):
        """Cuenta los items del pedido"""
        count = obj.detalles.count()
        total_cantidad = sum(d.cantidad for d in obj.detalles.all())
        return format_html(
            '<span title="{} productos únicos">{} items</span>',
            count, total_cantidad
        )
    items_count.short_description = 'Items'
    
    # Acciones masivas
    def marcar_en_preparacion(self, request, queryset):
        updated = queryset.update(estado='en_preparacion')
        self.message_user(request, f'{updated} pedido(s) marcado(s) como "En Preparación"')
    marcar_en_preparacion.short_description = 'Marcar como "En Preparación"'
    
    def marcar_listo(self, request, queryset):
        updated = queryset.update(estado='listo')
        self.message_user(request, f'{updated} pedido(s) marcado(s) como "Listo"')
    marcar_listo.short_description = 'Marcar como "Listo"'
    
    def marcar_entregado(self, request, queryset):
        updated = queryset.update(estado='entregado')
        self.message_user(request, f'{updated} pedido(s) marcado(s) como "Entregado"')
    marcar_entregado.short_description = 'Marcar como "Entregado"'


@admin.register(DetallePedido)
class DetallePedidoAdmin(admin.ModelAdmin):
    list_display = ('pedido_link', 'producto', 'cantidad', 'precio_unitario', 'subtotal')
    list_filter = ('pedido__estado', 'producto')
    search_fields = ('pedido__id', 'producto__nombre')
    
    def pedido_link(self, obj):
        url = reverse('admin:core_pedido_change', args=[obj.pedido.id])
        return format_html('<a href="{}">Pedido #{}</a>', url, obj.pedido.id)
    pedido_link.short_description = 'Pedido'
    
    def precio_unitario(self, obj):
        return f'₡{obj.producto.precio:,.2f}'
    precio_unitario.short_description = 'Precio Unitario'
    
    def subtotal(self, obj):
        total = obj.producto.precio * obj.cantidad
        return format_html('<strong>₡{}</strong>', f'{total:,.2f}')
    subtotal.short_description = 'Subtotal'


# ⭐ NUEVO: Admin para ProductoOferta (opcional, para gestión avanzada)
@admin.register(ProductoOferta)
class ProductoOfertaAdmin(admin.ModelAdmin):
    list_display = ('oferta', 'producto', 'cantidad_badge', 'oferta_estado')
    list_filter = ('oferta__fecha_inicio', 'oferta__fecha_fin')
    search_fields = ('oferta__titulo', 'producto__nombre')
    ordering = ('-oferta__fecha_inicio', 'producto__nombre')
    
    def cantidad_badge(self, obj):
        return format_html(
            '<span style="background-color: #3b82f6; color: white; padding: 3px 10px; '
            'border-radius: 3px; font-weight: bold;">{}x</span>',
            obj.cantidad
        )
    cantidad_badge.short_description = 'Cantidad'
    
    def oferta_estado(self, obj):
        hoy = timezone.now().date()
        if obj.oferta.fecha_inicio <= hoy <= obj.oferta.fecha_fin:
            return format_html(
                '<span style="color: green;">✅ Activa</span>'
            )
        elif obj.oferta.fecha_inicio > hoy:
            return format_html(
                '<span style="color: blue;">🕐 Próxima</span>'
            )
        else:
            return format_html(
                '<span style="color: gray;">⏹ Expirada</span>'
            )
    oferta_estado.short_description = 'Estado Oferta'


# Personalización del sitio de administración
admin.site.site_header = "🥐 Panadería Santa Clara - Administración"
admin.site.site_title = "Panel Admin"
admin.site.index_title = "Gestión de la Panadería"