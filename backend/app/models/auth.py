"""
Modelos Pydantic para autenticación.
Define los esquemas de request y response para login y registro.
"""

from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from uuid import UUID
from datetime import datetime
import re


class PasswordValidator:
    """Validador de contraseñas con reglas de complejidad."""
    
    MIN_LENGTH = 8
    REQUIRE_UPPERCASE = True
    REQUIRE_PUNCTUATION = True
    
    @staticmethod
    def validate(password: str) -> bool:
        """
        Valida que la contraseña cumpla con los requisitos.
        
        Requisitos:
        - Mínimo 8 caracteres
        - Al menos 1 mayúscula
        - Al menos 1 signo de puntuación
        """
        if len(password) < PasswordValidator.MIN_LENGTH:
            return False
        
        if PasswordValidator.REQUIRE_UPPERCASE and not any(c.isupper() for c in password):
            return False
        
        if PasswordValidator.REQUIRE_PUNCTUATION:
            punctuation_pattern = r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]"
            if not re.search(punctuation_pattern, password):
                return False
        
        return True
    
    @staticmethod
    def get_error_message(password: str) -> Optional[str]:
        """Devuelve un mensaje de error si la contraseña no es válida."""
        if len(password) < PasswordValidator.MIN_LENGTH:
            return f"La contraseña debe tener al menos {PasswordValidator.MIN_LENGTH} caracteres"
        
        if PasswordValidator.REQUIRE_UPPERCASE and not any(c.isupper() for c in password):
            return "La contraseña debe contener al menos 1 mayúscula"
        
        if PasswordValidator.REQUIRE_PUNCTUATION:
            punctuation_pattern = r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]"
            if not re.search(punctuation_pattern, password):
                return "La contraseña debe contener al menos 1 signo de puntuación (!@#$%^&*()_+-=[]{}';:\"\\|,.<>/?)"
        
        return None


class RegisterRequest(BaseModel):
    """Modelo para la solicitud de registro."""
    nombre: str
    apellido: str
    email: EmailStr
    password: str
    
    @field_validator("nombre", "apellido")
    @classmethod
    def validate_name_fields(cls, v: str) -> str:
        """Valida que nombre y apellido no estén vacíos."""
        if not v or not v.strip():
            raise ValueError("El campo no puede estar vacío")
        if len(v) < 2:
            raise ValueError("Debe tener al menos 2 caracteres")
        if len(v) > 100:
            raise ValueError("Debe tener máximo 100 caracteres")
        return v.strip()
    
    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Valida la complejidad de la contraseña."""
        error = PasswordValidator.get_error_message(v)
        if error:
            raise ValueError(error)
        return v


class LoginRequest(BaseModel):
    """Modelo para la solicitud de login."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Modelo para la respuesta de usuario (sin contraseña)."""
    id: str
    nombre: str
    apellido: str
    email: str
    creado_en: str


class LoginResponse(BaseModel):
    """Modelo para la respuesta de login."""
    access_token: str
    token_type: str
    user: UserResponse


class RegisterResponse(BaseModel):
    """Modelo para la respuesta de registro."""
    message: str
    user: UserResponse


class ErrorResponse(BaseModel):
    """Modelo para respuestas de error."""
    detail: str
