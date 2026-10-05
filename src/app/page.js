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
  refreshBtn:    { background: C.blueNav, border: `1px solid ${C.blue}`, color: C.white, padding: "2px 10px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" },
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
  globalBadge:   { fontSize: "9px", color: C.textMuted, textAlign: "center", padding: "2px 0 0", display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "5px", lineHeight: 1.2, whiteSpace: "nowrap" },
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
  if (n.includes("liga auf uruguaya") || n.includes("uruguay")) return "uruguay";
  if (n.includes("premier league")) return "premier_league";
  if (n.includes("efl cup") || n.includes("carabao")) return "efl_cup";
  if (n.includes("fa cup")) return "fa_cup";
  if (n.includes("laliga") || n.includes("la liga")) return "laliga";
  if (n.includes("copa del rey")) return "copa_del_rey";
  if (n.includes("supercopa") && n.includes("espa")) return "supercopa_espana";
  if (n.includes("serie a") && !n.includes("serie b")) return "serie_a";
  if (n.includes("coppa italia")) return "coppa_italia";
  if (n.includes("supercoppa")) return "supercoppa_italiana";
  if (n.includes("bundesliga")) return "bundesliga";
  if (n.includes("dfb") || n.includes("dfb-pokal")) return "dfb_pokal";
  if (n.includes("liga portugal") || n.includes("primeira liga")) return "liga_portugal";
  if (n.includes("ligue 1")) return "ligue_1";
  if (n.includes("coupe de france")) return "coupe_de_france";
  if (n.includes("mundial sub") || n.includes("u20 world") || n.includes("sub-20") || n.includes("sub 20")) return "u20_world_cup";
  if (n.includes("copa am")) return "copa_america";
  if (n.includes("eliminatorias conmebol") || n.includes("conmebol wc") || n.includes("conmebol-wc")) return "eliminatorias_conmebol";
  if (n.includes("eliminatorias uefa") || n.includes("uefa world cup qual") || n.includes("uefa wc")) return "eliminatorias_uefa";
  if (n.includes("eliminatorias concacaf") || n.includes("concacaf world cup qual") || n.includes("concacaf wc")) return "eliminatorias_concacaf";
  if (n.includes("eurocopa") || n.includes("euro 20") || n.includes("uefa euro")) return "euro";
  if (n.includes("repechaje") || n.includes("inter-confederation") || n.includes("inter confederation")) return "repechaje_mundial";
  if (n.includes("nations") || n.includes("naciones")) return "nations_league";
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

function extraerPenalesDesdeTexto(texto) {
  if (typeof texto !== "string") return null;

  const limpio = texto.trim().replace(/\u00A0/g, " ").replace(/\s+/g, " ");
  if (!limpio) return null;

  const patrones = [
    /\((\d+)\)\s*(\d+)\s*-\s*(\d+)\s*\(\s*(\d+)\)/i,
    /(\d+)\s*\)\s*(\d+)\s*-\s*(\d+)\s*\(\s*(\d+)/i,
    /(\d+)\s*[-:]\s*(\d+)\s*\(\s*(\d+)\s*[-:]\s*(\d+)\)/i,
    /\((\d+)\)\s*(\d+)\s*[-:]\s*(\d+)\s*\(\s*(\d+)\)/i,
    /\((\d+)\)\s*\d+\s*-\s*\d+\s*\(\s*(\d+)\)/i,
  ];

  for (const regex of patrones) {
    const match = limpio.match(regex);
    if (!match) continue;

    const a = Number(match[1] ?? match[match.length - 2]);
    const b = Number(match[match.length - 1]);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      return { a, b };
    }
  }

  const parens = [...limpio.matchAll(/\((\d+)\)/g)].map(m => Number(m[1]));
  if (parens.length >= 2) {
    const a = Number(parens[0]);
    const b = Number(parens[parens.length - 1]);
    if (Number.isFinite(a) && Number.isFinite(b)) return { a, b };
  }

  return null;
}

