import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar: React.FC = () => {
  const { token, logout } = useAuth();
  return (
    <nav style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
      {token && (
        <div>
          <Link to="/public">Public</Link>
          <Link to="/dashboard">Dashboard</Link>
        </div>
      )}
      {token ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <Link to="/login">Login</Link>
      )}
    </nav>
  );
};

export default Navbar;
