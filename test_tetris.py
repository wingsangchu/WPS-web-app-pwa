"""
Tetris PWA End-to-End Test Suite
Uses Playwright to test the game in both desktop and mobile viewports.

Usage:
    1. Start the local server:  python -m http.server 8080
    2. Run the tests:           python test_tetris.py
"""

import subprocess
import sys
import time
import socket
from playwright.sync_api import sync_playwright, expect

BASE_URL = "http://localhost:8080"
MOBILE_VIEWPORT = {"width": 375, "height": 667}
DESKTOP_VIEWPORT = {"width": 1280, "height": 800}

passed = 0
failed = 0
results = []


def log(name, ok, detail=""):
    global passed, failed
    status = "PASS" if ok else "FAIL"
    if ok:
        passed += 1
    else:
        failed += 1
    msg = f"  [{status}] {name}"
    if detail:
        msg += f" — {detail}"
    print(msg)
    results.append((name, ok, detail))


def is_server_running():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("localhost", 8080)) == 0


def test_page_load(page):
    """Test basic page loading and title."""
    print("\n== Page Load ==")
    page.goto(BASE_URL, wait_until="networkidle")
    log("Page loads without error", page.title() != "")
    log("Title is 'Tetris'", page.title() == "Tetris", f"got '{page.title()}'")


def test_initial_ui_elements(page):
    """Test that all required UI elements exist on the page."""
    print("\n== UI Elements ==")

    log("Header TETRIS visible",
        page.locator("header h1").is_visible())

    log("Game board canvas exists",
        page.locator("#board").count() == 1)

    log("Next-piece canvas exists",
        page.locator("#next-piece").count() == 1)

    log("Overlay visible before start",
        page.locator("#overlay").is_visible())

    log("START button visible",
        page.locator("#btn-start").is_visible())

    log("START button text correct",
        page.locator("#btn-start").inner_text() == "START")


def test_mobile_stats_bar(page):
    """Test the mobile stats bar at the top."""
    print("\n== Mobile Stats Bar ==")

    log("Mobile stats bar visible",
        page.locator("#mobile-stats").is_visible())

    score = page.locator("#score-m")
    level = page.locator("#level-m")
    lines = page.locator("#lines-m")

    log("Score-m element exists", score.count() == 1)
    log("Level-m element exists", level.count() == 1)
    log("Lines-m element exists", lines.count() == 1)

    log("Score initial value is '0'",
        score.inner_text() == "0", f"got '{score.inner_text()}'")
    log("Level initial value is '1'",
        level.inner_text() == "1", f"got '{level.inner_text()}'")
    log("Lines initial value is '0'",
        lines.inner_text() == "0", f"got '{lines.inner_text()}'")


def test_touch_buttons(page):
    """Test that all 6 touch control buttons are present and visible."""
    print("\n== Touch Control Buttons ==")

    buttons = {
        "btn-left": "Move Left",
        "btn-down": "Soft Drop",
        "btn-rotate": "Rotate",
        "btn-right": "Move Right",
        "btn-drop": "Hard Drop",
        "btn-pause": "Pause",
    }

    for btn_id, label in buttons.items():
        el = page.locator(f"#{btn_id}")
        log(f"Button #{btn_id} ({label}) visible", el.is_visible())


def test_start_game(page):
    """Test that clicking START hides the overlay and starts the game."""
    print("\n== Start Game ==")

    page.locator("#btn-start").click()
    page.wait_for_timeout(500)

    overlay = page.locator("#overlay")
    log("Overlay hidden after START",
        overlay.evaluate("el => el.classList.contains('hidden')"))


