import React from 'react'
import type { RealmState } from '../types/realm'
import { analyzeRealmGrowth } from '../utils/realmGrowthVisuals'
import { LivingRealmDioramaSvg } from './LivingRealmDioramaSvg'

interface LivingRealmPanoramaProps {
  state: RealmState
  onOpenMap?: () => void
}

export const LivingRealmPanorama: React.FC<LivingRealmPanoramaProps> = ({ state, onOpenMap }) => {
  const analysis = analyzeRealmGrowth(state)
  const { tier, specialization, distress } = analysis

  return (
    <article className="living-realm-panorama-container">
      {/* 1. Panorama Header */}
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

      {/* 2. Pure Visual Landscape Viewport (No obscuring text cards!) */}
      <div className={`panorama-canvas-viewport spec-${specialization} tier-${tier} distress-${distress}`}>
        <LivingRealmDioramaSvg analysis={analysis} className="panorama-skyline-svg" />

        {/* Subtle Bottom Floating Sector Pills (Unobtrusive) */}
        <div className="panorama-sector-legend-strip">
          <div className={`sector-pill ${specialization === 'agrarian' ? 'active' : ''}`}>
            🌾 서부 곡창: {specialization === 'agrarian' ? (tier >= 3 ? '황금 대곡창·풍차 2기' : '장원 곡창·풍차') : '소박한 텃밭·헛간'}
          </div>
          <div className="sector-pill center-keep">
            👑 중앙 본성: {tier === 3 ? (specialization === 'agrarian' ? '녹원 대공 성채' : specialization === 'commercial' ? '무역 궁전' : '철벽 요새 궁성') : tier === 2 ? '석조 본성' : '목조 관저'} (Lv.{state.civicBuildings?.townHall?.level ?? 1})
          </div>
          <div className={`sector-pill ${specialization === 'commercial' ? 'active' : ''}`}>
            🪙 남부 시장: {specialization === 'commercial' ? (tier >= 3 ? '무역 상사·분수 광장' : '장터 파빌리온') : '노천 가판'}
          </div>
          <div className={`sector-pill ${specialization === 'military' ? 'active' : ''}`}>
            🛡️ 동부 방벽: {specialization === 'military' ? (tier >= 3 ? '다중 능보·4대 망루' : '석조 방벽·망루') : '통나무 목책'}
          </div>
        </div>

        {/* Distress Alarm Overlay if in critical distress */}
        {distress === 'critical' && (
          <div className="panorama-distress-banner">
            <span>🔥 {analysis.distressReason}</span>
          </div>
        )}
      </div>

      {/* 3. Detailed Information Grid below the Landscape Viewport */}
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
