# Der @KAN-5-Tag direkt vor "Feature:" verlinkt den beim Feature-Import
# automatisch erzeugten Test mit der Story KAN-5.
#
# WICHTIG (einmaliger Schritt): Nachdem dieses Feature-File das erste Mal
# per /api/v2/import/feature importiert wurde, erzeugt Xray einen neuen
# Test-Issue (z. B. KAN-6). Diesen Key bitte hier als zusaetzlichen Tag
# ergaenzen (z. B. "@KAN-5 @KAN-6"), damit spaetere Feature-Importe
# denselben Test aktualisieren statt einen neuen anzulegen, und damit der
# Execution-Import den richtigen Test referenziert.

@KAN-5
Feature: Startseite von tests.com

  Scenario: "Prepare for Success" ist auf der Startseite sichtbar
    Given ich oeffne die Seite "https://www.tests.com/"
    Then sollte der Text "Prepare for Success" auf der Seite sichtbar sein
