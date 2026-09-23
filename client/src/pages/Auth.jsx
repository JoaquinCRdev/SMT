import { useState } from "react";
import Login from "../components/layout/auth/Login";
import Register from "../components/layout/auth/Register";
import "../styles/pages/auth.css";

const Auth = () => {
  const [mode, setMode] = useState("login");

  const goToLogin = () => setMode("login");
  const goToRegister = () => setMode("register");

  return (
    <div id="containerAuth">
      {mode === "login" ? (
        <Login onToggle={goToRegister} />
      ) : (
        <Register onToggle={goToLogin} />
      )}
    </div>
  );
};

export default Auth;