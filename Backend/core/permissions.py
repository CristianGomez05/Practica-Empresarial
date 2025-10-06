from rest_framework import permissions


class EsAdministrador(permissions.BasePermission):
    """
    Permite acceso total solo a los usuarios con rol 'administrador'.
    Los demás solo pueden realizar operaciones de lectura (GET).
    """

    def has_permission(self, request, view):
        # Permitir siempre lecturas (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return True
        # Solo administradores pueden crear/modificar/eliminar
        return request.user.is_authenticated and request.user.rol == 'administrador'


class EsClienteOAdmin(permissions.BasePermission):
    """
    Los clientes pueden ver y crear pedidos propios.
    Los administradores pueden ver todos los pedidos.
    """

    def has_object_permission(self, request, view, obj):
        # Administradores pueden hacer todo
        if request.user.rol == 'administrador':
            return True
        # Clientes solo pueden acceder a sus propios pedidos
        return obj.usuario == request.user
