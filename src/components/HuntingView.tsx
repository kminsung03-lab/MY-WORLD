import React from 'react'
import type { Monster, Player } from '../types/game'
import { MONSTERS } from '../constants/gameData'

interface HuntingViewProps {
  player: Player
  onHunt: (id: string) => void
  onRest: () => void
}

export const HuntingView: React.FC<HuntingViewProps> = ({
  player,
  onHunt,
  onRest,
}) => {
  return (
    <div className="view-panel hunting-view">
      <div className="view-intro">
        <h2>🌲 사냥터: 미개척 야생 구역</h2>
        <p>
          마을 주변을 배회하는 몬스터를 토벌하여 <strong>안전한 부지(영토)</strong>를 확보하고, 식량과 골드를 획득하세요!
        </p>
      </div>

      {player.hp <= 25 && (
        <div className="combat-warning-banner">
          <span>⚠️ 현재 체력이 위험 수준({player.hp} HP)입니다! 무리하게 싸우면 위험합니다.</span>
          <button className="btn-emergency-rest" onClick={onRest}>
            🛏️ 즉시 휴식하기
          </button>
        </div>
      )}

      <div className="monsters-grid">
        {MONSTERS.map((m: Monster) => {
          // Estimated combat calculation
          const dmgDealt = Math.max(1, player.attack - m.defense)
          const turns = Math.ceil(m.hp / dmgDealt)
          const rawDmgTaken = Math.max(1, m.attack - player.defense)
          const estDamage = rawDmgTaken * (turns - 1)
          const isLethal = player.hp <= estDamage
          const canFight = player.hp > 15

          return (
            <div key={m.id} className="monster-card">
              <div className="m-header">
                <span className="m-icon">{m.icon}</span>
                <div>
                  <h4 className="m-name">{m.name}</h4>
                  <span className="m-rec-lvl">권장 Lv.{m.recommendedLevel}+</span>
                </div>
              </div>

              <p className="m-desc">{m.description}</p>

              {/* Monster Stats */}
              <div className="m-stats">
                <span className="stat-tag">HP {m.hp}</span>
                <span className="stat-tag">공격력 {m.attack}</span>
                <span className="stat-tag">방어력 {m.defense}</span>
              </div>

              {/* Conquest Rewards Highlight */}
              <div className="m-rewards">
                <div className="territory-reward-highlight">
                  <span className="reward-label">개척 보상:</span>
                  <span className="reward-land">🗺️ 영토 +{m.territoryReward} 구역 확보!</span>
                </div>
                <div className="other-rewards">
                  <span>🪙 {m.goldReward} G</span>
                  <span>🍖 {m.foodReward} 식량</span>
                  <span>✨ {m.expReward} EXP</span>
                </div>
              </div>

              {/* Combat Estimate */}
              <div className="combat-estimate">
                <span>예상 피격: </span>
                <strong className={isLethal ? 'text-red' : 'text-orange'}>
                  약 -{estDamage} HP {isLethal ? '(치명적!)' : ''}
                </strong>
              </div>

              <button
                className={`btn-hunt ${canFight ? (isLethal ? 'danger' : 'ready') : 'disabled'}`}
                disabled={!canFight}
                onClick={() => onHunt(m.id)}
              >
                {canFight ? `⚔️ [${m.name}] 토벌하여 땅 확보` : '체력 부족 (휴식 필요)'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
