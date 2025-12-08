# Backend/core/email_templates.py
"""
Templates profesionales para emails con diseño moderno y responsivo
⭐ VERSION PROFESIONAL: Sin emojis, con datos de sucursal en pedidos para recoger
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
                    panaderiasantaclara01@gmail.com
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
    """Template para notificación de nuevo producto con imagen"""
    imagen_url = producto.imagen.url if producto.imagen else "https://via.placeholder.com/400x250?text=Sin+Imagen"
    
    content = f"""
    <div class="header">
        <h1>Nuevo Producto Disponible</h1>
        <p class="subtitle">Recién salido del horno</p>
    </div>
    <div class="content">
        <p class="greeting">Hola,</p>
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
            No te pierdas esta delicia. Haz tu pedido ahora.
        </p>
    </div>
    """
    
    return get_base_template(content)


def template_nueva_oferta(oferta, url_ofertas):
    """Template para notificación de nueva oferta con productos"""
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
        <h1>OFERTA ESPECIAL</h1>
        <p class="subtitle">{oferta.titulo}</p>
    </div>
    <div class="content">
        <p class="greeting">Hola,</p>
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
            Oferta por tiempo limitado. No dejes pasar esta oportunidad.
        </p>
    </div>
    """
    
    return get_base_template(content)


def template_confirmacion_pedido(pedido, url_pedidos):
    """Template para confirmación de pedido con detalles, tipo de entrega y dirección"""
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
    
    # Determinar tipo de entrega y dirección
    if pedido.es_domicilio:
        tipo_entrega_texto = "Entrega a Domicilio"
        tipo_entrega_color = "#10b981"
        direccion_html = f"""
        <div style="margin-top: 20px; padding: 20px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 8px;">
            <h4 style="color: #059669; margin: 0 0 10px 0; font-size: 16px;">Dirección de Entrega</h4>
            <p style="color: #111827; margin: 0; font-size: 15px; line-height: 1.6;">
                {pedido.direccion_entrega}
            </p>
        </div>
        """
    else:
        tipo_entrega_texto = "Recoger en Sucursal"
        tipo_entrega_color = "#f59e0b"
        
        # Obtener datos de la sucursal
        sucursal_nombre = "Panadería Santa Clara"
        sucursal_direccion = "Alajuela, Costa Rica"
        sucursal_telefono = ""
        
        primer_detalle = pedido.detalles.first()
        if primer_detalle and primer_detalle.producto.sucursal:
            sucursal = primer_detalle.producto.sucursal
            sucursal_nombre = sucursal.nombre
            sucursal_direccion = sucursal.direccion or "Alajuela, Costa Rica"
            sucursal_telefono = sucursal.telefono or ""
        
        telefono_html = ""
        if sucursal_telefono:
            telefono_html = f"""
            <p style="color: #111827; margin: 5px 0 0 0; font-size: 15px;">
                <strong>Teléfono:</strong> {sucursal_telefono}
            </p>
            """
        
        direccion_html = f"""
        <div style="margin-top: 20px; padding: 20px; background-color: #fff7ed; border-left: 4px solid #f59e0b; border-radius: 8px;">
            <h4 style="color: #d97706; margin: 0 0 10px 0; font-size: 16px;">Recoger en Sucursal</h4>
            <p style="color: #111827; margin: 0; font-size: 15px; line-height: 1.6;">
                <strong>{sucursal_nombre}</strong>
            </p>
            <p style="color: #111827; margin: 5px 0 0 0; font-size: 15px; line-height: 1.6;">
                {sucursal_direccion}
            </p>
            {telefono_html}
            <p style="color: #6b7280; margin: 15px 0 0 0; font-size: 14px; line-height: 1.6;">
                Te notificaremos cuando tu pedido esté listo para recoger.
            </p>
        </div>
        """
    
    content = f"""
    <div class="header" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
        <h1>Pedido Confirmado</h1>
        <p class="subtitle">Pedido #{pedido.id}</p>
    </div>
    <div class="content">
        <p class="greeting">Hola {pedido.usuario.first_name or pedido.usuario.username},</p>
        <p style="font-size: 16px; color: #6b7280; margin-bottom: 30px;">
            Hemos recibido tu pedido y lo estamos preparando con mucho cariño. 
            Te notificaremos cuando esté listo.
        </p>
        
        <div class="product-card" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-left-color: #10b981;">
            <h3 style="color: #111827; margin-bottom: 20px; font-size: 18px;">Resumen del Pedido</h3>
            
            <div style="margin-bottom: 20px; padding: 15px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; text-align: center;">
                <p style="font-size: 14px; color: #6b7280; margin: 0 0 5px 0;">Tipo de Pedido</p>
                <p style="font-size: 20px; color: {tipo_entrega_color}; margin: 0; font-weight: 700;">
                    {tipo_entrega_texto}
                </p>
            </div>
            
            {direccion_html}
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
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
            Si tienes alguna pregunta, no dudes en contactarnos.
        </p>
    </div>
    """
    
    return get_base_template(content)