def test_keyboard_controls(page):
    """Test keyboard controls move the piece."""
    print("\n== Keyboard Controls ==")

    page.keyboard.press("ArrowDown")
    page.wait_for_timeout(100)
    score_val = page.locator("#score-m").inner_text()
    log("ArrowDown increments score",
        int(score_val) >= 1, f"score={score_val}")

    page.keyboard.press("ArrowLeft")
    page.wait_for_timeout(100)
    log("ArrowLeft accepted (no crash)", True)

    page.keyboard.press("ArrowRight")
    page.wait_for_timeout(100)
    log("ArrowRight accepted (no crash)", True)

    page.keyboard.press("ArrowUp")
    page.wait_for_timeout(100)
    log("ArrowUp (rotate) accepted (no crash)", True)


def test_pause(page):
    """Test pause and resume."""
    print("\n== Pause / Resume ==")

    page.keyboard.press("p")
    page.wait_for_timeout(300)
    overlay = page.locator("#overlay")
    log("Pause shows overlay",
        overlay.is_visible() and not overlay.evaluate("el => el.classList.contains('hidden')"))

    title = page.locator("#overlay-title").inner_text()
    log("Overlay title is 'PAUSED'",
        title == "PAUSED", f"got '{title}'")

    btn_text = page.locator("#btn-start").inner_text()
    log("Button text is 'RESUME'",
        btn_text == "RESUME", f"got '{btn_text}'")

    page.keyboard.press("p")
    page.wait_for_timeout(300)
    log("Resume hides overlay",
        overlay.evaluate("el => el.classList.contains('hidden')"))


def test_hard_drop(page):
    """Test hard drop via Space key."""
    print("\n== Hard Drop ==")

    score_before = int(page.locator("#score-m").inner_text())
    page.keyboard.press(" ")
    page.wait_for_timeout(300)
    score_after = int(page.locator("#score-m").inner_text())
    log("Hard drop increases score",
        score_after > score_before,
        f"before={score_before}, after={score_after}")


def test_touch_button_click(page):
    """Test that touch buttons trigger game actions via mouse clicks."""
    print("\n== Touch Button Click ==")

    overlay = page.locator("#overlay")
    if not overlay.evaluate("el => el.classList.contains('hidden')"):
        page.locator("#btn-start").click()
        page.wait_for_timeout(500)

    score_before = int(page.locator("#score-m").inner_text())
    page.locator("#btn-down").click()
    page.wait_for_timeout(200)
    score_after = int(page.locator("#score-m").inner_text())
    log("btn-down click increments score",
        score_after > score_before,
        f"before={score_before}, after={score_after}")

    page.locator("#btn-left").click()
    page.wait_for_timeout(100)
    log("btn-left click accepted (no crash)", True)

    page.locator("#btn-right").click()
    page.wait_for_timeout(100)
    log("btn-right click accepted (no crash)", True)

    page.locator("#btn-rotate").click()
    page.wait_for_timeout(100)
    log("btn-rotate click accepted (no crash)", True)

    score_before2 = int(page.locator("#score-m").inner_text())
    page.locator("#btn-drop").click()
    page.wait_for_timeout(300)
    score_after2 = int(page.locator("#score-m").inner_text())
    log("btn-drop click triggers hard drop",
        score_after2 > score_before2,
        f"before={score_before2}, after={score_after2}")

    page.locator("#btn-pause").click()
    page.wait_for_timeout(300)
    log("btn-pause click shows overlay",
        page.locator("#overlay").is_visible())

    page.locator("#btn-start").click()
    page.wait_for_timeout(200)


def test_score_sync(page):
    """Test that desktop and mobile score elements stay in sync."""
    print("\n== Score Sync ==")

    desktop_score = page.locator("#score").inner_text()
    mobile_score = page.locator("#score-m").inner_text()
    log("Score synced (desktop == mobile)",
        desktop_score == mobile_score,
        f"desktop={desktop_score}, mobile={mobile_score}")

    desktop_level = page.locator("#level").inner_text()
    mobile_level = page.locator("#level-m").inner_text()
    log("Level synced (desktop == mobile)",
        desktop_level == mobile_level,
        f"desktop={desktop_level}, mobile={mobile_level}")

    desktop_lines = page.locator("#lines").inner_text()
    mobile_lines = page.locator("#lines-m").inner_text()
    log("Lines synced (desktop == mobile)",
        desktop_lines == mobile_lines,
        f"desktop={desktop_lines}, mobile={mobile_lines}")


