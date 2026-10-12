import { useState } from 'react'
import { useGameState } from './hooks/useGameState'
import { useRealmState } from './hooks/useRealmState'
import { Header } from './components/Header'
import { TownView } from './components/TownView'
import { HuntingView } from './components/HuntingView'
import { MiningView } from './components/MiningView'
import { WorkView } from './components/WorkView'
import { WorldMapView } from './components/WorldMapView'
import { LogView } from './components/LogView'
import { NightEventModal } from './components/NightEventModal'
import { RealmView } from './components/RealmView'
import './App.css'

type TabType = 'realm' | 'town' | 'hunt' | 'mine' | 'work' | 'world'

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('realm')
  const realm = useRealmState()
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
    <div className={`game-app ${activeTab === 'realm' ? 'strategic-mode' : ''}`}>
      {activeTab === 'realm' && (
        <RealmView
          realm={realm}
          onOpenMap={() => setActiveTab('world')}
          onOpenLocal={() => setActiveTab('realm')}
        />
      )}

      {activeTab !== 'realm' && <>
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
          className="tab-btn tab-btn-realm"
          onClick={() => setActiveTab('realm')}
        >
          👑 영지 경영
          <span className="tab-pill-realm">월간 전략</span>
        </button>

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

        {/* 🗺️ World Map Tab */}
        <button
          className={`tab-btn tab-btn-world ${activeTab === 'world' ? 'active' : ''}`}
          onClick={() => setActiveTab('world')}
        >
          🗺️ 대륙 세계지도
          <span className="tab-pill-world">대륙 정세</span>
        </button>
      </nav>

      {/* 3. Main Action View */}
      <main className="main-content-area">
        {activeTab !== 'world' && (
          <div
            className="unified-integration-notice"
            style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              border: '1px solid #38bdf8',
              borderRadius: '12px',
              padding: '12px 18px',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: '13px', color: '#e2e8f0' }}>
              👑 <strong>월간 전략 통합 체제</strong>: 게임이 월간 군주 결단 체제로 일원화되었습니다. 과거 수동 채집 대신 <strong>[👑 영지 경영 → 🏛 시정과 산업]</strong>에서 월간 시정 명령과 선택형 현장 순행을 진행하세요!
            </span>
            <button
              onClick={() => setActiveTab('realm')}
              style={{
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              👑 영지 경영으로 복귀
            </button>
          </div>
        )}

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

        {activeTab === 'world' && (
          <WorldMapView
            gameState={gameState}
            realm={realm}
            onReturnToTown={() => setActiveTab('realm')}
          />
        )}
      </main>

      {/* 4. Action & Progression Log Feed */}
      <LogView logs={gameState.logs} />
      </>}

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
