import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, MapPin, MessageCircle, PhoneCall, ShieldCheck } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { buildWhatsAppLink } from "../lib/whatsapp.js";
import { useAuth } from "../context/AuthContext.jsx";
import SiteFooter from "../components/SiteFooter.jsx";

const priceFormat = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
const conditionLabels = { NEW: "New", GENTLY_USED: "Gently used", SCRATCHED: "Scratched" };
const categoryLabels = { TEXTBOOKS: "Textbooks", ELECTRONICS: "Electronics", FURNITURE: "Furniture", FASHION: "Fashion" };

export default function ProductPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [result, setResult] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    let active = true;
    api(`/products/${productId}`).then((payload) => { if (active) setResult(payload); }).catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, [productId]);

  if (error) return <main className="detail-error"><Link className="back-link" to="/marketplace"><ArrowLeft size={15} /> Back to campus</Link><h1>That campus find isn’t available.</h1><p>{error}</p></main>;
  if (!result) return <main className="route-loading">Opening campus find…</main>;

  const { product } = result;
  const images = product.imageUrls || [];
  const chatUrl = buildWhatsAppLink(result.sellerPhone, product.title);
  const isSeller = user.id === product.sellerId;

  async function markAsSold() {
    setUpdatingStatus(true);
    try {
      await api(`/products/${product.id}/status`, { method: "PATCH", body: { status: "SOLD" } });
      navigate("/marketplace", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdatingStatus(false);
    }
  }

  return (
    <div className="product-detail-page">
      <div className="safety-warning" role="note"><ShieldCheck size={18} /><span>{result.safety.payment}</span></div>
      <header className="detail-nav wrap"><Link className="brand" to="/marketplace"><span className="brand-mark">a</span><span>acada<span className="brand-light">cart</span></span></Link><Link className="back-link" to="/marketplace"><ArrowLeft size={15} /> Back to campus market</Link></header>
      <main className="detail-main wrap">
        <div className="detail-gallery">
          <div className="detail-image-frame">{images[imageIndex] ? <img src={images[imageIndex]} alt={`${product.title}, photo ${imageIndex + 1}`} /> : <div className="product-fallback">{categoryLabels[product.category]}</div>}{images.length > 1 && <div className="gallery-controls"><button type="button" onClick={() => setImageIndex((imageIndex + images.length - 1) % images.length)} aria-label="Previous photo">←</button><span>{imageIndex + 1} / {images.length}</span><button type="button" onClick={() => setImageIndex((imageIndex + 1) % images.length)} aria-label="Next photo">→</button></div>}</div>
          {images.length > 1 && <div className="detail-thumbnails">{images.map((image, index) => <button type="button" className={index === imageIndex ? "selected" : ""} onClick={() => setImageIndex(index)} aria-label={`View photo ${index + 1}`} key={image}><img src={image} alt="" /></button>)}</div>}
        </div>
        <section className="detail-info">
          <p className="eyebrow">{categoryLabels[product.category].toUpperCase()} · {product.targetUniversityShortCode}</p>
          <h1>{product.title}</h1>
          <strong className="detail-price">{priceFormat.format(product.price)}</strong>
          <div className="detail-tags"><span>{conditionLabels[product.condition]}</span><span><MapPin size={13} /> {product.campusLocation}</span></div>
          <div className="detail-divider" />
          <p className="detail-description">{product.description}</p>
          <div className="seller-line"><span className="seller-avatar">{product.sellerName.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><span><small>SELLER</small><strong>{product.sellerName}</strong></span><span className="verified-seller"><ShieldCheck size={14} /> verified</span></div>
          {isSeller ? <button className="button-dark" type="button" disabled={updatingStatus} onClick={() => void markAsSold()}>{updatingStatus ? "Updating…" : "Mark as sold"}</button> : <div className="contact-actions"><a className="button-dark" href={chatUrl} target="_blank" rel="noopener noreferrer"><MessageCircle size={17} /> Chat on WhatsApp <ArrowUpRight size={15} /></a><a className="call-link" href={`tel:${result.sellerPhone}`}><PhoneCall size={15} /> Call seller</a></div>}
          <p className="contact-note">You’re contacting a verified student at your university. Arrange payment only after meeting and inspecting the item.</p>
        </section>
      </main>
      <section className="meetup-banner wrap"><span className="meetup-mark">✳</span><div><p className="eyebrow">SAFE MEETUP ZONES</p><p>{result.safety.meetup}</p></div><MapPin size={18} /></section>
      <SiteFooter />
    </div>
  );
}
