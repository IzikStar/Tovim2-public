import React from "react";
import { NavLink } from "react-router-dom";
import {
  HeartHandshake,
  Home,
  LayoutDashboard,
  Link2,
  LogIn,
  LogOut,
  UserRoundPen,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button, buttonVariants } from "./ui/button";
import { cn } from "../lib/utils";

const navLinkBase =
  "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition";

const Navbar: React.FC = () => {
  const { token, logout, matchMakerId } = useAuth();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex min-h-[72px] w-full max-w-[1480px] flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="rounded-md bg-primary/10 px-3 py-1 text-sm font-bold text-primary md:text-base">
          טובים השניים
        </div>

        {token && (
          <nav className="order-3 flex w-full flex-wrap items-center gap-2 md:order-2 md:w-auto">
            <NavLink
              to="/public"
              className={({ isActive }) =>
                cn(
                  navLinkBase,
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card hover:bg-muted"
                )
              }
            >
              <Home className="h-4 w-4" />
              <span>מאגר ציבורי</span>
            </NavLink>

            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                cn(
                  navLinkBase,
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card hover:bg-muted"
                )
              }
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>המאגר שלי</span>
            </NavLink>

            {matchMakerId && (
              <a
                href={`/single-form/${matchMakerId}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(navLinkBase, "bg-card hover:bg-muted")}
                onClick={() =>
                  navigator.clipboard.writeText(
                    `${window.location.origin}/single-form/${matchMakerId}`
                  )
                }
              >
                <Link2 className="h-4 w-4" />
                <span>טופס סינגל</span>
              </a>
            )}

            <NavLink
              to="/couples"
              className={({ isActive }) =>
                cn(
                  navLinkBase,
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card hover:bg-muted"
                )
              }
            >
              <HeartHandshake className="h-4 w-4" />
              <span>זוגות שחיתנתי</span>
            </NavLink>

            <NavLink
              to="/profile"
              className={({ isActive }) =>
                cn(
                  navLinkBase,
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card hover:bg-muted"
                )
              }
            >
              <UserRoundPen className="h-4 w-4" />
              <span>עריכת פרטים</span>
            </NavLink>
          </nav>
        )}

        <div className="order-2 md:order-3">
          {token ? (
            <Button variant="outline" onClick={logout} className="gap-2">
              <LogOut className="h-4 w-4" />
              התנתק
            </Button>
          ) : (
            <NavLink
              to="/login"
              className={cn(buttonVariants({ variant: "default" }), "gap-2")}
            >
              <LogIn className="h-4 w-4" />
              התחבר
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
