import type { NeighborRealm, RealmState, WorldEvent, WorldEventChoice, WorldEventRisk } from '../types/realm'

export interface WorldEventTemplate {
  id: string
  targetNeighborIds?: string[]
  targetAttitudes?: NeighborRealm['attitude'][]
  title: string
  actionName: string
  riskLevel: WorldEventRisk
  narrative: (neighbor: NeighborRealm, state: RealmState) => string
  choices: [
    (neighbor: NeighborRealm, state: RealmState) => WorldEventChoice,
    (neighbor: NeighborRealm, state: RealmState) => WorldEventChoice,
  ]
}

export const WORLD_EVENT_TEMPLATES: WorldEventTemplate[] = [
  // 1. 종주국 - 세금 (crown_tax)
  {
    id: 'crown_tax',
    targetNeighborIds: ['crown'],
    title: '왕실 비상 상납금 징수령',
    actionName: '왕실 특별 상납금 징수',
    riskLevel: '보통',
    narrative: (neighbor) =>
      `${neighbor.name}의 황실 사절이 변경백령에 도착했습니다. 여왕의 칙서를 받든 사절은 대륙 서부 전선의 전비 확충을 명분으로 비상 상납금 헌납을 정식 요구했습니다.`,
    choices: [
      () => ({
        id: 'crown_tax_pay',
        label: '상납금을 충당하여 여왕에 대한 충성을 증명한다',
        description: '국고의 금화를 왕실 사절에게 헌납해 종주국과의 신뢰를 다지고 왕실의 총애를 얻습니다.',
        expectedEffects: '금화 -45 · 왕실 총애 +4 · 정통성 +2 · 관계 +8',
        effects: { treasury: -45, royalFavor: 4, legitimacy: 2, relation: 8 },
      }),
      () => ({
        id: 'crown_tax_refuse',
        label: '변경의 재정 곤궁을 호소하며 상납 유예를 청한다',
        description: '국경 성벽 보수가 시급함을 들어 상납을 거절하고 영지의 독자적인 자치권을 내세웁니다.',
        expectedEffects: '금화 -15 · 자치도 +3 · 왕실 총애 -4 · 관계 -8 · 정통성 -2',
        effects: { treasury: -15, autonomy: 3, royalFavor: -4, relation: -8, legitimacy: -2 },
      }),
    ],
  },

  // 2. 종주국 - 감찰 (crown_inspect)
  {
    id: 'crown_inspect',
    targetNeighborIds: ['crown'],
    title: '왕실 감찰관의 불시 사열',
    actionName: '왕실 감찰관 불시 감사',
    riskLevel: '높음',
    narrative: (neighbor) =>
      `${neighbor.name} 사정국의 감사관 일행이 에르덴 변경백령의 장부와 무기고를 불시에 시찰하러 관문에 당도했습니다. 영지의 군비 규모와 세입 은닉 여부를 살피려 합니다.`,
    choices: [
      () => ({
        id: 'crown_inspect_welcome',
        label: '장부를 전면 개방하고 정중히 영접한다',
        description: '감찰관들에게 후한 연회를 베풀고 영지의 충직함과 투명성을 입증합니다.',
        expectedEffects: '금화 -30 · 식량 -20 · 왕실 총애 +3 · 관계 +6',
        effects: { treasury: -30, grain: -20, royalFavor: 3, relation: 6 },
      }),
      () => ({
        id: 'crown_inspect_limit',
        label: '군사 기밀과 자치권을 내세워 열람을 제한한다',
        description: '변경백령 고유의 자치 조례를 근거로 군사 요충지 및 병력 명부 접근을 차단합니다.',
        expectedEffects: '자치도 +4 · 안정도 +2 · 왕실 총애 -5 · 관계 -10',
        effects: { autonomy: 4, stability: 2, royalFavor: -5, relation: -10 },
      }),
    ],
  },

  // 3. 종주국 - 충성 (crown_loyalty)
  {
    id: 'crown_loyalty',
    targetNeighborIds: ['crown'],
    title: '황금 왕관 기사단과의 합동 사열',
    actionName: '왕실 기사단 친선 사열 제안',
    riskLevel: '낮음',
    narrative: (neighbor) =>
      `${neighbor.name}의 근위 기사단이 변경 국경을 순회하며 에르덴 수비대와의 합동 군사 훈련 및 충성 맹세를 요청했습니다.`,
    choices: [
      () => ({
        id: 'crown_loyalty_parade',
        label: '최정예 상비군을 출진시켜 위세를 과시한다',
        description: '철기 무구로 무장한 정예병을 보내 종주국의 기대를 충족하고 변경백의 위명을 떨칩니다.',
        expectedEffects: '철 -16 · 정통성 +4 · 왕실 총애 +3 · 관계 +10',
        effects: { iron: -16, legitimacy: 4, royalFavor: 3, relation: 10 },
      }),
      () => ({
        id: 'crown_loyalty_modest',
        label: '농번기 일손 부족을 이유로 최소 의전만 치른다',
        description: '대규모 군사 동원을 피하고 최소한의 의전과 선물로 체면만 유지합니다.',
        expectedEffects: '금화 -15 · 자치도 +2 · 관계 -4',
        effects: { treasury: -15, autonomy: 2, relation: -4 },
      }),
    ],
  },

  // 4. 우호 - 공동교역 (friendly_trade)
  {
    id: 'friendly_trade',
    targetAttitudes: ['우호'],
    title: '연맹 수림의 상호 교역로 확충 제안',
    actionName: '공동 상단 및 특산물 교역 제안',
    riskLevel: '낮음',
    narrative: (neighbor) =>
      `${neighbor.name}의 사절단이 변경의 철기 가공품과 숲의 정령목·약초를 상호 교환하는 공동 무역로를 개설하자고 정식 제안했습니다.`,
    choices: [
      () => ({
        id: 'friendly_trade_accept',
        label: '철기 가공품을 지원하고 공동 교역망을 연다',
        description: '대장간의 철을 상단에 공급하여 상호 신뢰를 높이고 지속적인 교역 번영을 도모합니다.',
        expectedEffects: '철 -18 · 금화 +40 · 관계 +12 · 교역로 활성화',
        effects: { iron: -18, treasury: 40, relation: 12, tradeActive: true },
      }),
      () => ({
        id: 'friendly_trade_decline',
        label: '방위용 철기 비축을 위해 정중히 거절한다',
        description: '귀중한 철은 영지 방위에 우선해야 한다며 통상 제안을 완곡히 사양합니다.',
        expectedEffects: '철 +10 · 안정도 +2 · 관계 -8',
        effects: { iron: 10, stability: 2, relation: -8 },
      }),
    ],
  },

  // 5. 우호 - 지원 (friendly_aid)
  {
    id: 'friendly_aid',
    targetAttitudes: ['우호'],
    title: '국경 지대 피난민 구호 요청',
    actionName: '혹한기 유민 구호 식량 요청',
    riskLevel: '보통',
    narrative: (neighbor) =>
      `${neighbor.name} 관할 구역에 닥친 기상이변으로 곤경에 처한 유민들이 국경 지대로 몰려왔습니다. ${neighbor.ruler}이 비상 식량 지원을 정중히 호소합니다.`,
    choices: [
      () => ({
        id: 'friendly_aid_give',
        label: '구호 양곡을 베풀어 맹약의 신의를 확립한다',
        description: '창고의 양곡과 건축용 목재를 나누어 유민을 돕고 명망과 우의를 확고히 다집니다.',
        expectedEffects: '식량 -45 · 목재 -15 · 정통성 +3 · 안정도 +2 · 관계 +14',
        effects: { grain: -45, timber: -15, legitimacy: 3, stability: 2, relation: 14 },
      }),
      () => ({
        id: 'friendly_aid_hoard',
        label: '영내 백성들의 구휼이 먼저라며 지원을 사양한다',
        description: '국경 경비를 일시 강화하여 영지의 식량 비축량을 지킵니다.',
        expectedEffects: '식량 +15 · 자치도 +2 · 관계 -12',
        effects: { grain: 15, autonomy: 2, relation: -12 },
      }),
    ],
  },

  // 6. 중립 - 거래 (neutral_commerce)
  {
    id: 'neutral_commerce',
    targetAttitudes: ['중립'],
    title: '대상단의 국경 관세 면제 특약 요구',
    actionName: '자유 상단 관문 통행권 특약 요구',
    riskLevel: '보통',
    narrative: (neighbor) =>
      `${neighbor.name}의 유력 상인회가 에르덴 관문의 통행세를 대폭 감면해주면 대규모 물류 창고와 선금을 투자하겠다고 제안했습니다.`,
    choices: [
      () => ({
        id: 'neutral_commerce_grant',
        label: '상인회에 통행 특권을 부여하고 투자금을 유치한다',
        description: '상인회의 자금을 받아 영지 국고를 불리고 시장의 물류 흐름을 활성화합니다.',
        expectedEffects: '금화 +55 · 자치도 -3 · 관계 +10',
        effects: { treasury: 55, autonomy: -3, relation: 10 },
      }),
      () => ({
        id: 'neutral_commerce_refuse',
        label: '영지의 공평한 징세 원칙을 엄격히 고수한다',
        description: '특혜 요구를 단호히 일축하고 영주의 징세 주권과 지역 안정을 지킵니다.',
        expectedEffects: '안정도 +3 · 정통성 +2 · 관계 -8',
        effects: { stability: 3, legitimacy: 2, relation: -8 },
      }),
    ],
  },

  // 7. 중립 - 경쟁 (neutral_currency)
  {
    id: 'neutral_currency',
    targetAttitudes: ['중립'],
    title: '자유시 은화의 시장 잠식에 대한 대응',
    actionName: '외국 은화 대량 유통 및 통화 공세',
    riskLevel: '보통',
    narrative: (neighbor) =>
      `${neighbor.name}의 주조 은화가 변경백령 시장에 대량 유입되어 영주 화폐의 통용력과 주조 권위가 위협받고 있습니다.`,
    choices: [
      () => ({
        id: 'neutral_currency_ban',
        label: '사설 은화를 규제하고 영주 주조 화폐를 수호한다',
        description: '외국 은화 유통을 엄격히 통제하여 영지의 독자적인 화폐 주권과 권위를 바로세웁니다.',
        expectedEffects: '금화 -25 · 정통성 +4 · 자치도 +3 · 관계 -10',
        effects: { treasury: -25, legitimacy: 4, autonomy: 3, relation: -10 },
      }),
      () => ({
        id: 'neutral_currency_allow',
        label: '유통 수수료를 징수하고 시장 개방을 수용한다',
        description: '교역 활성화를 위해 외국 통화의 흐름을 인정하고 거래세를 징수합니다.',
        expectedEffects: '금화 +45 · 정통성 -2 · 자치도 -2 · 관계 +8',
        effects: { treasury: 45, legitimacy: -2, autonomy: -2, relation: 8 },
      }),
    ],
  },

  // 8. 경계 - 경쟁 (wary_border_mine)
  {
    id: 'wary_border_mine',
    targetAttitudes: ['경계'],
    title: '국경 구릉 신규 광맥 소유권 분쟁',
    actionName: '북부 철광 광맥 영유권 분쟁 제기',
    riskLevel: '높음',
    narrative: (neighbor) =>
      `${neighbor.name}의 ${neighbor.ruler}이 국경 경계선 인근에서 발견된 풍부한 철광맥이 자신의 영지 소관이라 주장하며 채굴 장비 압류를 경고했습니다.`,
    choices: [
      () => ({
        id: 'wary_border_mine_secure',
        label: '수비대를 급파해 광맥을 단호히 사수한다',
        description: '철령의 압박에 굴하지 않고 광맥 요충지를 무력 점거해 핵심 철 자원을 지켜냅니다.',
        expectedEffects: '철 +24 · 안정도 -2 · 상대 군세 -1 · 관계 -14',
        effects: { iron: 24, stability: -2, neighborStrength: -1, relation: -14 },
      }),
      () => ({
        id: 'wary_border_mine_share',
        label: '채굴 수익 일부를 나누고 분쟁을 봉합한다',
        description: '광맥 이권을 일부 양보하는 협정을 맺어 불필요한 국경 무력 충돌을 피합니다.',
        expectedEffects: '금화 -30 · 철 +12 · 정통성 -2 · 관계 +8',
        effects: { treasury: -30, iron: 12, legitimacy: -2, relation: 8 },
      }),
    ],
  },

  // 9. 경계 - 군비증강 (wary_fortify)
  {
    id: 'wary_fortify',
    targetAttitudes: ['경계'],
    title: '국경 요새 증축 및 무력 시위',
    actionName: '국경 요새화 및 중장갑 보병 기동',
    riskLevel: '위기',
    narrative: (neighbor) =>
      `${neighbor.name}이 국경 협곡에 신규 보루와 망루를 증축하고 대규모 중장갑 병력을 집결시켜 에르덴 방면으로 기동 훈련을 펼치고 있습니다.`,
    choices: [
      () => ({
        id: 'wary_fortify_counter',
        label: '대항 방벽을 구축하고 군비 태세를 강화한다',
        description: '목재와 군비를 신속히 투입해 국경 초소를 요새화하고 적의 도발 의지를 꺾습니다.',
        expectedEffects: '금화 -35 · 목재 -25 · 상대 군세 -1 · 안정도 +2 · 관계 -12',
        effects: { treasury: -35, timber: -25, neighborStrength: -1, stability: 2, relation: -12 },
      }),
      () => ({
        id: 'wary_fortify_diplomacy',
        label: '사절단을 보내 긴장 완화 회담을 타진한다',
        description: '북부의 군사적 긴장이 전면전으로 번지지 않도록 외교적 유화책을 제시합니다.',
        expectedEffects: '금화 -20 · 식량 -15 · 관계 +9 · 상대 군세 +1',
        effects: { treasury: -20, grain: -15, relation: 9, neighborStrength: 1 },
      }),
    ],
  },

  // 10. 적대 - 국경도발 (hostile_raid)
  {
    id: 'hostile_raid',
    targetAttitudes: ['적대'],
    title: '국경 하곡 농가 기습 및 약탈 위협',
    actionName: '기마 약탈대 국경 촌락 야습',
    riskLevel: '위기',
    narrative: (neighbor) =>
      `${neighbor.name}의 기마 약탈대가 동부 변경 촌락을 기습해 농가를 불태우고 창고를 털며 공물을 바치지 않으면 영내 깊숙이 쳐들어오겠다고 협박하고 있습니다.`,
    choices: [
      () => ({
        id: 'hostile_raid_purge',
        label: '상비 기동대를 즉각 출격시켜 약탈대를 섬멸한다',
        description: '침입자들을 추격해 무자비하게 격퇴하고 빼앗긴 물자를 되찾아 영민들의 안전을 지킵니다.',
        expectedEffects: '철 -12 · 상대 군세 -2 · 안정도 +4 · 정통성 +3 · 관계 -15',
        effects: { iron: -12, neighborStrength: -2, stability: 4, legitimacy: 3, relation: -15 },
      }),
      () => ({
        id: 'hostile_raid_bribe',
        label: '양곡을 던져주며 충돌을 유예하고 시간을 번다',
        description: '군사적 피해를 아끼기 위해 곡물을 내어주고 약탈대를 국경 밖으로 유인합니다.',
        expectedEffects: '식량 -40 · 상대 군세 +1 · 정통성 -3 · 관계 +6',
        effects: { grain: -40, neighborStrength: 1, legitimacy: -3, relation: 6 },
      }),
    ],
  },

  // 11. 적대 - 군비증강/내분 (hostile_feud)
  {
    id: 'hostile_feud',
    targetAttitudes: ['적대'],
    title: '적대 군벌 내분과 밀사의 망명 제안',
    actionName: '군벌 내부 갈등 및 지원 요청',
    riskLevel: '보통',
    narrative: (neighbor) =>
      `${neighbor.name} 내부에서 부족 간 권력 투쟁이 격화되었습니다. 축출 위기에 몰린 한 족장이 비밀리에 사자를 보내 무기와 자금을 지원해달라고 청했습니다.`,
    choices: [
      () => ({
        id: 'hostile_feud_support',
        label: '반대 분파에 철기와 자금을 대어 내분을 조장한다',
        description: '적의 내분을 적극적으로 부추겨 에르덴을 향한 외침 역량을 내부에서 붕괴시킵니다.',
        expectedEffects: '금화 -30 · 철 -15 · 상대 군세 -2 · 자치도 +2 · 관계 -10',
        effects: { treasury: -30, iron: -15, neighborStrength: -2, autonomy: 2, relation: -10 },
      }),
      () => ({
        id: 'hostile_feud_ignore',
        label: '술책을 경계하며 국경 방어선만 보강한다',
        description: '함정일 가능성을 경계하며 적의 내정에 개입하지 않고 국경 경계만 엄격히 유지합니다.',
        expectedEffects: '목재 -15 · 안정도 +2 · 관계 0',
        effects: { timber: -15, stability: 2 },
      }),
    ],
  },

  // 12. 공통 - 국경 밀수단 단속 공조 (common_smugglers)
  {
    id: 'common_smugglers',
    title: '국경 삼림 밀수단 합동 단속 제안',
    actionName: '국경 암시장 및 밀수단 단속 공조 제안',
    riskLevel: '낮음',
    narrative: (neighbor) =>
      `두 영지 사이의 경계 삼림 지대에 무장 밀수단과 탈영병들이 진을 치고 있습니다. ${neighbor.name} 측에서 합동 순찰 및 소탕 작전을 제의해 왔습니다.`,
    choices: [
      () => ({
        id: 'common_smugglers_patrol',
        label: '수비대를 보내 합동 토벌 작전을 완수한다',
        description: '국경 치안을 바로잡고 인접 세력과의 신뢰를 두텁게 만듭니다.',
        expectedEffects: '식량 -15 · 안정도 +3 · 정통성 +2 · 관계 +10',
        effects: { grain: -15, stability: 3, legitimacy: 2, relation: 10 },
      }),
      () => ({
        id: 'common_smugglers_market',
        label: '단속 비용을 아끼고 암시장 이득을 눈감아준다',
        description: '공조를 회피하고 암시장을 통해 유입되는 물자와 금화를 묵인합니다.',
        expectedEffects: '금화 +30 · 안정도 -2 · 정통성 -2 · 관계 -6',
        effects: { treasury: 30, stability: -2, legitimacy: -2, relation: -6 },
      }),
    ],
  },
]

