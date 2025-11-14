# Backend/core/utils.py
from django.core.signing import TimestampSigner, SignatureExpired, BadSignature
from django.conf import settings
import base64
import json

class EmailTokenGenerator:
    """
    Genera tokens seguros para enlaces en correos electrónicos
    """
    def __init__(self):
        self.signer = TimestampSigner()
    
    def generate_token(self, user_id, action, extra_data=None):
        """
        Genera un token seguro para una acción específica
        
        Args:
            user_id: ID del usuario
            action: Acción a realizar (ej: 'update_stock', 'new_product')
            extra_data: Datos adicionales (dict)
        """
        payload = {
            'user_id': user_id,
            'action': action,
            'extra': extra_data or {}
        }
        
        # Convertir a JSON y codificar en base64
        json_str = json.dumps(payload)
        encoded = base64.urlsafe_b64encode(json_str.encode()).decode()
        
        # Firmar el token
        signed_token = self.signer.sign(encoded)
        
        return signed_token
    
    def verify_token(self, token, max_age=86400):  # 24 horas por defecto
        """
        Verifica y decodifica un token
        
        Args:
            token: Token a verificar
            max_age: Tiempo máximo de validez en segundos
            
        Returns:
            dict con user_id, action y extra_data o None si es inválido
        """
        try:
            # Verificar firma y timestamp
            encoded = self.signer.unsign(token, max_age=max_age)
            
            # Decodificar
            json_str = base64.urlsafe_b64decode(encoded.encode()).decode()
            payload = json.loads(json_str)
            
            return payload
        except (SignatureExpired, BadSignature, Exception) as e:
            print(f"❌ Token inválido: {str(e)}")
            return None

# Instancia global
email_token_generator = EmailTokenGenerator()


def generate_admin_link(action, product_id=None, offer_id=None):
    """
    Genera un enlace seguro para acciones administrativas desde correos
    
    Args:
        action: 'update_stock', 'new_product', 'manage_offer', etc.
        product_id: ID del producto (opcional)
        offer_id: ID de la oferta (opcional)
    """
    from urllib.parse import urlencode
    
    # Datos de la acción
    extra_data = {}
    if product_id:
        extra_data['product_id'] = product_id
    if offer_id:
        extra_data['offer_id'] = offer_id
    
    # Generar token (sin user_id porque se verificará al hacer login)
    token = email_token_generator.generate_token(
        user_id=0,  # Se ignorará, se usa el usuario actual al hacer login
        action=action,
        extra_data=extra_data
    )
    
    # Construir URL
    params = urlencode({'token': token, 'action': action})
    base_url = settings.FRONTEND_URL or 'http://localhost:5173'
    
    return f"{base_url}/admin/auth-redirect?{params}"