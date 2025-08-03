import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Public from "./pages/Public";
import SingleForm from "./pages/SingleForm";

const AppRoutes: React.FC = () => {
  const { token } = useAuth();
  const location = useLocation();
  return (
    <>
      {!location.pathname.startsWith("/single-form") && <Navbar />}
      <Routes>
        <Route
          path="/"
          element={<Navigate to={token ? "/dashboard" : "/login"} replace />}
        />
        <Route
          path="/public"
          element={token ? <Public /> : <Navigate to="/login" replace />}
        />
        <Route path="/single-form/:matchmakerId" element={<SingleForm />} />
        <Route
          path="/login"
          element={token ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route
          path="/dashboard"
          element={token ? <Dashboard /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
