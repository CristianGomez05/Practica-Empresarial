# Backend/core/signals.py
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Oferta, Pedido, Producto
import threading
import logging

logger = logging.getLogger(__name__)


def ejecutar_email_background(func, *args, **kwargs):
    """
    Ejecuta una función de email en un hilo separado para no bloquear
    """
    def wrapper():
        try:
            func(*args, **kwargs)
        except Exception as e:
            logger.error(f"❌ Error en email background: {str(e)}")
    
    thread = threading.Thread(target=wrapper)
    thread.daemon = True
    thread.start()
    logger.info(f"📧 Email programado en background: {func.__name__}")


@receiver(post_save, sender=Producto)
def notificar_nuevo_producto(sender, instance, created, **kwargs):
    """
    Envía correo a todos los clientes cuando se crea un nuevo producto
    ⚠️ Se ejecuta en background para no bloquear la creación
    """
    if created:
        print(f"🆕 Nuevo producto creado: {instance.nombre}")
        
        # Ejecutar email en background
        from .emails import enviar_notificacion_nuevo_producto
        ejecutar_email_background(enviar_notificacion_nuevo_producto, instance.id)


@receiver(pre_save, sender=Producto)
def detectar_cambio_disponibilidad(sender, instance, **kwargs):
    """
    Detecta cuando un producto cambia de disponible a no disponible (sin stock)
    """
    if instance.pk:
        try:
            producto_anterior = Producto.objects.get(pk=instance.pk)
            if producto_anterior.disponible and not instance.disponible:
                print(f"⚠️ Producto sin stock detectado: {instance.nombre}")
                instance._sin_stock = True
        except Producto.DoesNotExist:
            pass


@receiver(pre_save, sender=Producto)
def detectar_cambio_stock(sender, instance, **kwargs):
    """
    Detecta cuando un producto:
    1. Se queda sin stock (stock = 0)
    2. Tiene stock bajo (stock ≤ 5 y no había alerta previa)
    """
    if instance.pk:
        try:
            producto_anterior = Producto.objects.get(pk=instance.pk)
            
            # Detectar cuando se queda sin stock
            if producto_anterior.disponible and not instance.disponible:
                print(f"⚠️ Producto sin stock detectado: {instance.nombre}")
                instance._sin_stock = True
            
            # ⭐ NUEVO: Detectar stock bajo
            # Solo enviar si:
            # - El stock actual es ≤ 5
            # - El stock anterior era > 5 O no se había enviado alerta antes
            # - El producto tiene stock (no está en 0)
            if (instance.stock > 0 and instance.stock <= 5 and 
                (producto_anterior.stock > 5 or not producto_anterior.alerta_stock_bajo_enviada)):
                print(f"⚠️ Stock bajo detectado: {instance.nombre} ({instance.stock} unidades)")
                instance._stock_bajo = True
                
        except Producto.DoesNotExist:
            pass


@receiver(post_save, sender=Producto)
def notificar_sin_stock(sender, instance, created, **kwargs):
    """
    Envía alertas cuando un producto:
    1. Se queda sin stock (agotado)
    2. Tiene stock bajo (≤5 unidades)
    """
    # Alerta de producto agotado
    if not created and hasattr(instance, '_sin_stock'):
        print(f"📧 Enviando alerta de sin stock para: {instance.nombre}")
        
        from .emails import enviar_alerta_sin_stock
        ejecutar_email_background(enviar_alerta_sin_stock, instance.id)
        
        # Marcar que se envió la alerta de agotado
        instance.alerta_stock_enviada = True
        Producto.objects.filter(pk=instance.pk).update(alerta_stock_enviada=True)
        
        delattr(instance, '_sin_stock')
    
    # ⭐ NUEVO: Alerta de stock bajo
    if not created and hasattr(instance, '_stock_bajo'):
        print(f"📧 Enviando alerta de stock bajo para: {instance.nombre}")
        
        from .emails import enviar_alerta_stock_bajo
        ejecutar_email_background(enviar_alerta_stock_bajo, instance.id)
        
        # Marcar que se envió la alerta de stock bajo
        Producto.objects.filter(pk=instance.pk).update(alerta_stock_bajo_enviada=True)
        
        delattr(instance, '_stock_bajo')


