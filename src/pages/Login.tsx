import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-center text-white mb-2 tracking-tight">Smart House</h1>
        <p className="text-center text-gray-500 mb-10 text-sm">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="card space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-2.5 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field w-full"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field w-full"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base disabled:opacity-50">
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="text-sm text-center text-gray-500">
            Don't have an account?{" "}
            <Link to="/signup" className="text-brand-400 hover:text-brand-300 transition-colors">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
