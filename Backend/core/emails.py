# Backend/core/emails.py
# ⭐⭐⭐ VERSIÓN CORREGIDA - Incluye enviar_alerta_sin_stock

from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from .models import Usuario, Oferta, Pedido, Producto
from .email_templates import (
    template_nuevo_producto,
    template_nueva_oferta,
    template_confirmacion_pedido,
    template_actualizacion_estado,
    template_alerta_stock_bajo,
    template_alerta_sin_stock,  # ⭐ NUEVO
    template_notificacion_pedido_admin,
    template_pedido_cancelado_admin
)
import logging

logger = logging.getLogger(__name__)

# URLs del frontend
FRONTEND_URL = settings.FRONTEND_URL
URL_PRODUCTOS_CLIENTE = f"{FRONTEND_URL}/dashboard/productos"
URL_OFERTAS_CLIENTE = f"{FRONTEND_URL}/dashboard/ofertas"
URL_PEDIDOS_CLIENTE = f"{FRONTEND_URL}/dashboard/pedidos"
URL_ADMIN_PRODUCTOS = f"{FRONTEND_URL}/admin/productos"
URL_ADMIN_OFERTAS = f"{FRONTEND_URL}/admin/ofertas"
URL_ADMIN_PEDIDOS = f"{FRONTEND_URL}/admin/pedidos"


def enviar_email_seguro(subject, html_content, text_content, recipients):
    """Wrapper para enviar emails con manejo robusto de errores"""
    if not recipients:
        logger.warning("⚠️ No hay destinatarios para el email")
        return False
    
    try:
        logger.info(f"📧 Preparando email: {subject}")
        logger.info(f"   Destinatarios: {len(recipients)}")
        logger.info(f"   Backend: {settings.EMAIL_BACKEND}")
        
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=recipients,
            reply_to=[settings.EMAIL_HOST_USER] if settings.EMAIL_HOST_USER else None
        )
        email.attach_alternative(html_content, "text/html")
        
        result = email.send(fail_silently=False)
        
        if result:
            logger.info(f"✅ Email enviado exitosamente a {len(recipients)} destinatario(s)")
            return True
        else:
            logger.error("❌ email.send() retornó 0")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error al enviar email: {type(e).__name__}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False


def obtener_admins_por_sucursal(sucursal):
    """
    Obtiene admins de una sucursal específica + admin_general
    """
    from django.db.models import Q
    
    admins_sucursal = Usuario.objects.filter(
        rol='administrador',
        sucursal=sucursal,
        is_active=True,
        email__isnull=False
    ).exclude(email='')
    
    admins_generales = Usuario.objects.filter(
        rol='administrador_general',
        is_active=True,
        email__isnull=False
    ).exclude(email='')
    
    emails_sucursal = [admin.email for admin in admins_sucursal if admin.email]
    emails_generales = [admin.email for admin in admins_generales if admin.email]
    
    todos_emails = list(set(emails_sucursal + emails_generales))
    
    logger.info(f"📧 Admins para notificar en {sucursal.nombre}:")
    logger.info(f"   - Admins de sucursal: {len(emails_sucursal)}")
    logger.info(f"   - Admins generales: {len(emails_generales)}")
    logger.info(f"   - Total: {len(todos_emails)}")
    
    return todos_emails


def enviar_notificacion_nuevo_producto(producto_id):
    """Envía correo a todos los clientes cuando se crea un nuevo producto"""
    try:
        producto = Producto.objects.get(id=producto_id)
        
        clientes = Usuario.objects.filter(
            rol='cliente',
            is_active=True,
            email__isnull=False
        ).exclude(email='')
        
        destinatarios = [cliente.email for cliente in clientes if cliente.email]
        
        if not destinatarios:
            logger.warning("⚠️ No hay clientes con correos válidos")
            return False
        
        asunto = f"🥐 Nuevo Producto: {producto.nombre}"
        html_content = template_nuevo_producto(producto, URL_PRODUCTOS_CLIENTE)
        
        text_content = f"""
        ¡Nuevo Producto Disponible!
        
        {producto.nombre}
        {producto.descripcion or 'Delicioso producto recién horneado.'}
        
        Precio: ₡{producto.precio:,.2f}
        
        Ver todos los productos: {URL_PRODUCTOS_CLIENTE}
        
        ---
        Panadería Santa Clara
        Alajuela, Costa Rica
        """
        
        return enviar_email_seguro(asunto, html_content, text_content, destinatarios)
        
    except Producto.DoesNotExist:
        logger.error(f"❌ Producto {producto_id} no encontrado")
        return False
    except Exception as e:
        logger.error(f"❌ Error en enviar_notificacion_nuevo_producto: {str(e)}")
        return False


