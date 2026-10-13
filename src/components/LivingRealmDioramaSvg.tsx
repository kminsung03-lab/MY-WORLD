import React from 'react'
import type { RealmVisualAnalysis } from '../utils/realmGrowthVisuals'

interface LivingRealmDioramaSvgProps {
  analysis: RealmVisualAnalysis
  className?: string
  viewBox?: string
}

/**
 * LivingRealmDioramaSvg
 * 
 * High-definition, fully vector living fantasy fief landscape diorama.
 * Renders concrete visual silhouettes, building densities, district architecture,
 * and environmental atmospheres strictly reflecting player investments:
 * 
 * - Specialization Isolation:
 *   * Agrarian (B): Massive golden grain fields, twin giant windmills, domed granary silos.
 *   * Commercial (C): Marble trade guild, grand central water fountain, 6 colorful market pavilions, caravans.
 *   * Military (D): Triple-tiered curtain ramparts, 4 fortified watchtowers, iron barbican gate, red war banners.
 *   * Control / Tier 1 (A): Sparse log cottages, rustic fence, simple wooden manor, dirt track.
 *   * Crisis / Damage (E): Blood sky, cracked walls, roaring flames, billowing black smoke.
 */
export const LivingRealmDioramaSvg: React.FC<LivingRealmDioramaSvgProps> = ({
  analysis,
  className = 'living-diorama-svg',
  viewBox = '0 0 1000 360',
}) => {
  const { tier, specialization, distress } = analysis

  // 1. Sky & Celestial Lighting Profiles
  let skyGradientId = 'sky-normal'
  let groundBaseColor = '#2d5a27' // lush temperate green
  let sunColor = '#fef08a'
  let sunShadow = '#fde047'

  if (distress === 'critical') {
    skyGradientId = 'sky-critical'
    groundBaseColor = '#3b2f2f' // scorched dark loam
    sunColor = '#ef4444'
    sunShadow = '#dc2626'
  } else if (specialization === 'agrarian') {
    skyGradientId = 'sky-agrarian'
    groundBaseColor = '#4d7c0f' // vibrant golden-green agriculture
    sunColor = '#fef3c7'
    sunShadow = '#f59e0b'
  } else if (specialization === 'commercial') {
    skyGradientId = 'sky-commercial'
    groundBaseColor = '#365314'
    sunColor = '#fffbeb'
    sunShadow = '#38bdf8'
  } else if (specialization === 'military') {
    skyGradientId = 'sky-military'
    groundBaseColor = '#27382b'
    sunColor = '#fde047'
    sunShadow = '#ea580c'
  } else if (distress === 'distressed') {
    skyGradientId = 'sky-distressed'
    groundBaseColor = '#3f4f2c'
    sunColor = '#f59e0b'
    sunShadow = '#d97706'
  }

  const isAgrarian = specialization === 'agrarian'
  const isCommercial = specialization === 'commercial'
  const isMilitary = specialization === 'military'

  return (
    <svg
      className={className}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`에르덴 영지 풍경 - ${analysis.tierTitle}`}
    >
      <defs>
        {/* Sky Gradients */}
        <linearGradient id="sky-normal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="45%" stopColor="#38bdf8" />
          <stop offset="75%" stopColor="#bae6fd" />
          <stop offset="100%" stopColor="#fef08a" />
        </linearGradient>

        <linearGradient id="sky-agrarian" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b45309" />
          <stop offset="35%" stopColor="#d97706" />
          <stop offset="70%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#fef08a" />
        </linearGradient>

        <linearGradient id="sky-commercial" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0369a1" />
          <stop offset="45%" stopColor="#0284c7" />
          <stop offset="75%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#fef9c3" />
        </linearGradient>

        <linearGradient id="sky-military" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="40%" stopColor="#334155" />
          <stop offset="75%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        <linearGradient id="sky-distressed" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="50%" stopColor="#78350f" />
          <stop offset="80%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#fef08a" />
        </linearGradient>

        <linearGradient id="sky-critical" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="35%" stopColor="#450a0a" />
          <stop offset="70%" stopColor="#991b1b" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>

        {/* Mountain Gradients */}
        <linearGradient id="mountain-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={distress === 'critical' ? '#450a0a' : isMilitary ? '#1e293b' : '#475569'} />
          <stop offset="100%" stopColor={distress === 'critical' ? '#1c1917' : isMilitary ? '#334155' : '#64748b'} />
        </linearGradient>
        <linearGradient id="hills-mid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={distress === 'critical' ? '#292524' : isMilitary ? '#0f172a' : '#334155'} />
          <stop offset="100%" stopColor={distress === 'critical' ? '#18181b' : isMilitary ? '#1e293b' : '#1e293b'} />
        </linearGradient>

        {/* Field Furrow Pattern */}
        <pattern id="farmland-pattern" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(25)">
          <line x1="0" y1="0" x2="0" y2="16" stroke="#ca8a04" strokeWidth="6" />
          <line x1="8" y1="0" x2="8" y2="16" stroke="#eab308" strokeWidth="6" />
        </pattern>

        {/* Cobblestone Pattern */}
        <pattern id="cobble-pattern" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill="#475569" />
          <rect x="1" y="1" width="4.5" height="4.5" rx="1" fill="#64748b" />
          <rect x="6.5" y="1" width="4.5" height="4.5" rx="1" fill="#94a3b8" />
          <rect x="1" y="6.5" width="4.5" height="4.5" rx="1" fill="#94a3b8" />
          <rect x="6.5" y="6.5" width="4.5" height="4.5" rx="1" fill="#64748b" />
        </pattern>
      </defs>

      {/* ============================================================== */}
      {/* 1. SKY & CELESTIAL BACKGROUND */}
      {/* ============================================================== */}
      <rect width="1000" height="360" fill={`url(#${skyGradientId})`} />

      {/* Celestial Orb (Sun or Blood Moon) */}
      <g>
        <circle cx={isAgrarian ? '820' : '850'} cy={isAgrarian ? '75' : '65'} r={isAgrarian ? '44' : '36'} fill={sunColor} opacity="0.95" />
        <circle cx={isAgrarian ? '820' : '850'} cy={isAgrarian ? '75' : '65'} r={isAgrarian ? '56' : '46'} fill={sunShadow} opacity="0.25" />
      </g>

      {/* Peaceful Fluffy Clouds (Hidden in crisis) */}
      {distress !== 'critical' && (
        <g fill="#ffffff" opacity={isAgrarian ? '0.6' : '0.75'}>
          <ellipse cx="180" cy="60" rx="55" ry="16" />
          <ellipse cx="215" cy="50" rx="36" ry="22" />
          <ellipse cx="145" cy="62" rx="30" ry="14" />

          <ellipse cx="610" cy="75" rx="70" ry="18" />
          <ellipse cx="645" cy="64" rx="42" ry="24" />
          <ellipse cx="570" cy="78" rx="35" ry="15" />
        </g>
      )}

      {/* ============================================================== */}
      {/* 2. MOUNTAIN SILHOUETTES */}
      {/* ============================================================== */}
      <polygon
        points="0,210 70,140 140,195 240,105 340,185 450,90 560,180 670,110 780,190 870,120 950,175 1000,140 1000,360 0,360"
        fill="url(#mountain-far)"
        opacity="0.85"
      />
      <polygon
        points="0,235 110,185 220,225 360,170 510,215 650,165 790,210 910,175 1000,205 1000,360 0,360"
        fill="url(#hills-mid)"
        opacity="0.9"
      />

      {/* Ridge Pines */}
      <g fill={distress === 'critical' ? '#1c1917' : '#1e293b'} opacity="0.75">
        <polygon points="120,185 115,200 125,200" />
        <polygon points="128,183 123,200 133,200" />
        <polygon points="370,170 364,188 376,188" />
        <polygon points="380,168 375,188 385,188" />
        <polygon points="660,165 654,184 666,184" />
        <polygon points="672,163 667,184 677,184" />
      </g>

      {/* ============================================================== */}
      {/* 3. BASE GROUND TERRAIN */}
      {/* ============================================================== */}
      <polygon
        points="0,245 180,235 380,240 600,238 800,242 1000,245 1000,360 0,360"
        fill={groundBaseColor}
      />

      {/* Specialized Ground Land-Use: */}
      {/* A. Agrarian Wheatfields Ground */}
      {isAgrarian || analysis.agriScore >= 25 ? (
        <g id="ground-agri-fields">
          <polygon
            points={tier >= 3 ? "0,248 260,238 420,248 380,360 0,360" : "20,252 220,244 320,252 290,360 10,360"}
            fill="url(#farmland-pattern)"
            opacity={tier >= 3 ? "0.95" : "0.78"}
          />
          {/* Furrow contour lines */}
          <path
            d={tier >= 3
              ? "M 10,265 Q 180,248 380,260 M 15,285 Q 185,268 390,280 M 20,305 Q 190,288 380,305 M 25,325 Q 195,308 360,330 M 30,345 Q 190,328 350,352"
              : "M 30,270 Q 160,258 290,268 M 35,290 Q 165,278 300,288 M 40,312 Q 170,300 290,314 M 45,334 Q 175,322 280,340"}
            stroke="#854d0e"
            strokeWidth={tier >= 3 ? "3.2" : "2.4"}
            fill="none"
            opacity="0.85"
          />
          {/* Irrigation canal stream for Tier 3 Agrarian */}
          {tier >= 3 && (
            <path
              d="M 160,240 Q 185,290 150,360"
              stroke="#0284c7"
              strokeWidth="5"
              fill="none"
              opacity="0.85"
            />
          )}
        </g>
      ) : (
        // Subtle small vegetable garden patch for non-agrarian
        <g id="ground-small-patch">
          <ellipse cx="210" cy="265" rx="45" ry="14" fill="#4d7c0f" opacity="0.6" />
        </g>
      )}

      {/* B. Commercial Cobblestone Plaza & Radial Avenue */}
      {isCommercial || analysis.commScore >= 25 ? (
        <g id="ground-comm-plaza">
          <polygon
            points={tier >= 3 ? "360,238 640,238 740,360 260,360" : "410,240 590,240 660,360 340,360"}
            fill="url(#cobble-pattern)"
            opacity={tier >= 3 ? "0.95" : "0.75"}
          />
          {/* Grand Plaza Inlaid Rim for Tier 3 Commercial */}
          {tier >= 3 && (
            <ellipse cx="500" cy="295" rx="110" ry="42" fill="none" stroke="#fde047" strokeWidth="3.5" opacity="0.9" />
          )}
        </g>
      ) : tier >= 2 ? (
        <polygon
          points="450,240 550,240 600,360 400,360"
          fill="#475569"
          opacity="0.5"
        />
      ) : (
        <polygon
          points="470,242 530,242 560,360 440,360"
          fill="#78350f"
          opacity="0.4"
        />
      )}

      {/* C. Military Rampart Moat & Escarpment */}
      {isMilitary || analysis.milScore >= 25 ? (
        <g id="ground-mil-ramparts">
          <polygon
            points="650,246 1000,250 1000,280 660,270"
            fill="#0f172a"
            opacity="0.9"
          />
          {tier >= 3 && (
            <polygon
              points="665,270 1000,280 1000,310 680,295"
              fill="#334155"
              opacity="0.95"
            />
          )}
        </g>
      ) : null}

      {/* ============================================================== */}
      {/* 4. DISTRICT SPECIFIC STRUCTURES */}
      {/* ============================================================== */}

      {/* -------------------------------------------------------------- */}
      {/* 4.1 WEST DISTRICT: FARMLAND, GRANARY & WINDMILLS */}
      {/* -------------------------------------------------------------- */}
      {tier >= 3 && (isAgrarian || analysis.agriScore >= 40) ? (
        // Tier 3 Agrarian: Twin giant windmills, twin silos, harvest wagon
        <g id="west-agri-t3">
          {/* Silo 1 (Grand Domed) */}
          <rect x="70" y="205" width="60" height="58" rx="4" fill="#64748b" stroke="#334155" strokeWidth="2.5" />
          <path d="M 70,205 Q 100,180 130,205 Z" fill="#d97706" stroke="#92400e" strokeWidth="2.5" />
          {/* Silo 2 */}
          <rect x="135" y="215" width="48" height="48" rx="3" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
          <path d="M 135,215 Q 159,192 183,215 Z" fill="#b45309" stroke="#78350f" strokeWidth="2" />

          {/* Giant Windmill 1 */}
          <polygon points="195,258 206,165 226,165 237,258" fill="#f8fafc" stroke="#334155" strokeWidth="2.5" />
          <polygon points="202,165 216,146 230,165" fill="#dc2626" />
          <circle cx="216" cy="176" r="5" fill="#0f172a" />
          <line x1="216" y1="138" x2="216" y2="214" stroke="#78350f" strokeWidth="3.5" />
          <line x1="178" y1="176" x2="254" y2="176" stroke="#78350f" strokeWidth="3.5" />
          <polygon points="216,138 225,157 216,159" fill="#fef08a" />
          <polygon points="216,214 207,195 216,193" fill="#fef08a" />
          <polygon points="178,176 197,167 199,176" fill="#fef08a" />
          <polygon points="254,176 235,185 233,176" fill="#fef08a" />

          {/* Secondary Windmill 2 on ridge */}
          <polygon points="265,248 274,175 288,175 297,248" fill="#e2e8f0" stroke="#475569" strokeWidth="2" />
          <polygon points="271,175 281,158 291,175" fill="#2563eb" />
          <circle cx="281" cy="184" r="4" fill="#0f172a" />
          <line x1="281" y1="152" x2="281" y2="216" stroke="#78350f" strokeWidth="2.8" />
          <line x1="249" y1="184" x2="313" y2="184" stroke="#78350f" strokeWidth="2.8" />

          {/* Harvest Haystack & Grain Wagon */}
          <rect x="228" y="278" width="30" height="15" rx="2" fill="#854d0e" />
          <circle cx="235" cy="296" r="5.5" fill="#451a03" stroke="#ca8a04" strokeWidth="1.5" />
          <circle cx="251" cy="296" r="5.5" fill="#451a03" stroke="#ca8a04" strokeWidth="1.5" />
          <ellipse cx="243" cy="276" rx="14" ry="6" fill="#eab308" />
        </g>
      ) : tier === 2 && (isAgrarian || analysis.agriScore >= 20) ? (
        // Tier 2 Agrarian: Distinct single wooden windmill, stone granary, small cart
        <g id="west-agri-t2">
          {/* Thatched Stone Granary */}
          <rect x="135" y="222" width="62" height="36" rx="2" fill="#854d0e" stroke="#451a03" strokeWidth="2" />
          <polygon points="130,222 166,200 202,222" fill="#ca8a04" stroke="#78350f" strokeWidth="1.5" />
          <rect x="160" y="236" width="14" height="22" fill="#451a03" />

          {/* Single Medium Windmill */}
          <polygon points="220,258 230,188 245,188 255,258" fill="#e2e8f0" stroke="#475569" strokeWidth="2" />
          <polygon points="226,188 237.5,172 249,188" fill="#b45309" />
          <circle cx="237.5" cy="195" r="4" fill="#0f172a" />
          <line x1="237.5" y1="165" x2="237.5" y2="225" stroke="#78350f" strokeWidth="3" />
          <line x1="207.5" y1="195" x2="267.5" y2="195" stroke="#78350f" strokeWidth="3" />

          {/* Small 2-wheel farm cart */}
          <rect x="195" y="270" width="18" height="9" fill="#78350f" />
          <circle cx="200" cy="281" r="3.5" fill="#451a03" stroke="#ca8a04" />
          <circle cx="210" cy="281" r="3.5" fill="#451a03" stroke="#ca8a04" />
        </g>
      ) : analysis.agriScore >= 20 ? (
        // Hybrid secondary agricultural presence
        <g id="west-agri-secondary">
          <rect x="180" y="235" width="40" height="25" rx="2" fill="#854d0e" stroke="#451a03" strokeWidth="1.5" />
          <polygon points="175,235 200,218 225,235" fill="#ca8a04" />
          <ellipse cx="235" cy="254" rx="14" ry="10" fill="#ca8a04" />
        </g>
      ) : (
        // Tier 1 / Non-Agrarian: Humble rustic barn & haystack
        <g id="west-agri-humble">
          <rect x="180" y="242" width="34" height="20" rx="2" fill="#78350f" />
          <polygon points="175,242 197,225 219,242" fill="#a16207" />
          <rect x="193" y="250" width="8" height="12" fill="#451a03" />
          <ellipse cx="235" cy="254" rx="14" ry="10" fill="#ca8a04" />
        </g>
      )}

      {/* -------------------------------------------------------------- */}
      {/* 4.2 CENTER DISTRICT: CITADEL KEEP (Distinct Silhouettes per Spec & Tier) */}
      {/* -------------------------------------------------------------- */}
      <g id="center-citadel">
        {tier === 1 ? (
          // Tier 1: Small Single-story Log Manor
          <g transform="translate(470, 208)">
            <rect width="60" height="38" rx="2" fill="#78350f" stroke="#451a03" strokeWidth="2" />
            <polygon points="-6,0 30,-22 66,0" fill="#a16207" stroke="#78350f" strokeWidth="2" />
            <rect x="24" y="18" width="12" height="20" fill="#451a03" />
            <line x1="30" y1="-22" x2="30" y2="-36" stroke="#78350f" strokeWidth="2" />
            <polygon points="30,-36 44,-30 30,-24" fill="#fbbf24" />
          </g>
        ) : tier === 2 ? (
          // Tier 2: Sturdy Two-story Stone Keep with crenellations & watchtower
          <g transform="translate(445, 178)">
            <rect width="90" height="64" rx="3" fill="#475569" stroke="#1e293b" strokeWidth="2.5" />
            <rect x="-12" y="-16" width="30" height="80" rx="2" fill="#334155" stroke="#1e293b" strokeWidth="2.5" />
            <polygon points="14,0 55,-26 94,0" fill={isAgrarian ? '#15803d' : isCommercial ? '#0284c7' : '#b91c1c'} stroke="#0f172a" strokeWidth="2" />
            <path d="M 40,64 L 40,38 Q 52,26 64,38 L 64,64 Z" fill="#0f172a" />
            <line x1="4" y1="-26" x2="4" y2="-44" stroke="#0f172a" strokeWidth="2" />
            <polygon points="4,-44 24,-36 4,-28" fill={isCommercial ? '#fbbf24' : isMilitary ? '#dc2626' : '#22c55e'} />
          </g>
        ) : (
          // Tier 3: Grand Specialized Citadel (Tri-towered Fortress with Portcullis & Spire)
          <g transform="translate(420, 125)">
            <rect x="-10" y="110" width="180" height="15" fill="#0f172a" opacity="0.4" />
            {/* Main Center Building */}
            <rect
              x="25"
              y="45"
              width="110"
              height="75"
              rx="3"
              fill={isCommercial ? '#ffffff' : isMilitary ? '#334155' : '#e2e8f0'}
              stroke="#0f172a"
              strokeWidth="3"
            />
            {/* Left Tower */}
            <rect x="-8" y="10" width="38" height="110" rx="3" fill={isMilitary ? '#1e293b' : '#cbd5e1'} stroke="#0f172a" strokeWidth="2.5" />
            <polygon points="-12,10 11,-25 34,10" fill={isCommercial ? '#0284c7' : isMilitary ? '#991b1b' : '#15803d'} stroke="#0f172a" strokeWidth="2" />

            {/* Right Tower */}
            <rect x="130" y="10" width="38" height="110" rx="3" fill={isMilitary ? '#1e293b' : '#cbd5e1'} stroke="#0f172a" strokeWidth="2.5" />
            <polygon points="126,10 149,-25 172,10" fill={isCommercial ? '#0284c7' : isMilitary ? '#991b1b' : '#15803d'} stroke="#0f172a" strokeWidth="2" />

            {/* Central Master Dome / Spire */}
            <rect x="52" y="-10" width="56" height="58" rx="2" fill={isCommercial ? '#ffffff' : '#f8fafc'} stroke="#0f172a" strokeWidth="2.5" />
            <polygon
              points="46,-10 80,-52 114,-10"
              fill={isCommercial ? '#f59e0b' : isMilitary ? '#7f1d1d' : '#16a34a'}
              stroke="#0f172a"
              strokeWidth="2.5"
            />

            {/* Arched Portcullis */}
            <path d="M 64,120 L 64,75 Q 80,60 96,75 L 96,120 Z" fill="#0f172a" stroke="#fbbf24" strokeWidth="3" />
            <line x1="72" y1="70" x2="72" y2="120" stroke="#94a3b8" strokeWidth="2" />
            <line x1="80" y1="65" x2="80" y2="120" stroke="#94a3b8" strokeWidth="2" />
            <line x1="88" y1="70" x2="88" y2="120" stroke="#94a3b8" strokeWidth="2" />

            {/* Heraldic Flags */}
            <line x1="80" y1="-52" x2="80" y2="-78" stroke="#0f172a" strokeWidth="3" />
            <polygon points="80,-78 116,-66 80,-54" fill={isCommercial ? '#fbbf24' : isMilitary ? '#dc2626' : '#22c55e'} />
          </g>
        )}
      </g>

      {/* Town Cottages Flanking Keep: Explicit Density Differences */}
      <g id="town-houses">
        {tier === 1 ? (
          // Tier 1: Just 2 humble log cabins
          <>
            <rect x="390" y="238" width="26" height="18" rx="1" fill="#78350f" />
            <polygon points="388,238 403,226 418,238" fill="#a16207" />
            <rect x="560" y="239" width="24" height="17" rx="1" fill="#78350f" />
            <polygon points="558,239 572,228 586,239" fill="#92400e" />
          </>
        ) : tier === 2 ? (
          // Tier 2: 4-5 sturdy stone-and-timber houses with chimneys
          <>
            <rect x="365" y="234" width="32" height="24" rx="2" fill="#64748b" stroke="#334155" />
            <polygon points="363,234 381,220 399,234" fill="#b91c1c" />
            <rect x="405" y="236" width="28" height="22" rx="2" fill="#94a3b8" />
            <polygon points="403,236 419,224 435,236" fill="#1e3a8a" />
            <rect x="555" y="235" width="30" height="23" rx="2" fill="#64748b" />
            <polygon points="553,235 570,222 587,235" fill="#b45309" />
            <rect x="595" y="237" width="34" height="24" rx="2" fill="#94a3b8" />
            <polygon points="593,237 612,222 631,237" fill="#15803d" />
          </>
        ) : (
          // Tier 3: Dense Urban Streetscape of 8-10 Multi-story Townhouses
          <>
            {/* West flank cluster */}
            <rect x="335" y="230" width="28" height="28" rx="2" fill="#475569" stroke="#1e293b" />
            <polygon points="333,230 347,215 361,230" fill="#dc2626" />
            <rect x="365" y="226" width="34" height="32" rx="2" fill="#64748b" stroke="#334155" />
            <polygon points="363,226 382,210 401,226" fill="#b91c1c" />
            <rect x="402" y="232" width="28" height="26" rx="2" fill="#94a3b8" stroke="#475569" />
            <polygon points="400,232 416,218 432,232" fill="#1d4ed8" />
            {/* East flank cluster */}
            <rect x="550" y="228" width="30" height="30" rx="2" fill="#64748b" stroke="#334155" />
            <polygon points="548,228 565,212 582,228" fill="#b45309" />
            <rect x="583" y="225" width="36" height="33" rx="2" fill="#94a3b8" stroke="#475569" />
            <polygon points="581,225 601,208 621,225" fill="#15803d" />
            <rect x="622" y="230" width="28" height="28" rx="2" fill="#475569" stroke="#1e293b" />
            <polygon points="620,230 634,216 648,230" fill="#9333ea" />
          </>
        )}
      </g>

      {/* -------------------------------------------------------------- */}
      {/* 4.3 CENTER-SOUTH / COMMERCIAL DISTRICT: MARKET & CARAVANS */}
      {/* -------------------------------------------------------------- */}
      {tier >= 3 && (isCommercial || analysis.commScore >= 40) ? (
        // Tier 3 Commercial: Grand Merchant Guild Hall, Fountain & 4-6 Pavilions
        <g id="comm-t3">
          {/* Marble Merchant Guild Hall */}
          <g transform="translate(345, 260)">
            <rect width="56" height="36" rx="3" fill="#f8fafc" stroke="#334155" strokeWidth="2.5" />
            <polygon points="-4,0 28,-20 60,0" fill="#0284c7" stroke="#0369a1" strokeWidth="2" />
            <line x1="8" y1="0" x2="8" y2="36" stroke="#94a3b8" strokeWidth="3" />
            <line x1="22" y1="0" x2="22" y2="36" stroke="#94a3b8" strokeWidth="3" />
            <line x1="36" y1="0" x2="36" y2="36" stroke="#94a3b8" strokeWidth="3" />
            <line x1="48" y1="0" x2="48" y2="36" stroke="#94a3b8" strokeWidth="3" />
            <circle cx="28" cy="-6" r="5" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />
          </g>

          {/* Grand Water Fountain in Plaza Center */}
          <g transform="translate(485, 290)">
            <ellipse cx="20" cy="16" rx="30" ry="13" fill="#0284c7" stroke="#e2e8f0" strokeWidth="3" />
            <ellipse cx="20" cy="10" rx="15" ry="7" fill="#38bdf8" stroke="#cbd5e1" strokeWidth="2" />
            <line x1="20" y1="4" x2="20" y2="-6" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="20" cy="-8" r="3.5" fill="#bae6fd" />
          </g>

          {/* 4 Large Striped Market Pavilions */}
          <g transform="translate(425, 275)">
            <rect x="4" y="12" width="28" height="16" fill="#78350f" />
            <polygon points="0,12 18,-6 36,12" fill="#ef4444" stroke="#b91c1c" strokeWidth="1.5" />
            <line x1="9" y1="12" x2="18" y2="-6" stroke="#ffffff" strokeWidth="3" />
            <line x1="27" y1="12" x2="18" y2="-6" stroke="#ffffff" strokeWidth="3" />
          </g>
          <g transform="translate(435, 312)">
            <rect x="4" y="10" width="28" height="15" fill="#78350f" />
            <polygon points="0,10 18,-5 36,10" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" />
            <line x1="9" y1="10" x2="18" y2="-5" stroke="#ef4444" strokeWidth="3" />
          </g>
          <g transform="translate(540, 278)">
            <rect x="4" y="12" width="28" height="16" fill="#78350f" />
            <polygon points="0,12 18,-6 36,12" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1.5" />
            <line x1="9" y1="12" x2="18" y2="-6" stroke="#fde047" strokeWidth="3" />
          </g>
          <g transform="translate(535, 314)">
            <rect x="4" y="10" width="28" height="15" fill="#78350f" />
            <polygon points="0,10 18,-5 36,10" fill="#10b981" stroke="#059669" strokeWidth="1.5" />
            <line x1="9" y1="10" x2="18" y2="-5" stroke="#ffffff" strokeWidth="3" />
          </g>

          {/* Caravan Long-Distance Covered Wagons */}
          <g transform="translate(595, 296)">
            <rect width="36" height="16" rx="2" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
            <circle cx="8" cy="18" r="6" fill="#451a03" stroke="#fbbf24" strokeWidth="2" />
            <circle cx="28" cy="18" r="6" fill="#451a03" stroke="#fbbf24" strokeWidth="2" />
            <path d="M 2,0 Q 18,-12 34,0 Z" fill="#fef3c7" stroke="#ca8a04" strokeWidth="2" />
          </g>
        </g>
      ) : tier === 2 && (isCommercial || analysis.commScore >= 20) ? (
        // Tier 2 Commercial: 2 Distinct Striped Tents with crates
        <g id="comm-t2" transform="translate(460, 275)">
          <rect x="3" y="10" width="26" height="15" fill="#78350f" />
          <polygon points="0,10 16,-4 32,10" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
          <line x1="8" y1="10" x2="16" y2="-4" stroke="#ffffff" strokeWidth="3" />
          <g transform="translate(45, 2)">
            <rect x="3" y="10" width="26" height="15" fill="#78350f" />
            <polygon points="0,10 16,-4 32,10" fill="#2563eb" stroke="#1e40af" strokeWidth="1" />
            <line x1="8" y1="10" x2="16" y2="-4" stroke="#fde047" strokeWidth="3" />
          </g>
          {/* Goods crates */}
          <rect x="-8" y="16" width="8" height="8" fill="#b45309" stroke="#78350f" />
          <rect x="80" y="16" width="9" height="9" fill="#d97706" stroke="#92400e" />
        </g>
      ) : analysis.commScore >= 20 ? (
        // Hybrid secondary market presence
        <g id="comm-secondary" transform="translate(480, 278)">
          <rect width="24" height="12" rx="1" fill="#78350f" />
          <polygon points="-3,0 12,-8 27,0" fill="#3b82f6" />
          <line x1="6" y1="0" x2="12" y2="-8" stroke="#ffffff" strokeWidth="2" />
        </g>
      ) : (
        // Tier 1 / Non-Commercial: Just 1 modest rustic table
        <g id="comm-modest" transform="translate(485, 278)">
          <rect width="24" height="12" rx="1" fill="#78350f" />
          <polygon points="-3,0 12,-8 27,0" fill="#ea580c" />
          <circle cx="6" cy="6" r="3" fill="#ef4444" />
          <circle cx="14" cy="6" r="3" fill="#eab308" />
        </g>
      )}

      {/* -------------------------------------------------------------- */}
      {/* 4.4 EAST DISTRICT: MILITARY RAMPARTS & WATCHTOWERS */}
      {/* -------------------------------------------------------------- */}
      {tier >= 3 && (isMilitary || analysis.milScore >= 40) ? (
        // Tier 3 Military: Triple-tier Ramparts, 4 Massive Towers, Barbican & Banners
        <g id="mil-t3" transform="translate(640, 160)">
          {/* Outer Lower Wall */}
          <rect x="30" y="85" width="230" height="35" fill="#334155" stroke="#0f172a" strokeWidth="3" />
          <g fill="#1e293b">
            <rect x="35" y="75" width="14" height="10" />
            <rect x="65" y="75" width="14" height="10" />
            <rect x="95" y="75" width="14" height="10" />
            <rect x="125" y="75" width="14" height="10" />
            <rect x="155" y="75" width="14" height="10" />
            <rect x="185" y="75" width="14" height="10" />
            <rect x="215" y="75" width="14" height="10" />
            <rect x="245" y="75" width="14" height="10" />
          </g>

          {/* Inner Upper Wall */}
          <rect x="50" y="48" width="190" height="40" fill="#475569" stroke="#0f172a" strokeWidth="3" />
          <g fill="#1e293b">
            <rect x="55" y="38" width="14" height="10" />
            <rect x="85" y="38" width="14" height="10" />
            <rect x="115" y="38" width="14" height="10" />
            <rect x="145" y="38" width="14" height="10" />
            <rect x="175" y="38" width="14" height="10" />
            <rect x="205" y="38" width="14" height="10" />
          </g>

          {/* Tower 1 (Left Flank) */}
          <rect x="15" y="25" width="34" height="95" fill="#1e293b" stroke="#0f172a" strokeWidth="3" />
          <polygon points="10,25 32,-8 54,25" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="2" />
          <line x1="32" y1="-8" x2="32" y2="-32" stroke="#0f172a" strokeWidth="2.5" />
          <polygon points="32,-32 52,-24 32,-16" fill="#dc2626" />

          {/* Tower 2 (Gatehouse Left) */}
          <rect x="85" y="10" width="34" height="110" fill="#334155" stroke="#0f172a" strokeWidth="3" />
          <polygon points="80,10 102,-20 124,10" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="2" />
          <line x1="102" y1="-20" x2="102" y2="-42" stroke="#0f172a" strokeWidth="2.5" />
          <polygon points="102,-42 122,-34 102,-26" fill="#fbbf24" />

          {/* Tower 3 (Gatehouse Right) */}
          <rect x="165" y="10" width="34" height="110" fill="#334155" stroke="#0f172a" strokeWidth="3" />
          <polygon points="160,10 182,-20 204,10" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="2" />
          <line x1="182" y1="-20" x2="182" y2="-42" stroke="#0f172a" strokeWidth="2.5" />
          <polygon points="182,-42 202,-34 182,-26" fill="#fbbf24" />

          {/* Tower 4 (Right Flank) */}
          <rect x="235" y="25" width="34" height="95" fill="#1e293b" stroke="#0f172a" strokeWidth="3" />
          <polygon points="230,25 252,-8 274,25" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="2" />
          <line x1="252" y1="-8" x2="252" y2="-32" stroke="#0f172a" strokeWidth="2.5" />
          <polygon points="252,-32 272,-24 252,-16" fill="#dc2626" />

          {/* Heavy Iron Barbican Gate */}
          <g transform="translate(119, 78)">
            <path d="M 0,42 L 0,10 Q 23,-5 46,10 L 46,42 Z" fill="#0f172a" stroke="#78350f" strokeWidth="3" />
            <line x1="11" y1="2" x2="11" y2="42" stroke="#dc2626" strokeWidth="2.5" />
            <line x1="23" y1="-2" x2="23" y2="42" stroke="#dc2626" strokeWidth="2.5" />
            <line x1="35" y1="2" x2="35" y2="42" stroke="#dc2626" strokeWidth="2.5" />
            <line x1="0" y1="15" x2="46" y2="15" stroke="#fbbf24" strokeWidth="2" />
            <line x1="0" y1="28" x2="46" y2="28" stroke="#fbbf24" strokeWidth="2" />
          </g>

          {/* Armed Sentry Silhouettes */}
          <g transform="translate(68, 62)">
            <circle cx="5" cy="0" r="3" fill="#0f172a" />
            <line x1="5" y1="3" x2="5" y2="12" stroke="#0f172a" strokeWidth="2" />
            <line x1="8" y1="-6" x2="8" y2="14" stroke="#dc2626" strokeWidth="1.5" />
            <rect x="2" y="4" width="4" height="7" rx="1" fill="#fbbf24" />
          </g>
          <g transform="translate(210, 62)">
            <circle cx="5" cy="0" r="3" fill="#0f172a" />
            <line x1="5" y1="3" x2="5" y2="12" stroke="#0f172a" strokeWidth="2" />
            <line x1="8" y1="-6" x2="8" y2="14" stroke="#dc2626" strokeWidth="1.5" />
            <rect x="2" y="4" width="4" height="7" rx="1" fill="#fbbf24" />
          </g>
        </g>
      ) : tier === 2 && (isMilitary || analysis.milScore >= 20) ? (
        // Tier 2 Military: Stone Wall & 2 Watchtowers
        <g id="mil-t2" transform="translate(660, 205)">
          <rect x="20" y="30" width="160" height="28" fill="#475569" stroke="#1e293b" strokeWidth="2.5" />
          <g fill="#334155">
            <rect x="25" y="22" width="12" height="8" />
            <rect x="55" y="22" width="12" height="8" />
            <rect x="85" y="22" width="12" height="8" />
            <rect x="115" y="22" width="12" height="8" />
            <rect x="145" y="22" width="12" height="8" />
          </g>
          <rect x="10" y="5" width="26" height="55" fill="#334155" stroke="#1e293b" strokeWidth="2.5" />
          <polygon points="6,5 23,-12 40,5" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="1.5" />
          <rect x="175" y="5" width="26" height="55" fill="#334155" stroke="#1e293b" strokeWidth="2.5" />
          <polygon points="171,5 188,-12 205,5" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="1.5" />
        </g>
      ) : analysis.milScore >= 20 ? (
        // Hybrid secondary military presence
        <g id="mil-secondary" transform="translate(680, 220)">
          <rect x="10" y="20" width="100" height="18" fill="#475569" stroke="#1e293b" />
          <rect x="115" y="5" width="22" height="34" fill="#334155" stroke="#1e293b" />
          <polygon points="112,5 126,-6 140,5" fill="#b91c1c" />
        </g>
      ) : (
        // Tier 1 / Non-Military: Rustic wooden palisade fence
        <g id="mil-palisade" transform="translate(680, 235)">
          <g stroke="#78350f" strokeWidth="4" strokeLinecap="round">
            <line x1="10" y1="20" x2="10" y2="2" />
            <line x1="22" y1="20" x2="22" y2="0" />
            <line x1="34" y1="20" x2="34" y2="3" />
            <line x1="46" y1="20" x2="46" y2="1" />
            <line x1="58" y1="20" x2="58" y2="4" />
            <line x1="70" y1="20" x2="70" y2="2" />
            <line x1="82" y1="20" x2="82" y2="0" />
            <line x1="94" y1="20" x2="94" y2="3" />
          </g>
          {/* Simple sentry post */}
          <g transform="translate(104, -8)">
            <line x1="4" y1="32" x2="4" y2="5" stroke="#451a03" strokeWidth="3" />
            <line x1="22" y1="32" x2="22" y2="5" stroke="#451a03" strokeWidth="3" />
            <rect x="0" y="5" width="26" height="6" fill="#78350f" />
            <polygon points="-2,5 13,-6 28,5" fill="#a16207" />
          </g>
        </g>
      )}

      {/* ============================================================== */}
      {/* 5. DISTRESS FX: ONLY RENDERED IN CRITICAL CRISIS OR WAR LOSS */}
      {/* ============================================================== */}
      {distress === 'critical' && (
        <g id="distress-overlay">
          {/* Jagged wall cracks */}
          <path
            d="M 680,245 L 686,252 L 682,260 L 690,268 M 470,220 L 476,230 L 472,238"
            stroke="#0f172a"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Roaring Flames */}
          <g fill="#f97316">
            <polygon points="210,235 214,215 220,225 225,205 230,228 235,218 240,238" fill="#ea580c" />
            <polygon points="215,235 220,220 225,212 230,225 235,235" fill="#fbbf24" />

            <polygon points="610,232 615,210 622,222 628,198 634,224 640,212 645,234" fill="#dc2626" />
            <polygon points="616,232 622,216 628,206 634,222 640,232" fill="#fde047" />

            <polygon points="410,210 415,188 422,202 428,178 434,204 440,192 445,212" fill="#ef4444" />
            <polygon points="416,210 422,194 428,184 434,200 440,210" fill="#fef08a" />
          </g>

          {/* Billowing Heavy Smoke Clouds */}
          <g fill="rgba(30, 41, 59, 0.78)">
            <circle cx="225" cy="195" r="16" />
            <circle cx="232" cy="165" r="24" />
            <circle cx="222" cy="130" r="34" />
            <circle cx="210" cy="85" r="46" opacity="0.55" />

            <circle cx="628" cy="190" r="18" />
            <circle cx="636" cy="155" r="26" />
            <circle cx="625" cy="115" r="38" />
            <circle cx="642" cy="70" r="50" opacity="0.5" />

            <circle cx="428" cy="170" r="20" />
            <circle cx="438" cy="130" r="30" />
            <circle cx="425" cy="85" r="42" />
            <circle cx="440" cy="38" r="54" opacity="0.45" />
          </g>

          {/* Broken Barricade */}
          <polygon points="495,310 505,302 518,312 510,320" fill="#78350f" stroke="#451a03" strokeWidth="2" />
        </g>
      )}
    </svg>
  )
}
