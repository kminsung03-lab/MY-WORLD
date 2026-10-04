import type { Building, NightEvent, Player, Resources } from '../types/game'

export function generateNightEvent(
  day: number,
  buildings: Record<string, Building>,
  player: Player,
  resources: Resources
): NightEvent {
  const wallLevel = buildings.wall?.level || 0
  const blacksmithLevel = buildings.blacksmith?.level || 0

  if (day === 1) {
    return {
      day: 1,
      title: '🏕️ 개척의 첫날 밤',
      icon: '🔥',
      storyText:
        '황무지에 첫 개척의 모닥불을 피웠습니다. 주민들과 함께 첫날의 무사함을 자축하며 내일의 희망을 이야기합니다. 하지만 숲 깊은 곳에서 굶주린 짐승들의 번뜩이는 눈빛이 느껴집니다.',
      resultText: '주민들의 사기가 올랐습니다! 비상 식량 5개를 확보했습니다.',
      success: true,
      resourceChanges: { food: 5 },
      nextWarning: '⚠️ Day 2 밤: 굶주린 숲늑대 무리의 야간 기습 예고! (방어 목책 Lv.1 권장)',
    }
  }

  if (day === 2) {
    // Check defense condition: Wall Lv.1 or player defense >= 8
    const defended = wallLevel >= 1 || player.defense >= 8
    if (defended) {
      return {
        day: 2,
        title: '🐺 숲늑대 기습 격퇴 성공!',
        icon: '🛡️',
        storyText:
          '한밤중 굶주린 숲늑대 무리가 울부짖으며 마을 외곽으로 쇄도했습니다! 다행히 단단히 세워둔 방어 목책에 늑대들이 가로막혔고, 모험가의 반격에 늑대 무리는 꼬리를 내리고 달아났습니다.',
        resultText: '늑대 무리를 소탕하여 늑대 모피와 식량을 대량 획득했습니다! (식량 +15, 골드 +30)',
        success: true,
        resourceChanges: { food: 15, gold: 30 },
        nextWarning: '⚠️ Day 3 밤: 방랑하는 드워프 대장장이 방문 예정 (자금 및 자재 교환 기회)',
      }
    } else {
      const foodLoss = Math.min(resources.food, 10)
      return {
        day: 2,
        title: '🐺 숲늑대 기습 피해 발생 (방어선 부재)',
        icon: '💔',
        storyText:
          '마을에 방어 시설이 없어 굶주린 늑대들이 주거지 코앞까지 난입했습니다! 모험가가 맞서 싸워 늑대를 쫓아냈으나, 저장해 둔 식량을 털리고 깊은 상처를 입었습니다.',
        resultText: `식량 ${foodLoss}개를 도난당하고 체력이 20 감소했습니다! (방어 목책을 서둘러 건설하세요!)`,
        success: false,
        resourceChanges: { food: -foodLoss },
        hpChange: -20,
        nextWarning: '⚠️ Day 3 밤: 방랑하는 드워프 대장장이 방문 예정',
      }
    }
  }

  if (day === 3) {
    return {
      day: 3,
      title: '⚒️ 방랑하는 드워프 대장장이의 방문',
      icon: '🧔',
      storyText:
        "개척지의 대장간 연기를 보고 북방의 드워프 장인 '브룬'이 마을을 찾아왔습니다. 그는 험난한 야생을 개척하는 모험가의 용기를 칭찬하며 정밀한 제련 기술과 광석을 선물로 건넸습니다.",
      resultText: '드워프의 선물로 고순도 철광석 +15개와 석재 +20개, 금화 +25G를 지원받았습니다!',
      success: true,
      resourceChanges: { iron: 15, stone: 20, gold: 25 },
      nextWarning: '🚨 Day 5 밤: [위기 예고] 고블린 정찰대장과 군단의 대공습 예고! (방어 목책 Lv.2 & 대장간 Lv.1 필수)',
    }
  }

  if (day === 4) {
    return {
      day: 4,
      title: '🩸 붉은 보름달과 전운',
      icon: '🌕',
      storyText:
        '하늘에 핏빛 보름달이 떠오르고, 지평선 너머에서 수백 개의 횃불과 고블린들의 북소리가 울려 퍼집니다. 척후병의 보고에 따르면 내일 밤(Day 5) 고블린 군단의 총공격이 시작될 것입니다!',
      resultText: '결전의 날을 앞두고 긴급 방어 자재(목재 +25, 석재 +25)를 긴급 확보했습니다!',
      success: true,
      resourceChanges: { wood: 25, stone: 25 },
      nextWarning: '🚨 내일 밤(Day 5): [보스 총공격] 고블린 군단 대공습! 목책 증축과 무기 단련을 완료하세요!',
    }
  }

  if (day === 5) {
    // Boss Siege Event: Requires Wall Lv.2 and Player Attack >= 18 (or Blacksmith Lv.1)
    const isReady = wallLevel >= 2 && (player.attack >= 18 || blacksmithLevel >= 1)
    if (isReady) {
      return {
        day: 5,
        title: '🏆 대승리! 고블린 군단 궤멸',
        icon: '👑',
        storyText:
          '고블린 군단이 함성을 지르며 마을 성벽으로 돌진했습니다! 하지만 견고한 2중 방어 목책과 대장간에서 단련한 강철 무기 앞에 적들은 추풍낙엽처럼 쓰러졌습니다. 정찰대장을 격파하자 고블린 본대는 사방으로 흩어져 달아났습니다!',
        resultText:
          '역사적인 대승리! 적들이 버리고 간 군수 물자(골드 +100, 철광석 +25)를 노획하고, 개척 영토 +5구역을 단번에 확보했습니다!',
        success: true,
        resourceChanges: { gold: 100, iron: 25 },
        territoryChange: 5,
        nextWarning: '⚠️ Day 7 밤: 고대 유적 붕괴와 암흑 수정의 파동 예고...',
      }
    } else {
      const goldLoss = Math.min(resources.gold, 40)
      const woodLoss = Math.min(resources.wood, 20)
      return {
        day: 5,
        title: '💥 방어선 돌파! 고블린 군단의 약탈',
        icon: '🔥',
        storyText:
          '방비가 미흡했던 목책이 고블린들의 공성 망치에 무너져 내렸습니다! 모험가가 혈투를 벌여 마을 붕괴는 막았으나, 마을 창고가 불타고 심각한 부상을 입었습니다.',
        resultText: `약탈 피해: 골드 -${goldLoss}G, 목재 -${woodLoss}, 체력 -35 HP! 피해를 복구하고 재정비해야 합니다.`,
        success: false,
        resourceChanges: { gold: -goldLoss, wood: -woodLoss },
        hpChange: -35,
        nextWarning: '⚠️ Day 7 밤: 마을 복구와 다음 위협에 대비하세요.',
      }
    }
  }

  // Dynamic / Procedural Events for Day 6 and beyond
  const eventPool = [
    {
      title: '👹 오크 도적단의 야간 기습',
      icon: '🪓',
      check: wallLevel >= 3 || player.defense >= 15,
      winStory: '오크 도적단이 방벽을 오르려다 수비 함정에 걸려 퇴각했습니다! 전리품(골드 +50, 석재 +20) 획득.',
      winRes: { gold: 50, stone: 20 },
      loseStory: '오크들의 도끼질에 외곽 울타리가 파손되고 식량 15개를 약탈당했습니다!',
      loseRes: { food: -15 },
      hpPen: -25,
      next: `Day ${day + 2} 밤: 광산 지진 발생 가능성 예고`,
    },
    {
      title: '🌟 방랑 음유시인과 정착민 유입',
      icon: '🎵',
      check: true,
      winStory: '마을의 번영 소문을 들은 유랑민들이 정착했습니다! 영토 관리 능력이 늘고 식량이 풍족해집니다.',
      winRes: { food: 20, gold: 40 },
      loseStory: '',
      next: `Day ${day + 2} 밤: 암흑 상단의 수상한 거래 제안 예고`,
    },
    {
      title: '⛏️ 깊은 광산의 마나 분출',
      icon: '🔮',
      check: blacksmithLevel >= 2,
      winStory: '대장간의 마나 제련 시설이 광산의 마나 파동을 안정화하여 진귀한 철광석 +30개와 금화를 얻었습니다!',
      winRes: { iron: 30, gold: 40 },
      loseStory: '광산에서 마나 폭주가 일어나 일부 광부가 부상을 입었습니다. (석재 -15)',
      loseRes: { stone: -15 },
      hpPen: -10,
      next: `Day ${day + 2} 밤: 거대 야수 무리의 접근 감지`,
    },
  ]

  const picked = eventPool[(day - 6) % eventPool.length]
  if (picked.check) {
    return {
      day,
      title: picked.title,
      icon: picked.icon,
      storyText: picked.winStory,
      resultText: '사건을 훌륭하게 해결하고 마을을 한 단계 더 번영시켰습니다!',
      success: true,
      resourceChanges: picked.winRes,
      nextWarning: picked.next,
    }
  } else {
    return {
      day,
      title: `${picked.title} (피해 발생)`,
      icon: '⚠️',
      storyText: picked.loseStory,
      resultText: '대비가 부족하여 피해를 입었습니다. 마을 시설을 서둘러 보강하세요!',
      success: false,
      resourceChanges: picked.loseRes,
      hpChange: picked.hpPen,
      nextWarning: picked.next,
    }
  }
}
