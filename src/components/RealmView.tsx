import { useMemo, useState } from 'react'
import {
  CAMPAIGN_ORDERS,
  DOCTRINE_LABELS,
  GOVERNANCE_MODES,
  INDUSTRIES,
  POLICIES,
  TERRITORY_PROFILES,
  TRADE_CONTRACTS,
  calculateArmyPower,
  calculateNeighborEfficiency,
} from '../constants/realmData'
import type { RealmHandle } from '../hooks/useRealmState'
import type {
  IndustryId,
  NeighborRealm,
  PolicyId,
  TradeContractId,
} from '../types/realm'

type RealmTab = 'overview' | 'industry' | 'policy' | 'diplomacy' | 'dominion'

const doctrineLabels = DOCTRINE_LABELS

const capacityLabels = {
  administration: '행정력',
  diplomacy: '외교력',
  command: '지휘력',
}

const signed = (value: number) => `${value >= 0 ? '+' : ''}${value}`

function getContractPreview(neighbor: NeighborRealm, contractId: TradeContractId, policies: PolicyId[]) {
  const contractDef = TRADE_CONTRACTS.find((c) => c.id === contractId) || TRADE_CONTRACTS[0]
  const override = contractDef.partnerOverrides[neighbor.id]
  const costs = {
    treasury: override?.costs?.treasury ?? contractDef.baseCosts.treasury,
    grain: override?.costs?.grain ?? contractDef.baseCosts.grain,
    iron: override?.costs?.iron ?? contractDef.baseCosts.iron,
    timber: override?.costs?.timber ?? contractDef.baseCosts.timber,
  }
  const baseYields = {
    treasury: override?.yields?.treasury ?? contractDef.baseYields.treasury,
    grain: override?.yields?.grain ?? contractDef.baseYields.grain,
    iron: override?.yields?.iron ?? contractDef.baseYields.iron,
    timber: override?.yields?.timber ?? contractDef.baseYields.timber,
  }
  const efficiency = calculateNeighborEfficiency(neighbor.relation)
  const effRate = efficiency / 100
  let treasuryYield = Math.round(baseYields.treasury * effRate)
  if (policies.includes('merchant_charter') && treasuryYield > 0) {
    treasuryYield = Math.round(treasuryYield * 1.5)
  }
  if (policies.includes('free_port')) {
    treasuryYield += 6
  }
  const grainYield = Math.round(baseYields.grain * effRate) + (policies.includes('free_port') && baseYields.grain > 0 ? 5 : 0)
  const ironYield = Math.round(baseYields.iron * effRate)
  const timberYield = Math.round(baseYields.timber * effRate)

  const parts: string[] = []
  if (costs.treasury > 0) parts.push(`−🪙${costs.treasury}`)
  if (costs.grain > 0) parts.push(`−🌾${costs.grain}`)
  if (costs.iron > 0) parts.push(`−⛓${costs.iron}`)
  if (costs.timber > 0) parts.push(`−🪵${costs.timber}`)
  const costStr = parts.join(' ')

  const yieldParts: string[] = []
  if (treasuryYield > 0) yieldParts.push(`+🪙${treasuryYield}`)
  if (grainYield > 0) yieldParts.push(`+🌾${grainYield}`)
  if (ironYield > 0) yieldParts.push(`+⛓${ironYield}`)
  if (timberYield > 0) yieldParts.push(`+🪵${timberYield}`)
  const yieldStr = yieldParts.join(' ')

  return { costs, yields: { treasury: treasuryYield, grain: grainYield, iron: ironYield, timber: timberYield }, costStr, yieldStr, partnerBonusLabel: override?.partnerBonusLabel }
}

export interface RealmViewProps {
  realm: RealmHandle
  onOpenMap: () => void
  onOpenLocal: () => void
}

