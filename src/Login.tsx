import React, { useState, useEffect } from "react";
import "./Login.css";
import backgroundImage from "./Login.png";

interface LoginProps {
  onLoginSuccess: (role: string, email: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showAccessRequest, setShowAccessRequest] = useState(false);
  const [department, setDepartment] = useState("");
  const [accessEmail, setAccessEmail] = useState("");
  const [accessPassword, setAccessPassword] = useState("");
  const [thankYouMessage, setThankYouMessage] = useState(false);
  const [isPasswordChange, setIsPasswordChange] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowAccessRequest(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogin = async () => {
    const data = { email, password };

    try {
      const response = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        const userRole = result.role;
        const userEmail = result.email;
        onLoginSuccess(userRole, userEmail);
      } else {
        const result = await response.json();
        setError(result.detail || "Erro desconhecido");
      }
    } catch (error) {
      setError("Erro ao fazer login");
    }
  };

  const handleAccessRequest = () => {
    setIsPasswordChange(false);
    setShowAccessRequest(true);
  };

  const handlePasswordChangeRequest = () => {
    setIsPasswordChange(true);
    setShowAccessRequest(true);
  };

  const handleAccessSubmit = async () => {
    const data = {
      categoria: isPasswordChange ? "Mudança de senha" : "Solicitação de Acesso",
      departamento: department,
      email: accessEmail,
      senha: accessPassword,
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/solicitacao-acesso", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setShowAccessRequest(false);
        setThankYouMessage(true);
        setTimeout(() => setThankYouMessage(false), 3000); // Hide the message after 3 seconds
      } else {
        const result = await response.json();
        setError(result.detail || "Erro desconhecido");
      }
    } catch (error) {
      setError("Erro ao enviar solicitação de acesso");
    }
  };

  const handlePopupClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      setShowAccessRequest(false);
    }
  };

  return (
    <div
      className="login-container"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="login-header">
        <h1>CNH Popular</h1>
      </div>
      <div className="login-form">
        <h2>Login</h2>
        {error && <p className="error">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Entrar</button>
        <button onClick={handleAccessRequest}>Solicitação de Acesso</button>
        <button onClick={handlePasswordChangeRequest}>Problemas no Login</button>
      </div>

      {showAccessRequest && (
        <div className="access-request-popup" onClick={handlePopupClick}>
          <div className="popup-content">
            <h3>{isPasswordChange ? "Mudança de senha" : "Solicitação de Acesso"}</h3>
            {!isPasswordChange && (
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="">Selecione o Departamento</option>
                <option value="Nucon">Nucon</option>
                <option value="Dihab">Dihab</option>
              </select>
            )}
            <input
              type="email"
              placeholder="Email"
              value={accessEmail}
              onChange={(e) => setAccessEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Senha"
              value={accessPassword}
              onChange={(e) => setAccessPassword(e.target.value)}
            />
            <button onClick={handleAccessSubmit}>Enviar</button>
          </div>
        </div>
      )}

      {thankYouMessage && (
        <div className="thank-you-message">
          <p>Obrigado!</p>
        </div>
      )}
    </div>
  );
};

export default Login;