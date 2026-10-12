import type {
  CivicBuilding,
  CivicBuildingId,
  CivicFocusId,
  FieldQuest,
  FieldQuestId,
} from '../types/fieldQuest'


export interface CivicFocusDefinition {
  id: CivicFocusId
  name: string
  icon: string
  shortDesc: string
  effectDesc: string
  costsDesc: string
  monthlyImpact: {
    treasuryDelta?: number
    grainDelta?: number
    ironDelta?: number
    timberDelta?: number
    manpowerDelta?: number
    stabilityDelta?: number
    autonomyDelta?: number
  }
}

export const CIVIC_FOCUS_DEFINITIONS: Record<CivicFocusId, CivicFocusDefinition> = {
  balanced: {
    id: 'balanced',
    name: '균형 시정',
    icon: '⚖️',
    shortDesc: '영지의 각 분야를 균형 있게 관리하여 무리 없는 일상 행정을 유지합니다.',
    effectDesc: '기본 산업 생산 및 세수 유지 (추가 비용 및 부작용 없음)',
    costsDesc: '없음',
    monthlyImpact: {},
  },
  agrarian_expansion: {
    id: 'agrarian_expansion',
    name: '대규모 개간 및 농업 진흥',
    icon: '🌾',
    shortDesc: '하곡과 평야의 미개간지를 농민들에게 분배하고 관개 수로를 대대적으로 정비합니다.',
    effectDesc: '월 식량 생산 +30% (+15 추가)',
    costsDesc: '월 국고 유지비 🪙15',
    monthlyImpact: {
      grainDelta: 15,
      treasuryDelta: -15,
    },
  },
  deep_mining: {
    id: 'deep_mining',
    name: '광맥 심층 채굴',
    icon: '⛏️',
    shortDesc: '회색능선의 암반을 깊이 굴착하여 철광석 출하량을 극대화합니다.',
    effectDesc: '월 철재 생산 +35% (+8 추가)',
    costsDesc: '월 목재 🪵15 소모 · 작업 강도로 매달 안정도 -1',
    monthlyImpact: {
      ironDelta: 8,
      timberDelta: -15,
      stabilityDelta: -1,
    },
  },
  timber_harvest: {
    id: 'timber_harvest',
    name: '산림 집중 벌채',
    icon: '🪵',
    shortDesc: '검은솔 수림의 벌목 캠프를 증설해 축성 및 건설용 목재를 대량 확보합니다.',
    effectDesc: '월 목재 생산 +35% (+10 추가)',
    costsDesc: '산림 훼손으로 월 식량(임산물) 🌾10 감소',
    monthlyImpact: {
      timberDelta: 10,
      grainDelta: -10,
    },
  },
  market_boom: {
    id: 'market_boom',
    name: '장터 및 상권 장려',
    icon: '🪙',
    shortDesc: '영지 내 통행세를 낮추고 장날을 확대하여 상인들의 자율 상거래를 촉진합니다.',
    effectDesc: '월 국고 세입 +30% (+18 추가) · 영지 자율성 +1',
    costsDesc: '상업 규제 완화로 자율성 증가',
    monthlyImpact: {
      treasuryDelta: 18,
      autonomyDelta: 1,
    },
  },
  fortress_drill: {
    id: 'fortress_drill',
    name: '방벽 수축 및 민병 훈련',
    icon: '🛡️',
    shortDesc: '외곽 보루를 보수하고 장정들을 소집해 철저한 군사 교리를 훈련시킵니다.',
    effectDesc: '월 징집병/인력 회복 +35 · 국경 방비 강화',
    costsDesc: '월 국고 🪙20 · 철재 ⛓10 소모',
    monthlyImpact: {
      treasuryDelta: -20,
      ironDelta: -10,
      manpowerDelta: 35,
    },
  },
}

