import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { setAuthToken } from "../lib/api";

const API_URL = (import.meta.env.VITE_API_URL as string) || "";

export default function SignUp() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/sign-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.text();
        let message = "Sign up failed";
        try { const parsed = JSON.parse(body); message = parsed.message || message; } catch (_) {}
        throw new Error(message);
      }
      const data = (await res.json()) as { token?: string };
      if (data.token) { setAuthToken(data.token); window.location.href = "/"; }
      else { await login(email, password); }
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
        <p className="text-center text-gray-500 mb-10 text-sm">Create your account</p>

        <form onSubmit={handleSubmit} className="card space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-2.5 rounded-xl">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field w-full" required autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field w-full" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field w-full" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base disabled:opacity-50">
            {loading ? "Creating account..." : "Create account"}
          </button>
          <p className="text-sm text-center text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 transition-colors">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
