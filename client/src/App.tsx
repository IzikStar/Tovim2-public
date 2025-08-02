import Login from './pages/Login';
import MatchmakerDashboard from './pages/MatchmakerDashboard';
import PublicDatabase from './pages/PublicDatabase';
import SingleForm from './pages/SingleForm';

function App() {
  const path = window.location.pathname;

  if (path.startsWith('/dashboard/')) {
    const id = path.split('/')[2];
    return <MatchmakerDashboard matchmakerId={id} />;
  }

  if (path.startsWith('/public')) {
    return <PublicDatabase />;
  }

  if (path.startsWith('/single-form/')) {
    const id = path.split('/')[2];
    return <SingleForm matchmakerId={id} />;
  }

  return <Login />;
}

export default App;
