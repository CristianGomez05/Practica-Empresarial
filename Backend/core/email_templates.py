# Backend/core/email_templates.py
"""
Templates profesionales para emails con diseño moderno y responsivo
"""

def get_base_template(content, preheader=""):
    """
    Template base con diseño moderno y responsivo
    """
    return f"""
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <title>Panadería Santa Clara</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background-color: #f3f4f6;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }}
        
        .email-wrapper {{
            width: 100%;
            background-color: #f3f4f6;
            padding: 40px 20px;
        }}
        
        .email-container {{
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }}
        
        .header {{
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            padding: 40px 30px;
            text-align: center;
        }}
        
        .header h1 {{
            color: #ffffff;
            font-size: 28px;
            font-weight: 700;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }}
        
        .header .subtitle {{
            color: rgba(255, 255, 255, 0.95);
            font-size: 16px;
            margin-top: 8px;
        }}
        
        .content {{
            padding: 40px 30px;
        }}
        
        .greeting {{
            font-size: 18px;
            color: #111827;
            margin-bottom: 20px;
        }}
        
        .product-card {{
            background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
            border-left: 4px solid #f59e0b;
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }}
        
        .product-image {{
            width: 100%;
            max-width: 400px;
            height: 250px;
            object-fit: cover;
            border-radius: 12px;
            margin-bottom: 20px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }}
        
        .product-name {{
            font-size: 24px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 12px;
        }}
        
        .product-description {{
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 16px;
            line-height: 1.7;
        }}
        
        .price {{
            font-size: 32px;
            font-weight: 700;
            color: #10b981;
            margin: 20px 0;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }}
        
        .button {{
            display: inline-block;
            padding: 16px 40px;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 10px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);
            transition: transform 0.2s, box-shadow 0.2s;
        }}
        
        .button:hover {{
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(245, 158, 11, 0.5);
        }}
        
        .button-container {{
            text-align: center;
            margin: 30px 0;
        }}
        
        .divider {{
            height: 1px;
            background: linear-gradient(to right, transparent, #e5e7eb, transparent);
            margin: 30px 0;
        }}
        
        .footer {{
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }}
        
        .footer-text {{
            color: #6b7280;
            font-size: 14px;
            line-height: 1.7;
        }}
        
        .footer-links {{
            margin-top: 20px;
        }}
        
        .footer-links a {{
            color: #f59e0b;
            text-decoration: none;
            margin: 0 10px;
            font-weight: 500;
        }}
        
        .social-links {{
            margin-top: 20px;
        }}
        
        .social-links a {{
            display: inline-block;
            width: 40px;
            height: 40px;
            margin: 0 8px;
            background-color: #f59e0b;
            border-radius: 50%;
            line-height: 40px;
            color: white;
            text-decoration: none;
        }}
        
        /* Responsive */
        @media only screen and (max-width: 600px) {{
            .email-wrapper {{
                padding: 20px 10px;
            }}
            
            .header {{
                padding: 30px 20px;
            }}
            
            .header h1 {{
                font-size: 24px;
            }}
            
            .content {{
                padding: 30px 20px;
            }}
            
            .product-card {{
                padding: 20px;
            }}
            
            .product-name {{
                font-size: 20px;
            }}
            
            .price {{
                font-size: 28px;
            }}
            
            .button {{
                padding: 14px 32px;
                font-size: 15px;
            }}
        }}
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-container">
            {content}
            <div class="footer">
                <div class="footer-text">
                    <strong>Panadería Santa Clara</strong><br>
                    Alajuela, Costa Rica<br>
                    📧 panaderiasantaclara01@gmail.com
                </div>
                <div class="divider"></div>
                <p class="footer-text" style="font-size: 12px; color: #9ca3af;">
                    Este email fue enviado porque eres parte del equipo de Panadería Santa Clara.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
    """