function obtenerParejaDesdeValor(valor) {
  if (valor == null || valor === "") return null;

  if (Array.isArray(valor)) {
    for (const item of valor) {
      const pair = obtenerParejaDesdeValor(item);
      if (pair) return pair;
    }
    const a = normalizarResultadoNumerico(valor[0]);
    const b = normalizarResultadoNumerico(valor[1]);
    if (a != null && b != null) return { a, b };
  }

  if (typeof valor === "object") {
    const pairs = [
      [valor.score1, valor.score2],
      [valor.scoreA, valor.scoreB],
      [valor.team1_score, valor.team2_score],
      [valor.home_score, valor.away_score],
      [valor.local_score, valor.visit_score],
      [valor.local, valor.visitor],
      [valor.team1, valor.team2],
      [valor.home, valor.away],
      [valor.score?.[0], valor.score?.[1]],
      [valor.scores?.[0], valor.scores?.[1]],
      [valor.result?.[0], valor.result?.[1]],
      [valor.penalty_score, valor.penalty_score_away],
      [valor.penalty_score?.home, valor.penalty_score?.away],
      [valor.penalties?.home, valor.penalties?.away],
      [valor.penalty?.score1, valor.penalty?.score2],
      [valor.penalty?.home, valor.penalty?.away],
      [valor?.scores_score, valor?.score_result],
      [valor?.scores_result, valor?.score_score],
      [valor?.penalties_score, valor?.score_penalties],
      [valor?.penalties_score_rf_gk, valor?.penalties_score_away],
      [valor?.scores_score_result, valor?.scores_score_away],
    ];

    for (const [a, b] of pairs) {
      const pa = normalizarResultadoNumerico(a);
      const pb = normalizarResultadoNumerico(b);
      if (pa != null && pb != null) return { a: pa, b: pb };
    }

    for (const [key, value] of Object.entries(valor)) {
      if ((key || "").toLowerCase().includes("pen") || (key || "").toLowerCase().includes("score") || (key || "").toLowerCase().includes("result")) {
        const pair = obtenerParejaDesdeValor(value);
        if (pair) return pair;
      }
    }

    for (const item of Object.values(valor)) {
      const pair = obtenerParejaDesdeValor(item);
      if (pair) return pair;
    }
  }

  if (typeof valor === "string") {
    const penal = extraerPenalesDesdeTexto(valor);
    if (penal) return penal;

    const regexSimple = /(\d+)\s*[-:]\s*(\d+)/;
    const matchSimple = valor.trim().match(regexSimple);
    if (matchSimple) return { a: Number(matchSimple[1]), b: Number(matchSimple[2]) };
  }

  return null;
}

function obtenerGlobal(game) {
  if (game?.global) {
    const g = game.global;
    const pair = obtenerParejaDesdeValor({
      score1: g.score1 ?? g.scoreA ?? g.team1?.score ?? g.home?.score,
      score2: g.score2 ?? g.scoreB ?? g.team2?.score ?? g.away?.score,
      team1: g.team1,
      team2: g.team2,
      score: g.score,
      scores: g.scores,
    });

    if (pair) return { scoreA: pair.a, scoreB: pair.b };
  }

  if (Array.isArray(game?.agg_scores) && game.agg_scores.length >= 2) {
    const scoreA = normalizarResultadoNumerico(game.agg_scores[0]);
    const scoreB = normalizarResultadoNumerico(game.agg_scores[1]);
    if (scoreA != null && scoreB != null) return { scoreA, scoreB };
  }

  const description = game?.description;
  if (typeof description !== "string") return null;

  const match = description.match(/\bglobal\b\s*:?\s*(\d+)\s*[-:\u2013]\s*(\d+)\b/i);
  if (!match) return null;

  return { scoreA: Number(match[1]), scoreB: Number(match[2]) };
}

