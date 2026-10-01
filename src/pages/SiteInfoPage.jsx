import { useState } from "react";
import { ArrowLeft, ArrowUpRight, CircleAlert, Mail, MessageCircle, Phone, ShieldCheck, Trash2 } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import SiteFooter from "../components/SiteFooter.jsx";

const pages = {
  privacy: {
    section: "LEGAL", title: "Privacy policy", intro: "Your student details should help keep the marketplace accountable, not become public listing data.", points: [
      ["What we collect", "Account name, email, phone, matriculation number, level, selected university, and the student ID image you submit for manual review."],
      ["How it is used", "To verify student status, scope listings to a university, operate your account, and help prevent fraud."],
      ["What other students see", "Listings show your display name and campus pickup area. Email and matriculation number are not shown in listings. Your phone is shared when you open the seller's call or WhatsApp contact."],
      ["Storage and deletion", "Student IDs and product photos are intended for private storage. You can request account deletion below; identity records may be retained only where required to investigate abuse or comply with law." ]
    ]
  },
  terms: {
    section: "LEGAL", title: "Terms of service", intro: "Acada Cart helps students find one another. Students arrange inspection, handover, and payment directly.", points: [
      ["Student accounts", "Use accurate details for the university you currently attend. Accounts remain locked until a campus administrator approves student verification."],
      ["Listings", "Only list items you own or are authorized to sell. Describe condition and price honestly, and remove or mark items sold promptly."],
      ["Transactions", "Acada Cart does not hold payments or guarantee a transaction. Inspect the item in person before paying; never pay online in advance to reserve it."],
      ["Enforcement", "Fraud, impersonation, unsafe conduct, or prohibited listings can lead to removal or account suspension." ]
    ]
  },
  "community-guidelines": {
    section: "LEGAL", title: "Community guidelines", intro: "Keep campus trading useful, honest, and safe for everyone.", points: [
      ["Be accurate", "Use your own student identity, real photos, a fair description, and a clear asking price."],
      ["Meet safely", "Meet during daylight in busy campus locations such as a main library entrance, a faculty lecture-theatre area, or a campus bank."],
      ["Protect yourself", "Inspect the item before payment. Do not share passwords, verification codes, or extra identity documents in chat."],
      ["Respect others", "No harassment, scams, counterfeit goods, stolen property, or discriminatory content. Report suspicious activity to your campus administrator." ]
    ]
  },
  "how-it-works": {
    section: "PRODUCT", title: "How it works", intro: "A campus marketplace built around the school you attend.", points: [
      ["Choose your university", "Search by school name, short code, or state, then select your campus."],
      ["Verify your student account", "Register with your student details and ID card. A campus administrator reviews the application before marketplace access opens."],
      ["Find or list a campus item", "Browse available items at your university or post a listing with photos and a campus pickup location."],
      ["Meet and inspect", "Contact the seller directly, meet in a busy campus place in daylight, and pay only after inspecting the item." ]
    ]
  },
  features: {
    section: "PRODUCT", title: "Features", intro: "Tools for buying and selling student essentials close to home.", points: [
      ["University-scoped browsing", "The marketplace feed is restricted to the verified student's university."],
      ["Student verification", "New accounts stay pending until a campus administrator reviews the student ID."],
      ["Product details", "Compare price, condition, photos, category, and pickup location before contacting a seller."],
      ["Direct contact", "Use WhatsApp or phone to arrange an in-person handover. Acada Cart does not process payments." ]
    ]
  },
  download: {
    section: "PRODUCT", title: "Use Acada Cart on your phone", intro: "The marketplace is a responsive website. A native iOS or Android app is not available yet.", points: [
      ["Mobile-ready", "Open the website in your phone browser to search campuses, contact sellers, or manage listings."],
      ["Add to your home screen", "Use your browser's Add to Home Screen option for a quick shortcut. This does not install a separate native app." ]
    ]
  },
  faqs: {
    section: "PRODUCT", title: "Frequently asked questions", intro: "Quick answers about campus access and safe trading.", points: [
      ["Why is my account pending?", "A campus administrator must review your student information and ID card before approving marketplace access."],
      ["Can I browse items at another university?", "No. Product feeds are restricted to the university linked to your verified student account."],
      ["Does Acada Cart take payment?", "No. Buyers and sellers arrange payment directly after meeting and inspecting the item."],
      ["What should I do if I suspect a scam?", "Do not pay in advance. Stop the transaction and report the account to your campus administrator." ]
    ]
  },
  about: {
    section: "COMPANY", title: "About AcadaCart", intro: "A secure, campus-focused marketplace built to make student life in Nigeria more affordable and campus trading more accountable."
  },
  contact: {
    section: "COMPANY", title: "Contact AcadaCart", intro: "Reach out about your account, campus verification, or a marketplace safety concern."
  },
  blog: {
    section: "COMPANY", title: "Campus notes", intro: "Stories and marketplace updates are being prepared.", points: [
      ["Coming soon", "Campus tips, student seller stories, and product updates will appear here after launch." ]
    ]
  }
};

