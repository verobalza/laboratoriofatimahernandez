import { Link } from "react-router-dom";
import "./BrandingLink.css";

export default function BrandingLink() {
  return (
    <Link to="/dashboard" className="branding-link">
      <div className="branding-text">
        <h3 className="branding-name">Laboratorio Bioclínico</h3>
        <p className="branding-subtitle">Lc. Fátima Hernández</p>
      </div>
    </Link>
  );
}
