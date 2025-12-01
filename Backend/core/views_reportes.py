# Backend/core/views_reportes.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg, F
from django.utils import timezone
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
    
    # Filtrar por sucursal si se proporciona
    pedidos_queryset = Pedido.objects.filter(estado='completado')
    detalles_queryset = DetallePedido.objects.filter(pedido__estado='completado')
    productos_queryset = Producto.objects.all()
    
    if sucursal_id:
        print(f"🔍 Filtrando por sucursal: {sucursal_id}")
        pedidos_queryset = pedidos_queryset.filter(
            detalles__producto__sucursal_id=sucursal_id
        ).distinct()
        detalles_queryset = detalles_queryset.filter(
            producto__sucursal_id=sucursal_id
        )
        productos_queryset = productos_queryset.filter(sucursal_id=sucursal_id)
    elif user.rol == 'administrador' and user.sucursal:
        # Admin regular: solo su sucursal
        print(f"🔒 Admin regular - Sucursal: {user.sucursal.id}")
        pedidos_queryset = pedidos_queryset.filter(
            detalles__producto__sucursal=user.sucursal
        ).distinct()
        detalles_queryset = detalles_queryset.filter(
            producto__sucursal=user.sucursal
        )
        productos_queryset = productos_queryset.filter(sucursal=user.sucursal)
    
    # Fechas
    hoy = timezone.now().date()
    hace_7_dias = hoy - timedelta(days=7)
    inicio_semana = hoy - timedelta(days=hoy.weekday())
    inicio_mes = hoy.replace(day=1)
    
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
    
    print(f"✅ Estadísticas calculadas:")
    print(f"   Ventas mes: ₡{ventas_mes:,.2f}")
    print(f"   Pedidos mes: {pedidos_mes}")
    print(f"   Productos: {total_productos}")
    print("="*60 + "\n")
    
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, EsAdministrador])
def exportar_reporte(request):
    """
    Endpoint para exportar reportes en PDF o HTML.
    GET /api/reportes/exportar/?formato=pdf
    """
    formato = request.query_params.get('formato', 'html')
    
    # Por ahora, solo retornar un mensaje
    # Puedes implementar generación de PDF con ReportLab o WeasyPrint
    return Response({
        'message': f'Exportación en formato {formato} no implementada aún',
        'formato': formato
    })