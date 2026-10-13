import type { Province } from '../types/worldMap'
import type { RealmVisualAnalysis } from './realmGrowthVisuals'

const FONT_STACK = 'Pretendard, "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

/**
 * Renders the living growth layers of the player's fief onto the canvas.
 * Adapts seamlessly across zoom levels (abstract icon/ring at macro zoom,
 * detailed districts, furrows, tents, ramparts and smoke at micro zoom).
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
    baseColor = tier >= 3 ? 'rgba(74, 222, 128, 0.40)' : 'rgba(132, 204, 22, 0.32)'
  } else if (specialization === 'commercial') {
    baseColor = tier >= 3 ? 'rgba(245, 158, 11, 0.42)' : 'rgba(251, 191, 36, 0.34)'
  } else if (specialization === 'military') {
    baseColor = tier >= 3 ? 'rgba(100, 116, 139, 0.46)' : 'rgba(148, 163, 184, 0.34)'
  }
  ctx.fillStyle = baseColor
  ctx.fill()

  // 1.2 Distress wash if distressed or critical
  if (distress === 'critical') {
    ctx.fillStyle = 'rgba(185, 28, 28, 0.35)'
    ctx.fill()
    // Warning diagonal hatch pattern
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)'
    ctx.lineWidth = 2.5 / zoom
    for (let offset = -200; offset < 200; offset += 22) {
      ctx.beginPath()
      ctx.moveTo(cx + offset - 100, cy - 100)
      ctx.lineTo(cx + offset + 100, cy + 100)
      ctx.stroke()
    }
  } else if (distress === 'distressed') {
    ctx.fillStyle = 'rgba(217, 119, 6, 0.22)'
    ctx.fill()
  }

  // 1.3 Detailed Micro-level District Patterns (Only rendered when zoom >= 0.55)
  if (zoom >= 0.55) {
    // A. Agrarian Sector (West / South-West of fief center)
    if (features.hasGoldenFields || specialization === 'agrarian') {
      const fieldCount = tier >= 3 ? 7 : tier >= 2 ? 4 : 2
      ctx.save()
      ctx.strokeStyle = specialization === 'agrarian' ? 'rgba(163, 230, 53, 0.75)' : 'rgba(234, 179, 8, 0.6)'
      ctx.lineWidth = 2.2 / zoom

      // Furrows in southwest quadrant
      for (let i = 0; i < fieldCount; i++) {
        const fy = cy + 15 + i * 8
        ctx.beginPath()
        ctx.moveTo(cx - 55, fy)
        ctx.lineTo(cx - 15, fy)
        ctx.stroke()
      }

      // Windmill / Barn marks
      if (features.hasWindmills || tier >= 2) {
        const wx = cx - 42
        const wy = cy + 22
        // Tower body
        ctx.fillStyle = '#fef08a'
        ctx.beginPath()
        ctx.moveTo(wx - 4 / zoom, wy + 6 / zoom)
        ctx.lineTo(wx, wy - 8 / zoom)
        ctx.lineTo(wx + 4 / zoom, wy + 6 / zoom)
        ctx.closePath()
        ctx.fill()
        // Blades
        ctx.strokeStyle = '#854d0e'
        ctx.lineWidth = 1.4 / zoom
        ctx.beginPath()
        ctx.moveTo(wx - 7 / zoom, wy - 8 / zoom)
        ctx.lineTo(wx + 7 / zoom, wy - 8 / zoom)
        ctx.moveTo(wx, wy - 15 / zoom)
        ctx.lineTo(wx, wy - 1 / zoom)
        ctx.stroke()
      }
      ctx.restore()
    }

    // B. Commercial Sector (East / South-East of fief center)
    if (features.hasBustlingMarket || specialization === 'commercial') {
      ctx.save()
      // Cobblestone radial roads from center to southeast
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)'
      ctx.lineWidth = 2.8 / zoom
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + 45, cy + 30)
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + 35, cy - 25)
      ctx.stroke()

      // Colorful Market Pavilions / Tents
      const tents = tier >= 3
        ? [
            { x: cx + 22, y: cy + 15, color: '#ef4444' },
            { x: cx + 36, y: cy + 24, color: '#3b82f6' },
            { x: cx + 28, y: cy + 32, color: '#eab308' },
            { x: cx + 45, y: cy + 14, color: '#10b981' },
          ]
        : tier >= 2
        ? [
            { x: cx + 24, y: cy + 18, color: '#ef4444' },
            { x: cx + 36, y: cy + 26, color: '#eab308' },
          ]
        : [{ x: cx + 26, y: cy + 20, color: '#f59e0b' }]

      tents.forEach((t) => {
        ctx.fillStyle = t.color
        ctx.beginPath()
        ctx.moveTo(t.x, t.y - 5 / zoom)
        ctx.lineTo(t.x + 5 / zoom, t.y + 3 / zoom)
        ctx.lineTo(t.x - 5 / zoom, t.y + 3 / zoom)
        ctx.closePath()
        ctx.fill()
      })
      ctx.restore()
    }

    // C. Military Sector (North / North-West of fief center)
    if (features.hasStoneWalls || specialization === 'military') {
      ctx.save()
      const wallRadius = tier >= 3 ? 34 : tier >= 2 ? 26 : 18
      ctx.strokeStyle = specialization === 'military' ? '#334155' : '#64748b'
      ctx.lineWidth = (tier >= 3 ? 4.5 : 3) / zoom

      // Outer bastion ramparts
      ctx.beginPath()
      ctx.arc(cx, cy, wallRadius, -Math.PI * 0.85, Math.PI * 0.15)
      ctx.stroke()

      // Crenellations / Bastion Towers
      const towerCount = tier >= 3 ? 4 : 2
      for (let i = 0; i < towerCount; i++) {
        const ang = -Math.PI * 0.85 + (i * Math.PI) / (towerCount - 1)
        const tx = cx + Math.cos(ang) * wallRadius
        const ty = cy + Math.sin(ang) * wallRadius

        ctx.fillStyle = '#1e293b'
        ctx.beginPath()
        ctx.arc(tx, ty, 4.5 / zoom, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#94a3b8'
        ctx.lineWidth = 1.2 / zoom
        ctx.stroke()
      }

      // Red banner for military specialization
      if (specialization === 'military' || tier >= 3) {
        ctx.fillStyle = '#dc2626'
        ctx.beginPath()
        ctx.moveTo(cx - 16, cy - wallRadius - 8 / zoom)
        ctx.lineTo(cx - 7, cy - wallRadius - 4 / zoom)
        ctx.lineTo(cx - 16, cy - wallRadius)
        ctx.closePath()
        ctx.fill()
      }
      ctx.restore()
    }

    // D. Smoke & Ruins Overlay for Distress
    if (features.hasSmokeAndRuins) {
      ctx.save()
      const smokeOrigins = [
        [cx - 20, cy - 10],
        [cx + 15, cy - 25],
        [cx + 25, cy + 18],
      ]
      smokeOrigins.forEach(([sx, sy], idx) => {
        // Smoke plume particles
        ctx.fillStyle = 'rgba(75, 85, 99, 0.65)'
        ctx.beginPath()
        ctx.arc(sx, sy, 5 / zoom, 0, Math.PI * 2)
        ctx.arc(sx + 3 / zoom, sy - 7 / zoom, 7 / zoom, 0, Math.PI * 2)
        ctx.arc(sx - 2 / zoom, sy - 15 / zoom, 9 / zoom, 0, Math.PI * 2)
        ctx.fill()

        // Tiny orange ember at base
        if (idx === 0 || distress === 'critical') {
          ctx.fillStyle = '#f97316'
          ctx.beginPath()
          ctx.arc(sx, sy + 2 / zoom, 2.5 / zoom, 0, Math.PI * 2)
          ctx.fill()
        }
      })
      ctx.restore()
    }
  }

  ctx.restore() // End polygon clip

  // 2. Central Citadel / Keep Landmark
  // Tier 1: Wooden Manor & Post
  // Tier 2: Stone Bastion Keep
  // Tier 3: Grand Royal Citadel Fortress
  ctx.save()
  const keepSize = (tier === 3 ? 18 : tier === 2 ? 14 : 10) / zoom
  const keepY = cy - 4

  // Keep Base / Moat Shadow
  ctx.beginPath()
  ctx.arc(cx, keepY, keepSize * 1.2, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.45)'
  ctx.fill()

  // Keep Structure
  ctx.fillStyle = tier === 3 ? '#1e293b' : tier === 2 ? '#334155' : '#78350f'
  ctx.strokeStyle = tier === 3 ? '#fbbf24' : tier === 2 ? '#e2e8f0' : '#d97706'
  ctx.lineWidth = (tier === 3 ? 2.8 : 2) / zoom
  ctx.beginPath()
  ctx.rect(cx - keepSize / 2, keepY - keepSize / 2, keepSize, keepSize)
  ctx.fill()
  ctx.stroke()

  // Roof / Tower Top
  ctx.fillStyle = specialization === 'military' ? '#b91c1c' : specialization === 'commercial' ? '#d97706' : specialization === 'agrarian' ? '#15803d' : '#0284c7'
  ctx.beginPath()
  ctx.moveTo(cx - keepSize * 0.65, keepY - keepSize / 2)
  ctx.lineTo(cx, keepY - keepSize * 1.15)
  ctx.lineTo(cx + keepSize * 0.65, keepY - keepSize / 2)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.restore()

  // 3. Prominent Emblem Badge & Status Halo (Visible clearly across ALL zoom levels)
  ctx.save()
  const badgeY = cy - (zoom < 0.65 ? 24 / zoom : 32 / zoom)
  const badgeRadius = Math.max(10, Math.min(22, 14 / zoom))

  // Halo Ring based on Tier
  ctx.beginPath()
  ctx.arc(cx, badgeY, badgeRadius + 4 / zoom, 0, Math.PI * 2)
  ctx.fillStyle = distress !== 'normal'
    ? 'rgba(239, 68, 68, 0.3)'
    : tier === 3
    ? 'rgba(251, 191, 36, 0.38)'
    : tier === 2
    ? 'rgba(56, 189, 248, 0.28)'
    : 'rgba(255, 255, 255, 0.15)'
  ctx.fill()

  // Emblem Circle
  ctx.beginPath()
  ctx.arc(cx, badgeY, badgeRadius, 0, Math.PI * 2)
  ctx.fillStyle = '#0f172a'
  ctx.fill()
  ctx.strokeStyle = distress !== 'normal' ? '#ef4444' : analysis.specColor
  ctx.lineWidth = (tier === 3 ? 3.2 : 2) / zoom
  ctx.stroke()

  // Emblem Icon
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const iconSize = Math.max(11, Math.min(20, 15 / zoom))
  ctx.font = `${iconSize}px ${FONT_STACK}`
  const displayIcon = distress === 'critical' ? '🔥' : distress === 'distressed' ? '⚠️' : analysis.specIcon
  ctx.fillText(displayIcon, cx, badgeY + 1 / zoom)

  // Growth Stage Text Label below Badge (Always legible)
  ctx.font = `800 ${Math.max(10, Math.min(16, 12 / zoom))}px ${FONT_STACK}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.95)'
  ctx.lineWidth = 3.5 / zoom
  ctx.fillStyle = distress !== 'normal' ? '#fca5a5' : '#fef08a'

  const tierText = `★ 에르덴 [T${tier}·${analysis.specLabel.split(' ')[0]}]`
  ctx.strokeText(tierText, cx, badgeY + badgeRadius + 11 / zoom)
  ctx.fillText(tierText, cx, badgeY + badgeRadius + 11 / zoom)

  ctx.restore()

  ctx.restore()
}
