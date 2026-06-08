# La Busche — Translation Reference

Every user-facing string in the codebase, grouped by screen/feature.
Fill in the **BG** column, then hand this file back to wire up `lib/i18n/bg.ts`.

Variables are written as `{variableName}` — keep them verbatim in translations.

---

## App-wide

---

### app.name

Context: Brand name displayed throughout the app (header wordmark text "Busche" part is styled separately; this key is used for the overall identity).
EN: `La Busche`
BG:

---

### app.tagline

Context: Subtitle shown below the wordmark on the Home screen header.
EN: `Sofia Transit · Live Arrivals`
BG:

---

### app.footer

Context: Footer credit line on the Home screen and Setup screen.
EN: `Sofia Urban Mobility · GTFS Live Data`
BG:

---

## Metadata (browser / PWA)

---

### meta.title

Context: Browser tab title and PWA name (set in `app/layout.tsx` metadata — currently hardcoded, documented here for reference).
EN: `La Busche`
BG:

---

### meta.description

Context: HTML meta description and PWA short description.
EN: `Personal Sofia public transport arrivals`
BG:

---

## Welcome / About

---

### welcome.tagline

Context: Subtitle on the Welcome screen shown to first-time users and on the About page.
EN: `Your personal Sofia transit board.`
BG:

---

### welcome.point1.title

Context: Heading for feature point 1 on the Welcome screen (⏱️ icon).
EN: `Personal transit times`
BG:

---

### welcome.point1.desc

Context: Body text for feature point 1 on the Welcome screen.
EN: `Live arrivals for the stops and lines you actually use.`
BG:

---

### welcome.point2.title

Context: Heading for feature point 2 on the Welcome screen (🚏 icon).
EN: `Your stops, your lines`
BG:

---

### welcome.point2.desc

Context: Body text for feature point 2 on the Welcome screen.
EN: `Build a tile for each place you travel to and from.`
BG:

---

### welcome.point3.title

Context: Heading for feature point 3 on the Welcome screen (📱 icon).
EN: `Works on any device`
BG:

---

### welcome.point3.desc

Context: Body text for feature point 3 on the Welcome screen.
EN: `No install — runs in any mobile or desktop browser.`
BG:

---

### welcome.point4.title

Context: Heading for feature point 4 on the Welcome screen (☁️ icon).
EN: `Optional Dropbox sync`
BG:

---

### welcome.point4.desc

Context: Body text for feature point 4 on the Welcome screen.
EN: `Back up your setup and share it across devices.`
BG:

---

### welcome.credit

Context: Attribution line at the bottom of the Welcome screen.
EN: `Transit data provided by Sofia Urban Mobility Center (CC BY-SA).`
BG:

---

### welcome.cta

Context: Primary action button on the Welcome screen (first-run mode). Navigates to the new-tile wizard.
EN: `Set up my first stop`
BG:

---

### welcome.skip

Context: Secondary action button on the Welcome screen (first-run mode). Dismisses the screen without setting up.
EN: `Skip for now`
BG:

---

### welcome.close

Context: Button on the Welcome screen when viewed as the About page (not first-run). Goes back.
EN: `Close`
BG:

---

### welcome.about

Context: Link in the footer of the Home screen and Setup screen that opens the About page.
EN: `About`
BG: `За приложението`

---

### welcome.language_note

Context: Single line shown on the Welcome screen (below the credit line) indicating the app is available in both languages.
EN: `Available in English and Bulgarian`
BG: `Достъпно на английски и на български`

---

## Loading States

---

### loading.cold_start

Context: Full-screen loading message shown while GTFS static data is being fetched on the server at cold start.
EN: `Fetching transit data…`
BG:

---

### loading.arrivals

Context: Loading message shown inside the departure Board screen while fetching arrivals.
EN: `Getting arrivals…`
BG:

---

## Home Screen

---

### home.setup.aria

Context: Accessible label (aria-label) on the ⚙️ gear icon button in the Home screen header that opens Setup.
EN: `Open setup`
BG:

---

### home.tab.from_home

Context: Label on the "From Home" tab button on the Home screen tab switcher.
EN: `🏠 From Home`
BG:

---

### home.tab.to_home

Context: Label on the "To Home" tab button on the Home screen tab switcher.
EN: `🏡 To Home`
BG:

---

### home.empty.from_home.title

Context: Heading of the empty state shown on the Home screen when the "From Home" tab has no tiles yet.
EN: `No From Home tiles yet`
BG:

---

### home.empty.to_home.title

