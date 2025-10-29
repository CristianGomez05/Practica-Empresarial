# panaderia/settings.py
from pathlib import Path

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
        'rest_framework.permissions.IsAuthenticated',
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
SOCIALACCOUNT_LOGIN_ON_GET = True

LOGIN_REDIRECT_URL = "http://localhost:5173/dashboard"
LOGOUT_REDIRECT_URL = "http://localhost:5173"

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ==========================================
# CONFIGURACIÓN DE EMAIL
# ==========================================

# Para desarrollo: usar console backend (imprime en consola)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Para producción: usar SMTP real (Gmail, SendGrid, etc.)
# Descomenta y configura cuando vayas a producción:

# EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
# EMAIL_HOST = 'smtp.gmail.com'
# EMAIL_PORT = 587
# EMAIL_USE_TLS = True
# EMAIL_HOST_USER = 'tu-email@gmail.com'
# EMAIL_HOST_PASSWORD = 'tu-contraseña-de-aplicación'
# DEFAULT_FROM_EMAIL = 'Panadería Artesanal <tu-email@gmail.com>'

# Para desarrollo (mientras tanto)
DEFAULT_FROM_EMAIL = 'panaderia@localhost'

# Nota: Para usar Gmail en producción necesitas:
# 1. Activar verificación en 2 pasos en tu cuenta de Gmail
# 2. Generar una "contraseña de aplicación" específica
# 3. Usar esa contraseña de aplicación en EMAIL_HOST_PASSWORD
# Más info: https://support.google.com/accounts/answer/185833