def template_nuevo_producto(producto, url_productos):
    """
    Template para notificación de nuevo producto con imagen
    """
    imagen_url = producto.imagen.url if producto.imagen else "https://via.placeholder.com/400x250?text=Sin+Imagen"
    
    content = f"""
    <div class="header">
        <h1>🥐 Nuevo Producto Disponible</h1>
        <p class="subtitle">¡Recién salido del horno!</p>
    </div>
    <div class="content">
        <p class="greeting">¡Hola!</p>
        <p>Tenemos una deliciosa novedad para ti. Te presentamos nuestro nuevo producto:</p>
        
        <div class="product-card">
            <img src="{imagen_url}" alt="{producto.nombre}" class="product-image">
            <h2 class="product-name">{producto.nombre}</h2>
            <p class="product-description">{producto.descripcion or 'Delicioso producto recién horneado con los mejores ingredientes.'}</p>
            <div class="price">₡{producto.precio:,.2f}</div>
        </div>
        
        <div class="button-container">
            <a href="{url_productos}" class="button">Ver Todos los Productos</a>
        </div>
        
        <div class="divider"></div>
        
        <p style="text-align: center; color: #6b7280;">
            ¡No te pierdas esta delicia! Haz tu pedido ahora.
        </p>
    </div>
    """
    
    return get_base_template(content)


def template_nueva_oferta(oferta, url_ofertas):
    """
    Template para notificación de nueva oferta con productos
    """
    productos_html = ""
    for producto in oferta.productos.all()[:3]:
        imagen_url = producto.imagen.url if producto.imagen else "https://via.placeholder.com/150x100?text=Sin+Imagen"
        productos_html += f"""
        <div style="display: inline-block; width: 150px; margin: 10px; text-align: center; vertical-align: top;">
            <img src="{imagen_url}" alt="{producto.nombre}" 
                 style="width: 150px; height: 100px; object-fit: cover; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <p style="font-size: 14px; margin-top: 8px; color: #111827; font-weight: 600;">{producto.nombre}</p>
            <p style="font-size: 12px; color: #6b7280; text-decoration: line-through;">₡{producto.precio:,.2f}</p>
        </div>
        """
    
    if oferta.productos.count() > 3:
        productos_html += f"""
        <p style="text-align: center; color: #6b7280; margin-top: 10px;">
            + {oferta.productos.count() - 3} producto(s) más
        </p>
        """
    
    content = f"""
    <div class="header" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);">
        <h1>🎉 ¡OFERTA ESPECIAL!</h1>
        <p class="subtitle">{oferta.titulo}</p>
    </div>
    <div class="content">
        <p class="greeting">¡Hola!</p>
        <p style="font-size: 18px; color: #111827; margin-bottom: 20px;">
            <strong>No te pierdas esta increíble oferta:</strong>
        </p>
        
        <div class="product-card" style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-left-color: #dc2626;">
            <h2 class="product-name" style="color: #dc2626;">{oferta.titulo}</h2>
            <p class="product-description">{oferta.descripcion}</p>
            
            <div style="text-align: center; margin: 20px 0;">
                {productos_html}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <div class="price" style="color: #dc2626;">₡{oferta.precio_oferta:,.2f}</div>
                <p style="color: #6b7280; font-size: 14px;">
                    Válido del {oferta.fecha_inicio.strftime('%d/%m/%Y')} al {oferta.fecha_fin.strftime('%d/%m/%Y')}
                </p>
            </div>
        </div>
        
        <div class="button-container">
            <a href="{url_ofertas}" class="button" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4);">
                Ver Ofertas
            </a>
        </div>
        
        <div class="divider"></div>
        
        <p style="text-align: center; color: #6b7280;">
            ⏰ ¡Oferta por tiempo limitado! No dejes pasar esta oportunidad.
        </p>
    </div>
    """
    
    return get_base_template(content)


