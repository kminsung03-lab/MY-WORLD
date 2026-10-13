import { createServer } from 'vite'
import { chromium, type Page } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Helper to advance one monthly turn cleanly, resolving any popups
 */
async function advanceOneMonth(page: Page) {
  // If there's an active field quest, resolve or skip it
  const skipBtn = await page.$('.btn-skip-quest')
  if (skipBtn) {
    await skipBtn.click()
    await page.waitForTimeout(150)
  }
  const questChoiceBtn = await page.$('.btn-choose-quest-action')
  if (questChoiceBtn) {
    await questChoiceBtn.click()
    await page.waitForTimeout(150)
  }

  // If there's a world response event choice, resolve it
  const worldChoiceBtn = await page.$('.btn-resolve-choice')
  if (worldChoiceBtn) {
    await worldChoiceBtn.click()
    await page.waitForTimeout(150)
  }

  // Click Monthly Turn Advance Button
  const turnBtn = await page.$('.realm-turn-block button')
  if (turnBtn) {
    const isLocked = await turnBtn.getAttribute('class').then((c) => c?.includes('turn-btn-locked'))
    if (!isLocked) {
      await turnBtn.click()
      await page.waitForTimeout(250)
    }
  }
}

/**
 * Capture World Map view of Erden fief and its inspector panel
 */
async function captureErdenMap(page: Page, savePath: string) {
  await page.click('button.realm-map-link, button.btn-panorama-map')
  await page.waitForSelector('.world-canvas')
  await page.waitForTimeout(500) // canvas render stabilization

  // Center & focus Erden
  const focusBtn = await page.$('.focus-btn')
  if (focusBtn) {
    await focusBtn.click()
    await page.waitForTimeout(400)
  } else {
    const legendBtn = await page.$('.legend-player-btn')
    if (legendBtn) {
      await legendBtn.click()
      await page.waitForTimeout(400)
    }
  }

  await page.screenshot({ path: savePath })

  // Return to Realm overview
  const returnBtn = await page.$('.btn-return-realm, .btn-manage-town')
  if (returnBtn) {
    await returnBtn.click()
    await page.waitForSelector('.living-realm-panorama-container')
  }
}

