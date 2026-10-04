import React, { useState } from 'react'
import type { Player } from '../types/game'
import { MINING_NODES } from '../constants/gameData'

interface MiningViewProps {
  player: Player
  activeNodes: Record<string, number>
  onMine: (id: string) => void
  onNavigateToTown: () => void
}

export const MiningView: React.FC<MiningViewProps> = ({
  player,
  activeNodes,
  onMine,
  onNavigateToTown,
}) => {
  const [clickedNode, setClickedNode] = useState<string | null>(null)

  const handleHit = (id: string) => {
    setClickedNode(id)
    onMine(id)
    setTimeout(() => {
      setClickedNode(null)
    }, 200)
  }

  return (
    <div className="view-panel mining-view">
      <div className="view-intro">
        <h2>⛏️ 채석장 &amp; 광산</h2>
        <p>
          마을 건축소에 필요한 <strong>석재(돌)와 철광석</strong>을 채굴하세요! 대장간을 증축하면 채광 파워가 강해집니다.
        </p>
      </div>

      <div className="mining-header-info">
        <span className="power-tag">
          🔨 현재 나의 채광 파워: <strong>{player.miningPower}</strong>
        </span>
        <button className="link-btn-alt" onClick={onNavigateToTown}>
          🏛️ 모은 광물로 마을 지으러 가기
        </button>
      </div>

      <div className="mining-nodes-grid">
        {MINING_NODES.map((node) => {
          const currentHp = activeNodes[node.id] ?? node.hp
          const hpPercent = Math.max(0, Math.min(100, (currentHp / node.maxHp) * 100))
          const isAnimating = clickedNode === node.id

          return (
            <div
              key={node.id}
              className={`mining-node-card ${isAnimating ? 'shake-rock' : ''}`}
            >
              <div className="node-icon-wrapper">
                <span className="node-icon">{node.icon}</span>
              </div>

              <h4 className="node-name">{node.name}</h4>
              <p className="node-desc">{node.description}</p>

              <div className="node-hp-bar-wrapper">
                <div className="node-hp-label">
                  <span>암석 내구도</span>
                  <span>{currentHp} / {node.maxHp}</span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill rock-fill"
                    style={{ width: `${hpPercent}%` }}
                  />
                </div>
              </div>

              <div className="node-rewards">
                <span className="reward-title">완파 시 보상:</span>
                <div className="reward-tags">
                  <span>🪨 +{node.stoneReward} 석재</span>
                  <span>⛏️ +{node.ironReward} 철광석</span>
                  <span>🪙 +{node.goldReward} G</span>
                </div>
              </div>

              <button
                className="btn-mine"
                onClick={() => handleHit(node.id)}
              >
                ⛏️ 집중 채굴하기 (⚡ 1 AP)
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
