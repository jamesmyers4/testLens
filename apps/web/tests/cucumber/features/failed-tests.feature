@regression
Feature: Failed tests view

  Background:
    Given I am on the failed tests page for the seeded run

  Scenario: Failed view shows only failed tests
    Then I should see a "Failed Tests" heading
    And I should see "Login_WithInvalidPassword_Fails" in the test list
    And I should see "Insert_WithDuplicateKey_Throws" in the test list
    And I should not see "Login_WithValidCredentials_Passes" in the test list
    And I should not see "Login_FlakySSORedirect" in the test list

  Scenario: Error messages are visible inline without expanding
    Then I should see "Expected status 200 but got 401" inline
    And I should see "Unique constraint violation on column: email" inline

  Scenario: Page shows the total failure count
    Then I should see "2 failures" summary text
