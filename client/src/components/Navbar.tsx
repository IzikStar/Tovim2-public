import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar: React.FC = () => {
  const { token, logout } = useAuth();
  return (
    <nav className="navbar">
      {token && (
        <div className="nav-links">
          <Link to="/public">ציבורי</Link>
          <Link to="/dashboard">דשבורד</Link>
        </div>
      )}
      {token ? (
        <button onClick={logout}>התנתק</button>
      ) : (
        <Link to="/login">התחבר</Link>
      )}
    </nav>
  );
};

export default Navbar;