/**
 * Pure deterministic hash function using bitwise mixing.
 * Guarantees that the same state parameters always produce the exact same outcome.
 * Uses 32-bit unsigned shift (>>> 0) to ensure a non-negative integer >= 0.
 */
export function getDeterministicSeed(year: number, month: number, key: string, modifier: number = 0): number {
  let hash = (year * 397) ^ (month * 1009) ^ modifier
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0
  }
  return hash >>> 0
}


/**
 * Selects an unannexed neighbor and deterministically generates an event tailored to its relation/attitude.
 * Returns null if no unannexed neighbors remain.
 */
export function generateWorldEvent(state: RealmState): { event: WorldEvent; neighborId: string; actionName: string } | null {
  const candidates = state.neighbors.filter((neighbor) => !neighbor.annexed)
  if (candidates.length === 0) return null

  // Deterministically select neighbor candidate
  const neighborIndex = getDeterministicSeed(state.year, state.month, 'neighbor_candidate', state.population) % candidates.length
  const neighbor = candidates[neighborIndex]

  // Filter templates matching this neighbor
  const matching = WORLD_EVENT_TEMPLATES.filter((template) => {
    if (template.targetNeighborIds && template.targetNeighborIds.includes(neighbor.id)) return true
    if (template.targetAttitudes && template.targetAttitudes.includes(neighbor.attitude)) return true
    if (!template.targetNeighborIds && !template.targetAttitudes) return true
    return false
  })

  const templatePool = matching.length > 0 ? matching : WORLD_EVENT_TEMPLATES
  const playerCombatPower = state.soldiers * 2 + state.levies

  // Deterministically select template from the pool
  const templateIndex =
    getDeterministicSeed(state.year, state.month, `${neighbor.id}_${neighbor.attitude}`, playerCombatPower + neighbor.relation) %
    templatePool.length
  const template = templatePool[templateIndex]

  const choiceA = template.choices[0](neighbor, state)
  const choiceB = template.choices[1](neighbor, state)

  const event: WorldEvent = {
    id: `wev_${state.year}_${state.month}_${neighbor.id}_${template.id}`,
    neighborId: neighbor.id,
    senderName: neighbor.name,
    senderTitle: neighbor.title,
    senderIcon: neighbor.icon,
    title: template.title,
    description: template.narrative(neighbor, state),
    riskLevel: template.riskLevel,
    choices: [choiceA, choiceB],
  }

  return {
    event,
    neighborId: neighbor.id,
    actionName: template.actionName,
  }
}
