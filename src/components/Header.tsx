import React from 'react'
import type { Resources, Territory, Player, DayState } from '../types/game'

interface HeaderProps {
  dayState: DayState
  resources: Resources
  territory: Territory
  player: Player
  onRest: () => void
  onEndDay: () => void
  onReset: () => void
}

export const Header: React.FC<HeaderProps> = ({
  dayState,
  resources,
  territory,
  player,
  onRest,
  onEndDay,
  onReset,
}) => {
  const availableLand = territory.secured - territory.used
  const landPercentage =
    territory.secured > 0
      ? Math.min(100, Math.round((territory.used / territory.secured) * 100))
      : 0

  const hpPercentage = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100))
  const expPercentage = Math.max(0, Math.min(100, (player.exp / player.maxExp) * 100))

  return (
    <header className="header-panel">
      {/* 1. Brand & Day / AP Row */}
      <div className="header-top">
        <div className="game-brand">
          <span className="brand-icon">⚔️</span>
          <div>
            <div className="brand-title-wrap">
              <h1 className="brand-title">🏰 MY-WORLD</h1>
              <span className="day-badge">☀️ Day {dayState.day}</span>
            </div>
            <span className="brand-tag">👑 루미나스 왕국 변경 개척 영주령</span>
          </div>
        </div>

        {/* AP Tracker & End Day Action */}
        <div className="day-control-box">
          <div className="ap-tracker">
            <span className="ap-label">⚡ 행동력 (AP)</span>
            <div className="ap-pips">
              {Array.from({ length: dayState.maxAp }).map((_, i) => (
                <span
                  key={i}
                  className={`ap-pip ${i < dayState.ap ? 'filled' : 'empty'}`}
                />
              ))}
            </div>
            <span className="ap-number">
              {dayState.ap} / {dayState.maxAp} AP
            </span>
          </div>

          <button
            className={`btn-end-day ${dayState.ap === 0 ? 'pulse-ready' : ''}`}
            onClick={onEndDay}
            title="하루를 마무리하고 밤의 사건을 맞이합니다."
          >
            🌙 하루 마무리 (취침)
            {dayState.ap === 0 && <span className="ap-zero-badge">준비됨</span>}
          </button>
        </div>

        <div className="header-actions">
          <button className="btn-rest" onClick={onRest} title="식량 5개를 소모해 HP 완전 회복">
            🛏️ 휴식 (HP 회복)
          </button>
          <button className="btn-reset" onClick={onReset} title="세이브 데이터 초기화">
            🔄 리셋
          </button>
        </div>
      </div>

      {/* 2. Upcoming Threat / Strategy Warning Strip */}
      <div className="threat-hud-strip">
        <span className="threat-hud-icon">🧭</span>
        <div className="threat-hud-text">
          <span className="threat-hud-label">예고된 사건:</span>
          <span className="threat-hud-warning">{dayState.upcomingWarning}</span>
        </div>
      </div>

      {/* 3. Territory Status Bar */}
      <div className="territory-banner">
        <div className="territory-header">
          <span className="territory-title">🗺️ 마을 영토 현황</span>
          <span className="territory-stats">
            확보된 영토: <strong>{territory.secured} 구역</strong> | 사용 중: <strong>{territory.used}</strong> |{' '}
            <span className={availableLand > 0 ? 'text-green' : 'text-red'}>
              건설 가능 부지: <strong>{availableLand} 구역</strong>
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
            ⚠️ 남은 부지가 없습니다! <strong>사냥터에서 몬스터를 토벌</strong>하여 새로운 땅을 개척하세요. (1 AP 소모)
          </div>
        )}
      </div>

      {/* 4. Player Stats & Resources Ribbon */}
      <div className="header-stats-grid">
        <div className="player-stats-card">
          <div className="stat-row">
            <span className="player-level">👑 Lv.{player.level} 영주</span>
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
