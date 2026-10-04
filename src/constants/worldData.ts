import type { Nation, Province } from '../types/worldMap'

export const MAP_WIDTH = 2400
export const MAP_HEIGHT = 1500
export const CONTINENT_NAME = '에테리아 대륙 (Aetheria)'

export interface Landmass {
  id: string
  name: string
  points: [number, number][]
  provinceCount: number
}

export interface BorderSegment {
  from: [number, number]
  to: [number, number]
  landmassId: string
}

function roughenCoast(points: [number, number][], intensity: number): [number, number][] {
  const result: [number, number][] = []
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length]
    result.push(point)
    const dx = next[0] - point[0]
    const dy = next[1] - point[1]
    const length = Math.hypot(dx, dy) || 1
    const wave = Math.sin((point[0] * 12.9898 + point[1] * 78.233 + index * 31.7))
    result.push([
      (point[0] + next[0]) / 2 + (-dy / length) * wave * intensity,
      (point[1] + next[1]) / 2 + (dx / length) * wave * intensity,
    ])
  })
  return result
}

// Hand-authored coastlines keep the silhouette intentional. Province boundaries are
// generated independently, so the map stays dense without losing its fantasy geography.
export const LANDMASSES: Landmass[] = [
  {
    id: 'aetheria', name: '에테리아 본대륙', provinceCount: 255,
    points: roughenCoast([
      [310,260],[390,205],[490,175],[565,205],[650,150],[750,168],[835,125],[935,145],
      [1015,115],[1110,150],[1195,125],[1290,165],[1390,148],[1475,205],[1570,190],
      [1650,245],[1755,225],[1830,280],[1935,275],[2035,335],[2105,410],[2070,478],
      [2155,540],[2120,615],[2180,690],[2125,748],[2170,835],[2105,885],[2118,970],
      [2040,1015],[1990,1110],[1905,1135],[1840,1208],[1740,1190],[1665,1265],
      [1575,1230],[1495,1308],[1405,1270],[1320,1325],[1230,1280],[1150,1320],
      [1060,1268],[980,1292],[910,1238],[825,1260],[755,1205],[670,1225],[620,1150],
      [535,1162],[495,1080],[410,1050],[430,970],[355,915],[390,840],[320,775],[365,708],
      [295,650],[340,585],[275,520],[330,465],[265,395],[325,345],
    ], 17),
  },
  { id: 'vael_isle', name: '베일 왕도섬', provinceCount: 20, points: [[85,335],[145,285],[235,275],[292,320],[275,395],[218,438],[135,425],[72,382]] },
  { id: 'northern_crown', name: '북부 왕관령', provinceCount: 19, points: [[1255,52],[1335,25],[1428,48],[1490,96],[1455,145],[1360,135],[1280,112]] },
  { id: 'sunfall', name: '해넘이 대도', provinceCount: 13, points: [[205,1085],[280,1040],[365,1075],[390,1145],[350,1215],[275,1260],[205,1210],[175,1140]] },
  { id: 'ember_isles', name: '잿불 군도', provinceCount: 8, points: [[720,1330],[775,1308],[830,1340],[812,1395],[752,1415],[700,1378]] },
  { id: 'siren_isles', name: '세이렌 군도', provinceCount: 7, points: [[1880,1265],[1935,1238],[1992,1275],[1975,1335],[1910,1350],[1862,1315]] },
  { id: 'eastern_shard', name: '동방 파편도', provinceCount: 6, points: [[2215,520],[2265,485],[2320,520],[2308,585],[2250,615],[2205,570]] },
]

