@settings @regression
Feature: API key management

  Background:
    Given I navigate to the settings page

  Scenario: Settings page renders API key section
    Then I should see a "Settings" heading
    And I should see an "API Keys" heading
    And I should see a "Create Key" button

  Scenario: Creating a key shows the raw value with copy button
    When I click the "Create Key" button
    And I enter the key name "BDD Test Key"
    And I submit the create key form
    Then I should see a read-only key input with a value
    And I should see a "Copy" button

  Scenario: Raw value is not shown after dialog closes
    When I click the "Create Key" button
    And I enter the key name "BDD Close Test Key"
    And I submit the create key form
    And I close the dialog
    Then the raw key value should no longer be visible

  Scenario: Revoking a key removes it from the list
    When I click the "Create Key" button
    And I enter the key name "BDD Revoke Test Key"
    And I submit the create key form
    And I close the dialog
    And I revoke the key named "BDD Revoke Test Key"
    Then "BDD Revoke Test Key" should not appear in the key list
