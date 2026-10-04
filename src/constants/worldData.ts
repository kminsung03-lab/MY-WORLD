import type { Nation, Province } from '../types/worldMap'

export const CONTINENT_NAME = '칼라드리아 대륙 (Continent of Caladria)'
export const MAP_WIDTH = 2000
export const MAP_HEIGHT = 1300

// 1. Five Major Powers & Wilderness
export const NATIONS: Record<string, Nation> = {
  kingdom_luminas: {
    id: 'kingdom_luminas',
    name: '루미나스 왕국',
    type: 'kingdom',
    typeLabel: '봉건 왕국 (플레이어 소속국)',
    baseColor: '#38bdf8', // Light sky blue
    borderHighlightColor: '#0284c7',
    emblem: '👑',
    capital: '성왕도 에텔가르드',
    ruler: '국왕 에드워드 4세',
    totalTroops: '28.5K',
    relationLabel: '종주국 (내 주군)',
    militaryPower: 'A (기사단 & 왕실 근위대)',
    economyPower: 'A (비옥한 중원 평야)',
    description:
      '유구한 역사와 기사도 전통을 자랑하는 대륙 중앙의 왕국. 플레이어가 충성을 맹세하고 동부 변경 개척지를 하사받은 모국입니다.',
  },
  valdor_empire: {
    id: 'valdor_empire',
    name: '발도르 철혈 제국',
    type: 'empire',
    typeLabel: '군사 제국',
    baseColor: '#f87171', // Red / Crimson
    borderHighlightColor: '#dc2626',
    emblem: '🦅',
    capital: '바란하임 흑철 요새',
    ruler: '철혈 황제 블라디미르 1세',
    totalTroops: '38.2K',
    relationLabel: '군사적 긴장 (적대 위험)',
    militaryPower: 'S (대규모 흑철기병단)',
    economyPower: 'B+ (제철소 & 총력 징집)',
    description:
      '북서부 험준한 산악과 평원을 지배하는 호전적인 군사 제국. 루미나스 왕국의 국경을 끊임없이 위협하며 기회를 엿보고 있습니다.',
  },
  free_republic: {
    id: 'free_republic',
    name: '자유 항만 공화국 연합',
    type: 'republic',
    typeLabel: '상인 공화국',
    baseColor: '#fbbf24', // Golden yellow
    borderHighlightColor: '#d97706',
    emblem: '⚖️',
    capital: '베네치아 자유항',
    ruler: '대의원 의장 카스파 론',
    totalTroops: '21.0K',
    relationLabel: '중립 (통상 조약)',
    militaryPower: 'B (사설 용병단 & 해군)',
    economyPower: 'S+ (대륙 최고 무역 자본)',
    description:
      '남부 해안선을 따라 형성된 7개 항구 도시들의 자치 연합. 거대한 무역 상단과 황금으로 막강한 영향력을 행사합니다.',
  },
  sylvana_federation: {
    id: 'sylvana_federation',
    name: '실바나 대삼림 연방',
    type: 'federation',
    typeLabel: '자치 연방',
    baseColor: '#4ade80', // Lush Green
    borderHighlightColor: '#16a34a',
    emblem: '🌿',
    capital: '세계수 텔드라실',
    ruler: '대장로 엘로라 에델',
    totalTroops: '24.2K',
    relationLabel: '우호 및 친선',
    militaryPower: 'A- (정령 마법사 & 삼림 순찰대)',
    economyPower: 'B (희귀 원목, 비단, 약초)',
    description:
      '동부의 신비로운 원시림에 정착한 엘프와 수인 종족의 평화 연방. 플레이어의 개척 영지와 동쪽 숲 국경을 평화롭게 접하고 있습니다.',
  },
  solaris_holy_empire: {
    id: 'solaris_holy_empire',
    name: '솔라리스 신성 황국',
    type: 'holy_empire',
    typeLabel: '신정 황국',
    baseColor: '#c084fc', // Purple / Violet
    borderHighlightColor: '#9333ea',
    emblem: '☀️',
    capital: '성도 솔라리아',
    ruler: '교황 루시우스 3세',
    totalTroops: '29.8K',
    relationLabel: '배타적 중립',
    militaryPower: 'A+ (광휘의 성기사단)',
    economyPower: 'A (신도 헌금 및 성유물)',
    description:
      '대륙 남동부를 성역화하여 다스리는 종교 황국. 태양의 교리를 따르며 타국의 분쟁에는 관여하지 않으나 막강한 성기사단을 보유하고 있습니다.',
  },
  wilderness: {
    id: 'wilderness',
    name: '미개척 야생지 (몬스터 군락)',
    type: 'wilderness',
    typeLabel: '무주지 / 개척 목표',
    baseColor: '#a1a1aa', // Slate grey / olive
    borderHighlightColor: '#71717a',
    emblem: '💀',
    capital: '야생 오크 요새',
    ruler: '괴수 군단 & 고블린 부족',
    totalTroops: '12.4K',
    relationLabel: '토벌 및 정복 대상',
    militaryPower: 'B+ (야생 몬스터 무리)',
    economyPower: 'D (원시 미개간 자원)',
    description:
      '왕국 동부와 실바나 삼림 사이에 끼어 있는 위험한 몬스터 서식지. 플레이어가 사냥터를 통해 정복하고 흡수해야 할 개척지입니다.',
  },
}

