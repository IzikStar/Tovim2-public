import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Navbar.module.css"; // ייבוא CSS Module

// אייקונים פשוטים כ-SVG
const HomeIcon = () => (
  <svg
    className={styles.navIcon}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

const DashboardIcon = () => (
  <svg
    className={styles.navIcon}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

const LogoutIcon = () => (
  <svg
    className={styles.logoutIcon}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
);

const Navbar: React.FC = () => {
  const { token, logout } = useAuth();

  return (
    <nav className={styles.navbar}>
      {/* לוגו/מותג */}
      <div className={styles.navbarBrand}>טובים השניים</div>

      {/* קישורי ניווט */}
      {token && (
        <div className={styles.navLinks}>
          <NavLink
            to="/public"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
            }
          >
            <HomeIcon />
            <span>מאגר ציבורי</span>
          </NavLink>

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
            }
          >
            <DashboardIcon />
            <span>המאגר שלי</span>
          </NavLink>
        </div>
      )}

      {/* אזור התחברות */}
      <div className={styles.authSection}>
        {token ? (
          <button onClick={logout} className={styles.logoutBtn}>
            <LogoutIcon />
            <span>התנתק</span>
          </button>
        ) : (
          <NavLink to="/login" className={styles.loginBtn}>
            התחבר
          </NavLink>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
