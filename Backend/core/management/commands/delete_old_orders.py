# Backend/core/management/commands/delete_old_orders.py
# ⭐ COMANDO PARA AUTO-ELIMINAR PEDIDOS DESPUÉS DE 48H

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from core.models import Pedido

class Command(BaseCommand):
    help = 'Elimina automáticamente pedidos entregados/cancelados con más de 48 horas'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Muestra qué pedidos se eliminarían sin eliminarlos realmente',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        print("\n" + "="*60)
        print("🗑️  AUTO-DELETE DE PEDIDOS ANTIGUOS")
        print("="*60)
        
        # Obtener pedidos completados/cancelados
        pedidos_completados = Pedido.objects.filter(
            estado__in=['entregado', 'cancelado']
        )
        
        pedidos_a_eliminar = []
        ahora = timezone.now()
        
        for pedido in pedidos_completados:
            # Usar fecha_completado o fecha como fallback
            fecha_referencia = pedido.fecha_completado or pedido.fecha
            tiempo_transcurrido = ahora - fecha_referencia
            
            # Si han pasado más de 48 horas
            if tiempo_transcurrido >= timedelta(hours=48):
                pedidos_a_eliminar.append({
                    'id': pedido.id,
                    'estado': pedido.estado,
                    'fecha': fecha_referencia,
                    'horas': int(tiempo_transcurrido.total_seconds() // 3600),
                    'pedido': pedido
                })
        
        if not pedidos_a_eliminar:
            print("✅ No hay pedidos que eliminar")
            print("="*60 + "\n")
            return
        
        print(f"📋 Encontrados: {len(pedidos_a_eliminar)} pedidos")
        print()
        
        for item in pedidos_a_eliminar:
            print(f"  🗑️  Pedido #{item['id']}")
            print(f"      Estado: {item['estado']}")
            print(f"      Completado: {item['fecha'].strftime('%Y-%m-%d %H:%M')}")
            print(f"      Antigüedad: {item['horas']}h")
            print()
        
        if dry_run:
            print("⚠️  DRY RUN - No se eliminó nada")
            print("="*60 + "\n")
            return
        
        # Confirmar antes de eliminar (solo en modo interactivo)
        if options.get('interactive', True):
            confirmacion = input(f"¿Eliminar {len(pedidos_a_eliminar)} pedidos? (s/n): ")
            if confirmacion.lower() != 's':
                print("❌ Operación cancelada")
                print("="*60 + "\n")
                return
        
        # Eliminar pedidos
        eliminados = 0
        for item in pedidos_a_eliminar:
            try:
                item['pedido'].delete()
                eliminados += 1
                print(f"✅ Eliminado: Pedido #{item['id']}")
            except Exception as e:
                print(f"❌ Error eliminando Pedido #{item['id']}: {e}")
        
        print()
        print(f"✅ Total eliminados: {eliminados}/{len(pedidos_a_eliminar)}")
        print("="*60 + "\n")


# ============================================================================
# INSTRUCCIONES DE USO:
# ============================================================================
"""
1. MODO DRY-RUN (solo ver qué se eliminaría):
   python manage.py delete_old_orders --dry-run

2. MODO INTERACTIVO (con confirmación):
   python manage.py delete_old_orders

3. MODO AUTOMATICO (sin confirmación, para cron):
   python manage.py delete_old_orders --noinput

4. CONFIGURAR CRON JOB (en Railway/Render):
   - Ejecutar cada 6 horas:
     0 */6 * * * cd /app && python manage.py delete_old_orders --noinput

5. CONFIGURAR EN CELERY (alternativa):
   # En celery.py
   from celery.schedules import crontab
   
   app.conf.beat_schedule = {
       'delete-old-orders': {
           'task': 'core.tasks.delete_old_orders',
           'schedule': crontab(hour='*/6'),  # Cada 6 horas
       },
   }
"""