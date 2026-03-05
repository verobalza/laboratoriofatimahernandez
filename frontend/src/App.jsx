import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import MenuPage from './pages/MenuPage'
import RegistroPacientes from './pages/RegistroPacientes'
import FichaPaciente from './pages/FichaPaciente'
import Pruebas from './pages/Pruebas'
import Examenes from './pages/Examenes'
import Facturacion from './pages/Facturacion'
import api from './services/api'

function App() {
  useEffect(() => {
    // Verificar que el backend está disponible
    api.healthCheck().then((res) => {
      console.log("Backend conectado:", res);
    }).catch((err) => {
      console.warn("No se puede conectar al backend:", err.message);
    });
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/registro-pacientes" element={<RegistroPacientes />} />
        <Route path="/ficha-paciente/:id" element={<FichaPaciente />} />
        <Route path="/pruebas" element={<Pruebas />} />
        <Route path="/examenes" element={<Examenes />} />
        <Route path="/facturacion" element={<Facturacion />} />
      </Routes>
    </Router>
  )
}

export default App
