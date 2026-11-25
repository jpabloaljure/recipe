## ADDED Requirements

### Requirement: The Recipe button opens the sheet where the unmute button is over the video
Where there is no room for the panel and the unmute button is over the video,
a "Recipe" button SHALL sit over the video's bottom-right corner, directly above
the place of the unmute button, and keep that place when the unmute button is
hidden. Tapping it SHALL open the recipe sheet instantly, with no extra network
request. The button SHALL have the accessible name "Recipe", SHALL NOT be shown
while the sheet is open, for a title-only video or where the panel is shown.

#### Scenario: Tap the Recipe button
- **GIVEN** a video with a recipe is active, there is no room for the panel and the unmute button is over the video
- **WHEN** I tap the "Recipe" button
- **THEN** the sheet opens instantly with no extra network request

#### Scenario: The button's place with sound off (manual)
- **GIVEN** sound is off, there is no room for the panel and the unmute button is over the video
- **WHEN** a video with a recipe becomes active
- **THEN** the "Recipe" button sits in the bottom-right corner directly above the unmute button, above the player's control bar

#### Scenario: The button's place with sound on
- **GIVEN** sound is on, so the unmute button is hidden, and there is no room for the panel
- **WHEN** a video with a recipe becomes active
- **THEN** the "Recipe" button sits in the same place, directly above where the unmute button would be

#### Scenario: The button's name
- **GIVEN** there is no room for the panel and the unmute button is over the video
- **WHEN** a video with a recipe becomes active
- **THEN** the "Recipe" button has the accessible name "Recipe"

#### Scenario: The button while the sheet is open
- **GIVEN** there is no room for the panel
- **WHEN** I open the sheet
- **THEN** the "Recipe" button is not shown

#### Scenario: A title-only video on a screen without room
- **GIVEN** there is no room for the panel
- **WHEN** a `needs_recipe` video becomes active
- **THEN** there is no "Recipe" button and no sheet

### Requirement: The sheet shows the recipe
The sheet SHALL show the same content as the panel: servings, ingredients with
their quantities, numbered steps, a label with the recipe's source and a link
to the original video, a missing serving size, quantity or unit being left out.
It SHALL open scrolled to the top, also when it is opened again after being
scrolled and closed.

#### Scenario: The sheet shows the recipe's content
- **GIVEN** a video with a recipe is active and there is no room for the panel
- **WHEN** I open the sheet
- **THEN** it shows servings, ingredients with their quantities and numbered steps, scrolled to the top

#### Scenario: The sheet names the source
- **GIVEN** the sheet is open and there is no room for the panel
- **WHEN** I look at the recipe
- **THEN** it shows the source label with a link to the original video

#### Scenario: A missing serving size or quantity in the sheet
- **GIVEN** the active video's recipe has a missing serving size or quantity and there is no room for the panel
- **WHEN** I open the sheet
- **THEN** the missing item is left out, with no empty label

#### Scenario: Open the sheet again
- **GIVEN** I scrolled the recipe in the sheet and closed it
- **WHEN** I open the sheet again
- **THEN** the recipe is shown scrolled to the top

### Requirement: The sheet covers only the video and leaves the player's controls free
The sheet SHALL have a semi-transparent black background that lets the video
show dimly behind it, SHALL cover only the video's area and SHALL leave the
player's control zones at the top and at the bottom free, so the player's
controls receive taps. The unmute button SHALL stay visible and tappable above
the sheet, and tapping it SHALL turn sound on and leave the sheet open.

#### Scenario: A translucent sheet
- **GIVEN** a video with a recipe is active and there is no room for the panel
- **WHEN** I open the sheet
- **THEN** it has a semi-transparent black background that lets the video show dimly behind it

#### Scenario: The sheet covers only the video's area
- **GIVEN** a video with a recipe is active and there is no room for the panel
- **WHEN** I open the sheet
- **THEN** it covers only the video's area

#### Scenario: The player's control zones stay free (manual)
- **GIVEN** a video with a recipe is active and there is no room for the panel
- **WHEN** I open the sheet
- **THEN** it leaves the player's control zones at the top and at the bottom free

