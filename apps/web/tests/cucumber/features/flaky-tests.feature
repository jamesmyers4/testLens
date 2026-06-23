@flaky @regression
Feature: Flaky tests view

  Background:
    Given I am on the flaky tests page for the seeded run

  Scenario: Flaky view shows only flaky tests
    Then I should see a "Flaky Tests" heading
    And I should see "Login_FlakySSORedirect" in the flaky test list
    And I should not see "Login_WithValidCredentials_Passes" in the flaky test list
    And I should not see "Login_WithInvalidPassword_Fails" in the flaky test list

  Scenario: Flaky tests display retry count
    Then I should see "Login_FlakySSORedirect" in the flaky test list
    And I should see retry count information

  Scenario: Page shows flaky test count
    Then I should see "1 test" summary text

  Scenario: Page mentions sort by retry count
    Then I should see retry-related text on the page
