"""
Modelos Pydantic para la gestión de roles y permisos.
"""

from pydantic import BaseModel
from typing import Dict, List


class PermissionRequest(BaseModel):
    permissions: Dict[str, bool]


class PermissionsResponse(BaseModel):
    permissions: Dict[str, bool]


class RoleUserResponse(BaseModel):
    id: str
    nombre: str
    apellido: str
    email: str


class UserPermissionResponse(BaseModel):
    id: str
    nombre: str
    apellido: str
    email: str
    permisos: Dict[str, bool]
