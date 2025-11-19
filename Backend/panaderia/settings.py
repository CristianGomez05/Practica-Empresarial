# Backend/panaderia/settings.py - CONFIGURACIÓN PARA RAILWAY
from pathlib import Path
import os
from decouple import config, Csv
import dj_database_url
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

# ============================================================================
# SEGURIDAD
# ============================================================================
SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='.railway.app,localhost', cast=Csv())

# ============================================================================
# APLICACIONES
# ============================================================================
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'cloudinary_storage',  # Debe estar ANTES de staticfiles
    'cloudinary',           # Cloudinary
    'django.contrib.staticfiles',
    'django.contrib.sites',
    
    # Third Party
    'rest_framework',
    'drf_yasg',
    'rest_framework.authtoken',
    'rest_framework_simplejwt',
    'corsheaders',
    
    # AllAuth
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'dj_rest_auth',
    'dj_rest_auth.registration',
    
    # Local
    'core',
]

SITE_ID = 1

# ============================================================================
# JWT CONFIGURATION
# ============================================================================
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ============================================================================
# REST FRAMEWORK
# ============================================================================
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',
    ),
    'DEFAULT_PARSER_CLASSES': (
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ),
}

# ============================================================================
# MIDDLEWARE
# ============================================================================
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware',
]

ROOT_URLCONF = 'panaderia.urls'

# ============================================================================
# TEMPLATES
# ============================================================================
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

# ============================================================================
# DATABASE (Railway PostgreSQL)
# ============================================================================
DATABASE_URL = config('DATABASE_URL', default=None)

if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
            ssl_require=True  # Railway requiere SSL
        )
    }
    print("✅ Usando PostgreSQL de Railway")
else:
    # Fallback para desarrollo local
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': config('DB_NAME', default='panaderia_db'),
            'USER': config('DB_USER', default='postgres'),
            'PASSWORD': config('DB_PASSWORD', default='admin123'),
            'HOST': config('DB_HOST', default='localhost'),
            'PORT': config('DB_PORT', default='5432'),
        }
    }
    print("✅ Usando PostgreSQL Local")

# ============================================================================
# PASSWORD VALIDATION
# ============================================================================
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ============================================================================
# AUTHENTICATION
# ============================================================================
AUTHENTICATION_BACKENDS = (
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
)

AUTH_USER_MODEL = 'core.Usuario'

# ============================================================================
# CORS CONFIGURATION
# ============================================================================
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173')

if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
    print("⚠️ CORS: Permitiendo todos los orígenes (DEBUG=True)")
else:
    CORS_ALLOWED_ORIGINS = config(
        'CORS_ALLOWED_ORIGINS', 
        default='http://localhost:5173', 
        cast=Csv()
    )
    print(f"✅ CORS configurado para: {CORS_ALLOWED_ORIGINS}")

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# ============================================================================
# CSRF CONFIGURATION
# ============================================================================
CSRF_TRUSTED_ORIGINS = config(
    'CSRF_TRUSTED_ORIGINS', 
    default='http://localhost:5173', 
    cast=Csv()
)

# ============================================================================
# STATIC FILES
# ============================================================================
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# ============================================================================
# CLOUDINARY CONFIGURATION (OBLIGATORIO PARA RAILWAY)
# ============================================================================
USE_CLOUDINARY = config('USE_CLOUDINARY', default=True, cast=bool)

if USE_CLOUDINARY:
    import cloudinary
    import cloudinary.uploader
    import cloudinary.api

    # ✅ CORRECTO - Lee desde .env
    CLOUDINARY_CLOUD_NAME = config('CLOUDINARY_CLOUD_NAME')
    CLOUDINARY_API_KEY = config('CLOUDINARY_API_KEY')
    CLOUDINARY_API_SECRET = config('CLOUDINARY_API_SECRET')

    cloudinary.config(
        cloud_name=CLOUDINARY_CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET,
        secure=True
    )

    # Configurar Cloudinary como storage por defecto
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
    MEDIA_URL = '/media/'
    
    # Configuración de tamaño máximo de archivos (5MB)
    DATA_UPLOAD_MAX_MEMORY_SIZE = 5242880
    FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880

    print(f"\n{'='*60}")
    print(f"☁️  CLOUDINARY CONFIGURADO")
    print(f"   Cloud Name: {CLOUDINARY_CLOUD_NAME}")
    print(f"   Storage: {DEFAULT_FILE_STORAGE}")
    print(f"{'='*60}\n")

# ============================================================================
# CLOUDINARY STORAGE SETTINGS
# ============================================================================
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': CLOUDINARY_CLOUD_NAME,
    'API_KEY': CLOUDINARY_API_KEY,
    'API_SECRET': CLOUDINARY_API_SECRET,
    'SECURE': True,
}

# ============================================================================
# ALLAUTH & SOCIAL AUTH
# ============================================================================
ACCOUNT_ADAPTER = "core.adapters.FrontendRedirectAccountAdapter"
SOCIALACCOUNT_ADAPTER = "core.adapters.CustomSocialAccountAdapter"
SOCIALACCOUNT_LOGIN_ON_GET = True
SOCIALACCOUNT_AUTO_SIGNUP = True
ACCOUNT_EMAIL_REQUIRED = True
SOCIALACCOUNT_QUERY_EMAIL = True

LOGIN_REDIRECT_URL = f"{FRONTEND_URL}/dashboard"
LOGOUT_REDIRECT_URL = FRONTEND_URL

# ============================================================================
# EMAIL CONFIGURATION
# ============================================================================
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_USE_SSL = False
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = f'Panadería Santa Clara <{EMAIL_HOST_USER}>'
SERVER_EMAIL = EMAIL_HOST_USER
EMAIL_TIMEOUT = 10  # ⭐ Reducir timeout a 10 segundos

# ⭐ Determinar backend según configuración
if EMAIL_HOST_USER and EMAIL_HOST_PASSWORD:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    print(f"✅ EMAIL: SMTP configurado ({EMAIL_HOST_USER})")
else:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
    print("⚠️ EMAIL: Usando console backend (sin credenciales)")

# ============================================================================
# LOGGING
# ============================================================================
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': config('DJANGO_LOG_LEVEL', default='INFO'),
            'propagate': False,
        },
        'cloudinary': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}

# ============================================================================
# SEGURIDAD EN PRODUCCIÓN
# ============================================================================
if not DEBUG:
    # Railway específico
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = False  # Railway maneja SSL
    
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    
    print("✅ Configuración de seguridad en producción activada")

# ============================================================================
# INTERNACIONALIZACIÓN
# ============================================================================
LANGUAGE_CODE = 'es'
TIME_ZONE = 'America/Costa_Rica'
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ============================================================================
# RESUMEN DE CONFIGURACIÓN
# ============================================================================
print(f"\n{'='*60}")
print(f"🚀 MODO: {'DESARROLLO' if DEBUG else 'PRODUCCIÓN'}")
print(f"☁️  Cloudinary: {CLOUDINARY_CLOUD_NAME}")
print(f"📧 Email: {EMAIL_HOST_USER}")
print(f"🌐 Frontend: {FRONTEND_URL}")
print(f"🗄️  Database: {'Railway PostgreSQL' if DATABASE_URL else 'PostgreSQL Local'}")
print(f"{'='*60}\n")