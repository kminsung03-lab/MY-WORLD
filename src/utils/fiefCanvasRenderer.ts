import type { Province } from '../types/worldMap'
import type { RealmVisualAnalysis } from './realmGrowthVisuals'

const FONT_STACK = 'Pretendard, "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

/**
 * Renders the living growth layers of the player's fief onto the canvas.
 * Adapts seamlessly across zoom levels (abstract icon/ring at macro zoom,
 * detailed districts, furrows, tents, ramparts, windmills, and smoke at default & micro zoom).
 * 
 * Scaled and organized so that internal land-use patterns, settlement density,
 * and structural landmarks are unmistakably distinct at standard 1366x900 map zoom (~0.6).
 */
export function drawPlayerFiefLivingLayer(
  ctx: CanvasRenderingContext2D,
  playerFief: Province,
  analysis: RealmVisualAnalysis,
  zoom: number,
) {
  const [cx, cy] = playerFief.center
  const { tier, specialization, distress, features } = analysis

  ctx.save()

  // 1. Polygon Clip for internal district terrain & furrows
  ctx.save()
  ctx.beginPath()
  playerFief.vertices.forEach(([x, y], i) => {
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.closePath()
  ctx.clip()

  // 1.1 District Base Tint overlay based on Specialization & Tier
  let baseColor = 'rgba(250, 204, 21, 0.28)' // default sunny gold
  if (specialization === 'agrarian') {
    baseColor = tier >= 3 ? 'rgba(74, 222, 128, 0.45)' : 'rgba(132, 204, 22, 0.35)'
  } else if (specialization === 'commercial') {
    baseColor = tier >= 3 ? 'rgba(245, 158, 11, 0.46)' : 'rgba(251, 191, 36, 0.36)'
  } else if (specialization === 'military') {
    baseColor = tier >= 3 ? 'rgba(100, 116, 139, 0.50)' : 'rgba(148, 163, 184, 0.36)'
  }
  ctx.fillStyle = baseColor
  ctx.fill()

  // 1.2 Distress wash if distressed or critical
  if (distress === 'critical') {
    ctx.fillStyle = 'rgba(185, 28, 28, 0.45)'
    ctx.fill()
    // Warning diagonal hatch pattern
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)'
    ctx.lineWidth = Math.max(2, 2.5 / zoom)
    for (let offset = -200; offset < 200; offset += 20) {
      ctx.beginPath()
      ctx.moveTo(cx + offset - 100, cy - 100)
      ctx.lineTo(cx + offset + 100, cy + 100)
      ctx.stroke()
    }
  } else if (distress === 'distressed') {
    ctx.fillStyle = 'rgba(217, 119, 6, 0.28)'
    ctx.fill()
  }

  // 1.3 Concrete Internal Land-Use Patterns & Structures (Rendered down to zoom >= 0.35)
  if (zoom >= 0.35) {
    // -----------------------------------------------------------------
    // A. Agrarian Sector (West / South-West)
    // -----------------------------------------------------------------
    if (features.hasGoldenFields || specialization === 'agrarian' || tier >= 2) {
      ctx.save()
      const fieldCount = tier >= 3 ? 9 : tier >= 2 ? 5 : 3
      ctx.strokeStyle = specialization === 'agrarian' ? 'rgba(234, 179, 8, 0.85)' : 'rgba(132, 204, 22, 0.75)'
      ctx.lineWidth = Math.max(2, 3 / zoom)

      // Broad terraced furrows across southwest quadrant
      for (let i = 0; i < fieldCount; i++) {
        const fy = cy + 10 + i * 9
        ctx.beginPath()
        ctx.moveTo(cx - 75, fy)
        ctx.lineTo(cx - 15, fy)
        ctx.stroke()
      }

      // Windmill Landmark on farmland
      if (features.hasWindmills || tier >= 2) {
        const wx = cx - 50
        const wy = cy + 28
        // Tower Body
        ctx.fillStyle = '#fef08a'
        ctx.beginPath()
        ctx.moveTo(wx - 6 / zoom, wy + 8 / zoom)
        ctx.lineTo(wx, wy - 10 / zoom)
        ctx.lineTo(wx + 6 / zoom, wy + 8 / zoom)
        ctx.closePath()
        ctx.fill()
        ctx.strokeStyle = '#854d0e'
        ctx.lineWidth = Math.max(1, 1.5 / zoom)
        ctx.stroke()

        // Blades
        ctx.strokeStyle = '#854d0e'
        ctx.lineWidth = Math.max(1.5, 2 / zoom)
        ctx.beginPath()
        ctx.moveTo(wx - 10 / zoom, wy - 10 / zoom)
        ctx.lineTo(wx + 10 / zoom, wy - 10 / zoom)
        ctx.moveTo(wx, wy - 20 / zoom)
        ctx.lineTo(wx, wy)
        ctx.stroke()

        // Second windmill if Tier 3
        if (tier >= 3) {
          const w2x = cx - 25
          const w2y = cy + 42
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.moveTo(w2x - 5 / zoom, w2y + 7 / zoom)
          ctx.lineTo(w2x, w2y - 8 / zoom)
          ctx.lineTo(w2x + 5 / zoom, w2y + 7 / zoom)
          ctx.closePath()
          ctx.fill()
          ctx.strokeStyle = '#451a03'
          ctx.stroke()

          ctx.strokeStyle = '#451a03'
          ctx.lineWidth = Math.max(1.2, 1.8 / zoom)
          ctx.beginPath()
          ctx.moveTo(w2x - 8 / zoom, w2y - 8 / zoom)
          ctx.lineTo(w2x + 8 / zoom, w2y - 8 / zoom)
          ctx.moveTo(w2x, w2y - 16 / zoom)
          ctx.lineTo(w2x, w2y)
          ctx.stroke()
        }
      }
      ctx.restore()
    }

    // -----------------------------------------------------------------
    // B. Commercial Sector (East / South-East)
    // -----------------------------------------------------------------
    if (features.hasBustlingMarket || specialization === 'commercial' || tier >= 2) {
      ctx.save()
      // Broad radial paved highways from center to southeast
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.75)'
      ctx.lineWidth = Math.max(3, 4.2 / zoom)
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + 60, cy + 38)
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + 50, cy - 30)
      ctx.stroke()

      // High-visibility Market Pavilion / Tents Cluster
      const tents = tier >= 3
        ? [
            { x: cx + 24, y: cy + 16, color: '#ef4444', size: 8 },
            { x: cx + 42, y: cy + 26, color: '#3b82f6', size: 9 },
            { x: cx + 32, y: cy + 40, color: '#eab308', size: 8 },
            { x: cx + 55, y: cy + 18, color: '#10b981', size: 8 },
            { x: cx + 52, y: cy + 42, color: '#f97316', size: 7 },
          ]
        : tier >= 2
        ? [
            { x: cx + 28, y: cy + 20, color: '#ef4444', size: 7 },
            { x: cx + 44, y: cy + 30, color: '#eab308', size: 7 },
          ]
        : [{ x: cx + 30, y: cy + 22, color: '#f59e0b', size: 6 }]

      tents.forEach((t) => {
        const s = Math.max(t.size, (t.size * 1.2) / zoom)
        ctx.fillStyle = t.color
        ctx.beginPath()
        ctx.moveTo(t.x, t.y - s)
        ctx.lineTo(t.x + s, t.y + s * 0.7)
        ctx.lineTo(t.x - s, t.y + s * 0.7)
        ctx.closePath()
        ctx.fill()
        ctx.strokeStyle = '#0f172a'
        ctx.lineWidth = Math.max(0.8, 1.2 / zoom)
        ctx.stroke()
      })
      ctx.restore()
    }

    // -----------------------------------------------------------------
    // C. Military Sector (North / North-East)
    // -----------------------------------------------------------------
    if (features.hasStoneWalls || specialization === 'military' || tier >= 2) {
      ctx.save()
      const wallRadius = tier >= 3 ? 42 : tier >= 2 ? 32 : 22
      ctx.strokeStyle = specialization === 'military' ? '#0f172a' : '#334155'
      ctx.lineWidth = Math.max(3.5, (tier >= 3 ? 5.5 : 4) / zoom)

      // Outer bastion curtain wall arc
      ctx.beginPath()
      ctx.arc(cx, cy, wallRadius, -Math.PI * 0.85, Math.PI * 0.15)
      ctx.stroke()

      // Inner secondary wall for Tier 3
      if (tier >= 3) {
        ctx.strokeStyle = '#475569'
        ctx.lineWidth = Math.max(2.5, 3.8 / zoom)
        ctx.beginPath()
        ctx.arc(cx, cy, wallRadius * 0.65, -Math.PI * 0.85, Math.PI * 0.15)
        ctx.stroke()
      }

      // Bastion Towers on wall nodes
      const towerCount = tier >= 3 ? 5 : tier >= 2 ? 3 : 2
      for (let i = 0; i < towerCount; i++) {
        const ang = -Math.PI * 0.85 + (i * Math.PI) / (towerCount - 1)
        const tx = cx + Math.cos(ang) * wallRadius
        const ty = cy + Math.sin(ang) * wallRadius

        ctx.fillStyle = '#0f172a'
        ctx.beginPath()
        ctx.arc(tx, ty, Math.max(4, 6 / zoom), 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = Math.max(1, 1.5 / zoom)
        ctx.stroke()
      }

      // Bold Red Military Banner on garrison
      if (specialization === 'military' || tier >= 3) {
        ctx.fillStyle = '#dc2626'
        ctx.beginPath()
        ctx.moveTo(cx - 20, cy - wallRadius - Math.max(8, 12 / zoom))
        ctx.lineTo(cx - 6, cy - wallRadius - Math.max(5, 7 / zoom))
        ctx.lineTo(cx - 20, cy - wallRadius)
        ctx.closePath()
        ctx.fill()
        ctx.strokeStyle = '#7f1d1d'
        ctx.stroke()
      }
      ctx.restore()
    }

    // -----------------------------------------------------------------
    // D. Distress / Ruin FX
    // -----------------------------------------------------------------
    if (features.hasSmokeAndRuins) {
      ctx.save()
      const smokeOrigins = [
        [cx - 24, cy - 12],
        [cx + 18, cy - 28],
        [cx + 32, cy + 22],
      ]
      smokeOrigins.forEach(([sx, sy], idx) => {
        ctx.fillStyle = 'rgba(75, 85, 99, 0.72)'
        const smR = Math.max(5, 8 / zoom)
        ctx.beginPath()
        ctx.arc(sx, sy, smR, 0, Math.PI * 2)
        ctx.arc(sx + 4, sy - smR * 1.1, smR * 1.3, 0, Math.PI * 2)
        ctx.arc(sx - 3, sy - smR * 2.2, smR * 1.6, 0, Math.PI * 2)
        ctx.fill()

        if (idx === 0 || distress === 'critical') {
          ctx.fillStyle = '#f97316'
          ctx.beginPath()
          ctx.arc(sx, sy + 2, Math.max(3, 4 / zoom), 0, Math.PI * 2)
          ctx.fill()
        }
      })
      ctx.restore()
    }
  }

  ctx.restore() // End polygon clip

  // ===================================================================
  // 2. Central Citadel / Keep Landmark Structure
  // ===================================================================
  ctx.save()
  const keepSize = Math.max(14, (tier === 3 ? 24 : tier === 2 ? 18 : 13) / zoom)
  const keepY = cy - 4

  // Keep Base Shadow / Moat Ring
  ctx.beginPath()
  ctx.arc(cx, keepY, keepSize * 1.25, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.55)'
  ctx.fill()

  // Keep Main Structure Block
  ctx.fillStyle = tier === 3 ? '#0f172a' : tier === 2 ? '#334155' : '#78350f'
  ctx.strokeStyle = tier === 3 ? '#fbbf24' : tier === 2 ? '#f8fafc' : '#d97706'
  ctx.lineWidth = Math.max(2, (tier === 3 ? 3.5 : 2.4) / zoom)
  ctx.beginPath()
  ctx.rect(cx - keepSize / 2, keepY - keepSize / 2, keepSize, keepSize)
  ctx.fill()
  ctx.stroke()

  // Roof / Tower Spire
  ctx.fillStyle =
    specialization === 'military'
      ? '#dc2626'
      : specialization === 'commercial'
      ? '#d97706'
      : specialization === 'agrarian'
      ? '#16a34a'
      : '#0284c7'
  ctx.beginPath()
  ctx.moveTo(cx - keepSize * 0.7, keepY - keepSize / 2)
  ctx.lineTo(cx, keepY - keepSize * 1.25)
  ctx.lineTo(cx + keepSize * 0.7, keepY - keepSize / 2)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#0f172a'
  ctx.lineWidth = Math.max(1, 1.8 / zoom)
  ctx.stroke()

  ctx.restore()

  // ===================================================================
  // 3. Prominent Emblem Badge & Status Halo (Highly Legible across Map)
  // ===================================================================
  ctx.save()
  const badgeY = cy - Math.max(28, (zoom < 0.65 ? 32 : 40) / zoom)
  const badgeRadius = Math.max(13, Math.min(26, 17 / zoom))

  // Halo Ring based on Tier & Distress
  ctx.beginPath()
  ctx.arc(cx, badgeY, badgeRadius + 5 / zoom, 0, Math.PI * 2)
  ctx.fillStyle =
    distress !== 'normal'
      ? 'rgba(239, 68, 68, 0.35)'
      : tier === 3
      ? 'rgba(251, 191, 36, 0.45)'
      : tier === 2
      ? 'rgba(56, 189, 248, 0.35)'
      : 'rgba(255, 255, 255, 0.2)'
  ctx.fill()

  // Emblem Circle
  ctx.beginPath()
  ctx.arc(cx, badgeY, badgeRadius, 0, Math.PI * 2)
  ctx.fillStyle = '#0f172a'
  ctx.fill()
  ctx.strokeStyle = distress !== 'normal' ? '#ef4444' : analysis.specColor
  ctx.lineWidth = Math.max(2.2, (tier === 3 ? 3.8 : 2.5) / zoom)
  ctx.stroke()

  // Emblem Icon
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const iconSize = Math.max(13, Math.min(24, 18 / zoom))
  ctx.font = `${iconSize}px ${FONT_STACK}`
  const displayIcon = distress === 'critical' ? '🔥' : distress === 'distressed' ? '⚠️' : analysis.specIcon
  ctx.fillText(displayIcon, cx, badgeY + 1 / zoom)

  // Growth Stage Text Label below Badge (Always crisp with dark stroke)
  const fontSize = Math.max(11, Math.min(18, 14 / zoom))
  ctx.font = `900 ${fontSize}px ${FONT_STACK}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.98)'
  ctx.lineWidth = Math.max(3, 4.2 / zoom)
  ctx.fillStyle = distress !== 'normal' ? '#fca5a5' : '#fef08a'

  const tierText = `★ 에르덴 [T${tier}·${analysis.specLabel.split(' ')[0]}]`
  const textY = badgeY + badgeRadius + Math.max(11, 14 / zoom)
  ctx.strokeText(tierText, cx, textY)
  ctx.fillText(tierText, cx, textY)

  ctx.restore()

  ctx.restore()
}
