import Link from "next/link";
import { COMPETITION_ITEMS } from "../../lib/competitions.js";

const menuStyle = {
  position: "absolute",
  zIndex: 1000,
  top: "100%",
  right: 0,
  width: "min(360px, calc(100vw - 16px))",
  maxHeight: "min(70vh, 520px)",
  overflowY: "auto",
  padding: "5px",
  background: "#1a2535",
  border: "1px solid #3b82f6",
  boxShadow: "0 8px 20px rgba(0,0,0,0.45)",
};

export default function CompetitionsMenu({ compact = false }) {
  const linkStyle = {
    display: "block",
    padding: compact ? "9px 8px" : "7px 8px",
    color: "#e2e8f0",
    background: "#141e2b",
    border: "1px solid #263244",
    fontSize: "11px",
    lineHeight: 1.3,
    textDecoration: "none",
  };

  return (
    <details style={{ position: "relative", flex: "0 0 auto" }}>
      <summary
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          padding: compact ? "8px 10px" : "7px 10px",
          color: "#bfdbfe",
          fontSize: "11px",
          fontWeight: "bold",
          cursor: "pointer",
          listStyle: "none",
          whiteSpace: "nowrap",
          borderRight: "1px solid #2563eb",
        }}
      >
        COMPETENCIAS <span aria-hidden="true">▾</span>
      </summary>
      <div style={menuStyle} aria-label="Elegir competencia">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "4px" }}>
          {COMPETITION_ITEMS.map(({ key, name }) => (
            <Link key={key} href={`/posiciones?competition=${key}`} style={linkStyle}>
              {name}
            </Link>
          ))}
        </div>
      </div>
    </details>
  );
}