// 2. Province Seeds (Centers of ~75 Territorial Provinces)
interface ProvinceSeed {
  id: string
  name: string
  nationId: string
  x: number
  y: number
  troops: string
  rulerName: string
  isPlayer?: boolean
  defense: number
  economy: number
  specialty: string
  desc: string
}

const PROVINCE_SEEDS: ProvinceSeed[] = [
  // --- 👑 Kingdom of Luminas (Central) ---
  {
    id: 'my_world',
    name: 'MY-WORLD',
    nationId: 'kingdom_luminas',
    x: 1040,
    y: 620,
    troops: '3.5K',
    rulerName: '플레이어 영주',
    isPlayer: true,
    defense: 45,
    economy: 40,
    specialty: '철광 채굴, 영토 개척, 전방 방벽',
    desc: '플레이어가 다스리는 루미나스 왕국 동부 국경의 개척 영지. 몬스터를 몰아내고 부지를 확장하는 핵심 요충지입니다.',
  },
  {
    id: 'lum_capital',
    name: '에텔가르드',
    nationId: 'kingdom_luminas',
    x: 880,
    y: 560,
    troops: '12.0K',
    rulerName: '국왕 에드워드 4세',
    defense: 95,
    economy: 90,
    specialty: '왕도, 중앙 행정, 기사단 본부',
    desc: '루미나스 왕국의 거대한 백색 성벽 수도.',
  },
  {
    id: 'lum_heylun',
    name: '하일룬 백작령',
    nationId: 'kingdom_luminas',
    x: 780,
    y: 640,
    troops: '4.8K',
    rulerName: '레오나르도 백작',
    defense: 50,
    economy: 75,
    specialty: '황금 밀, 우수한 군마',
    desc: '플레이어 영지 서쪽에 인접한 풍요로운 곡창지대.',
  },
  {
    id: 'lum_karkas',
    name: '카르카스 자작령',
    nationId: 'kingdom_luminas',
    x: 960,
    y: 480,
    troops: '5.2K',
    rulerName: '발타자르 자작',
    defense: 65,
    economy: 50,
    specialty: '산악 요새, 정예 척후대',
    desc: '플레이어 영지 북쪽 산맥을 수비하는 자작령.',
  },
  {
    id: 'lum_blackforest',
    name: '검은숲 변경백령',
    nationId: 'kingdom_luminas',
    x: 1020,
    y: 760,
    troops: '6.1K',
    rulerName: '로이드 변경백',
    defense: 80,
    economy: 35,
    specialty: '몬스터 수렵 전문가, 흑철 목책',
    desc: '플레이어 영지 남쪽에 인접한 베테랑 방어선.',
  },
  {
    id: 'lum_rivendell',
    name: '리벤펠트',
    nationId: 'kingdom_luminas',
    x: 820,
    y: 450,
    troops: '4.1K',
    rulerName: '아델라인 남작',
    defense: 45,
    economy: 55,
    specialty: '포도주, 직물 무역',
    desc: '왕국 북부의 온화한 구릉 지대.',
  },
  {
    id: 'lum_marina',
    name: '마리나베이',
    nationId: 'kingdom_luminas',
    x: 700,
    y: 530,
    troops: '3.9K',
    rulerName: '길버트 남작',
    defense: 40,
    economy: 60,
    specialty: '내해 어업, 소금',
    desc: '왕국 내해와 접한 어업 거점.',
  },
  {
    id: 'lum_westgate',
    name: '웨스트게이트',
    nationId: 'kingdom_luminas',
    x: 680,
    y: 680,
    troops: '5.5K',
    rulerName: '바론 하워드',
    defense: 70,
    economy: 45,
    specialty: '국경 요새, 대포 주조',
    desc: '제국과의 서부 접경 요충지.',
  },
  {
    id: 'lum_silverlake',
    name: '은빛호수령',
    nationId: 'kingdom_luminas',
    x: 880,
    y: 690,
    troops: '4.3K',
    rulerName: '마리안 백작부인',
    defense: 45,
    economy: 65,
    specialty: '담수어, 진주, 은세공',
    desc: '거대한 호수를 둘러싼 수려한 영지.',
  },

  // --- 🦅 Valdor Empire (North-West) ---
  {
    id: 'val_baran',
    name: '바란하임',
    nationId: 'valdor_empire',
    x: 380,
    y: 320,
    troops: '14.5K',
    rulerName: '황제 블라디미르 1세',
    defense: 98,
    economy: 85,
    specialty: '제국 수도, 흑철 공성소',
    desc: '발도르 제국의 거대한 수도이자 철옹성.',
  },
  {
    id: 'val_ironhold',
    name: '아이언홀드',
    nationId: 'valdor_empire',
    x: 520,
    y: 260,
    troops: '6.8K',
    rulerName: '장군 드라코',
    defense: 85,
    economy: 60,
    specialty: '흑철 광산, 제련소',
    desc: '제국의 무기를 찍어내는 대규모 공업 도시.',
  },
  {
    id: 'val_northend',
    name: '노스엔드',
    nationId: 'valdor_empire',
    x: 320,
    y: 180,
    troops: '4.2K',
    rulerName: '영주 올라프',
    defense: 60,
    economy: 30,
    specialty: '빙설 훈련소, 모피',
    desc: '북극해와 맞닿은 혹한의 군사 기지.',
  },
  {
    id: 'val_redcliff',
    name: '레드클리프',
    nationId: 'valdor_empire',
    x: 240,
    y: 360,
    troops: '5.1K',
    rulerName: '사령관 보리스',
    defense: 75,
    economy: 40,
    specialty: '해안 절벽 감시루',
    desc: '서쪽 대양을 조망하는 절벽 요새.',
  },
  {
    id: 'val_frontline',
    name: '제1군단 전방기지',
    nationId: 'valdor_empire',
    x: 560,
    y: 420,
    troops: '7.6K',
    rulerName: '선봉장 크루거',
    defense: 80,
    economy: 35,
    specialty: '기병 돌격대, 전초기지',
    desc: '왕국 국경을 직접 노려보는 제국의 칼끝.',
  },
  {
    id: 'val_blackrock',
    name: '블랙록 협곡',
    nationId: 'valdor_empire',
    x: 440,
    y: 460,
    troops: '4.7K',
    rulerName: '남작 슈나이더',
    defense: 70,
    economy: 40,
    specialty: '협곡 매복로, 돌격병',
    desc: '자연 협곡을 활용한 천연 방어선.',
  },
  {
    id: 'val_frostpeak',
    name: '프로스트피크',
    nationId: 'valdor_empire',
    x: 460,
    y: 140,
    troops: '3.9K',
    rulerName: '설산 경비대장',
    defense: 65,
    economy: 25,
    specialty: '산악 늑대병',
    desc: '눈 덮인 고산 지대 거점.',
  },

  // --- ⚖️ Free Ports Republic (South-West) ---
  {
    id: 'rep_venecia',
    name: '베네치아',
    nationId: 'free_republic',
    x: 440,
    y: 920,
    troops: '9.5K',
    rulerName: '의장 카스파 론',
    defense: 65,
    economy: 100,
    specialty: '공화국 수도, 세계 무역항',
    desc: '황금과 향신료가 넘쳐나는 대륙의 시장.',
  },
  {
    id: 'rep_port_royal',
    name: '포트 로열',
    nationId: 'free_republic',
    x: 320,
    y: 840,
    troops: '4.8K',
    rulerName: '제독 모건',
    defense: 55,
    economy: 85,
    specialty: '군함 건조창, 용병단',
    desc: '공화국 해군의 총본산.',
  },
  {
    id: 'rep_amberbay',
    name: '앰버베이',
    nationId: 'free_republic',
    x: 580,
    y: 880,
    troops: '4.3K',
    rulerName: '상인 길드장 페드로',
    defense: 45,
    economy: 80,
    specialty: '보석 가공, 은행',
    desc: '대륙 상인들의 환전과 금융 허브.',
  },
  {
    id: 'rep_cape_south',
    name: '케이프 사우스',
    nationId: 'free_republic',
    x: 260,
    y: 1020,
    troops: '3.6K',
    rulerName: '선장 바르보사',
    defense: 40,
    economy: 70,
    specialty: '남해 무역로, 등대',
    desc: '남쪽 해양 항로의 관문.',
  },
  {
    id: 'rep_golden_fields',
    name: '골든필드',
    nationId: 'free_republic',
    x: 500,
    y: 780,
    troops: '4.0K',
    rulerName: '영주 마르코',
    defense: 50,
    economy: 75,
    specialty: '포도 농장, 올리브유',
    desc: '공화국의 내륙 식량 공급원.',
  },
  {
    id: 'rep_isla_verde',
    name: '이슬라 베르데',
    nationId: 'free_republic',
    x: 400,
    y: 1080,
    troops: '2.8K',
    rulerName: '총독 에밀리오',
    defense: 35,
    economy: 65,
    specialty: '설탕, 열대 과일',
    desc: '남해안의 풍요로운 제도.',
  },

  // --- 🌿 Sylvana Federation (East) ---
  {
    id: 'syl_teldrasil',
    name: '세계수 텔드라실',
    nationId: 'sylvana_federation',
    x: 1480,
    y: 480,
    troops: '10.2K',
    rulerName: '대장로 엘로라 에델',
    defense: 88,
    economy: 75,
    specialty: '연방 수도, 엘프 궁술단, 세계수',
    desc: '하늘을 찌를 듯 솟아오른 영목의 성지.',
  },
  {
    id: 'syl_greenmist',
    name: '그린미스트',
    nationId: 'sylvana_federation',
    x: 1260,
    y: 420,
    troops: '5.1K',
    rulerName: '순찰대장 아리엘',
    defense: 65,
    economy: 50,
    specialty: '원목, 활과 화살, 순찰대',
    desc: '루미나스 왕국과 접하는 연방의 서부 방벽.',
  },
  {
    id: 'syl_whispering',
    name: '속삭임의 숲',
    nationId: 'sylvana_federation',
    x: 1360,
    y: 600,
    troops: '4.7K',
    rulerName: '정령사 셀린',
    defense: 60,
    economy: 60,
    specialty: '약초 비약, 마나 크리스탈',
    desc: '고대 정령들의 속삭임이 깃든 숲.',
  },
  {
    id: 'syl_evergreen',
    name: '에버그린 구릉',
    nationId: 'sylvana_federation',
    x: 1600,
    y: 360,
    troops: '3.8K',
    rulerName: '수인 족장 카록',
    defense: 70,
    economy: 45,
    specialty: '표범 기수대, 사냥감',
    desc: '강인한 수인 전사들의 자치 지구.',
  },
  {
    id: 'syl_moonlake',
    name: '달빛호수',
    nationId: 'sylvana_federation',
    x: 1540,
    y: 660,
    troops: '4.2K',
    rulerName: '달의 사제 이시스',
    defense: 55,
    economy: 55,
    specialty: '성수, 달빛 직물',
    desc: '달빛이 영롱하게 비치는 신비로운 호수.',
  },
  {
    id: 'syl_east_bay',
    name: '이스트베이',
    nationId: 'sylvana_federation',
    x: 1720,
    y: 520,
    troops: '3.4K',
    rulerName: '항해사 피오나',
    defense: 45,
    economy: 60,
    specialty: '동해 어업, 진주',
    desc: '연방의 동쪽 대양 출구.',
  },

  // --- ☀️ Solaris Holy Empire (South-East) ---
  {
    id: 'sol_solaria',
    name: '성도 솔라리아',
    nationId: 'solaris_holy_empire',
    x: 1260,
    y: 960,
    troops: '11.8K',
    rulerName: '교황 루시우스 3세',
    defense: 92,
    economy: 85,
    specialty: '황국 수도, 성기사단 총본부',
    desc: '대리석과 황금 돔으로 장식된 신성 도시.',
  },
  {
    id: 'sol_lumina_gate',
    name: '광휘의 관문',
    nationId: 'solaris_holy_empire',
    x: 1080,
    y: 890,
    troops: '5.8K',
    rulerName: '성기사장 미카엘',
    defense: 85,
    economy: 45,
    specialty: '빛의 성벽, 성스러운 쇠뇌',
    desc: '왕국 남부와 접한 성스러운 방어 요새.',
  },
  {
    id: 'sol_dawn_hills',
    name: '여명의 언덕',
    nationId: 'solaris_holy_empire',
    x: 1420,
    y: 900,
    troops: '4.5K',
    rulerName: '주교 라파엘',
    defense: 60,
    economy: 65,
    specialty: '포도주, 필사본, 도서관',
    desc: '고대 성서와 학문이 보존된 사원 도시.',
  },
  {
    id: 'sol_sun_shrine',
    name: '태양의 신전',
    nationId: 'solaris_holy_empire',
    x: 1360,
    y: 1080,
    troops: '4.9K',
    rulerName: '고위 사제 우리엘',
    defense: 75,
    economy: 50,
    specialty: '성스러운 기름, 축복',
    desc: '순례자들의 발길이 끊이지 않는 영험한 신전.',
  },
  {
    id: 'sol_south_reach',
    name: '사우스리치',
    nationId: 'solaris_holy_empire',
    x: 1140,
    y: 1090,
    troops: '3.7K',
    rulerName: '수도원장 베네딕트',
    defense: 50,
    economy: 60,
    specialty: '수도원 맥주, 농작물',
    desc: '경건한 수도사들이 농경을 일구는 남부 영지.',
  },

  // --- 💀 Wilderness Frontier (Directly bordering player MY-WORLD!) ---
  {
    id: 'wild_goblin_ridge',
    name: '고블린 바위산 (사냥터 1)',
    nationId: 'wilderness',
    x: 1140,
    y: 560,
    troops: '2.5K',
    rulerName: '고블린 족장',
    defense: 30,
    economy: 15,
    specialty: '몬스터 소굴, 조잡한 철기',
    desc: '플레이어 영지 바로 동쪽 바위 능선. 플레이어가 몬스터를 토벌하여 부지를 넓혀야 할 첫 개척지입니다.',
  },
  {
    id: 'wild_orc_crag',
    name: '오크 벌목 바위협곡 (사냥터 2)',
    nationId: 'wilderness',
    x: 1180,
    y: 680,
    troops: '3.8K',
    rulerName: '오크 워로드',
    defense: 40,
    economy: 20,
    specialty: '거대 원목, 야수 모피',
    desc: '플레이어 영지 동남쪽에 자리잡은 흉폭한 오크 부족의 영토.',
  },
  {
    id: 'wild_ruins',
    name: '고대 유적지 (던전)',
    nationId: 'wilderness',
    x: 1120,
    y: 470,
    troops: '3.2K',
    rulerName: '망령 군주',
    defense: 50,
    economy: 10,
    specialty: '고대 유물, 마법 수정',
    desc: '잊혀진 제국의 무너진 신전과 지하 묘소.',
  },
]

