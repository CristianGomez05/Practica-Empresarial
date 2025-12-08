# Backend/core/signals.py
# ⭐⭐⭐ CORREGIDO: Envía alerta SIEMPRE que stock <= 5 (sin límite de envíos)

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Oferta, Pedido, Producto
import threading
import logging

logger = logging.getLogger(__name__)

# ⭐⭐⭐ CONFIGURACIÓN: Umbral de stock bajo
UMBRAL_STOCK_BAJO = 5  # Stock bajo = 5 o menos unidades


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
# DETECCIÓN DE CAMBIOS EN STOCK (⭐⭐⭐ SIN LÍMITE DE ENVÍOS)
# ============================================================================

@receiver(pre_save, sender=Producto)
def detectar_cambio_stock(sender, instance, **kwargs):
    """
    ⭐⭐⭐ NUEVO COMPORTAMIENTO: Envía alerta SIEMPRE que stock <= 5
    - NO verifica si ya se envió antes
    - Envía correo cada vez que el stock baja o se mantiene en 5 o menos
    """
    if instance.pk:
        try:
            producto_anterior = Producto.objects.get(pk=instance.pk)
            
            print(f"\n{'='*60}")
            print(f"🔍 DETECTANDO CAMBIO DE STOCK")
            print(f"   Producto: {instance.nombre}")
            print(f"   Stock anterior: {producto_anterior.stock}")
            print(f"   Stock nuevo: {instance.stock}")
            print(f"   Umbral stock bajo: {UMBRAL_STOCK_BAJO}")
            print(f"{'='*60}")
            
            # ⭐⭐⭐ CASO 1: PRODUCTO SE QUEDÓ SIN STOCK (0)
            if producto_anterior.stock > 0 and instance.stock == 0:
                print(f"🔴 ¡PRODUCTO AGOTADO! Activando señal de SIN STOCK")
                instance._sin_stock = True
            
            # ⭐⭐⭐ CASO 2: STOCK BAJO (1-5) - SIEMPRE ENVIAR
            elif 1 <= instance.stock <= UMBRAL_STOCK_BAJO:
                # ⭐ CAMBIO CRÍTICO: Ya NO verifica alerta_stock_bajo_enviada
                print(f"⚠️ ¡STOCK BAJO DETECTADO! ({instance.stock} unidades)")
                print(f"📧 Enviando alerta (sin restricciones)")
                instance._stock_bajo = True
            
            # ⭐⭐⭐ CASO 3: STOCK SUFICIENTE (> 5)
            elif instance.stock > UMBRAL_STOCK_BAJO:
                if producto_anterior.stock <= UMBRAL_STOCK_BAJO:
                    print(f"✅ Stock reabastecido por encima del umbral")
            
            print(f"{'='*60}\n")
                
        except Producto.DoesNotExist:
            pass


@receiver(post_save, sender=Producto)
def notificar_cambios_stock(sender, instance, created, **kwargs):
    """
    ⭐⭐⭐ NUEVO: Envía alertas SIN restricciones
    1. Producto agotado (stock = 0) - Solo primera vez
    2. Stock bajo (1-5) - SIEMPRE (cada vez que cambia el stock)
    """
    # ⭐ Alerta de producto AGOTADO (stock = 0) - Solo primera vez
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
                    # Marcar como enviada para evitar spam de agotado
                    Producto.objects.filter(pk=instance.pk).update(alerta_stock_enviada=True)
                    print(f"✅ Alerta de SIN STOCK enviada")
                else:
                    print(f"❌ Alerta de SIN STOCK falló")
            except Exception as e:
                logger.error(f"❌ Error enviando alerta sin stock: {e}")
                print(f"❌ Error enviando alerta sin stock: {e}")
        
        thread = threading.Thread(target=enviar_y_marcar)
        thread.daemon = True
        thread.start()
        
        delattr(instance, '_sin_stock')
    
    # ⭐⭐⭐ Alerta de STOCK BAJO (1-5) - SIEMPRE ENVIAR
    if not created and hasattr(instance, '_stock_bajo'):
        print(f"\n{'='*60}")
        print(f"📧 ENVIANDO ALERTA DE STOCK BAJO (SIN RESTRICCIONES)")
        print(f"   Producto: {instance.nombre}")
        print(f"   Stock actual: {instance.stock}")
        print(f"   Umbral: {UMBRAL_STOCK_BAJO}")
        print(f"{'='*60}\n")
        
        from .emails import enviar_alerta_stock_bajo
        
        # ⭐ CAMBIO CRÍTICO: Ya NO marca como enviada
        # Esto permite enviar alerta cada vez que cambia el stock
        def enviar_sin_marcar():
            try:
                resultado = enviar_alerta_stock_bajo(instance.id)
                if resultado:
                    print(f"✅ Alerta de STOCK BAJO enviada exitosamente")
                else:
                    print(f"❌ Alerta de STOCK BAJO falló")
            except Exception as e:
                logger.error(f"❌ Error enviando alerta stock bajo: {e}")
                print(f"❌ Error enviando alerta stock bajo: {e}")
        
        thread = threading.Thread(target=enviar_sin_marcar)
        thread.daemon = True
        thread.start()
        
        delattr(instance, '_stock_bajo')


