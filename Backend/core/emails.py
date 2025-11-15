# Backend/core/emails.py
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from .models import Usuario, Oferta, Pedido, Producto
import logging
import socket

logger = logging.getLogger(__name__)

# URLs del frontend
FRONTEND_URL = settings.FRONTEND_URL
URL_PRODUCTOS_CLIENTE = f"{FRONTEND_URL}/dashboard/productos"
URL_OFERTAS_CLIENTE = f"{FRONTEND_URL}/dashboard/ofertas"
URL_PEDIDOS_CLIENTE = f"{FRONTEND_URL}/dashboard/pedidos"
URL_ADMIN_PRODUCTOS = f"{FRONTEND_URL}/admin/productos"
URL_ADMIN_OFERTAS = f"{FRONTEND_URL}/admin/ofertas"
URL_ADMIN_PEDIDOS = f"{FRONTEND_URL}/admin/pedidos"


def verificar_configuracion_email():
    """Verifica que el email esté configurado correctamente"""
    if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
        logger.error("❌ EMAIL_HOST_USER o EMAIL_HOST_PASSWORD no configurados")
        return False
    
    try:
        # Intentar resolver el hostname
        socket.gethostbyname(settings.EMAIL_HOST)
        return True
    except socket.gaierror:
        logger.error(f"❌ No se puede resolver el hostname: {settings.EMAIL_HOST}")
        return False


