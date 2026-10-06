"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { COMPETITION_ITEMS } from "../../lib/competitions.js";

const SHORTCUT_KEYS = [
  "argentina",
  "copa_argentina",
  "libertadores",
  "sudamericana",
];

const COMPETITION_GROUPS = [
  {
    label: "ARGENTINA",
    keys: ["argentina", "copa_argentina", "primera_nacional", "primera_b_metro", "primera_c", "reserva"],
  },
  {
    label: "AMÉRICA",
    keys: [
      "libertadores", "sudamericana", "brasil", "chile", "colombia", "mexico",
      "paraguay", "uruguay", "mls",
    ],
  },
  {
    label: "EUROPA",
    keys: [
      "premier_league", "laliga", "serie_a", "bundesliga", "ligue_1", "liga_portugal",
      "champions", "europa_league", "conference_league", "fa_cup", "efl_cup",
      "copa_del_rey", "supercopa_espana", "coppa_italia", "supercoppa_italiana",
      "dfb_pokal", "coupe_de_france",
    ],
  },
  {
    label: "SELECCIONES",
    keys: [
      "copa_america", "euro", "eliminatorias_conmebol", "eliminatorias_uefa",
      "eliminatorias_concacaf", "nations_league", "u20_world_cup", "repechaje_mundial",
    ],
  },
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
  const normalizedQuery = normalize(query);
  const filteredCompetitions = normalizedQuery
    ? COMPETITION_ITEMS.filter(({ key, label, name, searchTerms = [] }) =>
      normalize(`${key} ${label} ${name} ${searchTerms.join(" ")}`).includes(normalizedQuery)
    )
    : COMPETITION_ITEMS;
  const competitionsByKey = new Map(filteredCompetitions.map(item => [item.key, item]));

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
    <div className="competition-menu">
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
          onClick={() => setIsOpen(open => !open)}
          aria-expanded={isOpen}
          aria-controls="competition-panel"
        >
          {isOpen ? (
            <svg aria-hidden="true" viewBox="0 0 20 20" width="14" height="14" fill="none">
              <path d="m4 12 6-6 6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square" />
            </svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 20 20" width="14" height="14" fill="none">
              <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.7" />
              <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square" />
            </svg>
          )}
          <span>{isOpen ? (compact ? "CERRAR" : "MENOS") : (compact ? "TODAS" : "TODAS LAS COMPETENCIAS")}</span>
        </button>
      </nav>

      {isOpen && (
        <section
          id="competition-panel"
          className="competition-panel"
          aria-label="Todas las competencias"
        >
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
              placeholder="Buscar competencia..."
              autoComplete="off"
            />
          </label>

          <div className="competition-results-meta" aria-live="polite">
            {filteredCompetitions.length} {filteredCompetitions.length === 1 ? "competencia" : "competencias"}
          </div>
          {filteredCompetitions.length > 0 ? (
            <div className="competition-groups">
              {COMPETITION_GROUPS.map(group => {
                const items = group.keys
                  .map(key => competitionsByKey.get(key))
                  .filter(Boolean);
                if (items.length === 0) return null;
                return (
                  <section className="competition-group" key={group.label} aria-label={group.label}>
                    <h3 className="competition-group-title">{group.label}</h3>
                    <div className="competition-results">
                      {items.map(({ key, name }) => (
                        <Link
                          key={key}
                          href={`/posiciones?competition=${key}`}
                          className={`competition-result${activeCompetition === key ? " competition-result-active" : ""}`}
                          onClick={cerrarPanel}
                        >
                          <span>{name}</span>
                          <span className="competition-result-arrow" aria-hidden="true">↗</span>
                        </Link>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
              <p className="competition-no-results">No se encontraron competencias con ese nombre.</p>
          )}
        </section>
      )}
    </div>
  );
}
