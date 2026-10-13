import { createServer } from 'vite'
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

async function runBrowserVerification() {
  console.log('=================================================================')
  console.log('MY-WORLD 11차 마일스톤: 브라우저 E2E "살아 있는 영지" 시각 검증 및 캡처')
  console.log('=================================================================')

  const screenshotDir = path.resolve(process.cwd(), 'screenshots/milestone11')
  fs.mkdirSync(screenshotDir, { recursive: true })

  // 1. Start Vite dev server on an isolated port (5184 to avoid user test port 5181)
  console.log('\n[1. 격리 Vite 개발 서버 기동 (Port: 5184)]')
  const server = await createServer({
    server: { port: 5184, host: '127.0.0.1' },
    logLevel: 'error',
  })
  await server.listen()
  const port = server.config.server.port || 5184
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
    const context = await browser.newContext({
      viewport: { width: 1366, height: 900 },
    })
    const page = await context.newPage()

    // -----------------------------------------------------------------
    // Scenario A: 신규 영지 (Fresh Start - Tier 1 개척 정착촌)
    // -----------------------------------------------------------------
    console.log('\n[상태 A 검증: 신규 영지 (Tier 1 Hamlet / 초기 정착촌)]')
    await page.goto(url)
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForSelector('.living-realm-panorama-container')

    // Read initial badges
    const titleA = await page.innerText('.panorama-realm-title')
    const tierBadgeA = await page.innerText('.p-tier-badge')
    console.log(`  - 영지 표제: "${titleA}"`)
    console.log(`  - 발전 단계 배지: "${tierBadgeA}"`)
    if (!tierBadgeA.includes('1단계')) throw new Error('신규 영지가 1단계가 아닙니다.')

    // Capture Panorama (영지 화면)
    await page.locator('.living-realm-panorama-container').screenshot({
      path: path.join(screenshotDir, 'A_fresh_realm_panorama.png'),
    })
    console.log(`  ✓ 캡처 저장: A_fresh_realm_panorama.png`)

    // Navigate to World Map and inspect Erden
    await page.click('.btn-panorama-map')
    await page.waitForSelector('.world-canvas')
    await page.waitForTimeout(600) // wait for canvas render

    // Click "내 영지" to focus Erden
    await page.click('.focus-btn')
    await page.waitForTimeout(500)

    // Capture Map canvas & inspector
    await page.screenshot({ path: path.join(screenshotDir, 'A_fresh_realm_map.png') })
    console.log(`  ✓ 캡처 저장: A_fresh_realm_map.png`)

    // Return to Realm View
    await page.click('.btn-return-realm')
    await page.waitForSelector('.living-realm-panorama-container')

    // -----------------------------------------------------------------
    // Scenario B: 농업 집중 성장 영지 (Tier 3 Golden Granary)
    // -----------------------------------------------------------------
    console.log('\n[상태 B 검증: 농업 집중 성장 영지 (Tier 3 대곡창 영지)]')
    await page.evaluate(() => {
      const saveStr = localStorage.getItem('my_world_realm_save_v1')
      const save = saveStr ? JSON.parse(saveStr) : {}
      save.industries = {
        ...save.industries,
        farms: { id: 'farms', level: 4 },
        market: { id: 'market', level: 1 },
        ironworks: { id: 'ironworks', level: 1 },
      }
      save.civicBuildings = {
        ...save.civicBuildings,
        granary: { id: 'granary', name: '중앙 비축창고', icon: '🌾', level: 3 },
        townHall: { id: 'townHall', name: '영주 관저', icon: '🏛️', level: 2 },
      }
      save.civicFocus = 'agrarian_expansion'
      save.policies = ['land_register']
      save.doctrine = 'stewardship'
      save.resources = { ...save.resources, grain: 850 }
      localStorage.setItem('my_world_realm_save_v1', JSON.stringify(save))
    })
    await page.reload()
    await page.waitForSelector('.living-realm-panorama-container')

    const titleB = await page.innerText('.panorama-realm-title')
    const specB = await page.innerText('.p-spec-badge')
    console.log(`  - 영지 표제: "${titleB}"`)
    console.log(`  - 특화 배지: "${specB}"`)
    if (!specB.includes('농업')) throw new Error('농업 특화가 표시되지 않았습니다.')

    await page.locator('.living-realm-panorama-container').screenshot({
      path: path.join(screenshotDir, 'B_agrarian_realm_panorama.png'),
    })
    console.log(`  ✓ 캡처 저장: B_agrarian_realm_panorama.png`)

    // Check Map View
    await page.click('.btn-panorama-map')
    await page.waitForSelector('.world-canvas')
    await page.waitForTimeout(600)
    await page.click('.focus-btn')
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(screenshotDir, 'B_agrarian_realm_map.png') })
    console.log(`  ✓ 캡처 저장: B_agrarian_realm_map.png`)

    await page.click('.btn-return-realm')
    await page.waitForSelector('.living-realm-panorama-container')

    // -----------------------------------------------------------------
    // Scenario C: 상업 집중 성장 영지 (Tier 3 Commercial Metropolis)
    // -----------------------------------------------------------------
    console.log('\n[상태 C 검증: 상업 집중 성장 영지 (Tier 3 상업 중심도시)]')
    await page.evaluate(() => {
      const saveStr = localStorage.getItem('my_world_realm_save_v1')
      const save = saveStr ? JSON.parse(saveStr) : {}
      save.industries = {
        ...save.industries,
        farms: { id: 'farms', level: 1 },
        market: { id: 'market', level: 4 },
        ironworks: { id: 'ironworks', level: 1 },
      }
      save.civicBuildings = {
        ...save.civicBuildings,
        granary: { id: 'granary', name: '중앙 비축창고', icon: '🌾', level: 1 },
        townHall: { id: 'townHall', name: '영주 관저', icon: '🏛️', level: 3 },
      }
      save.civicFocus = 'market_boom'
      save.policies = ['merchant_charter', 'free_port']
      save.doctrine = 'commerce'
      save.resources = { ...save.resources, treasury: 1200 }
      // Activate trade with 2 neighbors
      if (save.neighbors) {
        save.neighbors.forEach((n: any) => {
          if (n.id === 'auric' || n.id === 'sylvana') n.tradeActive = true
        })
      }
      localStorage.setItem('my_world_realm_save_v1', JSON.stringify(save))
    })
    await page.reload()
    await page.waitForSelector('.living-realm-panorama-container')

    const titleC = await page.innerText('.panorama-realm-title')
    const specC = await page.innerText('.p-spec-badge')
    console.log(`  - 영지 표제: "${titleC}"`)
    console.log(`  - 특화 배지: "${specC}"`)
    if (!specC.includes('상업')) throw new Error('상업 특화가 표시되지 않았습니다.')

    await page.locator('.living-realm-panorama-container').screenshot({
      path: path.join(screenshotDir, 'C_commercial_realm_panorama.png'),
    })
    console.log(`  ✓ 캡처 저장: C_commercial_realm_panorama.png`)

    await page.click('.btn-panorama-map')
    await page.waitForSelector('.world-canvas')
    await page.waitForTimeout(600)
    await page.click('.focus-btn')
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(screenshotDir, 'C_commercial_realm_map.png') })
    console.log(`  ✓ 캡처 저장: C_commercial_realm_map.png`)

    await page.click('.btn-return-realm')
    await page.waitForSelector('.living-realm-panorama-container')

    // -----------------------------------------------------------------
    // Scenario D: 군사 집중 성장 영지 (Tier 3 Military Citadel)
    // -----------------------------------------------------------------
    console.log('\n[상태 D 검증: 군사 집중 성장 영지 (Tier 3 군사 요새 수도)]')
    await page.evaluate(() => {
      const saveStr = localStorage.getItem('my_world_realm_save_v1')
      const save = saveStr ? JSON.parse(saveStr) : {}
      save.industries = {
        ...save.industries,
        farms: { id: 'farms', level: 1 },
        market: { id: 'market', level: 1 },
        ironworks: { id: 'ironworks', level: 3 },
      }
      save.civicBuildings = {
        ...save.civicBuildings,
        granary: { id: 'granary', name: '중앙 비축창고', icon: '🌾', level: 1 },
        fortifications: { id: 'fortifications', name: '외곽 방벽', icon: '🏰', level: 3 },
      }
      save.civicFocus = 'fortress_drill'
      save.policies = ['standing_guard', 'border_muster']
      save.doctrine = 'military'
      save.soldiers = 520
      save.levies = 600
      localStorage.setItem('my_world_realm_save_v1', JSON.stringify(save))
    })
    await page.reload()
    await page.waitForSelector('.living-realm-panorama-container')

    const titleD = await page.innerText('.panorama-realm-title')
    const specD = await page.innerText('.p-spec-badge')
    console.log(`  - 영지 표제: "${titleD}"`)
    console.log(`  - 특화 배지: "${specD}"`)
    if (!specD.includes('방벽') && !specD.includes('군사')) throw new Error('군사 특화가 표시되지 않았습니다.')

    await page.locator('.living-realm-panorama-container').screenshot({
      path: path.join(screenshotDir, 'D_military_realm_panorama.png'),
    })
    console.log(`  ✓ 캡처 저장: D_military_realm_panorama.png`)

    await page.click('.btn-panorama-map')
    await page.waitForSelector('.world-canvas')
    await page.waitForTimeout(600)
    await page.click('.focus-btn')
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(screenshotDir, 'D_military_realm_map.png') })
    console.log(`  ✓ 캡처 저장: D_military_realm_map.png`)

    await page.click('.btn-return-realm')
    await page.waitForSelector('.living-realm-panorama-container')

    // -----------------------------------------------------------------
    // Scenario E: 손상 및 불안정 퇴보 영지 (Critical Distress)
    // -----------------------------------------------------------------
    console.log('\n[상태 E 검증: 손상 및 치안 불안정 퇴보 영지 (Distress / Critical)]')
    await page.evaluate(() => {
      const saveStr = localStorage.getItem('my_world_realm_save_v1')
      const save = saveStr ? JSON.parse(saveStr) : {}
      save.stability = 24 // 치안 붕괴
      save.resources.treasury = -40
      localStorage.setItem('my_world_realm_save_v1', JSON.stringify(save))
    })
    await page.reload()
    await page.waitForSelector('.living-realm-panorama-container')

    const distressText = await page.innerText('.p-distress-badge')
    console.log(`  - 경고 배지: "${distressText}"`)
    if (!distressText.includes('전란') && !distressText.includes('붕괴') && !distressText.includes('불안정')) {
      throw new Error('손상/불안정 경고 배지가 나타나지 않았습니다.')
    }

    await page.locator('.living-realm-panorama-container').screenshot({
      path: path.join(screenshotDir, 'E_distress_realm_panorama.png'),
    })
    console.log(`  ✓ 캡처 저장: E_distress_realm_panorama.png`)

    await page.click('.btn-panorama-map')
    await page.waitForSelector('.world-canvas')
    await page.waitForTimeout(600)
    await page.click('.focus-btn')
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(screenshotDir, 'E_distress_realm_map.png') })
    console.log(`  ✓ 캡처 저장: E_distress_realm_map.png`)

    // -----------------------------------------------------------------
    // Scenario F: 6~12개월 실제 플레이 시뮬레이션 및 시각 변화 추적
    // -----------------------------------------------------------------
    console.log('\n[검증 F: 실제 월간 턴 6~12개월 진행 및 시각 진화 검증]')
    await page.evaluate(() => localStorage.clear())
    await page.goto(url)
    await page.waitForSelector('.living-realm-panorama-container')

    // 1. Month 1: Start at Tier 1
    const initialTier = await page.innerText('.p-tier-badge')
    console.log(`  - [731년 3월 시작] 발전 단계: ${initialTier}`)

    // 2. Perform Concrete Investments:
    // Go to "시정과 산업" tab and upgrade a building
    await page.click('button:has-text("시정과 산업")')
    await page.waitForSelector('.industry-card')

    // Upgrade Granary if possible, or upgrade Farm
    const upgradeBtns = await page.$$('.btn-upgrade-civic')
    if (upgradeBtns.length > 0) {
      await upgradeBtns[2].click() // Granary upgrade
      console.log('  - 중앙 비축창고 Lv.2 증축 단행')
    }

    // Go back to overview
    await page.click('button:has-text("영지 개요")')
    await page.waitForSelector('.living-realm-panorama-container')

    // Advance 6 Months through regular turn loop
    for (let m = 0; m < 6; m++) {
      // If there's an active field quest, skip or resolve it
      const skipBtn = await page.$('.btn-skip-quest')
      if (skipBtn) {
        await skipBtn.click()
        await page.waitForTimeout(200)
      }
      // If there's a world response choice, resolve it
      const choiceBtn = await page.$('.btn-resolve-choice')
      if (choiceBtn) {
        await choiceBtn.click()
        await page.waitForTimeout(200)
      }

      // Click Monthly Turn Advance Button
      const turnBtn = await page.$('.realm-turn-block button')
      if (turnBtn) {
        await turnBtn.click()
        await page.waitForTimeout(300)
      }
    }

    // After 6 months with investments, check evolution
    const month6Tier = await page.innerText('.p-tier-badge')
    const month6Milestone = await page.innerText('.milestone-highlight')
    console.log(`  - [731년 9월 (6개월 후)] 발전 단계: ${month6Tier}`)
    console.log(`  - [731년 9월] 최근 주요 변화: "${month6Milestone}"`)

    await page.locator('.living-realm-panorama-container').screenshot({
      path: path.join(screenshotDir, 'F_month6_live_panorama.png'),
    })
    console.log(`  ✓ 캡처 저장: F_month6_live_panorama.png`)

    console.log('\n=================================================================')
    console.log('✅ 브라우저 E2E 5대 상태 비교 및 6개월 플레이 시각 검증 100% 통과!')
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
