# Backend/core/signals.py
# ⭐⭐⭐ CORREGIDO: Mejor detección de stock bajo y sin stock

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
            logger.error(f"❌ Error en email background: {str(e)}")
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
    ⭐⭐⭐ Detecta cancelación Y restaura stock automáticamente
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
# DETECCIÓN DE CAMBIOS EN STOCK (⭐⭐⭐ CORREGIDO)
# ============================================================================

@receiver(pre_save, sender=Producto)
def detectar_cambio_stock(sender, instance, **kwargs):
    """
    ⭐⭐⭐ CORREGIDO: Detecta cuando un producto:
    1. Se queda sin stock (stock = 0) → SIN alerta previa
    2. Tiene stock bajo (1-10) → SIN alerta previa
    """
    if instance.pk:
        try:
            producto_anterior = Producto.objects.get(pk=instance.pk)
            
            print(f"\n{'='*60}")
            print(f"🔍 DETECTANDO CAMBIO DE STOCK")
            print(f"   Producto: {instance.nombre}")
            print(f"   Stock anterior: {producto_anterior.stock}")
            print(f"   Stock nuevo: {instance.stock}")
            print(f"   Alerta sin stock enviada: {producto_anterior.alerta_stock_enviada}")
            print(f"   Alerta stock bajo enviada: {producto_anterior.alerta_stock_bajo_enviada}")
            print(f"{'='*60}")
            
            # ⭐⭐⭐ CASO 1: PRODUCTO SE QUEDÓ SIN STOCK (0)
            if producto_anterior.stock > 0 and instance.stock == 0:
                if not producto_anterior.alerta_stock_enviada:
                    print(f"🔴 ¡PRODUCTO AGOTADO! Activando señal de SIN STOCK")
                    instance._sin_stock = True
                else:
                    print(f"⚠️ Producto agotado pero ya se envió alerta antes")
            
            # ⭐⭐⭐ CASO 2: STOCK BAJO (1-10) Y NO SE HA ENVIADO ALERTA
            elif 1 <= instance.stock <= 10:
                # Solo enviar si NO se ha enviado la alerta antes
                if not producto_anterior.alerta_stock_bajo_enviada:
                    print(f"⚠️ ¡STOCK BAJO DETECTADO! ({instance.stock} unidades)")
                    instance._stock_bajo = True
                else:
                    print(f"ℹ️ Stock bajo pero ya se envió alerta antes")
            
            # ⭐⭐⭐ CASO 3: STOCK SE REABASTECE
            elif producto_anterior.stock <= 10 and instance.stock > 10:
                print(f"✅ Stock reabastecido por encima de 10")
                # El reseteo se maneja en otro signal
            
            print(f"{'='*60}\n")
                
        except Producto.DoesNotExist:
            pass


@receiver(post_save, sender=Producto)
def notificar_cambios_stock(sender, instance, created, **kwargs):
    """
    ⭐⭐⭐ CORREGIDO: Envía alertas cuando:
    1. Producto agotado (stock = 0)
    2. Stock bajo (1-10 unidades)
    """
    # ⭐ Alerta de producto AGOTADO (stock = 0)
    if not created and hasattr(instance, '_sin_stock'):
        print(f"\n{'='*60}")
        print(f"📧 ENVIANDO ALERTA DE SIN STOCK")
        print(f"   Producto: {instance.nombre}")
        print(f"   Stock actual: {instance.stock}")
        print(f"{'='*60}\n")
        
        from .emails import enviar_alerta_sin_stock
        
        def enviar_y_marcar():
            try:
                resultado = enviar_alerta_sin_stock(instance.id)
                if resultado:
                    # Solo marcar como enviada si el email se envió exitosamente
                    Producto.objects.filter(pk=instance.pk).update(alerta_stock_enviada=True)
                    print(f"✅ Alerta de SIN STOCK enviada y marcada")
                else:
                    print(f"❌ Alerta de SIN STOCK falló")
            except Exception as e:
                logger.error(f"❌ Error enviando alerta sin stock: {e}")
                print(f"❌ Error enviando alerta sin stock: {e}")
        
        thread = threading.Thread(target=enviar_y_marcar)
        thread.daemon = True
        thread.start()
        
        delattr(instance, '_sin_stock')
    
    # ⭐ Alerta de STOCK BAJO (1-10)
    if not created and hasattr(instance, '_stock_bajo'):
        print(f"\n{'='*60}")
        print(f"📧 ENVIANDO ALERTA DE STOCK BAJO")
        print(f"   Producto: {instance.nombre}")
        print(f"   Stock actual: {instance.stock}")
        print(f"{'='*60}\n")
        
        from .emails import enviar_alerta_stock_bajo
        
        def enviar_y_marcar():
            try:
                resultado = enviar_alerta_stock_bajo(instance.id)
                if resultado:
                    # Solo marcar como enviada si el email se envió exitosamente
                    Producto.objects.filter(pk=instance.pk).update(alerta_stock_bajo_enviada=True)
                    print(f"✅ Alerta de STOCK BAJO enviada y marcada")
                else:
                    print(f"❌ Alerta de STOCK BAJO falló")
            except Exception as e:
                logger.error(f"❌ Error enviando alerta stock bajo: {e}")
                print(f"❌ Error enviando alerta stock bajo: {e}")
        
        thread = threading.Thread(target=enviar_y_marcar)
        thread.daemon = True
        thread.start()
        
        delattr(instance, '_stock_bajo')


