import type { Doctrine, IndustryId, PolicyId, RealmState } from '../types/realm'

export interface IndustryDefinition {
  id: IndustryId
  name: string
  icon: string
  description: string
  terrain: string
  baseCost: number
  timberCost: number
  output: string
}

export interface PolicyDefinition {
  id: PolicyId
  branch: Exclude<Doctrine, 'unset'>
  name: string
  icon: string
  description: string
  effect: string
  cost: number
  capacity: 'administration' | 'diplomacy' | 'command'
  requires?: PolicyId
}

export const INDUSTRIES: IndustryDefinition[] = [
  {
    id: 'farms',
    name: '비옥한 하곡 농장',
    icon: '🌾',
    description: '강변의 충적토를 개간해 인구와 군대를 먹여 살립니다.',
    terrain: '강변 평야 특화',
    baseCost: 70,
    timberCost: 12,
    output: '월 식량 +18 · 세입 +6',
  },
  {
    id: 'ironworks',
    name: '회색능선 제철소',
    icon: '⚒️',
    description: '북부 구릉의 철광을 무기와 농기구로 가공합니다.',
    terrain: '구릉 광맥 특화',
    baseCost: 95,
    timberCost: 18,
    output: '월 철 +7 · 세입 +5',
  },
  {
    id: 'market',
    name: '세 갈래길 시장',
    icon: '⚖️',
    description: '왕도와 변경을 잇는 상인들에게 창고와 거래권을 제공합니다.',
    terrain: '교역로 특화',
    baseCost: 85,
    timberCost: 16,
    output: '월 세입 +18 · 교역 효율',
  },
  {
    id: 'lumberyard',
    name: '검은솔 벌목장',
    icon: '🪵',
    description: '서부 삼림을 계획적으로 벌채해 건축재를 공급합니다.',
    terrain: '침엽수림 특화',
    baseCost: 65,
    timberCost: 8,
    output: '월 목재 +10 · 세입 +4',
  },
]

export const POLICIES: PolicyDefinition[] = [
  {
    id: 'land_register',
    branch: 'stewardship',
    name: '토지대장 정비',
    icon: '📜',
    description: '장원과 자유민의 토지를 측량해 누락된 세원을 찾습니다.',
    effect: '산업 세입 +15% · 안정도 +3',
    cost: 80,
    capacity: 'administration',
  },
  {
    id: 'royal_bureau',
    branch: 'stewardship',
    name: '영주 직속 관료원',
    icon: '🏛️',
    description: '가신의 사병과 장부를 영주 직속 관리가 감독합니다.',
    effect: '월 행정력 +1 · 자치도 +3',
    cost: 125,
    capacity: 'administration',
    requires: 'land_register',
  },
  {
    id: 'merchant_charter',
    branch: 'commerce',
    name: '상인 조합 특허장',
    icon: '🪙',
    description: '상단에 제한된 자치와 분쟁 조정권을 부여합니다.',
    effect: '교역 수입 +50% · 외교력 +1',
    cost: 80,
    capacity: 'diplomacy',
  },
  {
    id: 'free_port',
    branch: 'commerce',
    name: '에르덴 자유시장',
    icon: '⛵',
    description: '관세를 낮춰 대륙 각지의 상단과 모험가를 끌어들입니다.',
    effect: '활성 교역로당 금화 +12 · 인구 성장',
    cost: 125,
    capacity: 'diplomacy',
    requires: 'merchant_charter',
  },
  {
    id: 'border_muster',
    branch: 'military',
    name: '변경 동원령',
    icon: '🛡️',
    description: '각 촌락의 동원 명부를 정리하고 봉화를 수리합니다.',
    effect: '징집병 +180 · 지휘력 +1',
    cost: 80,
    capacity: 'command',
  },
  {
    id: 'standing_guard',
    branch: 'military',
    name: '상비 변경수비대',
    icon: '⚔️',
    description: '계절에 흔들리지 않는 봉급제 정예병을 창설합니다.',
    effect: '상비군 전투력 +25% · 유지비 +8',
    cost: 125,
    capacity: 'command',
    requires: 'border_muster',
  },
]

export const INITIAL_REALM_STATE: RealmState = {
  year: 731,
  month: 3,
  name: '에르덴 변경백령',
  ruler: '변경백 아르덴',
  rank: '루미나스 왕령의 봉신',
  doctrine: 'unset',
  resources: { treasury: 320, grain: 230, iron: 62, timber: 95 },
  capacities: { administration: 3, diplomacy: 3, command: 3 },
  industries: {
    farms: { id: 'farms', level: 1 },
    ironworks: { id: 'ironworks', level: 1 },
    market: { id: 'market', level: 1 },
    lumberyard: { id: 'lumberyard', level: 1 },
  },
  policies: [],
  population: 12400,
  manpower: 940,
  soldiers: 180,
  levies: 420,
  stability: 63,
  legitimacy: 58,
  autonomy: 24,
  royalFavor: 51,
  neighbors: [
    { id: 'crown', name: '루미나스 왕령', title: '황금 왕관의 종주국', ruler: '여왕 아우렐리아 3세', icon: '👑', relation: 36, strength: 84, attitude: '종주국', specialty: '사치품 · 왕실 관료', tradeActive: false, claim: false, annexed: false },
    { id: 'sylvana', name: '실바나 숲의회', title: '고대 수림의 연맹', ruler: '수호자 이실렌', icon: '🌲', relation: 18, strength: 39, attitude: '우호', specialty: '약초 · 정령목', tradeActive: false, claim: false, annexed: false },
    { id: 'ironridge', name: '철령 남작령', title: '북부 관문의 경쟁자', ruler: '남작 볼프람', icon: '⛰️', relation: -14, strength: 48, attitude: '경계', specialty: '철광 · 중장갑', tradeActive: false, claim: false, annexed: false },
    { id: 'auric', name: '아우릭 자유시', title: '상단이 다스리는 도시', ruler: '칠인 상무회', icon: '⚓', relation: 4, strength: 32, attitude: '중립', specialty: '해상무역 · 금융', tradeActive: false, claim: false, annexed: false },
    { id: 'goblin', name: '붉은이빨 부족령', title: '동부 황야의 군벌', ruler: '대족장 우르가쉬', icon: '🔥', relation: -38, strength: 35, attitude: '적대', specialty: '약탈품 · 전투짐승', tradeActive: false, claim: false, annexed: false },
  ],
  logs: [
    {
      id: 'realm-start',
      date: '731년 3월',
      title: '왕실의 봉인이 도착하다',
      detail: '여왕은 2년 안에 국경을 안정시키라는 명을 내렸습니다. 충성으로 보답할지, 독자적인 세력을 일굴지는 당신의 선택입니다.',
      tone: 'royal',
    },
  ],
}
