import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiService from "../services/api";
import styles from "./Login.module.css";

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const data = await apiService.login(email, password);
      login(data.token, data.matchMakerId);
      navigate("/dashboard");
    } catch {
      setError("התחברות נכשלה");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.loginForm}>
      {error && <div className={styles.error}>{error}</div>}
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="אימייל"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="סיסמה"
      />
      <button type="submit">התחבר</button>
    </form>
  );
};

export default Login;
