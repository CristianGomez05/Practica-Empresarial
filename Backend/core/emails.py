# Backend/core/emails.py
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from decimal import Decimal
from django.utils.html import strip_tags
from .models import Usuario, Oferta, Pedido, Producto


def enviar_notificacion_nuevo_producto(producto_id):
    """
    Envía correo a todos los clientes cuando se crea un nuevo producto
    """
    try:
        producto = Producto.objects.get(id=producto_id)
        
        # Obtener todos los clientes activos con email
        clientes = Usuario.objects.filter(
            rol='cliente',
            is_active=True,
            email__isnull=False
        ).exclude(email='')
        
        destinatarios = [cliente.email for cliente in clientes if cliente.email]
        
        if not destinatarios:
            print("⚠️ No hay clientes con correos válidos")
            return False
        
        # Asunto del correo
        asunto = f"🥐 Nuevo Producto: {producto.nombre}"
        
        # Contenido HTML
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
                .product-image {{ 
                    width: 100%; 
                    max-width: 400px; 
                    height: auto; 
                    border-radius: 8px; 
                    margin: 15px 0;
                }}
                .price {{ 
                    font-size: 24px; 
                    color: #10b981; 
                    font-weight: bold; 
                    margin: 15px 0;
                }}
                .button {{ 
                    display: inline-block; 
                    padding: 12px 30px; 
                    background: #f59e0b; 
                    color: white; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    margin-top: 20px;
                    font-weight: bold;
                }}
                .button:hover {{ background: #d97706; }}
                .footer {{ 
                    text-align: center; 
                    margin-top: 20px; 
                    color: #6b7280; 
                    font-size: 12px; 
                    padding: 20px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🥐 Panadería Artesanal</h1>
                    <h2>¡Nuevo Producto Disponible!</h2>
                </div>
                <div class="content">
                    <div class="product-card">
                        <h2 style="color: #f59e0b; margin-top: 0;">{producto.nombre}</h2>
                        {"<img src='" + producto.imagen + "' alt='" + producto.nombre + "' class='product-image'>" if producto.imagen else ""}
                        <p style="font-size: 16px; color: #4b5563;">{producto.descripcion or 'Delicioso producto recién agregado a nuestro catálogo.'}</p>
                        <div class="price">₡{producto.precio:,.2f}</div>
                        <p style="color: #059669; font-weight: bold;">✅ Disponible ahora</p>
                    </div>
                    <p style="text-align: center; font-size: 16px;">
                        ¡No te lo pierdas! Este nuevo producto ya está disponible para ordenar.
                    </p>
                    <div style="text-align: center;">
                        <a href="http://localhost:5173/productos" class="button">Ver Todos los Productos</a>
                    </div>
                </div>
                <div class="footer">
                    <p>Este correo fue enviado automáticamente. Por favor no responder.</p>
                    <p>© 2025 Panadería Artesanal. Todos los derechos reservados.</p>
                    <p>Si deseas dejar de recibir estos correos, contáctanos.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Contenido de texto plano (fallback)
        text_content = f"""
        ¡Nuevo Producto Disponible!
        
        {producto.nombre}
        
        {producto.descripcion or 'Delicioso producto recién agregado a nuestro catálogo.'}
        
        Precio: ₡{producto.precio:,.2f}
        Estado: Disponible
        
        ¡Visita nuestra tienda para ordenar!
        http://localhost:5173/productos
        
        ---
        Panadería Artesanal
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
        
        print(f"✅ Notificación de nuevo producto enviada a {len(destinatarios)} clientes")
        return True
        
    except Producto.DoesNotExist:
        print(f"❌ Producto {producto_id} no encontrado")
        return False
    except Exception as e:
        print(f"❌ Error al enviar notificación de producto: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def enviar_notificacion_oferta(oferta_id):
    """
    Envía correo a todos los clientes cuando se crea una nueva oferta
    Muestra todos los productos incluidos con sus precios y descuentos
    """
    from decimal import Decimal
    
    try:
        oferta = Oferta.objects.prefetch_related('productos').get(id=oferta_id)
        
        # Obtener todos los clientes activos con email
        clientes = Usuario.objects.filter(
            rol='cliente',
            is_active=True,
            email__isnull=False
        ).exclude(email='')
        
        destinatarios = [cliente.email for cliente in clientes if cliente.email]
        
        if not destinatarios:
            print("⚠️ No hay clientes con correos válidos")
            return False
        
        # Construir tabla de productos con precios y descuentos
        productos_html = ""
        productos_text = ""
        total_productos = oferta.productos.count()
        ahorro_total = Decimal('0.00')
        
        for producto in oferta.productos.all():
            precio_original = producto.precio
            precio_oferta = oferta.precio_oferta
            ahorro = precio_original - precio_oferta
            ahorro_total += ahorro
            descuento_porcentaje = ((ahorro / precio_original) * 100) if precio_original > 0 else 0
            
            # Fila de tabla HTML
            productos_html += f"""
            <tr>
                <td style="padding: 15px; border-bottom: 1px solid #e5e7eb;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        {f'<img src="{producto.imagen}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;" alt="{producto.nombre}">' if producto.imagen else '<div style="width: 80px; height: 80px; background: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 36px;">🥖</div>'}
                        <div style="flex: 1;">
                            <h4 style="margin: 0 0 5px 0; color: #111827; font-size: 16px;">{producto.nombre}</h4>
                            <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.4;">
                                {producto.descripcion[:80] + '...' if producto.descripcion and len(producto.descripcion) > 80 else (producto.descripcion or 'Delicioso producto artesanal')}
                            </p>
                        </div>
                    </div>
                </td>
                <td style="padding: 15px; border-bottom: 1px solid #e5e7eb; text-align: right; vertical-align: middle;">
                    <div style="text-align: right;">
                        <div style="color: #9ca3af; text-decoration: line-through; font-size: 14px; margin-bottom: 4px;">
                            ₡{precio_original:,.2f}
                        </div>
                        <div style="color: #dc2626; font-weight: bold; font-size: 20px; margin-bottom: 4px;">
                            ₡{precio_oferta:,.2f}
                        </div>
                        <div style="background: #dc2626; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; display: inline-block;">
                            -{descuento_porcentaje:.0f}%
                        </div>
                    </div>
                </td>
                <td style="padding: 15px; border-bottom: 1px solid #e5e7eb; text-align: right; vertical-align: middle;">
                    <div style="color: #10b981; font-weight: bold; font-size: 16px;">
                        Ahorras<br>₡{ahorro:,.2f}
                    </div>
                </td>
            </tr>
            """
            
            # Texto plano
            productos_text += f"""
• {producto.nombre}
  Precio regular: ₡{precio_original:,.2f}
  Precio oferta: ₡{precio_oferta:,.2f}
  Ahorras: ₡{ahorro:,.2f} (-{descuento_porcentaje:.0f}%)

"""
        
        # Asunto del correo
        asunto = f"🎉 ¡Nueva Oferta! {oferta.titulo}"
        
        # Calcular días restantes
        from django.utils import timezone
        dias_restantes = (oferta.fecha_fin - timezone.now().date()).days
        mensaje_urgencia = ""
        if dias_restantes <= 3:
            mensaje_urgencia = f'<div style="background: #fef2f2; border: 2px solid #dc2626; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;"><span style="color: #dc2626; font-weight: bold; font-size: 16px;">⏰ ¡ÚLTIMOS DÍAS! Solo quedan {dias_restantes} día(s)</span></div>'
        elif dias_restantes <= 7:
            mensaje_urgencia = f'<div style="background: #fffbeb; border: 2px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;"><span style="color: #d97706; font-weight: bold; font-size: 16px;">⏰ ¡Apresúrate! Válido por {dias_restantes} días</span></div>'
        
        # Contenido HTML
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
                .container {{ max-width: 650px; margin: 0 auto; padding: 0; background-color: #ffffff; }}
                .header {{ 
                    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
                    color: white; 
                    padding: 40px 30px; 
                    text-align: center; 
                    border-radius: 0; 
                }}
                .header h1 {{ 
                    margin: 0 0 10px 0; 
                    font-size: 32px; 
                    font-weight: 700; 
                }}
                .badge {{ 
                    display: inline-block;
                    background: #fbbf24; 
                    color: #78350f; 
                    padding: 8px 20px; 
                    border-radius: 20px; 
                    font-weight: bold;
                    font-size: 14px;
                    margin: 15px 0 0 0;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }}
                .content {{ 
                    background: #ffffff; 
                    padding: 40px 30px; 
                }}
                .offer-description {{
                    background: #fef3c7;
                    padding: 20px;
                    border-radius: 10px;
                    border-left: 4px solid #f59e0b;
                    margin: 25px 0;
                }}
                .offer-description h2 {{
                    color: #92400e;
                    margin: 0 0 10px 0;
                    font-size: 20px;
                }}
                .offer-description p {{
                    margin: 0;
                    color: #78350f;
                    font-size: 15px;
                    line-height: 1.6;
                }}
                .products-section {{
                    margin: 30px 0;
                }}
                .products-section h3 {{
                    color: #111827;
                    margin: 0 0 20px 0;
                    font-size: 22px;
                    text-align: center;
                }}
                table {{ 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 0;
                    background: white;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                }}
                .stats-box {{
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    padding: 25px;
                    border-radius: 10px;
                    margin: 30px 0;
                    text-align: center;
                }}
                .stats-box .stat {{
                    display: inline-block;
                    margin: 0 20px;
                }}
                .stats-box .stat-number {{
                    font-size: 32px;
                    font-weight: bold;
                    display: block;
                    margin-bottom: 5px;
                }}
                .stats-box .stat-label {{
                    font-size: 14px;
                    opacity: 0.9;
                }}
                .button {{ 
                    display: inline-block; 
                    padding: 16px 40px; 
                    background: #dc2626; 
                    color: white !important; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    margin: 20px 0;
                    font-weight: bold;
                    font-size: 16px;
                    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
                    transition: all 0.3s;
                }}
                .validity {{
                    background: #f3f4f6;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                    margin: 25px 0;
                }}
                .validity .date {{
                    color: #374151;
                    font-size: 16px;
                    font-weight: 600;
                }}
                .footer {{ 
                    text-align: center; 
                    padding: 30px 20px; 
                    color: #6b7280; 
                    font-size: 13px; 
                    background: #f9fafb;
                    border-top: 1px solid #e5e7eb;
                }}
                .footer p {{ margin: 8px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div style="font-size: 56px; margin-bottom: 15px;">🎉</div>
                    <h1>¡OFERTA ESPECIAL!</h1>
                    <div class="badge">AHORRA HOY</div>
                </div>
                
                <div class="content">
                    {mensaje_urgencia}
                    
                    <div class="offer-description">
                        <h2>{oferta.titulo}</h2>
                        <p>{oferta.descripcion}</p>
                    </div>
                    
                    <div class="stats-box">
                        <div class="stat">
                            <span class="stat-number">{total_productos}</span>
                            <span class="stat-label">Productos en oferta</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">₡{ahorro_total:,.0f}</span>
                            <span class="stat-label">Ahorro total</span>
                        </div>
                    </div>
                    
                    <div class="products-section">
                        <h3>🥐 Productos Incluidos</h3>
                        <table>
                            <tbody>
                                {productos_html}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="validity">
                        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Válido desde</p>
                        <p class="date">📅 {oferta.fecha_inicio.strftime('%d de %B, %Y')} - {oferta.fecha_fin.strftime('%d de %B, %Y')}</p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 35px;">
                        <a href="http://localhost:5173/productos" class="button">
                            🛒 APROVECHAR OFERTA AHORA
                        </a>
                        <p style="color: #6b7280; font-size: 14px; margin-top: 15px;">
                            ¡No dejes pasar esta increíble oportunidad!
                        </p>
                    </div>
                </div>
                
                <div class="footer">
                    <p style="font-weight: 600; color: #374151;">🥐 Panadería Artesanal</p>
                    <p>Este correo fue enviado automáticamente. Por favor no responder.</p>
                    <p>© 2025 Panadería Artesanal. Todos los derechos reservados.</p>
                    <p style="margin-top: 15px; font-size: 12px;">Si deseas dejar de recibir promociones, <a href="#" style="color: #3b82f6;">haz clic aquí</a></p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Texto plano mejorado
        text_content = f"""
╔════════════════════════════════════════════════════════════╗
║            🎉 ¡NUEVA OFERTA ESPECIAL! 🎉                  ║
╚════════════════════════════════════════════════════════════╝

{oferta.titulo}

{oferta.descripcion}

{'⏰ ¡ÚLTIMOS DÍAS! Solo quedan ' + str(dias_restantes) + ' día(s)' if dias_restantes <= 3 else ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RESUMEN DE LA OFERTA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ {total_productos} productos incluidos
✓ Ahorro total de hasta ₡{ahorro_total:,.2f}
✓ Válido del {oferta.fecha_inicio.strftime('%d/%m/%Y')} al {oferta.fecha_fin.strftime('%d/%m/%Y')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🥐 PRODUCTOS EN OFERTA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{productos_text}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛒 ¡Visita nuestra tienda ahora!
👉 http://localhost:5173/productos

¡No dejes pasar esta increíble oportunidad!

---
🥐 Panadería Artesanal
Este correo fue enviado automáticamente.
© 2025 Todos los derechos reservados.
        """
        
        # Enviar correo
        email = EmailMultiAlternatives(
            subject=asunto,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=destinatarios
        )
        email.attach_alternative(html_content, "text/html")
        email.send()
        
        print(f"✅ Notificación de oferta enviada a {len(destinatarios)} clientes")
        print(f"   📦 {total_productos} productos incluidos")
        print(f"   💰 Ahorro total: ₡{ahorro_total:,.2f}")
        return True
        
    except Oferta.DoesNotExist:
        print(f"❌ Oferta {oferta_id} no encontrada")
        return False
    except Exception as e:
        print(f"❌ Error al enviar notificación de oferta: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def enviar_confirmacion_pedido(pedido_id):
    """
    Envía correo de confirmación al cliente Y notifica a los administradores
    Detecta si el pedido incluye ofertas
    """
    try:
        pedido = Pedido.objects.select_related('usuario').prefetch_related(
            'detalles__producto__ofertas'
        ).get(id=pedido_id)
        
        # ⭐ CONSTRUIR LISTADO DE PRODUCTOS CON DETECCIÓN DE OFERTAS
        productos_html = ""
        productos_text = ""
        tiene_ofertas = False
        
        detalles = pedido.detalles.all()
        
        # Debug detallado
        print(f"📊 Pedido #{pedido.id} - Total: ₡{pedido.total}")
        print(f"📊 Cantidad de detalles: {detalles.count()}")
        print(f"📊 Detalles query: {detalles.query}")
        
        if not detalles.exists():
            print(f"⚠️ ADVERTENCIA: Pedido #{pedido.id} no tiene detalles")
            print(f"⚠️ Usuario: {pedido.usuario.username}")
            print(f"⚠️ Estado: {pedido.estado}")
            print(f"⚠️ Fecha: {pedido.fecha}")
            
            # Intentar obtener detalles de otras formas
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT * FROM core_detallepedido WHERE pedido_id = %s", [pedido.id])
                rows = cursor.fetchall()
                print(f"⚠️ Detalles en BD (raw): {rows}")
        
        for detalle in detalles:
            producto = detalle.producto
            cantidad = detalle.cantidad
            
            # Verificar si el producto tiene ofertas activas
            from django.utils import timezone
            ofertas_activas = producto.ofertas.filter(
                fecha_inicio__lte=timezone.now().date(),
                fecha_fin__gte=timezone.now().date()
            )
            
            if ofertas_activas.exists():
                # Producto en oferta
                tiene_ofertas = True
                oferta = ofertas_activas.first()
                precio_original = producto.precio
                precio_unitario = oferta.precio_oferta
                descuento_porcentaje = ((precio_original - precio_unitario) / precio_original * 100)
                subtotal = precio_unitario * cantidad
                
                print(f"  🎉 {producto.nombre}: {cantidad} x ₡{precio_unitario} (OFERTA) = ₡{subtotal}")
                
                # HTML con indicador de oferta
                productos_html += f"""
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">
                        <strong>{producto.nombre}</strong>
                        <br>
                        <span style="background: #dc2626; color: white; padding: 2px 8px; border-radius: 3px; font-size: 11px; font-weight: bold;">
                            🎉 OFERTA: {oferta.titulo}
                        </span>
                        <br>
                        <span style="color: #6b7280; text-decoration: line-through; font-size: 12px;">
                            Precio regular: ₡{precio_original:,.2f}
                        </span>
                        <span style="color: #dc2626; font-size: 12px; font-weight: bold;">
                            (-{descuento_porcentaje:.0f}%)
                        </span>
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">{cantidad}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                        <span style="color: #dc2626; font-weight: bold;">₡{precio_unitario:,.2f}</span>
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                        <strong style="color: #10b981;">₡{subtotal:,.2f}</strong>
                    </td>
                </tr>
                """
                
                # Texto plano
                productos_text += f"🎉 {producto.nombre} x{cantidad} = ₡{subtotal:,.2f} (OFERTA: {oferta.titulo})\n"
                productos_text += f"   Precio regular: ₡{precio_original:,.2f} → Precio oferta: ₡{precio_unitario:,.2f}\n"
            else:
                # Producto normal (sin oferta)
                precio_unitario = producto.precio
                subtotal = precio_unitario * cantidad
                
                print(f"  - {producto.nombre}: {cantidad} x ₡{precio_unitario} = ₡{subtotal}")
                
                # HTML normal
                productos_html += f"""
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">{producto.nombre}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">{cantidad}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₡{precio_unitario:,.2f}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₡{subtotal:,.2f}</td>
                </tr>
                """
                
                # Texto plano
                productos_text += f"- {producto.nombre} x{cantidad} = ₡{subtotal:,.2f}\n"
        
        # Verificar que se generó contenido
        if not productos_html:
            productos_html = """
            <tr>
                <td colspan="4" style="padding: 20px; text-align: center; color: #6b7280;">
                    No hay productos en este pedido
                </td>
            </tr>
            """
            productos_text = "No hay productos en este pedido\n"
        
        # Mensaje especial si hay ofertas
        mensaje_ofertas = ""
        if tiene_ofertas:
            mensaje_ofertas = """
            <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <span style="font-size: 24px;">🎉</span>
                <p style="margin: 10px 0 0 0; color: #92400e; font-weight: bold;">
                    ¡Has aprovechado ofertas especiales en este pedido!
                </p>
            </div>
            """
        
        # ===== CORREO AL CLIENTE =====
        if pedido.usuario.email:
            asunto_cliente = f"✅ Confirmación de Pedido #{pedido.id}" + (" 🎉" if tiene_ofertas else "")
            
            html_cliente = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ 
                        background: {'linear-gradient(135deg, #10b981 0%, #059669 100%)' if not tiene_ofertas else 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'}; 
                        color: white; 
                        padding: 30px; 
                        text-align: center; 
                        border-radius: 10px 10px 0 0; 
                    }}
                    .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .order-info {{ 
                        background: white; 
                        padding: 20px; 
                        margin: 20px 0; 
                        border-radius: 8px; 
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
                    }}
                    table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                    th {{ background: #f3f4f6; padding: 10px; text-align: left; }}
                    .total {{ 
                        font-size: 1.3em; 
                        font-weight: bold; 
                        color: #10b981; 
                        text-align: right; 
                        padding: 20px 0; 
                        border-top: 2px solid #10b981; 
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div style="font-size: 48px; margin-bottom: 10px;">{'🎉' if tiene_ofertas else '✅'}</div>
                        <h1 style="margin: 0;">¡Pedido Confirmado!</h1>
                        <p style="margin: 10px 0 0 0;">Gracias por tu compra, {pedido.usuario.first_name or pedido.usuario.username}</p>
                    </div>
                    <div class="content">
                        {mensaje_ofertas}
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
                                Total: ₡{pedido.total:,.2f}
                            </div>
                        </div>
                        <p style="text-align: center;">
                            Tu pedido está siendo preparado. Te notificaremos cuando esté listo para recoger.
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            texto_ofertas = "\n🎉 ¡Este pedido incluye productos en oferta!\n\n" if tiene_ofertas else ""
            
            text_cliente = f"""
            ¡Pedido Confirmado!
            
            Hola {pedido.usuario.first_name or pedido.usuario.username},
            
            Tu pedido ha sido recibido exitosamente.
            {texto_ofertas}
            Número de Pedido: #{pedido.id}
            Fecha: {pedido.fecha.strftime('%d/%m/%Y %H:%M')}
            
            Productos:
            {productos_text}
            
            Total: ₡{pedido.total:,.2f}
            
            Te notificaremos cuando tu pedido esté listo.
            """
            
            email_cliente = EmailMultiAlternatives(
                subject=asunto_cliente,
                body=text_cliente,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[pedido.usuario.email]
            )
            email_cliente.attach_alternative(html_cliente, "text/html")
            email_cliente.send()
            print(f"✅ Confirmación enviada al cliente: {pedido.usuario.email}")
        
        # ===== NOTIFICAR A ADMINISTRADORES =====
        administradores = Usuario.objects.filter(
            rol='administrador',
            is_active=True,
            email__isnull=False
        ).exclude(email='')
        
        emails_admin = [admin.email for admin in administradores if admin.email]
        
        if emails_admin:
            tipo_pedido = " (INCLUYE OFERTAS)" if tiene_ofertas else ""
            asunto_admin = f"🔔 Nuevo Pedido #{pedido.id} de {pedido.usuario.username}{tipo_pedido}"
            
            badge_oferta = ""
            if tiene_ofertas:
                badge_oferta = """
                <div style="background: #fef3c7; border: 2px dashed #f59e0b; padding: 10px; border-radius: 8px; margin: 15px 0; text-align: center;">
                    <span style="color: #92400e; font-weight: bold;">
                        🎉 Este pedido incluye productos con ofertas activas
                    </span>
                </div>
                """
            
            html_admin = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ 
                        background: #3b82f6; 
                        color: white; 
                        padding: 30px; 
                        text-align: center; 
                        border-radius: 10px 10px 0 0; 
                    }}
                    .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .info-box {{ 
                        background: white; 
                        padding: 20px; 
                        margin: 15px 0; 
                        border-radius: 8px; 
                        border-left: 4px solid #3b82f6;
                    }}
                    table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                    th {{ background: #f3f4f6; padding: 10px; text-align: left; }}
                    td {{ padding: 10px; border-bottom: 1px solid #eee; }}
                    .total {{ 
                        font-size: 1.3em; 
                        font-weight: bold; 
                        color: #10b981; 
                        text-align: right; 
                        padding: 20px 0; 
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div style="font-size: 48px; margin-bottom: 10px;">🔔</div>
                        <h1 style="margin: 0;">Nuevo Pedido Recibido</h1>
                        <p style="margin: 10px 0 0 0;">Pedido #{pedido.id}</p>
                    </div>
                    <div class="content">
                        {badge_oferta}
                        <div class="info-box">
                            <h3 style="margin-top: 0; color: #3b82f6;">Información del Cliente</h3>
                            <p><strong>Nombre:</strong> {pedido.usuario.get_full_name() or pedido.usuario.username}</p>
                            <p><strong>Usuario:</strong> {pedido.usuario.username}</p>
                            <p><strong>Email:</strong> {pedido.usuario.email or 'No proporcionado'}</p>
                        </div>
                        
                        <div class="info-box">
                            <h3 style="margin-top: 0; color: #3b82f6;">Detalles del Pedido</h3>
                            <p><strong>Fecha:</strong> {pedido.fecha.strftime('%d/%m/%Y %H:%M')}</p>
                            <p><strong>Estado:</strong> {pedido.get_estado_display()}</p>
                            
                            <table>
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th style="text-align: center;">Cantidad</th>
                                        <th style="text-align: right;">Precio</th>
                                        <th style="text-align: right;">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productos_html}
                                </tbody>
                            </table>
                            
                            <div class="total">
                                Total del Pedido: ₡{pedido.total:,.2f}
                            </div>
                        </div>
                        
                        <p style="text-align: center; margin-top: 30px;">
                            <a href="http://localhost:8000/admin/core/pedido/{pedido.id}/change/" 
                               style="display: inline-block; padding: 12px 30px; background: #3b82f6; 
                                      color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                                Ver en Panel Admin
                            </a>
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            texto_ofertas_admin = "\n🎉 ESTE PEDIDO INCLUYE PRODUCTOS EN OFERTA\n\n" if tiene_ofertas else ""
            
            text_admin = f"""
            NUEVO PEDIDO RECIBIDO
            
            Pedido #{pedido.id}
            {texto_ofertas_admin}
            === INFORMACIÓN DEL CLIENTE ===
            Nombre: {pedido.usuario.get_full_name() or pedido.usuario.username}
            Usuario: {pedido.usuario.username}
            Email: {pedido.usuario.email or 'No proporcionado'}
            
            === DETALLES DEL PEDIDO ===
            Fecha: {pedido.fecha.strftime('%d/%m/%Y %H:%M')}
            Estado: {pedido.get_estado_display()}
            
            Productos:
            {productos_text}
            
            Total: ₡{pedido.total:,.2f}
            
            ---
            Ver en admin: http://localhost:8000/admin/core/pedido/{pedido.id}/change/
            """
            
            email_admin = EmailMultiAlternatives(
                subject=asunto_admin,
                body=text_admin,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=emails_admin
            )
            email_admin.attach_alternative(html_admin, "text/html")
            email_admin.send()
            print(f"✅ Notificación enviada a {len(emails_admin)} administrador(es)")
        
        return True
        
    except Pedido.DoesNotExist:
        print(f"❌ Pedido {pedido_id} no encontrado")
        return False
    except Exception as e:
        print(f"❌ Error al enviar confirmación: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def enviar_alerta_sin_stock(producto_id):
    """
    Notifica a los administradores cuando un producto se queda sin stock
    """
    try:
        producto = Producto.objects.get(id=producto_id)
        
        # Obtener administradores activos con email
        administradores = Usuario.objects.filter(
            rol='administrador',
            is_active=True,
            email__isnull=False
        ).exclude(email='')
        
        destinatarios = [admin.email for admin in administradores if admin.email]
        
        if not destinatarios:
            print("⚠️ No hay administradores con correos válidos")
            return False
        
        asunto = f"⚠️ ALERTA: Sin Stock - {producto.nombre}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ 
                    background: #dc2626; 
                    color: white; 
                    padding: 30px; 
                    text-align: center; 
                    border-radius: 10px 10px 0 0; 
                }}
                .content {{ background: #fef2f2; padding: 30px; border-radius: 0 0 10px 10px; }}
                .alert-box {{ 
                    background: white; 
                    padding: 20px; 
                    margin: 20px 0; 
                    border-radius: 8px; 
                    border-left: 4px solid #dc2626;
                }}
                .button {{ 
                    display: inline-block; 
                    padding: 12px 30px; 
                    background: #dc2626; 
                    color: white; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    font-weight: bold;
                    margin-top: 20px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
                    <h1 style="margin: 0;">ALERTA DE INVENTARIO</h1>
                    <p style="margin: 10px 0 0 0;">Producto Sin Stock</p>
                </div>
                <div class="content">
                    <div class="alert-box">
                        <h2 style="color: #dc2626; margin-top: 0;">Producto Agotado</h2>
                        <p><strong>Producto:</strong> {producto.nombre}</p>
                        <p><strong>Precio:</strong> ₡{producto.precio:,.2f}</p>
                        <p><strong>Estado:</strong> <span style="color: #dc2626; font-weight: bold;">Sin Disponibilidad</span></p>
                        {"<p><strong>Descripción:</strong> " + producto.descripcion + "</p>" if producto.descripcion else ""}
                    </div>
                    
                    <p style="font-size: 16px; color: #7f1d1d;">
                        <strong>Acción requerida:</strong> Este producto ha sido marcado como no disponible. 
                        Considera actualizar el inventario o desactivarlo temporalmente hasta reponer el stock.
                    </p>
                    
                    <div style="text-align: center;">
                        <a href="http://localhost:8000/admin/core/producto/{producto.id}/change/" class="button">
                            Gestionar Producto
                        </a>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        ⚠️ ALERTA DE INVENTARIO
        
        PRODUCTO SIN STOCK
        
        Producto: {producto.nombre}
        Precio: ₡{producto.precio:,.2f}
        Estado: Sin Disponibilidad
        {f"Descripción: {producto.descripcion}" if producto.descripcion else ""}
        
        ACCIÓN REQUERIDA:
        Este producto ha sido marcado como no disponible.
        Considera actualizar el inventario o desactivarlo temporalmente.
        
        Gestionar en: http://localhost:8000/admin/core/producto/{producto.id}/change/
        
        ---
        Sistema de Panadería Artesanal
        """
        
        email = EmailMultiAlternatives(
            subject=asunto,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=destinatarios
        )
        email.attach_alternative(html_content, "text/html")
        email.send()
        
        print(f"✅ Alerta de sin stock enviada a {len(destinatarios)} administrador(es)")
        return True
        
    except Producto.DoesNotExist:
        print(f"❌ Producto {producto_id} no encontrado")
        return False
    except Exception as e:
        print(f"❌ Error al enviar alerta de stock: {str(e)}")
        import traceback
        traceback.print_exc()
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
            'recibido': ('Tu pedido ha sido recibido', '📋', '#3b82f6'),
            'en_preparacion': ('Tu pedido está en preparación', '👨‍🍳', '#f59e0b'),
            'listo': ('¡Tu pedido está listo para recoger!', '✅', '#10b981'),
            'entregado': ('Tu pedido ha sido entregado', '🎉', '#8b5cf6'),
        }
        
        mensaje, emoji, color = estado_mensajes.get(
            pedido.estado, 
            ('Actualización de pedido', '📦', '#6b7280')
        )
        
        asunto = f"{emoji} {mensaje} - Pedido #{pedido.id}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ 
                    background: {color}; 
                    color: white; 
                    padding: 30px; 
                    text-align: center; 
                    border-radius: 10px 10px 0 0; 
                }}
                .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                .status-box {{ 
                    background: white; 
                    padding: 20px; 
                    margin: 20px 0; 
                    border-radius: 8px; 
                    border-left: 4px solid {color};
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div style="font-size: 48px; margin-bottom: 10px;">{emoji}</div>
                    <h1 style="margin: 0;">Actualización de Pedido</h1>
                </div>
                <div class="content">
                    <p>Hola {pedido.usuario.first_name or pedido.usuario.username},</p>
                    <div class="status-box">
                        <h2 style="color: {color}; margin-top: 0;">{mensaje}</h2>
                        <p><strong>Pedido:</strong> #{pedido.id}</p>
                        <p><strong>Estado actual:</strong> {pedido.get_estado_display()}</p>
                        <p><strong>Total:</strong> ₡{pedido.total:,.2f}</p>
                    </div>
                    <p>Gracias por tu preferencia.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        {mensaje}
        
        Hola {pedido.usuario.first_name or pedido.usuario.username},
        
        Pedido: #{pedido.id}
        Estado: {pedido.get_estado_display()}
        Total: ₡{pedido.total:,.2f}
        
        Gracias por tu preferencia.
        """
        
        email = EmailMultiAlternatives(
            subject=asunto,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[pedido.usuario.email]
        )
        email.attach_alternative(html_content, "text/html")
        email.send()
        
        print(f"✅ Actualización de estado enviada a {pedido.usuario.email}")
        return True
        
    except Exception as e:
        print(f"❌ Error al enviar actualización: {str(e)}")
        return False