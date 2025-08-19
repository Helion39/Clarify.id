from playwright.sync_api import sync_playwright, expect

def run(playwright):
    # Desktop viewport
    desktop_browser = playwright.chromium.launch(headless=True)
    desktop_context = desktop_browser.new_context()
    desktop_page = desktop_context.new_page()

    # Mobile viewport
    mobile_browser = playwright.chromium.launch(headless=True)
    mobile_context = mobile_browser.new_context(**playwright.devices['iPhone 13'])
    mobile_page = mobile_context.new_page()

    try:
        # --- Desktop Tests ---
        print("Running desktop tests...")
        desktop_page.goto("http://localhost:5000", timeout=20000)

        # 1. Verify old navbar links are gone
        expect(desktop_page.get_by_role("link", name="Video")).not_to_be_visible()
        expect(desktop_page.get_by_role("link", name="Pools")).not_to_be_visible()
        expect(desktop_page.get_by_role("link", name="Magazine")).not_to_be_visible()
        print("- Old navbar links are not visible.")

        # 2. Verify new layout
        expect(desktop_page.get_by_role("heading", name="Popular Topics")).to_be_visible(timeout=15000)
        print("- 'Popular Topics' section is visible.")

        # Check for the main feed heading
        expect(desktop_page.get_by_role("heading", name="All News")).to_be_visible(timeout=15000)
        print("- 'All News' section is visible.")

        # Take a screenshot of the desktop view
        desktop_page.screenshot(path="jules-scratch/verification/desktop_view.png")
        print("- Desktop screenshot captured.")

        # --- Mobile Tests ---
        print("\nRunning mobile tests...")
        mobile_page.goto("http://localhost:5000", timeout=20000)

        # 1. Verify sidebar is initially hidden
        sidebar = mobile_page.get_by_text("CATEGORIES")
        expect(sidebar).not_to_be_visible()
        print("- Sidebar is hidden on mobile by default.")

        # 2. Click the toggle button to open the sidebar
        toggle_button = mobile_page.get_by_role("button", name="Open sidebar") # Assuming an aria-label for the button
        # The button in header.tsx has no name, so I'll use a different selector
        toggle_button = mobile_page.locator('header button:has(svg[class*="lucide-menu"])')
        expect(toggle_button).to_be_visible()
        toggle_button.click()
        print("- Clicked sidebar toggle button.")

        # 3. Verify sidebar is now visible
        expect(sidebar).to_be_visible()
        print("- Sidebar is visible after toggle.")

        # Take a screenshot of the mobile view with sidebar open
        mobile_page.screenshot(path="jules-scratch/verification/mobile_view_sidebar_open.png")
        print("- Mobile screenshot captured.")

        print("\nScript completed successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")
        desktop_page.screenshot(path="jules-scratch/verification/error_desktop.png")
        mobile_page.screenshot(path="jules-scratch/verification/error_mobile.png")

    finally:
        desktop_browser.close()
        mobile_browser.close()

with sync_playwright() as playwright:
    run(playwright)
