# Backend/update_stock.py
"""
Script para actualizar el stock de productos existentes
Ejecutar: python update_stock.py
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'panaderia.settings')
django.setup()

from core.models import Producto

def actualizar_stock():
    print("\n" + "="*60)
    print("ACTUALIZACIÓN DE STOCK INICIAL")
    print("="*60 + "\n")
    
    productos = Producto.objects.all()
    
    if not productos.exists():
        print("⚠️ No hay productos en la base de datos")
        return
    
    print(f"📦 Se actualizarán {productos.count()} productos\n")
    
    # Stock inicial por defecto (puedes ajustarlo)
    stock_inicial = 50
    
    for producto in productos:
        stock_anterior = producto.stock
        producto.stock = stock_inicial
        producto.disponible = True
        producto.alerta_stock_enviada = False
        producto.save()
        
        print(f"✅ {producto.nombre}")
        print(f"   Stock: {stock_anterior} → {producto.stock}")
        print(f"   Disponible: ✓")
        print()
    
    print("="*60)
    print("✨ Stock actualizado exitosamente")
    print("="*60 + "\n")

if __name__ == "__main__":
    actualizar_stock()