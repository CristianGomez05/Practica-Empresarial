# Backend/core/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Oferta, Pedido
from .emails import enviar_notificacion_oferta, enviar_confirmacion_pedido, enviar_actualizacion_estado


@receiver(post_save, sender=Oferta)
def notificar_nueva_oferta(sender, instance, created, **kwargs):
    """
    Envía correo automático cuando se crea una nueva oferta
    """
    if created:
        print(f"🎉 Nueva oferta creada: {instance.titulo}")
        # Enviar notificación en segundo plano (considera usar Celery en producción)
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
            if 'estado' in kwargs.get('update_fields', []) or True:
                print(f"🔄 Estado del pedido #{instance.id} actualizado a: {instance.estado}")
                enviar_actualizacion_estado(instance.id)
    except Exception as e:
        print(f"❌ Error en notificación de pedido: {str(e)}")