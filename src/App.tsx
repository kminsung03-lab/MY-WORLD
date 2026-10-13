import { useState } from 'react'
import { useRealmState } from './hooks/useRealmState'
import { RealmView } from './components/RealmView'
import { WorldMapView } from './components/WorldMapView'
import './App.css'

type TabType = 'realm' | 'world'

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('realm')
  const realm = useRealmState()

  return (
    <div className="game-app strategic-mode">
      {activeTab === 'realm' ? (
        <RealmView
          realm={realm}
          onOpenMap={() => setActiveTab('world')}
          onOpenLocal={() => setActiveTab('realm')}
        />
      ) : (
        <WorldMapView
          realm={realm}
          onReturnToTown={() => setActiveTab('realm')}
        />
      )}
    </div>
  )
}

export default App
