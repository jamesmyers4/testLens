@regression
Feature: Run summary scorecard

  Background:
    Given I am on the run summary page for the seeded run

  Scenario: Scorecard shows all status counts
    Then I should see "Passed" in the scorecard
    And I should see "Failed" in the scorecard
    And I should see "Flaky" in the scorecard
    And I should see "Skipped" in the scorecard
    And I should see "Total" in the scorecard

  Scenario: Meta row shows run metadata
    Then I should see the framework "xunit"
    And I should see the environment "ci"
    And I should see the branch "main"
    And I should see the commit "abc1234"

  Scenario: Quick-nav tabs link to sub-views
    Then the "Suites" tab should link to the suites view
    And the "All Tests" tab should link to the tests view
    And the "Failed" tab should link to the failed view
    And the "Flaky" tab should link to the flaky view

  Scenario: Top failures preview is shown
    Then I should see "Top Failures" section
    And I should see "Login_WithInvalidPassword_Fails" in the failures list
    And I should see the error message "Expected status 200 but got 401"
