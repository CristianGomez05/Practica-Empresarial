# Backend/core/signals.py
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Oferta, Pedido
from .emails import enviar_notificacion_oferta, enviar_confirmacion_pedido, enviar_actualizacion_estado


# ⭐ NUEVO: Variable para guardar el estado anterior del pedido
@receiver(pre_save, sender=Pedido)
def guardar_estado_anterior(sender, instance, **kwargs):
    """
    Guarda el estado anterior del pedido antes de actualizarlo
    """
    if instance.pk:  # Solo si el pedido ya existe
        try:
            pedido_anterior = Pedido.objects.get(pk=instance.pk)
            instance._estado_anterior = pedido_anterior.estado
            print(f"📝 Estado anterior guardado: {instance._estado_anterior}")
        except Pedido.DoesNotExist:
            instance._estado_anterior = None
    else:
        instance._estado_anterior = None


@receiver(post_save, sender=Oferta)
def notificar_nueva_oferta(sender, instance, created, **kwargs):
    """
    Envía correo automático cuando se crea una nueva oferta
    """
    if created:
        print(f"🎉 Nueva oferta creada: {instance.titulo}")
        try:
            enviar_notificacion_oferta(instance.id)
        except Exception as e:
            print(f"❌ Error al enviar notificación de oferta: {str(e)}")


@receiver(post_save, sender=Pedido)
def notificar_pedido(sender, instance, created, **kwargs):
    """
    Envía correos cuando se crea o actualiza un pedido
    """
    try:
        if created:
            # Nuevo pedido - enviar confirmación
            print(f"📦 Nuevo pedido creado: #{instance.id}")
            enviar_confirmacion_pedido(instance.id)
        else:
            # Pedido actualizado - verificar si cambió el estado
            estado_anterior = getattr(instance, '_estado_anterior', None)
            estado_actual = instance.estado
            
            print(f"🔄 Pedido #{instance.id} actualizado")
            print(f"   Estado anterior: {estado_anterior}")
            print(f"   Estado actual: {estado_actual}")
            
            # ⭐ Solo enviar email si el estado realmente cambió
            if estado_anterior and estado_anterior != estado_actual:
                print(f"   ✉️  Estado cambió, enviando notificación...")
                enviar_actualizacion_estado(instance.id)
            else:
                print(f"   ℹ️  Estado no cambió, no se envía email")
                
    except Exception as e:
        print(f"❌ Error en notificación de pedido: {str(e)}")
        import traceback
        traceback.print_exc()