def template_confirmacion_pedido(pedido, url_pedidos):
    """
    Template para confirmación de pedido con detalles
    """
    productos_html = ""
    for detalle in pedido.detalles.all():
        imagen_url = detalle.producto.imagen.url if detalle.producto.imagen else "https://via.placeholder.com/80x80?text=Sin+Imagen"
        subtotal = detalle.producto.precio * detalle.cantidad
        productos_html += f"""
        <tr>
            <td style="padding: 15px; border-bottom: 1px solid #e5e7eb;">
                <img src="{imagen_url}" alt="{detalle.producto.nombre}" 
                     style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; vertical-align: middle;">
            </td>
            <td style="padding: 15px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #111827;">
                {detalle.producto.nombre}
            </td>
            <td style="padding: 15px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #6b7280;">
                x{detalle.cantidad}
            </td>
            <td style="padding: 15px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #111827;">
                ₡{subtotal:,.2f}
            </td>
        </tr>
        """
    
    content = f"""
    <div class="header" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
        <h1>✅ ¡Pedido Confirmado!</h1>
        <p class="subtitle">Pedido #{pedido.id}</p>
    </div>
    <div class="content">
        <p class="greeting">¡Hola {pedido.usuario.first_name or pedido.usuario.username}!</p>
        <p style="font-size: 16px; color: #6b7280; margin-bottom: 30px;">
            Hemos recibido tu pedido y lo estamos preparando con mucho cariño. 
            Te notificaremos cuando esté listo.
        </p>
        
        <div class="product-card" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-left-color: #10b981;">
            <h3 style="color: #111827; margin-bottom: 20px; font-size: 18px;">Resumen del Pedido</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background-color: rgba(16, 185, 129, 0.1);">
                        <th style="padding: 12px; text-align: left; font-size: 14px; color: #6b7280;">Imagen</th>
                        <th style="padding: 12px; text-align: left; font-size: 14px; color: #6b7280;">Producto</th>
                        <th style="padding: 12px; text-align: center; font-size: 14px; color: #6b7280;">Cant.</th>
                        <th style="padding: 12px; text-align: right; font-size: 14px; color: #6b7280;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    {productos_html}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="padding: 20px 15px; text-align: right; font-weight: 700; font-size: 18px; color: #111827;">
                            TOTAL:
                        </td>
                        <td style="padding: 20px 15px; text-align: right; font-weight: 700; font-size: 24px; color: #10b981;">
                            ₡{pedido.total:,.2f}
                        </td>
                    </tr>
                </tfoot>
            </table>
            
            <div style="margin-top: 20px; padding: 15px; background-color: rgba(16, 185, 129, 0.1); border-radius: 8px; text-align: center;">
                <p style="font-size: 14px; color: #059669; margin: 0;">
                    <strong>Estado Actual:</strong> {pedido.get_estado_display()}
                </p>
            </div>
        </div>
        
        <div class="button-container">
            <a href="{url_pedidos}" class="button" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
                Ver Mis Pedidos
            </a>
        </div>
        
        <div class="divider"></div>
        
        <p style="text-align: center; color: #6b7280;">
            📞 Si tienes alguna pregunta, no dudes en contactarnos.
        </p>
    </div>
    """
    
    return get_base_template(content)


def template_actualizacion_estado(pedido, url_pedidos):
    """
    Template para actualización de estado de pedido
    """
    estado_emoji = {
        'recibido': '📋',
        'en_preparacion': '👨‍🍳',
        'listo': '✅',
        'entregado': '🎉',
    }
    
    estado_color = {
        'recibido': '#3b82f6',
        'en_preparacion': '#f59e0b',
        'listo': '#10b981',
        'entregado': '#8b5cf6',
    }
    
    emoji = estado_emoji.get(pedido.estado, '📦')
    color = estado_color.get(pedido.estado, '#6b7280')
    
    content = f"""
    <div class="header" style="background: linear-gradient(135deg, {color} 0%, {color}dd 100%);">
        <h1>{emoji} Actualización de Pedido</h1>
        <p class="subtitle">Pedido #{pedido.id}</p>
    </div>
    <div class="content">
        <p class="greeting">¡Hola {pedido.usuario.first_name or pedido.usuario.username}!</p>
        <p style="font-size: 16px; color: #6b7280; margin-bottom: 30px;">
            Tu pedido ha sido actualizado:
        </p>
        
        <div class="product-card" style="background: linear-gradient(135deg, {color}10 0%, {color}20 100%); border-left-color: {color}; text-align: center;">
            <div style="font-size: 64px; margin-bottom: 20px;">{emoji}</div>
            <h2 style="color: {color}; font-size: 28px; margin-bottom: 10px;">
                {pedido.get_estado_display()}
            </h2>
            <p style="color: #6b7280; font-size: 16px;">
                Total: <strong style="color: #111827;">₡{pedido.total:,.2f}</strong>
            </p>
        </div>
        
        <div class="button-container">
            <a href="{url_pedidos}" class="button" style="background: linear-gradient(135deg, {color} 0%, {color}dd 100%);">
                Ver Detalles del Pedido
            </a>
        </div>
    </div>
    """
    
    return get_base_template(content)


