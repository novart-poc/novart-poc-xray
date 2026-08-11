# The @KAN-5 tag right before "Feature:" links the Test to Story KAN-5.
# On every CI run, this file is re-imported via /api/v2/import/feature,
# which creates a brand new Test issue and links it to KAN-5 automatically.

@KAN-5 
Feature: tests.com homepage
  @id:Version-2
  Scenario: "Prepare for Success" is visible on the homepage
    Given I open the page "https://www.tests.com/"
    Then the text "Prepare for Success Error" should be visible on the page
