# Backend/core/views_password.py
# 🔐 Vistas para recuperación y cambio de contraseña

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from .models import Usuario
from .serializers import UsuarioSerializer
import logging

logger = logging.getLogger(__name__)


# ============================================================================
# SOLICITAR RECUPERACIÓN DE CONTRASEÑA
# ============================================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def solicitar_recuperacion_password(request):
    """
    Envía un email con el link de recuperación de contraseña
    Body: { "email": "user@example.com" }
    """
    email = request.data.get('email', '').strip().lower()
    
    if not email:
        return Response({
            'error': 'El email es requerido'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    print(f"\n{'='*60}")
    print(f"📧 SOLICITUD DE RECUPERACIÓN DE CONTRASEÑA")
    print(f"   Email: {email}")
    print(f"{'='*60}\n")
    
    try:
        usuario = Usuario.objects.get(email=email)
        print(f"✅ Usuario encontrado: {usuario.username}")
        
        # Generar token
        token = default_token_generator.make_token(usuario)
        uid = urlsafe_base64_encode(force_bytes(usuario.pk))
        
        # Construir URL de recuperación
        frontend_url = settings.FRONTEND_URL
        reset_url = f"{frontend_url}/recuperar-password/{uid}/{token}/"
        
        print(f"🔗 URL de recuperación generada:")
        print(f"   {reset_url}")
        
        # Preparar email
        subject = '🔐 Recuperación de Contraseña - Panadería Santa Clara'
        message = f"""
Hola {usuario.first_name or usuario.username},

Recibimos una solicitud para restablecer tu contraseña.

Para crear una nueva contraseña, haz clic en el siguiente enlace:
{reset_url}

Este enlace es válido por 24 horas.

Si no solicitaste este cambio, puedes ignorar este correo.

Saludos,
Equipo de Panadería Santa Clara 🥐
        """
        
        # Enviar email
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            print(f"✅ Email enviado exitosamente a {email}")
        except Exception as e:
            print(f"❌ Error enviando email: {e}")
            # No revelar que el email existe
            pass
        
        # Siempre retornar éxito (no revelar si el email existe)
        return Response({
            'message': 'Si el email existe, recibirás un correo con instrucciones para recuperar tu contraseña.',
            'detail': 'Revisa tu bandeja de entrada y spam.'
        }, status=status.HTTP_200_OK)
        
    except Usuario.DoesNotExist:
        print(f"⚠️ Email no encontrado: {email}")
        # No revelar que el email no existe (seguridad)
        return Response({
            'message': 'Si el email existe, recibirás un correo con instrucciones para recuperar tu contraseña.',
            'detail': 'Revisa tu bandeja de entrada y spam.'
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        print(f"❌ Error en recuperación: {e}")
        return Response({
            'error': 'Error procesando la solicitud'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# VALIDAR TOKEN DE RECUPERACIÓN
# ============================================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def validar_token_recuperacion(request):
    """
    Valida si el token de recuperación es válido
    Body: { "uid": "...", "token": "..." }
    """
    uid = request.data.get('uid')
    token = request.data.get('token')
    
    if not uid or not token:
        return Response({
            'valid': False,
            'error': 'UID y token son requeridos'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        usuario = Usuario.objects.get(pk=user_id)
        
        if default_token_generator.check_token(usuario, token):
            print(f"✅ Token válido para {usuario.username}")
            return Response({
                'valid': True,
                'username': usuario.username
            }, status=status.HTTP_200_OK)
        else:
            print(f"❌ Token inválido o expirado")
            return Response({
                'valid': False,
                'error': 'El enlace ha expirado o es inválido'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except (TypeError, ValueError, OverflowError, Usuario.DoesNotExist):
        return Response({
            'valid': False,
            'error': 'El enlace es inválido'
        }, status=status.HTTP_400_BAD_REQUEST)


# ============================================================================
# RESTABLECER CONTRASEÑA (CON TOKEN)
# ============================================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def restablecer_password(request):
    """
    Restablece la contraseña usando el token
    Body: {
        "uid": "...",
        "token": "...",
        "new_password": "..."
    }
    """
    uid = request.data.get('uid')
    token = request.data.get('token')
    new_password = request.data.get('new_password')
    
    if not all([uid, token, new_password]):
        return Response({
            'error': 'Faltan datos requeridos'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if len(new_password) < 8:
        return Response({
            'error': 'La contraseña debe tener al menos 8 caracteres'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        usuario = Usuario.objects.get(pk=user_id)
        
        if not default_token_generator.check_token(usuario, token):
            return Response({
                'error': 'El enlace ha expirado o es inválido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Cambiar contraseña
        usuario.set_password(new_password)
        usuario.save()
        
        print(f"✅ Contraseña restablecida para {usuario.username}")
        
        # Enviar email de confirmación
        try:
            send_mail(
                subject='🔐 Contraseña Actualizada - Panadería Santa Clara',
                message=f"""
Hola {usuario.first_name or usuario.username},

Tu contraseña ha sido actualizada exitosamente.

Si no realizaste este cambio, contacta inmediatamente con soporte.

Saludos,
Equipo de Panadería Santa Clara 🥐
                """,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[usuario.email],
                fail_silently=True,
            )
        except:
            pass
        
        return Response({
            'message': 'Contraseña actualizada exitosamente',
            'detail': 'Ya puedes iniciar sesión con tu nueva contraseña'
        }, status=status.HTTP_200_OK)
        
    except (TypeError, ValueError, OverflowError, Usuario.DoesNotExist):
        return Response({
            'error': 'El enlace es inválido'
        }, status=status.HTTP_400_BAD_REQUEST)


# ============================================================================
# CAMBIAR CONTRASEÑA (AUTENTICADO)
# ============================================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cambiar_password(request):
    """
    Cambia la contraseña del usuario autenticado
    Body: {
        "current_password": "...",
        "new_password": "..."
    }
    """
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    
    if not all([current_password, new_password]):
        return Response({
            'error': 'Contraseña actual y nueva son requeridas'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if len(new_password) < 8:
        return Response({
            'error': 'La nueva contraseña debe tener al menos 8 caracteres'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    usuario = request.user
    
    # Verificar contraseña actual
    if not usuario.check_password(current_password):
        return Response({
            'error': 'La contraseña actual es incorrecta'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Verificar que la nueva no sea igual a la actual
    if current_password == new_password:
        return Response({
            'error': 'La nueva contraseña debe ser diferente a la actual'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Cambiar contraseña
    usuario.set_password(new_password)
    usuario.save()
    
    print(f"✅ Contraseña cambiada para {usuario.username}")
    
    # Enviar email de confirmación
    try:
        send_mail(
            subject='🔐 Contraseña Actualizada - Panadería Santa Clara',
            message=f"""
Hola {usuario.first_name or usuario.username},

Tu contraseña ha sido actualizada exitosamente.

Si no realizaste este cambio, contacta inmediatamente con soporte.

Saludos,
Equipo de Panadería Santa Clara 🥐
            """,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[usuario.email],
            fail_silently=True,
        )
    except:
        pass
    
    return Response({
        'message': 'Contraseña actualizada exitosamente',
        'detail': 'Tu contraseña ha sido cambiada correctamente'
    }, status=status.HTTP_200_OK)