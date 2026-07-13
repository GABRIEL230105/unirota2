import { Routes, Route, Navigate } from "react-router-dom";
import { Login } from "../pages/Login";
import { Register } from "../pages/Register";
import Home from "../pages/Home";
import { ForgotPassword } from "../pages/ForgotPassword";
import { ResetPassword } from "../pages/ResetPassword";
import { PrivateRoute } from "./PrivateRoute";


// Novas páginas
import OferecerCarona from "../pages/OferecerCarona";
import PedirCarona from "../pages/PedirCarona";
import MeuVeiculo from "../pages/MeuVeiculo";

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Rotas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/resetar-senha/:token" element={<ResetPassword />} />

      {/* Rotas privadas */}
      <Route element={<PrivateRoute />}>
        <Route path="/home" element={<Home />} />
        <Route path="/oferecer-carona" element={<OferecerCarona />} />
        <Route path="/pedir-carona" element={<PedirCarona />} />
        <Route path="/meu-veiculo" element={<MeuVeiculo />} />
      </Route>
    </Routes>
  );
};