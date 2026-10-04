import React from 'react'
import type { GameLog } from '../types/game'

interface LogViewProps {
  logs: GameLog[]
}

export const LogView: React.FC<LogViewProps> = ({ logs }) => {
  const getBadgeClass = (type: GameLog['type']) => {
    switch (type) {
      case 'combat':
        return 'log-badge-combat'
      case 'mine':
        return 'log-badge-mine'
      case 'build':
        return 'log-badge-build'
      case 'level':
        return 'log-badge-level'
      default:
        return 'log-badge-info'
    }
  }

  const getBadgeText = (type: GameLog['type']) => {
    switch (type) {
      case 'combat':
        return '전투'
      case 'mine':
        return '채굴'
      case 'build':
        return '건축'
      case 'level':
        return '성장'
      default:
        return '알림'
    }
  }

  return (
    <div className="log-panel">
      <div className="log-header">
        <span className="log-title">📜 실시간 모험 &amp; 개척 일지</span>
        <span className="log-count">{logs.length}건 기록됨</span>
      </div>
      <div className="log-feed">
        {logs.map((log) => (
          <div key={log.id} className="log-item">
            <span className="log-time">{log.timestamp}</span>
            <span className={`log-badge ${getBadgeClass(log.type)}`}>
              {getBadgeText(log.type)}
            </span>
            <span className="log-text">{log.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
