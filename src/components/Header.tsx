import React from 'react'
import type { Resources, Territory, Player } from '../types/game'

interface HeaderProps {
  resources: Resources
  territory: Territory
  player: Player
  onRest: () => void
  onReset: () => void
}

export const Header: React.FC<HeaderProps> = ({
  resources,
  territory,
  player,
  onRest,
  onReset,
}) => {
  const availableLand = territory.secured - territory.used
  const landPercentage = territory.secured > 0 
    ? Math.min(100, Math.round((territory.used / territory.secured) * 100))
    : 0

  const hpPercentage = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100))
  const expPercentage = Math.max(0, Math.min(100, (player.exp / player.maxExp) * 100))

  return (
    <header className="header-panel">
      {/* Top bar: Title and Quick Controls */}
      <div className="header-top">
        <div className="game-brand">
          <span className="brand-icon">⚔️</span>
          <div>
            <h1 className="brand-title">MY-WORLD</h1>
            <span className="brand-tag">마을 개척 &amp; 로그라이크 RPG</span>
          </div>
        </div>

        <div className="header-actions">
          <button className="btn-rest" onClick={onRest} title="식량 5개를 소모해 HP 완전 회복">
            🛏️ 휴식 &amp; 치료 (HP 회복)
          </button>
          <button className="btn-reset" onClick={onReset} title="세이브 데이터 초기화">
            🔄 리셋
          </button>
        </div>
      </div>

      {/* Territory Status (Crucial Game Core) */}
      <div className="territory-banner">
        <div className="territory-header">
          <span className="territory-title">🗺️ 마을 영토 현황</span>
          <span className="territory-stats">
            확보된 영토: <strong>{territory.secured} 구역</strong> | 사용 중: <strong>{territory.used}</strong> | 
            <span className={availableLand > 0 ? 'text-green' : 'text-red'}>
              {' '}건설 가능 부지: <strong>{availableLand} 구역</strong>
            </span>
          </span>
        </div>
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill territory-fill"
            style={{ width: `${landPercentage}%` }}
          />
        </div>
        {availableLand <= 0 && (
          <div className="territory-alert">
            ⚠️ 남은 부지가 없습니다! <strong>사냥터에서 몬스터를 토벌</strong>하여 새로운 땅을 개척하세요.
          </div>
        )}
      </div>

      {/* Player Stats & Resources Grid */}
      <div className="header-stats-grid">
        {/* Player Profile */}
        <div className="player-stats-card">
          <div className="stat-row">
            <span className="player-level">Lv.{player.level} 모험가</span>
            <span className="player-combat-stats">
              ⚔️ {player.attack} | 🛡️ {player.defense} | ⛏️ {player.miningPower}
            </span>
          </div>

          <div className="bar-group">
            <div className="bar-label">
              <span>HP</span>
              <span>{player.hp} / {player.maxHp}</span>
            </div>
            <div className="progress-bar-container hp-bar">
              <div
                className="progress-bar-fill hp-fill"
                style={{ width: `${hpPercentage}%` }}
              />
            </div>
          </div>

          <div className="bar-group">
            <div className="bar-label">
              <span>EXP</span>
              <span>{player.exp} / {player.maxExp}</span>
            </div>
            <div className="progress-bar-container exp-bar">
              <div
                className="progress-bar-fill exp-fill"
                style={{ width: `${expPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Resources Ribbon */}
        <div className="resources-ribbon">
          <div className="resource-pill">
            <span className="res-icon">🪙</span>
            <div className="res-detail">
              <span className="res-name">골드</span>
              <span className="res-val">{resources.gold.toLocaleString()} G</span>
            </div>
          </div>

          <div className="resource-pill">
            <span className="res-icon">🪵</span>
            <div className="res-detail">
              <span className="res-name">목재</span>
              <span className="res-val">{resources.wood.toLocaleString()}</span>
            </div>
          </div>

          <div className="resource-pill">
            <span className="res-icon">🪨</span>
            <div className="res-detail">
              <span className="res-name">석재</span>
              <span className="res-val">{resources.stone.toLocaleString()}</span>
            </div>
          </div>

          <div className="resource-pill">
            <span className="res-icon">⛏️</span>
            <div className="res-detail">
              <span className="res-name">철광석</span>
              <span className="res-val">{resources.iron.toLocaleString()}</span>
            </div>
          </div>

          <div className="resource-pill">
            <span className="res-icon">🍖</span>
            <div className="res-detail">
              <span className="res-name">식량</span>
              <span className="res-val">{resources.food.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
