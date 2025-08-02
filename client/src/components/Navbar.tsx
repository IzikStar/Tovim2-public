import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { token, logout } = useAuth();
  return (
    <nav style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
      <Link to="/public">Public</Link>
      {token && <Link to="/dashboard">Dashboard</Link>}
      {token ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <Link to="/login">Login</Link>
      )}
    </nav>
  );
};

export default Navbar;