export const NATIONS: Record<string, Nation> = {
  vael_crown: {
    id:'vael_crown', name:'베일 왕관령', type:'kingdom', typeLabel:'해양 왕국', baseColor:'#a78bfa', borderHighlightColor:'#6d28d9', emblem:'♛', capital:'하이베일', ruler:'여왕 아델린 2세', totalTroops:'18.6K', relationLabel:'통상 우호', militaryPower:'B+ (왕립 함대)', economyPower:'A (대양 무역)', description:'서쪽 안개 해협의 섬과 항로를 지배하는 오래된 해양 왕국입니다.',
  },
  frostmark: {
    id:'frostmark', name:'프로스트마르크', type:'kingdom', typeLabel:'북부 대공국', baseColor:'#93c5fd', borderHighlightColor:'#2563eb', emblem:'❄', capital:'윈터홀름', ruler:'대공 발데르', totalTroops:'26.1K', relationLabel:'신중한 중립', militaryPower:'A (설원 중기병)', economyPower:'B (은광과 모피)', description:'빙설 산맥과 북쪽 피오르드를 장악한 강인한 북방인들의 나라입니다.',
  },
  thorn_empire: {
    id:'thorn_empire', name:'가시철 제국', type:'empire', typeLabel:'군사 제국', baseColor:'#f87171', borderHighlightColor:'#b91c1c', emblem:'⚔', capital:'카르 드라벤', ruler:'황제 모르칸 7세', totalTroops:'42.8K', relationLabel:'국경 긴장', militaryPower:'S (철갑 군단)', economyPower:'A- (철과 병기)', description:'서북 평원에서 팽창 중인 대륙 최대의 군사 국가입니다.',
  },
  auric_league: {
    id:'auric_league', name:'황금해 자유도시연맹', type:'republic', typeLabel:'상업 공화 연맹', baseColor:'#fbbf24', borderHighlightColor:'#b45309', emblem:'⚖', capital:'아우렐리아', ruler:'칠인 상무평의회', totalTroops:'20.4K', relationLabel:'통상 조약', militaryPower:'B (용병과 함대)', economyPower:'S (금융과 해운)', description:'서남 황금해를 둘러싼 부유한 항구도시들의 느슨한 연맹입니다.',
  },
  luminas: {
    id:'luminas', name:'루미나스 왕국', type:'kingdom', typeLabel:'기사 왕국', baseColor:'#67e8f9', borderHighlightColor:'#0891b2', emblem:'♜', capital:'에셀가르드', ruler:'국왕 에드워드 4세', totalTroops:'31.5K', relationLabel:'종주국 · 우호', militaryPower:'A (왕실 기사단)', economyPower:'A- (곡창과 직물)', description:'대륙 중앙의 비옥한 강 유역을 다스리는 플레이어의 종주 왕국입니다.',
  },
  sylvana: {
    id:'sylvana', name:'실바나 대삼림 연방', type:'federation', typeLabel:'숲 자치 연방', baseColor:'#4ade80', borderHighlightColor:'#15803d', emblem:'♧', capital:'텔드라실', ruler:'대장로 엘로라', totalTroops:'24.2K', relationLabel:'우호 및 친선', militaryPower:'A- (정령술사)', economyPower:'B+ (희귀 목재)', description:'동부 원시림의 엘프와 수인 부족이 세운 평화로운 연방입니다.',
  },
  obsidian_pact: {
    id:'obsidian_pact', name:'흑요석 맹약', type:'empire', typeLabel:'화산 부족 동맹', baseColor:'#fb7185', borderHighlightColor:'#be123c', emblem:'◆', capital:'오브시디아', ruler:'잿불왕 자르카', totalTroops:'28.9K', relationLabel:'불안한 휴전', militaryPower:'A (용암 주술병)', economyPower:'B (흑요석)', description:'남서 화산지대의 성채와 용광로를 연결한 전사 부족들의 맹약입니다.',
  },
  solaris: {
    id:'solaris', name:'솔라리스 성광국', type:'holy_empire', typeLabel:'신정 황국', baseColor:'#f9a8d4', borderHighlightColor:'#db2777', emblem:'☀', capital:'솔라리아', ruler:'교황 루시엔 3세', totalTroops:'33.3K', relationLabel:'배타적 중립', militaryPower:'A+ (성기사단)', economyPower:'A (순례와 보석)', description:'남동 고원의 태양 신전을 중심으로 성장한 신정 국가입니다.',
  },
  moon_clans: {
    id:'moon_clans', name:'월백 초원부족연맹', type:'federation', typeLabel:'유목 부족연맹', baseColor:'#c4b5fd', borderHighlightColor:'#7c3aed', emblem:'☾', capital:'은빛 천막도시', ruler:'대칸 사란', totalTroops:'22.7K', relationLabel:'중립', militaryPower:'A- (기마 궁수)', economyPower:'B- (말과 모피)', description:'동북 초원과 소금호수를 오가는 기마 부족들의 연맹입니다.',
  },
  jade_dynasty: {
    id:'jade_dynasty', name:'비취 용조', type:'empire', typeLabel:'동방 제국', baseColor:'#5eead4', borderHighlightColor:'#0f766e', emblem:'龍', capital:'청람성', ruler:'천자 렌 카이', totalTroops:'36.0K', relationLabel:'사절 교환', militaryPower:'A+ (용기병)', economyPower:'A+ (비단과 도자기)', description:'동쪽 산맥 너머 강과 계단식 농지를 다스리는 오래된 왕조입니다.',
  },
  wild_marches: {
    id:'wild_marches', name:'무주 야생변경', type:'wilderness', typeLabel:'군벌 · 괴수령', baseColor:'#a3a3a3', borderHighlightColor:'#525252', emblem:'☠', capital:'부서진 왕좌', ruler:'다수의 군벌과 괴수', totalTroops:'15.8K', relationLabel:'개척 및 정복 대상', militaryPower:'B+ (괴수 군락)', economyPower:'D (미개척 자원)', description:'왕국과 연방 사이에 남은 폐허, 고블린 요새, 괴수의 둥지입니다.',
  },
}

