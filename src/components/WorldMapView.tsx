import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DOCTRINE_LABELS, calculateArmyPower } from '../constants/realmData'
import type { GameState } from '../types/game'
import type { Nation, Province } from '../types/worldMap'
import {
  CONTINENT_NAME,
  LANDMASSES,
  MAP_HEIGHT,
  MAP_WIDTH,
  NATIONAL_BORDERS,
  NATION_LABEL_POINTS,
  NATIONS,
  NATION_TO_NEIGHBOR_MAP,
  PROVINCES,
  isPointInPolygon,
} from '../constants/worldData'
import type { RealmHandle } from '../hooks/useRealmState'

interface WorldMapViewProps {
  gameState: GameState
  realm: RealmHandle
  onReturnToTown: () => void
}

const FONT_STACK = 'Pretendard, "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

function tracePolygon(ctx: CanvasRenderingContext2D, points: [number, number][]) {
  ctx.moveTo(points[0][0], points[0][1])
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1])
  ctx.closePath()
}

function findProvinceAt(x: number, y: number) {
  const landmass = LANDMASSES.find((land) => isPointInPolygon([x, y], land.points))
  if (!landmass) return null
  return PROVINCES.find(
    (province) => province.landmassId === landmass.id && isPointInPolygon([x, y], province.vertices),
  ) || null
}

