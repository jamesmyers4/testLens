@smoke @regression
Feature: Project management

  @smoke
  Scenario: Home page shows project list
    Given I navigate to the home page
    Then I should see a "Projects" heading
    And I should see the seeded test project in the list

  Scenario: New Project link navigates to creation form
    Given I navigate to the home page
    When I click "New Project"
    Then I should be on the new project page

  @smoke
  Scenario: Creating a project redirects to project dashboard
    Given I navigate to the new project page
    When I fill in the project name "BDD New Project"
    And I fill in the project slug with a unique value
    And I submit the create project form
    Then I should be redirected to the new project dashboard
    And I should see the project name "BDD New Project"

  Scenario: Empty project shows no-runs state with upload link
    Given I navigate to the new project page
    When I fill in the project name "BDD Empty Project"
    And I fill in the project slug with a unique value
    And I submit the create project form
    Then I should see a "no runs yet" message
    And I should see an upload link

  Scenario: Project dashboard shows run history after seeding
    Given I navigate to the seeded project dashboard
    Then I should see a run history table
