"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";

// ─── PALETA (misma que posiciones) ───────────────────────────────────────────
const C = {
  bg:         "#0f1923",
  surface:    "#1a2535",
  surfaceAlt: "#141e2b",
  border:     "#263244",
  borderSub:  "#1e2d3d",
  text:       "#e2e8f0",
  textMuted:  "#64748b",
  textDim:    "#94a3b8",
  blue:       "#3b82f6",
  blueNav:    "#1d4ed8",
  green:      "#10b981",
  greenBg:    "rgba(16,185,129,0.08)",
  red:        "#ef4444",
  amber:      "#f59e0b",
  white:      "#f8fafc",
};

const S = {
  page:          { background: C.bg, color: C.text, minHeight: "100vh", fontFamily: "Arial, Tahoma, Verdana, sans-serif", fontSize: "11px" },
  navbar:        { background: C.blueNav, padding: "0", borderBottom: "2px solid #1e3a8a" },
  navInner:      { maxWidth: "1000px", margin: "0 auto", display: "flex", alignItems: "center" },
  navLogo:       { color: C.white, fontWeight: "bold", fontSize: "14px", padding: "7px 12px", textDecoration: "none", borderRight: "1px solid #2563eb", whiteSpace: "nowrap" },
  navLink:       { color: "#bfdbfe", fontSize: "11px", padding: "7px 10px", textDecoration: "none", borderRight: "1px solid #2563eb", display: "inline-block" },
  navLinkActive: { color: C.white, background: "#1e3a8a", fontWeight: "bold" },
  wrap:          { maxWidth: "1000px", margin: "0 auto", padding: "4px", background: C.bg },
  topBar:        { background: C.surface, color: C.text, fontSize: "10px", padding: "4px 6px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}` },
  dateBar:       { display: "flex", gap: "3px", alignItems: "center", padding: "4px 6px", borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt },
  dateBtn:       { background: C.surface, border: `1px solid ${C.border}`, color: C.textDim, padding: "2px 10px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" },
  dateBtnActive: { background: C.blueNav, border: `1px solid ${C.blue}`, color: C.white, padding: "2px 10px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" },
  grid:          { display: "flex", flexDirection: "column" },
  leagueBox:     { border: `1px solid ${C.border}`, borderTop: "none", background: C.surface },
  leagueHead:    { background: C.blueNav, color: C.white, padding: "4px 8px", fontSize: "11px", fontWeight: "bold", display: "flex", justifyContent: "space-between", alignItems: "center" },
  leagueHeadLink:{ color: C.white, textDecoration: "none", fontWeight: "bold", fontSize: "11px" },
  statusLive:    { color: C.green, fontWeight: "bold", fontSize: "10px" },
  statusFinal:   { color: C.red, fontSize: "10px" },
  statusPending: { color: C.amber, fontSize: "10px" },
  golesRow:      { display: "grid", gridTemplateColumns: "1fr 1fr", fontSize: "10px", color: C.textMuted, marginTop: "2px" },
  globalBadge:   { fontSize: "10px", color: C.textMuted, textAlign: "center", borderTop: `1px solid ${C.borderSub}`, padding: "2px 0" },
  redCard:       { display: "inline-block", width: "6px", height: "9px", background: C.red, marginLeft: "2px", verticalAlign: "middle" },
  searchWrap:    { position: "relative", display: "inline-block" },
  searchInput:   { background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.text, padding: "3px 7px", fontSize: "11px", width: "190px", outline: "none" },
  dropdown:      { position: "absolute", top: "100%", left: 0, zIndex: 100, background: C.surface, border: `1px solid ${C.border}`, width: "220px", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" },
  dropdownItem:  { padding: "5px 8px", cursor: "pointer", borderBottom: `1px solid ${C.borderSub}`, fontSize: "11px", color: C.text, background: "none", border: "none", width: "100%", textAlign: "left", display: "block" },
  fixtureBox:    { border: `1px solid ${C.border}`, borderTop: "none", background: C.surface },
  fixtureHead:   { background: C.amber, color: "#111111", padding: "3px 8px", fontSize: "11px", fontWeight: "bold", display: "flex", justifyContent: "space-between", alignItems: "center" },
  closeBtn:      { background: C.red, border: "none", color: C.white, padding: "1px 6px", fontSize: "10px", cursor: "pointer", fontWeight: "bold" },
  errorBox:      { background: "rgba(239,68,68,0.1)", border: `1px solid ${C.red}`, color: C.red, padding: "4px 8px", fontSize: "11px", marginBottom: "4px" },
  loading:       { padding: "16px", textAlign: "center", color: C.textMuted, fontSize: "11px" },
  noMatches:     { padding: "16px", textAlign: "center", color: C.textMuted, border: `1px solid ${C.border}`, fontSize: "11px" },
  footer:        { borderTop: `1px solid ${C.border}`, padding: "6px", textAlign: "center", color: C.textMuted, fontSize: "10px" },
};

function normalizarNombre(league) {
  return league?.name || league?.nombre || league?.title || "Partidos";
}

function obtenerCompetition(league) {
  const n = (league?.name || league?.nombre || league?.title || "").toLowerCase();
  if (n.includes("libertadores")) return "libertadores";
  if (n.includes("sudamericana")) return "sudamericana";
  if (n.includes("copa argentina")) return "copa_argentina";
  if (n.includes("champions")) return "champions";
  if (n.includes("europa league")) return "europa_league";
  if (n.includes("conference")) return "conference_league";
  if (n.includes("reserva")) return "reserva";
  if (n.includes("femenin")) return "argentina";
  if (n.includes("primera nacional")) return "primera_nacional";
  if (n.includes("primera b metro") || n.includes("primera b metropolitana")) return "primera_b_metro";
  if (n.includes("primera c")) return "primera_c";
  if (n.includes("betplay") || n.includes("colombia")) return "colombia";
  if (n.includes("mls") || n.includes("major league soccer")) return "mls";
  if (n.includes("nations league")) return "nations_league";
  if (n.includes("copa de primera") || n.includes("paraguay")) return "paraguay";
  if (n.includes("liga mx") || n.includes("mexico")) return "mexico";
  if (n.includes("brasileirao") || n.includes("brasil")) return "brasil";
  if (n.includes("liga de primera") || n.includes("chile")) return "chile";
  if (n.includes("liga auf uruguaya") || n.includes("uruguay")) return "uruguay"
  return "argentina";
}

function nombreEquipo(team) {
  if (typeof team === "string") return team;
  return team?.name || team?.short_name || team?.team_name || "Equipo";
}

function logoEquipo(team) {
  return team?.logo || team?.image || team?.icon || team?.symbol || null;
}

// Mapa explícito ID Promiedos → archivo de escudo
const ESCUDOS_POR_ID = {
  // ---- Primera ----
  ihc:   "velez-sarsfield",
  hcbh:  "defensa-y-justicia",
  bbjbf: "gimnasia-mendoza",
  hchc:  "instituto",
  igg:   "boca-juniors",
  ihe:   "independiente",
  igj:   "lanus",
  hcag:  "union",
  ihh:   "newells-old-boys",
  igf:   "san-lorenzo",
  igh:   "estudiantes-de-la-plata",
  bbjea: "deportivo-riestra",
  hcah:  "platense",
  jche:  "talleres",
  beafh: "central-cordoba-sde",
  ihb:   "argentinos-juniors",
  hbbh:  "sarmiento",
  iia:   "gimnasia-la-plata",
  ihf:   "rosario-central",
  hcch:  "independiente-rivadavia",
  fhid:  "belgrano",
  igi:   "river-plate",
  gbfc:  "atletico-tucuman",
  iie:   "huracan",
  iid:   "tigre",
  jafb:  "barracas-central",
  ihi:   "banfield",
  bheaf: "estudiantes-rio-cuarto",
  hccd:  "aldosivi",
  ihg:   "racing-club",
  // ---- Reserva ----
  ghjbi: "river-plate",
  ghjec: "sarmiento",
  ghjef: "velez-sarsfield",
  ghjej: "gimnasia-la-plata",
  ghjbg: "rosario-central",
  ghjfd: "talleres",
  jdach: "gimnasia-mendoza",
  ghjbc: "union",
  ghjeb: "godoy-cruz",
  hdbeb: "instituto",
  ghjbh: "racing-club",
  ghjfi: "san-lorenzo",
  gjdeb: "tigre",
  ghjbd: "atletico-tucuman",
  ghjei: "aldosivi",
  ghjbe: "banfield",
  ghjbj: "argentinos-juniors",
  gjdec: "barracas-central",
  ghjfh: "independiente",
  ghjfc: "lanus",
  ghjee: "boca-juniors",
  jdacg: "estudiantes-rio-cuarto",
  ghjbf: "estudiantes-de-la-plata",
  hdbea: "belgrano",
  jdebj: "atletico-rafaela",
  hiihd: "deportivo-riestra",
  jdeca: "quilmes",
  ghjff: "huracan",
  ghjfg: "defensa-y-justicia",
  ghjeh: "central-cordoba-sde",
  hcbec: "san-martin-de-san-juan",
  ghjed: "newells-old-boys",
  hiihe: "independiente-rivadavia",
  ghjfa: "platense",
  ghjfb: "colon",
  ijeji: "ferro-carril-oeste",
  // ---- MLS ----
  fbbcg: "nashville-sc",
  bddh:  "new-england-revolution",
  fehcj: "inter-miami",
  gjbii: "charlotte-fc",
  bddd:  "chicago-fire",
  hdge:  "philadelphia-union",
  bccae: "orlando-city-sc",
  bddi:  "new-york-red-bulls",
  cfcih: "fc-cincinnati",
  cagcc: "new-york-city-fc",
  bddj:  "dc-united",
  bddg:  "toronto-fc",
  bdde:  "columbus-crew",
  daejj: "atlanta-united",
  jbch:  "cf-montreal",
  idij:  "vancouver-whitecaps",
  bdeg:  "houston-dynamo",
  ceehe: "st-louis-city-sc",
  bdeb:  "fc-dallas",
  bdef:  "san-jose-earthquakes",
  fbbhi: "los-angeles-fc",
  bdea:  "colorado-rapids",
  bdec:  "los-angeles-galaxy",
  fjbg:  "portland-timbers",
  iahhi: "san-diego-fc",
  ghjah: "austin-fc",
  bdee:  "real-salt-lake",
  bdeh:  "seattle-sounders",
  bccai: "minnesota-united",
  bddf:  "sporting-kc",

  // ---- Liga MX (México) ----
  cahi:  "toluca",
  bcfj:  "chivas",
  bcff:  "club-america",
  bcgb:  "cruz-azul",
  fjje:  "queretaro",
  jddj:  "leon",
  ifai:  "club-tijuana",
  bcfc:  "puebla",
  bcfi:  "atlas-fc",//
  bcfh:  "monterrey",
  bcfa:  "pachuca",
  bcej:  "pumas-unam",
  bcga:  "atletico-san-luis",
  caih:  "atlante",
  bcgd:  "necaxa",
  bcge:  "tigres-uanl",
  bcfe:  "santos-laguna",
  cfbej: "juarez",

  // ---- Liga BetPlay (Colombia) ----
  igef:  "america-de-cali",
  igdh:  "millonarios",
  iged:  "independiente-medellin",
  igea:  "atletico-nacional",
  igdj:  "deportivo-cali",
  bacce: "atletico-bucaramanga",
  hgdf:  "deportes-tolima",
  hgee:  "independiente-santa-fe",
  badhi: "llaneros-fc",
  hcij:  "once-caldas",
  caieb: "aguilas-doradas",
  ifec:  "internacional-bogota",
  igde:  "cucuta-deportivo",
  jiee:  "fortaleza-fc",
  jaei:  "deportivo-pasto",
  bacaj: "alianza-fc",
  igeb:  "boyaca-chico",
  igdi:  "deportivo-pereira",
  badhh: "jaguares-de-cordoba",
  hcae:  "junior-fc",

  // ---- Copa de Primera (Paraguay) ----
  bcig:  "libertad",
  ifei:  "olimpia",
  bcia:  "club-nacional",
  begec: "2-de-mayo",
  begea: "sportivo-trinidense",
  hhdj:  "club-guarani",
  fgfii: "sportivo-ameliano",
  bcje:  "cerro-porteno",
  ihhi:  "sportivo-luqueno",
  ihhe:  "rubio-nu",
  fdcaj: "cd-recoleta",
  begde: "cs-san-lorenzo",

  // ---- Primera Nacional ----
  hcbi:  "ferro-carril-oeste",
  hbba:  "moron",
  ihd:   "godoy-cruz",
  bbjbh: "deportivo-madryn",
  iha:   "colon",
  hbbc:  "almirante-brown",
  hbbg:  "estudiantes-de-buenos-aires",
  ghjha: "ciudad-de-bolivar",
  hbai:  "los-andes",
  bdiha: "chaco-for-ever",
  hbid:  "defensores-de-belgrano",
  jcih:  "racing-de-cordoba",
  hhij:  "all-boys",
  bbjcd: "mitre",
  jiaj:  "central-norte",
  bbiji: "san-miguel",
  hbbb:  "san-telmo",
  hbbi:  "acassuso",
  hbbd:  "tristan-suarez",
  hbac:  "temperley",
  iib:   "gimnasia-de-jujuy",
  hbae:  "atlanta",
  bbjcj: "midland",
  hcai:  "san-martin-de-san-juan",
  jchi:  "gimnasia-y-tiro",
  fjgi:  "atletico-rafaela",
  jcid:  "maipu",
  hbaf:  "colegiales",
  hchb:  "san-martin-de-tucuman",
  bbjce: "agropecuario",
  hccf:  "quilmes",
  hbag:  "almagro",
  bcai:  "nueva-chicago",
  iche:  "patronato",
  gbjg:  "chacarita-juniors",
  cijej: "guemes",

  // ---- Primera B Metropolitana ----
  baheh: "excursionistas",      
  fjbd:  "arsenal-de-llavallol",              
  bbijj: "talleres-de-remedios-de-escalada",  
  bheac: "camioneros",          
  jiai:  "villa-dalmine",       
  hccg:  "sportivo-italiano",   
  ejhdc: "real-pilar",        
  hbaj:  "armenio",             
  hbca:  "comunicaciones",    
  bbiic: "laferrere",         
  bedhe: "san-martin-de-burzaco",  
  bbiie: "dock-sud",                
  bdgid: "argentino-de-merlo",  
  hccc:  "deportivo-merlo",     
  hbah:  "san-carlos",          
  bbjdg: "argentino-de-quilmes", 
  bbjdi: "liniers",             
  hbbe:  "flandria",            
  bbjdc: "cadu",                
  hbbj:  "brown-de-adrogue",  
  bbgcj: "uai-urquiza",       
  bbjdd: "ituzaingo",

  
    // ---- Primera C ----
  bbihj: "sacachispas",
  bbiia: "berazategui",
  bedhd: "lugano",
  bbjee: "centro-espanol",
  bejfe: "juventud-unida-de-san-miguel",
  hjbfb: "estrella-del-sur",  
  gjiac: "mercedes",
  bbjdh: "victoriano-arenas",
  bbjab: "puerto-nuevo",
  bbijg: "cambaceres",
  bbjed: "paraguayo",
  bfjej: "juan-jose-de-urquiza",
  bbjac: "leandro-n-alem",
  bbjdj: "argentino-de-rosario",
  bbjaa: "lujan",
  bbjef: "canuelas",
  hbad:  "deportivo-espanol",
  jcbji: "leones-de-rosario",
  hbbf:  "central-cordoba-de-rosario",
  jaff:  "lamadrid",
  bedhb: "sportivo-barracas",
  bedhc: "central-ballester",
  bbjde: "atlas",
  bbjec: "el-porvenir",
  bbjdf: "yupanqui",
  bbijh: "claypole",
  bdgjd: "fenix",
  bedhh: "muniz",

// ---- Brasileirao (Brasil) ----
  bcbf:  "flamengo",
  bccc:  "palmeiras",
  bcba:  "athletico-paranaense",
  bcbg:  "fluminense",
  bhgh:  "bahia",
  bcbd:  "cruzeiro",
  bcaj:  "atletico-mineiro",
  bcce:  "santos",
  bcbc:  "coritiba",
  bchd:  "rb-bragantino",
  bccf:  "sao-paulo",
  bcbb:  "botafogo",
  bcci:  "vitoria",
  bcgh:  "corinthians",
  bcgj:  "mirassol",
  bcch:  "vasco-da-gama",
  bcbi:  "gremio",
  bcbj:  "internacional",
  hdid:  "remo",
  hdih:  "chapecoense",

  // ---- Liga de Primera  (Chile) ----
  bcdj:  "colo-colo",
  bcef:  "u-catolica",
  ifeb:  "universidad-de-chile",
  bcda:  "everton-de-vina",
  bcdi:  "palestino",
  fbjie: "deportes-limache",
  bcee:  "nublense",
  igcj:  "deportes-concepcion",
  bcdh:  "deportes-la-serena",
  igcf:  "coquimbo-unido",
  bccj:  "audax-italiano",
  bcdc:  "huachipato",
  bcde:  "o-higgins",
  bcdb:  "cobresal",
  bceh:  "u-de-concepcion",
  ieaj:  "u-la-calera",

  // ---- Primera División (Uruguay) ----
  bcghf: "montevideo-city-torque",
  idfi:  "liverpool-montevideo",
  hehh:  "cerro",
  hhgg:  "penarol",
  babjc: "juventud",
  haih:  "racing-club-montevideo",
  beagc: "deportivo-maldonado",
  hehi:  "nacional",
  igbe:  "montevideo-wanderers",
  babjb: "progreso",
  bcghd: "boston-river",
  igbi:  "cerro-largo",
  hgdj:  "defensor-sporting",
  babjd: "central-espanol",
  igbb:  "danubio-fc",
  fbfcc: "albion",

  // ---- UEFA Nations League ----
  fagb:  "france",
  cdhf:  "italy",
  cdhd:  "belgium",
  faeh:  "turkiye",
  cdhc:  "germany",
  cdhh:  "netherlands",
  cdhe:  "serbia",
  fada:  "greece",
  fafa:  "spain",
  faff:  "croatia",
  fafe:  "england",
  faea:  "czech-republic",
  faci:  "portugal",
  fach:  "denmark",
  cdhg:  "norway",
  faed:  "wales",
  fagj:  "scotland",
  fadc:  "switzerland",
  faeb:  "slovenia",
  fagi:  "north-macedonia",
  facg:  "hungary",
  fafh:  "ukraine",
  fagg:  "georgia",
  fadh:  "northern-ireland",
  fade:  "israel",
  fafj:  "austria",
  fage:  "ireland",
  bjebe: "kosovo",
  fadi:  "poland",
  faei:  "bosnia-herzegovina",
  faga:  "romania",
  cdhb:  "sweden",
  facj:  "albania",
  faef:  "finland",
  fafd:  "belarus",
  fadg:  "san-marino",
  fagd:  "montenegro",
  faej:  "armenia",
  fagf:  "cyprus",
  cdaa:  "latvia",
  fafg:  "kazakhstan",
  fadj:  "slovakia",
  fafi:  "faroe-islands",
  fadb:  "moldova",
  fagh:  "iceland",
  fagc:  "bulgaria",
  fafb:  "estonia",
  fadd:  "luxembourg",
  fadf:  "malta",
  bchhf: "gibraltar",
  fafc:  "andorra",
  cdbc:  "lithuania",
  faec:  "azerbaijan",
  faeg:  "liechtenstein"

};

function escudoLocal(team) {
  const remoto = logoEquipo(team);
  if (remoto) return remoto;
  // Primero intentar por ID (evita colisiones de nombre)
  const id = team?.id || team?.team_id || team?.teamId;
  if (id && ESCUDOS_POR_ID[id]) return `/escudos/${ESCUDOS_POR_ID[id]}.png`;
  // Fallback por nombre slugificado
  const nombre = nombreEquipo(team);
  if (!nombre || nombre === "Equipo") return null;
  const slug = nombre
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `/escudos/${slug}.png`;
}

function obtenerScore(game, i) {
  if (Array.isArray(game?.scores)) return game.scores[i] ?? "-";
  return "-";
}

function obtenerEquipo(game, i) {
  return game?.teams?.[i] || {};
}

function obtenerTarjetasRojas(team) {
  const n = Number(team?.red_cards || 0);
  return Number.isNaN(n) || n <= 0 ? 0 : n;
}

function obtenerGoles(team) {
  return Array.isArray(team?.goals) ? team.goals : [];
}

function obtenerNombreGol(goal) {
  return goal?.player_sname || goal?.player_name || goal?.player || goal?.name || "Gol";
}

function obtenerMinutoGol(goal) {
  if (goal?.time_to_display != null && goal.time_to_display !== "") return String(goal.time_to_display);
  if (goal?.time != null && goal.time !== "") return `${goal.time}'`;
  if (goal?.minute != null && goal.minute !== "") return `${goal.minute}'`;
  if (goal?.min != null && goal.min !== "") return `${goal.min}'`;
  return "";
}

function obtenerTV(game) {
  return Array.isArray(game?.tv_networks) ? game.tv_networks : [];
}

function obtenerGlobal(game) {
  if (!game?.global) return null;
  const g = game.global;
  let a = g.score1 ?? g.team1?.score;
  let b = g.score2 ?? g.team2?.score;
  if (a == null || b == null) return null;
  return { scoreA: a, scoreB: b };
}

function obtenerMinutoLive(game) {
  const src = game?.game_time_to_display || game?.game_time_status_to_display || game?.game_time;
  if (src != null && src !== "") {
    const txt = String(src).toLowerCase();
    // Detectar entretiempo por palabras clave o por minuto 45 sin tiempo corrido
    if (
      txt.includes("ht") ||
      txt.includes("half") ||
      txt.includes("et") ||
      txt.includes("entretiempo") ||
      txt.includes("descanso") ||
      txt.includes("interval")
    ) return "ET";
    const m = txt.match(/(\d{1,3})/);
    if (m) return parseInt(m[1], 10);
  }
  // Fallback: si status.name contiene HT
  const statusName = String(game?.status?.name || "").toLowerCase();
  if (statusName.includes("ht") || statusName.includes("half") || statusName.includes("entretiempo")) return "ET";
  return null;
}

function obtenerFechaObjeto(game) {
  const v = game?.date || game?.datetime || game?.start_time || game?.startTime || game?.kickoff || game?.timestamp || game?.start;
  if (v == null || v === "") return null;
  if (typeof v === "number") {
    const ts = v < 10000000000 ? v * 1000 : v;
    const d = new Date(ts);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatearHoraArgentina(game) {
  const d = obtenerFechaObjeto(game);
  if (d) {
    try {
      return d.toLocaleTimeString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", hour: "2-digit", minute: "2-digit", hour12: false });
    } catch {}
  }
  return game?.time || game?.hour || null;
}

// Promiedos entrega los horarios con un desfase que depende de desde dónde corre el sync.
// Ajustá SOLO este valor (en horas) si los horarios se ven corridos:
//   0 = los horarios ya vienen en hora argentina
//   2 = vienen 2 horas atrasados (caso actual)
const AJUSTE_HORAS_PROMIEDOS = 2;

// Suma horas (positivas o negativas) a una fecha/hora y resuelve cambios de día/mes/año.
function corregirFechaHora(dia, mes, anio, hh, mm) {
  const d = new Date(Date.UTC(anio, mes - 1, dia, hh + AJUSTE_HORAS_PROMIEDOS, mm));
  const p = n => String(n).padStart(2, "0");
  return {
    dia: p(d.getUTCDate()),
    mes: p(d.getUTCMonth() + 1),
    anio: d.getUTCFullYear(),
    hora: `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`,
  };
}

function hoyArgentina() {
  const hoy = {};
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(new Date()).forEach(p => { hoy[p.type] = p.value; });
  return hoy;
}

function formatearHora(game) {
  // start_time viene como "DD-MM-YYYY HH:MM"
  if (game?.start_time) {
    const txt = String(game.start_time).trim();
    const m = txt.match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})/);
    if (m) {
      const c = corregirFechaHora(+m[1], +m[2], +m[3], +m[4], +m[5]);
      const hoy = hoyArgentina();
      const esHoy = c.dia === hoy.day && c.mes === hoy.month && String(c.anio) === hoy.year;
      return esHoy ? c.hora : `${c.dia}/${c.mes} ${c.hora}`;
    }
  }
  const hora = formatearHoraArgentina(game);
  if (hora && hora !== "--:--") return hora;
  return "--:--";
}

function obtenerEstado(game) {
  const e = game?.status || {};
  const en = Number(e?.enum);
  if (en === 2) {
    const min = obtenerMinutoLive(game);
    let textoMin;
    if (min === "ET") {
      textoMin = "ET";
    } else if (min === 45) {
      // Promiedos congela el minuto en 45 durante el entretiempo
      textoMin = "ET";
    } else {
      textoMin = min !== null ? `${min}'` : "EN VIVO";
    }
    return { texto: textoMin, tipo: "live" };
  }
  if (en === 3) return { texto: "FINAL", tipo: "final" };
  const hora = formatearHora(game);
  if (hora && hora !== "--:--") return { texto: hora, tipo: "pending" };
  const d = obtenerFechaObjeto(game);
  if (d) {
    try {
      const txt = d.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
      if (txt) return { texto: txt, tipo: "pending" };
    } catch {}
  }
  return { texto: "Prog.", tipo: "pending" };
}

function obtenerRivalFixture(f) {
  return f?.opponent || f?.rival || f?.opponent_name || f?.rival_name || f?.vs || f?.team_opponent || f?.teamOpponent || "";
}

function obtenerCondicionFixture(f) {
  const c = String(f?.condicion || f?.homeAway || f?.home_away || f?.condition || f?.local_visitante || f?.localVisitante || "").trim().toUpperCase();
  if (c === "L" || c.includes("LOCAL")) return "L";
  if (c === "V" || c.includes("VISIT")) return "V";
  return "";
}

function obtenerFechaHoraFixture(f) {
  const fechaRaw = f?.date || f?.fecha || f?.day || "--/--";
  const horaRaw = f?.hora || f?.time || f?.hour || f?.start_time || "--:--";
  const mf = String(fechaRaw).trim().match(/^(\d{1,2})\/(\d{1,2})$/);
  const mh = String(horaRaw).trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!mf || !mh) return { fecha: fechaRaw, hora: horaRaw };
  const anio = Number(hoyArgentina().year);
  const c = corregirFechaHora(+mf[1], +mf[2], anio, +mh[1], +mh[2]);
  return { fecha: `${c.dia}/${c.mes}`, hora: c.hora };
}
function obtenerFechaFixture(f) { return obtenerFechaHoraFixture(f).fecha; }
function obtenerHoraFixture(f) { return obtenerFechaHoraFixture(f).hora; }
function obtenerCompetenciaFixture(f) { return f?.competencia || f?.competition || f?.league || f?.tournament || ""; }