def enviar_notificacion_oferta(oferta_id):
    """Envía correo a todos los clientes cuando se crea una nueva oferta"""
    try:
        oferta = Oferta.objects.prefetch_related('productos').get(id=oferta_id)
        
        clientes = Usuario.objects.filter(
            rol='cliente',
            is_active=True,
            email__isnull=False
        ).exclude(email='')
        
        destinatarios = [cliente.email for cliente in clientes if cliente.email]
        
        if not destinatarios:
            logger.warning("⚠️ No hay clientes con correos válidos")
            return False
        
        asunto = f"🎉 Nueva Oferta: {oferta.titulo}"
        html_content = template_nueva_oferta(oferta, URL_OFERTAS_CLIENTE)
        
        productos_texto = "\n".join([f"  - {p.nombre} (₡{p.precio:,.2f})" for p in oferta.productos.all()])
        
        text_content = f"""
        ¡Nueva Oferta Especial!
        
        {oferta.titulo}
        {oferta.descripcion}
        
        Productos incluidos:
        {productos_texto}
        
        Precio de oferta: ₡{oferta.precio_oferta:,.2f}
        Válido: {oferta.fecha_inicio} al {oferta.fecha_fin}
        
        Ver ofertas: {URL_OFERTAS_CLIENTE}
        
        ---
        Panadería Santa Clara
        Alajuela, Costa Rica
        """
        
        return enviar_email_seguro(asunto, html_content, text_content, destinatarios)
        
    except Oferta.DoesNotExist:
        logger.error(f"❌ Oferta {oferta_id} no encontrada")
        return False
    except Exception as e:
        logger.error(f"❌ Error en enviar_notificacion_oferta: {str(e)}")
        return False


def enviar_confirmacion_pedido(pedido_id):
    """
    Envía correo de confirmación al cliente Y notifica a admins
    """
    try:
        pedido = Pedido.objects.select_related('usuario').prefetch_related('detalles__producto__sucursal').get(id=pedido_id)
        
        # 1. Enviar confirmación al cliente
        if pedido.usuario.email:
            asunto = f"✅ Confirmación de Pedido #{pedido.id}"
            html_content = template_confirmacion_pedido(pedido, URL_PEDIDOS_CLIENTE)
            
            productos_texto = "\n".join([
                f"  - {d.producto.nombre} x{d.cantidad} = ₡{d.producto.precio * d.cantidad:,.2f}"
                for d in pedido.detalles.all()
            ])
            
            tipo_entrega_texto = "Entrega a domicilio" if pedido.es_domicilio else "Recoger en sucursal"
            direccion_texto = f"\nDirección: {pedido.direccion_entrega}" if pedido.es_domicilio else ""
            
            text_content = f"""
            ¡Pedido Confirmado!
            
            Hola {pedido.usuario.first_name or pedido.usuario.username},
            
            Tu pedido #{pedido.id} ha sido recibido y está siendo preparado.
            
            Tipo de entrega: {tipo_entrega_texto}{direccion_texto}
            
            Productos:
            {productos_texto}
            
            TOTAL: ₡{pedido.total:,.2f}
            
            Ver mis pedidos: {URL_PEDIDOS_CLIENTE}
            
            ---
            Panadería Santa Clara
            Alajuela, Costa Rica
            """
            
            enviar_email_seguro(asunto, html_content, text_content, [pedido.usuario.email])
        
        # 2. Notificar a admins de la sucursal
        sucursal_pedido = None
        primer_detalle = pedido.detalles.first()
        if primer_detalle and primer_detalle.producto.sucursal:
            sucursal_pedido = primer_detalle.producto.sucursal
        
        if sucursal_pedido:
            emails_admin = obtener_admins_por_sucursal(sucursal_pedido)
            
            if emails_admin:
                asunto_admin = f"🔔 Nuevo Pedido #{pedido.id} - {sucursal_pedido.nombre}"
                html_admin = template_notificacion_pedido_admin(pedido, URL_ADMIN_PEDIDOS)
                
                productos_texto_admin = "\n".join([
                    f"  - {d.producto.nombre} x{d.cantidad} = ₡{d.producto.precio * d.cantidad:,.2f}"
                    for d in pedido.detalles.all()
                ])
                
                tipo_entrega_texto = "🚚 Entrega a domicilio" if pedido.es_domicilio else "🏪 Recoger en sucursal"
                direccion_texto = f"\nDirección de entrega: {pedido.direccion_entrega}" if pedido.es_domicilio else ""
                
                text_admin = f"""
                🔔 NUEVO PEDIDO RECIBIDO
                
                Pedido: #{pedido.id}
                Sucursal: {sucursal_pedido.nombre}
                Cliente: {pedido.usuario.get_full_name() or pedido.usuario.username}
                Usuario: {pedido.usuario.username}
                Email: {pedido.usuario.email}
                
                Tipo de pedido: {tipo_entrega_texto}{direccion_texto}
                
                Productos:
                {productos_texto_admin}
                
                TOTAL: ₡{pedido.total:,.2f}
                Estado: {pedido.get_estado_display()}
                
                Gestionar pedido: {URL_ADMIN_PEDIDOS}
                
                ---
                Panadería Santa Clara
                """
                
                enviar_email_seguro(asunto_admin, html_admin, text_admin, emails_admin)
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error en enviar_confirmacion_pedido: {str(e)}")
        return False


