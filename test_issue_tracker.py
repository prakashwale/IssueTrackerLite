import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
from selenium.webdriver.chrome.options import Options
import time

class TestIssueTracker:
    def setup_method(self):
        """Set up Chrome driver before each test"""
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        self.driver = webdriver.Chrome(options=chrome_options)
        self.driver.implicitly_wait(10)
        
    def teardown_method(self):
        """Clean up after each test"""
        if hasattr(self, 'driver'):
            self.driver.quit()
    
    def login_user(self, username="testuser", password="testpass"):
        """Helper method to login a user"""
        self.driver.get("https://issue-tracker-lite.vercel.app/login.html")
        
        # Clear any existing localStorage
        self.driver.execute_script("localStorage.clear();")
        
        # Create test user in localStorage
        self.driver.execute_script("""
            localStorage.setItem('users', JSON.stringify({
                'testuser': 'testpass'
            }));
        """)
        
        # Fill and submit login form
        username_field = self.driver.find_element(By.ID, "loginUsername")
        username_field.send_keys(username)
        
        password_field = self.driver.find_element(By.ID, "loginPassword")
        password_field.send_keys(password)
        
        login_button = self.driver.find_element(By.CSS_SELECTOR, "#loginForm button[type='submit']")
        login_button.click()
        
        # Wait for redirect to index.html
        WebDriverWait(self.driver, 10).until(
            EC.url_contains("index.html")
        )
    
    def test_successful_login(self):
        """Test successful login with valid credentials"""
        # Navigate to login page on Vercel
        self.driver.get("https://issue-tracker-lite.vercel.app/login.html")
        
        # Clear any existing localStorage
        self.driver.execute_script("localStorage.clear();")
        
        # Create test user in localStorage
        self.driver.execute_script("""
            localStorage.setItem('users', JSON.stringify({
                'testuser': 'testpass'
            }));
        """)
        
        # Find and fill username field
        username_field = self.driver.find_element(By.ID, "loginUsername")
        username_field.send_keys("testuser")
        
        # Find and fill password field
        password_field = self.driver.find_element(By.ID, "loginPassword")
        password_field.send_keys("testpass")
        
        # Submit the form
        login_button = self.driver.find_element(By.CSS_SELECTOR, "#loginForm button[type='submit']")
        login_button.click()
        
        # Wait for redirect and verify we're on the main page
        WebDriverWait(self.driver, 10).until(
            EC.url_contains("index.html")
        )
        
        # Check for both logout buttons and assert at least one is visible
        logout_btn_visible = False
        try:
            logout_btn = self.driver.find_element(By.ID, "logoutBtn")
            if logout_btn.is_displayed():
                logout_btn_visible = True
        except Exception:
            pass
        try:
            logout_btn_desktop = self.driver.find_element(By.ID, "logoutBtn-desktop")
            if logout_btn_desktop.is_displayed():
                logout_btn_visible = True
        except Exception:
            pass
        assert logout_btn_visible, "Neither logoutBtn nor logoutBtn-desktop is visible after login"
        
        # Verify user is logged in by checking localStorage
        is_logged_in = self.driver.execute_script("return localStorage.getItem('isLoggedIn');")
        assert is_logged_in == "true"
        
        # Verify current user is set
        current_user = self.driver.execute_script("return localStorage.getItem('currentUser');")
        assert current_user == "testuser"
    
    def test_add_new_issue(self):
        """Test adding a new issue with all required fields"""
        # Login first
        self.login_user()
        
        # Wait for page to load
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.ID, "issueForm"))
        )
        
        # Fill in the issue form
        title_field = self.driver.find_element(By.ID, "title")
        title_field.send_keys("Test Issue Title")
        
        description_field = self.driver.find_element(By.ID, "description")
        description_field.send_keys("This is a test issue description")
        
        priority_select = Select(self.driver.find_element(By.ID, "priority"))
        priority_select.select_by_value("High")
        
        # Submit the form
        submit_button = self.driver.find_element(By.CSS_SELECTOR, "#issueForm button[type='submit']")
        submit_button.click()
        
        # Wait for success message
        WebDriverWait(self.driver, 10).until(
            EC.text_to_be_present_in_element((By.ID, "issueDisplay"), "Issue added!")
        )
        
        # Verify issue appears in the table
        table_body = self.driver.find_element(By.ID, "issueTableBody")
        rows = table_body.find_elements(By.TAG_NAME, "tr")
        
        # Should have one row with our issue
        assert len(rows) == 1
        
        # Verify issue details
        first_row = rows[0]
        cells = first_row.find_elements(By.TAG_NAME, "td")
        
        assert "Test Issue Title" in cells[0].text
        assert "High" in cells[1].text
        assert "This is a test issue description" in cells[2].text
        assert "Open" in cells[3].text
        
        # Verify issue was saved to localStorage
        issues = self.driver.execute_script("""
            return JSON.parse(localStorage.getItem('user_issues'))['testuser'];
        """)
        assert len(issues) == 1
        assert issues[0]['title'] == "Test Issue Title"
        assert issues[0]['priority'] == "High"
        assert issues[0]['status'] == "Open"
    
    def test_filter_by_priority(self):
        """Test filtering issues by priority level"""
        # Login first
        self.login_user()
        
        # Set up test issues
        test_issues = [
            {"title": "High Priority Task", "description": "Important task", "priority": "High", "status": "Open"},
            {"title": "Low Priority Task", "description": "Not urgent", "priority": "Low", "status": "Open"},
            {"title": "Medium Priority Task", "description": "Regular task", "priority": "Medium", "status": "Open"}
        ]
        
        self.driver.execute_script("""
            localStorage.setItem('user_issues', JSON.stringify({
                'testuser': arguments[0]
            }));
        """, test_issues)
        
        # Refresh page to apply localStorage changes
        self.driver.refresh()
        
        # Wait for page to load
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.ID, "issueTableBody"))
        )
        
        # Verify all three issues are initially visible
        table_body = self.driver.find_element(By.ID, "issueTableBody")
        rows = table_body.find_elements(By.TAG_NAME, "tr")
        assert len(rows) == 3
        
        # Filter by High priority
        priority_filter = Select(self.driver.find_element(By.ID, "filterPriority"))
        priority_filter.select_by_value("High")
        
        # Wait for table to update
        time.sleep(1)
        
        # Verify only high priority issue is visible
        rows = table_body.find_elements(By.TAG_NAME, "tr")
        assert len(rows) == 1
        assert "High Priority Task" in rows[0].text
        
        # Test sorting functionality
        sort_select = Select(self.driver.find_element(By.ID, "sortIssues"))
        sort_select.select_by_value("priorityHigh")
        
        # Wait for sort to apply
        time.sleep(1)
        
        # Verify issues are sorted by priority (High first)
        rows = table_body.find_elements(By.TAG_NAME, "tr")
        assert len(rows) == 1  # Still filtered by High priority
        assert "High Priority Task" in rows[0].text
        
        # Clear filter and verify all issues are visible again
        priority_filter.select_by_value("All")
        time.sleep(1)
        rows = table_body.find_elements(By.TAG_NAME, "tr")
        assert len(rows) == 3  # All issues visible again
        
        # Test status filtering
        status_filter = Select(self.driver.find_element(By.ID, "filterResolved"))
        status_filter.select_by_value("unresolved")
        time.sleep(1)
        
        # Should still show all 3 issues since they're all "Open" (unresolved)
        rows = table_body.find_elements(By.TAG_NAME, "tr")
        assert len(rows) == 3

    def test_logout_functionality(self):
        """Test that logout button logs the user out and redirects to login page"""
        # Navigate to login page
        self.driver.get("https://issue-tracker-lite.vercel.app/login.html")
        self.driver.execute_script("localStorage.clear();")
        self.driver.execute_script("""
            localStorage.setItem('users', JSON.stringify({
                'testuser': 'testpass'
            }));
        """)
        username_field = self.driver.find_element(By.ID, "loginUsername")
        username_field.send_keys("testuser")
        password_field = self.driver.find_element(By.ID, "loginPassword")
        password_field.send_keys("testpass")
        login_button = self.driver.find_element(By.CSS_SELECTOR, "#loginForm button[type='submit']")
        login_button.click()
        WebDriverWait(self.driver, 10).until(
            EC.url_contains("index.html")
        )
        # Click the visible logout button (mobile or desktop)
        try:
            logout_btn = self.driver.find_element(By.ID, "logoutBtn")
            if logout_btn.is_displayed():
                logout_btn.click()
        except Exception:
            pass
        try:
            logout_btn_desktop = self.driver.find_element(By.ID, "logoutBtn-desktop")
            if logout_btn_desktop.is_displayed():
                logout_btn_desktop.click()
        except Exception:
            pass
        # Wait for redirect to login page
        WebDriverWait(self.driver, 10).until(
            EC.url_contains("login.html")
        )
        # Verify isLoggedIn is removed from localStorage
        is_logged_in = self.driver.execute_script("return localStorage.getItem('isLoggedIn');")
        assert is_logged_in is None

if __name__ == "__main__":
    # Run tests if file is executed directly
    pytest.main([__file__, "-v"]) 