const aboutSections = [
  {
    number: "01",
    title: "A marketplace for each campus",
    paragraphs: [
      "AcadaCart is a student-to-student marketplace organized around individual universities. Students choose their institution and browse items listed for that campus, instead of sorting through one nationwide feed.",
      "From textbooks and mattresses to rechargeable fans, smartphones, and laptops, the goal is to help useful things find their next student nearby."
    ]
  },
  {
    number: "02",
    title: "Built around real campus problems",
    paragraphs: [
      "Every session, new and returning students look for affordable hostel essentials and course materials. At the same time, graduating students often need a reliable way to pass those same items on instead of leaving them behind or selling them for far less than they are worth.",
      "Students have also had to rely on informal groups and general classified sites where it can be difficult to know whether a seller really belongs to the campus."
    ]
  },
  {
    number: "03",
    title: "A more accountable way to trade",
    paragraphs: [
      "AcadaCart was founded by engineer Engr. Elisha Anthony, popularly known as Eblog, on September 25, 2026. Seeing the cost pressures and trust problems around campus trading, he set out to build a local marketplace with student verification at its core.",
      "Students submit their matriculation details, level, phone number, university, and student ID for manual review before trading access is approved. Verification is designed to reduce impersonation and improve accountability; no online marketplace can promise that fraud will never happen."
    ]
  }
];

const promises = [
  ["Verified student network", "Student accounts are reviewed before they can buy or list items."],
  ["Campus-local handovers", "Browse items for your university and arrange a nearby pickup without interstate shipping."],
  ["Direct student contact", "A product link can open a ready-to-send WhatsApp message to the student seller so you can arrange an in-person inspection and meetup."],
  ["More value from student essentials", "Help buyers find lower-cost used items while sellers earn from things they no longer need."]
];