# ============================================================================
# RESETEO DE ALERTAS AL REABASTECER
# ============================================================================

@receiver(pre_save, sender=Producto)
def resetear_alerta_agotado(sender, instance, **kwargs):
    """
    ⭐⭐⭐ Solo resetea alerta de SIN STOCK (agotado)
    Ya NO resetea alerta de stock bajo porque se envía siempre
    """
    if instance.pk:
        try:
            producto_anterior = Producto.objects.get(pk=instance.pk)
            
            # ⭐ Si el stock vuelve a tener unidades desde 0, resetear alerta de agotado
            if producto_anterior.stock == 0 and instance.stock > 0:
                print(f"\n{'='*60}")
                print(f"🔄 REABASTECIMIENTO DESDE AGOTADO")
                print(f"   Producto: {instance.nombre}")
                print(f"   Stock: {producto_anterior.stock} → {instance.stock}")
                print(f"{'='*60}")
                print(f"✅ Reseteando alerta de SIN STOCK")
                print(f"✅ Reactivando producto")
                print(f"{'='*60}\n")
                
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
✅ FLUJO COMPLETO DE STOCK Y ALERTAS

⭐ CONFIGURACIÓN ACTUAL: 
- Stock bajo = 5 o menos unidades
- Alerta se envía SIEMPRE (sin límite de envíos)

ALERTAS DE STOCK:

STOCK BAJO (1-5 unidades):
1. Signal pre_save detecta: 1 <= stock <= 5
2. Activa flag _stock_bajo SIEMPRE (sin verificar si ya se envió)
3. Signal post_save: envía email en background
4. NO marca alerta_stock_bajo_enviada (para permitir futuros envíos)
5. ⭐ SE ENVÍA CADA VEZ que el stock cambia y está en 1-5

Ejemplo de envíos:
- Stock: 10 → 5 ✉️ Envía alerta
- Stock: 5 → 4 ✉️ Envía alerta
- Stock: 4 → 3 ✉️ Envía alerta
- Stock: 3 → 2 ✉️ Envía alerta
- Stock: 2 → 1 ✉️ Envía alerta
- Stock: 1 → 0 ✉️ Envía alerta URGENTE (sin stock)

SIN STOCK (0 unidades):
1. Signal pre_save detecta: stock_anterior > 0 y stock_nuevo == 0
2. Activa flag _sin_stock
3. Signal post_save: envía email URGENTE en background
4. Marca alerta_stock_enviada = True (para evitar spam)
5. Marca producto.disponible = False
6. ⭐ Solo se envía UNA VEZ hasta reabastecer

REABASTECIMIENTO:
- Si stock pasa de 0 a >0: resetea alerta_stock_enviada y activa disponible
- ⭐ Ya NO resetea alerta_stock_bajo_enviada porque se envía siempre

CREACIÓN DE PEDIDO:
1. PedidoCreateSerializer.create() reduce stock de productos
2. Si stock = 0, marca producto como no disponible
3. Signal detecta cambio y envía alerta si stock <= 5
4. Envía emails de confirmación en background

CANCELACIÓN DE PEDIDO:
1. Signal pre_save detecta cambio a estado 'cancelado'
2. Restaura stock automáticamente de todos los productos
3. Si producto estaba agotado, lo reactiva
4. Signal post_save envía email a admins notificando cancelación

VENTAJAS:
✅ Admins reciben alerta cada vez que stock está bajo
✅ Permiten monitoreo constante del inventario
✅ Útil para detectar alta demanda de productos
✅ Stock se reduce/restaura correctamente
✅ Productos agotados se reactivan automáticamente
✅ Todo en background sin bloquear requests
✅ Logs detallados para debugging

CONSIDERACIÓN:
⚠️ Más emails = más notificaciones
⚠️ Asegúrate de que los admins estén preparados para recibir alertas frecuentes
⚠️ Considera usar un sistema de consolidación diaria si hay demasiados emails
"""