def template_actualizacion_estado(pedido, url_pedidos):
    """Template para actualización de estado de pedido"""
    estado_emoji_map = {
        'recibido': 'Recibido',
        'en_preparacion': 'En Preparación',
        'listo': 'Listo',
        'entregado': 'Entregado',
    }
    
    estado_color = {
        'recibido': '#3b82f6',
        'en_preparacion': '#f59e0b',
        'listo': '#10b981',
        'entregado': '#8b5cf6',
    }
    
    estado_texto = estado_emoji_map.get(pedido.estado, 'Actualizado')
    color = estado_color.get(pedido.estado, '#6b7280')
    
    content = f"""
    <div class="header" style="background: linear-gradient(135deg, {color} 0%, {color}dd 100%);">
        <h1>Actualización de Pedido</h1>
        <p class="subtitle">Pedido #{pedido.id}</p>
    </div>
    <div class="content">
        <p class="greeting">Hola {pedido.usuario.first_name or pedido.usuario.username},</p>
        <p style="font-size: 16px; color: #6b7280; margin-bottom: 30px;">
            Tu pedido ha sido actualizado:
        </p>
        
        <div class="product-card" style="background: linear-gradient(135deg, {color}10 0%, {color}20 100%); border-left-color: {color}; text-align: center;">
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
    """Template para alerta de producto SIN STOCK (agotado = 0) a administradores"""
    imagen_url = producto.imagen.url if producto.imagen else "https://via.placeholder.com/400x250?text=Sin+Imagen"
    
    content = f"""
    <div class="header" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);">
        <h1>ALERTA: Producto Agotado</h1>
        <p class="subtitle">Sin stock disponible</p>
    </div>
    <div class="content">
        <p class="greeting">Hola Administrador,</p>
        <p style="font-size: 16px; color: #6b7280; margin-bottom: 30px;">
            El siguiente producto se ha quedado <strong>SIN STOCK</strong> y requiere atención inmediata:
        </p>
        
        <div class="product-card" style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-left-color: #dc2626;">
            <img src="{imagen_url}" alt="{producto.nombre}" class="product-image">
            <h2 class="product-name" style="color: #dc2626;">
                {producto.nombre}
            </h2>
            <p class="product-description">{producto.descripcion or 'Producto sin descripción.'}</p>
            
            <div style="background-color: rgba(220, 38, 38, 0.1); padding: 20px; border-radius: 8px; margin: 20px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 150px; text-align: center; margin: 10px;">
                        <p style="color: #6b7280; font-size: 14px; margin: 0;">Stock Actual</p>
                        <p style="color: #dc2626; font-size: 32px; font-weight: 700; margin: 5px 0;">0</p>
                        <p style="color: #dc2626; font-size: 12px; font-weight: 600; margin: 0;">AGOTADO</p>
                    </div>
                    <div style="flex: 1; min-width: 150px; text-align: center; margin: 10px;">
                        <p style="color: #6b7280; font-size: 14px; margin: 0;">Precio</p>
                        <p style="color: #111827; font-size: 24px; font-weight: 700; margin: 5px 0;">₡{producto.precio:,.2f}</p>
                    </div>
                    <div style="flex: 1; min-width: 150px; text-align: center; margin: 10px;">
                        <p style="color: #6b7280; font-size: 14px; margin: 0;">Estado</p>
                        <p style="color: #dc2626; font-size: 18px; font-weight: 700; margin: 5px 0;">SIN STOCK</p>
                    </div>
                </div>
            </div>
            
            <div style="background-color: #fff; padding: 15px; border-radius: 8px; border: 2px dashed #dc2626; margin-top: 20px;">
                <p style="color: #dc2626; font-weight: 600; margin: 0; text-align: center;">
                    Acción Urgente: Reabastecer inventario
                </p>
            </div>
        </div>
        
        <div class="button-container">
            <a href="{url_admin_productos}" class="button" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4);">
                Gestionar Inventario
            </a>
        </div>
        
        <div class="divider"></div>
        
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626;">
            <h3 style="color: #dc2626; margin-top: 0; font-size: 16px;">Acciones Urgentes:</h3>
            <ul style="color: #6b7280; margin: 10px 0; padding-left: 20px; line-height: 1.8;">
                <li><strong>Verificar stock físico</strong> en bodega</li>
                <li><strong>Actualizar cantidad</strong> disponible</li>
                <li><strong>Contactar proveedores</strong> para reabastecimiento urgente</li>
                <li><strong>Evaluar demanda</strong> del producto</li>
                <li><strong>Notificar clientes</strong> si hay pedidos pendientes</li>
            </ul>
        </div>
        
        <p style="text-align: center; color: #6b7280; margin-top: 30px; font-size: 14px;">
            Este email fue enviado automáticamente cuando el producto se quedó sin stock.
        </p>
    </div>
    """
    
    return get_base_template(content)


def template_alerta_stock_bajo(producto, url_admin_productos):
    """Template para alerta de STOCK BAJO (≤10 unidades) a administradores"""
    imagen_url = producto.imagen.url if producto.imagen else "https://via.placeholder.com/400x250?text=Sin+Imagen"
    
    content = f"""
    <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
        <h1>ALERTA: Stock Bajo</h1>
        <p class="subtitle">Pocas unidades disponibles</p>
    </div>
    <div class="content">
        <p class="greeting">Hola Administrador,</p>
        <p style="font-size: 16px; color: #6b7280; margin-bottom: 30px;">
            El siguiente producto tiene <strong>STOCK BAJO</strong> y requiere reabastecimiento pronto:
        </p>
        
        <div class="product-card" style="background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-left-color: #f59e0b;">
            <img src="{imagen_url}" alt="{producto.nombre}" class="product-image">
            <h2 class="product-name" style="color: #f59e0b;">
                {producto.nombre}
            </h2>
            <p class="product-description">{producto.descripcion or 'Producto sin descripción.'}</p>
            
            <div style="background-color: rgba(245, 158, 11, 0.1); padding: 20px; border-radius: 8px; margin: 20px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 150px; text-align: center; margin: 10px;">
                        <p style="color: #6b7280; font-size: 14px; margin: 0;">Stock Actual</p>
                        <p style="color: #f59e0b; font-size: 32px; font-weight: 700; margin: 5px 0;">{producto.stock}</p>
                        <p style="color: #f59e0b; font-size: 12px; font-weight: 600; margin: 0;">STOCK BAJO</p>
                    </div>
                    <div style="flex: 1; min-width: 150px; text-align: center; margin: 10px;">
                        <p style="color: #6b7280; font-size: 14px; margin: 0;">Precio</p>
                        <p style="color: #111827; font-size: 24px; font-weight: 700; margin: 5px 0;">₡{producto.precio:,.2f}</p>
                    </div>
                    <div style="flex: 1; min-width: 150px; text-align: center; margin: 10px;">
                        <p style="color: #6b7280; font-size: 14px; margin: 0;">Estado</p>
                        <p style="color: #f59e0b; font-size: 18px; font-weight: 700; margin: 5px 0;">BAJO</p>
                    </div>
                </div>
            </div>
            
            <div style="background-color: #fff; padding: 15px; border-radius: 8px; border: 2px dashed #f59e0b; margin-top: 20px;">
                <p style="color: #f59e0b; font-weight: 600; margin: 0; text-align: center;">
                    Acción Recomendada: Planificar reabastecimiento
                </p>
            </div>
        </div>
        
        <div class="button-container">
            <a href="{url_admin_productos}" class="button" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);">
                Gestionar Inventario
            </a>
        </div>
        
        <div class="divider"></div>
        
        <div style="background-color: #fff7ed; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <h3 style="color: #f59e0b; margin-top: 0; font-size: 16px;">Recomendaciones:</h3>
            <ul style="color: #6b7280; margin: 10px 0; padding-left: 20px; line-height: 1.8;">
                <li><strong>Verificar stock físico</strong> en bodega</li>
                <li><strong>Planificar reabastecimiento</strong> antes de que se agote</li>
                <li><strong>Contactar proveedores</strong> para coordinar entrega</li>
                <li><strong>Evaluar demanda</strong> del producto</li>
                <li><strong>Considerar ajustar precio</strong> si la demanda es muy alta</li>
            </ul>
        </div>
        
        <p style="text-align: center; color: #6b7280; margin-top: 30px; font-size: 14px;">
            Este email fue enviado automáticamente cuando el stock bajó a {producto.stock} unidades o menos.
        </p>
    </div>
    """
    
    return get_base_template(content)


def template_notificacion_pedido_admin(pedido, url_admin_pedidos):
    """Template para notificación de nuevo pedido a administradores"""
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
    
    cliente_nombre = pedido.usuario.get_full_name() or pedido.usuario.username
    cliente_email = pedido.usuario.email or "No proporcionado"
    cliente_usuario = pedido.usuario.username
    
    # Información de entrega
    if pedido.es_domicilio:
        tipo_entrega_texto = "Entrega a Domicilio"
        tipo_entrega_color = "#10b981"
        direccion_html = f"""
        <div style="margin-top: 15px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">Dirección de Entrega</p>
            <p style="color: #111827; font-size: 16px; font-weight: 600; margin: 5px 0; line-height: 1.6;">
                {pedido.direccion_entrega}
            </p>
        </div>
        """
    else:
        tipo_entrega_texto = "Recoger en Sucursal"
        tipo_entrega_color = "#f59e0b"
        direccion_html = """
        <div style="margin-top: 15px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">Recoger en Sucursal</p>
            <p style="color: #111827; font-size: 16px; font-weight: 600; margin: 5px 0;">
                El cliente recogerá el pedido en sucursal
            </p>
        </div>
        """
    
    content = f"""
    <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
        <h1>Nuevo Pedido Recibido</h1>
        <p class="subtitle">Pedido #{pedido.id}</p>
    </div>
    <div class="content">
        <p class="greeting">Hola Administrador,</p>
        <p style="font-size: 16px; color: #6b7280; margin-bottom: 30px;">
            Se ha recibido un nuevo pedido que requiere tu atención:
        </p>
        
        <div style="background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-left: 4px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #111827; margin-top: 0; font-size: 18px; margin-bottom: 15px;">Información del Cliente</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 20px;">
                <div style="flex: 1; min-width: 200px;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">Nombre Completo</p>
                    <p style="color: #111827; font-size: 16px; font-weight: 600; margin: 5px 0;">{cliente_nombre}</p>
                </div>
                <div style="flex: 1; min-width: 200px;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">Usuario</p>
                    <p style="color: #111827; font-size: 16px; font-weight: 600; margin: 5px 0;">{cliente_usuario}</p>
                </div>
            </div>
            <div style="margin-top: 15px;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">Email de Contacto</p>
                <p style="color: #f59e0b; font-size: 16px; font-weight: 600; margin: 5px 0;">
                    <a href="mailto:{cliente_email}" style="color: #f59e0b; text-decoration: none;">{cliente_email}</a>
                </p>
            </div>
        </div>
        
        <div style="background: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #111827; margin-top: 0; font-size: 18px; margin-bottom: 15px;">Detalles del Pedido</h3>
            
            <div style="margin-bottom: 20px; padding: 15px; background: rgba(245, 158, 11, 0.1); border-radius: 8px; text-align: center;">
                <p style="font-size: 14px; color: #6b7280; margin: 0 0 5px 0;">Tipo de Pedido</p>
                <p style="font-size: 20px; color: {tipo_entrega_color}; margin: 0; font-weight: 700;">
                    {tipo_entrega_texto}
                </p>
            </div>
            
            {direccion_html}
        </div>
        
        <div class="product-card" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-left-color: #10b981;">
            <h3 style="color: #111827; margin-bottom: 20px; font-size: 18px;">Productos del Pedido</h3>
            
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
                        <td style="padding: 20px 15px; text-align: right; font-weight: 700; font-size: 28px; color: #10b981;">
                            ₡{pedido.total:,.2f}
                        </td>
                    </tr>
                </tfoot>
            </table>
            
            <div style="margin-top: 20px; padding: 15px; background-color: rgba(245, 158, 11, 0.1); border-radius: 8px; text-align: center;">
                <p style="font-size: 14px; color: #d97706; margin: 0;">
                    <strong>Estado Actual:</strong> {pedido.get_estado_display()}
                </p>
            </div>
        </div>
        
        <div class="button-container">
            <a href="{url_admin_pedidos}" class="button" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);">
                Gestionar Pedido
            </a>
        </div>
        
        <div class="divider"></div>
        
        <div style="background-color: #fff7ed; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <h3 style="color: #f59e0b; margin-top: 0; font-size: 16px;">Próximos Pasos:</h3>
            <ul style="color: #6b7280; margin: 10px 0; padding-left: 20px; line-height: 1.8;">
                <li>Verificar disponibilidad de productos</li>
                <li>Confirmar el pedido con el cliente si es necesario</li>
                <li>Actualizar el estado del pedido según avance la preparación</li>
                <li>Notificar al cliente cuando esté listo para {"entrega" if pedido.es_domicilio else "recoger"}</li>
            </ul>
        </div>
        
        <p style="text-align: center; color: #6b7280; margin-top: 30px; font-size: 14px;">
            Este email fue enviado automáticamente por el sistema de gestión de pedidos.
        </p>
    </div>
    """
    
    return get_base_template(content)


def template_pedido_cancelado_admin(pedido, url_admin_pedidos):
    """Template para notificar a admins cuando un cliente cancela un pedido"""
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
    
    cliente_nombre = pedido.usuario.get_full_name() or pedido.usuario.username
    cliente_email = pedido.usuario.email or "No proporcionado"
    cliente_usuario = pedido.usuario.username
    
    # Determinar información de entrega
    tipo_entrega = "Entrega a Domicilio" if pedido.es_domicilio else "Recoger en Sucursal"
    direccion_html = ""
    if pedido.es_domicilio and pedido.direccion_entrega:
        direccion_html = f"""
        <div style="margin-top: 15px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">Dirección de Entrega</p>
            <p style="color: #111827; font-size: 16px; font-weight: 600; margin: 5px 0;">{pedido.direccion_entrega}</p>
        </div>
        """
    
    sucursal_nombre = "N/A"
    primer_detalle = pedido.detalles.first()
    if primer_detalle and primer_detalle.producto.sucursal:
        sucursal_nombre = primer_detalle.producto.sucursal.nombre
    
    content = f"""
    <div class="header" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);">
        <h1>Pedido Cancelado</h1>
        <p class="subtitle">Pedido #{pedido.id}</p>
    </div>
    <div class="content">
        <p class="greeting">Atención Administrador,</p>
        <p style="font-size: 16px; color: #6b7280; margin-bottom: 30px;">
            El cliente ha cancelado el siguiente pedido:
        </p>
        
        <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-left: 4px solid #dc2626; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #111827; margin-top: 0; font-size: 18px; margin-bottom: 15px;">Información del Cliente</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 20px;">
                <div style="flex: 1; min-width: 200px;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">Nombre Completo</p>
                    <p style="color: #111827; font-size: 16px; font-weight: 600; margin: 5px 0;">{cliente_nombre}</p>
                </div>
                <div style="flex: 1; min-width: 200px;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">Usuario</p>
                    <p style="color: #111827; font-size: 16px; font-weight: 600; margin: 5px 0;">{cliente_usuario}</p>
                </div>
            </div>
            <div style="margin-top: 15px;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">Email de Contacto</p>
                <p style="color: #dc2626; font-size: 16px; font-weight: 600; margin: 5px 0;">
                    <a href="mailto:{cliente_email}" style="color: #dc2626; text-decoration: none;">{cliente_email}</a>
                </p>
            </div>
        </div>
        
        <div style="background: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #111827; margin-top: 0; font-size: 18px; margin-bottom: 15px;">Detalles del Pedido</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 15px;">
                <div style="flex: 1; min-width: 150px; text-align: center; margin: 10px;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">Sucursal</p>
                    <p style="color: #111827; font-size: 18px; font-weight: 700; margin: 5px 0;">{sucursal_nombre}</p>
                </div>
                <div style="flex: 1; min-width: 150px; text-align: center; margin: 10px;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">Tipo de Pedido</p>
                    <p style="color: #111827; font-size: 18px; font-weight: 700; margin: 5px 0;">{tipo_entrega}</p>
                </div>
            </div>
            {direccion_html}
        </div>
        
        <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);">
                    <tr>
                        <th style="padding: 15px; text-align: left; color: #111827; font-weight: 600;">Imagen</th>
                        <th style="padding: 15px; text-align: left; color: #111827; font-weight: 600;">Producto</th>
                        <th style="padding: 15px; text-align: center; color: #111827; font-weight: 600;">Cantidad</th>
                        <th style="padding: 15px; text-align: right; color: #111827; font-weight: 600;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    {productos_html}
                </tbody>
                <tfoot style="background-color: #fef2f2;">
                    <tr>
                        <td colspan="3" style="padding: 20px; text-align: right; font-weight: 600; color: #dc2626; font-size: 18px;">
                            TOTAL:
                        </td>
                        <td style="padding: 20px; text-align: right; font-weight: 700; color: #dc2626; font-size: 20px;">
                            ₡{pedido.total:,.2f}
                        </td>
                    </tr>
                </tfoot>
            </table>
            
            <div style="margin: 20px; padding: 15px; background-color: rgba(220, 38, 38, 0.1); border-radius: 8px; text-align: center;">
                <p style="font-size: 14px; color: #dc2626; margin: 0;">
                    <strong>Estado:</strong> Cancelado por el Cliente
                </p>
            </div>
        </div>
        
        <div class="button-container">
            <a href="{url_admin_pedidos}" class="button" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4);">
                Ver Pedidos
            </a>
        </div>
        
        <div class="divider"></div>
        
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626;">
            <h3 style="color: #dc2626; margin-top: 0; font-size: 16px;">Acciones Recomendadas:</h3>
            <ul style="color: #6b7280; margin: 10px 0; padding-left: 20px; line-height: 1.8;">
                <li><strong>Verificar</strong> que no se haya iniciado la preparación del pedido</li>
                <li><strong>Devolver productos</strong> al inventario si ya fueron separados</li>
                <li><strong>Contactar al cliente</strong> si es necesario para confirmar la cancelación</li>
                <li><strong>Documentar</strong> la razón de la cancelación si el cliente la proporcionó</li>
                <li><strong>Evaluar</strong> si es necesario tomar alguna acción adicional</li>
            </ul>
        </div>
        
        <p style="text-align: center; color: #6b7280; margin-top: 30px; font-size: 14px;">
            Este email fue enviado automáticamente cuando el cliente canceló el pedido.
        </p>
    </div>
    """
    
    return get_base_template(content)