export const WorldMapView: React.FC<WorldMapViewProps> = ({ gameState, realm, onReturnToTown }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const dragMovedRef = useRef(false)
  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 720 })
  const [zoom, setZoom] = useState(0.5)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const playerFief = useMemo(() => PROVINCES.find((p) => p.isPlayerFief) || PROVINCES[0], [])
  const [selectedProvince, setSelectedProvince] = useState<Province>(playerFief)
  const [hoveredProvince, setHoveredProvince] = useState<Province | null>(null)
  const selectedNation = NATIONS[selectedProvince.nationId]

  const { state: realmState, monthlyProjection } = realm
  const armyPower = useMemo(
    () => calculateArmyPower(realmState.soldiers, realmState.levies, realmState.policies.includes('standing_guard')),
    [realmState.soldiers, realmState.levies, realmState.policies],
  )
  const activeTrades = monthlyProjection.activeTrades
  const annexedCount = realmState.neighbors.filter((neighbor) => neighbor.annexed).length

  const mappedNeighborId = NATION_TO_NEIGHBOR_MAP[selectedNation.id]
  const matchedNeighbor = mappedNeighborId
    ? realmState.neighbors.find((neighbor) => neighbor.id === mappedNeighborId)
    : undefined

  const fitMap = useCallback(() => {
    const element = containerRef.current
    if (!element) return
    const width = element.clientWidth
    const height = element.clientHeight
    const nextZoom = Math.min((width - 36) / MAP_WIDTH, (height - 36) / MAP_HEIGHT)
    setZoom(nextZoom)
    setPan({ x: (width - MAP_WIDTH * nextZoom) / 2, y: (height - MAP_HEIGHT * nextZoom) / 2 })
  }, [])

  const centerOnPoint = useCallback((x: number, y: number, targetZoom = 1.12) => {
    const element = containerRef.current
    if (!element) return
    setZoom(targetZoom)
    setPan({ x: element.clientWidth / 2 - x * targetZoom, y: element.clientHeight / 2 - y * targetZoom })
  }, [])

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver(() => {
      setCanvasSize({ width: element.clientWidth, height: element.clientHeight })
    })
    observer.observe(element)
    setCanvasSize({ width: element.clientWidth, height: element.clientHeight })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    fitMap()
  }, [fitMap, canvasSize.width, canvasSize.height])

  const clientToMap = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return [0, 0] as const
    return [(clientX - rect.left - pan.x) / zoom, (clientY - rect.top - pan.y) / zoom] as const
  }

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const cursorX = event.clientX - rect.left
    const cursorY = event.clientY - rect.top
    const mapX = (cursorX - pan.x) / zoom
    const mapY = (cursorY - pan.y) / zoom
    const nextZoom = Math.min(2.6, Math.max(0.28, zoom * (event.deltaY < 0 ? 1.14 : 0.88)))
    setZoom(nextZoom)
    setPan({ x: cursorX - mapX * nextZoom, y: cursorY - mapY * nextZoom })
  }

  const handleMouseDown = (event: React.MouseEvent) => {
    if (event.button !== 0) return
    dragMovedRef.current = false
    setIsDragging(true)
    setDragStart({ x: event.clientX - pan.x, y: event.clientY - pan.y })
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    if (isDragging) {
      dragMovedRef.current = true
      setPan({ x: event.clientX - dragStart.x, y: event.clientY - dragStart.y })
      return
    }
    const [x, y] = clientToMap(event.clientX, event.clientY)
    setHoveredProvince(findProvinceAt(x, y))
  }

  const handleMapClick = (event: React.MouseEvent) => {
    if (dragMovedRef.current) return
    const [x, y] = clientToMap(event.clientX, event.clientY)
    const province = findProvinceAt(x, y)
    if (province) setSelectedProvince(province)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.max(1, canvasSize.width * dpr)
    canvas.height = Math.max(1, canvasSize.height * dpr)
    canvas.style.width = `${canvasSize.width}px`
    canvas.style.height = `${canvasSize.height}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const ocean = ctx.createLinearGradient(0, 0, canvasSize.width, canvasSize.height)
    ocean.addColorStop(0, '#345f8d')
    ocean.addColorStop(0.55, '#2c557f')
    ocean.addColorStop(1, '#24486f')
    ctx.fillStyle = ocean
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height)

    // Quiet ocean texture gives the broad blue spaces depth without competing with borders.
    ctx.fillStyle = 'rgba(255,255,255,.055)'
    for (let x = 18; x < canvasSize.width; x += 42) {
      for (let y = 20; y < canvasSize.height; y += 42) {
        if ((x * 13 + y * 7) % 5 === 0) ctx.fillRect(x, y, 1.4, 1.4)
      }
    }

    ctx.save()
    ctx.translate(pan.x, pan.y)
    ctx.scale(zoom, zoom)

    // Coast shadow and pale continental shelf.
    LANDMASSES.forEach((land) => {
      ctx.beginPath()
      tracePolygon(ctx, land.points)
      ctx.lineJoin = 'round'
      ctx.shadowColor = 'rgba(3, 16, 32, .55)'
      ctx.shadowBlur = 28 / zoom
      ctx.shadowOffsetY = 12 / zoom
      ctx.fillStyle = '#d6d3b9'
      ctx.fill()
      ctx.shadowColor = 'transparent'
      ctx.strokeStyle = 'rgba(210, 226, 188, .62)'
      ctx.lineWidth = 11 / zoom
      ctx.stroke()
    })

    // Provinces are clipped by each authored coastline, producing true seas, islands and peninsulas.
    LANDMASSES.forEach((land) => {
      ctx.save()
      ctx.beginPath()
      tracePolygon(ctx, land.points)
      ctx.clip()

      PROVINCES.filter((province) => province.landmassId === land.id).forEach((province) => {
        ctx.beginPath()
        tracePolygon(ctx, province.vertices)
        ctx.fillStyle = province.color
        ctx.fill()
        if (hoveredProvince?.id === province.id) {
          ctx.fillStyle = 'rgba(255,255,255,.26)'
          ctx.fill()
        }
        ctx.strokeStyle = 'rgba(32, 43, 47, .55)'
        ctx.lineWidth = 1.15 / zoom
        ctx.stroke()
      })

      // Soft terrain washes, deliberately subtle so ownership remains clear.
      const terrain = ctx.createLinearGradient(450, 260, 1780, 1210)
      terrain.addColorStop(0, 'rgba(255,255,255,.10)')
      terrain.addColorStop(0.48, 'rgba(70,90,45,.03)')
      terrain.addColorStop(1, 'rgba(43,29,20,.13)')
      ctx.fillStyle = terrain
      ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT)
      ctx.restore()
    })

    // Thick realm boundaries sit above the thin province network.
    LANDMASSES.forEach((land) => {
      ctx.save()
      ctx.beginPath()
      tracePolygon(ctx, land.points)
      ctx.clip()
      ctx.strokeStyle = 'rgba(66, 35, 96, .88)'
      ctx.lineWidth = 4.4 / zoom
      ctx.lineCap = 'round'
      NATIONAL_BORDERS.filter((segment) => segment.landmassId === land.id).forEach((segment) => {
        ctx.beginPath()
        ctx.moveTo(segment.from[0], segment.from[1])
        ctx.lineTo(segment.to[0], segment.to[1])
        ctx.stroke()
      })
      ctx.restore()
    })

    // Crisp double coastline, similar to a printed grand-strategy atlas.
    LANDMASSES.forEach((land) => {
      ctx.beginPath()
      tracePolygon(ctx, land.points)
      ctx.lineJoin = 'round'
      ctx.strokeStyle = '#364d5d'
      ctx.lineWidth = 3.1 / zoom
      ctx.stroke()
      ctx.strokeStyle = 'rgba(229,238,207,.75)'
      ctx.lineWidth = 1.15 / zoom
      ctx.stroke()
    })

    // A few geographic marks make the continent feel inhabited rather than procedurally tiled.
    const mountains: [number, number][] = [[720,315],[790,330],[860,345],[1440,880],[1510,900],[1580,915],[1880,720],[1940,745]]
    ctx.strokeStyle = 'rgba(56, 48, 41, .35)'
    ctx.lineWidth = 2 / zoom
    mountains.forEach(([x, y]) => {
      ctx.beginPath(); ctx.moveTo(x - 18, y + 12); ctx.lineTo(x, y - 18); ctx.lineTo(x + 18, y + 12); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(x - 7, y - 7); ctx.lineTo(x, y - 18); ctx.lineTo(x + 6, y - 8); ctx.stroke()
    })

    // Realm labels at every zoom level.
    Object.entries(NATION_LABEL_POINTS).forEach(([nationId, point]) => {
      const nation = NATIONS[nationId]
      ctx.save()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `800 ${zoom < 0.55 ? 30 : 25}px ${FONT_STACK}`
      ctx.lineWidth = 5
      ctx.strokeStyle = 'rgba(245,248,238,.82)'
      ctx.strokeText(`${nation.emblem} ${nation.name}`, point[0], point[1] - 14)
      ctx.fillStyle = '#111827'
      ctx.fillText(`${nation.emblem} ${nation.name}`, point[0], point[1] - 14)
      ctx.font = `800 22px ${FONT_STACK}`
      ctx.strokeText(nation.totalTroops, point[0], point[1] + 18)
      ctx.fillText(nation.totalTroops, point[0], point[1] + 18)
      ctx.restore()
    })

    // Province labels progressively reveal as the player zooms in.
    if (zoom >= 0.68) {
      PROVINCES.forEach((province, index) => {
        if (!province.isPlayerFief && zoom < 1.25 && index % 5 !== 0) return
        ctx.save()
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.font = `${province.isPlayerFief ? 800 : 650} ${province.isPlayerFief ? 16 : 11}px ${FONT_STACK}`
        ctx.fillStyle = '#111827'
        ctx.strokeStyle = 'rgba(255,255,255,.7)'
        ctx.lineWidth = province.isPlayerFief ? 3.6 : 2.6
        const label = province.isPlayerFief ? '★ MY-WORLD' : province.name
        ctx.strokeText(label, province.center[0], province.center[1] - 7)
        ctx.fillText(label, province.center[0], province.center[1] - 7)
        ctx.font = `700 ${province.isPlayerFief ? 13 : 10}px ${FONT_STACK}`
        ctx.strokeText(province.troops, province.center[0], province.center[1] + 10)
        ctx.fillText(province.troops, province.center[0], province.center[1] + 10)
        ctx.restore()
      })
    }

    // Selection and player borders are always last, so they never disappear into the atlas.
    ;[selectedProvince, playerFief].forEach((province) => {
      ctx.save()
      const land = LANDMASSES.find((item) => item.id === province.landmassId)
      if (land) { ctx.beginPath(); tracePolygon(ctx, land.points); ctx.clip() }
      ctx.beginPath(); tracePolygon(ctx, province.vertices)
      ctx.strokeStyle = province.isPlayerFief ? '#fef08a' : '#ffffff'
      ctx.lineWidth = (province.isPlayerFief ? 5 : 4) / zoom
      ctx.shadowColor = province.isPlayerFief ? '#f59e0b' : '#38bdf8'
      ctx.shadowBlur = 12 / zoom
      ctx.stroke(); ctx.restore()
    })

    ctx.restore()
  }, [canvasSize, gameState, hoveredProvince, pan, playerFief, selectedProvince, zoom])

  const focusNation = (nation: Nation) => {
    const point = NATION_LABEL_POINTS[nation.id]
    const province = PROVINCES.find((p) => p.nationId === nation.id)
    if (province) setSelectedProvince(province)
    if (point) centerOnPoint(point[0], point[1], 0.82)
  }

  return (
    <section className="world-map-wrapper">
      <header className="map-toolbar">
        <div className="map-title-box">
          <span className="map-title-icon">🗺️</span>
          <div>
            <h2 className="map-title">{CONTINENT_NAME}</h2>
            <span className="map-subtitle">11개 세력 · {PROVINCES.length}개 영지 · 미지의 바다에 둘러싸인 판타지 대륙</span>
          </div>
        </div>
        <div className="map-controls">
          <button className="btn-map-control btn-return-realm" onClick={onReturnToTown}>👑 영지 경영으로 복귀</button>
          <button className="btn-map-control focus-btn" onClick={() => centerOnPoint(playerFief.center[0], playerFief.center[1])}>🎯 내 영지</button>
          <button className="btn-map-control" onClick={() => setZoom((value) => Math.min(2.6, value * 1.2))}>＋ 확대</button>
          <button className="btn-map-control" onClick={() => setZoom((value) => Math.max(.28, value * .82))}>－ 축소</button>
          <button className="btn-map-control" onClick={fitMap}>🌍 대륙 전체</button>
        </div>
      </header>

      <div className="map-main-layout">
        <div
          ref={containerRef}
          className="map-canvas-container"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => { setIsDragging(false); setHoveredProvince(null) }}
          onClick={handleMapClick}
          style={{ cursor: isDragging ? 'grabbing' : hoveredProvince ? 'pointer' : 'grab' }}
        >
          <canvas ref={canvasRef} className="world-canvas" />
          <div className="map-compass" aria-hidden="true"><b>✦</b><span>북</span></div>
          <div className="map-scale">축척 {Math.round(zoom * 100)}%</div>
          <div className="map-overlay-hint">휠 확대 · 드래그 이동 · 영지 클릭</div>
          {hoveredProvince && (
            <div className="map-hover-chip">
              <b>{NATIONS[hoveredProvince.nationId].emblem} {hoveredProvince.name}</b>
              <span>{hoveredProvince.troops} · {NATIONS[hoveredProvince.nationId].name}</span>
            </div>
          )}
        </div>

        <aside className="map-inspector-panel">
          <div className="atlas-kicker">선택한 영지</div>
          <div className="fief-detail-card" style={{ borderColor: selectedNation.borderHighlightColor }}>
            <div className="inspector-header">
              <span className="inspector-badge">{selectedProvince.isPlayerFief ? '★ 내 통치령' : selectedNation.typeLabel}</span>
              <span className="nation-tag" style={{ color: selectedNation.borderHighlightColor }}>{selectedNation.emblem} {selectedNation.name}</span>
            </div>
            <h3 className="fief-title">{selectedProvince.name}</h3>
            <div className="ruler-line"><strong>{selectedProvince.rulerName}</strong><span>주둔 {selectedProvince.troops}</span></div>
            <p className="fief-description">{selectedProvince.description}</p>
            <div className="fief-ratings">
              <div className="rating-row"><span>방어</span><div className="rating-bar"><div className="rating-bar-fill def" style={{ width: `${selectedProvince.defense}%` }} /></div><b>{selectedProvince.defense}</b></div>
              <div className="rating-row"><span>경제</span><div className="rating-bar"><div className="rating-bar-fill eco" style={{ width: `${selectedProvince.economy}%` }} /></div><b>{selectedProvince.economy}</b></div>
            </div>
            <div className="specialty-box"><span className="spec-label">주요 산물</span><span className="spec-val">{selectedProvince.specialty}</span></div>
            {selectedProvince.isPlayerFief && (
              <div className="player-live-box">
                <div className="player-live-top-row">
                  <h4>👑 MY-WORLD 통치령 현황</h4>
                  <span className="player-live-date">{realmState.year}년 {realmState.month}월</span>
                </div>

                <div className="player-live-strategy-grid">
                  <div className="strategy-stat-full">
                    <span className="stat-label">선택 노선</span>
                    <strong className="stat-val doctrine-badge">
                      {DOCTRINE_LABELS[realmState.doctrine]}
                    </strong>
                  </div>

                  <div className="strategy-stat-row">
                    <div className="strategy-stat-cell">
                      <span className="stat-label">국고 / 식량</span>
                      <strong className="stat-val">
                        🪙 {realmState.resources.treasury} <span className="stat-divider">/</span> 🌾 {realmState.resources.grain}
                      </strong>
                    </div>
                    <div className="strategy-stat-cell">
                      <span className="stat-label">안정도 / 자치도</span>
                      <strong className="stat-val">
                        ⚜️ {realmState.stability}% <span className="stat-divider">/</span> 🕊️ {realmState.autonomy}%
                      </strong>
                    </div>
                  </div>

                  <div className="strategy-stat-full">
                    <span className="stat-label">군사력 (상비 / 징집 / 전투력)</span>
                    <strong className="stat-val">
                      ⚔️ 상비 {realmState.soldiers} · 🛡️ 징집 {realmState.levies} <span className="stat-power-tag">전투력 {armyPower}</span>
                    </strong>
                  </div>

                  <div className="strategy-stat-row">
                    <div className="strategy-stat-cell">
                      <span className="stat-label">교역로 수</span>
                      <strong className="stat-val text-amber">⛵ {activeTrades}개 활성</strong>
                    </div>
                    <div className="strategy-stat-cell">
                      <span className="stat-label">병합 수</span>
                      <strong className="stat-val text-emerald">🚩 {annexedCount}곳 병합</strong>
                    </div>
                  </div>
                </div>

                <div className="player-local-summary">
                  <span>마을 개척: 영토 {gameState.territory.secured}부지 · 방벽 Lv.{gameState.buildings.wall?.level || 0}</span>
                </div>

                <button className="btn-manage-town" onClick={onReturnToTown}>
                  👑 영지 경영으로 복귀
                </button>
              </div>
            )}
          </div>

          <div className="nation-detail-card">
            <div className="inspector-header">
              <span className="atlas-kicker">소속 세력</span>
              <span className="nation-relation-badge">{selectedNation.relationLabel}</span>
            </div>
            <h3 className="nation-title" style={{ color: selectedNation.borderHighlightColor }}>{selectedNation.emblem} {selectedNation.name}</h3>
            <p className="nation-description">{selectedNation.description}</p>
            <div className="nation-meta-list">
              <div className="meta-item"><span className="meta-k">수도</span><span className="meta-v">{selectedNation.capital}</span></div>
              <div className="meta-item"><span className="meta-k">통치자</span><span className="meta-v">{selectedNation.ruler}</span></div>
              <div className="meta-item"><span className="meta-k">총 병력</span><span className="meta-v">{selectedNation.totalTroops}</span></div>
              <div className="meta-item"><span className="meta-k">군사</span><span className="meta-v">{selectedNation.militaryPower}</span></div>
              <div className="meta-item"><span className="meta-k">경제</span><span className="meta-v">{selectedNation.economyPower}</span></div>
            </div>

            {matchedNeighbor ? (
              <div className="strategic-neighbor-box">
                <div className="strategic-neighbor-header">
                  <span className="strategic-subkicker">변경백령 외교 정보</span>
                  <span className={`neighbor-status-pill ${matchedNeighbor.annexed ? 'annexed' : matchedNeighbor.claim ? 'claim' : matchedNeighbor.tradeActive ? 'trade' : ''}`}>
                    {matchedNeighbor.annexed ? '🚩 병합됨' : matchedNeighbor.claim ? '⚔️ 명분 보유' : matchedNeighbor.tradeActive ? '⛵ 교역 중' : matchedNeighbor.attitude}
                  </span>
                </div>
                <div className="strategic-neighbor-name">
                  {matchedNeighbor.icon} {matchedNeighbor.name} <small>({matchedNeighbor.title})</small>
                </div>
                <div className="strategic-neighbor-details">
                  <div className="neighbor-row">
                    <span className="neighbor-k">현재 관계</span>
                    <span className={`neighbor-v ${matchedNeighbor.relation >= 0 ? 'text-good' : 'text-danger'}`}>
                      {matchedNeighbor.relation >= 0 ? `+${matchedNeighbor.relation}` : matchedNeighbor.relation} ({matchedNeighbor.attitude})
                    </span>
                  </div>
                  <div className="neighbor-row">
                    <span className="neighbor-k">교역 상태</span>
                    <span className="neighbor-v">
                      {matchedNeighbor.tradeActive ? '✅ 교역로 개설됨 (월간 수입 기여)' : '❌ 미체결'}
                    </span>
                  </div>
                  <div className="neighbor-row">
                    <span className="neighbor-k">명분 상태</span>
                    <span className="neighbor-v">
                      {matchedNeighbor.claim ? '⚔️ 영유권 명분 확보 (출병 가능)' : '⚪ 명분 없음'}
                    </span>
                  </div>
                  <div className="neighbor-row">
                    <span className="neighbor-k">병합 상태</span>
                    <span className="neighbor-v">
                      {matchedNeighbor.annexed ? '🚩 통치령에 병합됨 (점령 완료)' : '🛡️ 독립 세력'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="strategic-neighbor-remote">
                <div className="remote-status-title">🌐 현재 직접 이해관계 없음</div>
                <p className="remote-status-desc">에르덴 변경백령과 직접 국경을 접하지 않거나 상설 외교 사절이 개설되지 않은 대륙 세력입니다.</p>
              </div>
            )}
          </div>
        </aside>
      </div>

      <div className="map-nation-legend" aria-label="대륙 세력 목록">
        {Object.values(NATIONS).map((nation) => (
          <button key={nation.id} className={nation.id === selectedNation.id ? 'active' : ''} style={{ '--nation-color': nation.baseColor } as React.CSSProperties} onClick={() => focusNation(nation)}>
            <span>{nation.emblem}</span><b>{nation.name}</b><small>{nation.totalTroops}</small>
          </button>
        ))}
      </div>
    </section>
  )
}
