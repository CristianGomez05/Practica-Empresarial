# panaderia/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from core.views import home  

# Swagger configuration
schema_view = get_schema_view(
    openapi.Info(
        title="Panadería Santa Clara API",
        default_version='v1',
        description="API para gestión de panadería",
        contact=openapi.Contact(email="contacto@santaclara.com"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    # Página de inicio
    path('', home, name='home'),

    # Admin panel
    path('admin/', admin.site.urls),
    
    # API Documentation (Swagger)
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
    # API endpoints (core app)
    path('api/', include('core.urls')),
    
    # Authentication (Google OAuth)
    path('accounts/', include('allauth.urls')),
]

# Servir archivos media en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)