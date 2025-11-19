# Backend/core/email_backend.py
from django.core.mail.backends.base import BaseEmailBackend
from django.conf import settings
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Content, Email, To
import logging

logger = logging.getLogger(__name__)


class SendGridBackend(BaseEmailBackend):
    """
    Backend personalizado para enviar emails usando SendGrid API.
    Funciona en Railway donde SMTP está bloqueado.
    """
    
    def __init__(self, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        self.api_key = getattr(settings, 'SENDGRID_API_KEY', None)
        
        if not self.api_key:
            logger.warning("⚠️ SENDGRID_API_KEY no configurado")
    
    def send_messages(self, email_messages):
        """
        Envía una lista de mensajes de email usando SendGrid API.
        Retorna el número de mensajes enviados exitosamente.
        """
        if not self.api_key:
            logger.error("❌ No se puede enviar email: SENDGRID_API_KEY no configurado")
            if not self.fail_silently:
                raise ValueError("SENDGRID_API_KEY no configurado")
            return 0
        
        num_sent = 0
        sg = SendGridAPIClient(self.api_key)
        
        for message in email_messages:
            try:
                # Log del intento de envío
                logger.info(f"📤 Preparando email via SendGrid: {message.subject}")
                logger.info(f"   De: {message.from_email}")
                logger.info(f"   Para: {', '.join(message.to)}")
                
                # Construir el mensaje para SendGrid
                from_email = Email(message.from_email)
                to_emails = [To(email) for email in message.to]
                subject = message.subject
                
                # Priorizar HTML si existe, sino usar texto plano
                html_content = None
                plain_text = message.body
                
                # Buscar contenido HTML en alternatives
                if message.alternatives:
                    for content, mimetype in message.alternatives:
                        if mimetype == 'text/html':
                            html_content = content
                            break
                
                # Crear el objeto Mail
                if html_content:
                    # Enviar HTML + texto plano como fallback
                    mail = Mail(
                        from_email=from_email,
                        to_emails=to_emails,
                        subject=subject,
                        plain_text_content=plain_text,
                        html_content=html_content
                    )
                else:
                    # Solo texto plano
                    mail = Mail(
                        from_email=from_email,
                        to_emails=to_emails,
                        subject=subject,
                        plain_text_content=plain_text
                    )
                
                # Enviar el email
                response = sg.send(mail)
                
                # Verificar respuesta
                if response.status_code in [200, 201, 202]:
                    num_sent += 1
                    logger.info(f"✅ Email enviado exitosamente via SendGrid")
                    logger.info(f"   Status Code: {response.status_code}")
                else:
                    logger.error(f"❌ SendGrid error: Status {response.status_code}")
                    logger.error(f"   Body: {response.body}")
                    if not self.fail_silently:
                        raise Exception(f"SendGrid returned {response.status_code}: {response.body}")
            
            except Exception as e:
                logger.error(f"❌ Error enviando email via SendGrid: {str(e)}")
                logger.error(f"   Subject: {message.subject}")
                logger.error(f"   To: {', '.join(message.to)}")
                
                if not self.fail_silently:
                    raise
        
        logger.info(f"📊 Total emails enviados: {num_sent}/{len(email_messages)}")
        return num_sent