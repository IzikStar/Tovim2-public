import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LockKeyhole, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import apiService from "../services/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const data = await apiService.login(email, password);
      login(data.token, data.matchMakerId);
      navigate("/dashboard");
    } catch {
      setError("התחברות נכשלה");
    }
  };

  return (
    <div className="page-shell flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <Card className="w-full max-w-md border-border/70 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">כניסה למערכת</CardTitle>
          <CardDescription>התחבר כדי לצפות במאגרים ולנהל התאמות</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full">
              התחבר
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
