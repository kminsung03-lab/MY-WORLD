import React, { useState, useRef, useEffect, useCallback } from 'react'
import type { Nation, Fief } from '../types/worldMap'
import type { GameState } from '../types/game'
import {
  CONTINENT_NAME,
  MAP_WIDTH,
  MAP_HEIGHT,
  NATIONS,
  FIEFS,
  TERRAIN_FEATURES,
} from '../constants/worldData'

interface WorldMapViewProps {
  gameState: GameState
  onReturnToTown: () => void
}

export const WorldMapView: React.FC<WorldMapViewProps> = ({
  gameState,
  onReturnToTown,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Zoom & Pan state
  const [zoom, setZoom] = useState<number>(0.85)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: -250, y: -150 })
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  // Selected state
  const [selectedFief, setSelectedFief] = useState<Fief | null>(() => {
    return FIEFS.find((f) => f.id === 'my_world_fief') || null
  })
  const [selectedNation, setSelectedNation] = useState<Nation | null>(() => {
    return NATIONS.kingdom_luminas || null
  })

  // Map filters
  const [showBorders, setShowBorders] = useState<boolean>(true)
  const [showTerrain, setShowTerrain] = useState<boolean>(true)

  // Center camera on a specific coordinate
  const centerOnPoint = useCallback((mapX: number, mapY: number, targetZoom = 1.1) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const containerWidth = rect.width || 800
    const containerHeight = rect.height || 600

    setZoom(targetZoom)
    setPan({
      x: containerWidth / 2 - mapX * targetZoom,
      y: containerHeight / 2 - mapY * targetZoom,
    })
  }, [])

  // Initial focus on Player's Fief
  useEffect(() => {
    centerOnPoint(820, 540, 0.95)
  }, [centerOnPoint])

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87
    const newZoom = Math.min(2.5, Math.max(0.45, zoom * zoomFactor))

    // Zoom towards mouse position
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const mapX = (mouseX - pan.x) / zoom
      const mapY = (mouseY - pan.y) / zoom

      setZoom(newZoom)
      setPan({
        x: mouseX - mapX * newZoom,
        y: mouseY - mapY * newZoom,
      })
    } else {
      setZoom(newZoom)
    }
  }

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return // Left click only
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Click on Canvas to select Fief or Nation
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!canvasRef.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    // Convert screen coord to map coord
    const mapX = (clickX - pan.x) / zoom
    const mapY = (clickY - pan.y) / zoom

    // Check hit test against Fiefs (radius 30px)
    let clickedFief: Fief | null = null
    for (const f of FIEFS) {
      const dx = f.x - mapX
      const dy = f.y - mapY
      if (Math.sqrt(dx * dx + dy * dy) <= 32) {
        clickedFief = f
        break
      }
    }

    if (clickedFief) {
      setSelectedFief(clickedFief)
      const nation = NATIONS[clickedFief.nationId]
      if (nation) setSelectedNation(nation)
      return
    }

    // Hit test against Nations polygons
    for (const nation of Object.values(NATIONS)) {
      if (isPointInPolygon([mapX, mapY], nation.territoryPoints)) {
        setSelectedNation(nation)
        setSelectedFief(null)
        return
      }
    }
  }

  // Ray-casting algorithm for point in polygon
  function isPointInPolygon(point: [number, number], vs: [number, number][]) {
    const x = point[0], y = point[1]
    let inside = false
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      const xi = vs[i][0], yi = vs[i][1]
      const xj = vs[j][0], yj = vs[j][1]
      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
      if (intersect) inside = !inside
    }
    return inside
  }

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    // Clear background (Deep parchment / fantasy ocean)
    ctx.fillStyle = '#0a101d'
    ctx.fillRect(0, 0, width, height)

    ctx.save()
    // Apply Pan and Zoom transform
    ctx.translate(pan.x, pan.y)
    ctx.scale(zoom, zoom)

    // 1. Draw Continent Landmass Background
    ctx.fillStyle = '#141c2c'
    ctx.strokeStyle = '#273852'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.rect(40, 40, MAP_WIDTH - 80, MAP_HEIGHT - 80)
    ctx.fill()
    ctx.stroke()

    // Grid lines for vintage cartography
    ctx.strokeStyle = 'rgba(74, 98, 134, 0.12)'
    ctx.lineWidth = 1
    for (let x = 100; x < MAP_WIDTH; x += 150) {
      ctx.beginPath()
      ctx.moveTo(x, 40)
      ctx.lineTo(x, MAP_HEIGHT - 40)
      ctx.stroke()
    }
    for (let y = 100; y < MAP_HEIGHT; y += 150) {
      ctx.beginPath()
      ctx.moveTo(40, y)
      ctx.lineTo(MAP_WIDTH - 40, y)
      ctx.stroke()
    }

    // 2. Draw Nations Territories (Polygons with tint)
    if (showBorders) {
      Object.values(NATIONS).forEach((nation) => {
        const pts = nation.territoryPoints
        if (pts.length < 3) return

        ctx.save()
        ctx.beginPath()
        ctx.moveTo(pts[0][0], pts[0][1])
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i][0], pts[i][1])
        }
        ctx.closePath()

        // Soft national color fill
        ctx.fillStyle = nation.color + '26' // ~15% opacity
        ctx.fill()

        // Border line
        ctx.strokeStyle = nation.accentColor
        ctx.lineWidth = selectedNation?.id === nation.id ? 4 : 2
        ctx.setLineDash([8, 4])
        ctx.stroke()
        ctx.restore()

        // Nation Name Label in center
        const centerX = pts.reduce((sum, p) => sum + p[0], 0) / pts.length
        const centerY = pts.reduce((sum, p) => sum + p[1], 0) / pts.length

        ctx.save()
        ctx.font = 'bold 20px -apple-system, sans-serif'
        ctx.fillStyle = nation.accentColor
        ctx.textAlign = 'center'
        ctx.shadowColor = 'rgba(0,0,0,0.8)'
        ctx.shadowBlur = 8
        ctx.fillText(`${nation.emblem} ${nation.name}`, centerX, centerY)
        ctx.font = '12px -apple-system, sans-serif'
        ctx.fillStyle = 'rgba(255,255,255,0.6)'
        ctx.fillText(nation.typeLabel, centerX, centerY + 22)
        ctx.restore()
      })
    }

    // 3. Draw Terrain Features (Mountains, Forests, Rivers)
    if (showTerrain) {
      TERRAIN_FEATURES.forEach((feature) => {
        ctx.save()
        if (feature.type === 'mountain') {
          ctx.fillStyle = 'rgba(68, 64, 60, 0.45)'
          ctx.strokeStyle = '#78716c'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          // Mountain peaks triangles
          const peaks = 5
          const step = feature.width / peaks
          for (let i = 0; i < peaks; i++) {
            const bx = feature.x + i * step
            const by = feature.y + feature.height
            const peakX = bx + step / 2
            const peakY = feature.y
            ctx.moveTo(bx, by)
            ctx.lineTo(peakX, peakY)
            ctx.lineTo(bx + step, by)
          }
          ctx.stroke()
          ctx.fill()
        } else if (feature.type === 'forest') {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.12)'
          ctx.strokeStyle = '#059669'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.roundRect(feature.x, feature.y, feature.width, feature.height, 20)
          ctx.fill()
          ctx.stroke()
        } else if (feature.type === 'river') {
          ctx.strokeStyle = '#38bdf8'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(feature.x, feature.y)
          ctx.bezierCurveTo(
            feature.x + feature.width * 0.4,
            feature.y + feature.height * 0.3,
            feature.x + feature.width * 0.7,
            feature.y + feature.height * 0.8,
            feature.x + feature.width,
            feature.y + feature.height
          )
          ctx.stroke()
        } else if (feature.type === 'lake') {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.25)'
          ctx.strokeStyle = '#38bdf8'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.ellipse(
            feature.x + feature.width / 2,
            feature.y + feature.height / 2,
            feature.width / 2,
            feature.height / 2,
            0,
            0,
            Math.PI * 2
          )
          ctx.fill()
          ctx.stroke()
        }

        if (feature.label) {
          ctx.font = 'italic 12px -apple-system, sans-serif'
          ctx.fillStyle = '#94a3b8'
          ctx.textAlign = 'center'
          ctx.fillText(
            feature.label,
            feature.x + feature.width / 2,
            feature.y + feature.height / 2
          )
        }
        ctx.restore()
      })
    }

    // 4. Draw Fiefs & Stronghold Markers
    FIEFS.forEach((fief) => {
      const isPlayer = fief.type === 'player'
      const isSelected = selectedFief?.id === fief.id
      const nation = NATIONS[fief.nationId]

      ctx.save()

      // Golden Pulse Effect around Player Fief
      if (isPlayer) {
        ctx.beginPath()
        ctx.arc(fief.x, fief.y, 28, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(245, 158, 11, 0.25)'
        ctx.fill()

        ctx.beginPath()
        ctx.arc(fief.x, fief.y, 22, 0, Math.PI * 2)
        ctx.strokeStyle = '#f59e0b'
        ctx.lineWidth = 2.5
        ctx.stroke()
      }

      // Outer Selection Ring
      if (isSelected) {
        ctx.beginPath()
        ctx.arc(fief.x, fief.y, 26, 0, Math.PI * 2)
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 3
        ctx.shadowColor = '#38bdf8'
        ctx.shadowBlur = 12
        ctx.stroke()
      }

      // Pin Base
      ctx.beginPath()
      ctx.arc(fief.x, fief.y, isPlayer ? 16 : 14, 0, Math.PI * 2)
      ctx.fillStyle = isPlayer ? '#f59e0b' : nation ? nation.color : '#475569'
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()

      // Pin Icon text
      ctx.font = 'bold 13px -apple-system, sans-serif'
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const icon =
        fief.type === 'player'
          ? '🏰'
          : fief.type === 'capital'
          ? '👑'
          : fief.type === 'fortress'
          ? '🛡️'
          : fief.type === 'trade_port'
          ? '⚓'
          : '📍'
      ctx.fillText(icon, fief.x, fief.y)

      // Label Banner
      ctx.font = isPlayer
        ? 'bold 15px -apple-system, sans-serif'
        : '13px -apple-system, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'

      const labelText = isPlayer ? `⭐ ${fief.name}` : fief.name
      ctx.fillStyle = isPlayer ? '#fef08a' : '#f8fafc'
      ctx.shadowColor = 'rgba(0,0,0,0.9)'
      ctx.shadowBlur = 6
      ctx.fillText(labelText, fief.x, fief.y + 18)

      // Sub-label (Ruler or type)
      ctx.font = '11px -apple-system, sans-serif'
      ctx.fillStyle = '#94a3b8'
      ctx.fillText(fief.rulerName, fief.x, fief.y + 36)

      ctx.restore()
    })

    // 5. Compass Rose Watermark (Bottom Left)
    ctx.save()
    ctx.font = '36px sans-serif'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.fillText('🧭', 120, MAP_HEIGHT - 120)
    ctx.font = '14px serif'
    ctx.fillText('CALADRIA ATLAS', 100, MAP_HEIGHT - 70)
    ctx.restore()

    ctx.restore()
  }, [pan, zoom, selectedFief, selectedNation, showBorders, showTerrain])

  return (
    <div className="world-map-wrapper">
      {/* Top Map Toolbar */}
      <div className="map-toolbar">
        <div className="map-title-box">
          <span className="map-title-icon">🗺️</span>
          <div>
            <h2 className="map-title">{CONTINENT_NAME}</h2>
            <span className="map-subtitle">
              현재 소속: <strong>👑 루미나스 왕국</strong> 동부 변경 개척 영주령
            </span>
          </div>
        </div>

        <div className="map-controls">
          <button
            className="btn-map-control focus-btn"
            onClick={() => centerOnPoint(820, 540, 1.2)}
            title="내 영지(MY-WORLD)로 화면을 이동합니다"
          >
            🎯 내 영지 위치로 이동
          </button>

          <button
            className="btn-map-control"
            onClick={() => setZoom((z) => Math.min(2.5, z * 1.25))}
            title="확대"
          >
            🔍 +
          </button>
          <button
            className="btn-map-control"
            onClick={() => setZoom((z) => Math.max(0.45, z * 0.8))}
            title="축소"
          >
            🔍 -
          </button>
          <button
            className="btn-map-control"
            onClick={() => centerOnPoint(900, 600, 0.75)}
            title="전체 대륙 보기"
          >
            🌍 전체보기
          </button>

          <label className="map-toggle-label">
            <input
              type="checkbox"
              checked={showBorders}
              onChange={(e) => setShowBorders(e.target.checked)}
            />
            국경선
          </label>
          <label className="map-toggle-label">
            <input
              type="checkbox"
              checked={showTerrain}
              onChange={(e) => setShowTerrain(e.target.checked)}
            />
            지형
          </label>
        </div>
      </div>

      {/* Main Map View & Side Inspector Container */}
      <div className="map-main-layout">
        {/* Canvas Map Container with Pan/Zoom */}
        <div
          ref={containerRef}
          className="map-canvas-container"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <canvas ref={canvasRef} className="world-canvas" />

          {/* Map Overlay Instructions */}
          <div className="map-overlay-hint">
            <span>🖱️ 마우스 드래그: 지도 이동 | 휠: 확대/축소 | 마커 클릭: 상세 정보</span>
          </div>
        </div>

        {/* Right Inspector Panel: Fief or Nation Info */}
        <div className="map-inspector-panel">
          {selectedFief ? (
            <div className="fief-detail-card">
              <div className="inspector-header">
                <span className="inspector-badge">
                  {selectedFief.type === 'player'
                    ? '🏰 내 통치 영지'
                    : selectedFief.type === 'capital'
                    ? '👑 주권국 수도'
                    : '📍 인근 영지'}
                </span>
                <span className="nation-tag" style={{ color: NATIONS[selectedFief.nationId]?.accentColor }}>
                  {NATIONS[selectedFief.nationId]?.name} 소속
                </span>
              </div>

              <h3 className="fief-title">{selectedFief.name}</h3>
              <div className="ruler-line">
                <strong>영주:</strong> {selectedFief.rulerName} ({selectedFief.title})
              </div>

              <p className="fief-description">{selectedFief.description}</p>

              {/* Player Fief Live Real-time Status */}
              {selectedFief.type === 'player' && (
                <div className="player-live-box">
                  <h4>📊 내 영지 실시간 현황</h4>
                  <div className="player-live-grid">
                    <div>
                      <span>확보된 영토:</span>
                      <strong>{gameState.territory.secured} 구역</strong>
                    </div>
                    <div>
                      <span>건설된 부지:</span>
                      <strong>{gameState.territory.used} 구역</strong>
                    </div>
                    <div>
                      <span>마을회관:</span>
                      <strong>Lv.{gameState.buildings.townHall?.level || 0}</strong>
                    </div>
                    <div>
                      <span>방어 목책:</span>
                      <strong>Lv.{gameState.buildings.wall?.level || 0}</strong>
                    </div>
                    <div>
                      <span>대장간:</span>
                      <strong>Lv.{gameState.buildings.blacksmith?.level || 0}</strong>
                    </div>
                    <div>
                      <span>모험가 군사력:</span>
                      <strong>공 {gameState.player.attack} / 방 {gameState.player.defense}</strong>
                    </div>
                  </div>
                  <button className="btn-manage-town" onClick={onReturnToTown}>
                    🔨 내 영지(마을 건축소) 관리하러 가기
                  </button>
                </div>
              )}

              {/* Stats & Specialty */}
              <div className="fief-ratings">
                <div className="rating-row">
                  <span>방어력 지수:</span>
                  <div className="rating-bar">
                    <div
                      className="rating-bar-fill def"
                      style={{ width: `${selectedFief.defense}%` }}
                    />
                  </div>
                  <span>{selectedFief.defense} / 100</span>
                </div>
                <div className="rating-row">
                  <span>경제력 지수:</span>
                  <div className="rating-bar">
                    <div
                      className="rating-bar-fill eco"
                      style={{ width: `${selectedFief.economy}%` }}
                    />
                  </div>
                  <span>{selectedFief.economy} / 100</span>
                </div>
              </div>

              <div className="specialty-box">
                <span className="spec-label">🌾 주요 특산품 &amp; 기능:</span>
                <span className="spec-val">{selectedFief.specialty}</span>
              </div>
            </div>
          ) : selectedNation ? (
            <div className="nation-detail-card">
              <div className="inspector-header">
                <span className="inspector-badge">{selectedNation.emblem} 대륙 주요 세력</span>
                <span className="nation-relation-badge">
                  {selectedNation.relationLabel}
                </span>
              </div>

              <h3 className="nation-title" style={{ color: selectedNation.accentColor }}>
                {selectedNation.name}
              </h3>
              <div className="nation-sub">{selectedNation.typeLabel}</div>

              <p className="nation-description">{selectedNation.description}</p>

              <div className="nation-meta-list">
                <div className="meta-item">
                  <span className="meta-k">수도:</span>
                  <span className="meta-v">{selectedNation.capital}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-k">원수 / 통치자:</span>
                  <span className="meta-v">{selectedNation.ruler}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-k">군사력 등급:</span>
                  <span className="meta-v">{selectedNation.militaryPower}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-k">경제력 등급:</span>
                  <span className="meta-v">{selectedNation.economyPower}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-k">나와의 외교 관계:</span>
                  <span className="meta-v highlight">{selectedNation.relationLabel}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-inspector">
              <p>지도 위의 영지 마커나 국가 영역을 클릭하면 상세한 정치/군사 정보를 확인할 수 있습니다.</p>
            </div>
          )}

          {/* Quick Nations List Index */}
          <div className="nations-index-box">
            <h4>🌐 칼라드리아 대륙 5대 열강</h4>
            <div className="nations-mini-list">
              {Object.values(NATIONS).map((nat) => (
                <div
                  key={nat.id}
                  className={`nation-mini-pill ${selectedNation?.id === nat.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedNation(nat)
                    setSelectedFief(null)
                  }}
                >
                  <span className="nat-flag">{nat.emblem}</span>
                  <div className="nat-info">
                    <span className="nat-name">{nat.name}</span>
                    <span className="nat-rel">{nat.relationLabel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