// 3. Voronoi Polygon Construction
// Clips a polygon against half-plane defined by bisector between two seeds
function clipPolygonAgainstBisector(
  polygon: [number, number][],
  p1: [number, number],
  p2: [number, number]
): [number, number][] {
  // Midpoint
  const mx = (p1[0] + p2[0]) / 2
  const my = (p1[1] + p2[1]) / 2

  // Normal pointing towards p1
  const nx = p1[0] - p2[0]
  const ny = p1[1] - p2[1]

  const output: [number, number][] = []

  const isInside = (pt: [number, number]) => {
    return nx * (pt[0] - mx) + ny * (pt[1] - my) >= 0
  }

  const getIntersection = (
    s: [number, number],
    e: [number, number]
  ): [number, number] => {
    const dx = e[0] - s[0]
    const dy = e[1] - s[1]
    const denom = nx * dx + ny * dy
    if (Math.abs(denom) < 1e-9) return s
    const numer = nx * (mx - s[0]) + ny * (my - s[1])
    const t = Math.max(0, Math.min(1, numer / denom))
    return [s[0] + t * dx, s[1] + t * dy]
  }

  for (let i = 0; i < polygon.length; i++) {
    const cur = polygon[i]
    const prev = polygon[(i - 1 + polygon.length) % polygon.length]

    const curInside = isInside(cur)
    const prevInside = isInside(prev)

    if (curInside) {
      if (!prevInside) {
        output.push(getIntersection(prev, cur))
      }
      output.push(cur)
    } else if (prevInside) {
      output.push(getIntersection(prev, cur))
    }
  }

  return output
}