export function RealmView({ realm, onOpenMap, onOpenLocal }: RealmViewProps) {
  const [tab, setTab] = useState<RealmTab>('overview')
  const {
    state,
    monthlyProjection,
    upgradeIndustry,
    enactPolicy,
    recruitSoldiers,
    callLevies,
    diplomaticAction,
    changeTradeContract,
    changeGovernanceMode,
    launchCampaign,
    selectCampaignOrder,
    withdrawCampaign,
    advanceMonth,
    resolveWorldEvent,
    resetRealm,
  } = realm

  const armyPower = useMemo(
    () => calculateArmyPower(state.soldiers, state.levies, state.policies.includes('standing_guard')),
    [state.soldiers, state.levies, state.policies],
  )
  const annexedCount = state.neighbors.filter((neighbor) => neighbor.annexed).length

  const canUpgrade = (id: IndustryId) => {
    const definition = INDUSTRIES.find((industry) => industry.id === id)!
    const level = state.industries[id].level
    return level < 5 && state.capacities.administration > 0 && state.resources.treasury >= definition.baseCost + level * 45 && state.resources.timber >= definition.timberCost + level * 6
  }

  const policyStatus = (id: PolicyId) => {
    const policy = POLICIES.find((item) => item.id === id)!
    if (state.policies.includes(id)) return 'done'
    if (state.doctrine !== 'unset' && state.doctrine !== policy.branch) return 'exclusive'
    if (policy.requires && !state.policies.includes(policy.requires)) return 'locked'
    if (state.resources.treasury < policy.cost || state.capacities[policy.capacity] < 1) return 'poor'
    return 'ready'
  }

  const activeOrderDef = state.activeCampaign?.selectedOrder
    ? CAMPAIGN_ORDERS.find((o) => o.id === state.activeCampaign?.selectedOrder)
    : null
  const isOrderUnaffordable =
    !!activeOrderDef &&
    (state.resources.treasury < activeOrderDef.costs.treasury ||
      state.resources.grain < activeOrderDef.costs.grain ||
      state.resources.iron < activeOrderDef.costs.iron ||
      state.resources.timber < activeOrderDef.costs.timber)

  const isTurnLocked =
    !!state.pendingWorldEvent ||
    (!!state.activeCampaign && !state.activeCampaign.selectedOrder) ||
    isOrderUnaffordable
  const turnLockTitle = state.pendingWorldEvent
    ? '세계 정세 대응 결정을 먼저 내려야 합니다'
    : state.activeCampaign && !state.activeCampaign.selectedOrder
    ? '전선 사령부의 작전 명령을 먼저 선택해야 합니다'
    : isOrderUnaffordable
    ? '선택된 작전 수행에 필요한 자원이 부족합니다'
    : '다음 달 결산'
  const turnButtonLabel = state.pendingWorldEvent
    ? '정세 대응 필요'
    : state.activeCampaign && !state.activeCampaign.selectedOrder
    ? '작전 명령 필요'
    : isOrderUnaffordable
    ? '작전 자원 부족'
    : '다음 달 결산'

  const handleWithdrawCampaign = () => {
    const confirmed = window.confirm(
      '원정을 중단하고 전선에서 철수하시겠습니까?\n\n• 안정도 2 감소\n• 영유권 명분(Claim)은 계속 유지됩니다.',
    )
    if (confirmed) {
      withdrawCampaign()
    }
  }

  return (
    <section className="realm-shell">
      <header className="realm-hero">
        <div className="realm-heraldry" aria-hidden="true"><span>✦</span><b>ER</b></div>
        <div className="realm-title-block">
          <span className="realm-kicker">THE MARCH OF ERDEN · GRAND STRATEGY</span>
          <h1>{state.name}</h1>
          <p>{state.ruler} · {state.rank} · <strong>{doctrineLabels[state.doctrine]}</strong></p>
        </div>
        <div className="realm-turn-block">
          <span>왕력 {state.year}년</span>
          <strong>{state.month}월</strong>
          <button
            disabled={isTurnLocked}
            className={isTurnLocked ? 'turn-btn-locked' : ''}
            onClick={advanceMonth}
            title={turnLockTitle}
          >
            {turnButtonLabel} <b>{isTurnLocked ? '!' : '›'}</b>
          </button>
        </div>
      </header>


      <div className="realm-resource-bar">
        <div><span>🪙 국고</span><strong>{state.resources.treasury}</strong><small>{signed(monthlyProjection.treasury)}/월</small></div>
        <div><span>🌾 식량</span><strong>{state.resources.grain}</strong><small>{signed(monthlyProjection.grain)}/월</small></div>
        <div><span>⛓ 철</span><strong>{state.resources.iron}</strong><small>+{monthlyProjection.iron}/월</small></div>
        <div><span>🪵 목재</span><strong>{state.resources.timber}</strong><small>+{monthlyProjection.timber}/월</small></div>
        <div className="realm-capacity"><span>🏛 행정력</span><strong>{state.capacities.administration}</strong><small>명령 가능</small></div>
        <div className="realm-capacity"><span>🤝 외교력</span><strong>{state.capacities.diplomacy}</strong><small>명령 가능</small></div>
        <div className="realm-capacity"><span>⚔ 지휘력</span><strong>{state.capacities.command}</strong><small>명령 가능</small></div>
      </div>

      <nav className="realm-tabs">
        {([
          ['overview', '영지 개요', '⌂'],
          ['industry', '산업과 재정', '⚒'],
          ['policy', '정책 의회', '♜'],
          ['diplomacy', '외교와 군사', '⚔'],
          ['dominion', `통치령 (${annexedCount})`, '🚩'],
        ] as const).map(([id, label, icon]) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}><span>{icon}</span>{label}</button>
        ))}
        <button className="realm-map-link" onClick={onOpenMap}><span>◇</span>대륙 지도</button>
      </nav>

      {tab === 'overview' && (
        <div className="realm-content realm-overview-grid">
          {state.pendingWorldEvent && (
            <article className="realm-panel world-response-panel">
              <div className="world-response-header">
                <div className="world-response-meta">
                  <span className="world-response-kicker">WORLD RESPONSE · 세력 대응 결정</span>
                  <span className={`world-response-risk-badge risk-${state.pendingWorldEvent.riskLevel}`}>
                    위험도: {state.pendingWorldEvent.riskLevel}
                  </span>
                </div>
                <div className="world-response-sender">
                  <span className="sender-icon">{state.pendingWorldEvent.senderIcon}</span>
                  <div>
                    <strong>{state.pendingWorldEvent.senderName}</strong>
                    <small>{state.pendingWorldEvent.senderTitle}</small>
                  </div>
                </div>
              </div>

              <div className="world-response-body">
                <h2>{state.pendingWorldEvent.title}</h2>
                <p className="world-response-narrative">{state.pendingWorldEvent.description}</p>
              </div>

              <div className="world-response-choices">
                {state.pendingWorldEvent.choices.map((choice, idx) => (
                  <div key={choice.id} className="world-response-choice-card">
                    <div className="choice-header">
                      <span className="choice-num">대응책 {idx === 0 ? 'I' : 'II'}</span>
                      <h3>{choice.label}</h3>
                    </div>
                    <p className="choice-desc">{choice.description}</p>
                    <div className="choice-effects">
                      <span className="effects-label">예상 효과:</span>
                      <p className="effects-text">{choice.expectedEffects}</p>
                    </div>
                    <button
                      className="btn-resolve-choice"
                      onClick={() => resolveWorldEvent(choice.id)}
                    >
                      이 방침으로 대응 결정
                    </button>
                  </div>
                ))}
              </div>
            </article>
          )}

          <article className="realm-panel realm-domain-panel">

            <div className="realm-panel-heading"><div><small>DOMAIN</small><h2>변경백령 현황</h2></div><span className="realm-status-seal">왕실 봉신</span></div>
            <div className="realm-stat-grid">
              <div><span>👥 인구</span><strong>{state.population.toLocaleString()}</strong><small>가용 인력 {state.manpower.toLocaleString()}</small></div>
              <div><span>🛡 군세</span><strong>{armyPower}</strong><small>상비 {state.soldiers} · 징집 {state.levies}</small></div>
              <div><span>⚜ 안정도</span><strong>{state.stability}%</strong><div className="realm-meter"><i style={{ width: `${state.stability}%` }} /></div></div>
              <div><span>♛ 정통성</span><strong>{state.legitimacy}%</strong><div className="realm-meter gold"><i style={{ width: `${state.legitimacy}%` }} /></div></div>
              <div><span>🕊 자치도</span><strong>{state.autonomy}%</strong><div className="realm-meter blue"><i style={{ width: `${state.autonomy}%` }} /></div></div>
              <div><span>👑 왕실 총애</span><strong>{state.royalFavor}%</strong><div className="realm-meter purple"><i style={{ width: `${state.royalFavor}%` }} /></div></div>
            </div>
            <div className="realm-directive">
              <span>현재 대전략</span>
              <h3>{state.doctrine === 'unset' ? '의회가 영지의 진로를 기다리고 있습니다' : doctrineLabels[state.doctrine]}</h3>
              <p>{state.doctrine === 'unset' ? '정책 의회에서 첫 정책을 채택하면 다른 두 노선은 잠깁니다. 신중하게 결정하십시오.' : '선택한 노선의 두 번째 정책을 완성해 영지의 고유한 강점을 만드십시오.'}</p>
              <button onClick={() => setTab('policy')}>정책 의회 열기</button>
            </div>
          </article>

          <article className="realm-panel realm-ledger-panel">
            <div className="realm-panel-heading"><div><small>MONTHLY LEDGER</small><h2>다음 달 예상 결산</h2></div></div>
            <dl className="realm-ledger">
              <div><dt>장원·시장 세입</dt><dd>+{monthlyProjection.baseIndustryIncome}</dd></div>
              <div>
                <dt>교역 국고 순변동</dt>
                <dd className={monthlyProjection.tradeEvaluation.totalNet.treasury < 0 ? 'negative' : ''}>
                  {signed(monthlyProjection.tradeEvaluation.totalNet.treasury)}
                </dd>
              </div>
              <div>
                <dt>통치령 국고 순수익</dt>
                <dd className={monthlyProjection.dominionNet.treasury < 0 ? 'negative' : ''}>
                  {signed(monthlyProjection.dominionNet.treasury)}
                  {monthlyProjection.dominionCosts.treasury > 0 && (
                    <small style={{ color: '#8899a6', marginLeft: '4px' }}>
                      (조세 +{monthlyProjection.dominionYields.treasury} / 사업비 −{monthlyProjection.dominionCosts.treasury})
                    </small>
                  )}
                </dd>
              </div>
              <div><dt>군대 유지비</dt><dd className="negative">−{monthlyProjection.militaryUpkeep}</dd></div>
              <div className="total"><dt>국고 순변동</dt><dd>{signed(monthlyProjection.treasury)}</dd></div>
              <div>
                <dt>식량 순변동</dt>
                <dd>
                  {signed(monthlyProjection.grain)}
                  <small style={{ color: '#8899a6', marginLeft: '4px' }}>
                    (교역 {signed(monthlyProjection.tradeEvaluation.totalNet.grain)} · 통치령 {signed(monthlyProjection.dominionNet.grain)})
                  </small>
                </dd>
              </div>
              <div>
                <dt>철 / 목재 순변동</dt>
                <dd>
                  ⛓{signed(monthlyProjection.iron)} · 🪵{signed(monthlyProjection.timber)}
                  <small style={{ color: '#8899a6', marginLeft: '4px' }}>
                    (통치령 ⛓{signed(monthlyProjection.dominionNet.iron)} · 🪵{signed(monthlyProjection.dominionNet.timber)})
                  </small>
                </dd>
              </div>
              <div>
                <dt>교역로 가동 현황</dt>
                <dd>
                  {monthlyProjection.activeTrades}개 활성
                  {monthlyProjection.suspendedTrades > 0 && (
                    <span className="negative" style={{ marginLeft: '4px' }}>
                      (⚠️ {monthlyProjection.suspendedTrades}개 중단)
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt>통치령 관리 현황</dt>
                <dd>
                  {annexedCount}곳 복속
                  {annexedCount > 0 && (
                    <small style={{ color: '#8899a6', marginLeft: '4px' }}>
                      (핵심 {monthlyProjection.coreDominionCount}곳 · 소요 위험 {monthlyProjection.highRiskDominionCount}곳
                      {monthlyProjection.stalledDominionCount > 0 && (
                        <span className="negative" style={{ marginLeft: '4px' }}>
                          · ⚠️ {monthlyProjection.stalledDominionCount}곳 예산 중단
                        </span>
                      )})
                    </small>
                  )}
                </dd>
              </div>
            </dl>
            <div className="realm-quick-actions">
              <button onClick={() => setTab('industry')}>산업 투자</button>
              <button onClick={() => setTab('diplomacy')}>외교 행동</button>
              <button onClick={() => setTab('dominion')}>통치령 행정</button>
              <button onClick={onOpenLocal}>현장 활동</button>
            </div>
          </article>

          <article className="realm-panel realm-news-panel">
            <div className="realm-panel-heading"><div><small>CHRONICLE</small><h2>영지 연대기</h2></div><button className="realm-text-button" onClick={resetRealm}>초기화</button></div>
            <div className="realm-news-list">
              {state.logs.slice(0, 6).map((log) => (
                <div key={log.id} className={`realm-news ${log.tone}`}>
                  <time>{log.date}</time><h3>{log.title}</h3><p>{log.detail}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      )}

      {tab === 'industry' && (
        <div className="realm-content">
          <div className="realm-section-intro"><div><small>ECONOMY</small><h2>지역의 지형을 산업으로 바꾸십시오</h2><p>모든 산업은 보편적으로 성장할 수 있지만, 에르덴의 강변·구릉·교역로·삼림은 각기 다른 특화를 제공합니다.</p></div><span>투자에는 행정력 1이 필요합니다</span></div>
          <div className="industry-grid">
            {INDUSTRIES.map((industry) => {
              const level = state.industries[industry.id].level
              const goldCost = industry.baseCost + level * 45
              const timberCost = industry.timberCost + level * 6
              return (
                <article className="industry-card" key={industry.id}>
                  <div className="industry-art"><span>{industry.icon}</span><small>{industry.terrain}</small></div>
                  <div className="industry-body"><div className="industry-level">산업 등급 {level} / 5</div><h3>{industry.name}</h3><p>{industry.description}</p><b>{industry.output}</b></div>
                  <div className="industry-upgrade"><span>확장 비용: 🪙 {goldCost} · 🪵 {timberCost}</span><button disabled={!canUpgrade(industry.id)} onClick={() => upgradeIndustry(industry.id)}>{level >= 5 ? '최고 등급' : '산업 확장'}</button></div>
                </article>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'policy' && (
        <div className="realm-content">
          <div className="realm-section-intro"><div><small>COUNCIL</small><h2>하나의 길이 영지의 운명을 정합니다</h2><p>첫 정책을 채택하면 해당 대전략 노선에 전념합니다. 다른 노선은 이번 플레이에서 잠깁니다.</p></div><span className={state.doctrine === 'unset' ? 'decision-waiting' : ''}>{doctrineLabels[state.doctrine]}</span></div>
          <div className="policy-branches">
            {(['stewardship', 'commerce', 'military'] as const).map((branch) => {
              const meta = {
                stewardship: ['🏛️', '질서의 길', '정교한 행정과 안정된 세수'],
                commerce: ['⚖️', '번영의 길', '무역망과 도시 자본의 성장'],
                military: ['⚔️', '철혈의 길', '동원 체제와 전문 군대'],
              }[branch]
              return (
                <section className={`policy-branch ${state.doctrine === branch ? 'chosen' : ''} ${state.doctrine !== 'unset' && state.doctrine !== branch ? 'faded' : ''}`} key={branch}>
                  <header><span>{meta[0]}</span><h3>{meta[1]}</h3><p>{meta[2]}</p></header>
                  {POLICIES.filter((policy) => policy.branch === branch).map((policy, index) => {
                    const status = policyStatus(policy.id)
                    return (
                      <div className={`policy-node ${status}`} key={policy.id}>
                        {index > 0 && <i className="policy-connector" />}
                        <div className="policy-icon">{policy.icon}</div><div><small>{capacityLabels[policy.capacity]} 1 · 🪙 {policy.cost}</small><h4>{policy.name}</h4><p>{policy.description}</p><b>{policy.effect}</b></div>
                        <button disabled={status !== 'ready'} onClick={() => enactPolicy(policy.id)}>{status === 'done' ? '시행 중' : status === 'exclusive' ? '노선 잠김' : status === 'locked' ? '선행 정책 필요' : status === 'poor' ? '자원 부족' : '정책 채택'}</button>
                      </div>
                    )
                  })}
                </section>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'diplomacy' && (
        <div className="realm-content">
          {state.activeCampaign && (() => {
            const campaign = state.activeCampaign
            const target = state.neighbors.find((n) => n.id === campaign.targetId)
            const selectedOrderDef = CAMPAIGN_ORDERS.find((o) => o.id === campaign.selectedOrder)
            return (
              <section className="realm-panel active-campaign-dashboard">
                <div className="campaign-dashboard-header">
                  <div className="campaign-header-title">
                    <span className="campaign-kicker">WAR CAMPAIGN · 원정 전선 사령부</span>
                    <h2>{target?.icon} {campaign.targetName} 정벌 전역</h2>
                    <p>작전 단계: <strong>{campaign.phase}</strong> · 작전 <strong>{campaign.campaignTurn}개월차</strong> 진행 중</p>
                  </div>
                  <button className="btn-withdraw-campaign" onClick={handleWithdrawCampaign}>
                    전선 철수
                  </button>
                </div>

                <div className="campaign-stat-gauges">
                  <div className="campaign-gauge-card">
                    <span>진군도</span>
                    <strong>{campaign.progress}%</strong>
                    <div className="realm-meter gold"><i style={{ width: `${campaign.progress}%` }} /></div>
                    <small>{campaign.progress >= 100 ? '거점 함락 완료' : '100% 도달 시 승리'}</small>
                  </div>
                  <div className="campaign-gauge-card">
                    <span>적군 사기</span>
                    <strong>{campaign.enemyMorale}%</strong>
                    <div className="realm-meter red"><i style={{ width: `${campaign.enemyMorale}%` }} /></div>
                    <small>{campaign.enemyMorale <= 0 ? '적군 전의 상실' : '0% 도달 시 항복'}</small>
                  </div>
                  <div className="campaign-gauge-card">
                    <span>원정군 보급선</span>
                    <strong>{campaign.supply}%</strong>
                    <div className="realm-meter blue"><i style={{ width: `${campaign.supply}%` }} /></div>
                    <small>{campaign.supply <= 25 ? '⚠️ 보급선 위기' : '0% 도달 시 강제 패퇴'}</small>
                  </div>
                  <div className="campaign-gauge-card">
                    <span>누적 사상자</span>
                    <strong className="loss-val">상비 {campaign.lostSoldiers} · 징집 {campaign.lostLevies}</strong>
                    <small>에르덴 군세 손실 누적</small>
                  </div>
                </div>

                <div className="campaign-last-report">
                  <span className="report-label">최근 전황 보고</span>
                  <p className="report-text">{campaign.lastReport || '작전 하달 대기 중'}</p>
                </div>

                <div className="campaign-orders-section">
                  <div className="orders-section-header">
                    <div>
                      <small>STRATEGIC ORDERS</small>
                      <h3>다음 달 작전 명령</h3>
                    </div>
                    <div className={`selected-order-chip ${campaign.selectedOrder ? 'confirmed' : 'pending'}`}>
                      {selectedOrderDef ? `하달된 작전: ${selectedOrderDef.icon} ${selectedOrderDef.name}` : '작전 미선택 (명령 필수)'}
                    </div>
                  </div>

                  <div className="campaign-orders-grid">
                    {CAMPAIGN_ORDERS.map((order) => {
                      const isSiegeLocked = !!(order.requiresProgress && campaign.progress < order.requiresProgress)
                      const hasResources =
                        state.resources.treasury >= order.costs.treasury &&
                        state.resources.grain >= order.costs.grain &&
                        state.resources.iron >= order.costs.iron &&
                        state.resources.timber >= order.costs.timber
                      const canSelect = !isSiegeLocked && hasResources
                      const isSelected = campaign.selectedOrder === order.id

                      return (
                        <div
                          key={order.id}
                          className={`campaign-order-card ${isSelected ? 'selected' : ''} ${!canSelect ? 'disabled' : ''}`}
                        >
                          <div className="order-card-header">
                            <span className="order-icon">{order.icon}</span>
                            <div>
                              <h4>{order.name}</h4>
                              <small className="order-character">{order.character}</small>
                            </div>
                          </div>
                          <p className="order-desc">{order.description}</p>
                          <div className="order-costs">
                            <span className="costs-label">소모 군수:</span>
                            <span className="costs-val">
                              🪙 {order.costs.treasury} · 🌾 {order.costs.grain}
                              {order.costs.iron > 0 && ` · ⛓ ${order.costs.iron}`}
                              {order.costs.timber > 0 && ` · 🪵 ${order.costs.timber}`}
                            </span>
                          </div>
                          <button
                            disabled={isSelected || !canSelect}
                            className={`btn-order-select ${isSelected ? 'is-selected' : ''}`}
                            onClick={() => selectCampaignOrder(order.id)}
                          >
                            {isSelected
                              ? '✓ 작전 하달됨'
                              : isSiegeLocked
                              ? `진군 45% 이상 필요 (현재 ${campaign.progress}%)`
                              : !hasResources
                              ? '군수 물자 부족'
                              : '작전 하달'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </section>
            )
          })()}

          <div className="diplomacy-layout">
            <section className="realm-panel army-panel">
              <div className="realm-panel-heading"><div><small>WAR COUNCIL</small><h2>에르덴 군사평의회</h2></div><strong>전투력 {armyPower}</strong></div>
              <div className="army-composition"><div><span>⚔️ 상비군</span><b>{state.soldiers}</b><small>강한 전투력 · 높은 유지비</small></div><div><span>🛡️ 징집병</span><b>{state.levies}</b><small>빠른 동원 · 안정도 부담</small></div><div><span>👥 가용 인력</span><b>{state.manpower}</b><small>산업과 군대가 공유</small></div></div>
              <div className="army-actions">
                <button disabled={state.capacities.command < 1 || state.resources.treasury < 55 || state.resources.iron < 14 || state.manpower < 90} onClick={recruitSoldiers}><b>상비군 중대 편성</b><span>지휘 1 · 🪙55 · 철 14 · 인력 90</span></button>
                <button disabled={state.capacities.command < 1 || state.resources.grain < 35 || state.manpower < 130} onClick={callLevies}><b>향촌 징집령</b><span>지휘 1 · 식량 35 · 인력 130</span></button>
              </div>
            </section>
            <section className="neighbor-list">
              {state.neighbors.map((neighbor) => {
                const isWarTarget = state.activeCampaign?.targetId === neighbor.id
                const invasionReady = neighbor.claim && armyPower >= neighbor.strength * 15 && state.capacities.command >= 2 && state.resources.treasury >= 80 && state.resources.grain >= 60 && !state.activeCampaign && !state.pendingWorldEvent
                return (
                  <article className={`neighbor-card ${neighbor.annexed ? 'annexed' : ''} ${isWarTarget ? 'at-war' : ''}`} key={neighbor.id}>
                    <div className="neighbor-crest">{neighbor.icon}</div>
                    <div className="neighbor-main">
                      <div className="neighbor-title">
                        <div>
                          <small>{neighbor.title}</small>
                          <h3>{neighbor.name}</h3>
                          <p>{neighbor.ruler}</p>
                        </div>
                        <span className={isWarTarget ? 'negative' : neighbor.relation >= 10 ? 'positive' : neighbor.relation < 0 ? 'negative' : ''}>
                          {neighbor.annexed ? '병합됨' : isWarTarget ? '교전 중' : `관계 ${signed(neighbor.relation)}`}
                        </span>
                      </div>
                      <div className="neighbor-tags">
                        <span>{neighbor.attitude}</span>
                        <span>군세 {neighbor.strength * 15}</span>
                        <span>{neighbor.specialty}</span>
                        {isWarTarget && <span className="war-tag">⚔️ 전쟁 중</span>}
                        {neighbor.tradeActive && <span className="trade-tag">교역 중</span>}
                        {neighbor.claim && <span className="claim-tag">명분 보유</span>}
                      </div>
                      <div className="neighbor-recent-box">
                        <span className="recent-label">최근 동향</span>
                        {neighbor.lastAction ? (
                          <span className="recent-val">
                            <time>[{neighbor.lastActionDate || '최근'}]</time> {neighbor.lastAction}
                          </span>
                        ) : (
                          <span className="recent-val text-muted">최근 동향 없음</span>
                        )}
                      </div>

                      {neighbor.tradeActive && !neighbor.annexed && (() => {
                        const currentContractId: TradeContractId = neighbor.tradeContract || 'balanced_exchange'
                        const routeEval = monthlyProjection.tradeEvaluation.routes.find((r) => r.neighborId === neighbor.id)
                        const efficiency = calculateNeighborEfficiency(neighbor.relation)
                        const currentDef = TRADE_CONTRACTS.find((c) => c.id === currentContractId) || TRADE_CONTRACTS[0]
                        const override = currentDef.partnerOverrides[neighbor.id]

                        return (
                          <div className="neighbor-trade-panel">
                            <div className="trade-panel-header">
                              <div className="trade-panel-title">
                                <span className="trade-badge">⛵ 교역 계약</span>
                                <strong>{currentDef.name}</strong>
                              </div>
                              <div className="trade-panel-meta">
                                <span className="trade-efficiency-tag" title="우호도 기반 교역 효율 (65% ~ 135%)">
                                  효율 {efficiency}%
                                </span>
                                {routeEval?.isSuspended && (
                                  <span className="trade-suspended-tag">⚠️ 이번 달 중단</span>
                                )}
                              </div>
                            </div>

                            {override?.partnerBonusLabel && (
                              <div className="trade-partner-bonus">
                                <span className="bonus-label">특화 효과:</span>
                                <span className="bonus-text">{override.partnerBonusLabel}</span>
                              </div>
                            )}

                            {routeEval?.isSuspended && (
                              <div className="trade-suspended-notice">
                                <span>⚠️ {routeEval.suspendReason}</span>
                                <small>자원이 충족될 때까지 비용 지출 및 교역품 공급이 일시 중지됩니다.</small>
                              </div>
                            )}

                            <div className="trade-contracts-grid">
                              {TRADE_CONTRACTS.map((contract) => {
                                const isCurrent = contract.id === currentContractId
                                const preview = getContractPreview(neighbor, contract.id, state.policies)
                                const canChange = state.capacities.diplomacy >= 1 && state.resources.treasury >= 10 && !isWarTarget

                                return (
                                  <div
                                    key={contract.id}
                                    className={`contract-chip ${isCurrent ? 'active-contract' : ''}`}
                                  >
                                    <div className="contract-chip-header">
                                      <span>{contract.icon} {contract.name}</span>
                                      {isCurrent && <span className="chip-current-badge">✓ 체결됨</span>}
                                    </div>
                                    <div className="contract-chip-deltas">
                                      {preview.costStr ? (
                                        <div className="chip-cost"><small>소모</small> {preview.costStr}</div>
                                      ) : (
                                        <div className="chip-cost free"><small>소모</small> 없음</div>
                                      )}
                                      <div className="chip-yield"><small>공급</small> {preview.yieldStr}</div>
                                    </div>
                                    {!isCurrent && (
                                      <button
                                        disabled={!canChange}
                                        className="btn-select-contract"
                                        onClick={() => changeTradeContract(neighbor.id, contract.id)}
                                        title={
                                          isWarTarget
                                            ? '전쟁 중에는 계약을 변경할 수 없습니다'
                                            : state.capacities.diplomacy < 1 || state.resources.treasury < 10
                                            ? '외교력 1 및 국고 10 필요'
                                            : '계약 변경'
                                        }
                                      >
                                        계약 변경 <small>(🤝1 · 🪙10)</small>
                                      </button>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })()}
                    </div>

                    {neighbor.annexed && (() => {
                      const gov = state.governance[neighbor.id]
                      const evalItem = monthlyProjection.dominionEvaluation.evaluations.find(
                        (e) => e.neighborId === neighbor.id,
                      )
                      const modeMeta =
                        GOVERNANCE_MODES.find((m) => m.id === gov?.governanceMode) || GOVERNANCE_MODES[0]
                      const isCore = gov?.isCore || (gov?.integration ?? 0) >= 100
                      const riskTier = evalItem?.rebellionRiskTier || '안정'

                      return (
                        <div className="neighbor-dominion-summary">
                          <div className="dominion-summary-header">
                            <span className="dominion-mode-pill">
                              {isCore ? '👑 완전 통합 직할령' : `${modeMeta.icon} ${modeMeta.name}`}
                            </span>
                            <span className={`dominion-risk-pill tier-${riskTier}`}>
                              {riskTier === '반란 임박'
                                ? '🔥 반란 임박'
                                : riskTier === '경고'
                                ? '⚠️ 소요 경고'
                                : riskTier === '주의'
                                ? '👀 소요 주의'
                                : '🌿 치안 안정'}
                            </span>
                          </div>
                          <div className="dominion-summary-meters">
                            <span>충성 {gov?.loyalty ?? 50}%</span>
                            <span>불안 {gov?.unrest ?? 0}%</span>
                            <span>통합 {gov?.integration ?? 0}%</span>
                          </div>
                          <div className="dominion-summary-yield">
                            <small>월 기여:</small>
                            <span>
                              🪙{signed(evalItem?.net.treasury ?? 0)} · 🌾+{evalItem?.yields.grain ?? 0} · ⛓+{evalItem?.yields.iron ?? 0} · 🪵+{evalItem?.yields.timber ?? 0}
                            </span>
                          </div>
                          <button className="btn-goto-dominion" onClick={() => setTab('dominion')}>
                            🚩 통치령 행정 관리
                          </button>
                        </div>
                      )
                    })()}

                    {!neighbor.annexed && (
                      <div className="neighbor-actions">
                        <button
                          disabled={isWarTarget || state.capacities.diplomacy < 1 || state.resources.treasury < 24}
                          onClick={() => diplomaticAction(neighbor.id, 'improve')}
                          title={isWarTarget ? '교전 중인 세력과는 관계를 개선할 수 없습니다' : undefined}
                        >
                          관계 개선
                        </button>
                        <button
                          disabled={isWarTarget || neighbor.tradeActive || neighbor.relation < 10 || state.capacities.diplomacy < 1 || state.resources.treasury < 35}
                          onClick={() => diplomaticAction(neighbor.id, 'trade')}
                          title={isWarTarget ? '교전 중인 세력과는 교역 협정을 체결할 수 없습니다' : undefined}
                        >
                          교역 협정
                        </button>
                        {neighbor.id !== 'crown' && (
                          <button
                            className="pressure"
                            disabled={isWarTarget || neighbor.claim || state.capacities.command < 1 || state.legitimacy < 45}
                            onClick={() => diplomaticAction(neighbor.id, 'pressure')}
                            title={isWarTarget ? '이미 전면 교전 중인 세력입니다' : undefined}
                          >
                            영유권 주장
                          </button>
                        )}
                        {neighbor.id !== 'crown' && neighbor.claim && (
                          isWarTarget ? (
                            <button disabled className="war-active-btn">원정 진행 중</button>
                          ) : (
                            <button className="war" disabled={!invasionReady} onClick={() => launchCampaign(neighbor.id)}>
                              {state.activeCampaign ? '원정 진행 중' : '원정 개시'}
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </article>
                )
              })}
            </section>
          </div>
        </div>
      )}

      {tab === 'dominion' && (
        <div className="realm-content">
          <div className="realm-section-intro">
            <div>
              <small>DOMINION ADMINISTRATION</small>
              <h2>정복한 영지를 다스려 제국의 토대를 닦으십시오</h2>
              <p>
                병합된 영지는 고유한 특산품과 조세를 바치지만, 가혹한 수탈은 주민들의 분노와 무장 봉기를 촉발합니다.
                군정 점령, 자치 인정, 문화 통합의 세 가지 방침을 적절히 교체해 반란을 억제하고 완전한 직할령으로 동화시키십시오.
              </p>
            </div>
            <span>방침 전환 비용: 🏛 행정력 1 · 🪙 국고 20</span>
          </div>

          {annexedCount === 0 ? (
            <div className="dominion-empty-card">
              <div className="empty-icon">🚩</div>
              <h3>현재 복속된 병합령이 없습니다</h3>
              <p>
                에르덴 변경백령의 군세는 아직 국경을 넘어 영토를 확장하지 않았습니다.
                외교와 군사 탭에서 영유권 명분을 공표하고 전면 원정을 개시하여 첫 직속 통치령을 확보하십시오.
              </p>
              <button className="btn-empty-goto-diplomacy" onClick={() => setTab('diplomacy')}>
                ⚔️ 외교와 군사 탭으로 이동
              </button>
            </div>
          ) : (
            <div className="dominion-grid">
              {state.neighbors
                .filter((n) => n.annexed && n.id !== 'crown')
                .map((neighbor) => {
                  const gov = state.governance[neighbor.id]
                  if (!gov) return null
                  const profile = TERRITORY_PROFILES[neighbor.id]
                  const evalItem = monthlyProjection.dominionEvaluation.evaluations.find(
                    (e) => e.neighborId === neighbor.id,
                  )
                  const isCore = gov.isCore || gov.integration >= 100
                  const currentModeMeta =
                    GOVERNANCE_MODES.find((m) => m.id === gov.governanceMode) || GOVERNANCE_MODES[0]
                  const riskTier = evalItem?.rebellionRiskTier || '안정'

                  return (
                    <article className={`dominion-card ${isCore ? 'core-territory' : ''}`} key={neighbor.id}>
                      <header className="dominion-card-header">
                        <div className="dominion-identity">
                          <span className="dominion-crest">{neighbor.icon}</span>
                          <div>
                            <div className="dominion-kicker-row">
                              <small>{neighbor.title}</small>
                              <span className="dominion-trait-badge">✦ {profile?.traitName || '지역 고유 특성'}</span>
                            </div>
                            <h3>{neighbor.name}</h3>
                          </div>
                        </div>
                        <div className="dominion-status-badges">
                          {isCore && <span className="dominion-badge-core">👑 완전 통합 (Core)</span>}
                          <span className={`dominion-risk-badge tier-${riskTier}`}>
                            {riskTier === '반란 임박'
                              ? '🔥 반란 임박!'
                              : riskTier === '경고'
                              ? '⚠️ 소요 경고'
                              : riskTier === '주의'
                              ? '👀 소요 주의'
                              : '🌿 치안 안정'}
                          </span>
                        </div>
                      </header>

                      {profile && (
                        <div className="dominion-lore-box">
                          <p>{profile.traitDescription}</p>
                          <small>고유 특산품: {profile.specialtySummary}</small>
                        </div>
                      )}

                      {evalItem?.isStalled && (
                        <div className="dominion-stalled-banner">
                          <span>⚠️ {evalItem.stalledReason}</span>
                          <small>이번 달 통합 사업이 중단되었으며, 방치로 인해 주민 불안도가 +4 급등합니다.</small>
                        </div>
                      )}

                      <div className="dominion-gauges">
                        <div className="gauge-item">
                          <div className="gauge-label-row">
                            <span>❤️ 충성도</span>
                            <strong>
                              {gov.loyalty} / 100
                              <small className={evalItem && evalItem.deltaLoyalty < 0 ? 'text-danger' : 'text-good'}>
                                ({signed(evalItem?.deltaLoyalty ?? 0)}/월)
                              </small>
                            </strong>
                          </div>
                          <div className="realm-meter">
                            <i
                              style={{
                                width: `${gov.loyalty}%`,
                                backgroundColor: gov.loyalty <= 10 ? '#ef4444' : gov.loyalty <= 25 ? '#f59e0b' : '#10b981',
                              }}
                            />
                          </div>
                          {gov.loyalty <= 10 ? (
                            <small className="gauge-alert text-danger">🔥 극도의 적대감 (다음 달 반란 위험)</small>
                          ) : gov.loyalty <= 25 ? (
                            <small className="gauge-alert text-amber">⚠️ 반발과 태업 심화</small>
                          ) : (
                            <small className="gauge-alert text-muted">주민 통제 유지 중</small>
                          )}
                        </div>

                        <div className="gauge-item">
                          <div className="gauge-label-row">
                            <span>🔥 불안도</span>
                            <strong>
                              {gov.unrest} / 100
                              <small className={evalItem && evalItem.deltaUnrest > 0 ? 'text-danger' : 'text-good'}>
                                ({signed(evalItem?.deltaUnrest ?? 0)}/월)
                              </small>
                            </strong>
                          </div>
                          <div className="realm-meter">
                            <i
                              style={{
                                width: `${gov.unrest}%`,
                                backgroundColor: gov.unrest >= 90 ? '#ef4444' : gov.unrest >= 70 ? '#f97316' : '#3b82f6',
                              }}
                            />
                          </div>
                          {gov.unrest >= 90 ? (
                            <small className="gauge-alert text-danger">🔥 무장 봉기 집결 완료 (반란 임박)</small>
                          ) : gov.unrest >= 70 ? (
                            <small className="gauge-alert text-amber">⚠️ 민중 폭동 및 파괴 공작 발생</small>
                          ) : (
                            <small className="gauge-alert text-muted">치안 안정권</small>
                          )}
                        </div>

                        <div className="gauge-item">
                          <div className="gauge-label-row">
                            <span>🏛️ 통합도</span>
                            <strong>
                              {gov.integration} / 100
                              <small className="text-cyan">
                                ({isCore ? '완전 편입' : `${signed(evalItem?.deltaIntegration ?? 0)}/월`})
                              </small>
                            </strong>
                          </div>
                          <div className="realm-meter purple">
                            <i style={{ width: `${gov.integration}%` }} />
                          </div>
                          {isCore ? (
                            <small className="gauge-alert text-good">✓ 영구 핵심 직할령 편입 완료</small>
                          ) : (
                            <small className="gauge-alert text-muted">100 도달 시 영구 핵심 직할령으로 승격</small>
                          )}
                        </div>
                      </div>

                      <div className="dominion-contribution-box">
                        <div className="contrib-header">
                          <span className="contrib-title">다음 달 예상 공납 및 비용</span>
                          <span className="contrib-current-mode">현재: {currentModeMeta.name}</span>
                        </div>
                        <div className="contrib-grid">
                          <div>
                            <small>조세 수익</small>
                            <strong>+{evalItem?.yields.treasury ?? 0}🪙</strong>
                          </div>
                          <div>
                            <small>특산 물자</small>
                            <strong>
                              🌾+{evalItem?.yields.grain ?? 0} · ⛓+{evalItem?.yields.iron ?? 0} · 🪵+{evalItem?.yields.timber ?? 0}
                            </strong>
                          </div>
                          <div>
                            <small>통합 사업비</small>
                            <strong className={evalItem?.costs.treasury ? 'text-amber' : ''}>
                              {evalItem?.costs.treasury ? `−${evalItem.costs.treasury}🪙` : '없음'}
                            </strong>
                          </div>
                          <div className="contrib-total">
                            <small>국고 순변동</small>
                            <strong className={(evalItem?.net.treasury ?? 0) < 0 ? 'text-danger' : 'text-good'}>
                              {signed(evalItem?.net.treasury ?? 0)}🪙
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="dominion-modes-section">
                        <div className="modes-header">
                          <span className="modes-title">통치 방침 전환</span>
                          <span className="modes-cost-hint">전환 비용: 🏛1 · 🪙20</span>
                        </div>
                        <div className="dominion-mode-cards">
                          {GOVERNANCE_MODES.map((modeMeta) => {
                            const isCurrent = gov.governanceMode === modeMeta.id
                            const canChange =
                              state.capacities.administration >= 1 &&
                              state.resources.treasury >= 20 &&
                              !isCurrent

                            return (
                              <div
                                key={modeMeta.id}
                                className={`dominion-mode-card ${isCurrent ? 'active-mode' : ''}`}
                              >
                                <div className="mode-card-header">
                                  <span>{modeMeta.icon} {modeMeta.name}</span>
                                  {isCurrent && <span className="mode-current-tag">✓ 시행 중</span>}
                                </div>
                                <p className="mode-short-desc">{modeMeta.shortDesc}</p>
                                <div className="mode-char-badge">{modeMeta.character}</div>
                                {!isCurrent && (
                                  <button
                                    disabled={!canChange}
                                    className="btn-select-mode"
                                    onClick={() => changeGovernanceMode(neighbor.id, modeMeta.id)}
                                    title={
                                      state.capacities.administration < 1 || state.resources.treasury < 20
                                        ? '행정력 1 및 국고 20 필요'
                                        : '방침 전환'
                                    }
                                  >
                                    방침 선포 <small>(🏛1 · 🪙20)</small>
                                  </button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {gov.lastReport && (
                        <div className="dominion-last-report">
                          <span className="report-label">최근 총독 보고:</span>
                          <span className="report-text">{gov.lastReport}</span>
                        </div>
                      )}
                    </article>
                  )
                })}
            </div>
          )}
        </div>
      )}

    </section>
  )
}

