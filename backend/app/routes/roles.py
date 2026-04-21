"""
Rutas para administración de roles y permisos.
"""

from fastapi import APIRouter, HTTPException, status, Header
from typing import Optional
from uuid import UUID

from ..dependencies import get_supabase_client, verify_token
from ..models.roles import PermissionsResponse, PermissionRequest, RoleUserResponse


APARTADOS = [
    'registro_pacientes',
    'pruebas',
    'examenes',
    'facturacion',
    'registro_financiero',
    'inventario',
    'roles'
]
MASTER_EMAIL = 'veronicabalza19@gmail.com'

router = APIRouter(prefix='/roles', tags=['roles'])


def _normalize_permissions(raw: Optional[dict]) -> dict:
    if raw is None:
        raw = {}
    return {apartado: bool(raw.get(apartado, False)) for apartado in APARTADOS}


def _get_authenticated_user(authorization: Optional[str]):
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Token no proporcionado')

    if not authorization.startswith('Bearer '):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Formato de token inválido. Use: Authorization: Bearer <token>')

    token = authorization.replace('Bearer ', '')
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Token inválido')

    user_id = payload.get('sub')
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Token inválido')

    supabase = get_supabase_client()
    response = supabase.table('usuarios').select('*').eq('id', user_id).execute()
    if not response.data or len(response.data) == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Usuario no encontrado')

    return response.data[0]


def _get_user_permissions(usuario_id: str, supabase):
    response = supabase.table('roles_usuarios').select('apartado, permiso').eq('usuario_id', usuario_id).execute()
    if response.data is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Error al leer permisos del usuario')

    raw_permissions = {item['apartado']: item['permiso'] for item in (response.data or [])}
    return _normalize_permissions(raw_permissions)


def _assert_roles_admin(caller, supabase):
    caller_email = str(caller.get('email', '')).lower()
    if caller_email == MASTER_EMAIL:
        return

    permisos = _get_user_permissions(str(caller['id']), supabase)
    if not permisos.get('roles', False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Acceso denegado')


@router.get('/me', response_model=PermissionsResponse)
async def get_my_permissions(authorization: Optional[str] = Header(None)):
    user = _get_authenticated_user(authorization)
    if str(user.get('email', '')).lower() == MASTER_EMAIL:
        return PermissionsResponse(permissions={apartado: True for apartado in APARTADOS})

    supabase = get_supabase_client()
    return PermissionsResponse(permissions=_get_user_permissions(str(user['id']), supabase))


@router.get('/users', response_model=list[RoleUserResponse])
async def get_role_users(authorization: Optional[str] = Header(None)):
    caller = _get_authenticated_user(authorization)
    supabase = get_supabase_client()
    _assert_roles_admin(caller, supabase)

    response = supabase.table('usuarios').select('id, nombre, apellido, email').order('nombre', desc=False).execute()
    if response.data is None:
        raise HTTPException(status_code=500, detail="Error al obtener datos")

    return [RoleUserResponse(**user) for user in (response.data or [])]


@router.get('/{user_id}/permissions', response_model=PermissionsResponse)
async def get_permissions_for_user(user_id: UUID, authorization: Optional[str] = Header(None)):
    caller = _get_authenticated_user(authorization)
    supabase = get_supabase_client()
    _assert_roles_admin(caller, supabase)

    target_user = supabase.table('usuarios').select('id, email').eq('id', str(user_id)).execute()
    if not target_user.data or len(target_user.data) == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Usuario no encontrado')

    target_email = str(target_user.data[0].get('email', '')).lower()
    if target_email == MASTER_EMAIL:
        return PermissionsResponse(permissions={apartado: True for apartado in APARTADOS})

    return PermissionsResponse(permissions=_get_user_permissions(str(user_id), supabase))


@router.post('/{user_id}/permissions', response_model=PermissionsResponse)
async def save_permissions_for_user(user_id: UUID, request: PermissionRequest, authorization: Optional[str] = Header(None)):
    caller = _get_authenticated_user(authorization)
    supabase = get_supabase_client()
    _assert_roles_admin(caller, supabase)

    target_user = supabase.table('usuarios').select('id, email').eq('id', str(user_id)).execute()
    if not target_user.data or len(target_user.data) == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Usuario no encontrado')

    permissions = _normalize_permissions(request.permissions)
    delete_response = supabase.table('roles_usuarios').delete().eq('usuario_id', str(user_id)).execute()
    if delete_response.data is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Error al borrar permisos anteriores')

    insert_rows = [
        {
            'usuario_id': str(user_id),
            'apartado': apartado,
            'permiso': permissions.get(apartado, False)
        }
        for apartado in APARTADOS
    ]

    insert_response = supabase.table('roles_usuarios').insert(insert_rows).execute()
    if insert_response.data is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Error al guardar permisos')

    return PermissionsResponse(permissions=permissions)


@router.delete('/{user_id}')
async def delete_user(user_id: UUID, authorization: Optional[str] = Header(None)):
    caller = _get_authenticated_user(authorization)
    supabase = get_supabase_client()
    _assert_roles_admin(caller, supabase)

    # Obtener información del usuario a borrar
    target_user = supabase.table('usuarios').select('id, email').eq('id', str(user_id)).execute()
    if not target_user.data or len(target_user.data) == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Usuario no encontrado')

    target_email = str(target_user.data[0].get('email', '')).lower()

    # No permitir borrar al master
    if target_email == MASTER_EMAIL:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='No puedes eliminar al usuario master.')

    # No permitir borrar al usuario actual
    if str(caller['id']) == str(user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='No puedes eliminar tu propio usuario.')

    # Primero borrar los permisos del usuario
    delete_perms_response = supabase.table('roles_usuarios').delete().eq('usuario_id', str(user_id)).execute()
    if delete_perms_response.data is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Error al eliminar permisos del usuario')

    # Luego borrar el usuario
    delete_user_response = supabase.table('usuarios').delete().eq('id', str(user_id)).execute()
    if delete_user_response.data is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Error al eliminar usuario')

    return {'status': 'ok', 'message': 'Usuario eliminado correctamente'}