export const INITIAL_CIVIC_BUILDINGS: Record<CivicBuildingId, CivicBuilding> = {
  townHall: {
    id: 'townHall',
    name: '영주 관저 및 시청',
    icon: '🏛️',
    level: 1,
    maxLevel: 5,
    description: '영지의 행정 장부를 관리하고 징세관을 지휘하는 중심부입니다.',
    benefitText: '레벨당 월 세입 +6 (Lv.3 이상 행정력 +1)',
    baseCost: { treasury: 70, grain: 0, iron: 10, timber: 40 },
  },
  residences: {
    id: 'residences',
    name: '정착민 거주구',
    icon: '🏡',
    level: 1,
    maxLevel: 5,
    description: '피난민과 장인들이 안착할 수 있는 주거지를 계획적으로 조성합니다.',
    benefitText: '레벨당 월 인구 성장 +30, 인력 +20',
    baseCost: { treasury: 45, grain: 20, iron: 0, timber: 35 },
  },
  granary: {
    id: 'granary',
    name: '중앙 비축창고',
    icon: '📦',
    level: 1,
    maxLevel: 5,
    description: '식량과 물자를 안전하게 보관하여 기근과 흉작을 방지합니다.',
    benefitText: '레벨당 월 식량 보존 +8, 비상 식량 비축',
    baseCost: { treasury: 50, grain: 0, iron: 10, timber: 45 },
  },
  fortifications: {
    id: 'fortifications',
    name: '외곽 방벽 및 감시대',
    icon: '🛡️',
    level: 1,
    maxLevel: 5,
    description: '마수의 기습과 약탈단을 저지하는 튼튼한 석조·목조 방벽입니다.',
    benefitText: '레벨당 영지 안정도 기본치 +1, 수비력 대폭 증강',
    baseCost: { treasury: 60, grain: 0, iron: 25, timber: 40 },
  },
}

export function getDeterministicQuestRoll(year: number, month: number, seedKey: string | number): number {
  let hash = 2166136261
  const str = `${year}_${month}_${seedKey}`
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash % 100)
}

