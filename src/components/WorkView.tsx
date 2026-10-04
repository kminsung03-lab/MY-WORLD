import React, { useState } from 'react'

interface WorkViewProps {
  onWorkLogging: () => void
  onNavigateToTown: () => void
}

export const WorkView: React.FC<WorkViewProps> = ({
  onWorkLogging,
  onNavigateToTown,
}) => {
  const [isWorking, setIsWorking] = useState(false)

  const handleWork = () => {
    setIsWorking(true)
    onWorkLogging()
    setTimeout(() => {
      setIsWorking(false)
    }, 250)
  }

  return (
    <div className="view-panel work-view">
      <div className="view-intro">
        <h2>🪵 벌목장 &amp; 건축 노동소</h2>
        <p>
          마을 건축에 필수적인 <strong>목재</strong>를 벌목하고, 기초 일당(골드)을 안정적으로 확보하세요.
        </p>
      </div>

      <div className="work-action-box">
        <div className={`tree-display ${isWorking ? 'tree-chop' : ''}`}>
          🌲
        </div>
        <button
          className={`btn-chop ${isWorking ? 'chopping' : ''}`}
          onClick={handleWork}
        >
          🪓 나무 벌목 및 목재 가공하기 (클릭)
        </button>
        <span className="work-yield">
          1회 작업 당: <strong>🪵 목재 +8~12개 &amp; 🪙 골드 +5 G</strong> 수령
        </span>
      </div>

      {/* Guide Flow Card */}
      <div className="game-loop-guide-card">
        <h3>🧭 MY-WORLD 개척 가이드라인</h3>
        <div className="guide-steps">
          <div className="step-card">
            <span className="step-num">1</span>
            <h4>🌲 사냥터</h4>
            <p>몬스터를 토벌하여 안전한 <strong>건축 부지(영토)</strong>를 확보합니다.</p>
          </div>
          <div className="step-card">
            <span className="step-num">2</span>
            <h4>⛏️ 광산 &amp; 🪵 벌목</h4>
            <p>건물을 올릴 <strong>돌, 철, 나무</strong>를 열심히 채취합니다.</p>
          </div>
          <div className="step-card">
            <span className="step-num">3</span>
            <h4>🏛️ 건축소</h4>
            <p>확보한 부지와 자재로 시설을 건설해 <strong>캐릭터와 마을</strong>을 강화합니다!</p>
          </div>
        </div>
        <div className="guide-footer">
          <button className="link-btn-alt" onClick={onNavigateToTown}>
            🏛️ 건축소로 이동하여 건물 짓기
          </button>
        </div>
      </div>
    </div>
  )
}
