import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { logout } = useAuth();
  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <span>Matchmaker Dashboard</span>
      <button onClick={logout}>Logout</button>
    </nav>
  );
};

export default Navbar;