// Generate slight color variations for each province of a nation (like HOI4 / Territorial.io style)
function adjustHexColor(hex: string, amount: number): string {
  let c = hex.replace('#', '')
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2]
  const num = parseInt(c, 16)
  let r = (num >> 16) + amount
  let g = ((num >> 8) & 0x00ff) + amount
  let b = (num & 0x0000ff) + amount
  r = Math.min(255, Math.max(0, r))
  g = Math.min(255, Math.max(0, g))
  b = Math.min(255, Math.max(0, b))
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

// Build all provinces
export const PROVINCES: Province[] = PROVINCE_SEEDS.map((seed, idx) => {
  const p1: [number, number] = [seed.x, seed.y]

  // Initial bounding box for the province
  let poly: [number, number][] = [
    [seed.x - 300, seed.y - 300],
    [seed.x + 300, seed.y - 300],
    [seed.x + 300, seed.y + 300],
    [seed.x - 300, seed.y + 300],
  ]

  // Clip against all other seeds to form the Voronoi cell
  for (let j = 0; j < PROVINCE_SEEDS.length; j++) {
    if (idx === j) continue
    const other = PROVINCE_SEEDS[j]
    const p2: [number, number] = [other.x, other.y]
    // Only clip if reasonably close to prevent unnecessary float calculations
    const distSq = (p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2
    if (distSq > 500 * 500) continue

    poly = clipPolygonAgainstBisector(poly, p1, p2)
    if (poly.length < 3) break
  }

  // Clip within global canvas boundaries
  poly = poly.map((pt) => [
    Math.max(60, Math.min(MAP_WIDTH - 60, pt[0])),
    Math.max(60, Math.min(MAP_HEIGHT - 60, pt[1])),
  ])

  const nation = NATIONS[seed.nationId]
  const baseColor = nation ? nation.baseColor : '#64748b'

  // Deterministic subtle shade variation per province (+-15 to RGB)
  const shadeOffset = ((idx * 37) % 31) - 15
  const color = seed.isPlayer
    ? '#fef08a' // Bright golden highlight for player's fief
    : adjustHexColor(baseColor, shadeOffset)

  return {
    id: seed.id,
    name: seed.name,
    nationId: seed.nationId,
    center: [seed.x, seed.y],
    vertices: poly,
    color,
    troops: seed.troops,
    isPlayerFief: seed.isPlayer,
    rulerName: seed.rulerName,
    defense: seed.defense,
    economy: seed.economy,
    specialty: seed.specialty,
    description: seed.desc,
  }
})
