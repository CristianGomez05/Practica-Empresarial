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
                    <h1>🥐 Panadería Santa Clara</h1>
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
                    <p>© 2025 Panadería Santa Clara. Todos los derechos reservados.</p>
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
    Con diseño profesional y optimizado para Gmail/Outlook
    """
    try:
        pedido = Pedido.objects.select_related('usuario').prefetch_related('detalles__producto').get(id=pedido_id)
        
        if not pedido.usuario.email:
            print(f"⚠️  Usuario {pedido.usuario.username} no tiene email configurado")
            return False
        
        print(f"\n{'='*60}")
        print(f"📧 ENVIANDO EMAIL DE ACTUALIZACIÓN DE ESTADO")
        print(f"{'='*60}")
        print(f"Pedido: #{pedido.id}")
        print(f"Usuario: {pedido.usuario.username}")
        print(f"Email: {pedido.usuario.email}")
        print(f"Estado: {pedido.get_estado_display()}")
        print(f"{'='*60}\n")
        
        # Configuración según el estado
        estado_config = {
            'recibido': {
                'titulo': '✅ Pedido Recibido',
                'emoji': '📋',
                'color': '#3b82f6',
                'mensaje': 'Tu pedido ha sido recibido correctamente',
                'descripcion': 'Estamos preparando tu pedido con los mejores ingredientes.'
            },
            'en_preparacion': {
                'titulo': '👨‍🍳 Pedido en Preparación',
                'emoji': '👨‍🍳',
                'color': '#f59e0b',
                'mensaje': 'Tu pedido está siendo preparado',
                'descripcion': 'Nuestros panaderos están trabajando en tu pedido con mucho cuidado.'
            },
            'listo': {
                'titulo': '✅ ¡Pedido Listo!',
                'emoji': '🎉',
                'color': '#10b981',
                'mensaje': '¡Tu pedido está listo para recoger!',
                'descripcion': 'Puedes pasar a recoger tu pedido en cualquier momento.'
            },
            'entregado': {
                'titulo': '🎊 Pedido Entregado',
                'emoji': '🎊',
                'color': '#8b5cf6',
                'mensaje': 'Tu pedido ha sido entregado',
                'descripcion': '¡Esperamos que disfrutes tus productos! Gracias por tu compra.'
            }
        }
        
        config = estado_config.get(pedido.estado, estado_config['recibido'])
        
        # Asunto del correo
        asunto = f"{config['emoji']} {config['titulo']} - Pedido #{pedido.id}"
        
        # Construir lista de productos
        productos_html = ""
        for detalle in pedido.detalles.all():
            subtotal = detalle.producto.precio * detalle.cantidad
            productos_html += f"""
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #f3f4f6;">
                    <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">
                        {detalle.producto.nombre}
                    </div>
                    <div style="font-size: 13px; color: #6b7280;">
                        ₡{detalle.producto.precio} × {detalle.cantidad}
                    </div>
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 600; color: #1f2937;">
                    ₡{subtotal}
                </td>
            </tr>
            """
        
        # HTML del correo (optimizado para Gmail/Outlook)
        html_content = f"""
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <title>{config['titulo']}</title>
            <!--[if mso]>
            <style type="text/css">
                body, table, td {{font-family: Arial, sans-serif !important;}}
            </style>
            <![endif]-->
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; line-height: 1.6;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb;">
                <tr>
                    <td style="padding: 40px 20px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
                            
                            <!-- Header -->
                            <tr>
                                <td style="background: linear-gradient(135deg, {config['color']} 0%, {config['color']}dd 100%); padding: 40px 30px; text-align: center;">
                                    <div style="font-size: 48px; margin-bottom: 16px;">🥐</div>
                                    <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 28px; font-weight: 700;">
                                        Panadería Santa Clara
                                    </h1>
                                    <p style="color: rgba(255,255,255,0.95); margin: 0; font-size: 16px;">
                                        {config['titulo']}
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Saludo -->
                            <tr>
                                <td style="padding: 30px 30px 20px;">
                                    <p style="margin: 0; font-size: 16px; color: #374151;">
                                        Hola <strong>{pedido.usuario.first_name or pedido.usuario.username}</strong>,
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Mensaje principal -->
                            <tr>
                                <td style="padding: 0 30px 30px;">
                                    <div style="background: linear-gradient(135deg, {config['color']}15 0%, {config['color']}08 100%); border-left: 4px solid {config['color']}; padding: 20px; border-radius: 8px;">
                                        <div style="font-size: 32px; margin-bottom: 8px;">{config['emoji']}</div>
                                        <h2 style="margin: 0 0 8px 0; color: #1f2937; font-size: 20px;">
                                            {config['mensaje']}
                                        </h2>
                                        <p style="margin: 0; color: #6b7280; font-size: 15px;">
                                            {config['descripcion']}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- Detalles del pedido -->
                            <tr>
                                <td style="padding: 0 30px 30px;">
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
                                        <tr>
                                            <td style="padding: 20px;">
                                                <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px; font-weight: 600;">
                                                    📦 Detalles del Pedido
                                                </h3>
                                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 16px;">
                                                    <tr>
                                                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                                            Número de Pedido:
                                                        </td>
                                                        <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1f2937; font-size: 14px;">
                                                            #{pedido.id}
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                                            Fecha:
                                                        </td>
                                                        <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1f2937; font-size: 14px;">
                                                            {pedido.fecha.strftime('%d/%m/%Y %H:%M')}
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                                            Estado:
                                                        </td>
                                                        <td style="padding: 8px 0; text-align: right;">
                                                            <span style="background-color: {config['color']}; color: #ffffff; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600;">
                                                                {pedido.get_estado_display()}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            
                            <!-- Productos -->
                            <tr>
                                <td style="padding: 0 30px 30px;">
                                    <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px; font-weight: 600;">
                                        🛍️ Productos
                                    </h3>
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                                        {productos_html}
                                        <tr>
                                            <td style="padding: 16px; background-color: {config['color']}10; border-top: 2px solid {config['color']}; font-weight: 700; color: #1f2937; font-size: 16px;">
                                                Total
                                            </td>
                                            <td style="padding: 16px; background-color: {config['color']}10; border-top: 2px solid {config['color']}; text-align: right; font-weight: 700; color: {config['color']}; font-size: 20px;">
                                                ₡{pedido.total}
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            
                            <!-- CTA Button (solo para estado 'listo') -->
                            {'<tr><td style="padding: 0 30px 30px; text-align: center;"><a href="http://localhost:5173/dashboard/pedidos" style="display: inline-block; background: linear-gradient(135deg, ' + config['color'] + ' 0%, ' + config['color'] + 'dd 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Ver Mis Pedidos</a></td></tr>' if pedido.estado == 'listo' else ''}
                            
                            <!-- Footer -->
                            <tr>
                                <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                                        Gracias por elegirnos 💚
                                    </p>
                                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                        © 2025 Panadería Santa Clara. Todos los derechos reservados.
                                    </p>
                                    <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 11px;">
                                        Este es un correo automático, por favor no responder.
                                    </p>
                                </td>
                            </tr>
                            
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        
        # Contenido de texto plano (fallback)
        text_content = f"""
        {config['emoji']} {config['titulo']}
        
        Hola {pedido.usuario.first_name or pedido.usuario.username},
        
        {config['mensaje']}
        {config['descripcion']}
        
        DETALLES DEL PEDIDO
        -------------------
        Número de Pedido: #{pedido.id}
        Fecha: {pedido.fecha.strftime('%d/%m/%Y %H:%M')}
        Estado: {pedido.get_estado_display()}
        
        PRODUCTOS
        ---------
        """
        
        for detalle in pedido.detalles.all():
            subtotal = detalle.producto.precio * detalle.cantidad
            text_content += f"\n{detalle.producto.nombre}\n"
            text_content += f"₡{detalle.producto.precio} × {detalle.cantidad} = ₡{subtotal}\n"
        
        text_content += f"\nTOTAL: ₡{pedido.total}\n"
        text_content += f"\n---\nGracias por elegirnos 💚\nPanadería Santa Clara"
        
        # Crear y enviar el correo
        email = EmailMultiAlternatives(
            subject=asunto,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[pedido.usuario.email]
        )
        email.attach_alternative(html_content, "text/html")
        
        # Enviar
        email.send(fail_silently=False)
        
        print(f"✅ Email enviado exitosamente a {pedido.usuario.email}")
        print(f"   Asunto: {asunto}")
        print(f"   Estado: {pedido.get_estado_display()}\n")
        return True
        
    except Pedido.DoesNotExist:
        print(f"❌ Pedido {pedido_id} no encontrado")
        return False
    except Exception as e:
        print(f"❌ Error al enviar actualización: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
def enviar_alerta_stock_agotado(producto_id):
    """
    Envía correo a todos los administradores cuando se agota el stock de un producto
    """
    try:
        producto = Producto.objects.get(id=producto_id)
        
        # Obtener todos los administradores con email
        administradores = Usuario.objects.filter(
            rol='administrador',
            is_active=True,
            email__isnull=False
        ).exclude(email='')
        
        destinatarios = [admin.email for admin in administradores if admin.email]
        
        if not destinatarios:
            print("⚠️ No hay administradores con correos válidos")
            return False
        
        # Asunto del correo
        asunto = f"⚠️ Stock Agotado - {producto.nombre}"
        
        # Contenido HTML
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
                           color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .alert-box {{ background: #fef2f2; border-left: 4px solid #ef4444; 
                             padding: 20px; margin: 20px 0; border-radius: 4px; }}
                .product-info {{ background: white; padding: 20px; margin: 20px 0; 
                                border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
                .button {{ display: inline-block; padding: 12px 30px; background: #ef4444; 
                          color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
                .stock-zero {{ color: #ef4444; font-size: 24px; font-weight: bold; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⚠️ Alerta de Inventario</h1>
                    <h2>Stock Agotado</h2>
                </div>
                <div class="content">
                    <div class="alert-box">
                        <h3>🚨 Atención Requerida</h3>
                        <p>El siguiente producto ha agotado sus existencias y requiere reabastecimiento inmediato:</p>
                    </div>
                    
                    <div class="product-info">
                        <h2>{producto.nombre}</h2>
                        <p><strong>ID del Producto:</strong> {producto.id}</p>
                        <p><strong>Precio:</strong> ₡{producto.precio}</p>
                        <p><strong>Stock Actual:</strong> <span class="stock-zero">0 unidades</span></p>
                        <p><strong>Estado:</strong> <span style="color: #ef4444;">❌ Agotado</span></p>
                    </div>
                    
                    <p>Este producto ya no está disponible para los clientes. Por favor, actualiza el inventario lo antes posible.</p>
                    
                    <a href="http://localhost:5173/admin/productos/{producto.id}" class="button">
                        Actualizar Inventario
                    </a>
                </div>
                <div class="footer">
                    <p>Este correo fue enviado automáticamente por el sistema de inventario.</p>
                    <p>© 2025 Panadería Santa Clara. Todos los derechos reservados.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Contenido de texto plano
        text_content = f"""
        ⚠️ ALERTA DE INVENTARIO - STOCK AGOTADO
        
        El producto ha agotado sus existencias:
        
        Producto: {producto.nombre}
        ID: {producto.id}
        Precio: ₡{producto.precio}
        Stock Actual: 0 unidades
        Estado: AGOTADO
        
        Este producto ya no está disponible para los clientes.
        Por favor, actualiza el inventario lo antes posible.
        
        Accede al panel de administración para actualizar el stock:
        http://localhost:5173/admin/productos/{producto.id}
        
        ---
        Este es un mensaje automático del sistema de inventario.
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
        
        # Marcar que ya se envió la alerta
        producto.alerta_stock_enviada = True
        producto.save(update_fields=['alerta_stock_enviada'])
        
        print(f"✅ Alerta de stock agotado enviada a {len(destinatarios)} administradores")
        print(f"📧 Destinatarios: {', '.join(destinatarios)}")
        return True
        
    except Producto.DoesNotExist:
        print(f"❌ Producto {producto_id} no encontrado")
        return False
    except Exception as e:
        print(f"❌ Error al enviar alerta de stock: {str(e)}")
        import traceback
        traceback.print_exc()
        return False