Context: Heading of the empty state shown on the Home screen when the "To Home" tab has no tiles yet.
EN: `No To Home tiles yet`
BG:

---

### home.empty.from_home.message

Context: Body text of the empty state on the Home screen for the "From Home" tab.
EN: `Tap ⚙️ to add your first outbound destination.`
BG:

---

### home.empty.to_home.message

Context: Body text of the empty state on the Home screen for the "To Home" tab.
EN: `Tap ⚙️ to add your first return destination.`
BG:

---

### home.empty.cta

Context: Button in the empty state on the Home screen that links to Setup.
EN: `Set up commute`
BG:

---

### home.empty.title

Context: Generic "no tiles" heading (legacy key, kept for completeness; tab-specific keys above are used in the component).
EN: `No tiles yet`
BG:

---

### home.empty.message

Context: Generic empty state message (legacy key; tab-specific keys above are used in the component).
EN: `Tap ⚙️ to set up your commute`
BG:

---

## Category Labels

---

### category.from_home

Context: Plain label for the "From Home" direction category (without emoji). Used internally for category display.
EN: `From Home`
BG:

---

### category.to_home

Context: Plain label for the "To Home" direction category (without emoji).
EN: `To Home`
BG:

---

## Setup Screen

---

### setup.title

Context: Page heading in the Setup screen header (centre of the navigation bar).
EN: `Setup`
BG:

---

### setup.done

Context: Navigation button in the top-left of the Setup screen that returns to the Home screen.
EN: `Done`
BG:

---

### setup.tiles_section

Context: Section label above the list of tiles in Setup (shown only when at least one tile exists).
EN: `Your tiles`
BG:

---

### setup.empty

Context: Message shown in the tile list area when no tiles have been created yet. Contains a newline.
EN: `No tiles yet.\nTap "+ Add tile" to get started.`
BG:

---

### setup.add

Context: Label on the dashed "+ Add tile" button at the bottom of the tile list.
EN: `+ Add tile`
BG:

---

### setup.delete.confirm

Context: Browser confirm() dialog text when the user taps the delete (🗑️) button for a tile.
EN: `Delete this tile?`
BG:

---

### setup.tile.edit.aria

Context: Accessible label (aria-label) on the ✏️ edit button in each tile row.
EN: `Edit tile`
BG:

---

### setup.tile.delete.aria

Context: Accessible label (aria-label) on the 🗑️ delete button in each tile row.
EN: `Delete tile`
BG:

---

### setup.tile_not_found

Context: Error message shown on the Edit Tile page when the tile ID from the URL is not found in the config.
EN: `Tile not found`
BG:

---

### setup.back_to_setup

Context: Link text on the Edit Tile error page ("← Back to setup") — the arrow ← is rendered in the component.
EN: `Back to setup`
BG:

---

### setup.config_section

Context: Section label above the Export / Import buttons in Setup.
EN: `Config`
BG:

---

### setup.export

Context: Button label for exporting the config as a JSON file.
EN: `Export config`
BG:

---

### setup.import

Context: Button label for importing a config from a JSON file.
EN: `Import config`
BG:

---

### setup.import.invalid

Context: Error message shown in a toast when the selected import file is not a valid config.
EN: `Invalid config file. Please select a valid La Busche config.`
BG:

---

### setup.import.title

Context: Heading of the import confirmation dialog.
EN: `Import config?`
BG:

---

### setup.import.confirm

Context: Body text of the import confirmation dialog. `{current}` = number of existing tiles; `{imported}` = number of tiles in the file.
EN: `This will replace your {current} current tiles with {imported} tiles from the file. Continue?`
BG:

---

### setup.import.replace

Context: Confirm button in the import dialog that replaces the current tiles.
EN: `Replace`
BG: `Замени`

---

### setup.language_section

Context: Section label above the two language option buttons in the Setup screen (shown at the top, above the route list).
EN: `Language`
BG: `Език`

---

## Sync (Dropbox)

---

### sync.section_title

Context: Section label above the Dropbox sync controls in Setup.
EN: `Dropbox Sync`
BG:

---

### sync.connecting

Context: Message shown while the OAuth exchange is in progress after returning from Dropbox authorization.
EN: `Connecting to Dropbox…`
BG:

---

### sync.no_key.before

Context: First part of the message shown when the Dropbox app key is not configured. Followed by a `<code>NEXT_PUBLIC_LA_BUSCHE_DROPBOX_APP_KEY</code>` element, then `sync.no_key.after`.
EN: `Dropbox sync is not configured. Set`
BG:

