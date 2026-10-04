import { useState, useEffect, useCallback } from 'react'
import type {
  GameState,
  GameLog,
  BuildingCost,
} from '../types/game'
import {
  INITIAL_RESOURCES,
  INITIAL_TERRITORY,
  INITIAL_PLAYER,
  INITIAL_BUILDINGS,
  MONSTERS,
  MINING_NODES,
} from '../constants/gameData'

const SAVE_KEY = 'my_world_game_save_v1'

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.error('Failed to load save game', e)
    }
    return {
      resources: INITIAL_RESOURCES,
      territory: INITIAL_TERRITORY,
      player: INITIAL_PLAYER,
      buildings: INITIAL_BUILDINGS,
      logs: [
        {
          id: 'init-1',
          timestamp: new Date().toLocaleTimeString(),
          text: '🏰 MY-WORLD에 오신 것을 환영합니다! 사냥으로 영토를 넓히고 광산 자원으로 마을을 건설하세요.',
          type: 'info',
        },
      ],
    }
  })

  // Node health tracking for mining
  const [activeNodes, setActiveNodes] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    MINING_NODES.forEach((n) => {
      init[n.id] = n.hp
    })
    return init
  })

  // Auto-save
  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(gameState))
    } catch (e) {
      console.error('Failed to auto-save', e)
    }
  }, [gameState])

  const addLog = useCallback((text: string, type: GameLog['type'] = 'info') => {
    const newLog: GameLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      text,
      type,
    }
    setGameState((prev) => ({
      ...prev,
      logs: [newLog, ...prev.logs.slice(0, 49)], // Keep up to 50 logs
    }))
  }, [])

  // Check and apply level-up
  const checkLevelUp = (currExp: number, currMaxExp: number, currLevel: number) => {
    let exp = currExp
    let maxExp = currMaxExp
    let level = currLevel
    let leveledUp = false

    while (exp >= maxExp) {
      exp -= maxExp
      level += 1
      maxExp = Math.floor(maxExp * 1.5)
      leveledUp = true
    }

    return { exp, maxExp, level, leveledUp }
  }

  // 1. Hunt Monster Action (Clearing territory)
  const huntMonster = (monsterId: string) => {
    const monster = MONSTERS.find((m) => m.id === monsterId)
    if (!monster) return

    if (gameState.player.hp <= 15) {
      addLog('⚠️ 체력이 너무 낮습니다! 주택이나 여관에서 휴식하고 오세요.', 'combat')
      return
    }

    // Damage calculations
    const damageDealt = Math.max(1, gameState.player.attack - monster.defense)
    const monsterTurnsToDie = Math.ceil(monster.hp / damageDealt)

    const rawMonsterDmg = Math.max(1, monster.attack - gameState.player.defense)
    // Wall building reduction
    const wallLevel = gameState.buildings.wall?.level || 0
    const wallReduction = Math.min(0.5, wallLevel * 0.08)
    const effectiveMonsterDmg = Math.max(1, Math.round(rawMonsterDmg * (1 - wallReduction)))

    const damageTaken = Math.min(
      gameState.player.hp - 1, // Keep at least 1 HP
      effectiveMonsterDmg * (monsterTurnsToDie - 1)
    )

    // Town hall bonus
    const townHallBonus = 1 + (gameState.buildings.townHall?.level || 0) * 0.15
    const goldEarned = Math.round(monster.goldReward * townHallBonus)
    const foodEarned = Math.round(monster.foodReward * townHallBonus)
    const expEarned = monster.expReward

    const nextHp = Math.max(1, gameState.player.hp - damageTaken)

    setGameState((prev) => {
      const { exp, maxExp, level, leveledUp } = checkLevelUp(
        prev.player.exp + expEarned,
        prev.player.maxExp,
        prev.player.level
      )

      const updatedPlayer = {
        ...prev.player,
        hp: nextHp,
        exp,
        maxExp,
        level,
        attack: leveledUp ? prev.player.attack + 3 : prev.player.attack,
        maxHp: leveledUp ? prev.player.maxHp + 15 : prev.player.maxHp,
        defense: leveledUp ? prev.player.defense + 1 : prev.player.defense,
      }

      return {
        ...prev,
        player: updatedPlayer,
        resources: {
          ...prev.resources,
          gold: prev.resources.gold + goldEarned,
          food: prev.resources.food + foodEarned,
        },
        territory: {
          ...prev.territory,
          secured: prev.territory.secured + monster.territoryReward,
        },
      }
    })

    addLog(
      `⚔️ [${monster.name}] 토벌 성공! 영토 +${monster.territoryReward}구역 개척 완료! (피해 -${damageTaken} HP, 획득: 🪙+${goldEarned}, 🍖+${foodEarned})`,
      'combat'
    )
  }

  // 2. Mine Action (Acquiring building materials)
  const mineRock = (nodeId: string) => {
    const node = MINING_NODES.find((n) => n.id === nodeId)
    if (!node) return

    const currentHp = activeNodes[nodeId] ?? node.hp
    const hitDamage = Math.max(10, gameState.player.miningPower * 8)
    const newHp = currentHp - hitDamage

    if (newHp <= 0) {
      // Node broken! Collect rewards
      const townHallBonus = 1 + (gameState.buildings.townHall?.level || 0) * 0.15
      const storageBonus = (gameState.buildings.storage?.level || 0) * 0.1

      const stoneGain = Math.round(node.stoneReward * (townHallBonus + storageBonus))
      const ironGain = Math.round(node.ironReward * (townHallBonus + storageBonus))
      const goldGain = Math.round(node.goldReward * townHallBonus)

      setGameState((prev) => ({
        ...prev,
        resources: {
          ...prev.resources,
          stone: prev.resources.stone + stoneGain,
          iron: prev.resources.iron + ironGain,
          gold: prev.resources.gold + goldGain,
        },
      }))

      setActiveNodes((prev) => ({
        ...prev,
        [nodeId]: node.maxHp, // Respawn node
      }))

      addLog(
        `⛏️ [${node.name}] 채굴 완파! 자재 획득: 🪨+${stoneGain} 석재, ⛏️+${ironGain} 철광석, 🪙+${goldGain} 골드`,
        'mine'
      )
    } else {
      setActiveNodes((prev) => ({
        ...prev,
        [nodeId]: newHp,
      }))
      // Minor gather per hit
      const minorStone = 1
      setGameState((prev) => ({
        ...prev,
        resources: {
          ...prev.resources,
          stone: prev.resources.stone + minorStone,
        },
      }))
    }
  }

  // 3. Timber Logging / Construction Labor (Wood and Gold)
  const workLogging = () => {
    const woodGain = 8 + (gameState.buildings.storage?.level || 0) * 2
    const goldGain = 5

    setGameState((prev) => ({
      ...prev,
      resources: {
        ...prev.resources,
        wood: prev.resources.wood + woodGain,
        gold: prev.resources.gold + goldGain,
      },
    }))

    addLog(`🪓 원목 벌목 및 건축 노동 완료! 🪵+${woodGain} 목재, 🪙+${goldGain} 일당 수령`, 'info')
  }

  // 4. Rest in Town (HP recovery)
  const restAtTown = () => {
    const maxHp = gameState.player.maxHp
    if (gameState.player.hp >= maxHp) {
      addLog('이미 체력이 가득 차 있습니다.', 'info')
      return
    }

    const foodCost = 5
    if (gameState.resources.food < foodCost) {
      // Minor free rest
      const heal = 20
      setGameState((prev) => ({
        ...prev,
        player: {
          ...prev.player,
          hp: Math.min(maxHp, prev.player.hp + heal),
        },
      }))
      addLog(`💤 가벼운 휴식으로 HP +${heal}을 회복했습니다. (식량이 있으면 완전 회복 가능)`, 'info')
    } else {
      // Full heal with food
      setGameState((prev) => ({
        ...prev,
        resources: {
          ...prev.resources,
          food: prev.resources.food - foodCost,
        },
        player: {
          ...prev.player,
          hp: maxHp,
        },
      }))
      addLog(`🍖 식량 ${foodCost}개를 섭취하고 푹 쉬어 체력을 100% 완전 회복했습니다!`, 'info')
    }
  }

  // 5. Construct / Upgrade Building
  const getBuildingCost = (buildingId: string): BuildingCost => {
    const b = gameState.buildings[buildingId]
    if (!b) return { gold: 0, wood: 0, stone: 0, iron: 0 }
    const multiplier = 1 + b.level * 0.6
    return {
      gold: Math.round(b.baseCost.gold * multiplier),
      wood: Math.round(b.baseCost.wood * multiplier),
      stone: Math.round(b.baseCost.stone * multiplier),
      iron: Math.round(b.baseCost.iron * multiplier),
    }
  }

  const constructBuilding = (buildingId: string) => {
    const b = gameState.buildings[buildingId]
    if (!b) return

    if (b.level >= b.maxLevel) {
      addLog(`[${b.name}]은(는) 이미 최고 레벨(${b.maxLevel})입니다.`, 'build')
      return
    }

    // Check Territory land availability!
    const availableLand = gameState.territory.secured - gameState.territory.used
    if (availableLand < b.landCost) {
      addLog(
        `🚫 [부지 부족] 건설에 ${b.landCost}구역이 필요하지만, 남은 부지는 ${availableLand}구역뿐입니다! 사냥터에서 몬스터를 토벌하여 영토를 넓히세요.`,
        'build'
      )
      return
    }

    // Check Resource costs
    const cost = getBuildingCost(buildingId)
    const { resources } = gameState

    if (
      resources.gold < cost.gold ||
      resources.wood < cost.wood ||
      resources.stone < cost.stone ||
      resources.iron < cost.iron
    ) {
      addLog(
        `🚫 [자재 부족] 자원이 부족합니다! 광산에서 석재/철광석을 캐거나 벌목을 진행하세요. (필요: 🪙${cost.gold}, 🪵${cost.wood}, 🪨${cost.stone}, ⛏️${cost.iron})`,
        'build'
      )
      return
    }

    // Deduct and construct
    setGameState((prev) => {
      const nextLevel = prev.buildings[buildingId].level + 1

      // Passive bonuses applied right away
      let updatedPlayer = { ...prev.player }
      if (buildingId === 'shelter') {
        updatedPlayer.maxHp += 25
        updatedPlayer.hp = updatedPlayer.maxHp // Free heal upon upgrading shelter
      } else if (buildingId === 'blacksmith') {
        updatedPlayer.attack += 6
        updatedPlayer.miningPower += 2
      } else if (buildingId === 'wall') {
        updatedPlayer.defense += 5
      }

      return {
        ...prev,
        resources: {
          ...prev.resources,
          gold: prev.resources.gold - cost.gold,
          wood: prev.resources.wood - cost.wood,
          stone: prev.resources.stone - cost.stone,
          iron: prev.resources.iron - cost.iron,
        },
        territory: {
          ...prev.territory,
          used: prev.territory.used + b.landCost,
        },
        player: updatedPlayer,
        buildings: {
          ...prev.buildings,
          [buildingId]: {
            ...prev.buildings[buildingId],
            level: nextLevel,
          },
        },
      }
    })

    addLog(
      `🎉 [${b.name}] 증축 완료 (Lv.${b.level + 1})! 영토 ${b.landCost}구역 사용됨. 효과: ${b.benefitText}`,
      'build'
    )
  }

  // Reset progress
  const resetSave = () => {
    if (window.confirm('정말 게임을 초기화하시겠습니까?')) {
      localStorage.removeItem(SAVE_KEY)
      setGameState({
        resources: INITIAL_RESOURCES,
        territory: INITIAL_TERRITORY,
        player: INITIAL_PLAYER,
        buildings: INITIAL_BUILDINGS,
        logs: [
          {
            id: 'reset-log',
            timestamp: new Date().toLocaleTimeString(),
            text: '🔄 게임이 초기 상태로 리셋되었습니다.',
            type: 'info',
          },
        ],
      })
    }
  }

  return {
    gameState,
    activeNodes,
    huntMonster,
    mineRock,
    workLogging,
    restAtTown,
    constructBuilding,
    getBuildingCost,
    resetSave,
  }
}
