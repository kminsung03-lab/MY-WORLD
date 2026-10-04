import React, { useState, useRef, useEffect, useCallback } from 'react'
import type { Nation, Province } from '../types/worldMap'
import type { GameState } from '../types/game'
import {
  CONTINENT_NAME,
  MAP_WIDTH,
  MAP_HEIGHT,
  NATIONS,
  PROVINCES,
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
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: -200, y: -100 })
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  // Hover & Selection state
  const [hoveredProvince, setHoveredProvince] = useState<Province | null>(null)
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(() => {
    return PROVINCES.find((p) => p.isPlayerFief) || PROVINCES[0]
  })
  const [selectedNation, setSelectedNation] = useState<Nation | null>(() => {
    return NATIONS.kingdom_luminas || null
  })

  // Center camera on a specific map coordinate
  const centerOnPoint = useCallback((mapX: number, mapY: number, targetZoom = 1.05) => {
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
    centerOnPoint(1040, 620, 0.95)
  }, [centerOnPoint])

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87
    const newZoom = Math.min(2.8, Math.max(0.4, zoom * zoomFactor))

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
    if (e.button !== 0) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  // Point-in-polygon ray-casting test
  const isPointInPoly = (point: [number, number], vs: [number, number][]) => {
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

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
      return
    }

    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const mapX = (mouseX - pan.x) / zoom
    const mapY = (mouseY - pan.y) / zoom

    // Find hovered province
    let found: Province | null = null
    for (const p of PROVINCES) {
      if (isPointInPoly([mapX, mapY], p.vertices)) {
        found = p
        break
      }
    }
    setHoveredProvince(found)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    const mapX = (clickX - pan.x) / zoom
    const mapY = (clickY - pan.y) / zoom

    for (const p of PROVINCES) {
      if (isPointInPoly([mapX, mapY], p.vertices)) {
        setSelectedProvince(p)
        const nation = NATIONS[p.nationId]
        if (nation) setSelectedNation(nation)
        return
      }
    }
  }

  // Canvas rendering loop
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

    // 1. Deep Oceanic Blue Background (Exact match with Territorial.io / HOI4 reference)
    ctx.fillStyle = '#2f5580'
    ctx.fillRect(0, 0, width, height)

    ctx.save()
    // Apply camera pan & zoom
    ctx.translate(pan.x, pan.y)
    ctx.scale(zoom, zoom)

    // Subtle ocean contour ripples
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.lineWidth = 2
    for (let r = 80; r < MAP_WIDTH; r += 180) {
      ctx.beginPath()
      ctx.arc(MAP_WIDTH / 2, MAP_HEIGHT / 2, r, 0, Math.PI * 2)
      ctx.stroke()
    }

    // 2. Draw Provinces Polygons
    PROVINCES.forEach((prov) => {
      const isSelected = selectedProvince?.id === prov.id
      const isHovered = hoveredProvince?.id === prov.id
      const isPlayer = prov.isPlayerFief

      ctx.save()
      ctx.beginPath()
      ctx.moveTo(prov.vertices[0][0], prov.vertices[0][1])
      for (let i = 1; i < prov.vertices.length; i++) {
        ctx.lineTo(prov.vertices[i][0], prov.vertices[i][1])
      }
      ctx.closePath()

      // Fill with province color
      ctx.fillStyle = prov.color
      ctx.fill()

      // Subtle lighting effect on hover
      if (isHovered) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)'
        ctx.fill()
      }

      // Province Internal Border (Crisp dark stroke)
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.32)'
      ctx.lineWidth = 1.2
      ctx.stroke()

      // Golden Glow for Player Fief
      if (isPlayer) {
        ctx.strokeStyle = '#f59e0b'
        ctx.lineWidth = 3
        ctx.stroke()
      }

      // Bright highlight border if selected
      if (isSelected) {
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 3.5
        ctx.shadowColor = '#38bdf8'
        ctx.shadowBlur = 10
        ctx.stroke()
      }

      ctx.restore()
    })

    // 3. Draw National Boundary Outlines (Vivid colored strokes like the screenshot)
    Object.values(NATIONS).forEach((nation) => {
      const nationProvs = PROVINCES.filter((p) => p.nationId === nation.id)
      if (nationProvs.length === 0) return

      ctx.save()
      ctx.strokeStyle = nation.borderHighlightColor
      ctx.lineWidth = 3
      ctx.lineJoin = 'round'

      // Draw outer edges that touch different nations
      nationProvs.forEach((p) => {
        const poly = p.vertices
        for (let i = 0; i < poly.length; i++) {
          const p1 = poly[i]
          const p2 = poly[(i + 1) % poly.length]

          // Midpoint of the edge
          const midX = (p1[0] + p2[0]) / 2
          const midY = (p1[1] + p2[1]) / 2

          // Normal outward vector
          const dx = p2[0] - p1[0]
          const dy = p2[1] - p1[1]
          const len = Math.sqrt(dx * dx + dy * dy) || 1
          const normX = -dy / len
          const normY = dx / len

          // Sample slightly outside the edge
          const testX = midX + normX * 8
          const testY = midY + normY * 8

          let isSameNation = false
          for (const other of nationProvs) {
            if (other.id === p.id) continue
            if (isPointInPoly([testX, testY], other.vertices)) {
              isSameNation = true
              break
            }
          }

          if (!isSameNation) {
            ctx.beginPath()
            ctx.moveTo(p1[0], p1[1])
            ctx.lineTo(p2[0], p2[1])
            ctx.stroke()
          }
        }
      })
      ctx.restore()
    })

    // 4. Draw Nation Troop / Sovereign Labels (Territorial.io / Strategy Map style)
    Object.values(NATIONS).forEach((nation) => {
      const nationProvs = PROVINCES.filter((p) => p.nationId === nation.id)
      if (nationProvs.length === 0) return

      // Compute centroid of the nation
      const avgX = nationProvs.reduce((sum, p) => sum + p.center[0], 0) / nationProvs.length
      const avgY = nationProvs.reduce((sum, p) => sum + p.center[1], 0) / nationProvs.length

      ctx.save()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // Big Nation Name
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'
      ctx.shadowBlur = 6
      ctx.fillStyle = '#ffffff'
      ctx.fillText(`${nation.emblem} ${nation.name}`, avgX, avgY - 14)

      // Troop Count Badge (e.g. 28.5K)
      ctx.font = '800 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillStyle = '#fef08a'
      ctx.fillText(nation.totalTroops, avgX, avgY + 14)

      ctx.restore()
    })

    // 5. Player's Fief Special Marker (MY-WORLD)
    const playerFief = PROVINCES.find((p) => p.isPlayerFief)
    if (playerFief) {
      const px = playerFief.center[0]
      const py = playerFief.center[1]

      ctx.save()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // Golden Banner Pin
      ctx.fillStyle = '#f59e0b'
      ctx.shadowColor = 'rgba(0,0,0,0.9)'
      ctx.shadowBlur = 8
      ctx.font = 'bold 15px -apple-system, sans-serif'
      ctx.fillText('⭐ MY-WORLD (내 영지)', px, py - 12)

      ctx.font = '700 13px -apple-system, sans-serif'
      ctx.fillStyle = '#0f172a'
      ctx.fillText(`🏰 방어력 ${gameState.player.defense * 5}`, px, py + 8)

      // Animated golden beacon circle
      ctx.beginPath()
      ctx.arc(px, py - 32, 7, 0, Math.PI * 2)
      ctx.fillStyle = '#f59e0b'
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.restore()
    }

    // 6. Province Names & Troops on Higher Zoom
    if (zoom >= 0.85) {
      PROVINCES.forEach((prov) => {
        if (prov.isPlayerFief) return // Already drawn specially

        ctx.save()
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.font = '600 11px -apple-system, sans-serif'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.shadowColor = 'rgba(0,0,0,0.9)'
        ctx.shadowBlur = 4

        ctx.fillText(prov.name, prov.center[0], prov.center[1] - 7)

        ctx.font = '700 11px -apple-system, sans-serif'
        ctx.fillStyle = '#fef08a'
        ctx.fillText(prov.troops, prov.center[0], prov.center[1] + 8)

        ctx.restore()
      })
    }

    ctx.restore()
  }, [pan, zoom, selectedProvince, hoveredProvince, gameState])

  return (
    <div className="world-map-wrapper">
      {/* Top Map Toolbar */}
      <div className="map-toolbar">
        <div className="map-title-box">
          <span className="map-title-icon">🗺️</span>
          <div>
            <h2 className="map-title">{CONTINENT_NAME}</h2>
            <span className="map-subtitle">
              통치 현황: <strong>👑 루미나스 왕국</strong> 동부 변경 개척 영주령
            </span>
          </div>
        </div>

        <div className="map-controls">
          <button
            className="btn-map-control focus-btn"
            onClick={() => centerOnPoint(1040, 620, 1.2)}
            title="내 영지(MY-WORLD)로 화면을 포커스합니다"
          >
            🎯 내 영지 위치로 이동
          </button>

          <button
            className="btn-map-control"
            onClick={() => setZoom((z) => Math.min(2.8, z * 1.25))}
            title="확대"
          >
            🔍 +
          </button>
          <button
            className="btn-map-control"
            onClick={() => setZoom((z) => Math.max(0.4, z * 0.8))}
            title="축소"
          >
            🔍 -
          </button>
          <button
            className="btn-map-control"
            onClick={() => centerOnPoint(1000, 650, 0.7)}
            title="전체 대륙 보기"
          >
            🌍 전체보기
          </button>
        </div>
      </div>

      {/* Main Map View & Side Inspector Container */}
      <div className="map-main-layout">
        {/* Interactive Strategy Canvas with Pan/Zoom */}
        <div
          ref={containerRef}
          className="map-canvas-container"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick}
          style={{ cursor: isDragging ? 'grabbing' : 'crosshair' }}
        >
          <canvas ref={canvasRef} className="world-canvas" />

          {/* Map Overlay Instructions */}
          <div className="map-overlay-hint">
            <span>🖱️ 마우스 휠: 확대/축소 | 좌클릭 드래그: 지도 이동 | 영지 클릭: 상세 정보</span>
          </div>
        </div>

        {/* Right Inspector Panel: Province & Realm Detail */}
        <div className="map-inspector-panel">
          {selectedProvince && (
            <div className="fief-detail-card">
              <div className="inspector-header">
                <span className="inspector-badge">
                  {selectedProvince.isPlayerFief
                    ? '🏰 내 통치 영지'
                    : '📍 인근 분봉령 / 프로빈스'}
                </span>
                <span
                  className="nation-tag"
                  style={{ color: NATIONS[selectedProvince.nationId]?.borderHighlightColor }}
                >
                  {NATIONS[selectedProvince.nationId]?.emblem} {NATIONS[selectedProvince.nationId]?.name}
                </span>
              </div>

              <h3 className="fief-title">{selectedProvince.name}</h3>
              <div className="ruler-line">
                <strong>통치 영주:</strong> {selectedProvince.rulerName} | <strong>주둔 병력:</strong> {selectedProvince.troops}
              </div>

              <p className="fief-description">{selectedProvince.description}</p>

              {/* Player Fief Live Real-time Status */}
              {selectedProvince.isPlayerFief && (
                <div className="player-live-box">
                  <h4>📊 MY-WORLD 실시간 통치 현황</h4>
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
                      <span>군사력 스탯:</span>
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
                      style={{ width: `${selectedProvince.defense}%` }}
                    />
                  </div>
                  <span>{selectedProvince.defense} / 100</span>
                </div>
                <div className="rating-row">
                  <span>경제력 지수:</span>
                  <div className="rating-bar">
                    <div
                      className="rating-bar-fill eco"
                      style={{ width: `${selectedProvince.economy}%` }}
                    />
                  </div>
                  <span>{selectedProvince.economy} / 100</span>
                </div>
              </div>

              <div className="specialty-box">
                <span className="spec-label">🌾 주요 특산품 &amp; 기능:</span>
                <span className="spec-val">{selectedProvince.specialty}</span>
              </div>
            </div>
          )}

          {/* Selected Realm Diplomatic Profile */}
          {selectedNation && (
            <div className="nation-detail-card">
              <div className="inspector-header">
                <span className="inspector-badge">{selectedNation.emblem} 소속 국가 정세</span>
                <span className="nation-relation-badge">
                  {selectedNation.relationLabel}
                </span>
              </div>

              <h3 className="nation-title" style={{ color: selectedNation.borderHighlightColor }}>
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
                  <span className="meta-k">총 군사력:</span>
                  <span className="meta-v">{selectedNation.totalTroops} ({selectedNation.militaryPower})</span>
                </div>
                <div className="meta-item">
                  <span className="meta-k">경제력:</span>
                  <span className="meta-v">{selectedNation.economyPower}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-k">외교 관계:</span>
                  <span className="meta-v highlight">{selectedNation.relationLabel}</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Nations Index List */}
          <div className="nations-index-box">
            <h4>🌐 칼라드리아 대륙 열강 목록</h4>
            <div className="nations-mini-list">
              {Object.values(NATIONS).map((nat) => (
                <div
                  key={nat.id}
                  className={`nation-mini-pill ${selectedNation?.id === nat.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedNation(nat)
                    const firstProv = PROVINCES.find((p) => p.nationId === nat.id)
                    if (firstProv) setSelectedProvince(firstProv)
                  }}
                >
                  <span className="nat-flag">{nat.emblem}</span>
                  <div className="nat-info">
                    <span className="nat-name">{nat.name} ({nat.totalTroops})</span>
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
