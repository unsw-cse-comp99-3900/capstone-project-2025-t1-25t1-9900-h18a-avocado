import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import StaleElementReferenceException, NoSuchElementException
import time

@pytest.fixture(scope="module")
def driver():
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--window-size=1920,1080')
    driver = webdriver.Chrome(options=options)
    driver.get("http://localhost:3000")
    yield driver
    driver.quit()

def test_topbar_renders_logo_and_title(driver):
    assert "Future Drought Explorer System" in driver.page_source
    logo = driver.find_element(By.TAG_NAME, "img")
    assert logo.get_attribute("alt") == "logo"

def test_sidebar_ui_text(driver):
    assert "Functions" in driver.page_source
    assert "Explanations" in driver.page_source
    assert driver.find_element(By.XPATH, "//button[contains(text(), 'Submit Filters')]")

def test_sidebar_threshold_input_and_submit(driver):
    input_box = driver.find_element(By.XPATH, "//input[@placeholder='-1']")
    input_box.clear()
    input_box.send_keys("0.5")
    submit_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Submit Filters')]")
    submit_btn.click()
    time.sleep(1)

def test_sidebar_dropdown_labels_present(driver):
    for label in ["Definition", "Drought Index", "Time Frames", "Source", "Scenario"]:
        assert label in driver.page_source

def test_sidebar_threshold_input_exists(driver):
    input_box = driver.find_element(By.XPATH, "//input[@placeholder='-1']")
    assert input_box is not None

def test_sidebar_explanation_dialogs(driver):
    labels = ['SPI', 'SPEI', 'PDSI', 'Calculation Methods', 'Climate Models']
    for label in labels:
        try:
            button = driver.find_element(By.XPATH, f"//button[contains(text(), '{label}')]")
            button.click()
            time.sleep(0.5)
            dialog = driver.find_element(By.XPATH, "//div[@role='dialog']")
            assert "Explanation" in dialog.text
            close_button = dialog.find_element(By.XPATH, ".//button[contains(text(), 'Close')]")
            close_button.click()
            time.sleep(0.5)
        except (NoSuchElementException, StaleElementReferenceException):
            continue

def test_legend_labels_and_colors(driver):
    assert "Positive Change" in driver.page_source
    assert "Negative Change" in driver.page_source
    assert "No Change" in driver.page_source
    for label in ["Positive Change", "Negative Change", "No Change"]:
        el = driver.find_element(By.XPATH, f"//*[contains(text(), '{label}')]/preceding-sibling::*")
        assert el is not None

def test_submit_button_enabled(driver):
    submit_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Submit Filters')]")
    assert submit_btn.is_enabled()

def test_explanations_section_buttons_exist(driver):
    for label in ['SPI', 'SPEI', 'PDSI', 'Calculation Methods', 'Climate Models']:
        btn = driver.find_element(By.XPATH, f"//button[contains(text(), '{label}')]")
        assert btn is not None

def test_threshold_input_accepts_numbers(driver):
    input_box = driver.find_element(By.XPATH, "//input[@placeholder='-1']")
    input_box.clear()
    input_box.send_keys("1.23")
    assert input_box.get_attribute("value") == "1.23"

if __name__ == "__main__":
    import pytest
    pytest.main(["-v", __file__])
