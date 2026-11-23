import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Terminal, Lock, Mail, User, ArrowRight } from "lucide-react";
import { Input } from "../../ui/components/Input.jsx";
import { Button } from "../../ui/components/Button.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!displayName || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    try {
      await register({ email, displayName, password });
      setIsLoading(false);
      navigate("/onboarding/workspace");
    } catch (requestError) {
      setError(requestError.message || "Unable to create your account.");
      setIsLoading(false);
    }
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
          Create your developer account
        </h2>
        <p className="text-xs text-[#888] mt-1">
          Get started in seconds, setup your workspace next
        </p>
      </div>

      {/* Register Card */}
      <div className="w-full max-w-sm bg-white border border-[#e8e5e0] rounded-xl p-6 sm:p-8 shadow-sm">
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="displayName"
            label="Full Name"
            type="text"
            placeholder="Alex Rivera"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            prefix={<User className="w-4 h-4 text-[#aaa]" />}
          />

          <Input
            id="email"
            label="Work Email"
            type="email"
            placeholder="alex@meridian.dev"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            prefix={<Mail className="w-4 h-4 text-[#aaa]" />}
          />

          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            prefix={<Lock className="w-4 h-4 text-[#aaa]" />}
            helperText="Stored using salted bcrypt hashes on backend."
          />

          <Button
            type="submit"
            size="lg"
            className="w-full mt-2"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Continue to Workspace Setup"}
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#e8e5e0] text-center text-xs text-[#888]">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-[#1a1a1a] hover:underline font-medium"
          >
            Sign in
          </Link>
        </div>
      </div>

      {/* Terminal CLI note */}
      <div className="mt-8 text-center text-xs text-[#888] flex items-center gap-2">
        <Terminal className="w-3.5 h-3.5" />
        <span>You can also sign up from the CLI with </span>
        <code className="text-[#1a1a1a] font-mono bg-[#f0ede8] border border-[#e8e5e0] px-1.5 py-0.5 rounded">
          meridian register
        </code>
      </div>
    </div>
  );
}
