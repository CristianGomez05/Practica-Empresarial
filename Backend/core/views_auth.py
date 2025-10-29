# Backend/core/views_auth.py
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny

class LoginView(APIView):
    """
    Endpoint personalizado para login con usuario y contraseña.
    POST /core/auth/login/
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        # Validar que se enviaron los campos
        if not username or not password:
            return Response({
                'error': 'Usuario y contraseña son obligatorios.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Autenticar usuario
        user = authenticate(username=username, password=password)

        if user is None:
            return Response({
                'error': 'Credenciales inválidas.'
            }, status=status.HTTP_401_UNAUTHORIZED)

        # Verificar que el usuario esté activo
        if not user.is_active:
            return Response({
                'error': 'Usuario inactivo.'
            }, status=status.HTTP_403_FORBIDDEN)

        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'rol': user.rol,
                'first_name': user.first_name,
                'last_name': user.last_name
            }
        }, status=status.HTTP_200_OK)