# ============================================================================
# RESETEO DE ALERTAS AL REABASTECER
# ============================================================================

@receiver(pre_save, sender=Producto)
def resetear_alertas_al_reabastecer(sender, instance, **kwargs):
    """
    ⭐⭐⭐ CORREGIDO: Resetea las alertas cuando el stock se reabastece
    """
    if instance.pk:
        try:
            producto_anterior = Producto.objects.get(pk=instance.pk)
            
            print(f"\n{'='*60}")
            print(f"🔄 VERIFICANDO REABASTECIMIENTO")
            print(f"   Producto: {instance.nombre}")
            print(f"   Stock: {producto_anterior.stock} → {instance.stock}")
            print(f"{'='*60}")
            
            # ⭐ Si el stock sube por encima de 10, resetear alerta de stock bajo
            if producto_anterior.stock <= 10 and instance.stock > 10:
                print(f"✅ Stock reabastecido por encima de 10 - Reseteando alerta de stock bajo")
                instance.alerta_stock_bajo_enviada = False
            
            # ⭐ Si el stock vuelve a tener unidades, resetear alerta de agotado
            if producto_anterior.stock == 0 and instance.stock > 0:
                print(f"✅ Producto reabastecido desde 0 - Reseteando alerta de sin stock")
                instance.alerta_stock_enviada = False
                instance.disponible = True
            
            print(f"{'='*60}\n")
                
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
✅ FLUJO COMPLETO DE STOCK Y ALERTAS

ALERTAS DE STOCK:

STOCK BAJO (1-10 unidades):
1. Signal pre_save detecta: 1 <= stock <= 10
2. Verifica: alerta_stock_bajo_enviada == False
3. Si cumple: activa flag _stock_bajo
4. Signal post_save: envía email en background
5. Si email exitoso: marca alerta_stock_bajo_enviada = True
6. NO se vuelve a enviar hasta que stock > 10

SIN STOCK (0 unidades):
1. Signal pre_save detecta: stock_anterior > 0 y stock_nuevo == 0
2. Verifica: alerta_stock_enviada == False
3. Si cumple: activa flag _sin_stock
4. Signal post_save: envía email URGENTE en background
5. Si email exitoso: marca alerta_stock_enviada = True
6. Marca producto.disponible = False

REABASTECIMIENTO:
- Si stock pasa de <=10 a >10: resetea alerta_stock_bajo_enviada
- Si stock pasa de 0 a >0: resetea alerta_stock_enviada y activa disponible

CREACIÓN DE PEDIDO:
1. PedidoCreateSerializer.create() reduce stock de productos
2. Si stock = 0, marca producto como no disponible
3. Signal detecta cambio y envía alerta si corresponde
4. Envía emails de confirmación en background

CANCELACIÓN DE PEDIDO:
1. Signal pre_save detecta cambio a estado 'cancelado'
2. Restaura stock automáticamente de todos los productos
3. Si producto estaba agotado, lo reactiva
4. Signal detecta reabastecimiento y resetea alertas
5. Signal post_save envía email a admins notificando cancelación

VENTAJAS:
✅ Alertas solo se envían una vez hasta reabastecer
✅ Stock se reduce/restaura correctamente
✅ Productos agotados se reactivan automáticamente
✅ Todo en background sin bloquear requests
✅ Logs detallados para debugging
"""