export const NATION_TO_NEIGHBOR_MAP: Record<string, string> = {
  luminas: 'crown',
  sylvana: 'sylvana',
  auric_league: 'auric',
}

interface NationAnchor { nationId:string; x:number; y:number; weight:number }
const NATION_ANCHORS: NationAnchor[] = [
  {nationId:'vael_crown',x:170,y:350,weight:.78},{nationId:'frostmark',x:1050,y:205,weight:1.05},
  {nationId:'thorn_empire',x:470,y:450,weight:1.08},{nationId:'auric_league',x:510,y:1010,weight:1},
  {nationId:'luminas',x:1030,y:690,weight:1},{nationId:'sylvana',x:1590,y:570,weight:1.02},
  {nationId:'obsidian_pact',x:880,y:1130,weight:.94},{nationId:'solaris',x:1580,y:1090,weight:1},
  {nationId:'moon_clans',x:1840,y:350,weight:.98},{nationId:'jade_dynasty',x:2050,y:760,weight:1.03},
  {nationId:'wild_marches',x:1310,y:750,weight:.72},
]

const NAME_START=['아르','벨','칼','에스','로엔','세라','드라','미르','탈','브린','엘','하르','네르','오르','리엔','카이','바르','실','토르','윈']
const NAME_END=['가르드','브룩','델','하임','리아','포드','렌','마르','크로프트','베일','모어','위크','도르','실','론','미어','펠','노르','락','헤이븐']
const SPECIALTIES=['철광석과 대장간','밀과 포도주','전투마와 가죽','희귀 목재와 약초','소금과 훈제어','비단과 염료','은광과 수정','도자기와 차','조선소와 어업','양모와 직물','고대 유적과 마나석','향신료와 과수원']
const DESCRIPTIONS=['강과 오래된 성벽이 지키는 교통의 요지.','완만한 구릉과 비옥한 농지가 펼쳐진 영지.','거친 산맥의 관문을 지키는 변경 요새.','울창한 숲과 안개 계곡이 이어지는 신비한 땅.','상단과 순례자가 모이는 번영한 시장 도시.','오랜 전쟁의 흔적과 폐허가 남은 국경령.']

