# The @KAN-5 tag right before "Feature:" links the Test created during
# the feature import to Story KAN-5.
#
# IMPORTANT (one-time step): After this feature file has been imported
# once via /api/v2/import/feature, Xray creates a new Test issue
# (e.g. KAN-6). Please add that key here as an additional tag
# (e.g. "@KAN-5 @KAN-6") so future feature imports update the same
# Test instead of creating a new one, and so the execution import
# references the correct Test.

@KAN-5
Feature: tests.com homepage

  Scenario: "Prepare for Success" is visible on the homepage
    Given I open the page "https://www.tests.com/"
    Then the text "Prepare for Success" should be visible on the page
