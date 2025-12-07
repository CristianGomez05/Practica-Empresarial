# Backend/core/emails.py
# ⭐⭐⭐ VERSIÓN CORREGIDA - Incluye:
# 1. Filtrado por sucursal en notificaciones de pedidos
# 2. Filtrado por sucursal en alertas de stock
# 3. Inclusión de admin_general en todas las notificaciones
# 4. Nueva función para pedidos cancelados

from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from .models import Usuario, Oferta, Pedido, Producto
from .email_templates import (
    template_nuevo_producto,
    template_nueva_oferta,
    template_confirmacion_pedido,
    template_actualizacion_estado,
    template_alerta_stock_bajo,
    template_notificacion_pedido_admin,
    template_pedido_cancelado_admin  # ⭐ NUEVA PLANTILLA
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
    """
    Wrapper para enviar emails con manejo robusto de errores
    """
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
    ⭐ NUEVA FUNCIÓN: Obtiene admins de una sucursal específica + admin_general
    
    Args:
        sucursal: Objeto Sucursal
    
    Returns:
        Lista de emails de administradores
    """
    # Admin de la sucursal específica
    admins_sucursal = Usuario.objects.filter(
        rol='administrador',
        sucursal=sucursal,
        is_active=True,
        email__isnull=False
    ).exclude(email='')
    
    # Admin general (puede ver/gestionar todo)
    admins_generales = Usuario.objects.filter(
        rol='administrador_general',
        is_active=True,
        email__isnull=False
    ).exclude(email='')
    
    # Combinar emails
    emails_sucursal = [admin.email for admin in admins_sucursal if admin.email]
    emails_generales = [admin.email for admin in admins_generales if admin.email]
    
    todos_emails = list(set(emails_sucursal + emails_generales))  # Eliminar duplicados
    
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
    ⭐⭐⭐ CORREGIDO: Envía correo de confirmación al cliente Y notifica a admins
    Ahora filtra admins por sucursal del pedido
    """
    try:
        pedido = Pedido.objects.select_related('usuario').prefetch_related('detalles__producto').get(id=pedido_id)
        
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
        
        # 2. ⭐ CORREGIDO: Notificar solo a admins de la sucursal + admin_general
        # Determinar la sucursal del pedido basado en los productos
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
                
                PRÓXIMOS PASOS:
                - Verificar disponibilidad de productos
                - Confirmar el pedido con el cliente si es necesario
                - Actualizar el estado según avance la preparación
                - Notificar al cliente cuando esté listo
                
                ---
                Panadería Santa Clara
                Sistema de Gestión de Pedidos
                """
                
                enviar_email_seguro(asunto_admin, html_admin, text_admin, emails_admin)
        else:
            logger.warning(f"⚠️ Pedido #{pedido.id} sin sucursal definida, no se notifica a admins")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error en enviar_confirmacion_pedido: {str(e)}")
        return False


def enviar_notificacion_pedido_cancelado(pedido_id):
    """
    ⭐⭐⭐ NUEVA FUNCIÓN: Notifica a admins cuando un cliente cancela un pedido
    Filtra por sucursal + admin_general
    """
    try:
        pedido = Pedido.objects.select_related('usuario').prefetch_related('detalles__producto').get(id=pedido_id)
        
        # Determinar la sucursal del pedido
        sucursal_pedido = None
        primer_detalle = pedido.detalles.first()
        if primer_detalle and primer_detalle.producto.sucursal:
            sucursal_pedido = primer_detalle.producto.sucursal
        
        if not sucursal_pedido:
            logger.warning(f"⚠️ Pedido #{pedido.id} sin sucursal, no se notifica cancelación")
            return False
        
        # Obtener admins de la sucursal + admin_general
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
        
        El cliente ha cancelado el siguiente pedido:
        
        Pedido: #{pedido.id}
        Sucursal: {sucursal_pedido.nombre}
        Cliente: {pedido.usuario.get_full_name() or pedido.usuario.username}
        Usuario: {pedido.usuario.username}
        Email: {pedido.usuario.email}
        
        Tipo de pedido: {tipo_entrega_texto}{direccion_texto}
        
        Productos cancelados:
        {productos_texto}
        
        TOTAL: ₡{pedido.total:,.2f}
        
        ACCIONES RECOMENDADAS:
        - Verificar que no se haya iniciado la preparación
        - Si ya se prepararon productos, considerar devolverlos al inventario
        - Contactar al cliente si es necesario para confirmar la cancelación
        
        Ver detalles: {URL_ADMIN_PEDIDOS}
        
        ---
        Panadería Santa Clara
        Sistema de Gestión de Pedidos
        """
        
        logger.info(f"📧 Notificando cancelación del pedido #{pedido.id} a {len(emails_admin)} admins")
        return enviar_email_seguro(asunto, html_content, text_content, emails_admin)
        
    except Pedido.DoesNotExist:
        logger.error(f"❌ Pedido {pedido_id} no encontrado")
        return False
    except Exception as e:
        logger.error(f"❌ Error en enviar_notificacion_pedido_cancelado: {str(e)}")
        return False


def enviar_alerta_stock_bajo(producto_id):
    """
    ⭐⭐⭐ CORREGIDO: Notifica a administradores cuando un producto tiene stock bajo (≤10) o agotado (=0)
    Ahora filtra por sucursal del producto + admin_general
    """
    try:
        producto = Producto.objects.select_related('sucursal').get(id=producto_id)
        
        if not producto.sucursal:
            logger.warning(f"⚠️ Producto {producto.nombre} sin sucursal, no se envía alerta")
            return False
        
        # ⭐ Obtener admins de la sucursal + admin_general
        destinatarios = obtener_admins_por_sucursal(producto.sucursal)
        
        if not destinatarios:
            logger.warning(f"⚠️ No hay admins para notificar stock de {producto.nombre}")
            return False
        
        # Determinar el tipo de alerta
        if producto.stock == 0:
            tipo_alerta = "SIN STOCK"
            emoji = "🔴"
        else:
            tipo_alerta = "STOCK BAJO"
            emoji = "⚠️"
        
        asunto = f"{emoji} ALERTA: {tipo_alerta} - {producto.nombre} ({producto.sucursal.nombre})"
        html_content = template_alerta_stock_bajo(producto, URL_ADMIN_PRODUCTOS)
        
        text_content = f"""
        {emoji} ALERTA DE INVENTARIO
        
        Producto con {tipo_alerta.lower()}: {producto.nombre}
        Sucursal: {producto.sucursal.nombre}
        {producto.descripcion or ''}
        
        Stock Actual: {producto.stock}
        Precio: ₡{producto.precio:,.2f}
        Estado: {emoji} {tipo_alerta}
        
        ACCIÓN REQUERIDA:
        - Verificar stock físico en bodega
        - Actualizar cantidad disponible
        - Evaluar demanda del producto
        - Coordinar con proveedores si es necesario
        
        Gestionar inventario: {URL_ADMIN_PRODUCTOS}
        
        ---
        Panadería Santa Clara
        Sistema de Gestión de Inventario
        """
        
        logger.info(f"📧 Enviando alerta de {tipo_alerta} para {producto.nombre} ({producto.sucursal.nombre})")
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
        Alajuela, Costa Rica
        """
        
        return enviar_email_seguro(asunto, html_content, text_content, [pedido.usuario.email])
        
    except Exception as e:
        logger.error(f"❌ Error en enviar_actualizacion_estado: {str(e)}")
        return False