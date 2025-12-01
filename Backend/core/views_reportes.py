# Backend/core/views_reportes.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg, F, Q
from django.utils import timezone
from django.http import HttpResponse
from datetime import timedelta
from .models import Pedido, DetallePedido, Producto
from .permissions import EsAdministrador


@api_view(['GET'])
@permission_classes([IsAuthenticated, EsAdministrador])
def estadisticas(request):
    """
    Endpoint para obtener estadísticas de ventas y productos.
    GET /api/reportes/estadisticas/
    Query params opcionales: sucursal (ID)
    """
    print("\n" + "="*60)
    print("📊 GET /reportes/estadisticas/")
    print("="*60)
    
    user = request.user
    sucursal_id = request.query_params.get('sucursal')
    
    # ⭐ Solo pedidos entregados para reportes
    pedidos_queryset = Pedido.objects.filter(estado='entregado')
    detalles_queryset = DetallePedido.objects.filter(pedido__estado='entregado')
    productos_queryset = Producto.objects.all()
    
    # ⭐ DEBUG: Ver TODOS los pedidos antes de filtrar
    todos_pedidos = Pedido.objects.all().order_by('-fecha')
    print(f"\n📦 TODOS LOS PEDIDOS EN LA BD ({todos_pedidos.count()}):")
    for p in todos_pedidos[:10]:  # Mostrar últimos 10
        print(f"   #{p.id} | Estado: {p.estado} | Fecha: {p.fecha} | Total: ₡{p.total}")
    
    # Contar por estado
    pedidos_por_estado = {}
    for estado_code, estado_label in Pedido.ESTADOS:
        count = Pedido.objects.filter(estado=estado_code).count()
        if count > 0:
            pedidos_por_estado[estado_label] = count
    print(f"\n📊 Pedidos por estado: {pedidos_por_estado}")
    
    if sucursal_id:
        print(f"\n🔍 Filtrando por sucursal: {sucursal_id}")
        pedidos_queryset = pedidos_queryset.filter(
            detalles__producto__sucursal_id=sucursal_id
        ).distinct()
        detalles_queryset = detalles_queryset.filter(
            producto__sucursal_id=sucursal_id
        )
        productos_queryset = productos_queryset.filter(sucursal_id=sucursal_id)
    elif user.rol == 'administrador' and user.sucursal:
        # Admin regular: solo su sucursal
        print(f"\n🔒 Admin regular - Sucursal: {user.sucursal.id}")
        pedidos_queryset = pedidos_queryset.filter(
            detalles__producto__sucursal=user.sucursal
        ).distinct()
        detalles_queryset = detalles_queryset.filter(
            producto__sucursal=user.sucursal
        )
        productos_queryset = productos_queryset.filter(sucursal=user.sucursal)
    
    print(f"\n📊 Pedidos 'entregado' filtrados: {pedidos_queryset.count()}")
    
    # Fechas
    hoy = timezone.now().date()
    hace_7_dias = hoy - timedelta(days=7)
    inicio_semana = hoy - timedelta(days=hoy.weekday())
    inicio_mes = hoy.replace(day=1)
    
    print(f"\n📅 Fechas de análisis:")
    print(f"   Hoy: {hoy}")
    print(f"   Inicio semana: {inicio_semana}")
    print(f"   Inicio mes: {inicio_mes}")
    
    # Ventas por período
    ventas_hoy = pedidos_queryset.filter(fecha__date=hoy).aggregate(
        total=Sum('total')
    )['total'] or 0
    
    ventas_semana = pedidos_queryset.filter(fecha__date__gte=inicio_semana).aggregate(
        total=Sum('total')
    )['total'] or 0
    
    ventas_mes = pedidos_queryset.filter(fecha__date__gte=inicio_mes).aggregate(
        total=Sum('total')
    )['total'] or 0
    
    # Pedidos por período
    pedidos_hoy = pedidos_queryset.filter(fecha__date=hoy).count()
    pedidos_semana = pedidos_queryset.filter(fecha__date__gte=inicio_semana).count()
    pedidos_mes = pedidos_queryset.filter(fecha__date__gte=inicio_mes).count()
    
    print(f"\n💰 Ventas calculadas:")
    print(f"   Hoy: ₡{ventas_hoy:,.2f} ({pedidos_hoy} pedidos)")
    print(f"   Semana: ₡{ventas_semana:,.2f} ({pedidos_semana} pedidos)")
    print(f"   Mes: ₡{ventas_mes:,.2f} ({pedidos_mes} pedidos)")
    
    # Promedio por venta
    promedio_venta = pedidos_queryset.aggregate(
        promedio=Avg('total')
    )['promedio'] or 0
    
    # Total productos
    total_productos = productos_queryset.count()
    
    # Ventas por día (últimos 7 días)
    ventas_por_dia = []
    for i in range(7):
        dia = hoy - timedelta(days=6-i)
        total_dia = pedidos_queryset.filter(fecha__date=dia).aggregate(
            total=Sum('total')
        )['total'] or 0
        ventas_por_dia.append({
            'fecha': dia.isoformat(),
            'total': float(total_dia)
        })
    
    # Top 5 productos más vendidos
    top_productos = detalles_queryset.values(
        'producto__id',
        'producto__nombre'
    ).annotate(
        total_vendido=Sum('cantidad'),
        total_ingresos=Sum(F('cantidad') * F('producto__precio'))
    ).order_by('-total_vendido')[:5]
    
    top_productos_list = [
        {
            'id': p['producto__id'],
            'nombre': p['producto__nombre'],
            'total_vendido': p['total_vendido'],
            'total_ingresos': float(p['total_ingresos'] or 0)
        }
        for p in top_productos
    ]
    
    # Producto más vendido del mes
    producto_mas_vendido = None
    if top_productos_list:
        mas_vendido = top_productos_list[0]
        producto_mas_vendido = {
            'nombre': mas_vendido['nombre'],
            'cantidad': mas_vendido['total_vendido'],
            'ingresos': mas_vendido['total_ingresos']
        }
    
    data = {
        'ventas_hoy': float(ventas_hoy),
        'ventas_semana': float(ventas_semana),
        'ventas_mes': float(ventas_mes),
        'pedidos_hoy': pedidos_hoy,
        'pedidos_semana': pedidos_semana,
        'pedidos_mes': pedidos_mes,
        'promedio_venta': float(promedio_venta),
        'total_productos': total_productos,
        'ventas_por_dia': ventas_por_dia,
        'top_productos': top_productos_list,
        'producto_mas_vendido': producto_mas_vendido
    }
    
    print(f"\n✅ Estadísticas calculadas:")
    print(f"   Ventas mes: ₡{ventas_mes:,.2f}")
    print(f"   Pedidos mes: {pedidos_mes}")
    print(f"   Productos: {total_productos}")
    print("="*60 + "\n")
    
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, EsAdministrador])
def exportar_reporte(request):
    """
    Endpoint para exportar reportes en HTML.
    GET /api/reportes/exportar/?formato=html&sucursal=1
    """
    formato = request.query_params.get('formato', 'html')
    sucursal_id = request.query_params.get('sucursal')
    user = request.user
    
    print(f"\n📥 Exportando reporte en formato: {formato}")
    
    # Obtener estadísticas
    pedidos_queryset = Pedido.objects.filter(estado='entregado')
    
    if sucursal_id:
        pedidos_queryset = pedidos_queryset.filter(
            detalles__producto__sucursal_id=sucursal_id
        ).distinct()
        sucursal_nombre = Producto.objects.filter(sucursal_id=sucursal_id).first().sucursal.nombre if Producto.objects.filter(sucursal_id=sucursal_id).exists() else "Todas"
    elif user.rol == 'administrador' and user.sucursal:
        pedidos_queryset = pedidos_queryset.filter(
            detalles__producto__sucursal=user.sucursal
        ).distinct()
        sucursal_nombre = user.sucursal.nombre
    else:
        sucursal_nombre = "Todas las Sucursales"
    
    # Calcular estadísticas
    hoy = timezone.now().date()
    inicio_mes = hoy.replace(day=1)
    
    ventas_mes = pedidos_queryset.filter(fecha__date__gte=inicio_mes).aggregate(
        total=Sum('total')
    )['total'] or 0
    
    pedidos_mes = pedidos_queryset.filter(fecha__date__gte=inicio_mes).count()
    
    # Top productos
    detalles_queryset = DetallePedido.objects.filter(pedido__estado='entregado')
    if sucursal_id:
        detalles_queryset = detalles_queryset.filter(producto__sucursal_id=sucursal_id)
    elif user.rol == 'administrador' and user.sucursal:
        detalles_queryset = detalles_queryset.filter(producto__sucursal=user.sucursal)
    
    top_productos = detalles_queryset.values(
        'producto__nombre'
    ).annotate(
        total_vendido=Sum('cantidad'),
        total_ingresos=Sum(F('cantidad') * F('producto__precio'))
    ).order_by('-total_vendido')[:5]
    
    # Generar HTML
    html_content = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte de Ventas - Panadería Santa Clara</title>
        <style>
            body {{
                font-family: 'Arial', sans-serif;
                margin: 0;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #333;
            }}
            .container {{
                max-width: 900px;
                margin: 0 auto;
                background: white;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            }}
            .header {{
                text-align: center;
                margin-bottom: 40px;
                border-bottom: 3px solid #667eea;
                padding-bottom: 20px;
            }}
            .header h1 {{
                color: #667eea;
                margin: 0;
                font-size: 32px;
            }}
            .header p {{
                color: #666;
                margin: 10px 0 0 0;
            }}
            .stats {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 40px;
            }}
            .stat-card {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
            }}
            .stat-card h3 {{
                margin: 0 0 10px 0;
                font-size: 14px;
                opacity: 0.9;
            }}
            .stat-card p {{
                margin: 0;
                font-size: 28px;
                font-weight: bold;
            }}
            .section {{
                margin-bottom: 30px;
            }}
            .section h2 {{
                color: #667eea;
                border-bottom: 2px solid #667eea;
                padding-bottom: 10px;
                margin-bottom: 20px;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
            }}
            th, td {{
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #ddd;
            }}
            th {{
                background-color: #667eea;
                color: white;
                font-weight: bold;
            }}
            tr:hover {{
                background-color: #f5f5f5;
            }}
            .footer {{
                text-align: center;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                color: #666;
                font-size: 12px;
            }}
            .badge {{
                display: inline-block;
                background: #fbbf24;
                color: #78350f;
                padding: 5px 15px;
                border-radius: 20px;
                font-weight: bold;
                font-size: 14px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🥐 Panadería Santa Clara</h1>
                <p>Reporte de Ventas - {sucursal_nombre}</p>
                <p style="font-size: 12px; color: #999;">Generado el {hoy.strftime('%d/%m/%Y')}</p>
            </div>

            <div class="stats">
                <div class="stat-card">
                    <h3>Ventas del Mes</h3>
                    <p>₡{ventas_mes:,.0f}</p>
                </div>
                <div class="stat-card">
                    <h3>Pedidos</h3>
                    <p>{pedidos_mes}</p>
                </div>
                <div class="stat-card">
                    <h3>Promedio</h3>
                    <p>₡{(ventas_mes / pedidos_mes if pedidos_mes > 0 else 0):,.0f}</p>
                </div>
            </div>

            <div class="section">
                <h2>🏆 Top 5 Productos Más Vendidos</h2>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Producto</th>
                            <th>Unidades</th>
                            <th>Ingresos</th>
                        </tr>
                    </thead>
                    <tbody>
    """
    
    for idx, producto in enumerate(top_productos, 1):
        medalla = "🥇" if idx == 1 else "🥈" if idx == 2 else "🥉" if idx == 3 else "🏅"
        html_content += f"""
                        <tr>
                            <td>{medalla}</td>
                            <td><strong>{producto['producto__nombre']}</strong></td>
                            <td>{producto['total_vendido']}</td>
                            <td>₡{float(producto['total_ingresos'] or 0):,.0f}</td>
                        </tr>
        """
    
    html_content += """
                    </tbody>
                </table>
            </div>

            <div class="footer">
                <p><strong>Panadería Santa Clara</strong> - Sistema de Gestión</p>
                <p>Este reporte fue generado automáticamente por el sistema</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    print(f"✅ Reporte HTML generado exitosamente")
    
    response = HttpResponse(html_content, content_type='text/html')
    response['Content-Disposition'] = f'attachment; filename="reporte_{hoy}.html"'
    return response