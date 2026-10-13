import React from 'react'
import type { RealmState } from '../types/realm'
import { analyzeRealmGrowth } from '../utils/realmGrowthVisuals'

interface LivingRealmPanoramaProps {
  state: RealmState
  onOpenMap?: () => void
}

export const LivingRealmPanorama: React.FC<LivingRealmPanoramaProps> = ({ state, onOpenMap }) => {
  const analysis = analyzeRealmGrowth(state)
  const { tier, specialization, distress, features } = analysis

  // Sky tone determined by distress & time
  let skyGradient = 'linear-gradient(180deg, #38bdf8 0%, #bae6fd 60%, #fef08a 100%)' // peaceful bright day
  if (distress === 'critical') {
    skyGradient = 'linear-gradient(180deg, #1e1b4b 0%, #7f1d1d 55%, #b91c1c 100%)' // apocalyptic crisis
  } else if (distress === 'distressed') {
    skyGradient = 'linear-gradient(180deg, #475569 0%, #b45309 60%, #fef08a 100%)' // tense dusk
  }

  return (
    <article className="living-realm-panorama-container">
      <header className="panorama-header">
        <div className="panorama-title-wrap">
          <span className="panorama-kicker">✦ LIVING REALM PANORAMA · 영지 전경</span>
          <h2 className="panorama-realm-title">
            에르덴 본령: {analysis.tierTitle}
          </h2>
        </div>
        <div className="panorama-badges">
          <span className="p-badge p-tier-badge">
            🏆 {analysis.tierLabel}
          </span>
          <span
            className="p-badge p-spec-badge"
            style={{ borderColor: analysis.specColor, color: analysis.specColor }}
          >
            {analysis.specIcon} {analysis.specLabel}
          </span>
          {distress !== 'normal' && (
            <span className={`p-badge p-distress-badge distress-${distress}`}>
              {distress === 'critical' ? '🔥 심각한 전란·치안 붕괴' : '⚠️ 경계·불안정'}
            </span>
          )}
          {onOpenMap && (
            <button className="btn-panorama-map" onClick={onOpenMap} title="대륙 지도에서 영지 위치와 주변 형세를 조망합니다">
              🗺️ 지도에서 보기
            </button>
          )}
        </div>
      </header>

      {/* Dynamic Visual Panorama Viewport */}
      <div className="panorama-canvas-viewport" style={{ background: skyGradient }}>
        {/* Distant Mountains */}
        <svg className="panorama-skyline-svg" viewBox="0 0 1000 320" preserveAspectRatio="none" aria-hidden="true">
          {/* Distant Mountain Range */}
          <polygon
            points="0,220 90,140 180,210 280,110 390,200 500,90 620,190 730,120 840,210 930,130 1000,200 1000,320 0,320"
            fill={distress === 'critical' ? '#450a0a' : '#64748b'}
            opacity="0.45"
          />
          {/* Midground Hills */}
          <polygon
            points="0,240 130,180 260,230 420,170 560,220 710,160 860,220 1000,180 1000,320 0,320"
            fill={distress === 'critical' ? '#262626' : '#334155'}
            opacity="0.6"
          />

          {/* Sun or Moon/Blood Sky */}
          {distress === 'critical' ? (
            <circle cx="820" cy="70" r="32" fill="#ef4444" opacity="0.85" filter="drop-shadow(0 0 12px #dc2626)" />
          ) : distress === 'distressed' ? (
            <circle cx="820" cy="80" r="30" fill="#f59e0b" opacity="0.9" />
          ) : (
            <circle cx="850" cy="60" r="36" fill="#fef08a" opacity="0.95" filter="drop-shadow(0 0 15px #fde047)" />
          )}

          {/* Clouds */}
          {distress === 'normal' && (
            <g fill="#ffffff" opacity="0.65">
              <ellipse cx="220" cy="65" rx="55" ry="16" />
              <ellipse cx="250" cy="55" rx="35" ry="20" />
              <ellipse cx="610" cy="85" rx="70" ry="18" />
              <ellipse cx="645" cy="75" rx="42" ry="22" />
            </g>
          )}

          {/* Rolling Farmland Hills (Ground Base) */}
          <polygon
            points="0,250 250,235 500,245 750,238 1000,250 1000,320 0,320"
            fill={specialization === 'agrarian' ? '#4d7c0f' : '#3f6212'}
          />
        </svg>

        {/* Interactive District Visual Layers Overlay */}
        <div className="panorama-interactive-stage">
          {/* 1. West Sector: Agrarian Zone */}
          <div className={`district-visual-sector sector-agri tier-${tier} ${specialization === 'agrarian' ? 'is-focus' : ''}`}>
            <div className="sector-tag">🌾 농경·곡창 구역</div>
            {/* Visual elements */}
            <div className="agri-visual-items">
              {/* Furrows and Fields */}
              <div className={`visual-field-furrows ${tier >= 2 ? 'expanded' : ''} ${specialization === 'agrarian' ? 'golden' : ''}`} />
              {/* Barn / Granary */}
              <div className={`visual-granary ${features.hasGranaryComplex ? 'lvl-high' : tier >= 2 ? 'lvl-mid' : 'lvl-low'}`}>
                <span className="building-icon">{features.hasGranaryComplex ? '🏛️' : '🌾'}</span>
                <span className="building-name">{features.hasGranaryComplex ? '대형 비축 사일로' : '장원 곡창'}</span>
              </div>
              {/* Windmill */}
              {(features.hasWindmills || tier >= 2) && (
                <div className={`visual-windmill ${tier >= 3 ? 'double' : ''}`}>
                  <span className="windmill-fan">⚙️</span>
                  <span className="windmill-base">풍차 방앗간</span>
                </div>
              )}
            </div>
          </div>

          {/* 2. Center Sector: Citadel & Keep */}
          <div className={`district-visual-sector sector-keep tier-${tier} ${specialization}`}>
            <div className="sector-tag">👑 에르덴 본성 (영주 관저)</div>
            <div className="keep-visual-items">
              {/* Citadel / Manor Building */}
              <div className={`visual-citadel tier-${tier} spec-${specialization}`}>
                <div className="citadel-spires">
                  {tier === 3 ? (
                    <>
                      <span className="spire">🏰</span>
                      <span className="flag-crest">🚩</span>
                      <span className="spire">🏰</span>
                    </>
                  ) : tier === 2 ? (
                    <>
                      <span className="spire">🏛️</span>
                      <span className="flag-crest">🚩</span>
                    </>
                  ) : (
                    <span className="spire">🛖</span>
                  )}
                </div>
                <div className="citadel-body">
                  <strong>{tier === 3 ? '백석 대공 성채' : tier === 2 ? '석조 영주 본성' : '목조 개척 관저'}</strong>
                  <small>Lv.{state.civicBuildings?.townHall?.level ?? 1} 시정 집무청</small>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Center-South Sector: Commercial & Market Zone */}
          <div className={`district-visual-sector sector-comm tier-${tier} ${specialization === 'commercial' ? 'is-focus' : ''}`}>
            <div className="sector-tag">🪙 상업·장터 구역</div>
            <div className="comm-visual-items">
              {/* Cobblestone Plaza / Road */}
              <div className={`visual-plaza ${tier >= 2 ? 'paved' : 'dirt'} ${specialization === 'commercial' ? 'marble' : ''}`} />
              {/* Market Stalls */}
              <div className="visual-market-stalls">
                {tier >= 3 ? (
                  <>
                    <span className="stall stall-red">🎪 무역 상사</span>
                    <span className="stall stall-blue">🏦 환전소</span>
                    <span className="stall stall-gold">⛲ 대리석 분수대</span>
                  </>
                ) : tier >= 2 ? (
                  <>
                    <span className="stall stall-red">🎪 장터 천막</span>
                    <span className="stall stall-gold">⚖️ 계량소</span>
                  </>
                ) : (
                  <span className="stall stall-simple">🧺 노천 가판</span>
                )}
              </div>
              {/* Trade Caravans */}
              {features.hasTradeCaravan && (
                <div className="visual-caravan">
                  <span>🐫 상단 마차 행렬</span>
                </div>
              )}
            </div>
          </div>

          {/* 4. East Sector: Military & Ramparts Zone */}
          <div className={`district-visual-sector sector-mil tier-${tier} ${specialization === 'military' ? 'is-focus' : ''}`}>
            <div className="sector-tag">🛡️ 외곽 방벽·주둔군 구역</div>
            <div className="mil-visual-items">
              {/* Walls & Bastion */}
              <div className={`visual-walls ${tier >= 3 ? 'fort-high' : tier >= 2 ? 'fort-mid' : 'fort-low'}`}>
                <span className="wall-icon">{tier >= 3 ? '🧱 다중 석벽·능보' : tier >= 2 ? '🧱 석조 방벽' : '🪵 통나무 목책'}</span>
                {features.hasWatchtowers && <span className="tower-icon">🗼 감시 망루</span>}
              </div>
              {/* Barracks & Soldiers */}
              <div className="visual-garrison">
                <span className="garrison-flag">{specialization === 'military' ? '⚔️ 열병 연병장' : '🛡️ 수비 초소'}</span>
                <small>{state.soldiers + state.levies}명 주둔</small>
              </div>
            </div>
          </div>

          {/* Distress / Damage FX Overlay */}
          {distress !== 'normal' && (
            <div className={`panorama-distress-overlay level-${distress}`}>
              <div className="smoke-plume plume-1">💨</div>
              <div className="smoke-plume plume-2">💨</div>
              {distress === 'critical' && <div className="smoke-plume plume-3">🔥</div>}
              <div className="distress-alarm-strip">
                <span>⚠️ {analysis.distressReason}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analytical Chronicle Footnotes: Recent Milestone & Next Target */}
      <footer className="panorama-footer-grid">
        <div className="p-card card-summary">
          <span className="card-kicker">풍경 조망 해설</span>
          <p className="card-desc">{analysis.summaryPhrase}</p>
        </div>

        <div className="p-card card-milestone">
          <div className="card-kicker-row">
            <span className="card-kicker text-amber">🌱 직전 주요 변화 (Recent Milestone)</span>
          </div>
          <p className="card-desc milestone-highlight">{analysis.recentMilestone}</p>
        </div>

        <div className="p-card card-target">
          <div className="card-kicker-row">
            <span className="card-kicker text-cyan">🎯 다음 성장 과업 (Next Goal)</span>
          </div>
          <p className="card-desc target-highlight">{analysis.nextGoal}</p>
        </div>

        <div className="p-card card-investments">
          <span className="card-kicker">실제 투자 기반 발전 지표</span>
          <div className="investment-bars">
            <div className="inv-row">
              <span>🌾 농업 투자</span>
              <div className="bar-bg"><div className="bar-fill agri" style={{ width: `${analysis.agriScore}%` }} /></div>
              <strong>{analysis.agriScore}%</strong>
            </div>
            <div className="inv-row">
              <span>🪙 상업 투자</span>
              <div className="bar-bg"><div className="bar-fill comm" style={{ width: `${analysis.commScore}%` }} /></div>
              <strong>{analysis.commScore}%</strong>
            </div>
            <div className="inv-row">
              <span>🛡️ 군사 투자</span>
              <div className="bar-bg"><div className="bar-fill mil" style={{ width: `${analysis.milScore}%` }} /></div>
              <strong>{analysis.milScore}%</strong>
            </div>
          </div>
        </div>
      </footer>
    </article>
  )
}
