# Backend/core/emails.py
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from .models import Usuario, Oferta, Pedido, Producto
from .email_templates import (
    template_nuevo_producto,
    template_nueva_oferta,
    template_confirmacion_pedido,
    template_actualizacion_estado
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
        
        # Usar template profesional
        html_content = template_nuevo_producto(producto)
        html_content = html_content.replace('{{url_productos}}', URL_PRODUCTOS_CLIENTE)
        
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
        
        # Usar template profesional
        html_content = template_nueva_oferta(oferta)
        html_content = html_content.replace('{{url_ofertas}}', URL_OFERTAS_CLIENTE)
        
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
    """Envía correo de confirmación al cliente Y notifica a admins"""
    try:
        pedido = Pedido.objects.select_related('usuario').prefetch_related('detalles__producto').get(id=pedido_id)
        
        # Enviar al cliente
        if pedido.usuario.email:
            asunto = f"✅ Confirmación de Pedido #{pedido.id}"
            
            # Usar template profesional
            html_content = template_confirmacion_pedido(pedido)
            html_content = html_content.replace('{{url_pedidos}}', URL_PEDIDOS_CLIENTE)
            
            productos_texto = "\n".join([
                f"  - {d.producto.nombre} x{d.cantidad} = ₡{d.producto.precio * d.cantidad:,.2f}"
                for d in pedido.detalles.all()
            ])
            
            text_content = f"""
            ¡Pedido Confirmado!
            
            Hola {pedido.usuario.first_name or pedido.usuario.username},
            
            Tu pedido #{pedido.id} ha sido recibido y está siendo preparado.
            
            Productos:
            {productos_texto}
            
            TOTAL: ₡{pedido.total:,.2f}
            
            Ver mis pedidos: {URL_PEDIDOS_CLIENTE}
            
            ---
            Panadería Santa Clara
            Alajuela, Costa Rica
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
            <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f3f4f6;">
                <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
                    <h1 style="color: #111827;">🔔 Nuevo Pedido Recibido</h1>
                    <p><strong>Pedido:</strong> #{pedido.id}</p>
                    <p><strong>Cliente:</strong> {pedido.usuario.get_full_name() or pedido.usuario.username}</p>
                    <p><strong>Email:</strong> {pedido.usuario.email}</p>
                    <p><strong>Total:</strong> <span style="color: #10b981; font-size: 24px; font-weight: bold;">₡{pedido.total:,.2f}</span></p>
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="{URL_ADMIN_PEDIDOS}" style="display: inline-block; padding: 14px 32px; background: #f59e0b; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                            Gestionar Pedido
                        </a>
                    </div>
                </div>
            </body>
            </html>
            """
            
            text_admin = f"Nuevo pedido #{pedido.id} de {pedido.usuario.username}. Total: ₡{pedido.total:,.2f}. Gestionar: {URL_ADMIN_PEDIDOS}"
            
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
        
        imagen_url = producto.imagen.url if producto.imagen else "https://via.placeholder.com/400x250?text=Sin+Imagen"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f3f4f6;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; border-left: 4px solid #dc2626;">
                <h1 style="color: #dc2626;">⚠️ Producto Agotado</h1>
                <img src="{imagen_url}" alt="{producto.nombre}" style="width: 100%; max-width: 400px; border-radius: 10px; margin: 20px 0;">
                <h2>{producto.nombre}</h2>
                <p style="color: #6b7280;">El producto se ha quedado sin stock.</p>
                <p><strong>Precio:</strong> ₡{producto.precio:,.2f}</p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="{URL_ADMIN_PRODUCTOS}" style="display: inline-block; padding: 14px 32px; background: #dc2626; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                        Gestionar Inventario
                    </a>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"ALERTA: {producto.nombre} sin stock. Gestionar: {URL_ADMIN_PRODUCTOS}"
        
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
        
        # Usar template profesional
        html_content = template_actualizacion_estado(pedido)
        html_content = html_content.replace('{{url_pedidos}}', URL_PEDIDOS_CLIENTE)
        
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