def enviar_notificacion_pedido_cancelado(pedido_id):
    """
    Notifica a admins cuando un cliente cancela un pedido
    """
    try:
        pedido = Pedido.objects.select_related('usuario').prefetch_related('detalles__producto__sucursal').get(id=pedido_id)
        
        sucursal_pedido = None
        primer_detalle = pedido.detalles.first()
        if primer_detalle and primer_detalle.producto.sucursal:
            sucursal_pedido = primer_detalle.producto.sucursal
        
        if not sucursal_pedido:
            logger.warning(f"⚠️ Pedido #{pedido.id} sin sucursal, no se notifica cancelación")
            return False
        
        emails_admin = obtener_admins_por_sucursal(sucursal_pedido)
        
        if not emails_admin:
            logger.warning(f"⚠️ No hay admins para notificar cancelación del pedido #{pedido.id}")
            return False
        
        asunto = f"❌ Pedido Cancelado #{pedido.id} - {sucursal_pedido.nombre}"
        html_content = template_pedido_cancelado_admin(pedido, URL_ADMIN_PEDIDOS)
        
        productos_texto = "\n".join([
            f"  - {d.producto.nombre} x{d.cantidad} = ₡{d.producto.precio * d.cantidad:,.2f}"
            for d in pedido.detalles.all()
        ])
        
        tipo_entrega_texto = "🚚 Entrega a domicilio" if pedido.es_domicilio else "🏪 Recoger en sucursal"
        direccion_texto = f"\nDirección: {pedido.direccion_entrega}" if pedido.es_domicilio else ""
        
        text_content = f"""
        ❌ PEDIDO CANCELADO
        
        Pedido: #{pedido.id}
        Sucursal: {sucursal_pedido.nombre}
        Cliente: {pedido.usuario.get_full_name() or pedido.usuario.username}
        
        Tipo de pedido: {tipo_entrega_texto}{direccion_texto}
        
        Productos cancelados:
        {productos_texto}
        
        TOTAL: ₡{pedido.total:,.2f}
        
        Ver detalles: {URL_ADMIN_PEDIDOS}
        
        ---
        Panadería Santa Clara
        """
        
        logger.info(f"📧 Notificando cancelación del pedido #{pedido.id} a {len(emails_admin)} admins")
        return enviar_email_seguro(asunto, html_content, text_content, emails_admin)
        
    except Pedido.DoesNotExist:
        logger.error(f"❌ Pedido {pedido_id} no encontrado")
        return False
    except Exception as e:
        logger.error(f"❌ Error en enviar_notificacion_pedido_cancelado: {str(e)}")
        return False