def enviar_email_seguro(subject, html_content, text_content, recipients):
    """
    Wrapper para enviar emails con manejo robusto de errores
    """
    if not recipients:
        logger.warning("⚠️ No hay destinatarios para el email")
        return False
    
    if not verificar_configuracion_email():
        logger.error("❌ Configuración de email inválida")
        return False
    
    try:
        logger.info(f"📧 Enviando email a {len(recipients)} destinatario(s): {subject}")
        
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=recipients
        )
        email.attach_alternative(html_content, "text/html")
        
        result = email.send(fail_silently=False)
        
        if result:
            logger.info(f"✅ Email enviado exitosamente a {len(recipients)} destinatario(s)")
            return True
        else:
            logger.error("❌ email.send() retornó 0")
            return False
            
    except socket.gaierror as e:
        logger.error(f"❌ Error de red (DNS): {str(e)}")
        return False
    except socket.timeout as e:
        logger.error(f"❌ Timeout al conectar con el servidor SMTP: {str(e)}")
        return False
    except ConnectionRefusedError as e:
        logger.error(f"❌ Conexión rechazada por el servidor SMTP: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"❌ Error al enviar email: {type(e).__name__}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False


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
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; }}
                .header {{ 
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
                    color: white; 
                    padding: 30px; 
                    text-align: center; 
                    border-radius: 10px 10px 0 0; 
                }}
                .content {{ background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }}
                .product-card {{ 
                    background: #f3f4f6; 
                    padding: 20px; 
                    margin: 20px 0; 
                    border-radius: 8px; 
                    border-left: 4px solid #f59e0b;
                }}
                .price {{ 
                    font-size: 24px; 
                    color: #10b981; 
                    font-weight: bold; 
                    margin: 15px 0;
                }}
                .button {{ 
                    display: inline-block; 
                    padding: 14px 32px; 
                    background: #f59e0b; 
                    color: white !important; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    margin-top: 20px;
                    font-weight: bold;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🥐 Nuevo Producto Disponible</h1>
                </div>
                <div class="content">
                    <div class="product-card">
                        <h2>{producto.nombre}</h2>
                        <p>{producto.descripcion or 'Delicioso producto recién agregado.'}</p>
                        <div class="price">₡{producto.precio:,.2f}</div>
                    </div>
                    <div style="text-align: center;">
                        <a href="{URL_PRODUCTOS_CLIENTE}" class="button">
                            Ver Productos
                        </a>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Nuevo Producto: {producto.nombre}
        Precio: ₡{producto.precio:,.2f}
        
        Ver productos: {URL_PRODUCTOS_CLIENTE}
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
        
        productos_html = ""
        for producto in oferta.productos.all():
            productos_html += f"<li>{producto.nombre} - ₡{producto.precio:,.2f}</li>"
        
        asunto = f"🎉 Nueva Oferta: {oferta.titulo}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: white; padding: 30px; }}
                .button {{ display: inline-block; padding: 14px 32px; background: #dc2626; color: white !important; text-decoration: none; border-radius: 8px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 {oferta.titulo}</h1>
                </div>
                <div class="content">
                    <p>{oferta.descripcion}</p>
                    <h3>Productos incluidos:</h3>
                    <ul>{productos_html}</ul>
                    <p><strong>Precio oferta: ₡{oferta.precio_oferta:,.2f}</strong></p>
                    <p>Válido del {oferta.fecha_inicio} al {oferta.fecha_fin}</p>
                    <div style="text-align: center;">
                        <a href="{URL_OFERTAS_CLIENTE}" class="button">Ver Ofertas</a>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Nueva Oferta: {oferta.titulo}
        {oferta.descripcion}
        Precio: ₡{oferta.precio_oferta:,.2f}
        Válido: {oferta.fecha_inicio} - {oferta.fecha_fin}
        
        Ver ofertas: {URL_OFERTAS_CLIENTE}
        """
        
        return enviar_email_seguro(asunto, html_content, text_content, destinatarios)
        
    except Oferta.DoesNotExist:
        logger.error(f"❌ Oferta {oferta_id} no encontrada")
        return False
    except Exception as e:
        logger.error(f"❌ Error en enviar_notificacion_oferta: {str(e)}")
        return False


def enviar_confirmacion_pedido(pedido_id):
    """Envía correo de confirmación al cliente Y notifica a admins"""
    try:
        pedido = Pedido.objects.select_related('usuario').prefetch_related('detalles__producto').get(id=pedido_id)
        
        # Enviar al cliente
        if pedido.usuario.email:
            productos_html = ""
            for detalle in pedido.detalles.all():
                productos_html += f"<li>{detalle.producto.nombre} x{detalle.cantidad}</li>"
            
            asunto = f"✅ Confirmación de Pedido #{pedido.id}"
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <body>
                <h1>¡Pedido Confirmado!</h1>
                <p>Hola {pedido.usuario.first_name or pedido.usuario.username},</p>
                <p>Tu pedido #{pedido.id} ha sido recibido.</p>
                <h3>Productos:</h3>
                <ul>{productos_html}</ul>
                <p><strong>Total: ₡{pedido.total:,.2f}</strong></p>
                <a href="{URL_PEDIDOS_CLIENTE}">Ver Mis Pedidos</a>
            </body>
            </html>
            """
            
            text_content = f"""
            Pedido #{pedido.id} confirmado
            Total: ₡{pedido.total:,.2f}
            Ver pedidos: {URL_PEDIDOS_CLIENTE}
            """
            
            enviar_email_seguro(asunto, html_content, text_content, [pedido.usuario.email])
        
        # Notificar a admins
        admins = Usuario.objects.filter(rol='administrador', is_active=True, email__isnull=False).exclude(email='')
        emails_admin = [admin.email for admin in admins if admin.email]
        
        if emails_admin:
            asunto_admin = f"🔔 Nuevo Pedido #{pedido.id}"
            html_admin = f"""
            <!DOCTYPE html>
            <html>
            <body>
                <h1>Nuevo Pedido Recibido</h1>
                <p>Cliente: {pedido.usuario.get_full_name() or pedido.usuario.username}</p>
                <p>Total: ₡{pedido.total:,.2f}</p>
                <a href="{URL_ADMIN_PEDIDOS}">Gestionar Pedido</a>
            </body>
            </html>
            """
            text_admin = f"Nuevo pedido #{pedido.id} de {pedido.usuario.username}. Total: ₡{pedido.total:,.2f}"
            
            enviar_email_seguro(asunto_admin, html_admin, text_admin, emails_admin)
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error en enviar_confirmacion_pedido: {str(e)}")
        return False


def enviar_alerta_sin_stock(producto_id):
    """Notifica a administradores cuando un producto se queda sin stock"""
    try:
        producto = Producto.objects.get(id=producto_id)
        
        admins = Usuario.objects.filter(rol='administrador', is_active=True, email__isnull=False).exclude(email='')
        destinatarios = [admin.email for admin in admins if admin.email]
        
        if not destinatarios:
            logger.warning("⚠️ No hay administradores con correos válidos")
            return False
        
        asunto = f"⚠️ ALERTA: Sin Stock - {producto.nombre}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body>
            <h1 style="color: #dc2626;">⚠️ Producto Agotado</h1>
            <p>El producto <strong>{producto.nombre}</strong> se ha quedado sin stock.</p>
            <p>Precio: ₡{producto.precio:,.2f}</p>
            <a href="{URL_ADMIN_PRODUCTOS}">Gestionar Inventario</a>
        </body>
        </html>
        """
        
        text_content = f"""
        ALERTA: Producto sin stock
        {producto.nombre}
        Gestionar: {URL_ADMIN_PRODUCTOS}
        """
        
        return enviar_email_seguro(asunto, html_content, text_content, destinatarios)
        
    except Exception as e:
        logger.error(f"❌ Error en enviar_alerta_sin_stock: {str(e)}")
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
        }
        
        emoji = estado_emoji.get(pedido.estado, '📦')
        asunto = f"{emoji} Actualización de Pedido #{pedido.id}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body>
            <h1>{emoji} Actualización de Pedido</h1>
            <p>Hola {pedido.usuario.first_name or pedido.usuario.username},</p>
            <p>Tu pedido #{pedido.id} ahora está: <strong>{pedido.get_estado_display()}</strong></p>
            <p>Total: ₡{pedido.total:,.2f}</p>
            <a href="{URL_PEDIDOS_CLIENTE}">Ver Mis Pedidos</a>
        </body>
        </html>
        """
        
        text_content = f"""
        Pedido #{pedido.id}: {pedido.get_estado_display()}
        Ver pedidos: {URL_PEDIDOS_CLIENTE}
        """
        
        return enviar_email_seguro(asunto, html_content, text_content, [pedido.usuario.email])
        
    except Exception as e:
        logger.error(f"❌ Error en enviar_actualizacion_estado: {str(e)}")
        return False