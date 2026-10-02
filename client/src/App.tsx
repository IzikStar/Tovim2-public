import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { BareLayout, Layout } from './components/Layout';
import { EmptyState, Spinner } from './components/ui';
import { DashboardPage } from './pages/DashboardPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { CouplesPage } from './pages/CouplesPage';
import { PoolPage } from './pages/PoolPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProposalsPage } from './pages/ProposalsPage';
import { RegisterSinglePage } from './pages/RegisterSinglePage';
import { RequestsPage } from './pages/RequestsPage';
import { SignupPage } from './pages/SignupPage';
import { SingleDetailPage } from './pages/SingleDetailPage';
import { EditSinglePage, NewSinglePage } from './pages/SingleEditorPage';

function RequireAuth() {
  const { me, signedOut } = useAuth();
  const location = useLocation();
  if (me === undefined) return <Spinner />;
  // After a deliberate logout go home; otherwise (expired session, deep link) ask to log in
  if (!me) return signedOut ? <Navigate to="/" replace /> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** Waits for the stored token check so public pages don't flash the logged-out header. */
function AuthReady() {
  const { me } = useAuth();
  return me === undefined ? <Spinner /> : <Outlet />;
}

function NotFound() {
  return (
    <EmptyState title="העמוד לא נמצא">
      <Link to="/" className="btn btn--primary">
        לדף הבית
      </Link>
    </EmptyState>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<BareLayout />}>
            <Route path="/register/:matchMakerId" element={<RegisterSinglePage />} />
          </Route>
          <Route element={<AuthReady />}>
            <Route element={<Layout />}>
              <Route index element={<LandingPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="signup" element={<SignupPage />} />
              <Route path="pool" element={<PoolPage />} />
              <Route element={<RequireAuth />}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="requests" element={<RequestsPage />} />
                <Route path="proposals" element={<ProposalsPage />} />
                <Route path="couples" element={<CouplesPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="singles/new" element={<NewSinglePage />} />
                <Route path="singles/:id" element={<SingleDetailPage />} />
                <Route path="singles/:id/edit" element={<EditSinglePage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