function mulberry32(seed:number){return()=>{let t=seed+=0x6d2b79f5;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
const random=mulberry32(0xa37e21)

export function isPointInPolygon(point:[number,number],polygon:[number,number][]){
  const [x,y]=point;let inside=false
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const [xi,yi]=polygon[i], [xj,yj]=polygon[j]
    if((yi>y)!==(yj>y)&&x<((xj-xi)*(y-yi))/(yj-yi)+xi)inside=!inside
  }
  return inside
}

function bounds(points:[number,number][]){const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);return{minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)}}
interface Seed{id:string;x:number;y:number;landmassId:string;nationId:string;isPlayer?:boolean}

function makeSeeds(){
  const result:Seed[]=[]
  LANDMASSES.forEach((landmass,landIndex)=>{
    const box=bounds(landmass.points),local:[number,number][]=[]
    const minDistance=landmass.provinceCount>30?48:38
    let attempts=0
    while(local.length<landmass.provinceCount&&attempts<landmass.provinceCount*1000){
      attempts++;const x=box.minX+random()*(box.maxX-box.minX),y=box.minY+random()*(box.maxY-box.minY)
      if(!isPointInPolygon([x,y],landmass.points))continue
      if(local.some(([px,py])=>(px-x)**2+(py-y)**2<minDistance**2))continue
      local.push([x,y])
    }
    local.forEach(([x,y],index)=>{
      let nationId='wild_marches',best=Infinity
      NATION_ANCHORS.forEach(anchor=>{const score=Math.hypot(x-anchor.x,y-anchor.y)/anchor.weight+Math.sin(x*.017+y*.011+landIndex)*45;if(score<best){best=score;nationId=anchor.nationId}})
      if(landmass.id==='vael_isle')nationId='vael_crown'
      if(landmass.id==='northern_crown')nationId=index%4===0?'moon_clans':'frostmark'
      if(landmass.id==='sunfall')nationId=index%3===0?'obsidian_pact':'auric_league'
      if(landmass.id==='ember_isles')nationId='obsidian_pact'
      if(landmass.id==='siren_isles')nationId=index%2?'solaris':'jade_dynasty'
      if(landmass.id==='eastern_shard')nationId='jade_dynasty'
      result.push({id:`${landmass.id}_${index}`,x,y,landmassId:landmass.id,nationId})
    })
  })
  const player=result.filter(s=>s.landmassId==='aetheria').sort((a,b)=>Math.hypot(a.x-1120,a.y-720)-Math.hypot(b.x-1120,b.y-720))[0]
  if(player){player.isPlayer=true;player.nationId='luminas'}
  return result
}
const SEEDS=makeSeeds()

function clipPolygon(poly:[number,number][],p1:[number,number],p2:[number,number]){
  const mx=(p1[0]+p2[0])/2,my=(p1[1]+p2[1])/2,nx=p1[0]-p2[0],ny=p1[1]-p2[1]
  const inside=([x,y]:[number,number])=>nx*(x-mx)+ny*(y-my)>=-.0001
  const intersect=(a:[number,number],b:[number,number]):[number,number]=>{const dx=b[0]-a[0],dy=b[1]-a[1],denom=nx*dx+ny*dy;if(Math.abs(denom)<1e-8)return a;const t=(nx*(mx-a[0])+ny*(my-a[1]))/denom;return[a[0]+t*dx,a[1]+t*dy]}
  const output:[number,number][]=[]
  for(let i=0;i<poly.length;i++){const cur=poly[i],prev=poly[(i+poly.length-1)%poly.length],ci=inside(cur),pi=inside(prev);if(ci){if(!pi)output.push(intersect(prev,cur));output.push(cur)}else if(pi)output.push(intersect(prev,cur))}
  return output
}

function shadeColor(hex:string,amount:number){const value=parseInt(hex.slice(1),16);const channel=(shift:number)=>Math.max(0,Math.min(255,((value>>shift)&255)+amount));return`#${[channel(16),channel(8),channel(0)].map(c=>c.toString(16).padStart(2,'0')).join('')}`}
function provinceName(index:number){return`${NAME_START[(index*7+3)%NAME_START.length]}${NAME_END[(index*11+5)%NAME_END.length]}`}