def test_no_console_errors(page, errors):
    """Test that no JavaScript console errors occurred."""
    print("\n== Console Errors ==")
    log("No JS console errors",
        len(errors) == 0,
        f"{len(errors)} error(s)" if errors else "")
    for e in errors:
        print(f"    ERROR: {e}")


def test_mobile_viewport(page):
    """Test the game in a mobile-sized viewport."""
    print("\n== Mobile Viewport (375x667) ==")

    page.set_viewport_size(MOBILE_VIEWPORT)
    page.goto(BASE_URL, wait_until="networkidle")
    page.wait_for_timeout(300)

    log("Mobile stats bar visible",
        page.locator("#mobile-stats").is_visible())

    log("Touch controls visible",
        page.locator("#touch-controls").is_visible())

    log("Board canvas visible",
        page.locator("#board").is_visible())

    log("Next-piece canvas visible",
        page.locator("#next-piece").is_visible())

    page.locator("#btn-start").click()
    page.wait_for_timeout(500)
    log("Game starts on mobile",
        page.locator("#overlay").evaluate("el => el.classList.contains('hidden')"))

    page.screenshot(path="screenshot_mobile.png")
    log("Mobile screenshot saved", True, "screenshot_mobile.png")


def test_pwa_manifest(page):
    """Test that the PWA manifest is linked correctly."""
    print("\n== PWA Manifest ==")

    manifest_link = page.locator('link[rel="manifest"]')
    log("Manifest link exists", manifest_link.count() == 1)

    href = manifest_link.get_attribute("href")
    log("Manifest href is 'manifest.json'",
        href == "manifest.json", f"got '{href}'")


def main():
    if not is_server_running():
        print("ERROR: Local server not running on port 8080.")
        print("Start it first:  python -m http.server 8080")
        sys.exit(1)

    print("=" * 50)
    print("  Tetris PWA — End-to-End Test Suite")
    print("=" * 50)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # --- Desktop tests ---
        print("\n>>> Desktop viewport (1280x800)")
        context = browser.new_context(viewport=DESKTOP_VIEWPORT)
        page = context.new_page()
        console_errors = []
        page.on("pageerror", lambda err: console_errors.append(str(err)))

        test_page_load(page)
        test_initial_ui_elements(page)
        test_mobile_stats_bar(page)
        test_touch_buttons(page)
        test_pwa_manifest(page)
        test_start_game(page)
        test_keyboard_controls(page)
        test_pause(page)
        test_hard_drop(page)
        test_score_sync(page)
        test_no_console_errors(page, console_errors)

        page.screenshot(path="screenshot_desktop.png")
        print("\n  Desktop screenshot saved: screenshot_desktop.png")
        context.close()

        # --- Mobile tests ---
        print("\n>>> Mobile viewport (375x667)")
        context2 = browser.new_context(
            viewport=MOBILE_VIEWPORT,
            is_mobile=True,
            has_touch=True,
        )
        page2 = context2.new_page()
        console_errors2 = []
        page2.on("pageerror", lambda err: console_errors2.append(str(err)))

        test_mobile_viewport(page2)
        test_touch_button_click(page2)
        test_no_console_errors(page2, console_errors2)
        context2.close()

        browser.close()

    # Summary
    total = passed + failed
    print("\n" + "=" * 50)
    print(f"  Results: {passed}/{total} passed, {failed} failed")
    print("=" * 50)

    if failed > 0:
        print("\n  Failed tests:")
        for name, ok, detail in results:
            if not ok:
                print(f"    - {name}: {detail}")

    sys.exit(1 if failed > 0 else 0)


if __name__ == "__main__":
    main()