#### Scenario: A tap on a player control with the sheet open (manual)
- **GIVEN** the sheet is open and there is no room for the panel
- **WHEN** I tap a player control in the top or bottom zone
- **THEN** the player handles the tap

#### Scenario: Tap the unmute button with the sheet open
- **GIVEN** the sheet is open, there is no room for the panel, the unmute button is over the video and sound is off
- **WHEN** I tap the unmute button
- **THEN** sound turns on
- **AND** the sheet stays open

### Requirement: The sheet closes with its button and when the video changes
A close button with the accessible name "Close recipe" and the Escape key SHALL be
the only ways to close the sheet. Opening the sheet SHALL move keyboard focus to the
close button, and closing it SHALL return focus to the "Recipe" button. Closing it SHALL show the "Recipe" button again and leave the
video visible and playing. The sheet SHALL also close when the active video
changes, and the "Recipe" button SHALL be shown for the new video.

#### Scenario: Close the sheet
- **GIVEN** the sheet is open and there is no room for the panel
- **WHEN** I tap its close button
- **THEN** the sheet closes
- **AND** the "Recipe" button is shown

#### Scenario: The close button's name
- **GIVEN** there is no room for the panel
- **WHEN** I open the sheet
- **THEN** its close button has the accessible name "Close recipe"

#### Scenario: Close the sheet with Escape
- **GIVEN** the sheet is open and there is no room for the panel
- **WHEN** I press Escape
- **THEN** the sheet closes
- **AND** keyboard focus is on the "Recipe" button

#### Scenario: Focus moves into the sheet
- **GIVEN** there is no room for the panel
- **WHEN** I open the sheet
- **THEN** keyboard focus is on its close button

#### Scenario: The video keeps playing
- **GIVEN** the sheet is open and there is no room for the panel
- **WHEN** I tap its close button
- **THEN** the video is still visible and playing

#### Scenario: Another video becomes active with the sheet open
- **GIVEN** the sheet is open and there is no room for the panel
- **WHEN** the active video changes
- **THEN** the sheet is closed
- **AND** the "Recipe" button is shown

### Requirement: Scrolling on the sheet never moves the feed
A vertical swipe on the sheet SHALL scroll only the recipe, also when the recipe
is shorter than the sheet or the scroll has reached its end, and SHALL NOT change
the active video.

#### Scenario: A recipe taller than the sheet
- **GIVEN** the sheet is open, there is no room for the panel and the recipe is taller than the sheet
- **WHEN** I swipe vertically on it
- **THEN** only the recipe scrolls
- **AND** the active video does not change, and I can reach the last step

#### Scenario: A recipe shorter than the sheet
- **GIVEN** the sheet is open, there is no room for the panel and the recipe is shorter than the sheet
- **WHEN** I swipe vertically on it
- **THEN** the active video does not change

### Requirement: A turn or resize across the panel's switch swaps the sheet and the panel
When a phone is turned, or a window is resized, so that there is room for the
panel, the panel SHALL open beside the video and the "Recipe" button and the
sheet SHALL be gone; when it ends with no room, the panel SHALL be closed and
the "Recipe" button shown. An open sheet SHALL also close when the screen's aspect
ratio crosses 3/4, where the "Recipe" button appears or disappears. Playback and
sound SHALL NOT change.

#### Scenario: Turn a phone from landscape to portrait
- **GIVEN** a phone shows the recipe panel beside the video in landscape
- **WHEN** I turn it to portrait, with no room for the panel
- **THEN** the panel is closed
- **AND** the "Recipe" button is shown, and playback and sound do not change

#### Scenario: Turn a phone with the button from portrait to landscape
- **GIVEN** a phone shows the "Recipe" button in portrait
- **WHEN** I turn it to landscape, with room for the panel
- **THEN** the recipe panel is open beside the video
- **AND** the "Recipe" button is gone, and playback and sound do not change

#### Scenario: Turn a phone with the sheet open from portrait to landscape
- **GIVEN** a phone shows the open sheet in portrait
- **WHEN** I turn it to landscape, with room for the panel
- **THEN** the recipe panel is open beside the video
- **AND** the sheet and the "Recipe" button are gone, and playback and sound do not change