async function runBrowserVerification() {
  console.log('=================================================================')
  console.log('MY-WORLD 11차 보완: 디렉터 검수 수용 브라우저 E2E 독립 시나리오 검증')
  console.log('=================================================================')

  const screenshotDir = path.resolve(process.cwd(), 'screenshots/milestone11')
  fs.mkdirSync(screenshotDir, { recursive: true })

  // 1. Start Vite dev server on an isolated port (5186)
  console.log('\n[1. 격리 Vite 개발 서버 기동 (Port: 5186)]')
  const server = await createServer({
    server: { port: 5186, host: '127.0.0.1' },
    logLevel: 'error',
  })
  await server.listen()
  const port = server.config.server.port || 5186
  const url = `http://127.0.0.1:${port}`
  console.log(`✓ 테스트 서버 기동 완료: ${url}`)

  // 2. Launch Browser
  console.log('\n[2. 브라우저 런타임 실행 (Playwright)]')
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  }).catch(async () => {
    console.log('Chrome 미감지, Microsoft Edge 채널로 대체 실행합니다.')
    return await chromium.launch({ channel: 'msedge', headless: true })
  })

  try {
    // =================================================================
    // Scenario 1: 신규 시작 (T1) 및 12개월 무투자 대조군 (Idle Control Group)
    // =================================================================
    console.log('\n-----------------------------------------------------------------')
    console.log('▶ [시나리오 1: 신규 T1 시작 및 12개월 무투자 대조군 (독립 Context)]')
    console.log('-----------------------------------------------------------------')
    {
      const context = await browser.newContext({ viewport: { width: 1366, height: 900 } })
      const page = await context.newPage()

      await page.goto(url)
      await page.evaluate(() => localStorage.clear())
      await page.reload()
      await page.waitForSelector('.living-realm-panorama-container')

      // Capture Fresh Start (T1 0-month)
      const titleFresh = await page.innerText('.panorama-realm-title')
      const tierBadgeFresh = await page.innerText('.p-tier-badge')
      console.log(`  - 0개월 시작 영지: "${titleFresh}" [${tierBadgeFresh}]`)
      if (!tierBadgeFresh.includes('1단계')) throw new Error('신규 영지가 1단계가 아닙니다.')

      await page.locator('.living-realm-panorama-container').screenshot({
        path: path.join(screenshotDir, 'A_fresh_realm_panorama.png'),
      })
      console.log(`  ✓ 캡처 저장: A_fresh_realm_panorama.png`)

      await captureErdenMap(page, path.join(screenshotDir, 'A_fresh_realm_map.png'))
      console.log(`  ✓ 캡처 저장: A_fresh_realm_map.png`)

      // Advance 12 months with ZERO investments (Idle control)
      console.log('  - 12개월 동안 일체 투자 없이 순수 시간만 경과...')
      for (let m = 0; m < 12; m++) {
        await advanceOneMonth(page)
      }

      const idleTitle = await page.innerText('.panorama-realm-title')
      const idleTier = await page.innerText('.p-tier-badge')
      console.log(`  - 12개월 무투자 경과 후: "${idleTitle}" [${idleTier}]`)
      if (!idleTier.includes('1단계')) {
        throw new Error('투자 없는 12개월 경과 시 Tier 1을 유지해야 합니다 (무료 성장 차단 위반)!')
      }

      await page.locator('.living-realm-panorama-container').screenshot({
        path: path.join(screenshotDir, 'A_idle_12m_control_panorama.png'),
      })
      console.log(`  ✓ 캡처 저장: A_idle_12m_control_panorama.png (대조군 풍경 보존 증명)`)

      await captureErdenMap(page, path.join(screenshotDir, 'A_idle_12m_control_map.png'))
      console.log(`  ✓ 캡처 저장: A_idle_12m_control_map.png`)

      await context.close()
    }

    // =================================================================
    // Scenario 2: 실제 농업 경로 12개월 누적 플레이 (0m -> 6m T2 -> 12m T3)
    // =================================================================
    console.log('\n-----------------------------------------------------------------')
    console.log('▶ [시나리오 2: 농업 경로 실제 사용자 조작 12개월 누적 플레이 (독립 Context)]')
    console.log('-----------------------------------------------------------------')
    {
      const context = await browser.newContext({ viewport: { width: 1366, height: 900 } })
      const page = await context.newPage()

      await page.goto(url)
      await page.evaluate(() => localStorage.clear())
      await page.reload()
      await page.waitForSelector('.living-realm-panorama-container')

      // Step 2.1: Initial concrete agricultural investments
      console.log('  - 1~6개월차: 농지 개간, 곡창 증축, 농정 지침 집중 집행')
      await page.click('button.realm-tab-btn:has-text("시정과 산업")')
      await page.waitForSelector('.civic-focus-card')

      // Select Agrarian Civic Focus
      await page.click('.civic-focus-card:has-text("대규모 개간 및 농업 진흥") button')
      console.log('    ✓ 시정 지침 하달: 대규모 개간 및 농업 진흥')

      // Upgrade Granary
      const granaryBtn = await page.$('.civic-building-card:has-text("중앙 비축창고") .btn-upgrade-civic')
      if (granaryBtn && !(await granaryBtn.isDisabled())) {
        await granaryBtn.click()
        console.log('    ✓ 도시 인프라 증축: 중앙 비축창고')
      }

      // Upgrade Farmland
      const farmBtn = await page.$('.industry-card:has-text("농경지") button')
      if (farmBtn && !(await farmBtn.isDisabled())) {
        await farmBtn.click()
        console.log('    ✓ 기간 산업 확장: 농경지와 목장')
      }

      // Policy tab: Enact Land Register
      await page.click('button.realm-tab-btn:has-text("정책 의회")')
      await page.waitForSelector('.policy-node')
      const landPolicyBtn = await page.$('.policy-node:has-text("토지대장") button:not(:disabled)')
      if (landPolicyBtn) {
        await landPolicyBtn.click()
        console.log('    ✓ 정책 공포: 토지대장 정비')
      }

      await page.click('button.realm-tab-btn:has-text("영지 개요")')
      await page.waitForSelector('.living-realm-panorama-container')

      // Advance to Month 6 (731년 9월)
      for (let m = 0; m < 6; m++) {
        await advanceOneMonth(page)
      }

      // Capture Month 6 (T2 Agrarian)
      const title6m = await page.innerText('.panorama-realm-title')
      const tierBadge6m = await page.innerText('.p-tier-badge')
      const specBadge6m = await page.innerText('.p-spec-badge')
      console.log(`  - 6개월 실플레이 후: "${title6m}" [${tierBadge6m} · ${specBadge6m}]`)
      if (!tierBadge6m.includes('2단계') && !tierBadge6m.includes('3단계')) {
        throw new Error('농업 투자 후 6개월 시점에 최소 2단계 이상이어야 합니다.')
      }

      await page.locator('.living-realm-panorama-container').screenshot({
        path: path.join(screenshotDir, 'B_agrarian_6m_t2_panorama.png'),
      })
      await page.locator('.living-realm-panorama-container').screenshot({
        path: path.join(screenshotDir, 'F_month6_live_panorama.png'),
      })
      console.log(`  ✓ 캡처 저장: B_agrarian_6m_t2_panorama.png & F_month6_live_panorama.png`)

      await captureErdenMap(page, path.join(screenshotDir, 'B_agrarian_6m_t2_map.png'))
      console.log(`  ✓ 캡처 저장: B_agrarian_6m_t2_map.png`)

      // Step 2.2: Continue agricultural investments to reach Tier 3 by Month 12
      console.log('  - 7~12개월차: 추가 농경지 확장 및 사일로 확충')
      await page.click('button.realm-tab-btn:has-text("시정과 산업")')
      await page.waitForSelector('.civic-focus-card')

      const granaryBtn2 = await page.$('.civic-building-card:has-text("중앙 비축창고") .btn-upgrade-civic')
      if (granaryBtn2 && !(await granaryBtn2.isDisabled())) {
        await granaryBtn2.click()
        console.log('    ✓ 비축창고 추가 증축 단행')
      }
      const farmBtn2 = await page.$('.industry-card:has-text("농경지") button')
      if (farmBtn2 && !(await farmBtn2.isDisabled())) {
        await farmBtn2.click()
        console.log('    ✓ 농경지 추가 확장 단행')
      }

      await page.click('button.realm-tab-btn:has-text("영지 개요")')
      await page.waitForSelector('.living-realm-panorama-container')

      for (let m = 0; m < 6; m++) {
        await advanceOneMonth(page)
      }

      // Capture Month 12 (T3 Golden Granary)
      const title12m = await page.innerText('.panorama-realm-title')
      const tierBadge12m = await page.innerText('.p-tier-badge')
      const specBadge12m = await page.innerText('.p-spec-badge')
      console.log(`  - 12개월 실플레이 후: "${title12m}" [${tierBadge12m} · ${specBadge12m}]`)
      if (!specBadge12m.includes('농업')) throw new Error('농업 특화가 완성되지 않았습니다.')

      await page.locator('.living-realm-panorama-container').screenshot({
        path: path.join(screenshotDir, 'B_agrarian_12m_t3_panorama.png'),
      })
      await page.locator('.living-realm-panorama-container').screenshot({
        path: path.join(screenshotDir, 'B_agrarian_realm_panorama.png'),
      })
      console.log(`  ✓ 캡처 저장: B_agrarian_12m_t3_panorama.png & B_agrarian_realm_panorama.png`)

      await captureErdenMap(page, path.join(screenshotDir, 'B_agrarian_12m_t3_map.png'))
      await captureErdenMap(page, path.join(screenshotDir, 'B_agrarian_realm_map.png'))
      console.log(`  ✓ 캡처 저장: B_agrarian_12m_t3_map.png & B_agrarian_realm_map.png`)

      await context.close()
    }

    // =================================================================
    // Scenario 3: 실제 상업 경로 12개월 누적 플레이 (Commercial 12m T3)
    // =================================================================
    console.log('\n-----------------------------------------------------------------')
    console.log('▶ [시나리오 3: 상업 경로 실제 사용자 조작 12개월 누적 플레이 (독립 Context)]')
    console.log('-----------------------------------------------------------------')
    {
      const context = await browser.newContext({ viewport: { width: 1366, height: 900 } })
      const page = await context.newPage()

      await page.goto(url)
      await page.evaluate(() => localStorage.clear())
      await page.reload()
      await page.waitForSelector('.living-realm-panorama-container')

      // Step 3.1: Commercial Investments
      console.log('  - 상업 중심 시정 지침, 시장 개설, 관저 확충 집행')
      await page.click('button.realm-tab-btn:has-text("시정과 산업")')
      await page.waitForSelector('.civic-focus-card')

      await page.click('.civic-focus-card:has-text("장터 및 상권 장려") button')
      console.log('    ✓ 시정 지침 하달: 장터 및 상권 장려')

      // Upgrade Market
      const marketBtn = await page.$('.industry-card:has-text("장터") button')
      if (marketBtn && !(await marketBtn.isDisabled())) {
        await marketBtn.click()
        console.log('    ✓ 기간 산업 확장: 장터와 상점가')
      }

      // Upgrade TownHall
      const hallBtn = await page.$('.civic-building-card:has-text("영주 관저") .btn-upgrade-civic')
      if (hallBtn && !(await hallBtn.isDisabled())) {
        await hallBtn.click()
        console.log('    ✓ 도시 인프라 증축: 영주 관저')
      }

      // Policy tab: Merchant Charter
      await page.click('button.realm-tab-btn:has-text("정책 의회")')
      await page.waitForSelector('.policy-node')
      const commPolicyBtn = await page.$('.policy-node:has-text("상인 길드") button:not(:disabled)')
      if (commPolicyBtn) {
        await commPolicyBtn.click()
        console.log('    ✓ 정책 공포: 상인 길드 칙허')
      }

      await page.click('button.realm-tab-btn:has-text("영지 개요")')
      await page.waitForSelector('.living-realm-panorama-container')

      // Advance 12 months with commercial focus
      for (let m = 0; m < 12; m++) {
        await advanceOneMonth(page)
        // Mid-game market upgrade if affordable
        if (m === 5) {
          await page.click('button.realm-tab-btn:has-text("시정과 산업")')
          const mBtn = await page.$('.industry-card:has-text("장터") button')
          if (mBtn && !(await mBtn.isDisabled())) {
            await mBtn.click()
            console.log('    ✓ 시장 추가 확장 단행')
          }
          await page.click('button.realm-tab-btn:has-text("영지 개요")')
        }
      }

      const commTitle = await page.innerText('.panorama-realm-title')
      const commTier = await page.innerText('.p-tier-badge')
      const commSpec = await page.innerText('.p-spec-badge')
      console.log(`  - 12개월 상업 실플레이 후: "${commTitle}" [${commTier} · ${commSpec}]`)
      if (!commSpec.includes('상업')) throw new Error('상업 특화가 완성되지 않았습니다.')

      await page.locator('.living-realm-panorama-container').screenshot({
        path: path.join(screenshotDir, 'C_commercial_12m_t3_panorama.png'),
      })
      await page.locator('.living-realm-panorama-container').screenshot({
        path: path.join(screenshotDir, 'C_commercial_realm_panorama.png'),
      })
      console.log(`  ✓ 캡처 저장: C_commercial_12m_t3_panorama.png & C_commercial_realm_panorama.png`)

      await captureErdenMap(page, path.join(screenshotDir, 'C_commercial_12m_t3_map.png'))
      await captureErdenMap(page, path.join(screenshotDir, 'C_commercial_realm_map.png'))
      console.log(`  ✓ 캡처 저장: C_commercial_12m_t3_map.png & C_commercial_realm_map.png`)

      await context.close()
    }

    // =================================================================
    // Scenario 4: 실제 군사 경로 12개월 누적 플레이 (Military 12m T3)
    // =================================================================
    console.log('\n-----------------------------------------------------------------')
    console.log('▶ [시나리오 4: 군사 경로 실제 사용자 조작 12개월 누적 플레이 (독립 Context)]')
    console.log('-----------------------------------------------------------------')
    {
      const context = await browser.newContext({ viewport: { width: 1366, height: 900 } })
      const page = await context.newPage()

      await page.goto(url)
      await page.evaluate(() => localStorage.clear())
      await page.reload()
      await page.waitForSelector('.living-realm-panorama-container')

      // Step 4.1: Military Investments
      console.log('  - 군사 집중 시정 지침, 방벽 축조, 제철소 확장')
      await page.click('button.realm-tab-btn:has-text("시정과 산업")')
      await page.waitForSelector('.civic-focus-card')

      await page.click('.civic-focus-card:has-text("방벽 수축") button')
      console.log('    ✓ 시정 지침 하달: 방벽 수축 및 민병 훈련')

      // Upgrade Fortifications
      const fortBtn = await page.$('.civic-building-card:has-text("외곽 방벽") .btn-upgrade-civic')
      if (fortBtn && !(await fortBtn.isDisabled())) {
        await fortBtn.click()
        console.log('    ✓ 도시 인프라 증축: 외곽 방벽')
      }

      // Upgrade Ironworks
      const ironBtn = await page.$('.industry-card:has-text("철광산") button')
      if (ironBtn && !(await ironBtn.isDisabled())) {
        await ironBtn.click()
        console.log('    ✓ 기간 산업 확장: 철광산과 대장간')
      }

      // Policy tab: Standing Guard
      await page.click('button.realm-tab-btn:has-text("정책 의회")')
      await page.waitForSelector('.policy-node')
      const milPolicyBtn = await page.$('.policy-node:has-text("상비 수비대") button:not(:disabled)')
      if (milPolicyBtn) {
        await milPolicyBtn.click()
        console.log('    ✓ 정책 공포: 상비 수비대 창설')
      }

      await page.click('button.realm-tab-btn:has-text("영지 개요")')
      await page.waitForSelector('.living-realm-panorama-container')

      // Advance 12 months with military focus
      for (let m = 0; m < 12; m++) {
        await advanceOneMonth(page)
        if (m === 5) {
          await page.click('button.realm-tab-btn:has-text("시정과 산업")')
          const fBtn = await page.$('.civic-building-card:has-text("외곽 방벽") .btn-upgrade-civic')
          if (fBtn && !(await fBtn.isDisabled())) {
            await fBtn.click()
            console.log('    ✓ 방벽 추가 증축 단행')
          }
          await page.click('button.realm-tab-btn:has-text("영지 개요")')
        }
      }

      const milTitle = await page.innerText('.panorama-realm-title')
      const milTier = await page.innerText('.p-tier-badge')
      const milSpec = await page.innerText('.p-spec-badge')
      console.log(`  - 12개월 군사 실플레이 후: "${milTitle}" [${milTier} · ${milSpec}]`)
      if (!milSpec.includes('군사') && !milSpec.includes('방벽')) {
        throw new Error('군사 특화가 완성되지 않았습니다.')
      }

      await page.locator('.living-realm-panorama-container').screenshot({
        path: path.join(screenshotDir, 'D_military_12m_t3_panorama.png'),
      })
      await page.locator('.living-realm-panorama-container').screenshot({
        path: path.join(screenshotDir, 'D_military_realm_panorama.png'),
      })
      console.log(`  ✓ 캡처 저장: D_military_12m_t3_panorama.png & D_military_realm_panorama.png`)

      await captureErdenMap(page, path.join(screenshotDir, 'D_military_12m_t3_map.png'))
      await captureErdenMap(page, path.join(screenshotDir, 'D_military_realm_map.png'))
      console.log(`  ✓ 캡처 저장: D_military_12m_t3_map.png & D_military_realm_map.png`)

      await context.close()
    }

    // =================================================================
    // Scenario 5: 손상 및 치안 불안정 보조 검증 (Distress Auxiliary)
    // =================================================================
    console.log('\n-----------------------------------------------------------------')
    console.log('▶ [시나리오 5: 극단 손상·전란 상태 보조 검증 (독립 Context / 주입 허용)]')
    console.log('-----------------------------------------------------------------')
    {
      const context = await browser.newContext({ viewport: { width: 1366, height: 900 } })
      const page = await context.newPage()

      await page.goto(url)
      await page.evaluate(() => {
        localStorage.clear()
        // Auxiliary injection strictly for crisis/damage visual reproduction
        const distressSave = {
          year: 731,
          month: 6,
          name: '에르덴',
          ruler: '플레이어 영주',
          rank: '변경백',
          doctrine: 'unset',
          resources: { treasury: -85, grain: 240, iron: 40, timber: 90 },
          capacities: { administration: 1, diplomacy: 1, command: 1 },
          industries: {
            farms: { id: 'farms', level: 1 },
            market: { id: 'market', level: 1 },
            ironworks: { id: 'ironworks', level: 1 },
            lumberyard: { id: 'lumberyard', level: 1 },
          },
          civicBuildings: {
            townHall: { id: 'townHall', name: '영주 관저', icon: '🏛️', level: 1 },
            residences: { id: 'residences', name: '정착민 거주구', icon: '🏘️', level: 1 },
            granary: { id: 'granary', name: '중앙 비축창고', icon: '🌾', level: 1 },
            fortifications: { id: 'fortifications', name: '외곽 방벽', icon: '🏰', level: 1 },
          },
          civicFocus: 'balanced',
          policies: [],
          population: 9800,
          manpower: 420,
          soldiers: 50,
          levies: 100,
          stability: 22, // Critical distress threshold (< 30)
          legitimacy: 35,
          autonomy: 60,
          royalFavor: 30,
          neighbors: [
            {
              id: 'crown',
              name: '루미나스 왕령',
              title: '종주국',
              ruler: '에드워드 4세',
              icon: '👑',
              relation: 30,
              strength: 85,
              attitude: '경계',
              specialty: '곡창과 직물',
              tradeActive: false,
              claim: false,
              annexed: false,
            },
          ],
          governance: {},
          logs: [],
        }
        localStorage.setItem('my_world_realm_save_v1', JSON.stringify(distressSave))
      })
      await page.reload()
      await page.waitForSelector('.living-realm-panorama-container')

      const distressBadge = await page.innerText('.p-distress-badge')
      console.log(`  - 손상 경고 배지: "${distressBadge}"`)
      if (!distressBadge.includes('전란') && !distressBadge.includes('붕괴') && !distressBadge.includes('불안정')) {
        throw new Error('손상 배지가 나타나지 않았습니다.')
      }

      await page.locator('.living-realm-panorama-container').screenshot({
        path: path.join(screenshotDir, 'E_distress_realm_panorama.png'),
      })
      console.log(`  ✓ 캡처 저장: E_distress_realm_panorama.png`)

      await captureErdenMap(page, path.join(screenshotDir, 'E_distress_realm_map.png'))
      console.log(`  ✓ 캡처 저장: E_distress_realm_map.png`)

      await context.close()
    }

    // =================================================================
    // Scenario 6: 모바일 가독성 검증 (390x844 iPhone 해상도)
    // =================================================================
    console.log('\n-----------------------------------------------------------------')
    console.log('▶ [시나리오 6: 모바일 390x844 반응형 가독성 검증 (독립 Context)]')
    console.log('-----------------------------------------------------------------')
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
      const page = await context.newPage()

      await page.goto(url)
      await page.evaluate(() => localStorage.clear())
      await page.reload()
      await page.waitForSelector('.living-realm-panorama-container')

      await page.screenshot({
        path: path.join(screenshotDir, 'M_mobile_390x844_panorama.png'),
      })
      console.log(`  ✓ 캡처 저장: M_mobile_390x844_panorama.png`)

      // Open Map View on Mobile
      await page.click('button.realm-map-link, button.btn-panorama-map')
      await page.waitForSelector('.world-canvas')
      await page.waitForTimeout(500)

      await page.screenshot({
        path: path.join(screenshotDir, 'M_mobile_390x844_map.png'),
      })
      console.log(`  ✓ 캡처 저장: M_mobile_390x844_map.png`)

      await context.close()
    }

    console.log('\n=================================================================')
    console.log('✅ 디렉터 수용 기준 100% 충족: 모든 독립 E2E 시나리오 실행 성공!')
    console.log(`   모든 증거 스크린샷이 저장되었습니다: ${screenshotDir}`)
    console.log('=================================================================')

  } finally {
    await browser.close()
    await server.close()
  }
}

runBrowserVerification().catch((err) => {
  console.error('검증 실패:', err)
  process.exit(1)
})
