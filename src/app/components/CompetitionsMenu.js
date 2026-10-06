"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { COMPETITION_ITEMS } from "../../lib/competitions.js";

const SHORTCUT_KEYS = [
  "argentina",
  "copa_argentina",
  "libertadores",
  "sudamericana",
  "premier_league",
];

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function CompetitionsMenu({ compact = false, activeCompetition = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef(null);

  const shortcuts = SHORTCUT_KEYS
    .map(key => COMPETITION_ITEMS.find(item => item.key === key))
    .filter(Boolean);
  const filteredCompetitions = useMemo(() => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return COMPETITION_ITEMS;
    return COMPETITION_ITEMS.filter(({ key, label, name, searchTerms = [] }) =>
      normalize(`${key} ${label} ${name} ${searchTerms.join(" ")}`).includes(normalizedQuery)
    );
  }, [query]);

  useEffect(() => {
    if (!isOpen) return undefined;
    searchRef.current?.focus();
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setQuery("");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  function cerrarPanel() {
    setIsOpen(false);
    setQuery("");
  }

  return (
    <>
      <nav className={`competition-nav${compact ? " competition-nav-compact" : ""}`} aria-label="Accesos a competencias">
        <div className="competition-shortcuts">
          {shortcuts.map(({ key, label }) => (
            <Link
              key={key}
              href={`/posiciones?competition=${key}`}
              aria-current={activeCompetition === key ? "page" : undefined}
              className={`competition-pill${activeCompetition === key ? " competition-pill-active" : ""}`}
            >
              {label}
            </Link>
          ))}
        </div>
        <button
          type="button"
          className="competition-all-button"
          onClick={() => setIsOpen(true)}
          aria-haspopup="dialog"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" width="14" height="14" fill="none">
            <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.7" />
            <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square" />
          </svg>
          <span>{compact ? "TODAS" : "TODAS LAS COMPETENCIAS"}</span>
        </button>
      </nav>

      {isOpen && (
        <div
          className="competition-modal-backdrop"
          onMouseDown={event => {
            if (event.target === event.currentTarget) cerrarPanel();
          }}
        >
          <section
            className="competition-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="competition-modal-title"
          >
            <header className="competition-modal-header">
              <div>
                <p className="competition-modal-kicker">SELECCIÓN DE TORNEO</p>
                <h2 id="competition-modal-title">Todas las competencias</h2>
              </div>
              <button type="button" className="competition-modal-close" onClick={cerrarPanel} aria-label="Cerrar">
                ×
              </button>
            </header>

            <label className="competition-search">
              <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="none">
                <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.7" />
                <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square" />
              </svg>
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Buscar: B Metro, Chile, Italia..."
                autoComplete="off"
              />
              <kbd>ESC</kbd>
            </label>

            <div className="competition-results-meta" aria-live="polite">
              {filteredCompetitions.length} {filteredCompetitions.length === 1 ? "competencia" : "competencias"}
            </div>
            <div className="competition-results">
              {filteredCompetitions.length > 0 ? filteredCompetitions.map(({ key, name }) => (
                <Link
                  key={key}
                  href={`/posiciones?competition=${key}`}
                  className={`competition-result${activeCompetition === key ? " competition-result-active" : ""}`}
                  onClick={cerrarPanel}
                >
                  <span>{name}</span>
                  <span className="competition-result-arrow" aria-hidden="true">↗</span>
                </Link>
              )) : (
                <p className="competition-no-results">No se encontraron competencias con ese nombre.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
