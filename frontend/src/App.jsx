import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import MenuPage from './pages/MenuPage'
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
      </Routes>
    </Router>
  )
}

export default App
