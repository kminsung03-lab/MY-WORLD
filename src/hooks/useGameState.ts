import { useState, useEffect, useCallback } from 'react'
import type {
  GameState,
  GameLog,
  BuildingCost,
  NightEvent,
} from '../types/game'
import {
  INITIAL_RESOURCES,
  INITIAL_TERRITORY,
  INITIAL_PLAYER,
  INITIAL_BUILDINGS,
  INITIAL_DAY_STATE,
  MONSTERS,
  MINING_NODES,
} from '../constants/gameData'
import { generateNightEvent } from '../constants/storyEvents'

const SAVE_KEY = 'my_world_game_save_v2'

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          dayState: parsed.dayState || INITIAL_DAY_STATE,
          currentNightEvent: parsed.currentNightEvent || null,
          resources: parsed.resources || INITIAL_RESOURCES,
          territory: parsed.territory || INITIAL_TERRITORY,
          player: parsed.player || INITIAL_PLAYER,
          buildings: parsed.buildings || INITIAL_BUILDINGS,
          logs: parsed.logs || [],
        }
      }
    } catch (e) {
      console.error('Failed to load save game', e)
    }
    return {
      dayState: INITIAL_DAY_STATE,
      currentNightEvent: null,
      resources: INITIAL_RESOURCES,
      territory: INITIAL_TERRITORY,
      player: INITIAL_PLAYER,
      buildings: INITIAL_BUILDINGS,
      logs: [
        {
          id: 'init-1',
          timestamp: new Date().toLocaleTimeString(),
          text: '🏰 MY-WORLD에 오신 것을 환영합니다! 행동력(AP)을 활용해 낮에는 개척하고, 밤에는 사건을 대비하세요.',
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
      logs: [newLog, ...prev.logs.slice(0, 49)],
    }))
  }, [])

  // AP check & consume
  const consumeAp = (cost = 1): boolean => {
    if (gameState.dayState.ap < cost) {
      addLog(
        '⚡ 오늘의 행동력이 소진되었습니다! [🌙 하루 마무리하기]를 눌러 밤 결산 및 취침을 진행하세요.',
        'info'
      )
      return false
    }
    return true
  }

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

  // 1. Hunt Monster Action (Consumes 1 AP)
  const huntMonster = (monsterId: string) => {
    if (!consumeAp(1)) return

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
    const wallLevel = gameState.buildings.wall?.level || 0
    const wallReduction = Math.min(0.5, wallLevel * 0.08)
    const effectiveMonsterDmg = Math.max(1, Math.round(rawMonsterDmg * (1 - wallReduction)))

    const damageTaken = Math.min(
      gameState.player.hp - 1,
      effectiveMonsterDmg * (monsterTurnsToDie - 1)
    )

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
        dayState: {
          ...prev.dayState,
          ap: prev.dayState.ap - 1,
        },
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
      `⚔️ (1 AP 소모) [${monster.name}] 토벌 성공! 영토 +${monster.territoryReward}구역 개척 완료! (피해 -${damageTaken} HP, 획득: 🪙+${goldEarned}, 🍖+${foodEarned})`,
      'combat'
    )
  }

  // 2. Mine Action (Consumes 1 AP, delivers heavy swing)
  const mineRock = (nodeId: string) => {
    if (!consumeAp(1)) return

    const node = MINING_NODES.find((n) => n.id === nodeId)
    if (!node) return

    const currentHp = activeNodes[nodeId] ?? node.hp
    const hitDamage = Math.max(25, gameState.player.miningPower * 18)
    const newHp = currentHp - hitDamage

    const townHallBonus = 1 + (gameState.buildings.townHall?.level || 0) * 0.15
    const storageBonus = (gameState.buildings.storage?.level || 0) * 0.1

    if (newHp <= 0) {
      // Node broken! Full jackpot rewards
      const stoneGain = Math.round(node.stoneReward * (townHallBonus + storageBonus))
      const ironGain = Math.round(node.ironReward * (townHallBonus + storageBonus))
      const goldGain = Math.round(node.goldReward * townHallBonus)

      setGameState((prev) => ({
        ...prev,
        dayState: {
          ...prev.dayState,
          ap: prev.dayState.ap - 1,
        },
        resources: {
          ...prev.resources,
          stone: prev.resources.stone + stoneGain,
          iron: prev.resources.iron + ironGain,
          gold: prev.resources.gold + goldGain,
        },
      }))

      setActiveNodes((prev) => ({
        ...prev,
        [nodeId]: node.maxHp,
      }))

      addLog(
        `⛏️ (1 AP 소모) [${node.name}] 채굴 완파! 대량 자재 획득: 🪨+${stoneGain} 석재, ⛏️+${ironGain} 철광석, 🪙+${goldGain} 골드`,
        'mine'
      )
    } else {
      // Standard heavy strike yield
      const baseStone = Math.round(5 * (townHallBonus + storageBonus))
      const baseIron = Math.round(2 * (townHallBonus + storageBonus))

      setActiveNodes((prev) => ({
        ...prev,
        [nodeId]: newHp,
      }))

      setGameState((prev) => ({
        ...prev,
        dayState: {
          ...prev.dayState,
          ap: prev.dayState.ap - 1,
        },
        resources: {
          ...prev.resources,
          stone: prev.resources.stone + baseStone,
          iron: prev.resources.iron + baseIron,
        },
      }))

      addLog(
        `⛏️ (1 AP 소모) [${node.name}] 집중 채굴 완료! 🪨+${baseStone} 석재, ⛏️+${baseIron} 철광석 획득 (내구도: ${newHp}/${node.maxHp})`,
        'mine'
      )
    }
  }

  // 3. Timber Logging / Labor (Consumes 1 AP)
  const workLogging = () => {
    if (!consumeAp(1)) return

    const woodGain = 12 + (gameState.buildings.storage?.level || 0) * 3
    const goldGain = 8

    setGameState((prev) => ({
      ...prev,
      dayState: {
        ...prev.dayState,
        ap: prev.dayState.ap - 1,
      },
      resources: {
        ...prev.resources,
        wood: prev.resources.wood + woodGain,
        gold: prev.resources.gold + goldGain,
      },
    }))

    addLog(`🪓 (1 AP 소모) 원목 벌목 및 가공 완료! 🪵+${woodGain} 목재, 🪙+${goldGain} 일당 수령`, 'info')
  }

  // 4. Rest in Town
  const restAtTown = () => {
    const maxHp = gameState.player.maxHp
    if (gameState.player.hp >= maxHp) {
      addLog('이미 체력이 가득 차 있습니다.', 'info')
      return
    }

    const foodCost = 5
    if (gameState.resources.food < foodCost) {
      const heal = 25
      setGameState((prev) => ({
        ...prev,
        player: {
          ...prev.player,
          hp: Math.min(maxHp, prev.player.hp + heal),
        },
      }))
      addLog(`💤 가벼운 휴식으로 HP +${heal}을 회복했습니다.`, 'info')
    } else {
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

  // 5. Construct / Upgrade Building (Consumes 1 AP)
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
    if (!consumeAp(1)) return

    const b = gameState.buildings[buildingId]
    if (!b) return

    if (b.level >= b.maxLevel) {
      addLog(`[${b.name}]은(는) 이미 최고 레벨(${b.maxLevel})입니다.`, 'build')
      return
    }

    const availableLand = gameState.territory.secured - gameState.territory.used
    if (availableLand < b.landCost) {
      addLog(
        `🚫 [부지 부족] 건설에 ${b.landCost}구역이 필요하지만 남은 부지는 ${availableLand}구역뿐입니다! 사냥터에서 몬스터를 토벌하세요.`,
        'build'
      )
      return
    }

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

    setGameState((prev) => {
      const nextLevel = prev.buildings[buildingId].level + 1

      let updatedPlayer = { ...prev.player }
      if (buildingId === 'shelter') {
        updatedPlayer.maxHp += 25
        updatedPlayer.hp = updatedPlayer.maxHp
      } else if (buildingId === 'blacksmith') {
        updatedPlayer.attack += 6
        updatedPlayer.miningPower += 2
      } else if (buildingId === 'wall') {
        updatedPlayer.defense += 5
      }

      return {
        ...prev,
        dayState: {
          ...prev.dayState,
          ap: prev.dayState.ap - 1,
        },
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
      `🎉 (1 AP 소모) [${b.name}] 증축 완료 (Lv.${b.level + 1})! 영토 ${b.landCost}구역 사용됨. 효과: ${b.benefitText}`,
      'build'
    )
  }

  // 6. End Day (Night Settlement & Story Event Trigger)
  const endDay = () => {
    const event: NightEvent = generateNightEvent(
      gameState.dayState.day,
      gameState.buildings,
      gameState.player,
      gameState.resources
    )

    setGameState((prev) => ({
      ...prev,
      currentNightEvent: event,
    }))

    addLog(`🌙 Day ${gameState.dayState.day}의 하루를 마무리하고 밤의 사건을 맞이합니다...`, 'event')
  }

  // 7. Start Next Day (Apply event results & Recharge AP)
  const startNextDay = () => {
    const event = gameState.currentNightEvent
    if (!event) return

    setGameState((prev) => {
      const nextDay = prev.dayState.day + 1
      const resChanges = event.resourceChanges || {}

      const updatedResources = {
        gold: Math.max(0, prev.resources.gold + (resChanges.gold || 0)),
        wood: Math.max(0, prev.resources.wood + (resChanges.wood || 0)),
        stone: Math.max(0, prev.resources.stone + (resChanges.stone || 0)),
        iron: Math.max(0, prev.resources.iron + (resChanges.iron || 0)),
        food: Math.max(0, prev.resources.food + (resChanges.food || 0)),
      }

      const updatedHp = Math.max(
        1,
        Math.min(prev.player.maxHp, prev.player.hp + (event.hpChange || 0))
      )

      const updatedTerritory = {
        ...prev.territory,
        secured: prev.territory.secured + (event.territoryChange || 0),
      }

      return {
        ...prev,
        dayState: {
          day: nextDay,
          ap: prev.dayState.maxAp, // Recharged to max AP
          maxAp: prev.dayState.maxAp,
          upcomingWarning: event.nextWarning,
        },
        currentNightEvent: null,
        resources: updatedResources,
        player: {
          ...prev.player,
          hp: updatedHp,
        },
        territory: updatedTerritory,
      }
    })

    addLog(
      `☀️ Day ${gameState.dayState.day + 1}의 아침이 밝았습니다! ⚡ 행동력 5 AP가 충전되었습니다.`,
      'info'
    )
  }

  // Reset progress
  const resetSave = () => {
    if (window.confirm('정말 게임을 초기화하시겠습니까?')) {
      localStorage.removeItem(SAVE_KEY)
      setGameState({
        dayState: INITIAL_DAY_STATE,
        currentNightEvent: null,
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
    endDay,
    startNextDay,
    resetSave,
  }
}
