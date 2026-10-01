import { useState } from "react";
import { ArrowLeft, ArrowUpRight, LockKeyhole } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import SiteFooter from "../components/SiteFooter.jsx";

export default function LoginPage() {
  const { user, isLoading, refreshSession } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) return <main className="route-loading">Checking your student session…</main>;
  if (user) return <Navigate to={user.role === "ADMIN" ? "/admin" : user.isVerified ? "/marketplace" : "/pending-verification"} replace />;

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = Object.fromEntries(new FormData(event.currentTarget));
      const result = await api("/auth/login", { method: "POST", body: payload });
      await refreshSession();
      navigate(result.next, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
    <main className="auth-page">
      <Link className="brand auth-brand" to="/"><span className="brand-mark">a</span><span>acada<span className="brand-light">cart</span></span></Link>
      <section className="auth-panel">
        <Link className="back-link" to="/"><ArrowLeft size={15} /> Back to campus list</Link>
        <p className="eyebrow">WELCOME BACK</p>
        <h1>Student sign in</h1>
        <p className="auth-subcopy">Your campus market is ready when you are.</p>
        {error && <div className="form-alert" role="alert">{error}</div>}
        <form className="auth-form" onSubmit={submit}>
          <label>Email address<input type="email" name="email" autoComplete="email" required maxLength={254} /></label>
          <label>Password<input type="password" name="password" autoComplete="current-password" required /></label>
          <button className="button-dark button-full" disabled={submitting} type="submit"><LockKeyhole size={16} /> {submitting ? "Signing in…" : "Sign in"}</button>
        </form>
        <p className="auth-bottom">New around here? <Link to="/">Choose a campus to register <ArrowUpRight size={13} /></Link></p>
      </section>
    </main>
    <SiteFooter />
    </>
  );
}
