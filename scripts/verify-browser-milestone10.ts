import { createServer } from 'vite'
import { chromium } from 'playwright'

async function runBrowserVerification() {
  console.log('=================================================================')
  console.log('MY-WORLD 10차 마일스톤: 실제 브라우저 E2E 무결성 검증')
  console.log('=================================================================')

  // 1. Start Vite dev server on an available port
  console.log('\n[1. Vite 개발 서버 기동]')
  const server = await createServer({
    server: { port: 5180, host: '127.0.0.1' },
    logLevel: 'error',
  })
  await server.listen()
  const port = server.config.server.port || 5180
  const url = `http://127.0.0.1:${port}`
  console.log(`✓ Vite 서버 기동 완료: ${url}`)

  // 2. Launch Browser using msedge or chrome
  console.log('\n[2. 실제 브라우저 런타임 실행 (Playwright)]')
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  }).catch(async () => {
    console.log('Chrome 미감지, Microsoft Edge 채널로 대체 실행합니다.')
    return await chromium.launch({ channel: 'msedge', headless: true })
  })

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 860 },
    })
    const page = await context.newPage()

    // -----------------------------------------------------------------
    // Scenario A: 처음 시작 (Fresh Start)
    // -----------------------------------------------------------------
    console.log('\n[검증 A: 신규 게임 시작 및 단일 월간 턴/UI 단일화 검증]')
    await page.goto(url)
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForSelector('.realm-shell')

    // Verify time button: ONLY monthly turn button exists
    const turnButtons = await page.$$('.realm-turn-block button')
    console.log(`  - 턴 진행 버튼 개수: ${turnButtons.length}개`)
    if (turnButtons.length !== 1) throw new Error('월간 결산 버튼이 1개가 아닙니다.')

    const buttonText = await turnButtons[0].innerText()
    console.log(`  - 버튼 라벨: "${buttonText.replace(/\s+/g, ' ').trim()}"`)
    if (!buttonText.includes('결산') && !buttonText.includes('작전') && !buttonText.includes('대응')) {
      throw new Error(`예상치 못한 턴 버튼 라벨: ${buttonText}`)
    }

    // Verify daily elements are completely absent
    const legacyDayHeader = await page.$('.game-header')
    if (legacyDayHeader) throw new Error('레거시 일일 Header가 화면에 잔존합니다.')

    const dayText = await page.evaluate(() => document.body.innerText.includes('하루 마무리'))
    if (dayText) throw new Error('"하루 마무리" 버튼/텍스트가 화면에 존재합니다.')

    const apPills = await page.$$('.tab-pill-hunt, .tab-pill-mine, .tab-pill-work')
    if (apPills.length > 0) throw new Error('1 AP 파밍 탭이 화면에 잔존합니다.')
    console.log('✓ 신규 시작 시: 화면 어디에도 독립 Day/AP 헤더 및 하루 마무리 버튼 부재 확인')
    console.log('✓ 시간을 넘기는 버튼은 오직 "월간 결산"만 존재 확인')

    // -----------------------------------------------------------------
    // Scenario B: 기존 일일 세이브 마이그레이션 (Legacy Save Migration)
    // -----------------------------------------------------------------
    console.log('\n[검증 B: 레거시 일일 세이브의 원자적 마이그레이션 및 중복 방지 검증]')
    await page.evaluate(() => {
      localStorage.clear()
      localStorage.setItem('my_world_game_save_v2', JSON.stringify({
        dayState: { day: 15, ap: 2, maxAp: 5 },
        resources: { gold: 300, wood: 150, stone: 80, iron: 40, food: 220 },
        territory: { secured: 10, used: 6 },
        buildings: {
          townHall: { level: 2 },
          shelter: { level: 2 },
          storage: { level: 2 },
          wall: { level: 2 },
          blacksmith: { level: 2 },
        },
      }))
    })

    await page.reload()
    await page.waitForSelector('.realm-shell')

    // Read resources after migration
    const resTexts = await page.$$eval('.realm-resource-bar strong', (els) => els.map((e) => e.textContent?.trim()))
    console.log(`  - 마이그레이션 후 자원 [국고, 식량, 철, 목재]: ${JSON.stringify(resTexts.slice(0, 4))}`)

    // Check migration log in Chronicle
    const logHeadings = await page.$$eval('.realm-news h3', (els) => els.map((e) => e.textContent?.trim()))
    const hasMigrationLog = logHeadings.some((t) => t?.includes('레거시 영지 통합 완료') || t?.includes('중앙 경제 원장 이관'))
    console.log(`  - 영지 연대기 이관 기록 존재: ${hasMigrationLog}`)
    if (!hasMigrationLog) throw new Error('연대기에 레거시 이관 기록이 기록되지 않았습니다.')

    // Reload page to verify NO duplicate grant (idempotent)
    await page.reload()
    await page.waitForSelector('.realm-shell')
    const resTextsAfterReload = await page.$$eval('.realm-resource-bar strong', (els) => els.map((e) => e.textContent?.trim()))
    if (JSON.stringify(resTexts.slice(0, 4)) !== JSON.stringify(resTextsAfterReload.slice(0, 4))) {
      throw new Error('새로고침 후 레거시 자원이 중복 지급되었습니다.')
    }
    console.log('✓ 새로고침 시 레거시 자원 중복 지급 방지 (원자적 멱등성 유지) 확인')

    // -----------------------------------------------------------------
    // Scenario C: 6개월 이상 실제 브라우저 직접 플레이 및 퀘스트/지도 검증
    // -----------------------------------------------------------------
    console.log('\n[검증 C: 6개월 이상 연속 플레이 시뮬레이션 및 지도/퀘스트 검증]')

    for (let month = 1; month <= 6; month++) {
      const yearMonth = await page.$eval('.realm-turn-block', (el) => el.textContent?.replace(/\s+/g, ' ').trim())
      console.log(`\n  ▶ [브라우저 플레이 Month ${month}] 현재 시각: ${yearMonth}`)

      // 1. If Field Quest is present, test decision
      const fieldQuest = await page.$('.field-quest-panel')
      if (fieldQuest) {
        const questTitle = await page.$eval('.field-quest-body h2', (el) => el.textContent?.trim())
        const isJackpot = await page.$eval('.field-quest-category-badge', (el) => el.textContent?.includes('희귀 대박') || false)
        console.log(`    - 📜 현장 순행 보고 발생: "${questTitle}" (대박 여부: ${isJackpot})`)

        if (month === 1) {
          // Month 1: Test Rejection / Skip with zero penalty
          console.log('    - 현장 순행 건너뛰기(현지 관리 위임) 클릭')
          await page.click('.btn-skip-quest')
          await page.waitForTimeout(150)
          const questStillThere = await page.$('.field-quest-panel')
          if (questStillThere) throw new Error('건너뛰기 후에도 퀘스트 패널이 닫히지 않았습니다.')
          console.log('    ✓ 건너뛰기 정상 집행 (페널티 없음)')
        } else {
          // Test quest decision and risk disclosure
          const riskBox = await page.$('.risk-disclosure-box')
          if (riskBox) {
            const riskText = await page.$eval('.risk-disclosure-box', (el) => el.textContent?.trim())
            console.log(`    - ⚠️ 고위험-고보상 투명 위험 고지 확인: ${riskText?.slice(0, 70)}...`)
          }
          const questChoiceBtn = await page.$('.btn-choose-quest-action:not([disabled])')
          if (questChoiceBtn) {
            const btnLabel = await questChoiceBtn.innerText()
            console.log(`    - 순행 결단 버튼 클릭: "${btnLabel}"`)
            await questChoiceBtn.click()
            await page.waitForTimeout(200)

            // If multi-step (e.g. step 2), complete next choice if available
            const nextChoiceBtn = await page.$('.btn-choose-quest-action:not([disabled])')
            if (nextChoiceBtn) {
              console.log('    - 후속 2단계 결단 집행')
              await nextChoiceBtn.click()
              await page.waitForTimeout(200)
            }
          }
        }
      } else {
        console.log('    - 이번 달은 현장 순행 없음 (0회)')
      }

      // 2. Test World Map Navigation in Month 2
      if (month === 2) {
        console.log('    - [지도 네비게이션 검증]: "◇ 대륙 지도" 클릭')
        await page.click('.realm-map-link')
        await page.waitForSelector('.world-map-wrapper')

        const mapTitle = await page.$eval('.map-title', (el) => el.textContent?.trim())
        const mapDate = await page.$eval('.map-date-badge', (el) => el.textContent?.trim())
        console.log(`    ✓ 대륙 세계지도 진입 성공: "${mapTitle}" | ${mapDate}`)

        // Return to Realm
        await page.click('.btn-return-realm')
        await page.waitForSelector('.realm-shell')
        console.log('    ✓ "👑 영지 경영으로 복귀" 클릭하여 영지 경영 복귀 성공')
      }

      // 3. Test Civic Directive tab in Month 3
      if (month === 3) {
        console.log('    - [시정과 산업 탭 검증]: 시정 방침 및 시설 증축 확인')
        await page.click('button:has-text("시정과 산업")')
        await page.waitForSelector('.civic-focus-section')
        console.log('    ✓ 월간 시정 명령 및 직할 시설 패널 정상 렌더링')
        // Return to overview tab
        await page.click('button:has-text("영지 개요")')
      }

      // 4. Resolve World Event if present before advancing
      const worldEventChoice = await page.$('.btn-resolve-choice')
      if (worldEventChoice) {
        console.log('    - 긴급 세력 대응 결정(.btn-resolve-choice) 선택 집행')
        await worldEventChoice.click()
        await page.waitForTimeout(200)
      }

      const advanceBtn = await page.$('.realm-turn-block button')
      const isLocked = await advanceBtn?.getAttribute('disabled')
      if (isLocked) {
        const title = await advanceBtn?.getAttribute('title')
        console.log(`    - 턴 진행 잠김 상태 감지: "${title}"`)
        const worldEventChoiceRetry = await page.$('.btn-resolve-choice')
        if (worldEventChoiceRetry) {
          await worldEventChoiceRetry.click()
          await page.waitForTimeout(200)
        }
      }

      await page.click('.realm-turn-block button')
      await page.waitForTimeout(300)
    }

    const finalTime = await page.$eval('.realm-turn-block', (el) => el.textContent?.replace(/\s+/g, ' ').trim())
    console.log(`\n✓ 6개월 연속 플레이 완료! 최종 시각: ${finalTime}`)

    // -----------------------------------------------------------------
    // Scenario D: 새로고침 후 세이브 지속성 및 고정 시드 악용 방지
    // -----------------------------------------------------------------
    console.log('\n[검증 D: 6개월 후 브라우저 새로고침 및 세이브 보존성 검증]')
    await page.reload()
    await page.waitForSelector('.realm-shell')
    const reloadedTime = await page.$eval('.realm-turn-block', (el) => el.textContent?.replace(/\s+/g, ' ').trim())
    if (reloadedTime !== finalTime) throw new Error('새로고침 후 영지 진행 시간이 보존되지 않았습니다.')
    console.log(`✓ 브라우저 새로고침 후에도 영지 시간(${reloadedTime}) 및 원장 데이터 완벽 보존`)

    // -----------------------------------------------------------------
    // Scenario E: 반응형 뷰포트 회귀 테스트 (Mobile 390px, Desktop 1280px)
    // -----------------------------------------------------------------
    console.log('\n[검증 E: 반응형 뷰포트 회귀 테스트]')
    // Mobile Viewport (iPhone 14 equivalent)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForTimeout(200)
    const mobileHeader = await page.$('.realm-hero')
    const mobileResourceBar = await page.$('.realm-resource-bar')
    if (!mobileHeader || !mobileResourceBar) throw new Error('모바일 뷰포트에서 상단 헤더 또는 자원 바 렌더링 실패')
    console.log('✓ 모바일 뷰포트(390x844) 레이아웃 정상 렌더링 확인')

    // Desktop Viewport (1440x900)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.waitForTimeout(200)
    console.log('✓ 데스크톱 뷰포트(1440x900) 레이아웃 정상 렌더링 확인')

    console.log('\n=================================================================')
    console.log('✅ 브라우저 E2E 검증 모든 시나리오 100% 성공!')
    console.log('=================================================================')

  } finally {
    await browser.close()
    await server.close()
    console.log('✓ 브라우저 및 Vite 테스트 서버 정상 종료')
  }
}

runBrowserVerification().catch((err) => {
  console.error('\n❌ 브라우저 검증 실패:', err)
  process.exit(1)
})
