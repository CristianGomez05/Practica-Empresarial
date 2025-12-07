# Backend/core/signals.py
# ⭐⭐⭐ CORREGIDO: Restaura stock al cancelar pedidos

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Oferta, Pedido, Producto
import threading
import logging

logger = logging.getLogger(__name__)


def ejecutar_email_background(funcion_email, *args, **kwargs):
    """
    Ejecuta una función de email en un hilo separado (background)
    """
    def enviar():
        try:
            funcion_email(*args, **kwargs)
        except Exception as e:
            print(f"❌ Error en email background: {str(e)}")
    
    thread = threading.Thread(target=enviar)
    thread.daemon = True
    thread.start()


@receiver(post_save, sender=Producto)
def notificar_nuevo_producto(sender, instance, created, **kwargs):
    """Envía correo a clientes cuando se crea un nuevo producto"""
    if created:
        print(f"🆕 Nuevo producto creado: {instance.nombre}")
        
        from .emails import enviar_notificacion_nuevo_producto
        ejecutar_email_background(enviar_notificacion_nuevo_producto, instance.id)


@receiver(pre_save, sender=Pedido)
def detectar_cancelacion_pedido(sender, instance, **kwargs):
    """
    ⭐⭐⭐ CORREGIDO: Detecta cancelación Y restaura stock automáticamente
    """
    if instance.pk:  # Solo si el pedido ya existe
        try:
            pedido_anterior = Pedido.objects.get(pk=instance.pk)
            
            # Detectar si cambió a cancelado
            if pedido_anterior.estado != 'cancelado' and instance.estado == 'cancelado':
                instance._pedido_fue_cancelado = True
                print(f"❌ Pedido #{instance.id} fue CANCELADO")
                
                # ⭐⭐⭐ RESTAURAR STOCK INMEDIATAMENTE
                from .models import DetallePedido
                detalles = DetallePedido.objects.filter(pedido=instance).select_related('producto')
                
                print(f"♻️ Restaurando stock del pedido #{instance.id}...")
                for detalle in detalles:
                    producto = detalle.producto
                    cantidad_anterior = producto.stock
                    
                    # Restaurar stock
                    producto.stock += detalle.cantidad
                    
                    # Si el producto estaba agotado, marcarlo como disponible
                    if not producto.disponible and producto.stock > 0:
                        producto.disponible = True
                        print(f"   ✅ {producto.nombre} REACTIVADO (agotado → disponible)")
                    
                    producto.save(update_fields=['stock', 'disponible'])
                    
                    print(f"   ♻️ {producto.nombre}: {cantidad_anterior} → {producto.stock} (+{detalle.cantidad})")
                
        except Pedido.DoesNotExist:
            pass


@receiver(post_save, sender=Pedido)
def notificar_pedido_cancelado(sender, instance, created, **kwargs):
    """
    Envía notificación a admins cuando un pedido es cancelado
    """
    if not created and hasattr(instance, '_pedido_fue_cancelado'):
        print(f"📧 Enviando notificación de cancelación para pedido #{instance.id}")
        
        from .emails import enviar_notificacion_pedido_cancelado
        ejecutar_email_background(enviar_notificacion_pedido_cancelado, instance.id)
        
        delattr(instance, '_pedido_fue_cancelado')


# ============================================================================
# DETECCIÓN DE CAMBIOS EN STOCK
# ============================================================================

@receiver(pre_save, sender=Producto)
def detectar_cambio_stock(sender, instance, **kwargs):
    """
    Detecta cuando un producto:
    1. Se queda sin stock (stock = 0)
    2. Tiene stock bajo (stock ≤ 10)
    """
    if instance.pk:
        try:
            producto_anterior = Producto.objects.get(pk=instance.pk)
            
            # Detectar cuando se queda SIN STOCK (agotado)
            if producto_anterior.stock > 0 and instance.stock == 0:
                print(f"🔴 Producto SIN STOCK detectado: {instance.nombre}")
                instance._sin_stock = True
            
            # Detectar STOCK BAJO (≤10)
            if (instance.stock > 0 and instance.stock <= 10 and 
                (producto_anterior.stock > 10 or not producto_anterior.alerta_stock_bajo_enviada)):
                print(f"⚠️ Stock bajo detectado: {instance.nombre} ({instance.stock} unidades)")
                instance._stock_bajo = True
                
        except Producto.DoesNotExist:
            pass


