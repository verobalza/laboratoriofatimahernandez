"""
Router de autenticación.
Contiene los endpoints para login y registro.
"""

from fastapi import APIRouter, HTTPException, status, Depends, Header
from datetime import timedelta
from typing import Optional
from ..dependencies import (
    get_supabase_client,
    hash_password,
    verify_password,
    create_access_token,
    verify_token,
)
from ..models.auth import (
    RegisterRequest,
    LoginRequest,
    LoginResponse,
    RegisterResponse,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest):
    """
    Endpoint de registro.
    
    Crea un nuevo usuario en Supabase:
    1. Verifica que el email no exista
    2. Hashea la contraseña
    3. Inserta el usuario en la tabla `usuarios`
    
    Args:
        request: Datos de registro (nombre, apellido, email, password)
        
    Returns:
        RegisterResponse con acceso al usuario creado
        
    Raises:
        HTTPException: Si el email ya existe o hay error en la base de datos
    """
    try:
        supabase = get_supabase_client()
        
        # Verificar si el email ya existe
        try:
            existing_user = supabase.table("usuarios").select("id").eq("email", request.email).execute()
            
            if existing_user.data and len(existing_user.data) > 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El correo electrónico ya está registrado"
                )
        except Exception as e:
            if "already registered" not in str(e).lower():
                print(f"Error verificando email: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error al verificar el correo"
                )
        
        # Hashear contraseña
        hashed_password = hash_password(request.password)
        
        # Insertar usuario
        try:
            response = supabase.table("usuarios").insert({
                "nombre": request.nombre.strip(),
                "apellido": request.apellido.strip(),
                "email": request.email.lower().strip(),
                "password_hash": hashed_password,
            }).execute()
            
            if not response.data or len(response.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error al crear el usuario en la base de datos"
                )
            
            user_data = response.data[0]
            
            user_response = UserResponse(
                id=str(user_data["id"]),
                nombre=user_data["nombre"],
                apellido=user_data["apellido"],
                email=user_data["email"],
                creado_en=str(user_data["creado_en"]) if user_data.get("creado_en") else ""
            )
            
            return RegisterResponse(
                message="Usuario registrado con éxito",
                user=user_response
            )
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error insertando usuario: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al crear el usuario: {str(e)}"
            )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error general en registro: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al registrar el usuario"
        )


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Endpoint de login.
    
    Autentica al usuario:
    1. Busca el usuario por email
    2. Verifica la contraseña
    3. Genera un JWT token
    
    Args:
        request: Datos de login (email, password)
        
    Returns:
        LoginResponse con access_token y datos del usuario
        
    Raises:
        HTTPException: Si las credenciales son inválidas
    """
    try:
        supabase = get_supabase_client()
        
        # Buscar usuario por email
        try:
            response = supabase.table("usuarios").select("*").eq("email", request.email.lower().strip()).execute()
        except Exception as e:
            print(f"Error buscando usuario: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al acceder a la base de datos"
            )
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas"
            )
        
        user_data = response.data[0]
        
        # Verificar contraseña
        if not verify_password(request.password, user_data["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas"
            )
        
        # Crear JWT token
        access_token = create_access_token(
            data={"sub": str(user_data["id"]), "email": user_data["email"]},
            expires_delta=timedelta(hours=24)
        )
        
        user_response = UserResponse(
            id=str(user_data["id"]),
            nombre=user_data["nombre"],
            apellido=user_data["apellido"],
            email=user_data["email"],
            creado_en=str(user_data["creado_en"]) if user_data.get("creado_en") else ""
        )
        
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error en login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al iniciar sesión"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user(authorization: str = Header(None)):
    """
    Obtiene la información del usuario autenticado.
    Requiere un token JWT válido en header Authorization.
    
    Args:
        authorization: Header Authorization con formato "Bearer <token>"
        
    Returns:
        UserResponse con datos del usuario
        
    Raises:
        HTTPException: Si el token es inválido o no existe el usuario
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token no proporcionado"
        )
    
    try:
        # Extraer token del header "Bearer <token>"
        if not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Formato de token inválido. Use: Authorization: Bearer <token>"
            )
        
        token = authorization.replace("Bearer ", "")
        
        payload = verify_token(token)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )
        
        supabase = get_supabase_client()
        response = supabase.table("usuarios").select("*").eq("id", user_id).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        user_data = response.data[0]
        
        return UserResponse(
            id=str(user_data["id"]),
            nombre=user_data["nombre"],
            apellido=user_data["apellido"],
            email=user_data["email"],
            creado_en=str(user_data["creado_en"]) if user_data.get("creado_en") else ""
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en /auth/me: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Error al obtener información del usuario"
        )
