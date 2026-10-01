import { useDeferredValue, useEffect, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { universities as localUniversities } from "../../shared/universities.js";
import SiteFooter from "../components/SiteFooter.jsx";

const sections = [
  { type: "FEDERAL", title: "Federal universities", eyebrow: "NATIONAL CAMPUSES" },
  { type: "STATE", title: "Prominent state universities", eyebrow: "STATE-ROOTED, STUDENT-POWERED" },
  { type: "PRIVATE", title: "Private universities", eyebrow: "INDEPENDENT CAMPUSES" }
];

export default function LandingPage() {
  const [universities, setUniversities] = useState([]);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [error, setError] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    api("/universities")
      .then(({ universities: results }) => { if (active) setUniversities(results); })
      .catch((requestError) => {
        if (!active) return;
        setUniversities(localUniversities);
        setError(`Showing the campus directory preview. ${requestError.message}`);
      });
    return () => { active = false; };
  }, []);

  function selectUniversity(university) {
    navigate(`/register?university=${encodeURIComponent(university.id)}`);
  }

  const filteredUniversities = universities.filter((university) =>
    `${university.fullName} ${university.shortCode} ${university.state}`.toLowerCase().includes(deferredSearch)
  );
  const suggestions = filteredUniversities.slice(0, 6);

  function handleCampusSearchKeyDown(event) {
    if (event.key === "ArrowDown" && suggestions.length) {
      event.preventDefault();
      setSearchOpen(true);
      setActiveSuggestion((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp" && suggestions.length) {
      event.preventDefault();
      setSearchOpen(true);
      setActiveSuggestion((index) => (index - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter" && searchOpen && suggestions.length) {
      event.preventDefault();
      selectUniversity(suggestions[activeSuggestion]);
    } else if (event.key === "Escape") {
      setSearchOpen(false);
    }
  }

  return (
    <div className="landing-shell min-h-screen bg-paper text-ink">
      <header className="landing-nav wrap">
        <Link className="brand" to="/" aria-label="Acada Cart home"><span className="brand-mark">a</span><span>acada<span className="brand-light">cart</span></span></Link>
        <div className="nav-context"><span className="live-dot" /> NIGERIA <span>/</span> STUDENT MARKETPLACE</div>
        <Link className="nav-signin" to="/login">Student sign in <ArrowUpRight size={15} /></Link>
      </header>

      <main>
        <section className="hero wrap">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-line" /> THE CAMPUS MARKET, CLOSER</p>
            <h1>Your campus.<br /><em>Your kind of marketplace.</em></h1>
            <p className="hero-intro">Find what you need from students who study where you do.</p>
            <div className="campus-search-area" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false); }}>
              <label className="campus-search">
                <Search size={19} aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  onFocus={() => { setSearchOpen(true); setActiveSuggestion(0); }}
                  onChange={(event) => { setSearch(event.target.value); setActiveSuggestion(0); setSearchOpen(true); }}
                  onKeyDown={handleCampusSearchKeyDown}
                  placeholder="Search university, code, or state"
                  aria-label="Search and select a university"
                  aria-autocomplete="list"
                  aria-controls="campus-search-results"
                  aria-expanded={searchOpen}
                  aria-activedescendant={searchOpen && suggestions[activeSuggestion] ? `campus-suggestion-${suggestions[activeSuggestion].id}` : undefined}
                />
                <span className="search-mark">{universities.length} SCHOOLS</span>
              </label>
              {searchOpen && <div className="campus-search-results" id="campus-search-results" role="listbox" aria-label="University suggestions">
                <p className="suggestion-heading">{search ? `${filteredUniversities.length} matching campuses` : "Popular campuses"}</p>
                {suggestions.map((university, index) => <button className="campus-suggestion" id={`campus-suggestion-${university.id}`} type="button" role="option" aria-selected={activeSuggestion === index} key={university.id} onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActiveSuggestion(index)} onClick={() => selectUniversity(university)}><span className="suggestion-code">{university.shortCode}</span><span className="suggestion-name"><strong>{university.fullName}</strong><small>{university.state}</small></span><ArrowUpRight size={15} /></button>)}
                {suggestions.length === 0 && <p className="suggestion-empty">No campus matches. Try another name or state.</p>}
                <button className="suggestion-browse" type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { setSearchOpen(false); document.querySelector("#campuses")?.scrollIntoView({ behavior: "smooth" }); }}>Browse all {universities.length} universities</button>
              </div>}
            </div>
            <div className="hero-footnote"><span>✳</span> A better way to pass good things on.</div>
          </div>
          <figure className="hero-photo">
            <img src="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=85" alt="Tree-lined university buildings" />
            <figcaption><span className="hero-photo-mark">a</span><span>Find your people.<br /><strong>Trade a little closer.</strong></span></figcaption>
            <span className="hero-photo-index">CAMPUS LIFE, IN CIRCULATION</span>
          </figure>
        </section>

        <div className="directory wrap" id="campuses">
          <div className="directory-intro">
            <div><p className="eyebrow">PICK UP WHERE YOU STUDY</p><h2>Choose your university <span className="heading-spark">✳</span></h2></div>
            <div className="campus-total">{filteredUniversities.length}<span> universities</span></div>
          </div>
          {error && <div className="inline-alert" role="alert">{error} <button type="button" onClick={() => window.location.reload()}>Retry</button></div>}
          {sections.map((section) => {
            const schools = filteredUniversities.filter((university) => university.institutionType === section.type);
            if (deferredSearch && schools.length === 0) return null;
            return (
              <section className="university-section" aria-labelledby={`section-${section.type}`} key={section.type}>
                <div className="section-heading"><div><p className="eyebrow">{section.eyebrow}</p><h3 id={`section-${section.type}`}>{section.title}</h3></div><span>{schools.length.toString().padStart(2, "0")}</span></div>
                <div className="university-grid">
                  {schools.map((university, index) => (
                    <button className="university-card" type="button" onClick={() => selectUniversity(university)} key={university.id} style={{ "--card-index": index }}>
                      <span className={`university-mark mark-${index % 5}`}>{university.shortCode}</span>
                      <span className="university-details"><strong>{university.fullName}</strong><span>{university.campusLocations[0] || university.state} · {university.state}</span></span>
                      <ArrowUpRight className="university-arrow" size={16} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
          {filteredUniversities.length === 0 && !error && <div className="directory-empty"><span>⌕</span><p>No campus matches that search.</p><button type="button" onClick={() => setSearch("")}>See all universities</button></div>}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