---

### sync.no_key.after

Context: Second part of the unconfigured-key message (after the env var code element).
EN: `and redeploy.`
BG:

---

### sync.dropbox_account

Context: Fallback display name for the connected Dropbox account when no display name is returned by the API.
EN: `Dropbox account`
BG:

---

### sync.last_synced

Context: Line in the connected-account card showing when the last sync occurred. `{time}` = formatted relative time (e.g. "2 minutes ago").
EN: `Last synced: {time}`
BG:

---

### sync.sync_now

Context: Button label to trigger a manual sync when Dropbox is connected and idle.
EN: `Sync now`
BG:

---

### sync.syncing

Context: Button label replacing "Sync now" while a sync is in progress.
EN: `Syncing…`
BG:

---

### sync.disconnect

Context: Button label to disconnect the Dropbox account.
EN: `Disconnect`
BG:

---

### sync.connect

Context: Button label to start the Dropbox OAuth flow (when key is configured but not yet connected).
EN: `Connect Dropbox`
BG:

---

### sync.error.sync_failed

Context: Error message shown below the sync buttons when a manual sync fails.
EN: `Sync failed. Check your connection and try again.`
BG:

---

### sync.error.connect_failed

Context: Error message shown when the OAuth code exchange fails after returning from Dropbox.
EN: `Could not connect to Dropbox. Please try again.`
BG:

---

### sync.restore.title

Context: Heading of the restore-from-backup dialog shown when Dropbox has a backup and local config is empty.
EN: `Dropbox backup found`
BG:

---

### sync.restore.before_date

Context: First text segment of the restore dialog body, before the date span. Full sentence structure: "[before_date] {DATE} [before_count] {TILE_COUNT}. [after]"
EN: `Your Dropbox has a backup from`
BG:

---

### sync.restore.before_count

Context: Connector word between the date and the tile count in the restore dialog body.
EN: `with`
BG:

---

### sync.restore.tile_one

Context: Tile count label in the restore dialog when count = 1. `{count}` = 1.
EN: `{count} tile`
BG:

---

### sync.restore.tile_other

Context: Tile count label in the restore dialog when count ≠ 1. `{count}` = the number.
EN: `{count} tiles`
BG:

---

### sync.restore.after

Context: Final text segment of the restore dialog body, after the tile count.
EN: `Restore it, or start fresh? Starting fresh will replace the backup with your current empty state.`
BG:

---

### sync.restore.start_fresh

Context: Button in the restore dialog that discards the Dropbox backup and starts with an empty config.
EN: `Start Fresh`
BG:

---

### sync.restore.restore

Context: Button in the restore dialog that loads the Dropbox backup as the current config.
EN: `Restore`
BG:

---

## Wizard — General

---

### wizard.cancel

Context: Button shown in step 1 of the tile wizard (top-left) that exits the wizard and goes back to Setup. Also used as the Cancel button in the import confirmation dialog.
EN: `Cancel`
BG:

---

### wizard.back

Context: Button shown in steps 2–4 of the tile wizard (top-left) to go to the previous step.
EN: `Back`
BG:

---

### wizard.next

Context: Primary action button in wizard steps 1–3 to advance to the next step.
EN: `Next`
BG:

---

### wizard.save

Context: Primary action button in wizard step 4 (new tile mode) to save the tile.
EN: `Save tile`
BG:

---

### wizard.save_changes

Context: Primary action button in wizard step 4 (edit tile mode) to save changes.
EN: `Save changes`
BG:

---

## Wizard — Step 1: Basics

---

### wizard.step1.title

Context: Step title shown in the wizard header navigation bar for step 1.
EN: `Basics`
BG:

---

### wizard.step1.category_label

Context: Section label above the direction (category) selector in step 1.
EN: `Direction`
BG:

---

### wizard.step1.from_home

Context: Label on the "From Home" category button in step 1. Also appears in the step 4 review.
EN: `🏠 From Home`
BG:

---

### wizard.step1.to_home

Context: Label on the "To Home" category button in step 1. Also appears in the step 4 review.
EN: `🏡 To Home`
BG:

---

### wizard.step1.label_label

Context: Input field label for the tile name / label in step 1.
EN: `Label`
BG:

---

### wizard.step1.label_placeholder

Context: Placeholder text inside the tile name input field in step 1.
EN: `e.g. Main office`
BG:

---

### wizard.step1.emoji_label

Context: Section label above the emoji picker in step 1.
EN: `Icon`
BG:

---

## Wizard — Step 2: Pick a Stop