def template_alerta_sin_stock(producto, url_admin_productos):
    """
    Template para alerta de producto sin stock a administradores
    """
    imagen_url = producto.imagen.url if producto.imagen else "https://via.placeholder.com/400x250?text=Sin+Imagen"
    
    content = f"""
    <div class="header" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);">
        <h1>⚠️ ALERTA DE INVENTARIO</h1>
        <p class="subtitle">Producto sin stock</p>
    </div>
    <div class="content">
        <p class="greeting">Hola Administrador,</p>
        <p style="font-size: 16px; color: #6b7280; margin-bottom: 30px;">
            El siguiente producto se ha quedado sin stock y requiere atención inmediata:
        </p>
        
        <div class="product-card" style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-left-color: #dc2626;">
            <img src="{imagen_url}" alt="{producto.nombre}" class="product-image">
            <h2 class="product-name" style="color: #dc2626;">
                ⚠️ {producto.nombre}
            </h2>
            <p class="product-description">{producto.descripcion or 'Producto sin descripción.'}</p>
            
            <div style="background-color: rgba(220, 38, 38, 0.1); padding: 20px; border-radius: 8px; margin: 20px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 150px; text-align: center; margin: 10px;">
                        <p style="color: #6b7280; font-size: 14px; margin: 0;">Stock Actual</p>
                        <p style="color: #dc2626; font-size: 32px; font-weight: 700; margin: 5px 0;">0</p>
                    </div>
                    <div style="flex: 1; min-width: 150px; text-align: center; margin: 10px;">
                        <p style="color: #6b7280; font-size: 14px; margin: 0;">Precio</p>
                        <p style="color: #111827; font-size: 24px; font-weight: 700; margin: 5px 0;">₡{producto.precio:,.2f}</p>
                    </div>
                    <div style="flex: 1; min-width: 150px; text-align: center; margin: 10px;">
                        <p style="color: #6b7280; font-size: 14px; margin: 0;">Estado</p>
                        <p style="color: #dc2626; font-size: 18px; font-weight: 700; margin: 5px 0;">🔴 AGOTADO</p>
                    </div>
                </div>
            </div>
            
            <div style="background-color: #fff; padding: 15px; border-radius: 8px; border: 2px dashed #dc2626; margin-top: 20px;">
                <p style="color: #dc2626; font-weight: 600; margin: 0; text-align: center;">
                    ⚡ Acción Requerida: Actualizar inventario
                </p>
            </div>
        </div>
        
        <div class="button-container">
            <a href="{url_admin_productos}" class="button" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4);">
                Gestionar Inventario
            </a>
        <div class="divider"></div>
        
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626;">
            <h3 style="color: #dc2626; margin-top: 0; font-size: 16px;">📋 Acciones Recomendadas:</h3>
            <ul style="color: #6b7280; margin: 10px 0; padding-left: 20px; line-height: 1.8;">
                <li>Verificar stock físico en bodega</li>
                <li>Actualizar cantidad disponible</li>
                <li>Evaluar demanda del producto</li>
                <li>Coordinar con proveedores si es necesario</li>
            </ul>
        </div>
        
        <p style="text-align: center; color: #6b7280; margin-top: 30px; font-size: 14px;">
            Este email fue enviado automáticamente por el sistema de gestión de inventario.
        </p>
    </div>
    """
    
    return get_base_template(content)