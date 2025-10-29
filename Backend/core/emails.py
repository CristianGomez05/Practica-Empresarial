# Backend/core/emails.py
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags
from .models import Usuario, Oferta, Pedido


def enviar_notificacion_oferta(oferta_id):
    """
    Envía correo a todos los usuarios cuando se crea una nueva oferta
    """
    try:
        oferta = Oferta.objects.select_related('producto').get(id=oferta_id)
        usuarios = Usuario.objects.filter(is_active=True, email__isnull=False).exclude(email='')
        
        destinatarios = [user.email for user in usuarios if user.email]
        
        if not destinatarios:
            print("⚠️ No hay usuarios con correos válidos")
            return False
        
        # Asunto del correo
        asunto = f"🎉 Nueva Oferta: {oferta.titulo}"
        
        # Contenido HTML
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                           color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .product-info {{ background: white; padding: 20px; margin: 20px 0; 
                                border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
                .button {{ display: inline-block; padding: 12px 30px; background: #667eea; 
                          color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🥐 Panadería Artesanal</h1>
                    <h2>¡Nueva Oferta Especial!</h2>
                </div>
                <div class="content">
                    <div class="product-info">
                        <h2>{oferta.titulo}</h2>
                        <p>{oferta.descripcion}</p>
                        <p><strong>Producto:</strong> {oferta.producto.nombre}</p>
                        <p><strong>Precio Regular:</strong> ₡{oferta.producto.precio}</p>
                        <p><strong>Válido desde:</strong> {oferta.fecha_inicio.strftime('%d/%m/%Y')}</p>
                        <p><strong>Válido hasta:</strong> {oferta.fecha_fin.strftime('%d/%m/%Y')}</p>
                    </div>
                    <p>¡No te pierdas esta increíble oferta! Visita nuestra panadería o haz tu pedido en línea.</p>
                    <a href="http://localhost:5173/productos" class="button">Ver Productos</a>
                </div>
                <div class="footer">
                    <p>Este correo fue enviado automáticamente. Por favor no responder.</p>
                    <p>© 2025 Panadería Artesanal. Todos los derechos reservados.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Contenido de texto plano (fallback)
        text_content = f"""
        Nueva Oferta: {oferta.titulo}
        
        {oferta.descripcion}
        
        Producto: {oferta.producto.nombre}
        Precio Regular: ₡{oferta.producto.precio}
        
        Válido desde: {oferta.fecha_inicio.strftime('%d/%m/%Y')}
        Válido hasta: {oferta.fecha_fin.strftime('%d/%m/%Y')}
        
        ¡No te pierdas esta oferta especial!
        Visita: http://localhost:5173/productos
        """
        
        # Crear y enviar el correo
        email = EmailMultiAlternatives(
            subject=asunto,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=destinatarios
        )
        email.attach_alternative(html_content, "text/html")
        email.send()
        
        print(f"✅ Correo enviado a {len(destinatarios)} usuarios")
        return True
        
    except Oferta.DoesNotExist:
        print(f"❌ Oferta {oferta_id} no encontrada")
        return False
    except Exception as e:
        print(f"❌ Error al enviar correo: {str(e)}")
        return False


def enviar_confirmacion_pedido(pedido_id):
    """
    Envía correo de confirmación al usuario cuando realiza un pedido
    """
    try:
        pedido = Pedido.objects.select_related('usuario').prefetch_related('detalles__producto').get(id=pedido_id)
        
        if not pedido.usuario.email:
            print("⚠️ Usuario sin correo electrónico")
            return False
        
        # Asunto
        asunto = f"Confirmación de Pedido #{pedido.id}"
        
        # Construir listado de productos
        productos_html = ""
        for detalle in pedido.detalles.all():
            subtotal = detalle.producto.precio * detalle.cantidad
            productos_html += f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">{detalle.producto.nombre}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">{detalle.cantidad}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₡{detalle.producto.precio}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₡{subtotal}</td>
            </tr>
            """
        
        # HTML del correo
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #10b981; color: white; padding: 30px; text-align: center; 
                           border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .order-info {{ background: white; padding: 20px; margin: 20px 0; border-radius: 8px; 
                              box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
                table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                th {{ background: #f3f4f6; padding: 10px; text-align: left; }}
                .total {{ font-size: 1.2em; font-weight: bold; color: #10b981; text-align: right; 
                         padding: 20px 0; border-top: 2px solid #10b981; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ ¡Pedido Confirmado!</h1>
                    <p>Gracias por tu compra, {pedido.usuario.first_name or pedido.usuario.username}</p>
                </div>
                <div class="content">
                    <div class="order-info">
                        <h2>Detalles del Pedido</h2>
                        <p><strong>Número de Pedido:</strong> #{pedido.id}</p>
                        <p><strong>Fecha:</strong> {pedido.fecha.strftime('%d/%m/%Y %H:%M')}</p>
                        <p><strong>Estado:</strong> {pedido.get_estado_display()}</p>
                        
                        <table>
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th style="text-align: center;">Cantidad</th>
                                    <th style="text-align: right;">Precio Unit.</th>
                                    <th style="text-align: right;">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productos_html}
                            </tbody>
                        </table>
                        
                        <div class="total">
                            Total: ₡{pedido.total}
                        </div>
                    </div>
                    <p>Tu pedido está siendo preparado. Te notificaremos cuando esté listo para recoger.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Texto plano
        productos_text = "\n".join([
            f"- {d.producto.nombre} x{d.cantidad} = ₡{d.producto.precio * d.cantidad}"
            for d in pedido.detalles.all()
        ])
        
        text_content = f"""
        ¡Pedido Confirmado!
        
        Hola {pedido.usuario.first_name or pedido.usuario.username},
        
        Tu pedido ha sido recibido exitosamente.
        
        Número de Pedido: #{pedido.id}
        Fecha: {pedido.fecha.strftime('%d/%m/%Y %H:%M')}
        Estado: {pedido.get_estado_display()}
        
        Productos:
        {productos_text}
        
        Total: ₡{pedido.total}
        
        Te notificaremos cuando tu pedido esté listo.
        """
        
        # Enviar correo
        email = EmailMultiAlternatives(
            subject=asunto,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[pedido.usuario.email]
        )
        email.attach_alternative(html_content, "text/html")
        email.send()
        
        print(f"✅ Confirmación enviada a {pedido.usuario.email}")
        return True
        
    except Pedido.DoesNotExist:
        print(f"❌ Pedido {pedido_id} no encontrado")
        return False
    except Exception as e:
        print(f"❌ Error al enviar confirmación: {str(e)}")
        return False


def enviar_actualizacion_estado(pedido_id):
    """
    Notifica al usuario cuando cambia el estado de su pedido
    """
    try:
        pedido = Pedido.objects.select_related('usuario').get(id=pedido_id)
        
        if not pedido.usuario.email:
            return False
        
        estado_mensajes = {
            'recibido': ('Tu pedido ha sido recibido', '📋'),
            'en_preparacion': ('Tu pedido está en preparación', '👨‍🍳'),
            'listo': ('¡Tu pedido está listo para recoger!', '✅'),
            'entregado': ('Tu pedido ha sido entregado', '🎉'),
        }
        
        mensaje, emoji = estado_mensajes.get(pedido.estado, ('Actualización de pedido', '📦'))
        
        asunto = f"{emoji} {mensaje} - Pedido #{pedido.id}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto;">
                <h1 style="color: #667eea;">{emoji} Actualización de Pedido</h1>
                <p>Hola {pedido.usuario.first_name or pedido.usuario.username},</p>
                <p><strong>{mensaje}</strong></p>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Pedido:</strong> #{pedido.id}</p>
                    <p><strong>Estado actual:</strong> {pedido.get_estado_display()}</p>
                    <p><strong>Total:</strong> ₡{pedido.total}</p>
                </div>
                <p>Gracias por tu preferencia.</p>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        {mensaje}
        
        Pedido: #{pedido.id}
        Estado: {pedido.get_estado_display()}
        Total: ₡{pedido.total}
        """
        
        email = EmailMultiAlternatives(
            subject=asunto,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[pedido.usuario.email]
        )
        email.attach_alternative(html_content, "text/html")
        email.send()
        
        print(f"✅ Actualización enviada a {pedido.usuario.email}")
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False