export const PROVINCES:Province[]=SEEDS.map((seed,index)=>{
  let vertices:[number,number][]=[[seed.x-145,seed.y-145],[seed.x+145,seed.y-145],[seed.x+145,seed.y+145],[seed.x-145,seed.y+145]]
  SEEDS.forEach(other=>{if(other.id===seed.id||other.landmassId!==seed.landmassId)return;if((other.x-seed.x)**2+(other.y-seed.y)**2>330**2)return;vertices=clipPolygon(vertices,[seed.x,seed.y],[other.x,other.y])})
  const nation=NATIONS[seed.nationId],defense=25+((index*17)%70),economy=22+((index*23)%73),troops=`${(1.2+((index*37)%104)/10).toFixed(1)}K`
  return{id:seed.id,name:seed.isPlayer?'MY-WORLD 변경백령':provinceName(index),nationId:seed.nationId,landmassId:seed.landmassId,center:[seed.x,seed.y],vertices,color:seed.isPlayer?'#fde047':shadeColor(nation.baseColor,((index*19)%29)-14),troops:seed.isPlayer?'3.5K':troops,isPlayerFief:seed.isPlayer,rulerName:seed.isPlayer?'플레이어 영주':`${['백작','남작','후작','자유도시 평의회','부족장'][index%5]} ${provinceName(index+9)}`,defense:seed.isPlayer?48:defense,economy:seed.isPlayer?42:economy,specialty:SPECIALTIES[index%SPECIALTIES.length],description:seed.isPlayer?'당신이 개척하고 성장시키는 루미나스 왕국 동부의 변경 영지.':DESCRIPTIONS[index%DESCRIPTIONS.length]}
})

function ownerAt(x:number,y:number,landmassId:string){let nearest:Province|undefined,best=Infinity;PROVINCES.forEach(p=>{if(p.landmassId!==landmassId)return;const d=(p.center[0]-x)**2+(p.center[1]-y)**2;if(d<best){best=d;nearest=p}});return nearest?.nationId}
export const NATIONAL_BORDERS:BorderSegment[]=[]
PROVINCES.forEach(province=>{const polygon=province.vertices;for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1,mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,ox=(-dy/length)*5,oy=(dx/length)*5,left=ownerAt(mx+ox,my+oy,province.landmassId||''),right=ownerAt(mx-ox,my-oy,province.landmassId||'');if(left&&right&&left!==right)NATIONAL_BORDERS.push({from:a,to:b,landmassId:province.landmassId||''})}})

export const NATION_LABEL_POINTS:Record<string,[number,number]>={vael_crown:[175,350],frostmark:[1030,250],thorn_empire:[520,470],auric_league:[520,960],luminas:[1020,690],sylvana:[1600,600],obsidian_pact:[900,1110],solaris:[1550,1080],moon_clans:[1830,370],jade_dynasty:[1990,770],wild_marches:[1310,780]}

export const STRATEGIC_TARGET_COORDINATES: Record<string, [number, number]> = {
  crown: [997, 630],      // 루미나스 왕령 (오르미어)
  sylvana: [1389, 576],   // 실바나 숲의회 (드라리아)
  ironridge: [1056, 562], // 철령 남작령 (토르가르드)
  auric: [744, 854],      // 아우릭 자유시 (브린하임)
  goblin: [1300, 749],    // 붉은이빨 부족령 (칼도르)
}

export function findStrategicTargetProvince(
  targetCoord: [number, number],
  provinces: Province[] = PROVINCES,
): Province | null {
  let bestDist = Infinity
  let nearest: Province | null = null
  for (const province of provinces) {
    if (province.isPlayerFief) continue
    const dx = province.center[0] - targetCoord[0]
    const dy = province.center[1] - targetCoord[1]
    const dist = dx * dx + dy * dy
    if (dist < bestDist) {
      bestDist = dist
      nearest = province
    }
  }
  return nearest
}
