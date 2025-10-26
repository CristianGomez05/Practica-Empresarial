# Backend/populate_db.py
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'panaderia.settings')
django.setup()

from core.models import Producto, Oferta
from datetime import date, timedelta

# Crear productos con imágenes de Unsplash
productos = [
    {
        'nombre': 'Croissant',
        'descripcion': 'Delicioso croissant francés recién horneado',
        'precio': 2500,
        'disponible': True,
        'imagen': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80'
    },
    {
        'nombre': 'Pan de Masa Madre',
        'descripcion': 'Pan artesanal elaborado con masa madre natural',
        'precio': 4000,
        'disponible': True,
        'imagen': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80'
    },
    {
        'nombre': 'Muffin de Chocolate',
        'descripcion': 'Suave muffin con chips de chocolate belga',
        'precio': 3000,
        'disponible': True,
        'imagen': 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=800&q=80'
    },
    {
        'nombre': 'Baguette',
        'descripcion': 'Baguette francesa crujiente por fuera, suave por dentro',
        'precio': 2800,
        'disponible': True,
        'imagen': 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800&q=80'
    },
    {
        'nombre': 'Donas Glaseadas',
        'descripcion': 'Donas esponjosas con glaseado de vainilla',
        'precio': 2000,
        'disponible': True,
        'imagen': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80'
    },
    {
        'nombre': 'Pastel de Chocolate',
        'descripcion': 'Delicioso pastel de chocolate con cobertura cremosa',
        'precio': 5500,
        'disponible': True,
        'imagen': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80'
    },
    {
        'nombre': 'Galletas de Mantequilla',
        'descripcion': 'Galletas crujientes de mantequilla recién horneadas',
        'precio': 1500,
        'disponible': True,
        'imagen': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&q=80'
    },
    {
        'nombre': 'Pan Integral',
        'descripcion': 'Pan integral saludable con semillas',
        'precio': 3500,
        'disponible': True,
        'imagen': 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80'
    },
]

print("🥐 Creando productos...")
for p_data in productos:
    producto, created = Producto.objects.update_or_create(
        nombre=p_data['nombre'],
        defaults=p_data
    )
    if created:
        print(f"  ✅ Creado: {producto.nombre}")
    else:
        print(f"  🔄 Actualizado: {producto.nombre}")

# Crear ofertas
print("\n🎉 Creando ofertas...")

ofertas_data = [
    {
        'titulo': '2x1 en Croissants',
        'descripcion': 'Compra un croissant y llévate otro gratis. Válido solo esta semana.',
        'producto_nombre': 'Croissant'
    },
    {
        'titulo': '50% OFF en Muffins',
        'descripcion': 'Todos los muffins con 50% de descuento. ¡Aprovecha!',
        'producto_nombre': 'Muffin de Chocolate'
    },
    {
        'titulo': 'Combo Pan + Galletas',
        'descripcion': 'Lleva pan integral y galletas con 30% de descuento',
        'producto_nombre': 'Pan Integral'
    }
]

for oferta_data in ofertas_data:
    try:
        producto = Producto.objects.get(nombre=oferta_data['producto_nombre'])
        oferta, created = Oferta.objects.update_or_create(
            titulo=oferta_data['titulo'],
            defaults={
                'descripcion': oferta_data['descripcion'],
                'fecha_inicio': date.today(),
                'fecha_fin': date.today() + timedelta(days=7),
                'producto': producto
            }
        )
        if created:
            print(f"  ✅ Creada: {oferta.titulo}")
        else:
            print(f"  🔄 Actualizada: {oferta.titulo}")
    except Producto.DoesNotExist:
        print(f"  ⚠️  Producto '{oferta_data['producto_nombre']}' no encontrado")

print("\n✨ ¡Base de datos poblada exitosamente!")