def enviar_alerta_sin_stock(producto_id):
    """
    ⭐⭐⭐ NUEVA FUNCIÓN: Notifica cuando un producto queda SIN STOCK (agotado = 0)
    """
    try:
        producto = Producto.objects.select_related('sucursal').get(id=producto_id)
        
        if not producto.sucursal:
            logger.warning(f"⚠️ Producto {producto.nombre} sin sucursal")
            return False
        
        destinatarios = obtener_admins_por_sucursal(producto.sucursal)
        
        if not destinatarios:
            logger.warning(f"⚠️ No hay admins para notificar sin stock de {producto.nombre}")
            return False
        
        asunto = f"🔴 URGENTE: Producto AGOTADO - {producto.nombre} ({producto.sucursal.nombre})"
        html_content = template_alerta_sin_stock(producto, URL_ADMIN_PRODUCTOS)
        
        text_content = f"""
        🔴 ALERTA URGENTE: PRODUCTO AGOTADO
        
        Producto: {producto.nombre}
        Sucursal: {producto.sucursal.nombre}
        Stock Actual: 0 unidades
        Precio: ₡{producto.precio:,.2f}
        
        ACCIÓN URGENTE REQUERIDA:
        - Verificar stock físico inmediatamente
        - Contactar proveedores para reabastecimiento
        - Evaluar demanda del producto
        
        Gestionar inventario: {URL_ADMIN_PRODUCTOS}
        
        ---
        Panadería Santa Clara
        """
        
        logger.info(f"📧 Enviando alerta de AGOTADO para {producto.nombre}")
        return enviar_email_seguro(asunto, html_content, text_content, destinatarios)
        
    except Producto.DoesNotExist:
        logger.error(f"❌ Producto {producto_id} no encontrado")
        return False
    except Exception as e:
        logger.error(f"❌ Error en enviar_alerta_sin_stock: {str(e)}")
        return False


def enviar_alerta_stock_bajo(producto_id):
    """
    Notifica cuando un producto tiene stock bajo (≤10)
    """
    try:
        producto = Producto.objects.select_related('sucursal').get(id=producto_id)
        
        if not producto.sucursal:
            logger.warning(f"⚠️ Producto {producto.nombre} sin sucursal")
            return False
        
        destinatarios = obtener_admins_por_sucursal(producto.sucursal)
        
        if not destinatarios:
            logger.warning(f"⚠️ No hay admins para notificar stock bajo de {producto.nombre}")
            return False
        
        asunto = f"⚠️ ALERTA: Stock Bajo - {producto.nombre} ({producto.sucursal.nombre})"
        html_content = template_alerta_stock_bajo(producto, URL_ADMIN_PRODUCTOS)
        
        text_content = f"""
        ⚠️ ALERTA DE INVENTARIO
        
        Producto: {producto.nombre}
        Sucursal: {producto.sucursal.nombre}
        Stock Actual: {producto.stock}
        Precio: ₡{producto.precio:,.2f}
        
        ACCIÓN REQUERIDA:
        - Verificar stock físico
        - Evaluar demanda
        - Coordinar con proveedores
        
        Gestionar inventario: {URL_ADMIN_PRODUCTOS}
        
        ---
        Panadería Santa Clara
        """
        
        logger.info(f"📧 Enviando alerta de STOCK BAJO para {producto.nombre}")
        return enviar_email_seguro(asunto, html_content, text_content, destinatarios)
        
    except Producto.DoesNotExist:
        logger.error(f"❌ Producto {producto_id} no encontrado")
        return False
    except Exception as e:
        logger.error(f"❌ Error en enviar_alerta_stock_bajo: {str(e)}")
        return False


def enviar_actualizacion_estado(pedido_id):
    """Notifica al cliente cuando cambia el estado de su pedido"""
    try:
        pedido = Pedido.objects.select_related('usuario').get(id=pedido_id)
        
        if not pedido.usuario.email:
            return False
        
        estado_emoji = {
            'recibido': '📋',
            'en_preparacion': '👨‍🍳',
            'listo': '✅',
            'entregado': '🎉',
            'cancelado': '❌',
        }
        
        emoji = estado_emoji.get(pedido.estado, '📦')
        asunto = f"{emoji} Actualización de Pedido #{pedido.id}"
        
        html_content = template_actualizacion_estado(pedido, URL_PEDIDOS_CLIENTE)
        
        text_content = f"""
        Actualización de Pedido
        
        Hola {pedido.usuario.first_name or pedido.usuario.username},
        
        Tu pedido #{pedido.id} ha sido actualizado:
        Estado: {pedido.get_estado_display()}
        Total: ₡{pedido.total:,.2f}
        
        Ver pedidos: {URL_PEDIDOS_CLIENTE}
        
        ---
        Panadería Santa Clara
        """
        
        return enviar_email_seguro(asunto, html_content, text_content, [pedido.usuario.email])
        
    except Exception as e:
        logger.error(f"❌ Error en enviar_actualizacion_estado: {str(e)}")
        return False