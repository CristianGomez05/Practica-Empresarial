"""
Script para probar el sistema de envio de correos
Uso: python test_emails_simple.py
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'panaderia.settings')
django.setup()

from core.models import Usuario, Producto, Oferta, Pedido
from core.emails import enviar_notificacion_oferta, enviar_confirmacion_pedido
from datetime import date, timedelta

def test_emails():
    print("\n" + "="*60)
    print("PRUEBA DE SISTEMA DE CORREOS")
    print("="*60 + "\n")

    # 1. Verificar usuarios con email
    usuarios = Usuario.objects.filter(email__isnull=False).exclude(email='')
    print(f"Usuarios con email: {usuarios.count()}")
    for user in usuarios[:5]:
        print(f"   - {user.username}: {user.email}")

    # 2. Crear una oferta de prueba
    try:
        producto = Producto.objects.first()
        if not producto:
            print("\nERROR: No hay productos disponibles")
            print("Por favor crea un producto primero")
            return
        
        print(f"\nCreando oferta de prueba con producto: {producto.nombre}")
        
        oferta = Oferta.objects.create(
            titulo="Oferta de Prueba - 50% OFF",
            descripcion="Esta es una oferta de prueba para verificar el envio de correos",
            producto=producto,
            fecha_inicio=date.today(),
            fecha_fin=date.today() + timedelta(days=7)
        )
        
        print(f"\nOferta de prueba creada exitosamente")
        print(f"   ID: {oferta.id}")
        print(f"   Titulo: {oferta.titulo}")
        print(f"   Producto: {oferta.producto.nombre}")
        
        # Enviar notificación
        print("\nEnviando notificacion de oferta...")
        resultado = enviar_notificacion_oferta(oferta.id)
        
        if resultado:
            print("EXITO: Notificacion enviada")
            print("\nRevisa la consola del servidor Django para ver el email")
        else:
            print("ERROR: No se pudo enviar la notificacion")
        
        # Limpiar
        oferta.delete()
        print("\nOferta de prueba eliminada")
        
    except Exception as e:
        print(f"\nERROR al crear oferta: {str(e)}")
        import traceback
        traceback.print_exc()

    # 3. Probar confirmación de pedido
    try:
        pedido = Pedido.objects.filter(usuario__email__isnull=False).first()
        if pedido:
            print(f"\nProbando confirmacion de pedido #{pedido.id}")
            print(f"Usuario: {pedido.usuario.username} ({pedido.usuario.email})")
            
            resultado = enviar_confirmacion_pedido(pedido.id)
            
            if resultado:
                print("EXITO: Confirmacion enviada")
                print("\nRevisa la consola del servidor Django para ver el email")
            else:
                print("ERROR: No se pudo enviar la confirmacion")
        else:
            print("\nNo hay pedidos disponibles para probar")
            print("Crea un pedido primero desde el frontend")
            
    except Exception as e:
        print(f"\nERROR al probar pedido: {str(e)}")
        import traceback
        traceback.print_exc()

    print("\n" + "="*60)
    print("Prueba completada")
    print("="*60 + "\n")

    print("\nNOTA IMPORTANTE:")
    print("Si estas usando EMAIL_BACKEND = 'console', los correos")
    print("se mostraran en la consola donde esta corriendo el servidor.")
    print("Para enviar correos reales, configura SMTP en settings.py\n")

if __name__ == "__main__":
    test_emails()