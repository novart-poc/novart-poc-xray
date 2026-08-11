# The @KAN-5 tag right before "Feature:" links the Test to Story KAN-5.
#
# Xray matches a Scenario to an existing Test using (in this order):
#   1. same relative feature file path AND (same "@id:..." tag OR same
#      Scenario name) -> UPDATES that Test
#   2. else: same Scenario name anywhere else in the project -> UPDATES
#      that Test
#   3. else: CREATES a new Test
#
# Because of the "OR" in rule 1, changing only the @id tag is NOT enough
# to force a new Test - if the Scenario name is unchanged, Xray still
# matches on the name and updates the existing Test.
#
# To intentionally create a new Test for a new test version, change BOTH:
#   - the "@id:..." tag
#   - the Scenario name (must not already exist elsewhere in the project)
# then commit. Changing only the steps (with id/name unchanged) instead
# updates the existing Test's definition, keeping its execution history.

@KAN-5
Feature: tests.com homepage

  @id:v1
  Scenario: "Prepare for Success" is visible on the homepage (v1)
    Given I open the page "https://www.tests.com/"
    Then the text "Prepare for Success" should be visible on the page
