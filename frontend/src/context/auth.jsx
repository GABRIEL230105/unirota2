import { createContext, useEffect, useState } from "react";
import { api } from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storagedUser = localStorage.getItem("@Auth:user");
    const storagedToken = localStorage.getItem("@Auth:token");

    if (storagedUser && storagedToken) {
      setUser(JSON.parse(storagedUser));
      api.defaults.headers.common["Authorization"] = `Bearer ${storagedToken}`;
    }
  }, []);

  // LOGIN
  const signIn = async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token } = response.data;

      localStorage.setItem("@Auth:token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      const me = await api.get("/users/me");

      setUser(me.data);
      localStorage.setItem("@Auth:user", JSON.stringify(me.data));

      return true;
    } catch (error) {
      console.error("Erro no login:", error.response?.data);
      return false;
    }
  };

  // CADASTRO
  // dadosCadastro: { name, email, password, course, shift, vehicleModel?, vehicleColor?, plate? }
  const signUp = async (dadosCadastro) => {
    try {
      await api.post("/auth/register", {
        name: dadosCadastro.name,
        email: dadosCadastro.email,
        password: dadosCadastro.password,
        course: dadosCadastro.course,
        shift: dadosCadastro.shift,
        bio: "",
        vehicleModel: dadosCadastro.vehicleModel || undefined,
        vehicleColor: dadosCadastro.vehicleColor || undefined,
        plate: dadosCadastro.plate || undefined,
      });

      return true;
    } catch (error) {
      console.error("Erro no cadastro:", error.response?.data);
      return false;
    }
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("@Auth:user");
    localStorage.removeItem("@Auth:token");
    setUser(null);
    delete api.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
};