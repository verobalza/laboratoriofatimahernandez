"""
Utilidades y funciones auxiliares

Este módulo contiene funciones auxiliares reutilizables.

Ejemplo de uso:
    from app.utils.helpers import format_response
    
    result = format_response(data={"key": "value"}, success=True)
"""


def format_response(data=None, success=True, message=""):
    """
    Dar formato estándar a las respuestas de API.
    
    Args:
        data: Los datos a retornar
        success: Si la operación fue exitosa
        message: Mensaje adicional (opcional)
        
    Returns:
        dict: Respuesta formateada
        
    Ejemplo:
        response = format_response(data={"id": 1}, success=True)
        # {"success": True, "data": {"id": 1}, "message": ""}
    """
    return {
        "success": success,
        "data": data,
        "message": message
    }


def handle_error(error: Exception):
    """
    Manejar errores de manera consistente.
    
    Args:
        error: La excepción a manejar
        
    Returns:
        dict: Error Response
    """
    return {
        "success": False,
        "data": None,
        "message": str(error)
    }
