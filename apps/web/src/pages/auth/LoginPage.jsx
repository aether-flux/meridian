import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Terminal, Lock, Mail, ArrowRight, Sparkles } from "lucide-react";
import { Input } from "../../ui/components/Input.jsx";
import { Button } from "../../ui/components/Button.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please provide both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      await login({ email, password });
      setIsLoading(false);
      navigate("/dashboard");
    } catch (requestError) {
      setError(requestError.message || "Unable to sign in. Please try again.");
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail("alex@meridian.dev");
    setPassword("password123");
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#f8f6f3] flex flex-col justify-center items-center px-4 py-12">
      {/* Brand Header */}
      <div className="w-full max-w-sm text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-full bg-[#1a1a1a] flex items-center justify-center font-mono font-bold text-white text-sm">
            M
          </div>
          <span className="text-xl font-bold tracking-tight text-[#1a1a1a]">
            Meridian
          </span>
        </Link>
        <h2 className="text-xl font-bold tracking-tight text-[#1a1a1a]">
          Welcome back
        </h2>
        <p className="text-xs text-[#888] mt-1">
          Sign in to your team workspace
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm bg-white border border-[#e8e5e0] rounded-xl p-6 sm:p-8 shadow-sm">
        {/* Quick Demo Pre-fill Pill */}
        <div className="mb-6 p-3 rounded-lg bg-[#f5f2ef] border border-[#e8e5e0] flex items-center justify-between text-xs text-[#555]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#888]" />
            <span>Developer Review?</span>
          </div>
          <button
            type="button"
            onClick={handleFillDemo}
            className="px-2.5 py-1 rounded-md bg-[#f0ede8] border border-[#e8e5e0] hover:bg-[#e8e5e0] text-[#1a1a1a] font-medium transition-colors"
          >
            Auto-fill Demo
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            label="Work Email"
            type="email"
            placeholder="developer@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            prefix={<Mail className="w-4 h-4 text-[#aaa]" />}
          />

          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            prefix={<Lock className="w-4 h-4 text-[#aaa]" />}
          />

          <Button
            type="submit"
            size="lg"
            className="w-full mt-2"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#e8e5e0] text-center text-xs text-[#888]">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="text-[#1a1a1a] hover:underline font-medium"
          >
            Create an account
          </Link>
        </div>
      </div>

      {/* Terminal CLI note */}
      <div className="mt-8 text-center text-xs text-[#888] flex items-center gap-2">
        <Terminal className="w-3.5 h-3.5" />
        <span>Prefer the terminal? Run </span>
        <code className="text-[#1a1a1a] font-mono bg-[#f0ede8] border border-[#e8e5e0] px-1.5 py-0.5 rounded">
          meridian auth login
        </code>
      </div>
    </div>
  );
}
