import React from 'react'
import type { Building, BuildingCost, Resources, Territory } from '../types/game'

interface TownViewProps {
  buildings: Record<string, Building>
  resources: Resources
  territory: Territory
  getBuildingCost: (id: string) => BuildingCost
  onConstruct: (id: string) => void
  onNavigateToHunt: () => void
  onNavigateToMine: () => void
}

export const TownView: React.FC<TownViewProps> = ({
  buildings,
  resources,
  territory,
  getBuildingCost,
  onConstruct,
  onNavigateToHunt,
  onNavigateToMine,
}) => {
  const availableLand = territory.secured - territory.used

  return (
    <div className="view-panel town-view">
      <div className="view-intro">
        <h2>🏛️ 마을 건축소 &amp; 광장</h2>
        <p>
          자원을 투입하고 안전한 영토 부지에 시설을 건설하여 마을을 발전시키세요.
        </p>
      </div>

      {/* Quick Visual Representation of the Town */}
      <div className="village-canvas-card">
        <h3>🏘️ 우리 마을 전경</h3>
        <div className="village-buildings-display">
          {Object.values(buildings).map((b) => (
            <div
              key={b.id}
              className={`village-building-spot ${b.level > 0 ? 'built' : 'unbuilt'}`}
            >
              <div className="spot-icon">{b.icon}</div>
              <div className="spot-name">{b.name}</div>
              <div className="spot-level">
                {b.level > 0 ? `Lv.${b.level}` : '미건설'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Buildings Construction List */}
      <div className="buildings-grid">
        {Object.values(buildings).map((b) => {
          const cost = getBuildingCost(b.id)
          const isMax = b.level >= b.maxLevel
          const hasEnoughLand = availableLand >= b.landCost
          const hasEnoughGold = resources.gold >= cost.gold
          const hasEnoughWood = resources.wood >= cost.wood
          const hasEnoughStone = resources.stone >= cost.stone
          const hasEnoughIron = resources.iron >= cost.iron
          const canAffordResources =
            hasEnoughGold && hasEnoughWood && hasEnoughStone && hasEnoughIron

          const canBuild = !isMax && hasEnoughLand && canAffordResources

          return (
            <div
              key={b.id}
              className={`building-card ${b.level > 0 ? 'is-active' : ''}`}
            >
              <div className="b-header">
                <span className="b-icon">{b.icon}</span>
                <div className="b-titles">
                  <h4>{b.name}</h4>
                  <span className="b-level">
                    {b.level === 0 ? '신축 필요' : `Lv.${b.level} / ${b.maxLevel}`}
                  </span>
                </div>
              </div>

              <p className="b-desc">{b.description}</p>
              <div className="b-benefit">
                <span className="benefit-badge">효과</span> {b.benefitText}
              </div>

              {/* Requirements */}
              {!isMax && (
                <div className="b-requirements">
                  <div className="req-land">
                    <span className="req-title">필요 부지:</span>
                    <span className={hasEnoughLand ? 'val-ok' : 'val-no'}>
                      {b.landCost} 구역 {hasEnoughLand ? '✅' : `❌ (남은 부지 ${availableLand})`}
                    </span>
                  </div>

                  <div className="req-costs">
                    <span className="req-title">소모 자재:</span>
                    <div className="cost-badges">
                      <span className={hasEnoughGold ? 'badge-ok' : 'badge-no'}>
                        🪙 {cost.gold}
                      </span>
                      <span className={hasEnoughWood ? 'badge-ok' : 'badge-no'}>
                        🪵 {cost.wood}
                      </span>
                      <span className={hasEnoughStone ? 'badge-ok' : 'badge-no'}>
                        🪨 {cost.stone}
                      </span>
                      <span className={hasEnoughIron ? 'badge-ok' : 'badge-no'}>
                        ⛏️ {cost.iron}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="b-action">
                {isMax ? (
                  <button className="btn-build disabled" disabled>
                    최대 레벨 도달
                  </button>
                ) : (
                  <button
                    className={`btn-build ${canBuild ? 'ready' : 'blocked'}`}
                    disabled={!canBuild}
                    onClick={() => onConstruct(b.id)}
                  >
                    {b.level === 0 ? '🔨 건물 신축하기' : '⚡ 건물 증축하기'}
                  </button>
                )}

                {/* Helpful shortcut hints if blocked */}
                {!isMax && !canBuild && (
                  <div className="build-hint">
                    {!hasEnoughLand && (
                      <button className="link-btn" onClick={onNavigateToHunt}>
                        👉 영토 부족: 사냥터로 토벌하러 가기
                      </button>
                    )}
                    {hasEnoughLand && (!hasEnoughStone || !hasEnoughIron) && (
                      <button className="link-btn" onClick={onNavigateToMine}>
                        👉 자재 부족: 광산으로 채굴하러 가기
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
