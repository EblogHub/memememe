import { useEffect, useState } from "react";
import { Check, ExternalLink, LogOut, ShieldCheck, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";

export default function AdminPage() {
  const { user, signOut } = useAuth();
  const [applicants, setApplicants] = useState([]);
  const [error, setError] = useState("");
  const [banMessage, setBanMessage] = useState("");
  const [banError, setBanError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [identity, setIdentity] = useState("");

  async function loadQueue() {
    try {
      const { applicants: results } = await api("/admin/verifications");
      setApplicants(results);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  useEffect(() => { void loadQueue(); }, []);

  async function review(applicantId, status) {
    setBusyId(applicantId);
    try {
      await api(`/admin/verifications/${applicantId}`, { method: "POST", body: { status } });
      await loadQueue();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  }

  async function banStudent(event) {
    event.preventDefault();
    const trimmed = identity.trim();
    if (!trimmed) return;
    setBanError("");
    setBanMessage("");
    try {
      const isUserId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
      const body = isUserId ? { userId: trimmed } : { matricNumber: trimmed, reason: "Admin trust and safety decision" };
      const result = await api("/admin/ban-user", { method: "POST", body });
      setBanMessage(`Account banned. ${result.productsDeleted} listings removed; identity permanently blocked.`);
      setIdentity("");
      await loadQueue();
    } catch (requestError) {
      setBanError(requestError.message);
    }
  }

  return (
    <main className="admin-page">
      <header className="admin-nav wrap"><a className="brand" href="/"><span className="brand-mark">a</span><span>acada<span className="brand-light">cart</span></span></a><span className="admin-label"><ShieldCheck size={15} /> TRUST & SAFETY · ADMIN</span><button className="quiet-button" type="button" onClick={() => void signOut()}><LogOut size={15} /> Sign out</button></header>
      <div className="admin-main wrap">
        <div className="admin-title-row"><div><p className="eyebrow">{user.university?.shortCode || "CAMPUS NETWORK"} · VERIFICATION</p><h1>Student review queue</h1></div><span>{applicants.length.toString().padStart(2, "0")} waiting</span></div>
        {error && <div className="form-alert" role="alert">{error}</div>}
        <section className="admin-queue" aria-label="Student applications">{applicants.map((applicant) => <article className="applicant-row" key={applicant.id}><div className="applicant-id"><div className="applicant-avatar">{applicant.fullName.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div><div><h2>{applicant.fullName}</h2><p>{applicant.university.shortCode} · {applicant.matricNumber} · {applicant.level}L</p><p>{applicant.email} · {applicant.phoneNumber}</p></div></div><div className="applicant-actions"><a href={applicant.idCardUrl} target="_blank" rel="noopener noreferrer">View ID <ExternalLink size={14} /></a><button className="approve-button" type="button" disabled={busyId === applicant.id} onClick={() => void review(applicant.id, "APPROVED")}><Check size={15} /> Approve</button><button className="reject-button" type="button" disabled={busyId === applicant.id} onClick={() => void review(applicant.id, "REJECTED")}><X size={15} /> Reject</button></div></article>)}</section>
        {applicants.length === 0 && !error && <div className="admin-empty"><ShieldCheck size={22} /><p>No student applications need review.</p></div>}
        <section className="ban-panel"><div><p className="eyebrow">PERMANENT IDENTITY BLOCK</p><h2>Ban a student account</h2><p>Removes listings, revokes access, and stores a keyed matric-number hash to block re-registration.</p></div><form onSubmit={banStudent}><label>Student ID or matric number<input value={identity} onChange={(event) => setIdentity(event.target.value)} required placeholder="User UUID or matric number" /></label><button className="button-dark" type="submit">Ban identity <X size={14} /></button></form>{banError && <p className="ban-error" role="alert">{banError}</p>}{banMessage && <p className="ban-success" role="status">{banMessage}</p>}</section>
      </div>
    </main>
  );
}
