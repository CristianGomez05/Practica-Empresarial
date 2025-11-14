# panaderia/settings.py
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = 'django-insecure-(i1*wc&ymgx0xmea-%031v6&irm1-km%(2zg)7wof5z(m##_07'
DEBUG = True
ALLOWED_HOSTS = []

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',

    # REST & Auth
    'rest_framework',
    'drf_yasg',
    'rest_framework.authtoken',
    'rest_framework_simplejwt',
    'corsheaders',

    # Social Auth
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',

    # REST Auth
    'dj_rest_auth',
    'dj_rest_auth.registration',

    # App principal
    'core',
]

SITE_ID = 1

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',
    ),
}

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware',
]

ROOT_URLCONF = 'panaderia.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'panaderia.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'panaderia_db',
        'USER': 'postgres',
        'PASSWORD': 'admin123',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

AUTHENTICATION_BACKENDS = (
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
)

AUTH_USER_MODEL = 'core.Usuario'

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
CORS_ALLOW_CREDENTIALS = True

ACCOUNT_ADAPTER = "core.adapters.FrontendRedirectAccountAdapter"
SOCIALACCOUNT_ADAPTER = "core.adapters.CustomSocialAccountAdapter"
SOCIALACCOUNT_LOGIN_ON_GET = True

SOCIALACCOUNT_AUTO_SIGNUP = True
ACCOUNT_EMAIL_REQUIRED = True
SOCIALACCOUNT_QUERY_EMAIL = True

LOGIN_REDIRECT_URL = "http://localhost:5173/dashboard"
LOGOUT_REDIRECT_URL = "http://localhost:5173"

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# ==========================================
# CONFIGURACIÓN DE EMAIL
# ==========================================

# Para desarrollo: descomenta esta línea para ver emails en consola
# EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Para producción con Gmail (RECOMENDADO)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_USE_SSL = False

# ⭐ IMPORTANTE: Usar variables de entorno o configurar directamente
# Opción 1: Variables de entorno (MÁS SEGURO)
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', 'panaderiasantaclara01@gmail.com')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', 'xzxk wtra ajnq wlja')

# Opción 2: Configuración directa (para pruebas rápidas)
# EMAIL_HOST_USER = 'tu-email@gmail.com'
# EMAIL_HOST_PASSWORD = 'xxxx xxxx xxxx xxxx'  # Contraseña de aplicación de 16 dígitos

DEFAULT_FROM_EMAIL = f'Panadería Artesanal <{EMAIL_HOST_USER}>'
SERVER_EMAIL = EMAIL_HOST_USER

# Configuración adicional para debugging
EMAIL_TIMEOUT = 30  # Timeout en segundos

# ==========================================
# ALTERNATIVA: Configuración para Outlook/Hotmail
# ==========================================
# Descomenta estas líneas si usas Outlook en lugar de Gmail:

# EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
# EMAIL_HOST = 'smtp-mail.outlook.com'
# EMAIL_PORT = 587
# EMAIL_USE_TLS = True
# EMAIL_USE_SSL = False
# EMAIL_HOST_USER = 'tu-email@outlook.com'
# EMAIL_HOST_PASSWORD = 'tu-contraseña'  # Contraseña normal de Outlook
# DEFAULT_FROM_EMAIL = f'Panadería Artesanal <{EMAIL_HOST_USER}>'

print(f"\n{'='*60}")
print(f"📧 CONFIGURACIÓN DE EMAIL")
print(f"{'='*60}")
print(f"Backend: {EMAIL_BACKEND}")
print(f"Host: {EMAIL_HOST}")
print(f"Port: {EMAIL_PORT}")
print(f"Usuario: {EMAIL_HOST_USER}")
print(f"From Email: {DEFAULT_FROM_EMAIL}")
print(f"{'='*60}\n")

# URL del frontend para enlaces en correos
FRONTEND_URL = 'http://localhost:5173'