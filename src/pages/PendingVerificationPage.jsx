import { Clock3, LogOut, ShieldCheck, XCircle } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import SiteFooter from "../components/SiteFooter.jsx";

export default function PendingVerificationPage() {
  const { user, isLoading, signOut } = useAuth();
  if (isLoading) return <main className="route-loading">Checking your application…</main>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.isVerified && user.accountStatus === "APPROVED") return <Navigate to="/marketplace" replace />;
  if (user.role === "ADMIN") return <Navigate to="/admin" replace />;

  const rejected = user.accountStatus === "REJECTED";
  return (
    <>
    <main className="status-page">
      <header className="status-nav wrap"><a className="brand" href="/"><span className="brand-mark">a</span><span>acada<span className="brand-light">cart</span></span></a><button className="quiet-button" type="button" onClick={() => void signOut()}><LogOut size={15} /> Sign out</button></header>
      <section className="status-content">
        <div className={`status-symbol ${rejected ? "status-symbol-rejected" : ""}`}>{rejected ? <XCircle size={30} /> : <Clock3 size={30} />}</div>
        <p className="eyebrow">ACCOUNT STATUS · {user.university.shortCode}</p>
        <h1>{rejected ? "We need a clearer student ID." : "Your campus is checking you in."}</h1>
        <p className="status-copy">{rejected ? "Your application needs another review. Contact campus support with your registration email." : "Your account is locked while an admin reviews your student details and ID card. The marketplace opens after approval."}</p>
        <div className="review-progress"><span className="progress-complete"><ShieldCheck size={16} /> Application received</span><span className="progress-current"><Clock3 size={16} /> Manual ID verification</span><span className="progress-locked">Campus marketplace access</span></div>
        <div className="privacy-note"><ShieldCheck size={17} /><span>Your matric number and student ID are private and are not shown on listings.</span></div>
      </section>
    </main>
    <SiteFooter />
    </>
  );
}
