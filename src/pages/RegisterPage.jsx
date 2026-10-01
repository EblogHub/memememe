import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, ImagePlus, ShieldCheck } from "lucide-react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { universities as localUniversities } from "../../shared/universities.js";
import SiteFooter from "../components/SiteFooter.jsx";

const levels = [100, 200, 300, 400, 500];

export default function RegisterPage() {
  const { user, isLoading, refreshSession } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [university, setUniversity] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    api("/universities").then(({ universities: results }) => {
      if (!active) return;
      const selected = results.find((entry) => entry.id === searchParams.get("university"));
      if (selected) setUniversity(selected);
    }).catch((requestError) => {
      if (!active) return;
      const selected = localUniversities.find((entry) => entry.id === searchParams.get("university"));
      if (selected) setUniversity(selected);
      setError(requestError.message);
    });
    return () => { active = false; };
  }, [searchParams]);

  if (isLoading) return <main className="route-loading">Checking your student session…</main>;
  if (user) return <Navigate to={user.role === "ADMIN" ? "/admin" : user.isVerified ? "/marketplace" : "/pending-verification"} replace />;

  async function submit(event) {
    event.preventDefault();
    if (!university) return;
    setSubmitting(true);
    setError("");
    try {
      const body = new FormData(event.currentTarget);
      body.set("universityId", university.id);
      body.set("agreedToTerms", body.get("agreedToTerms") === "on" ? "true" : "false");
      const result = await api("/auth/register", { method: "POST", body });
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
    <main className="register-page">
      <header className="auth-topline"><Link className="brand" to="/"><span className="brand-mark">a</span><span>acada<span className="brand-light">cart</span></span></Link><span className="verified-note"><ShieldCheck size={15} /> CAMPUS VERIFIED</span></header>
      <div className="register-layout wrap">
        <aside className="register-aside">
          <Link className="back-link" to="/"><ArrowLeft size={15} /> Change campus</Link>
          <p className="eyebrow">STUDENT VERIFICATION</p>
          <h1>Make your<br /><em>campus account.</em></h1>
          <p>Register with your current student details. Your account stays locked until an admin verifies your student ID.</p>
          {university && <div className="selected-campus"><span>{university.shortCode}</span><div><strong>{university.fullName}</strong><small>{university.state}</small></div></div>}
          {!university && <Link className="campus-required-link" to="/">Choose a university before registering <ArrowUpRight size={14} /></Link>}
          <div className="privacy-note"><ShieldCheck size={17} /><span>Your ID image stays private and is visible only to verification admins.</span></div>
        </aside>

        <section className="register-form-wrap">
          <div className="register-form-heading"><div><p className="eyebrow">YOUR DETAILS</p><h2>Student registration</h2></div><span>01 / 01</span></div>
          {error && <div className="form-alert" role="alert">{error}</div>}
          <form className="register-form" onSubmit={submit} encType="multipart/form-data">
            <div className="form-grid-two"><label>First name<input name="firstName" autoComplete="given-name" required maxLength={50} /></label><label>Last name<input name="lastName" autoComplete="family-name" required maxLength={50} /></label></div>
            <label>Personal or institutional email<input type="email" name="email" autoComplete="email" required maxLength={254} /></label>
            <label>Password <span className="field-note">12 characters minimum</span><input type="password" name="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
            <div className="form-grid-two"><label>WhatsApp phone<input type="tel" name="phoneNumber" placeholder="+2348012345678" pattern="\+[1-9][0-9]{7,14}" autoComplete="tel" required /></label><label>Matric number<input name="matricNumber" autoComplete="off" minLength={2} maxLength={40} pattern="[A-Za-z0-9/-]+" required /></label></div>
            <label>Current level<select name="level" required defaultValue=""><option value="" disabled>Select current level</option>{levels.map((level) => <option value={level} key={level}>{level} Level</option>)}</select></label>
            <label className="id-upload"><span className="id-upload-heading"><ImagePlus size={17} /> Student ID card photo</span><input type="file" name="idCard" accept="image/jpeg,image/png,image/webp" capture="environment" required /><span className="field-note">Clear JPG, PNG, or WEBP image · max 5 MB</span></label>
            <label className="terms-check"><input type="checkbox" name="agreedToTerms" required /><span>I solemnly swear/state that I am an active student of this institution and all items I list are legally mine.</span></label>
            <button className="button-dark button-full" disabled={submitting || !university} type="submit">{submitting ? "Submitting securely…" : "Register for verification"} <ArrowUpRight size={16} /></button>
          </form>
          <p className="auth-bottom">Already registered? <Link to="/login">Sign in <ArrowUpRight size={13} /></Link></p>
        </section>
      </div>
    </main>
    <SiteFooter />
    </>
  );
}