# ⭐ NUEVO: Signal para resetear alertas cuando se reabastece
@receiver(pre_save, sender=Producto)
def resetear_alertas_al_reabastecer(sender, instance, **kwargs):
    """
    Resetea las alertas cuando el stock se reabastece
    """
    if instance.pk:
        try:
            producto_anterior = Producto.objects.get(pk=instance.pk)
            
            # Si el stock sube por encima de 5, resetear alerta de stock bajo
            if producto_anterior.stock <= 5 and instance.stock > 5:
                print(f"✅ Stock reabastecido: {instance.nombre} ({instance.stock} unidades)")
                instance.alerta_stock_bajo_enviada = False
            
            # Si el stock vuelve a tener unidades, resetear alerta de agotado
            if producto_anterior.stock == 0 and instance.stock > 0:
                print(f"✅ Producto reabastecido desde agotado: {instance.nombre}")
                instance.alerta_stock_enviada = False
                instance.disponible = True
                
        except Producto.DoesNotExist:
            pass


@receiver(post_save, sender=Oferta)
def notificar_nueva_oferta(sender, instance, created, **kwargs):
    """
    ⚠️ NO ENVIAR AQUÍ - Los productos aún no están asociados
    El correo se enviará manualmente desde la vista
    """
    if created:
        print(f"🎉 Nueva oferta creada: {instance.titulo} (correo se enviará después de asociar productos)")


@receiver(post_save, sender=Pedido)
def notificar_pedido(sender, instance, created, **kwargs):
    """
    SOLO envía correos cuando se ACTUALIZA un pedido (cambio de estado)
    NO envía correos al crear (created=True) porque aún no tiene detalles
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
    Detecta cuando cambia el estado de un pedido para enviar notificación apropiada
    """
    if instance.pk:
        try:
            pedido_anterior = Pedido.objects.get(pk=instance.pk)
            if pedido_anterior.estado != instance.estado:
                instance._estado_cambio = True
                print(f"🔄 Estado del pedido #{instance.id} cambió: {pedido_anterior.estado} → {instance.estado}")
        except Pedido.DoesNotExist:
            pass


@receiver(post_save, sender=Pedido)
def notificar_cambio_estado_pedido(sender, instance, created, **kwargs):
    """
    Envía notificación cuando el estado del pedido cambia
    ⚠️ Se ejecuta en background
    """
    if not created and hasattr(instance, '_estado_cambio'):
        print(f"📧 Enviando notificación de cambio de estado para pedido #{instance.id}")
        
        # Ejecutar email en background
        from .emails import enviar_actualizacion_estado
        ejecutar_email_background(enviar_actualizacion_estado, instance.id)
        
        # Limpiar flag
        delattr(instance, '_estado_cambio')


# ============================================================================
# DOCUMENTACIÓN
# ============================================================================

"""
✅ FLUJO DE EMAILS EN BACKGROUND

Todos los emails se ejecutan en hilos separados (threading) para no bloquear:
1. Creación de productos
2. Actualización de stock
3. Cambios de estado de pedidos

Ventajas:
- ✅ No bloquea el request/response
- ✅ No causa timeouts en Gunicorn
- ✅ El usuario recibe respuesta inmediata
- ✅ Los emails se envían en paralelo

Desventajas:
- ⚠️ Si falla el email, no se notifica al usuario
- ⚠️ No es escalable para alto volumen (usar Celery en ese caso)

FLUJO DE CORREOS:
- NUEVO PRODUCTO: Signal al crear producto → Background
- SIN STOCK: Signal al cambiar disponibilidad → Background
- NUEVA OFERTA: Manual desde la vista (después de asociar productos) → Background
- NUEVO PEDIDO: Manual desde la vista (después de crear detalles) → Background
- CAMBIO ESTADO PEDIDO: Signal al cambiar estado → Background
"""