function EscudoImg({ team }) {
  const src = escudoLocal(team);
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      width="32"
      height="32"
      style={{ objectFit: "contain", verticalAlign: "middle", flexShrink: 0 }}
      onError={e => { e.currentTarget.style.display = "none"; }}
    />
  );
}

export default function Home() {
  const [date, setDate] = useState("today");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamFixtures, setTeamFixtures] = useState([]);
  const [teamFixturesLoading, setTeamFixturesLoading] = useState(false);

  async function cargarPartidos() {
    try {
      setError("");
      const res = await fetch(`/api/matches?date=${date}`, { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudieron cargar los partidos.");
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (err) {
      setError(err.message || "Error cargando partidos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { setLoading(true); cargarPartidos(); }, [date]);
  useEffect(() => { const t = setInterval(cargarPartidos, 30000); return () => clearInterval(t); }, [date]);

  useEffect(() => {
    fetch("/api/team-fixture?list=true", { cache: "no-store" })
      .then(r => r.json())
      .then(j => setTeams(Array.isArray(j) ? j : []))
      .catch(() => {});
  }, []);

  const equiposFiltrados = useMemo(() => {
    const txt = search.trim().toLowerCase();
    if (!txt) return [];
    return teams.filter(t => (t.name || t.nombre || "").toLowerCase().includes(txt)).slice(0, 10);
  }, [search, teams]);

  async function seleccionarEquipo(team) {
    setSelectedTeam(team);
    setSearch(team.name || team.nombre || "");
    setTeamFixtures([]);
    try {
      setTeamFixturesLoading(true);
      const id = team.id || team.team_id || team.teamId;
      const res = await fetch(`/api/team-fixture?team=${encodeURIComponent(id)}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setTeamFixtures(Array.isArray(json) ? json : Array.isArray(json.fixtures) ? json.fixtures : Array.isArray(json.matches) ? json.matches : []);
    } catch {
      setTeamFixtures([]);
    } finally {
      setTeamFixturesLoading(false);
    }
  }

  const hayPartidos = data.some(l => Array.isArray(l?.games) && l.games.length > 0);

  // Ligas con partidos
  const ligasConPartidos = useMemo(
    () => data.filter(l => Array.isArray(l?.games) && l.games.length > 0),
    [data]
  );

  // Set de ligas ocultas (clave = key||id||index)
  const [ligasOcultas, setLigasOcultas] = useState(new Set());

  // Resetear filtros cuando cambia la fecha
  useEffect(() => { setLigasOcultas(new Set()); }, [date]);

  function toggleLiga(key) {
    setLigasOcultas(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  return (
    <div style={S.page}>

      {/* NAVBAR */}
   <div style={S.navbar}>
  <div style={S.navInner}>
    <a href="/" style={{ ...S.navLogo, display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
      <img 
        src="/logo.png" 
        alt="Secanuca" 
        style={{ height: "74px", width: "auto", objectFit: "contain", display: "block" }} 
        onError={e => { e.currentTarget.style.display = "none"; }} 
      />
    </a>
  </div>
</div>
      <div style={S.wrap}>

        {/* BARRA SUPERIOR */}
        <div style={S.topBar}>
          <span style={{ fontWeight: "bold" }}>RESULTADOS Y PARTIDOS EN VIVO</span>
          <div style={S.searchWrap}>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); if (selectedTeam) { setSelectedTeam(null); setTeamFixtures([]); } }}
              placeholder="Buscar equipo..."
              style={S.searchInput}
            />
            {search.trim() && !selectedTeam && equiposFiltrados.length > 0 && (
              <div style={S.dropdown}>
                {equiposFiltrados.map(t => (
                  <button key={t.id || t.name} onClick={() => seleccionarEquipo(t)} style={S.dropdownItem}>
                    {t.name || t.nombre}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* FIXTURE EQUIPO */}
        {selectedTeam && (
          <div style={S.fixtureBox}>
            <div style={S.fixtureHead}>
              <span>⚽ PRÓXIMOS PARTIDOS: {(selectedTeam.name || selectedTeam.nombre || "").toUpperCase()}</span>
              <button style={S.closeBtn} onClick={() => { setSelectedTeam(null); setTeamFixtures([]); setSearch(""); }}>X</button>
            </div>
            {teamFixturesLoading ? (
              <div style={S.loading}>Cargando fixture...</div>
            ) : teamFixtures.length === 0 ? (
              <div style={S.loading}>Sin próximos partidos.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.surfaceAlt }}>
                    <th style={{ padding: "3px 5px", textAlign: "left", borderBottom: `1px solid ${C.border}`, color: C.textMuted, fontSize: 10, width: "50px" }}>Fecha</th>
                    <th style={{ padding: "3px 5px", textAlign: "center", borderBottom: `1px solid ${C.border}`, color: C.textMuted, fontSize: 10, width: "20px" }}>L/V</th>
                    <th style={{ padding: "3px 5px", textAlign: "right", borderBottom: `1px solid ${C.border}`, color: C.textMuted, fontSize: 10 }}>Local</th>
                    <th style={{ padding: "3px 5px", textAlign: "center", borderBottom: `1px solid ${C.border}`, color: C.textMuted, fontSize: 10, width: "50px" }}>Hora</th>
                    <th style={{ padding: "3px 5px", textAlign: "left", borderBottom: `1px solid ${C.border}`, color: C.textMuted, fontSize: 10 }}>Visitante</th>
                    <th style={{ padding: "3px 5px", textAlign: "right", borderBottom: `1px solid ${C.border}`, color: C.textMuted, fontSize: 10 }}>Competencia</th>
                  </tr>
                </thead>
                <tbody>
                  {teamFixtures.map((f, i) => {
                    const rival = obtenerRivalFixture(f);
                    const cond = obtenerCondicionFixture(f);
                    const local = cond === "V" ? rival : (selectedTeam.name || selectedTeam.nombre || "");
                    const visita = cond === "V" ? (selectedTeam.name || selectedTeam.nombre || "") : rival;
                    const esLocal = cond !== "V";
                    return (
                      <tr key={f?.id || `${i}`} style={{ background: i % 2 === 0 ? C.surface : C.surfaceAlt, borderBottom: `1px solid ${C.borderSub}` }}>
                        <td style={{ padding: "3px 5px", color: C.textMuted }}>{obtenerFechaFixture(f)}</td>
                        <td style={{ padding: "3px 5px", textAlign: "center", fontWeight: "bold", color: cond === "L" ? C.green : cond === "V" ? C.blue : C.textMuted }}>{cond}</td>
                        <td style={{ padding: "3px 5px", textAlign: "right", fontWeight: esLocal ? "bold" : "normal", color: esLocal ? C.white : C.textDim }}>{local}</td>
                        <td style={{ padding: "3px 5px", textAlign: "center", fontWeight: "bold", color: C.amber }}>{obtenerHoraFixture(f)}</td>
                        <td style={{ padding: "3px 5px", fontWeight: !esLocal ? "bold" : "normal", color: !esLocal ? C.white : C.textDim }}>{visita}</td>
                        <td style={{ padding: "3px 5px", textAlign: "right", color: C.textMuted, fontSize: "10px" }}>{obtenerCompetenciaFixture(f)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* FILTROS DE LIGAS */}
        {!loading && hayPartidos && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", padding: "5px 6px", background: C.surfaceAlt, borderBottom: `1px solid ${C.border}` }}>
            {ligasConPartidos.map((league, li) => {
              const key = league?.key || league?.id || String(li);
              const nombre = normalizarNombre(league);
              const oculta = ligasOcultas.has(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleLiga(key)}
                  style={{
                    padding: "2px 8px",
                    fontSize: "10px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    border: `1px solid ${oculta ? C.border : C.blue}`,
                    borderRadius: "3px",
                    background: oculta ? C.surface : "rgba(59,130,246,0.15)",
                    color: oculta ? C.textMuted : C.blue,
                    textDecoration: oculta ? "line-through" : "none",
                    opacity: oculta ? 0.5 : 1,
                    transition: "all 0.15s",
                  }}
                >
                  {nombre}
                </button>
              );
            })}
          </div>
        )}

        {/* SELECTOR FECHA */}
        <div style={S.dateBar}>
          <span style={{ fontWeight: "bold", marginRight: "4px", color: C.textMuted, fontSize: "10px" }}>VER:</span>
          {[["ayer", "◀ AYER"], ["today", "HOY"], ["manana", "MAÑANA ▶"]].map(([v, l]) => (
            <button key={v} onClick={() => setDate(v)} style={date === v ? S.dateBtnActive : S.dateBtn}>{l}</button>
          ))}
        </div>

        {error && <div style={S.errorBox}>⚠ {error}</div>}

        {loading ? (
          <div style={S.loading}>Cargando partidos...</div>
        ) : !hayPartidos ? (
          <div style={S.noMatches}>No hay partidos para esta fecha.</div>
        ) : (
          <div style={S.grid}>
            <div style={{ borderTop: `1px solid ${C.border}` }} />
            {data.map((league, li) => {
              const games = Array.isArray(league?.games) ? league.games : [];
              if (games.length === 0) return null;
              const key = league?.key || league?.id || String(li);
              if (ligasOcultas.has(key)) return null;
              const comp = obtenerCompetition(league);
              const nombre = normalizarNombre(league);
              return (
                <div key={key} style={S.leagueBox}>
                  <div style={S.leagueHead}>
                    <Link href={`/posiciones?competition=${comp}`} style={S.leagueHeadLink}>
                      ▶ {nombre.toUpperCase()}
                    </Link>
                    <span style={{ fontSize: "10px", fontWeight: "normal" }}>{games.length} partidos</span>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      {games.map((game, gi) => {
                        const estado = obtenerEstado(game);
                        const teamA = obtenerEquipo(game, 0);
                        const teamB = obtenerEquipo(game, 1);
                        const scoreA = obtenerScore(game, 0);
                        const scoreB = obtenerScore(game, 1);
                        const global = obtenerGlobal(game);
                        const golesA = obtenerGoles(teamA);
                        const golesB = obtenerGoles(teamB);
                        const rojasA = obtenerTarjetasRojas(teamA);
                        const rojasB = obtenerTarjetasRojas(teamB);
                        const tv = obtenerTV(game);
                        const isLive = estado.tipo === "live";
                        const isFinal = estado.tipo === "final";
                        const rowBg = gi % 2 === 0 ? C.surface : C.surfaceAlt;
                        return (
                          <tr key={game?.id || gi} style={{ background: rowBg, borderBottom: "1px solid #e5e7eb" }}>
                            {/* ESTADO */}
                            <td style={{ width: "72px", minWidth: "72px", maxWidth: "72px", padding: "4px 3px", textAlign: "center", borderRight: `1px solid ${C.borderSub}`, verticalAlign: "middle" }}>
                              {isLive && <span style={{ display: "inline-block", width: "5px", height: "5px", borderRadius: "50%", background: C.green, marginRight: "2px", verticalAlign: "middle" }} />}
                              <span style={isLive ? S.statusLive : isFinal ? S.statusFinal : S.statusPending}>
                                {isLive ? `⚽ ${estado.texto}` : estado.texto}
                              </span>
                            </td>
                            {/* PARTIDO */}
                            <td style={{ padding: "4px 6px", verticalAlign: "middle" }}>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 40px 1fr", alignItems: "center", gap: "2px" }}>
                                {/* LOCAL */}
                                <div style={{ textAlign: "right", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "3px" }}>
                                  {rojasA > 0 && Array.from({ length: rojasA }).map((_, k) => <span key={k} style={S.redCard} title="Tarjeta roja" />)}
                                  <span style={{ fontWeight: "bold", fontSize: "11px", color: isLive ? C.green : C.text }}>{nombreEquipo(teamA)}</span>
                                  <EscudoImg team={teamA} />
                                </div>
                                {/* MARCADOR */}
                                <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "13px", color: isLive ? C.green : isFinal ? C.textMuted : C.white, whiteSpace: "nowrap" }}>
                                  {scoreA} - {scoreB}
                                </div>
                                {/* VISITANTE */}
                                <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                                  <EscudoImg team={teamB} />
                                  <span style={{ fontWeight: "bold", fontSize: "11px", color: isLive ? C.green : C.text }}>{nombreEquipo(teamB)}</span>
                                  {rojasB > 0 && Array.from({ length: rojasB }).map((_, k) => <span key={k} style={S.redCard} title="Tarjeta roja" />)}
                                </div>
                              </div>
                              {/* GLOBAL */}
                              {global && (
                                <div style={S.globalBadge}>
                                  Global: <strong>{global.scoreA} - {global.scoreB}</strong>
                                </div>
                              )}
                              {/* GOLES */}
                              {(golesA.length > 0 || golesB.length > 0) && (
                                <div style={S.golesRow}>
                                  <div style={{ textAlign: "right", paddingRight: "4px" }}>
                                    {golesA.map((g, k) => (
                                      <span key={k} style={{ marginLeft: "4px" }}>
                                        ⚽ {obtenerNombreGol(g)}{obtenerMinutoGol(g) ? ` ${obtenerMinutoGol(g)}` : ""}
                                      </span>
                                    ))}
                                  </div>
                                  <div style={{ paddingLeft: "4px" }}>
                                    {golesB.map((g, k) => (
                                      <span key={k} style={{ marginRight: "4px" }}>
                                        ⚽ {obtenerNombreGol(g)}{obtenerMinutoGol(g) ? ` ${obtenerMinutoGol(g)}` : ""}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </td>
                            {/* TV */}
                            <td style={{ width: "90px", minWidth: "90px", maxWidth: "90px", padding: "4px 5px", textAlign: "right", verticalAlign: "middle", borderLeft: `1px solid ${C.borderSub}`, color: C.textMuted, fontSize: "10px", lineHeight: "1.4" }}>
                              {tv.map((n, k) => <div key={k}>{n?.name || n?.title || n}</div>)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}

        <div style={S.footer}>
          ChiquiFútbol &copy; {new Date().getFullYear()} &mdash; Resultados en tiempo real
        </div>
      </div>
    </div>
  );
}