function AboutStory() {
  return (
    <>
      <section className="about-hero">
        <div className="about-hero-inner wrap">
          <p className="eyebrow"><span className="eyebrow-line" /> COMPANY · OUR STORY</p>
          <h1>Campus life costs enough.<br /><em>Trading locally should be easier.</em></h1>
          <p>AcadaCart helps Nigerian university students buy and sell useful essentials within their own campus community.</p>
          <div className="about-founder"><span className="about-founder-mark">EA</span><span><small>FOUNDED SEPTEMBER 25, 2026</small><strong>Engr. Elisha Anthony <span>· Founder &amp; CEO · Eblog</span></strong></span></div>
        </div>
        <span className="about-hero-index" aria-hidden="true">01 / CAMPUS BY CAMPUS</span>
      </section>

      <section className="about-overview wrap">
        <p className="eyebrow">WHAT IS ACADACART?</p>
        <div><h2>A student marketplace,<br />organized around your university.</h2><p>Choose UNIUYO, UNILAG, OAU, UNN, UI, or another participating school to enter its own campus marketplace. Items are intended for students at that institution, with pickup arranged around campus.</p></div>
      </section>

      <section className="about-story-sections wrap" aria-label="The story behind AcadaCart">
        {aboutSections.map((section) => <article className="about-story-row" key={section.number}><span className="about-story-number">{section.number}</span><div><h2>{section.title}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></article>)}
      </section>

      <section className="promise-section">
        <div className="promise-inner wrap"><div className="promise-heading"><p className="eyebrow">WHAT WE WORK TOWARD</p><h2>Our promises to students.</h2><p>Safer choices, clearer campus context, and more value from the things students already use.</p></div><div className="promise-list">{promises.map(([title, text], index) => <article className="promise-row" key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></div>
      </section>
      <section className="about-closing wrap"><span aria-hidden="true">✳</span><p>Thank you for being part of our journey. We’re committed to making university life in Nigeria safer, smarter, and more affordable, one campus at a time.</p></section>
    </>
  );
}

function ContactDetails() {
  return (
    <section className="contact-details" aria-label="AcadaCart contact details">
      <a href="mailto:talktoelishanthonylive@gmail.com"><span><Mail size={17} /></span><span><small>EMAIL</small><strong>talktoelishanthonylive@gmail.com</strong></span><ArrowUpRight size={15} /></a>
      <a href="tel:+2348129858542"><span><Phone size={17} /></span><span><small>PHONE</small><strong>+234 812 985 8542</strong></span><ArrowUpRight size={15} /></a>
      <a href="https://wa.me/2348129858542?text=Hello%2C%20I%20need%20help%20with%20AcadaCart." target="_blank" rel="noopener noreferrer"><span><MessageCircle size={17} /></span><span><small>WHATSAPP</small><strong>Chat with AcadaCart support</strong></span><ArrowUpRight size={15} /></a>
      <p className="contact-privacy-note"><ShieldCheck size={15} /> Never send passwords, verification codes, or student ID photos through email or WhatsApp. Use the secure verification form for student documents.</p>
    </section>
  );
}

export default function SiteInfoPage() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const pageSlug = slug || location.pathname.slice(1);
  const page = pages[pageSlug];
  const isDeletionPage = pageSlug === "account-deletion";

  async function deleteAccount(event) {
    event.preventDefault();
    if (!confirmed || !password) return;
    setBusy(true);
    setMessage("");
    try {
      await api("/auth/me", { method: "DELETE", body: { password, confirmation: "DELETE" } });
      await signOut();
      navigate("/", { replace: true });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  if (!page && !isDeletionPage) return <main className="route-loading">This information page is not available.</main>;

  return (
    <div className="info-page">
      <header className="info-nav wrap"><Link className="brand" to="/"><span className="brand-mark">a</span><span>acada<span className="brand-light">cart</span></span></Link><Link className="back-link" to="/"><ArrowLeft size={15} /> Back to campus directory</Link></header>
      {pageSlug === "about" ? <AboutStory /> : pageSlug === "contact" ? <main className="info-main wrap">
        <p className="eyebrow">{page.section}</p>
        <h1>{page.title}</h1>
        <p className="info-intro">{page.intro}</p>
        <ContactDetails />
        <div className="info-updated">For urgent personal emergencies, contact your local emergency services or campus security.</div>
      </main> : <main className="info-main wrap">
        <p className="eyebrow">{isDeletionPage ? "LEGAL · ACCOUNT CONTROL" : page.section}</p>
        <h1>{isDeletionPage ? "Delete your account" : page.title}</h1>
        <p className="info-intro">{isDeletionPage ? "Account deletion permanently removes your profile and active listings." : page.intro}</p>
        {isDeletionPage ? (
          <section className="deletion-panel">
            <div className="deletion-warning"><CircleAlert size={18} /><p>Your student ID image, account profile, sessions, and product listings will be removed. This action cannot be undone.</p></div>
            {!user ? <p>Sign in to request deletion of your account.</p> : user.role === "ADMIN" ? <p>Admin accounts are managed by the workspace owner. Ask another administrator to remove this account.</p> : <form className="delete-account-form" onSubmit={deleteAccount}><label>Confirm your password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label><label className="terms-check"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} required /><span>I understand this permanently deletes my account and active listings.</span></label><button className="button-danger" type="submit" disabled={busy || !confirmed}>{busy ? "Deleting account…" : "Permanently delete account"}<Trash2 size={15} /></button>{message && <p className="form-alert" role="alert">{message}</p>}</form>}
            <p className="field-note">Student ID images are stored privately. If deletion fails because services are offline, your data has not been deleted; retry after services return.</p>
          </section>
        ) : <div className="info-points">{page.points.map(([heading, text]) => <section className="info-point" key={heading}><ShieldCheck size={17} /><div><h2>{heading}</h2><p>{text}</p></div></section>)}</div>}
        <div className="info-updated">These pages describe the current Acada Cart experience. Legal wording should be reviewed before public launch.</div>
      </main>}
      <SiteFooter />
    </div>
  );
}
