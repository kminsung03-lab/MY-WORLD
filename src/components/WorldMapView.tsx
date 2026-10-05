import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DOCTRINE_LABELS,
  TRADE_CONTRACTS,
  type TradeContractDefinition,
  calculateArmyPower,
  evaluateTradeRoutes,
} from '../constants/realmData'
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
  STRATEGIC_TARGET_COORDINATES,
  findStrategicTargetProvince,
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
  const totalDominionCount = 1 + annexedCount

  const strategicProvinces = useMemo(() => {
    const map = new Map<string, { neighbor: typeof realmState.neighbors[number]; province: Province }>()
    realmState.neighbors.forEach((neighbor) => {
      const coord = STRATEGIC_TARGET_COORDINATES[neighbor.id]
      if (coord) {
        const province = findStrategicTargetProvince(coord, PROVINCES)
        if (province) {
          map.set(province.id, { neighbor, province })
        }
      }
    })
    return map
  }, [realmState.neighbors])

  const annexedProvinces = useMemo(() => {
    const list: { neighbor: typeof realmState.neighbors[number]; province: Province }[] = []
    for (const item of strategicProvinces.values()) {
      if (item.neighbor.annexed) {
        list.push(item)
      }
    }
    return list
  }, [strategicProvinces])

  const annexedProvinceIds = useMemo(() => {
    return new Set(annexedProvinces.map((item) => item.province.id))
  }, [annexedProvinces])

  const activeTradeRoutes = useMemo(() => {
    const routes: {
      neighbor: typeof realmState.neighbors[number]
      targetProvince: Province
      contractDef: TradeContractDefinition
      isSuspended: boolean
      suspendReason?: string
    }[] = []
    const tradeEval = evaluateTradeRoutes(
      realmState.neighbors,
      realmState.resources,
      realmState.policies,
      realmState.activeCampaign?.targetId,
    )
    for (const item of strategicProvinces.values()) {
      if (item.neighbor.tradeActive && !item.neighbor.annexed) {
        const routeEval = tradeEval.routes.find((r) => r.neighborId === item.neighbor.id)
        const contractId = item.neighbor.tradeContract || 'balanced_exchange'
        const contractDef = TRADE_CONTRACTS.find((c) => c.id === contractId) || TRADE_CONTRACTS[0]
        routes.push({
          neighbor: item.neighbor,
          targetProvince: item.province,
          contractDef,
          isSuspended: routeEval?.isSuspended ?? false,
          suspendReason: routeEval?.suspendReason,
        })
      }
    }
    return routes
  }, [
    strategicProvinces,
    realmState.neighbors,
    realmState.resources,
    realmState.policies,
    realmState.activeCampaign,
  ])

  const selectedAnnexedInfo = strategicProvinces.get(selectedProvince.id)
  const isSelectedAnnexed = selectedAnnexedInfo?.neighbor.annexed === true

  const activeCampaign = realmState.activeCampaign
  const campaignTargetProvince = useMemo(() => {
    if (!activeCampaign) return null
    const coord = STRATEGIC_TARGET_COORDINATES[activeCampaign.targetId]
    if (!coord) return null
    return findStrategicTargetProvince(coord, PROVINCES)
  }, [activeCampaign])
  const isSelectedWarTarget = !!(
    activeCampaign &&
    campaignTargetProvince &&
    selectedProvince.id === campaignTargetProvince.id &&
    !annexedProvinceIds.has(campaignTargetProvince.id)
  )

  const mappedNeighborId = NATION_TO_NEIGHBOR_MAP[selectedNation.id]
  const matchedNeighbor = mappedNeighborId
    ? realmState.neighbors.find((neighbor) => neighbor.id === mappedNeighborId)
    : undefined

  const matchedTradeRoute = useMemo(() => {
    if (!matchedNeighbor) return undefined
    return activeTradeRoutes.find((r) => r.neighbor.id === matchedNeighbor.id)
  }, [matchedNeighbor, activeTradeRoutes])


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
        const isAnnexed = annexedProvinceIds.has(province.id)
        const isWarTarget = !!(activeCampaign && campaignTargetProvince?.id === province.id && !isAnnexed)
        if (isAnnexed) {
          ctx.fillStyle = '#0f766e' // 에르덴 통치색 (짙은 청록)
        } else if (isWarTarget) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.42)' // 진행 중 목표 프로빈스 붉은 반투명
        } else {
          ctx.fillStyle = province.color
        }
        ctx.fill()
        if (hoveredProvince?.id === province.id) {
          ctx.fillStyle = 'rgba(255,255,255,.26)'
          ctx.fill()
        }
        if (isAnnexed) {
          ctx.strokeStyle = '#f59e0b'
          ctx.lineWidth = 2.4 / zoom
        } else if (isWarTarget) {
          ctx.strokeStyle = '#ef4444' // 선명한 붉은 국경
          ctx.lineWidth = 3.2 / zoom
        } else {
          ctx.strokeStyle = 'rgba(32, 43, 47, .55)'
          ctx.lineWidth = 1.15 / zoom
        }
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

    // Active Trade Routes (곡선 점선 교역로 및 중간 교역 아이콘)
    activeTradeRoutes.forEach(({ neighbor, targetProvince, contractDef, isSuspended }) => {
      const p0 = playerFief.center
      const p1 = targetProvince.center
      const dx = p1[0] - p0[0]
      const dy = p1[1] - p0[1]
      const dist = Math.hypot(dx, dy) || 1
      const nx = -dy / dist
      const ny = dx / dist
      const curveOffset = Math.min(50, Math.max(25, dist * 0.12))
      const midX = (p0[0] + p1[0]) / 2 + nx * curveOffset
      const midY = (p0[1] + p1[1]) / 2 + ny * curveOffset

      ctx.save()

      if (isSuspended) {
        // Muted gray/amber style for suspended route
        ctx.beginPath()
        ctx.moveTo(p0[0], p0[1])
        ctx.quadraticCurveTo(midX, midY, p1[0], p1[1])
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)'
        ctx.lineWidth = 4 / zoom
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(p0[0], p0[1])
        ctx.quadraticCurveTo(midX, midY, p1[0], p1[1])
        ctx.setLineDash([4 / zoom, 6 / zoom])
        ctx.strokeStyle = '#94a3b8'
        ctx.lineWidth = 2 / zoom
        ctx.stroke()
        ctx.setLineDash([])
      } else {
        // Soft ambient glow under the trade route
        ctx.beginPath()
        ctx.moveTo(p0[0], p0[1])
        ctx.quadraticCurveTo(midX, midY, p1[0], p1[1])
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.28)'
        ctx.lineWidth = 5.5 / zoom
        ctx.stroke()

        // Dashed golden active trade line
        ctx.beginPath()
        ctx.moveTo(p0[0], p0[1])
        ctx.quadraticCurveTo(midX, midY, p1[0], p1[1])
        ctx.setLineDash([8 / zoom, 5 / zoom])
        ctx.strokeStyle = '#f59e0b'
        ctx.lineWidth = 2.4 / zoom
        ctx.stroke()
        ctx.setLineDash([])
      }

      // Trade Icon Badge at midpoint
      const iconX = 0.25 * p0[0] + 0.5 * midX + 0.25 * p1[0]
      const iconY = 0.25 * p0[1] + 0.5 * midY + 0.25 * p1[1]

      const badgeRadius = Math.max(9, Math.min(18, 12 / zoom))
      ctx.beginPath()
      ctx.arc(iconX, iconY, badgeRadius, 0, Math.PI * 2)
      ctx.fillStyle = isSuspended ? '#1e293b' : '#0f172a'
      ctx.fill()
      ctx.strokeStyle = isSuspended ? '#ef4444' : '#fbbf24'
      ctx.lineWidth = 1.8 / zoom
      ctx.stroke()

      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `${Math.max(10, Math.min(18, 13 / zoom))}px ${FONT_STACK}`
      ctx.fillText(isSuspended ? '⚠️' : contractDef.icon, iconX, iconY + 1 / zoom)

      if (zoom >= 0.52) {
        ctx.font = `700 ${Math.max(9, Math.min(14, 10 / zoom))}px ${FONT_STACK}`
        ctx.fillStyle = isSuspended ? '#fca5a5' : '#fde68a'
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.9)'
        ctx.lineWidth = 2.5 / zoom
        const label = isSuspended
          ? `교역: ${neighbor.name} [${contractDef.name}] (중단)`
          : `교역: ${neighbor.name} [${contractDef.name}]`
        ctx.strokeText(label, iconX, iconY + badgeRadius + 8 / zoom)
        ctx.fillText(label, iconX, iconY + badgeRadius + 8 / zoom)
      }

      ctx.restore()
    })

    // Active Campaign Front Line (본령 -> 목표 전선 붉은 점선 및 교차 검/진군 라벨)
    if (activeCampaign && campaignTargetProvince && !annexedProvinceIds.has(campaignTargetProvince.id)) {
      const p0 = playerFief.center
      const p1 = campaignTargetProvince.center
      const midX = (p0[0] + p1[0]) / 2
      const midY = (p0[1] + p1[1]) / 2

      ctx.save()

      // Red ambient glow under the war front
      ctx.beginPath()
      ctx.moveTo(p0[0], p0[1])
      ctx.lineTo(p1[0], p1[1])
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)'
      ctx.lineWidth = 6 / zoom
      ctx.stroke()

      // Red dashed front line
      ctx.beginPath()
      ctx.moveTo(p0[0], p0[1])
      ctx.lineTo(p1[0], p1[1])
      ctx.setLineDash([8 / zoom, 5 / zoom])
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 2.8 / zoom
      ctx.stroke()
      ctx.setLineDash([])

      // Crossed swords icon and progress label badge
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 1.6 / zoom
      const badgeW = 160 / zoom
      const badgeH = 26 / zoom
      ctx.beginPath()
      ctx.roundRect(midX - badgeW / 2, midY - badgeH / 2, badgeW, badgeH, 4 / zoom)
      ctx.fill()
      ctx.stroke()

      ctx.font = `bold ${11 / zoom}px ${FONT_STACK}`
      ctx.fillStyle = '#fca5a5'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`⚔️ ${activeCampaign.phase} (${activeCampaign.progress}%)`, midX, midY)

      ctx.restore()
    }

    // Annexed Dominion Markers (에르덴 통치령 금색 국경 강조 및 깃발/병합 표시)
    annexedProvinces.forEach(({ province }) => {
      ctx.save()
      const land = LANDMASSES.find((item) => item.id === province.landmassId)
      if (land) {
        ctx.beginPath()
        tracePolygon(ctx, land.points)
        ctx.clip()
      }

      ctx.beginPath()
      tracePolygon(ctx, province.vertices)
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 3.6 / zoom
      ctx.shadowColor = '#d97706'
      ctx.shadowBlur = 10 / zoom
      ctx.stroke()
      ctx.shadowBlur = 0

      const [cx, cy] = province.center
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      ctx.font = `${Math.max(14, Math.min(26, 18 / zoom))}px ${FONT_STACK}`
      ctx.fillText('🚩', cx, cy - 12 / zoom)

      ctx.font = `800 ${Math.max(10, Math.min(15, 11 / zoom))}px ${FONT_STACK}`
      ctx.fillStyle = '#fef08a'
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.95)'
      ctx.lineWidth = 3 / zoom
      const text = `에르덴 병합령 (${province.name})`
      ctx.strokeText(text, cx, cy + 9 / zoom)
      ctx.fillText(text, cx, cy + 9 / zoom)

      ctx.restore()
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
        const isAnnexed = annexedProvinceIds.has(province.id)
        const label = province.isPlayerFief ? '★ MY-WORLD' : isAnnexed ? `🚩 ${province.name}` : province.name
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
      const isAnnexed = annexedProvinceIds.has(province.id)
      const isWarTarget = !!(activeCampaign && campaignTargetProvince?.id === province.id && !isAnnexed)
      ctx.strokeStyle = province.isPlayerFief ? '#fef08a' : isAnnexed ? '#fbbf24' : isWarTarget ? '#ef4444' : '#ffffff'
      ctx.lineWidth = (province.isPlayerFief ? 5 : 4) / zoom
      ctx.shadowColor = province.isPlayerFief ? '#f59e0b' : isAnnexed ? '#d97706' : isWarTarget ? '#ef4444' : '#38bdf8'
      ctx.shadowBlur = 12 / zoom
      ctx.stroke(); ctx.restore()
    })

    ctx.restore()
  }, [canvasSize, gameState, hoveredProvince, pan, playerFief, selectedProvince, zoom, realmState, activeTradeRoutes, annexedProvinces, annexedProvinceIds, activeCampaign, campaignTargetProvince])


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
            <span className="map-subtitle">
              11개 세력 · {PROVINCES.length}개 영지 · <strong className="dominion-counter">🏰 에르덴 통치령 {totalDominionCount}곳 (본령 1 + 병합 {annexedCount})</strong>
            </span>
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
              <b>{annexedProvinceIds.has(hoveredProvince.id) ? '🚩 [병합령]' : NATIONS[hoveredProvince.nationId].emblem} {hoveredProvince.name}</b>
              <span>{hoveredProvince.troops} · {annexedProvinceIds.has(hoveredProvince.id) ? '에르덴 통치령' : NATIONS[hoveredProvince.nationId].name}</span>
            </div>
          )}
        </div>

        <aside className="map-inspector-panel">
          <div className="atlas-kicker">
            {selectedProvince.isPlayerFief ? '내 통치령 (본령)' : isSelectedAnnexed ? '에르덴 직속 통치령 (병합령)' : '선택한 영지'}
          </div>
          <div className="fief-detail-card" style={{ borderColor: isSelectedAnnexed ? '#fbbf24' : selectedNation.borderHighlightColor }}>
            <div className="inspector-header">
              <span className={`inspector-badge ${isSelectedAnnexed ? 'badge-annexed' : ''}`}>
                {selectedProvince.isPlayerFief ? '★ 내 통치령' : isSelectedAnnexed ? '🚩 에르덴 병합령' : selectedNation.typeLabel}
              </span>
              <span className="nation-tag" style={{ color: isSelectedAnnexed ? '#fbbf24' : selectedNation.borderHighlightColor }}>
                {isSelectedAnnexed ? '🚩 에르덴 통치령' : `${selectedNation.emblem} ${selectedNation.name}`}
              </span>
            </div>
            <h3 className="fief-title">
              {isSelectedAnnexed ? `[에르덴 병합령] ${selectedProvince.name}` : selectedProvince.name}
            </h3>

            {isSelectedAnnexed && selectedAnnexedInfo && (
              <div className="annexed-origin-card">
                <span className="origin-label">원 소속 세력 및 병합 출처</span>
                <div className="origin-val">
                  {selectedAnnexedInfo.neighbor.icon} <strong>{selectedAnnexedInfo.neighbor.name}</strong> ({selectedAnnexedInfo.neighbor.title})
                </div>
                <p className="origin-desc">
                  에르덴 변경백령의 원정으로 직속 통치령에 편입되었습니다. 조세와 인력 기여가 본령으로 귀속됩니다.
                </p>
              </div>
            )}

            <div className="ruler-line">
              <strong>{isSelectedAnnexed ? '에르덴 변경백 직속 통치' : selectedProvince.rulerName}</strong>
              <span>주둔 {selectedProvince.troops} {isSelectedAnnexed ? '(에르덴 수비대)' : ''}</span>
            </div>
            <p className="fief-description">
              {isSelectedAnnexed && selectedAnnexedInfo
                ? `${selectedProvince.description} (에르덴 변경백령의 원정으로 ${selectedAnnexedInfo.neighbor.name}에서 병합된 직속 통치령입니다.)`
                : selectedProvince.description}
            </p>
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
                  <div className="strategy-stat-full highlight-dominion">
                    <span className="stat-label">현재 통치 프로빈스 수</span>
                    <strong className="stat-val text-cyan">
                      🏰 {totalDominionCount}개 영지 (본령 1 + 병합 {annexedCount}곳)
                    </strong>
                  </div>

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

          {isSelectedWarTarget && activeCampaign ? (
            <div className="nation-detail-card war-active-card">
              <div className="inspector-header">
                <span className="atlas-kicker">전역 교전 현황</span>
                <span className="neighbor-status-pill war-active">⚔️ 에르덴 원정군과 교전 중</span>
              </div>
              <h3 className="nation-title text-red">
                ⚔️ {activeCampaign.targetName} 정벌 전선
              </h3>
              <p className="nation-description">
                에르덴 변경백령의 원정군이 국경을 넘어 침공하여 치열한 전투가 벌어지고 있는 격전지입니다.
                사령부의 작전 명령에 따라 진군도, 적 사기, 보급선이 매달 실시간으로 변동합니다.
              </p>
              <div className="nation-meta-list">
                <div className="meta-item">
                  <span className="meta-k">작전 단계</span>
                  <span className="meta-v text-amber">{activeCampaign.phase} ({activeCampaign.campaignTurn}개월차)</span>
                </div>
                <div className="meta-item">
                  <span className="meta-k">원정 진군도</span>
                  <span className="meta-v text-good">{activeCampaign.progress}% (100% 도달 시 함락)</span>
                </div>
                <div className="meta-item">
                  <span className="meta-k">적군 잔여 사기</span>
                  <span className="meta-v text-danger">{activeCampaign.enemyMorale}% (0% 도달 시 항복)</span>
                </div>
                <div className="meta-item">
                  <span className="meta-k">원정군 보급선</span>
                  <span className="meta-v text-cyan">{activeCampaign.supply}%</span>
                </div>
                <div className="meta-item">
                  <span className="meta-k">누적 전사자</span>
                  <span className="meta-v">상비 {activeCampaign.lostSoldiers}명 · 징집 {activeCampaign.lostLevies}명</span>
                </div>
                <div className="meta-item">
                  <span className="meta-k">최근 전황 보고</span>
                  <span className="meta-v text-muted">{activeCampaign.lastReport || '작전 하달 대기 중'}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-k">지도상 권역</span>
                  <span className="meta-v text-muted">
                    {selectedNation.emblem} {selectedNation.name} ({selectedNation.typeLabel})
                  </span>
                </div>
              </div>
            </div>
          ) : isSelectedAnnexed && selectedAnnexedInfo ? (
            <div className="nation-detail-card annexed-political-card">
              <div className="inspector-header">
                <span className="atlas-kicker">통치령 정치 현황</span>
                <span className="neighbor-status-pill annexed">🚩 직속 병합령</span>
              </div>
              <h3 className="nation-title text-gold">
                🚩 에르덴 직속 통치령
              </h3>

              <p className="nation-description">
                군사 원정 및 외교적 결단으로 에르덴 변경백령에 복속된 직할 영지입니다.
                현지 행정과 방어선이 변경백 직속 수비대와 관료에 의해 통제되며, 생산되는 조세와 인력이 에르덴 본령으로 귀속됩니다.
              </p>
              <div className="nation-meta-list">
                <div className="meta-item">
                  <span className="meta-k">현재 통치자</span>
                  <span className="meta-v">에르덴 변경백령 (직속 통치)</span>
                </div>
                <div className="meta-item">
                  <span className="meta-k">이전 지배세력</span>
                  <span className="meta-v">
                    {selectedAnnexedInfo.neighbor.icon} {selectedAnnexedInfo.neighbor.name} <small>({selectedAnnexedInfo.neighbor.title})</small>
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-k">현재 정치 상태</span>
                  <span className="meta-v text-good">직속 병합령 (점령 및 완전 귀속)</span>
                </div>
                <div className="meta-item">
                  <span className="meta-k">조세·인력 귀속</span>
                  <span className="meta-v text-amber">에르덴 본령 귀속</span>
                </div>
                <div className="meta-item">
                  <span className="meta-k">지도상 권역</span>
                  <span className="meta-v text-muted">
                    {selectedNation.emblem} {selectedNation.name} ({selectedNation.typeLabel})
                  </span>
                </div>
              </div>
            </div>
          ) : (
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
                      <span className="neighbor-k">교역 계약</span>
                      <span className="neighbor-v">
                        {matchedNeighbor.tradeActive ? (
                          matchedTradeRoute?.isSuspended ? (
                            <span className="text-danger">
                              ⚠️ {matchedTradeRoute.contractDef.name} (중단: {matchedTradeRoute.suspendReason})
                            </span>
                          ) : (
                            <span className="text-good">
                              ⛵ {matchedTradeRoute?.contractDef.name || '균형 교역 협정'} (가동 중)
                            </span>
                          )
                        ) : (
                          '❌ 미체결'
                        )}
                      </span>
                    </div>
                    {matchedNeighbor.tradeActive && matchedTradeRoute && (
                      <div className="neighbor-row">
                        <span className="neighbor-k">특화 보너스</span>
                        <span className="neighbor-v text-amber">
                          {matchedTradeRoute.contractDef.partnerOverrides[matchedNeighbor.id]?.partnerBonusLabel || '기본 특산품 교역'}
                        </span>
                      </div>
                    )}
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
          )}
        </aside>
      </div>

      <div className="map-nation-legend" aria-label="대륙 세력 목록">
        <button
          className={`legend-player-btn ${selectedProvince.isPlayerFief || isSelectedAnnexed ? 'active' : ''}`}
          style={{ '--nation-color': '#0f766e' } as React.CSSProperties}
          onClick={() => {
            setSelectedProvince(playerFief)
            centerOnPoint(playerFief.center[0], playerFief.center[1])
          }}
          title="에르덴 변경백령 및 직속 통치령"
        >
          <span>🚩</span>
          <b>에르덴 통치령</b>
          <small>{totalDominionCount}영지 (본령 1+병합 {annexedCount})</small>
        </button>
        {Object.values(NATIONS).map((nation) => (
          <button key={nation.id} className={nation.id === selectedNation.id && !isSelectedAnnexed ? 'active' : ''} style={{ '--nation-color': nation.baseColor } as React.CSSProperties} onClick={() => focusNation(nation)}>
            <span>{nation.emblem}</span><b>{nation.name}</b><small>{nation.totalTroops}</small>
          </button>
        ))}
      </div>
    </section>
  )
}
