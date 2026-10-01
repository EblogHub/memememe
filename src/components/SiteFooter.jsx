import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const groups = [
  {
    title: "Legal",
    links: [
      ["Privacy policy", "/legal/privacy"],
      ["Terms of service", "/legal/terms"],
      ["Community guidelines", "/community-guidelines"],
      ["Account deletion", "/account-deletion"]
    ]
  },
  {
    title: "Product",
    links: [
      ["How it works", "/how-it-works"],
      ["Features", "/features"],
      ["Download", "/download"],
      ["FAQs", "/faqs"]
    ]
  },
  {
    title: "Company",
    links: [
      ["About us", "/about"],
      ["Contact", "/contact"],
      ["Blog", "/blog"]
    ]
  }
];

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner wrap">
        <div className="footer-brand-column">
          <Link className="brand" to="/"><span className="brand-mark">a</span><span>acada<span className="brand-light">cart</span></span></Link>
          <p>A better way to pass good things on.</p>
          <span className="footer-country">MADE FOR STUDENTS IN NIGERIA</span>
        </div>
        {groups.map((group) => (
          <nav className="footer-link-group" aria-label={group.title} key={group.title}>
            <h2>{group.title}</h2>
            {group.links.map(([label, path]) => <Link to={path} key={path}>{label}<ArrowUpRight size={12} aria-hidden="true" /></Link>)}
          </nav>
        ))}
      </div>
      <div className="footer-bottom wrap"><span>© {new Date().getFullYear()} Acada Cart</span><span>Campus by campus.</span></div>
    </footer>
  );
}
