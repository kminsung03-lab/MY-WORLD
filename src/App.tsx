import { useState } from 'react'
import './App.css'

function App() {
  const [level, setLevel] = useState(1)
  const [gold, setGold] = useState(0)

  const handleTrain = () => {
    setLevel((prev) => prev + 1)
    setGold((prev) => prev + 10)
  }

  return (
    <div className="game-container">
      <header className="game-header">
        <div className="badge">🚀 Cloudflare Pages Ready</div>
        <h1 className="title">⚔️ MY-WORLD</h1>
        <p className="subtitle">
          Web-based 2D Roguelike &amp; RPG Project
        </p>
      </header>

      <main className="dashboard">
        <div className="card status-card">
          <h2>🛡️ 모험가 상태</h2>
          <div className="stats-grid">
            <div className="stat-box">
              <span className="stat-label">레벨</span>
              <span className="stat-value">Lv. {level}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">골드</span>
              <span className="stat-value">🪙 {gold} G</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">상태</span>
              <span className="stat-value active">온라인</span>
            </div>
          </div>
          <button className="action-button" onClick={handleTrain}>
            ⚔️ 수련하기 (Lv UP + Gold)
          </button>
        </div>

        <div className="card info-card">
          <h2>🌐 개발 &amp; 배포 환경</h2>
          <ul className="info-list">
            <li>
              <strong>프레임워크:</strong> React 19 + TypeScript + Vite
            </li>
            <li>
              <strong>호스팅:</strong> Cloudflare Pages (글로벌 엣지 배포)
            </li>
            <li>
              <strong>빌드 명령어:</strong> <code>npm run build</code> (출력: <code>dist</code>)
            </li>
            <li>
              <strong>다음 단계:</strong> GitHub 레포지토리 연결 후 2D 게임 엔진(Canvas/Phaser) 탑재
            </li>
          </ul>
        </div>
      </main>

      <footer className="game-footer">
        <p>© 2026 MY-WORLD Project. Powered by Cloudflare Pages &amp; React.</p>
      </footer>
    </div>
  )
}

export default App