@receiver(post_save, sender=Producto)
def notificar_cambios_stock(sender, instance, created, **kwargs):
    """
    Envía alertas cuando:
    1. Producto agotado (stock = 0)
    2. Stock bajo (≤10 unidades)
    """
    # Alerta de producto AGOTADO
    if not created and hasattr(instance, '_sin_stock'):
        print(f"📧 Enviando alerta de SIN STOCK para: {instance.nombre}")
        
        from .emails import enviar_alerta_sin_stock
        ejecutar_email_background(enviar_alerta_sin_stock, instance.id)
        
        Producto.objects.filter(pk=instance.pk).update(alerta_stock_enviada=True)
        delattr(instance, '_sin_stock')
    
    # Alerta de STOCK BAJO
    if not created and hasattr(instance, '_stock_bajo'):
        print(f"📧 Enviando alerta de STOCK BAJO para: {instance.nombre}")
        
        from .emails import enviar_alerta_stock_bajo
        ejecutar_email_background(enviar_alerta_stock_bajo, instance.id)
        
        Producto.objects.filter(pk=instance.pk).update(alerta_stock_bajo_enviada=True)
        delattr(instance, '_stock_bajo')


# ============================================================================
# RESETEO DE ALERTAS AL REABASTECER
# ============================================================================

@receiver(pre_save, sender=Producto)
def resetear_alertas_al_reabastecer(sender, instance, **kwargs):
    """
    Resetea las alertas cuando el stock se reabastece
    """
    if instance.pk:
        try:
            producto_anterior = Producto.objects.get(pk=instance.pk)
            
            # Si el stock sube por encima de 10, resetear alerta de stock bajo
            if producto_anterior.stock <= 10 and instance.stock > 10:
                print(f"✅ Stock reabastecido: {instance.nombre} ({instance.stock} unidades)")
                instance.alerta_stock_bajo_enviada = False
            
            # Si el stock vuelve a tener unidades, resetear alerta de agotado
            if producto_anterior.stock == 0 and instance.stock > 0:
                print(f"✅ Producto reabastecido desde agotado: {instance.nombre}")
                instance.alerta_stock_enviada = False
                instance.disponible = True
                
        except Producto.DoesNotExist:
            pass


# ============================================================================
# SIGNALS DE OFERTAS
# ============================================================================

@receiver(post_save, sender=Oferta)
def notificar_nueva_oferta(sender, instance, created, **kwargs):
    """
    NO ENVIAR AQUÍ - Los productos aún no están asociados
    """
    if created:
        print(f"🎉 Nueva oferta creada: {instance.titulo} (correo se enviará después)")


# ============================================================================
# SIGNALS DE PEDIDOS
# ============================================================================

@receiver(post_save, sender=Pedido)
def notificar_pedido(sender, instance, created, **kwargs):
    """
    SOLO envía correos cuando se ACTUALIZA un pedido (cambio de estado)
    """
    try:
        if created:
            print(f"📦 Nuevo pedido creado: #{instance.id} (correo se enviará después)")
        else:
            print(f"🔄 Pedido #{instance.id} actualizado")
    except Exception as e:
        print(f"❌ Error en signal de pedido: {str(e)}")


@receiver(pre_save, sender=Pedido)
def detectar_cambio_estado_pedido(sender, instance, **kwargs):
    """
    Detecta cuando cambia el estado de un pedido
    """
    if instance.pk:
        try:
            pedido_anterior = Pedido.objects.get(pk=instance.pk)
            if pedido_anterior.estado != instance.estado:
                instance._estado_cambio = True
                print(f"🔄 Estado del pedido #{instance.id}: {pedido_anterior.estado} → {instance.estado}")
        except Pedido.DoesNotExist:
            pass


@receiver(post_save, sender=Pedido)
def notificar_cambio_estado_pedido(sender, instance, created, **kwargs):
    """
    Envía notificación cuando el estado del pedido cambia
    """
    if not created and hasattr(instance, '_estado_cambio'):
        print(f"📧 Enviando notificación de cambio de estado para pedido #{instance.id}")
        
        from .emails import enviar_actualizacion_estado
        ejecutar_email_background(enviar_actualizacion_estado, instance.id)
        
        delattr(instance, '_estado_cambio')


# ============================================================================
# DOCUMENTACIÓN
# ============================================================================

"""
✅ FLUJO COMPLETO DE STOCK Y CANCELACIONES

CREACIÓN DE PEDIDO:
1. PedidoCreateSerializer.create() reduce stock de productos
2. Si stock = 0, marca producto como no disponible
3. Envía emails de confirmación en background

CANCELACIÓN DE PEDIDO:
1. Signal pre_save detecta cambio a estado 'cancelado'
2. Restaura stock automáticamente de todos los productos del pedido
3. Si producto estaba agotado (disponible=False), lo reactiva
4. Signal post_save envía email a admins notificando cancelación

ALERTAS DE STOCK:
- STOCK BAJO (≤10): Signal detecta y envía email a admins
- SIN STOCK (=0): Signal detecta y envía email urgente a admins
- Al reabastecer: Resetea flags de alertas automáticamente

VENTAJAS:
✅ Stock se reduce al crear pedido
✅ Stock se restaura al cancelar pedido
✅ Productos agotados se reactivan al restaurar stock
✅ Admins reciben notificación de cancelación
✅ Todo en background sin bloquear requests
"""