---

### wizard.step2.title

Context: Step title shown in the wizard header for step 2.
EN: `Pick a stop`
BG:

---

### wizard.step2.placeholder

Context: Placeholder text in the stop search input in step 2.
EN: `Search by name or number…`
BG:

---

### wizard.step2.searching

Context: Inline search indicator shown while a stop search request is in flight.
EN: `Searching…`
BG:

---

### wizard.step2.no_results

Context: Message shown when the stop search returns no results.
EN: `No stops found`
BG:

---

### wizard.step2.lines_count

Context: Badge on each stop result showing how many lines serve that stop. `{count}` = number of lines.
EN: `{count} lines`
BG:

---

### wizard.step2.selected_hint

Context: Small hint text shown below the currently-selected stop card in step 2 (when it is not in the current search results).
EN: `Currently selected · search to change`
BG:

---

## Wizard — Step 3: Choose Lines

---

### wizard.step3.title

Context: Step title shown in the wizard header for step 3.
EN: `Choose lines`
BG:

---

### wizard.step3.all_hint

Context: Helper text shown at the top of the line picker when no lines are selected, indicating all lines will be shown on the board.
EN: `All lines will be shown`
BG:

---

### wizard.step3.lines_selected

Context: Helper text shown at the top of the line picker when one or more lines are selected. `{count}` = number of selected lines.
EN: `{count} lines selected`
BG:

---

### wizard.step3.select_all

Context: Button to select all available lines in step 3.
EN: `Select all`
BG:

---

### wizard.step3.deselect_all

Context: Button to deselect all selected lines in step 3 (shown when all are selected).
EN: `Deselect all`
BG:

---

### wizard.step3.trams

Context: Section heading above the tram line buttons in step 3.
EN: `Trams`
BG:

---

### wizard.step3.trolleybuses

Context: Section heading above the trolleybus line buttons in step 3.
EN: `Trolleybuses`
BG:

---

### wizard.step3.buses

Context: Section heading above the bus line buttons in step 3.
EN: `Buses`
BG:

---

## Wizard — Step 4: Review

---

### wizard.step4.title

Context: Step title shown in the wizard header for step 4.
EN: `Review`
BG:

---

### wizard.step4.direction

Context: Row label in the review summary for the tile direction.
EN: `Direction`
BG:

---

### wizard.step4.label

Context: Row label in the review summary for the tile label/name.
EN: `Label`
BG:

---

### wizard.step4.stop

Context: Row label in the review summary for the selected stop.
EN: `Stop`
BG:

---

### wizard.step4.lines

Context: Row label in the review summary for the selected lines.
EN: `Lines`
BG:

---

### wizard.step4.all_lines

Context: Value shown in the Lines row of the review summary when no specific lines are selected (all lines will be shown).
EN: `All lines`
BG:

---

## Board (Departure Board)

---

### board.back

Context: Back navigation link in the top-left of the Board screen header.
EN: `Back`
BG:

---

### board.refresh.aria

Context: Accessible label (aria-label) on the ↻ refresh button in the Board screen header.
EN: `Refresh`
BG:

---

### board.refreshing

Context: Small animated label shown in the header while a background refresh is in progress.
EN: `Refreshing…`
BG:

---

### board.all_lines

Context: Subtitle under the tile name in the Board header when no line filter is active.
EN: `All lines · 30 min / 5 trips`
BG:

---

### board.filtered_lines

Context: Subtitle under the tile name in the Board header when specific lines are filtered. `{lines}` = comma-separated line names.
EN: `{lines} only`
BG:

---

### board.stop_label

Context: The word "stop" used in the stop reference line below the Board header (e.g. "Витоша · stop 1234"). The stop name from GTFS data comes before it; the stop ID comes after.
EN: `stop`
BG:

---

### board.now

Context: Countdown value shown in place of a number when a departure is imminent (≤ 0 minutes away).
EN: `Now`
BG:

---

### board.min

Context: Unit label shown below the minute countdown number on each departure row.
EN: `min`
BG:

---

### board.status.on_time

Context: Status chip label on a departure row when the vehicle is on schedule.
EN: `On time`
BG:

---

### board.status.early

Context: Status chip label on a departure row when the vehicle is running ahead of schedule.
EN: `Early`
BG:

---

### board.delay

Context: Status chip label on a departure row when the vehicle is delayed. `{minutes}` = delay in whole minutes.
EN: `+{minutes} min`
BG:

---

### board.no_departures

