"""Capture frozen 2x ServicePilot UI textures for the Remotion demo.

Run while the local app is available at http://127.0.0.1:8770.
The demo data is fictional. Captures are intentionally checked into the video
project so video rendering never depends on a running service.
"""

import json
from pathlib import Path

from playwright.sync_api import sync_playwright


BASE_URL = "http://127.0.0.1:8770/"
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
ROOT = Path(__file__).resolve().parents[1]
TEXTURES = ROOT / "public" / "textures"


def capture() -> None:
    TEXTURES.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=EDGE, headless=True)
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            device_scale_factor=2,
            locale="zh-CN",
        )
        page = context.new_page()
        page.goto(BASE_URL, wait_until="networkidle")
        page.evaluate("document.fonts.ready")
        page.wait_for_timeout(600)

        page.locator('[data-sample="refund"]').click()
        with page.expect_response(lambda r: r.url.endswith("/api/agent/run") and r.status == 200):
            page.locator("#submit-button").click()
        page.locator("#result-content.result-stack").wait_for()
        page.wait_for_timeout(800)
        page.screenshot(path=str(TEXTURES / "intake-full.png"))
        page.locator(".result-panel").screenshot(path=str(TEXTURES / "result-panel.png"))

        page.locator('[data-sample="sensitive"]').click()
        with page.expect_response(lambda r: r.url.endswith("/api/agent/run") and r.status == 200):
            page.locator("#submit-button").click()
        page.locator("#result-content.result-stack").wait_for()
        page.wait_for_timeout(500)
        page.screenshot(path=str(TEXTURES / "handoff-full.png"))
        page.locator(".result-panel").screenshot(path=str(TEXTURES / "handoff-panel.png"))

        page.locator("#subject").fill("模拟工单 API 失败")
        page.locator("#description").fill("订单 ORD-20260831999 的电子发票一直没有收到。")
        page.locator("#simulate-failure").check()
        with page.expect_response(lambda r: r.url.endswith("/api/agent/run") and r.status == 200):
            page.locator("#submit-button").click()
        page.locator("#result-content.result-stack").wait_for()
        page.wait_for_timeout(500)
        page.screenshot(path=str(TEXTURES / "failure-full.png"))
        page.locator(".result-panel").screenshot(path=str(TEXTURES / "failure-panel.png"))

        page.locator('[data-view="queue"]').click()
        page.locator("#ticket-table-body tr[data-ticket-id]").first.wait_for()
        page.wait_for_timeout(600)
        page.screenshot(path=str(TEXTURES / "queue-full.png"))
        page.locator(".table-wrap").screenshot(path=str(TEXTURES / "queue-table.png"))

        page.locator('[data-view="insights"]').click()
        page.locator("#evaluation-metrics strong").first.wait_for()
        page.wait_for_timeout(600)
        page.screenshot(path=str(TEXTURES / "insights-full.png"))
        page.locator("#insights-view .panel").nth(0).screenshot(path=str(TEXTURES / "evaluation-panel.png"))
        page.locator("#insights-view .panel").nth(1).screenshot(path=str(TEXTURES / "roi-panel.png"))

        layout = page.evaluate(
            """() => Object.fromEntries([
              ['kpis', '.kpi-grid'],
              ['evaluation', '#insights-view .panel:nth-of-type(1)'],
              ['roi', '#insights-view .panel:nth-of-type(2)'],
              ['tabs', '.view-tabs']
            ].map(([key, selector]) => {
              const r = document.querySelector(selector).getBoundingClientRect();
              return [key, {x:r.x, y:r.y, w:r.width, h:r.height}];
            }))"""
        )
        (TEXTURES / "layout.json").write_text(
            json.dumps(layout, ensure_ascii=False, indent=2), encoding="utf-8"
        )

        context.close()
        browser.close()


if __name__ == "__main__":
    capture()
    print(f"Captured ServicePilot textures in {TEXTURES}")
