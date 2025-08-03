import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Public from "./pages/Public";
import SingleForm from "./pages/SingleForm";

const SingleFormRoute: React.FC = () => {
  const { matchmakerId } = useParams();
  return matchmakerId ? (
    <SingleForm matchmakerId={matchmakerId} />
  ) : (
    <div>
      מצטערים, אי אפשר להירשם מקישור זה, יש ליצור קשר עם אחד השדכנים שלנו...
    </div>
  );
};

const AppRoutes: React.FC = () => {
  const { token } = useAuth();
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={token ? "/dashboard" : "/login"} replace />}
      />
      <Route
        path="/public"
        element={token ? <Public /> : <Navigate to="/login" replace />}
      />
      <Route path="/single-form/:matchmakerId" element={<SingleFormRoute />} />
      <Route
        path="/login"
        element={token ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/dashboard"
        element={token ? <Dashboard /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