Context: Empty state message on the Board when no departures are found in the next 30 minutes (no line filter active).
EN: `No departures in the next 30 minutes`
BG:

---

### board.no_departures_line

Context: Empty state message on the Board when no departures are found for the filtered lines. `{lines}` = comma-separated line names.
EN: `No {lines} departures found right now`
BG:

---

### board.auto_refresh

Context: Sub-text below the empty state on the Board reminding the user the board refreshes automatically.
EN: `Auto-refreshes every 30 seconds`
BG:

---

### board.error

Context: Error heading on the Board when the departures request fails.
EN: `Could not load departures`
BG:

---

### board.try_again

Context: Retry link shown below the error message on the Board.
EN: `Try again`
BG:

---

### board.unknown

Context: Message shown on the Board when the tile ID in the URL does not match any saved tile.
EN: `Unknown destination`
BG:

---

### board.footer

Context: Footer brand line at the very bottom of the Board screen.
EN: `La Busche · Sofia Transit`
BG:

---

## About Page

---

### about.back.aria

Context: Accessible label (aria-label) on the ← back button in the About page header that returns to Home.
EN: `Back to home`
BG: `Назад към началото`

---

### about.intro

Context: Opening paragraph on the About page, shown directly below the brand header.
EN: `A personal Sofia public transport app, built because I got tired of checking the stops in Google Maps.`
BG: `Лично приложение за градския транспорт в София, направено защото се изморих да проверявам спирките в Google Maps.`

---

### about.section.what

Context: Section heading for the "What it does" block on the About page.
EN: `What it does`
BG: `Какво прави`

---

### about.what.body

Context: Body text of the "What it does" section on the About page.
EN: `Shows live and scheduled departures for stops you care about, organised into From Home and To Home views. You configure your own stops once, and it just works. No account. No ads. No data collected.`
BG: `Показва пристигания на живо и по разписание за спирките, които те интересуват, наредени в изгледи „От вкъщи" и „Към вкъщи". Настройваш спирките си веднъж — и работи. Без акаунт. Без реклами. Без събиране на данни.`

---

### about.section.data

Context: Section heading for the data attribution block on the About page.
EN: `Data`
BG: `Данни`

---

### about.data.body

Context: Body text of the "Data" section describing the data source and licence.
EN: `Transit data is provided by Sofia Urban Mobility Center under Creative Commons Attribution 4.0 International (CC BY 4.0).`
BG: `Данните за транспорта са предоставени от Център за градска мобилност, София по лиценз Creative Commons Признание 4.0 Международен (CC BY 4.0).`

---

### about.data.source

Context: Monospaced source line in the Data section (not a link, plain text).
EN: `Source: gtfs.sofiatraffic.bg`
BG: `Източник: gtfs.sofiatraffic.bg`

---

### about.data.license

Context: Monospaced licence line in the Data section (not a link, plain text).
EN: `License: creativecommons.org/licenses/by/4.0`
BG: `Лиценз: creativecommons.org/licenses/by/4.0`

---

### about.section.opensource

Context: Section heading for the open source block on the About page.
EN: `Open source`
BG: `Отворен код`

---

### about.opensource.body

Context: Body text of the "Open source" section.
EN: `The source code is published under the MIT License and available on GitHub. You can self-host it, fork it, or adapt it for another city's GTFS feed.`
BG: `Изходният код е публикуван под лиценз MIT и е достъпен в GitHub. Можеш да го хостваш сам, да го разклониш или да го адаптираш за GTFS данни на друг град.`

---

### about.opensource.link

Context: Monospaced GitHub link line in the Open source section (plain text, not an anchor).
EN: `→ github.com/coldkubernetes/la-busche`
BG: `→ github.com/coldkubernetes/la-busche`

---

### about.section.disclaimer

Context: Section heading for the disclaimer block on the About page.
EN: `Disclaimer`
BG: `Отказ от отговорност`

---

### about.disclaimer.body

Context: Body text of the "Disclaimer" section.
EN: `This app is provided as-is, with no warranty of any kind. Departure times depend on open data feeds that may be delayed, incomplete, or temporarily unavailable. Don't use this as your only source of truth when timing matters.`
BG: `Приложението се предоставя „такова, каквото е", без никаква гаранция. Времената на тръгване зависят от отворени данни, които може да са забавени, непълни или временно недостъпни. Не го използвай като единствен ориентир, когато времето е от значение.`

---

### about.section.contact

Context: Section heading for the contact block on the About page. The email address itself is hardcoded and not translated.
EN: `Contact`
BG: `Контакт`
