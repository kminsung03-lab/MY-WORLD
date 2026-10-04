import { useState } from 'react'
import { useGameState } from './hooks/useGameState'
import { Header } from './components/Header'
import { TownView } from './components/TownView'
import { HuntingView } from './components/HuntingView'
import { MiningView } from './components/MiningView'
import { WorkView } from './components/WorkView'
import { LogView } from './components/LogView'
import { NightEventModal } from './components/NightEventModal'
import './App.css'

type TabType = 'town' | 'hunt' | 'mine' | 'work'

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('town')
  const {
    gameState,
    activeNodes,
    huntMonster,
    mineRock,
    workLogging,
    restAtTown,
    constructBuilding,
    getBuildingCost,
    endDay,
    startNextDay,
    resetSave,
  } = useGameState()

  const availableLand = gameState.territory.secured - gameState.territory.used

  return (
    <div className="game-app">
      {/* 1. Universal Top Header (Day, AP, Threat HUD, Territory, Player, Resources) */}
      <Header
        dayState={gameState.dayState}
        resources={gameState.resources}
        territory={gameState.territory}
        player={gameState.player}
        onRest={restAtTown}
        onEndDay={endDay}
        onReset={resetSave}
      />

      {/* 2. Navigation Tabs */}
      <nav className="game-nav-tabs">
        <button
          className={`tab-btn ${activeTab === 'town' ? 'active' : ''}`}
          onClick={() => setActiveTab('town')}
        >
          🏛️ 마을 건축소
          {availableLand <= 0 && <span className="tab-pill-warn">부지 부족</span>}
        </button>

        <button
          className={`tab-btn ${activeTab === 'hunt' ? 'active' : ''}`}
          onClick={() => setActiveTab('hunt')}
        >
          🌲 사냥터 (영토 개척)
          <span className="tab-pill-hunt">땅 확보 (1 AP)</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'mine' ? 'active' : ''}`}
          onClick={() => setActiveTab('mine')}
        >
          ⛏️ 채석장 &amp; 광산
          <span className="tab-pill-mine">석재·철 (1 AP)</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'work' ? 'active' : ''}`}
          onClick={() => setActiveTab('work')}
        >
          🪵 벌목 &amp; 노동
          <span className="tab-pill-work">목재·일당 (1 AP)</span>
        </button>
      </nav>

      {/* 3. Main Action View */}
      <main className="main-content-area">
        {activeTab === 'town' && (
          <TownView
            buildings={gameState.buildings}
            resources={gameState.resources}
            territory={gameState.territory}
            getBuildingCost={getBuildingCost}
            onConstruct={constructBuilding}
            onNavigateToHunt={() => setActiveTab('hunt')}
            onNavigateToMine={() => setActiveTab('mine')}
          />
        )}

        {activeTab === 'hunt' && (
          <HuntingView
            player={gameState.player}
            onHunt={huntMonster}
            onRest={restAtTown}
          />
        )}

        {activeTab === 'mine' && (
          <MiningView
            player={gameState.player}
            activeNodes={activeNodes}
            onMine={mineRock}
            onNavigateToTown={() => setActiveTab('town')}
          />
        )}

        {activeTab === 'work' && (
          <WorkView
            onWorkLogging={workLogging}
            onNavigateToTown={() => setActiveTab('town')}
          />
        )}
      </main>

      {/* 4. Action & Progression Log Feed */}
      <LogView logs={gameState.logs} />

      {/* 5. Footer */}
      <footer className="game-footer">
        <span>💾 로컬스토리지 자동 저장 활성화 | ⚡ Cloudflare Pages &amp; Workers 호스팅</span>
      </footer>

      {/* 6. Night Story & Event Modal */}
      {gameState.currentNightEvent && (
        <NightEventModal
          event={gameState.currentNightEvent}
          onStartNextDay={startNextDay}
        />
      )}
    </div>
  )
}

export default App
