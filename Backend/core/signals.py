# Backend/core/signals.py
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Oferta, Pedido, Producto
from .emails import (
    enviar_notificacion_oferta, 
    enviar_confirmacion_pedido, 
    enviar_actualizacion_estado,
    enviar_notificacion_nuevo_producto,
    enviar_alerta_sin_stock
)


@receiver(post_save, sender=Producto)
def notificar_nuevo_producto(sender, instance, created, **kwargs):
    """
    Envía correo a todos los clientes cuando se crea un nuevo producto
    """
    if created:
        print(f"🆕 Nuevo producto creado: {instance.nombre}")
        try:
            enviar_notificacion_nuevo_producto(instance.id)
        except Exception as e:
            print(f"❌ Error al enviar notificación de nuevo producto: {str(e)}")


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


@receiver(post_save, sender=Producto)
def notificar_sin_stock(sender, instance, created, **kwargs):
    """
    Envía alerta a administradores cuando un producto se queda sin stock
    """
    if not created and hasattr(instance, '_sin_stock'):
        print(f"📧 Enviando alerta de sin stock para: {instance.nombre}")
        try:
            enviar_alerta_sin_stock(instance.id)
        except Exception as e:
            print(f"❌ Error al enviar alerta de stock: {str(e)}")
        finally:
            delattr(instance, '_sin_stock')


@receiver(post_save, sender=Oferta)
def notificar_nueva_oferta(sender, instance, created, **kwargs):
    """
    Envía correo a todos los clientes cuando se crea una nueva oferta
    ⚠️ NO ENVIAR AQUÍ - Los productos aún no están asociados
    El correo se enviará manualmente desde la vista
    """
    if created:
        print(f"🎉 Nueva oferta creada: {instance.titulo} (correo se enviará después de asociar productos)")
        # ⚠️ NO LLAMAR enviar_notificacion_oferta aquí
        # Se llamará manualmente desde perform_create en views.py


# ============================================================================
# 🔧 CORRECCIÓN: NO ENVIAR CORREO AL CREAR PEDIDO
# ============================================================================
# El correo se enviará manualmente desde la vista DESPUÉS de crear los detalles

@receiver(post_save, sender=Pedido)
def notificar_pedido(sender, instance, created, **kwargs):
    """
    SOLO envía correos cuando se ACTUALIZA un pedido (cambio de estado)
    NO envía correos al crear (created=True) porque aún no tiene detalles
    """
    try:
        if created:
            # ⚠️ NO ENVIAR CORREO AQUÍ - Los detalles aún no existen
            print(f"📦 Nuevo pedido creado: #{instance.id} (correo se enviará después)")
        else:
            # Pedido actualizado - verificar si cambió el estado
            print(f"🔄 Pedido #{instance.id} actualizado")
            # Nota: Este signal se ejecutará también cuando se actualice el total
            # Por eso usamos el pre_save para detectar cambios de estado reales
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
    """
    if not created and hasattr(instance, '_estado_cambio'):
        print(f"📧 Enviando notificación de cambio de estado para pedido #{instance.id}")
        try:
            enviar_actualizacion_estado(instance.id)
        except Exception as e:
            print(f"❌ Error al enviar actualización de estado: {str(e)}")
        finally:
            delattr(instance, '_estado_cambio')


# ============================================================================
# COMENTARIOS ACTUALIZADOS
# ============================================================================

"""
⚠️ IMPORTANTE - CAMBIO EN EL FLUJO DE CORREOS:

ANTES (PROBLEMA):
1. Se crea Pedido → Signal envía correo (sin detalles) ❌
2. Se crean DetallePedido
3. Se actualiza total del Pedido → Signal envía otro correo ❌

AHORA (SOLUCIÓN):
1. Se crea Pedido → Signal NO envía correo ✅
2. Se crean DetallePedido ✅
3. Se actualiza total del Pedido ✅
4. La VISTA llama manualmente a enviar_confirmacion_pedido() ✅
5. Cambios de estado → Signal envía notificación ✅

FLUJO DE CORREOS:
- NUEVO PRODUCTO: Signal al crear producto
- SIN STOCK: Signal al cambiar disponibilidad
- NUEVA OFERTA: Signal al crear oferta
- NUEVO PEDIDO: MANUAL desde la vista (después de crear detalles)
- CAMBIO ESTADO PEDIDO: Signal al cambiar estado
"""