import React from 'react'
import type { NightEvent } from '../types/game'

interface NightEventModalProps {
  event: NightEvent
  onStartNextDay: () => void
}

export const NightEventModal: React.FC<NightEventModalProps> = ({
  event,
  onStartNextDay,
}) => {
  return (
    <div className="night-modal-backdrop">
      <div className={`night-modal-card ${event.success ? 'is-success' : 'is-fail'}`}>
        <div className="night-modal-badge">
          🌙 Day {event.day} 밤 결산 &amp; 스토리
        </div>

        <div className="night-event-icon-circle">
          <span>{event.icon}</span>
        </div>

        <h2 className="night-event-title">{event.title}</h2>

        <div className="night-story-box">
          <p className="night-story-text">{event.storyText}</p>
        </div>

        <div className={`night-result-box ${event.success ? 'res-success' : 'res-fail'}`}>
          <div className="res-title">
            {event.success ? '🎉 사건 결과: 성공 / 격퇴' : '⚠️ 사건 결과: 피해 발생'}
          </div>
          <p className="res-desc">{event.resultText}</p>

          {/* Resource / Stat changes list */}
          <div className="changes-tags">
            {event.resourceChanges && Object.entries(event.resourceChanges).map(([k, v]) => {
              if (v === undefined || v === 0) return null
              const isPositive = v > 0
              let icon = '📦'
              let name = k
              if (k === 'gold') { icon = '🪙'; name = '골드' }
              if (k === 'wood') { icon = '🪵'; name = '목재' }
              if (k === 'stone') { icon = '🪨'; name = '석재' }
              if (k === 'iron') { icon = '⛏️'; name = '철광석' }
              if (k === 'food') { icon = '🍖'; name = '식량' }

              return (
                <span
                  key={k}
                  className={`change-tag ${isPositive ? 'tag-pos' : 'tag-neg'}`}
                >
                  {icon} {name} {isPositive ? `+${v}` : v}
                </span>
              )
            })}

            {event.hpChange && (
              <span className={`change-tag ${event.hpChange > 0 ? 'tag-pos' : 'tag-neg'}`}>
                ❤️ 체력 {event.hpChange > 0 ? `+${event.hpChange}` : event.hpChange} HP
              </span>
            )}

            {event.territoryChange && (
              <span className="change-tag tag-pos">
                🗺️ 영토 +{event.territoryChange}구역 편입!
              </span>
            )}
          </div>
        </div>

        {/* Next Threat / Strategy Warning */}
        <div className="next-warning-card">
          <span className="warning-label">🧭 다가오는 다음 위협 예고</span>
          <p className="warning-content">{event.nextWarning}</p>
        </div>

        {/* Action Button */}
        <button className="btn-next-day" onClick={onStartNextDay}>
          ☀️ 다음 날(Day {event.day + 1}) 시작하기 (⚡ 5 AP 충전)
        </button>
      </div>
    </div>
  )
}
