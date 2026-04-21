import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'

import Home from './pages/Home'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'


import RegistroPacientes from './pages/RegistroPacientes'
import FichaPaciente from './pages/FichaPaciente'
import Pruebas from './pages/Pruebas'
import Examenes from './pages/Examenes'
import Facturacion from './pages/Facturacion'
import Inventario from './pages/Inventario'
import RegistroFinanciero from './pages/RegistroFinanciero'
import RolesAdministracion from './pages/RolesAdministracion'

import DashboardLayout from './layouts/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'
import api from './services/api'

function App() {
  useEffect(() => {
    api.healthCheck()
      .then((res) => console.log("Backend conectado:", res))
      .catch((err) => console.warn("No se puede conectar al backend:", err.message))
  }, [])

  return (
    <Router>
      <Routes>

        {/* Rutas públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
       

        {/* Rutas internas con layout */}
        <Route element={<DashboardLayout />}>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/registro-pacientes"
            element={
              <ProtectedRoute permissionKey="registro_pacientes">
                <RegistroPacientes />
              </ProtectedRoute>
            }
          />
          <Route path="/ficha-paciente/:id" element={<ProtectedRoute permissionKey="registro_pacientes"><FichaPaciente /></ProtectedRoute>} />
          <Route
            path="/pruebas"
            element={
              <ProtectedRoute permissionKey="pruebas">
                <Pruebas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/examenes"
            element={
              <ProtectedRoute permissionKey="examenes">
                <Examenes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/facturacion"
            element={
              <ProtectedRoute permissionKey="facturacion">
                <Facturacion />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventario"
            element={
              <ProtectedRoute permissionKey="inventario">
                <Inventario />
              </ProtectedRoute>
            }
          />
          <Route
            path="/registro-financiero"
            element={
              <ProtectedRoute permissionKey="registro_financiero">
                <RegistroFinanciero />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles"
            element={
              <ProtectedRoute permissionKey="roles">
                <RolesAdministracion />
              </ProtectedRoute>
            }
          />
        </Route>

      </Routes>
    </Router>
  )
}

export default App

