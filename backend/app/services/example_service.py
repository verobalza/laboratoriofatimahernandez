"""
Ejemplo de estructura de servicio

Este archivo es una plantilla de cómo estructurar servicios en la aplicación.
Los servicios contienen la lógica de negocio de la aplicación.

Ejemplo de uso:
    from app.services.example_service import ExampleService
    
    service = ExampleService()
    result = service.get_something()
"""


class ExampleService:
    """Servicio de ejemplo para demostrar la estructura."""
    
    def __init__(self):
        """Inicializar el servicio."""
        self.name = "Example Service"
    
    def get_something(self):
        """Obtener algo del servicio."""
        return {"message": f"Hello from {self.name}"}
    
    def process_data(self, data: dict) -> dict:
        """
        Procesar datos.
        
        Args:
            data (dict): Datos a procesar
            
        Returns:
            dict: Datos procesados
        """
        return {"original": data, "processed": True}
