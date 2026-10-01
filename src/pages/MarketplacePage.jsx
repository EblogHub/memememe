import { useDeferredValue, useEffect, useState } from "react";
import { ArrowDownUp, ArrowUpRight, MapPin, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import SiteFooter from "../components/SiteFooter.jsx";

const categories = [
  ["ALL", "All finds"], ["TEXTBOOKS", "Textbooks"], ["ELECTRONICS", "Electronics"],
  ["FURNITURE", "Furniture"], ["FASHION", "Fashion"]
];
const categoryLabels = Object.fromEntries(categories);
const conditions = { NEW: "New", GENTLY_USED: "Gently used", SCRATCHED: "Scratched" };
const priceFormat = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });

function ProductCard({ product }) {
  return (
    <Link className="product-card" to={`/products/${product.id}`}>
      <div className="product-image-frame">
        {product.imageUrls[0] ? <img src={product.imageUrls[0]} alt={product.title} loading="lazy" /> : <div className={`product-fallback fallback-${product.category.toLowerCase()}`}>{categoryLabels[product.category]}</div>}
        <span className="condition-pill">{conditions[product.condition]}</span>
        {product.imageUrls.length > 1 && <span className="photo-count">{product.imageUrls.length} photos</span>}
      </div>
      <div className="product-info">
        <div className="product-info-top"><h3>{product.title}</h3><strong>{priceFormat.format(product.price)}</strong></div>
        <div className="product-meta"><span>{product.sellerName}</span><span>{categoryLabels[product.category]}</span></div>
        <p className="pickup-line"><MapPin size={13} /> {product.campusLocation} <span>·</span> same campus</p>
      </div>
    </Link>
  );
}

function ListingDialog({ onClose, onPosted, university }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const locations = university.campusLocations || [];

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const images = form.elements.images.files;
    if (images.length < 2 || images.length > 3) {
      setError("Choose 2 or 3 product photos.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api("/products", { method: "POST", body: data });
      onPosted();
      onClose();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-scrim" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="listing-modal" role="dialog" aria-modal="true" aria-labelledby="listing-title">
        <div className="modal-heading"><div><p className="eyebrow">CLEAR SOME SPACE</p><h2 id="listing-title">List a campus find</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close form"><X size={18} /></button></div>
        <p className="modal-campus"><MapPin size={14} /> {university.fullName}</p>
        {error && <div className="form-alert" role="alert">{error}</div>}
        <form className="listing-form" onSubmit={submit}>
          <label>Product title<input name="title" required maxLength={120} placeholder="e.g. Calculus textbook, 8th edition" /></label>
          <label>Description<textarea name="description" required minLength={5} maxLength={2000} rows={3} placeholder="Condition details, size, what's included…" /></label>
          <div className="form-grid-two"><label>Price (NGN)<input name="price" type="number" min="1" step="0.01" max="999999999.99" required placeholder="25000" /></label><label>Category<select name="category" required defaultValue="TEXTBOOKS">{categories.slice(1).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div>
          <div className="form-grid-two"><label>Condition<select name="condition" required defaultValue="NEW"><option value="NEW">New</option><option value="GENTLY_USED">Gently used</option><option value="SCRATCHED">Scratched</option></select></label><label>Pickup location<select name="campusLocation" required defaultValue=""><option value="" disabled>Select a campus spot</option>{locations.map((location) => <option value={location} key={location}>{location}</option>)}</select></label></div>
          <label>Product photos<input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple required /><span className="field-note">2–3 JPG, PNG, or WEBP images · max 5 MB each</span></label>
          <button className="button-dark button-full" disabled={busy} type="submit">{busy ? "Posting securely…" : "Post to campus"} <ArrowUpRight size={16} /></button>
        </form>
      </section>
    </div>
  );
}

export default function MarketplacePage() {
  const { user, signOut } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [sort, setSort] = useState("newest");
  const [error, setError] = useState("");
  const [showListing, setShowListing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const deferredSearch = useDeferredValue(search.trim());

  useEffect(() => {
    const params = new URLSearchParams({ sort });
    if (deferredSearch) params.set("search", deferredSearch);
    if (category !== "ALL") params.set("category", category);
    let active = true;
    api(`/products?${params}`)
      .then(({ products: results }) => { if (active) { setProducts(results); setError(""); } })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, [category, deferredSearch, sort, refreshKey]);

  return (
    <div className="marketplace-shell">
      <header className="market-nav wrap">
        <Link className="brand" to="/marketplace"><span className="brand-mark">a</span><span>acada<span className="brand-light">cart</span></span></Link>
        <label className="market-search"><Search size={17} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search finds at your university" aria-label="Search products" /></label>
        <div className="market-nav-actions"><span className="market-campus"><MapPin size={15} /> {user.university.shortCode}</span><button className="button-dark sell-button" type="button" onClick={() => setShowListing(true)}><Plus size={16} /> Sell an item</button><button className="avatar" type="button" onClick={() => void signOut()} title="Sign out">{user.firstName[0]}{user.lastName[0]}</button></div>
      </header>
      <main className="market-main wrap">
        <section className="market-welcome"><div><p className="eyebrow"><span className="live-dot" /> VERIFIED CAMPUS MARKET</p><h1>Good finds, <em>right around campus.</em></h1><p>Every item here is listed by an approved {user.university.shortCode} student.</p></div><div className="welcome-note"><span>01</span><span>Meet in person.<br /><strong>Trade with care.</strong></span></div></section>
        <div className="market-toolbar"><div className="category-tabs" role="group" aria-label="Product categories">{categories.map(([value, label]) => <button key={value} type="button" className={category === value ? "active" : ""} onClick={() => setCategory(value)}>{label}</button>)}</div><label className="sort-menu"><SlidersHorizontal size={14} /><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products"><option value="newest">Recently added</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select><ArrowDownUp size={13} /></label></div>
        <div className="feed-heading"><div><p className="eyebrow">{user.university.fullName.toUpperCase()}</p><h2>Fresh on campus <span className="heading-spark">✳</span></h2></div><span>{products.length} {products.length === 1 ? "item" : "items"}</span></div>
        {error && <div className="inline-alert" role="alert">{error} <button type="button" onClick={() => setRefreshKey((value) => value + 1)}>Try again</button></div>}
        {!error && products.length === 0 ? <div className="empty-feed"><span>⌕</span><h2>No campus finds yet.</h2><p>Try a different search, or list something students need.</p><button className="button-dark" type="button" onClick={() => setShowListing(true)}><Plus size={15} /> List the first find</button></div> : <div className="product-grid">{products.map((product) => <ProductCard product={product} key={product.id} />)}</div>}
        <div className="market-safety-note"><span>✳</span><p>Trade thoughtfully. Inspect an item in person and choose a busy, daylight campus meetup.</p></div>
      </main>
      {showListing && <ListingDialog university={user.university} onClose={() => setShowListing(false)} onPosted={() => setRefreshKey((value) => value + 1)} />}
      <SiteFooter />
    </div>
  );
}
