import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar: React.FC = () => {
  const { token, logout } = useAuth();
  return (
    <nav className="navbar">
      {token && (
        <div className="nav-links">
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
