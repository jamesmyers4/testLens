@smoke @regression
Feature: Upload test run JSON

  Background:
    Given I am on the upload page for the test project

  Scenario: Upload page renders dropzone
    Then I should see the file drop zone
    And I should see a browse file button

  Scenario: Uploading invalid JSON shows error message
    When I upload an invalid JSON file
    Then I should see a schema error message

  @smoke
  Scenario: Uploading valid JSON redirects to run summary
    When I upload a valid test run report
    Then I should be redirected to a run summary page
