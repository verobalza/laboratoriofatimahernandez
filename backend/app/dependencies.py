"""
Dependencias globales de la aplicación.
Incluye el cliente de Supabase y funciones auxiliares para JWT y hashing.
"""

import os
from supabase import create_client, Client
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from .config import settings

# Contexto de encriptación de contraseñas
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


# Cliente de Supabase (se inicializa una sola vez)
_supabase_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """
    Cliente de Supabase usando SERVICE_ROLE.
    Este cliente ignora RLS y tiene permisos completos.
    Úsalo solo en el backend.
    """
    global _supabase_client
    
    if _supabase_client is None:
        supabase_url = settings.SUPABASE_URL
        supabase_key = settings.SUPABASE_SERVICE_ROLE  # ← USAMOS SERVICE_ROLE

        print("DEBUG ENV:", settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE)

        if not supabase_url or not supabase_key:
            raise ValueError(
                "SUPABASE_URL y SUPABASE_SERVICE_ROLE deben estar configurados "
                "en el archivo .env"
            )

        _supabase_client = create_client(supabase_url, supabase_key)
    
    return _supabase_client

def hash_password(password: str) -> str:
    """
    Hashea una contraseña usando bcrypt.
    
    Args:
        password: Contraseña en texto plano
        
    Returns:
        Contraseña hasheada
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica una contraseña contra su hash.
    
    Args:
        plain_password: Contraseña en texto plano
        hashed_password: Contraseña hasheada
        
    Returns:
        True si la contraseña es correcta, False en caso contrario
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Crea un JWT token.
    
    Args:
        data: Datos a incluir en el token
        expires_delta: Duración del token (opcional)
        
    Returns:
        Token JWT codificado
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """
    Verifica y decodifica un JWT token.
    
    Args:
        token: Token JWT a verificar
        
    Returns:
        Datos del token si es válido, None en caso contrario
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        

        return payload
    except JWTError:
        return None
