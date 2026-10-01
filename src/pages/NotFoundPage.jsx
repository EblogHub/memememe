import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return <main className="not-found"><span>404</span><h1>This campus is off the map.</h1><Link to="/">Back to Acada Cart</Link></main>;
}