function normalizarResultadoNumerico(valor) {
  if (valor == null || valor === "") return null;
  if (typeof valor === "string") {
    const m = valor.trim().match(/-?\d+(?:[.,]\d+)?/);
    if (!m) return null;
    const n = Number(m[0].replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

function obtenerPenales(game) {
  const candidates = [
    ["scraped_penalty_scores", game?.scraped_penalty_scores],
    ["scores_penalties", game?.scores_penalties],
    ["scores_penalty", game?.scores_penalty],
    ["score_penalties", game?.score_penalties],
    ["score_penalty", game?.score_penalty],
    ["penalty_scores", game?.penalty_scores],
    ["penalty_score", game?.penalty_score],
    ["penalties_scores", game?.penalties_scores],
    ["penalties_score", game?.penalties_score],
    ["penalty_result", game?.penalty_result],
    ["shootout_result", game?.shootout_result],
    ["penaltyResult", game?.penaltyResult],
    ["penalties_score_rf_gk", game?.penalties_score_rf_gk],
    ["penalties_score_r_fgk", game?.penalties_score_r_fgk],
    ["penalties_score_away", game?.penalties_score_away],
  ];

  for (const [, candidate] of candidates) {
    if (candidate == null) continue;
    const pair = obtenerParejaDesdeValor(candidate);
    if (pair) return pair;
  }

  const teams = game?.teams || [];
  const teamKeys = [
    "penalty_score",
    "penalties",
    "shootout_score",
    "shootout_goals",
    "penalty_goals",
    "penalty_result",
    "shootout_result",
  ];
  for (const key of teamKeys) {
    const pair = obtenerParejaDesdeValor([teams[0]?.[key], teams[1]?.[key]]);
    if (pair) return pair;
  }

  const teamScorePairs = [
    [game?.team1_penalty_score, game?.team2_penalty_score],
    [game?.team_1_penalty_score, game?.team_2_penalty_score],
    [game?.local_penalty_score, game?.visitor_penalty_score],
    [game?.home_penalty_score, game?.away_penalty_score],
    [game?.team1_penalties, game?.team2_penalties],
    [game?.team_1_penalties, game?.team_2_penalties],
    [game?.team1?.penalty_score, game?.team2?.penalty_score],
    [game?.team1?.penalties, game?.team2?.penalties],
    [game?.home_team?.penalty_score, game?.away_team?.penalty_score],
    [game?.local_team?.penalty_score, game?.visitor_team?.penalty_score],
  ];

  for (const [a, b] of teamScorePairs) {
    const pair = obtenerParejaDesdeValor([a, b]);
    if (pair) return pair;
  }

  const textKeys = [
    game?.result,
    game?.scoreline,
    game?.match_result,
    game?.resultado,
    game?.description,
    game?.label,
    game?.summary,
    game?.status_text,
    game?.game_time_status_to_display,
  ];
  for (const value of textKeys) {
    if (typeof value !== "string" || !/\b(penales|penalty|penalties|shootout)\b/i.test(value)) continue;
    const pair = obtenerParejaDesdeValor(value);
    if (pair) return pair;
  }

  return null;
}

function obtenerMarcadorPrincipal(game) {
  const scoreA = normalizarResultadoNumerico(obtenerScore(game, 0));
  const scoreB = normalizarResultadoNumerico(obtenerScore(game, 1));
  const penales = obtenerPenales(game);

  if (penales && Number.isFinite(scoreA) && Number.isFinite(scoreB)) {
    return { a: penales.a, b: penales.b, regularA: scoreA, regularB: scoreB };
  }

  if (penales) {
    return { a: penales.a, b: penales.b, regularA: null, regularB: null };
  }

  if (Number.isFinite(scoreA) && Number.isFinite(scoreB)) {
    return { a: scoreA, b: scoreB, regularA: scoreA, regularB: scoreB };
  }

  return null;
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

// En la práctica, el valor que trae Promiedos está dos horas por detrás del horario real local.
// Es decir: si dice 19:15, la hora correcta es 21:15.
const AJUSTE_HORAS_PROMIEDOS = 2;

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
  const statusText = [
    e?.name,
    e?.description,
    game?.game_time_status_to_display,
    game?.status_text,
  ]
    .filter(value => typeof value === "string")
    .join(" ")
    .toLowerCase();

  if (statusText.includes("aplaz") || statusText.includes("postpon")) {
    return { texto: "Aplazado", tipo: "pending" };
  }

  if (en === 2) {
    const min = obtenerMinutoLive(game);
    let textoMin;
    if (min === "ET") textoMin = "ET";
    else if (min === 45) textoMin = "ET";
    else textoMin = min !== null ? `${min}'` : "EN VIVO";
    return { texto: textoMin, tipo: "live" };
  }
  if (en === 3) {
    // Detectar penales o prórroga desde game_time_status_to_display
    const gts = String(game?.game_time_status_to_display || "").toLowerCase();
    if (gts.includes("pen")) return { texto: "FINAL (PEN)", tipo: "final", extra: "PEN" };
    if (gts.includes("aet") || gts.includes("et") || gts.includes("prorroga") || gts.includes("extra")) return { texto: "FINAL (AET)", tipo: "final", extra: "AET" };
    return { texto: "FINAL", tipo: "final" };
  }
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
      onError={e => {
        if (e.currentTarget.src.endsWith("/logo.png")) {
          e.currentTarget.style.display = "none";
          return;
        }
        e.currentTarget.onerror = null;
        e.currentTarget.src = "/logo.png";
      }}
    />
  );
}

export default function Home() {
  const [date, setDate] = useState("today");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState("");
  const [busquedaAbierta, setBusquedaAbierta] = useState(false);
  const [search, setSearch] = useState("");
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamFixtures, setTeamFixtures] = useState([]);
  const [teamFixturesLoading, setTeamFixturesLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matchStats, setMatchStats] = useState(null);
  const [matchStatsLoading, setMatchStatsLoading] = useState(false);
  const [matchStatsError, setMatchStatsError] = useState("");

  function seleccionarPartido(game, league, estado) {
    setSelectedMatch({
      id: String(game.id),
      home: nombreEquipo(obtenerEquipo(game, 0)),
      away: nombreEquipo(obtenerEquipo(game, 1)),
      league: normalizarNombre(league),
      status: estado.texto,
    });
    setMatchStats(null);
    setMatchStatsError("");
  }

  // Devuelve la fecha de hoy en Argentina como "DD-MM-YYYY"
  function hoyDDMMYYYY() {
    const parts = {};
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(new Date()).forEach(p => { parts[p.type] = p.value; });
    return `${parts.day}-${parts.month}-${parts.year}`;
  }

  // Suma N días a una fecha DD-MM-YYYY (sin usar new Date para evitar bugs de timezone)
  function sumarDias(ddmmyyyy, n) {
    const [dd, mm, yyyy] = ddmmyyyy.split("-").map(Number);
    const d = new Date(Date.UTC(yyyy, mm - 1, dd + n));
    const p = v => String(v).padStart(2, "0");
    return `${p(d.getUTCDate())}-${p(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`;
  }

  // Convierte el estado `date` a DD-MM-YYYY siempre
  function dateAsDDMMYYYY() {
    if (date === "today")  return hoyDDMMYYYY();
    if (date === "ayer")   return sumarDias(hoyDDMMYYYY(), -1);
    if (date === "manana") return sumarDias(hoyDDMMYYYY(), 1);
    return date; // ya es DD-MM-YYYY
  }

  function moverDia(n) {
    const nuevo = sumarDias(dateAsDDMMYYYY(), n);
    const hoy   = hoyDDMMYYYY();
    const ayer  = sumarDias(hoy, -1);
    const man   = sumarDias(hoy, 1);
    if (nuevo === hoy)  setDate("today");
    else if (nuevo === ayer) setDate("ayer");
    else if (nuevo === man)  setDate("manana");
    else setDate(nuevo);
  }

  // Para el input type="date" necesitamos YYYY-MM-DD
  function dateToInputValue() {
    const [dd, mm, yyyy] = dateAsDDMMYYYY().split("-");
    return `${yyyy}-${mm}-${dd}`;
  }

  function onInputChange(val) {
    if (!val) return;
    const [yyyy, mm, dd] = val.split("-");
    const nuevo = `${dd}-${mm}-${yyyy}`;
    const hoy  = hoyDDMMYYYY();
    const ayer = sumarDias(hoy, -1);
    const man  = sumarDias(hoy, 1);
    if (nuevo === hoy)  setDate("today");
    else if (nuevo === ayer) setDate("ayer");
    else if (nuevo === man)  setDate("manana");
    else setDate(nuevo);
  }

  function labelFecha() {
    if (date === "today")  return "HOY";
    if (date === "ayer")   return "◀ AYER";
    if (date === "manana") return "MAÑANA ▶";
    const [dd, mm, yyyy] = date.split("-");
    return `${dd}/${mm}/${yyyy}`;
  }

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

  async function actualizarPartidos() {
    setActualizando(true);
    try {
      await cargarPartidos();
    } finally {
      setActualizando(false);
    }
  }

  useEffect(() => { setLoading(true); cargarPartidos(); }, [date]);
  useEffect(() => { const t = setInterval(cargarPartidos, 30000); return () => clearInterval(t); }, [date]);

  useEffect(() => {
    if (!selectedMatch) return undefined;

    const controller = new AbortController();
    let primeraCarga = true;
    let solicitudEnCurso = false;
    const cargarEstadisticas = async () => {
      if (solicitudEnCurso) return;
      solicitudEnCurso = true;
      if (primeraCarga) setMatchStatsLoading(true);
      try {
        const res = await fetch(`/api/matches?game=${encodeURIComponent(selectedMatch.id)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "No se pudieron cargar las estadísticas.");
        setMatchStats(json);
        setMatchStatsError("");
      } catch (err) {
        if (err.name !== "AbortError") {
          setMatchStatsError(err.message || "Error cargando las estadísticas.");
        }
      } finally {
        if (!controller.signal.aborted && primeraCarga) setMatchStatsLoading(false);
        primeraCarga = false;
        solicitudEnCurso = false;
      }
    };

    cargarEstadisticas();
    const interval = setInterval(cargarEstadisticas, 30000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [selectedMatch]);

  useEffect(() => {
    if (!selectedMatch) return undefined;
    function cerrarConEscape(event) {
      if (event.key === "Escape") setSelectedMatch(null);
    }
    window.addEventListener("keydown", cerrarConEscape);
    return () => window.removeEventListener("keydown", cerrarConEscape);
  }, [selectedMatch]);

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
  const [filtrosLigasAbiertos, setFiltrosLigasAbiertos] = useState(false);

  // Resetear filtros cuando cambia la fecha
  useEffect(() => { setLigasOcultas(new Set()); }, [date]);

  function toggleLiga(key) {
    setLigasOcultas(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function ocultarTodasLasLigas() {
    setLigasOcultas(new Set(
      ligasConPartidos.map((league, index) => league?.key || league?.id || String(index))
    ));
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
        <div className="match-top-bar" style={S.topBar}>
          <span style={{ fontWeight: "bold" }}>RESULTADOS Y PARTIDOS EN VIVO</span>
        </div>
        <div className="match-search-container">
          <input
            value={search}
            onFocus={() => setBusquedaAbierta(true)}
            onChange={e => {
              setBusquedaAbierta(true);
              setSearch(e.target.value);
              if (selectedTeam) { setSelectedTeam(null); setTeamFixtures([]); }
            }}
            onKeyDown={e => {
              if (e.key === "Escape") setBusquedaAbierta(false);
            }}
            placeholder="🔍 Buscar equipo..."
            aria-label="Buscar equipo"
            aria-expanded={busquedaAbierta}
            aria-controls="match-search-panel"
            className="match-search-input"
            style={S.searchInput}
          />
          {busquedaAbierta && (
            <div id="match-search-panel" className="match-search-panel">
              {search.trim() && !selectedTeam && equiposFiltrados.length > 0 && (
                <div style={S.dropdown} role="listbox" aria-label="Equipos encontrados">
                  {equiposFiltrados.map(t => (
                    <button key={t.id || t.name} role="option" onClick={() => seleccionarEquipo(t)} style={S.dropdownItem}>
                      {t.name || t.nombre}
                    </button>
                  ))}
                </div>
              )}
              {search.trim() && !selectedTeam && equiposFiltrados.length === 0 && (
                <div style={S.loading}>No se encontraron equipos.</div>
              )}
              {selectedTeam && (
                <div className="match-fixture-panel" style={S.fixtureBox}>
                  <div style={S.fixtureHead}>
                    <span>⚽ PRÓXIMOS PARTIDOS: {(selectedTeam.name || selectedTeam.nombre || "").toUpperCase()}</span>
                    <button style={S.closeBtn} onClick={() => { setSelectedTeam(null); setTeamFixtures([]); setSearch(""); }}>X</button>
                  </div>
                  {teamFixturesLoading ? (
                    <div style={S.loading}>Cargando fixture...</div>
                  ) : teamFixtures.length === 0 ? (
                    <div style={S.loading}>Sin próximos partidos.</div>
                  ) : (
                    <div className="match-fixture-table-scroll">
                      <table style={{ width: "100%", minWidth: "520px", borderCollapse: "collapse" }}>
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
                                <td style={{ padding: "3px 5px", textAlign: "right" }}>
                                  {(() => {
                                    const comp = obtenerCompetenciaFixture(f);
                                    if (!comp) return null;
                                    const cl = comp.toLowerCase();
                                    let bg = "rgba(100,116,139,0.2)", color = "#94a3b8";
                                    if (cl.includes("libertador")) { bg = "rgba(16,185,129,0.15)"; color = "#10b981"; }
                                    else if (cl.includes("sudamerican")) { bg = "rgba(245,158,11,0.15)"; color = "#f59e0b"; }
                                    else if (cl.includes("copa argentina")) { bg = "rgba(56,189,248,0.15)"; color = "#38bdf8"; }
                                    else if (cl.includes("liga profesional") || cl.includes("primera")) { bg = "rgba(59,130,246,0.15)"; color = "#3b82f6"; }
                                    else if (cl.includes("champions")) { bg = "rgba(168,85,247,0.15)"; color = "#a855f7"; }
                                    else if (cl.includes("copa de la liga")) { bg = "rgba(59,130,246,0.1)"; color = "#60a5fa"; }
                                    return (
                                      <span style={{
                                        background: bg, color, fontSize: "9px", fontWeight: "bold",
                                        padding: "1px 5px", borderRadius: "3px", whiteSpace: "nowrap",
                                        border: `1px solid ${color}33`
                                      }}>
                                        {comp}
                                      </span>
                                    );
                                  })()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <button
                    type="button"
                    className="match-search-close"
                    onClick={() => setBusquedaAbierta(false)}
                    aria-label="Cerrar panel de búsqueda"
                  >
                    Cerrar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* NAVEGACIÓN TEMPORAL */}
        <div className="match-date-bar" style={S.dateBar}>
          <button className="match-date-button" onClick={() => moverDia(-1)} style={S.dateBtn} aria-label="Día anterior">&#9664;</button>
          {["ayer", "today", "manana"].map(v => (
            <button className="match-date-button" key={v} onClick={() => setDate(v)} style={date === v ? S.dateBtnActive : S.dateBtn}>
              {v === "today" ? "HOY" : v === "ayer" ? "AYER" : "MAÑANA"}
            </button>
          ))}
          <button className="match-date-button" onClick={() => moverDia(1)} style={S.dateBtn} aria-label="Día siguiente">&#9654;</button>
          <input
            className="match-date-picker"
            type="date"
            value={dateToInputValue()}
            onChange={e => onInputChange(e.target.value)}
            title="Ir a una fecha"
            style={{
              marginLeft: "8px", background: C.surfaceAlt, border: `1px solid ${C.border}`,
              color: C.textDim, padding: "2px 4px", fontSize: "10px", cursor: "pointer",
              colorScheme: "dark",
            }}
          />
          {!["today","ayer","manana"].includes(date) && (
            <span style={{ marginLeft: "8px", fontWeight: "bold", color: C.amber, fontSize: "11px" }}>
              {labelFecha()}
            </span>
          )}
          <button
            type="button"
            className="match-refresh-button"
            style={S.refreshBtn}
            onClick={actualizarPartidos}
            disabled={actualizando}
            aria-label={actualizando ? "Actualizando partidos" : "Actualizar partidos"}
          >
            {actualizando ? "ACTUALIZANDO..." : "↻ ACTUALIZAR"}
          </button>
        </div>

        {/* FILTROS DE LIGAS */}
        {!loading && hayPartidos && (
          <section className="match-league-filter-section">
            <button
              type="button"
              className="match-league-filter-toggle"
              onClick={() => setFiltrosLigasAbiertos(open => !open)}
              aria-expanded={filtrosLigasAbiertos}
              aria-controls="match-league-filter-options"
            >
              <span>{filtrosLigasAbiertos ? "▾" : "▸"} Filtrar ligas</span>
              <span className="match-league-filter-count">
                {ligasConPartidos.length - ligasOcultas.size}/{ligasConPartidos.length} activas
              </span>
            </button>
            {filtrosLigasAbiertos && (
              <div id="match-league-filter-options" className="match-league-filters">
                <button
                  type="button"
                  className="match-clear-leagues"
                  onClick={ocultarTodasLasLigas}
                  title="Desactivar todas las competencias"
                  aria-label="Desactivar todas las competencias"
                >
                  Desactivar todas
                </button>
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
          </section>
        )}

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
                        const penales = obtenerPenales(game);
                        const marcadorPrincipal = obtenerMarcadorPrincipal(game);
                        const golesA = obtenerGoles(teamA);
                        const golesB = obtenerGoles(teamB);
                        const rojasA = obtenerTarjetasRojas(teamA);
                        const rojasB = obtenerTarjetasRojas(teamB);
                        const tv = obtenerTV(game);
                        const isLive = estado.tipo === "live";
                        const isFinal = estado.tipo === "final";
                        const nombreLiga = normalizarNombre(league).toLowerCase();
                        const admiteEstadisticas = nombreLiga.includes("libertadores")
                          || nombreLiga.includes("sudamericana")
                          || nombreLiga.includes("liga profesional");
                        const puedeVerEstadisticas = (isLive || isFinal) && admiteEstadisticas && game?.id != null;
                        const LineaPartido = puedeVerEstadisticas ? "button" : "div";
                        const rowBg = gi % 2 === 0 ? C.surface : C.surfaceAlt;
                        return (
                          <tr
                            key={game?.id || gi}
                            onClick={puedeVerEstadisticas ? () => seleccionarPartido(game, league, estado) : undefined}
                            title={puedeVerEstadisticas ? "Seleccionar para ver estadísticas" : undefined}
                            style={{
                              background: rowBg,
                              borderBottom: "1px solid #e5e7eb",
                              cursor: puedeVerEstadisticas ? "pointer" : "inherit",
                            }}
                          >
                            {/* ESTADO */}
                            <td style={{ width: "72px", minWidth: "72px", maxWidth: "72px", padding: "4px 3px", textAlign: "center", borderRight: `1px solid ${C.borderSub}`, verticalAlign: "middle" }}>
                              {isLive && <span style={{ display: "inline-block", width: "5px", height: "5px", borderRadius: "50%", background: C.green, marginRight: "2px", verticalAlign: "middle" }} />}
                              <span style={isLive ? S.statusLive : isFinal ? S.statusFinal : S.statusPending}>
                                {isLive ? `⚽ ${estado.texto}` : estado.texto}
                              </span>
                            </td>
                            {/* PARTIDO */}
                            <td style={{ padding: "4px 6px", verticalAlign: "middle" }}>
                              <LineaPartido
                                type={puedeVerEstadisticas ? "button" : undefined}
                                onClick={puedeVerEstadisticas ? () => seleccionarPartido(game, league) : undefined}
                                title={puedeVerEstadisticas ? "Ver estadísticas del partido" : undefined}
                                aria-label={puedeVerEstadisticas ? `Ver estadísticas de ${nombreEquipo(teamA)} contra ${nombreEquipo(teamB)}` : undefined}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: "8px",
                                  width: "100%",
                                  padding: 0,
                                  border: 0,
                                  background: "transparent",
                                  color: "inherit",
                                  font: "inherit",
                                  textAlign: "inherit",
                                  cursor: puedeVerEstadisticas ? "pointer" : "inherit",
                                }}
                              >
                                {/* LOCAL */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "3px", minWidth: 0, flex: 1 }}>
                                  {rojasA > 0 && Array.from({ length: rojasA }).map((_, k) => <span key={k} style={S.redCard} title="Tarjeta roja" />)}
                                  <span style={{ fontWeight: "bold", fontSize: "11px", color: isLive ? C.green : C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nombreEquipo(teamA)}</span>
                                  <EscudoImg team={teamA} />
                                </div>
                                {/* MARCADOR */}
                                <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "13px", color: isLive ? C.green : isFinal ? C.textMuted : C.white, whiteSpace: "nowrap", flexShrink: 0 }}>
                                  {penales && marcadorPrincipal && marcadorPrincipal.regularA != null && marcadorPrincipal.regularB != null
                                    ? `(${marcadorPrincipal.a}) ${marcadorPrincipal.regularA} - ${marcadorPrincipal.regularB} (${marcadorPrincipal.b})`
                                    : penales && marcadorPrincipal
                                      ? `(${marcadorPrincipal.a}) - (${marcadorPrincipal.b})`
                                      : `${scoreA} - ${scoreB}`}
                                </div>
                                {/* VISITANTE */}
                                <div style={{ display: "flex", alignItems: "center", gap: "3px", minWidth: 0, flex: 1 }}>
                                  <EscudoImg team={teamB} />
                                  <span style={{ fontWeight: "bold", fontSize: "11px", color: isLive ? C.green : C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nombreEquipo(teamB)}</span>
                                  {rojasB > 0 && Array.from({ length: rojasB }).map((_, k) => <span key={k} style={S.redCard} title="Tarjeta roja" />)}
                                </div>
                              </LineaPartido>
                              {/* GLOBAL */}
                              {global && (
                                <div style={{ ...S.globalBadge, marginTop: "2px", width: "fit-content" }}>
                                  <span style={{ background: "rgba(15,23,42,0.95)", color: C.text, fontWeight: 700, padding: "1px 6px", borderRadius: "999px", border: "1px solid rgba(148,163,184,0.35)", lineHeight: 1.2, fontSize: "8px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Global</span>
                                  <span style={{ color: C.text, fontWeight: 700, fontSize: "10px" }}>{global.scoreA} - {global.scoreB}</span>
                                </div>
                              )}
                              {/* PENALES */}
                              {penales && (
                                <div style={{ ...S.globalBadge, color: C.amber, marginTop: "2px", width: "fit-content" }}>
                                  <span style={{ background: "rgba(245,158,11,0.14)", color: C.amber, fontWeight: 700, padding: "1px 6px", borderRadius: "999px", border: `1px solid ${C.amber}55`, lineHeight: 1.2, fontSize: "8px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Penales</span>
                                  <span style={{ color: C.amber, fontWeight: 700, fontSize: "10px" }}>{penales.a} - {penales.b}</span>
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
      {selectedMatch && (
        <div
          onClick={() => setSelectedMatch(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            background: "rgba(0,0,0,0.72)",
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="match-stats-title"
            onClick={event => event.stopPropagation()}
            style={{
              width: "min(100%, 480px)",
              maxHeight: "85vh",
              overflowY: "auto",
              background: C.surface,
              border: `1px solid ${C.border}`,
              boxShadow: "0 12px 36px rgba(0,0,0,0.55)",
            }}
          >
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "10px 12px", background: C.blueNav }}>
              <div>
                <div id="match-stats-title" style={{ color: C.white, fontSize: "13px", fontWeight: "bold" }}>
                  {selectedMatch.home} - {selectedMatch.away}
                </div>
                <div style={{ color: "#bfdbfe", fontSize: "10px", marginTop: "3px" }}>{selectedMatch.league} · {selectedMatch.status}</div>
              </div>
              <button type="button" onClick={() => setSelectedMatch(null)} style={S.closeBtn} aria-label="Cerrar estadísticas">X</button>
            </header>
            {matchStatsLoading ? (
              <div style={S.loading}>Cargando datos del partido...</div>
            ) : (
              <>
                {matchStatsError && <div role="alert" style={{ ...S.errorBox, margin: "12px" }}>{matchStatsError}</div>}
                <section style={{ padding: "8px 12px" }}>
                  <h3 style={{ margin: "0 0 4px", color: C.white, fontSize: "11px" }}>ESTADÍSTICAS</h3>
                  {!matchStatsError && (!Array.isArray(matchStats?.statistics) || matchStats.statistics.length === 0) ? (
                    <div style={{ color: C.textMuted, padding: "8px 0" }}>Todavía no hay estadísticas disponibles.</div>
                  ) : (
                    (matchStats?.statistics || []).map((stat, index) => {
                      const values = Array.isArray(stat?.values) ? stat.values : [];
                      return (
                        <div
                          key={`${stat?.name || "estadistica"}-${index}`}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(48px, 1fr) minmax(110px, 1.5fr) minmax(48px, 1fr)",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 2px",
                            borderBottom: `1px solid ${C.borderSub}`,
                          }}
                        >
                          <span style={{ color: C.text, fontWeight: "bold", textAlign: "right" }}>{values[0] ?? "–"}</span>
                          <span style={{ color: C.textDim, textAlign: "center" }}>{stat?.name || "Estadística"}</span>
                          <span style={{ color: C.text, fontWeight: "bold", textAlign: "left" }}>{values[1] ?? "–"}</span>
                        </div>
                      );
                    })
                  )}
                </section>
                <section style={{ padding: "8px 12px 12px" }}>
                  <h3 style={{ margin: "0 0 6px", color: C.white, fontSize: "11px" }}>MINUTO A MINUTO</h3>
                  {Array.isArray(matchStats?.events) && matchStats.events.length > 0 ? (
                    <div style={{ background: "#0b2b20", borderRadius: "4px", overflow: "hidden" }}>
                      {[...matchStats.events].reverse().map((stage, stageIndex) => (
                        <div key={`${stage?.name || "periodo"}-${stageIndex}`}>
                          {stage?.show_stage_title !== false && (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "8px", padding: "5px 8px", borderBottom: "1px solid #49665b", color: C.white, fontWeight: "bold", fontSize: "9px" }}>
                              <span>{stage?.name || "Partido"}</span>
                              <span style={{ color: C.red }}>{stage?.scores?.[0] ?? ""}</span>
                              <span style={{ textAlign: "right" }}>{stage?.scores?.[1] ?? ""}</span>
                            </div>
                          )}
                          {[...(stage?.rows || [])].reverse().map((row, rowIndex) => {
                            const homeEvents = (row?.events || []).filter(event => Number(event?.team) === 1);
                            const awayEvents = (row?.events || []).filter(event => Number(event?.team) === 2);
                            const renderEvent = (event, eventIndex) => {
                              const type = Number(event?.type);
                              const label = type === 1 ? "Gol" : type === 4 ? "Tarjeta amarilla" : type === 6 ? "Tarjeta roja" : type === 15 ? "Cambio" : "Evento";
                              return (
                                <div key={`${type}-${eventIndex}`} style={{ display: "flex", alignItems: "center", gap: "5px", minWidth: 0, color: C.white }}>
                                  <img src={`https://api.promiedos.com.ar/images/games/event/${type}`} alt="" width="18" height="18" style={{ objectFit: "contain", flexShrink: 0 }} />
                                  <span style={{ overflowWrap: "anywhere" }} title={label}>{(event?.texts || []).join(" · ") || label}</span>
                                </div>
                              );
                            };
                            return (
                              <div key={`${row?.time || "minuto"}-${rowIndex}`} style={{ display: "grid", gridTemplateColumns: "1fr 42px 1fr", alignItems: "center", gap: "6px", minHeight: "31px", padding: "4px 8px", borderBottom: "1px solid #314d42", fontSize: "10px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "3px", alignItems: "flex-start" }}>
                                  {homeEvents.map(renderEvent)}
                                </div>
                                <strong style={{ color: C.white, textAlign: "center" }}>{row?.time || ""}</strong>
                                <div style={{ display: "flex", flexDirection: "column", gap: "3px", alignItems: "flex-end", textAlign: "right" }}>
                                  {awayEvents.map(renderEvent)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: C.textMuted, padding: "8px 0" }}>Todavía no hay eventos disponibles.</div>
                  )}
                </section>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