export function createFieldQuestTemplate(
  questId: FieldQuestId,
  _year: number,
  _month: number,
  seed: number,
): FieldQuest {
  if (questId === 'frontier_beast_patrol') {
    return {
      id: 'frontier_beast_patrol',
      title: '국경 마수 소탕 및 개척 순찰',
      category: '안보·군사',
      location: '서부 협곡 변경 삼림',
      summary: '국경 협곡 일대에서 마수 무리가 준동하여 개척 수송로를 위협하고 있습니다. 현장에 당도한 영주의 결단이 필요합니다.',
      currentStepId: 'step_1',
      seed,
      isJackpotOpportunity: false,
      steps: {
        step_1: {
          id: 'step_1',
          title: '제1막: 마수 출몰지의 정세 파악',
          narrative: '정찰병들이 숲속 맹수와 마수 무리가 집결한 협곡 입구를 발견했습니다. 군관은 즉각 소탕을, 현지 사냥꾼들은 유인을 제안합니다.',
          choices: [
            {
              id: 'choice_1_military',
              label: '정규 수비대와 친위대 동원 (정면 진압)',
              description: '지휘력을 발휘해 철갑을 두른 상비군으로 협곡을 봉쇄하고 정면으로 격퇴합니다.',
              costsCapacities: { command: 1 },
              costs: { iron: 15 },
              nextStepId: 'step_2_cleared',
              impact: {
                stability: 2,
                logTitle: '협곡 수비대 진압 작전 개시',
                logDetail: '정규 수비대가 협곡을 봉쇄하여 마수의 선발대를 단번에 궤멸시켰습니다. 둥지 본거지 소탕을 앞두고 있습니다.',
                logTone: 'good',
              },
            },
            {
              id: 'choice_1_hunters',
              label: '현지 사냥꾼 연합 포섭 (협력 유인)',
              description: '식량과 은화를 제공해 지형에 밝은 삼림 사냥꾼들의 덫과 길잡이를 활용합니다.',
              costs: { treasury: 20, grain: 25 },
              nextStepId: 'step_2_cleared',
              impact: {
                manpower: 15,
                logTitle: '사냥꾼 연합과의 합동 작전',
                logDetail: '현지 사냥꾼들이 맹수 무리를 지형의 덫으로 유인해 아군 피해 없이 마수 주력을 분산시켰습니다.',
                logTone: 'good',
              },
            },
            {
              id: 'choice_1_defensive',
              label: '경계 초소 보강 및 방어선 후퇴',
              description: '무리한 진입을 피하고 외곽 초소의 방어선만을 공고히 하여 물자를 아낍니다.',
              nextStepId: 'step_2_passive',
              impact: {
                stability: -1,
                logTitle: '국경 초소 수성 태세',
                logDetail: '직접 소탕 대신 방어선을 굳혔으나, 개척민들 사이에서 마수 위협에 대한 불안이 소폭 확산되었습니다.',
                logTone: 'neutral',
              },
            },
          ],
        },
        step_2_cleared: {
          id: 'step_2_cleared',
          title: '제2막: 마수 둥지 평정과 영토 편입',
          narrative: '마수의 우두머리를 성공적으로 처치하고 협곡의 깊은 동굴을 확보했습니다. 막대한 모피와 정수가 전리품으로 남았습니다.',
          choices: [
            {
              id: 'choice_2_annex_buffer',
              label: '국경 경계석 확충 및 개척지 편입',
              description: '정복된 완충지를 영지의 정식 영토로 편입하고 치안 초소를 세웁니다.',
              isTerminal: true,
              impact: {
                stability: 4,
                manpower: 25,
                resources: { treasury: 60, timber: 40 },
                logTitle: '국경 마수 완전 소탕 및 완충지 확보',
                logDetail: '영주가 직접 이끈 순행으로 협곡이 안전해졌습니다! 안정도 +4, 가용 인력 +25, 전리품 금화 🪙60과 목재 🪵40을 획득했습니다.',
                logTone: 'royal',
              },
            },
            {
              id: 'choice_2_tribute_sylvana',
              label: '마수 정수를 실바나 숲의회에 친선 기증',
              description: '고대 수림의 질서를 지켜준 데 대해 감사를 표하며 실바나 변경백에게 영수 정수를 전달합니다.',
              isTerminal: true,
              impact: {
                relationTargetId: 'sylvana',
                relationDelta: 14,
                resources: { grain: 35, timber: 30 },
                logTitle: '실바나 숲의회와의 국경 친선 강화',
                logDetail: '실바나의 드루이드들이 영주의 배려에 깊이 감사하며 수림 약초와 특산 정령목을 답례로 보냈습니다. (실바나 관계도 +14, 식량 +35, 목재 +30)',
                logTone: 'good',
              },
            },
          ],
        },
        step_2_passive: {
          id: 'step_2_passive',
          title: '제2막: 잔당의 침투와 방벽 방어전',
          narrative: '공세를 취하지 않자 굶주린 마수 무리가 목책 앞까지 들이닥쳤습니다. 초소 병력으로 격퇴해야 합니다.',
          choices: [
            {
              id: 'choice_2_stand_firm',
              label: '목책 결사 항전 및 잔당 격퇴',
              description: '방벽 뒤에서 화살을 쏟아부어 마수 무리를 격퇴합니다.',
              isTerminal: true,
              costs: { iron: 10 },
              impact: {
                resources: { timber: 20 },
                stability: 1,
                logTitle: '국경 방벽 방어 성공',
                logDetail: '초소 병사들이 분전하여 마수의 기습을 막아냈습니다. 목재 🪵20 수습.',
                logTone: 'neutral',
              },
            },
          ],
        },
      },
    }
  }

  if (questId === 'ancient_vein_prospecting') {
    return {
      id: 'ancient_vein_prospecting',
      title: '고대 암반맥 발견과 붕괴 위기 광산',
      category: '탐사·자원',
      location: '회색능선 심층 채석장 제4갱',
      summary: '광부들이 전설 속 고대 드워프 룬 광맥의 입구를 발굴했습니다! 막대한 보물이 묻혀 있으나 지반이 극도로 불안정합니다.',
      currentStepId: 'step_1',
      seed,
      isJackpotOpportunity: true,
      steps: {
        step_1: {
          id: 'step_1',
          title: '제1막: 전설의 황금·마법철 광맥 알현',
          narrative: '동굴 벽면 전체가 순도 높은 황금과 마력 깃든 운석철로 번뜩이고 있습니다. 하지만 갱도 천장이 언제 무너져도 이상하지 않습니다.',
          choices: [
            {
              id: 'choice_blast_jackpot',
              label: '⚠️ [고위험 발파 결단]: 대박을 향한 총력 발파!',
              description: '공병대를 총동원해 암반 지지대를 보강하며 일거에 대규모 발파를 감행합니다. 성공 시 판세를 뒤집는 대박을 거두지만 낙반 위험이 있습니다.',
              costsCapacities: { administration: 1 },
              riskDisclosure: {
                successRate: 60,
                successTitle: '🎉 대박 성공: 전설의 고대 황금맥 완전 개방!',
                successPreview: '국고 +850 🪙, 철재 +350 ⛓, 영구/장기 특성 [고대 광맥의 축복: 6개월간 매월 철재 +25]',
                failureTitle: '💥 낙반 사고 발생: 갱도 매몰 및 인부 부상',
                failurePreview: '장비 매몰로 국고 -150 🪙, 철재 -100 ⛓, 안정도 -3, 특성 [갱도 복구 작업: 2개월간 매월 철 -10 (수습 가능)]',
                isRecoverable: true,
              },
              isTerminal: true,
              impact: {
                resources: { treasury: 850, iron: 350 },
                traitAcquired: {
                  id: 'ancient_vein_blessing',
                  name: '고대 광맥의 축복',
                  icon: '✨',
                  description: '고대 드워프 마법 광맥에서 순도 높은 철재가 쏟아져 나옵니다. (매월 철 +25)',
                  durationMonths: 6,
                  effects: { monthlyIron: 25 },
                },
                stability: 5,
                legitimacy: 4,
                logTitle: '🎉 [희귀 대박] 고대 드워프 황금맥 완전 발굴!',
                logDetail: '발파가 기적적으로 적중하여 천문학적인 양의 고대 보물과 순수 마법철이 쏟아져 나왔습니다! 국고 +850 🪙, 철재 +350 ⛓을 즉시 획득하고 향후 6개월간 매월 철재 +25 보너스를 받습니다.',
                logTone: 'royal',
              },
              failureImpact: {
                resources: { treasury: -150, iron: -100 },
                traitAcquired: {
                  id: 'collapsed_shaft_recovery',
                  name: '갱도 붕괴 수습 중',
                  icon: '⚠️',
                  description: '낙반 잔해를 치우고 지지대를 재건하는 중입니다. (2개월간 매월 철 -10)',
                  durationMonths: 2,
                  effects: { monthlyIron: -10 },
                },
                stability: -3,
                logTitle: '💥 [낙반 사고] 심층 갱도 일부 붕괴',
                logDetail: '발파 충격으로 암반 일부가 붕괴하여 채굴 장비가 매몰되었습니다. 다행히 대규모 인명 피해는 면했으나 국고 -150 🪙, 철재 -100 ⛓, 안정도 -3의 손실을 입었습니다. 2개월간 수습이 진행됩니다.',
                logTone: 'danger',
              },
            },
            {
              id: 'choice_safe_mining',
              label: '🛡 [안전 채굴 지시]: 위험 없이 안전한 표석만 수습',
              description: '무리한 깊은 굴착을 금지하고, 겉면에 노출된 안전한 황금석과 광맥 부스러기만 차분히 채취합니다.',
              isTerminal: true,
              impact: {
                resources: { treasury: 80, iron: 60 },
                stability: 1,
                logTitle: '광산 안전 채굴 완료',
                logDetail: '영주의 신중한 판단으로 위험한 갱도를 건드리지 않고 노출된 안전 광석만을 채취했습니다. 국고 +80 🪙, 철재 +60 ⛓ 수습.',
                logTone: 'good',
              },
            },
          ],
        },
      },
    }
  }

  // wandering_artisan_convoy
  return {
    id: 'wandering_artisan_convoy',
    title: '유랑 명장단 접견 및 기술자 초빙',
    category: '외교·인재',
    location: '에르덴 본성 알현실 및 외곽 장터',
    summary: '왕국 수도와 대륙 자유 도시를 오가던 최고 기술자 길드와 실크로드 거상 연단이 영지를 경유하고 있습니다. 영주와의 공식 알현을 요청했습니다.',
    currentStepId: 'step_1',
    seed,
    isJackpotOpportunity: false,
    steps: {
      step_1: {
        id: 'step_1',
        title: '제1막: 대륙 명장단과의 독대',
        narrative: '드워프 수석 공병장과 아우릭 상무회 파견 총지배인이 정중히 고개를 숙이며 영주의 후원과 협력 조건을 제안합니다.',
        choices: [
          {
            id: 'choice_hire_master',
            label: '드워프 공병 명장을 궁정 수석 고문으로 영입',
            description: '파격적인 계약금을 지불하고 명장과 직속 제자들을 영지에 영구 정착시킵니다. 행정력을 높이고 향후 건설 비용을 대폭 줄입니다.',
            costs: { treasury: 120 },
            isTerminal: true,
            impact: {
              capacities: { administration: 1 },
              traitAcquired: {
                id: 'court_master_artisan',
                name: '궁정 명장의 감리',
                icon: '🔨',
                description: '드워프 수석 공병장의 설계로 모든 산업 및 도시 시설 건설 비용이 15% 영구 절감됩니다.',
                effects: { adminBonus: 1, constructionDiscountRate: 0.15 },
              },
              legitimacy: 3,
              logTitle: '궁정 수석 기술 고문 영입',
              logDetail: '드워프 공병 명장이 영지의 가신으로 서약했습니다! 행정력 +1 영구 증가 및 특성 [궁정 명장의 감리: 건설 비용 15% 영구 할인]을 획득했습니다.',
              logTone: 'royal',
            },
          },
          {
            id: 'choice_trade_pact',
            label: '아우릭 상인단과 특혜 관세 밀약 체결',
            description: '소량의 교섭 자금을 투입하여 아우릭 자유시와의 공식 우호도를 대폭 높이고 장기 무역 특권을 획득합니다.',
            costs: { treasury: 50 },
            costsCapacities: { diplomacy: 1 },
            isTerminal: true,
            impact: {
              relationTargetId: 'auric',
              relationDelta: 16,
              traitAcquired: {
                id: 'auric_preferential_tariff',
                name: '특혜 관세 특권',
                icon: '⛵',
                description: '아우릭 상단과의 독점 관세 협정으로 매월 추가 세입이 유입됩니다. (향후 6개월간 매월 국고 +20)',
                durationMonths: 6,
                effects: { monthlyTreasury: 20 },
              },
              logTitle: '아우릭 상단 특혜 무역 협정 체결',
              logDetail: '아우릭 상무회의 신임을 얻었습니다! 아우릭 관계도 +16 및 특성 [특혜 관세 특권: 6개월간 매월 국고 +20 🪙]을 획득했습니다.',
              logTone: 'good',
            },
          },
          {
            id: 'choice_levy_toll',
            label: '일시적 영지 통행세 및 진상품 수납',
            description: '추가 계약 없이 관례에 따라 통행세와 안전 호위비를 징수하고 수레의 고급 목재를 사들입니다.',
            isTerminal: true,
            impact: {
              resources: { treasury: 180, timber: 80 },
              logTitle: '상단 공식 통행세 징수',
              logDetail: '안전 통행을 보장하는 대가로 거상단으로부터 국고 +180 🪙과 정제 목재 +80 🪵을 수납했습니다.',
              logTone: 'neutral',
            },
          },
        ],
      },
    },
  }
}

export function shouldSpawnFieldQuest(year: number, month: number): boolean {
  // Deterministic monthly check: ~70% of months have an inspection opportunity
  const roll = getDeterministicQuestRoll(year, month, 'spawn_check')
  return roll < 70
}

export function pickNextFieldQuestId(year: number, month: number, completedCount: number): FieldQuestId {
  const ids: FieldQuestId[] = [
    'frontier_beast_patrol',
    'ancient_vein_prospecting',
    'wandering_artisan_convoy',
  ]
  const seed = (year * 12 + month + completedCount) % ids.length
  return ids[seed]
}
