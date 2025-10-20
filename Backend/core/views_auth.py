from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

class LoginView(APIView):
    """
    Endpoint para autenticación tradicional con usuario y contraseña.
    Retorna tokens JWT si las credenciales son correctas.
    """
    authentication_classes = []  # Evita requerir autenticación previa
    permission_classes = []      # Abierto para todos

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {'error': 'Usuario y contraseña son obligatorios.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(username=username, password=password)

        if user is None:
            return Response(
                {'error': 'Credenciales inválidas.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'username': user.username,
            'id': user.id,
            'rol': getattr(user, 'rol', 'cliente')
        }, status=status.HTTP_200_OK)
