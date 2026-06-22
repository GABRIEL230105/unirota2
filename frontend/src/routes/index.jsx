import { Routes, Route, Navigate } from "react-router-dom";
import { Login } from "../pages/Login";
import { Register } from "../pages/Register";
import { Home } from "../pages/Home";
import { ForgotPassword } from "../pages/ForgotPassword";
import { PrivateRoute } from "./PrivateRoute";
import { ResetPassword } from "../pages/ResetPassword";

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Rotas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
      {/* 🔥 CORRETO AQUI */}
      <Route path="/resetar-senha/:token" element={<ResetPassword />} />

      {/* Rotas privadas */}
      <Route element={<PrivateRoute />}>
        <Route path="/home" element={<Home />} />
      </Route>
    </Routes>
  );
};