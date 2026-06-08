export const en = {
  // App-wide
  'app.name': 'La Busche',
  'app.tagline': 'Sofia Transit · Live Arrivals',
  'app.footer': 'Sofia Urban Mobility · GTFS Live Data',

  // Metadata (browser title / PWA name)
  'meta.title': 'La Busche',
  'meta.description': 'Personal virtual timetable for Sofia public transport',

  // Welcome / About
  'welcome.tagline': 'Your personal virtual timetable for Sofia public transport.',
  'welcome.point1.title': 'Personal virtual timetable',
  'welcome.point1.desc': 'Live arrival times for the stops and lines you actually use.',
  'welcome.point2.title': 'Your stops, your lines',
  'welcome.point2.desc': 'Build a route shortcut for each place you travel to and from.',
  'welcome.point3.title': 'Works on any device',
  'welcome.point3.desc': 'No install — runs in any mobile or desktop browser. You can add it to your phone screen for quick access.',
  'welcome.point4.title': 'Optional Dropbox sync',
  'welcome.point4.desc': 'Back up your setup and share it across devices.',
  'welcome.credit': 'Transit data provided by Sofia Urban Mobility Center (CC BY-SA).',
  'welcome.cta': 'Set up my first route',
  'welcome.skip': 'Skip for now',
  'welcome.close': 'Close',
  'welcome.about': 'About',
  'welcome.language_note': 'Available in English and Bulgarian',

  // Loading states
  'loading.cold_start': 'Fetching transit data…',
  'loading.arrivals': 'Getting arrivals…',

  // Home screen
  'home.empty.title': 'No routes yet',
  'home.empty.message': 'Tap ⚙️ to set up your commute',
  'home.empty.cta': 'Set up commute',
  'home.setup.aria': 'Open setup',
  'home.tab.from_home': '🏠 From Home',
  'home.tab.to_home': '🏡 To Home',
  'home.empty.from_home.title': 'No From Home routes yet',
  'home.empty.to_home.title': 'No To Home routes yet',
  'home.empty.from_home.message': 'Tap ⚙️ to add your first outbound destination.',
  'home.empty.to_home.message': 'Tap ⚙️ to add your first return destination.',

  // Category labels
  'category.from_home': 'From Home',
  'category.to_home': 'To Home',

  // Setup page
  'setup.title': 'Setup',
  'setup.done': 'Done',
  'setup.add': '+ Add route',
  'setup.empty': 'No routes yet.\nTap "+ Add route" to get started.',
  'setup.tiles_section': 'Your routes',
  'setup.export': 'Export config',
  'setup.import': 'Import config',
  'setup.import.invalid': 'Invalid config file. Please select a valid La Busche config.',
  'setup.import.confirm': 'This will replace your {current} current routes with {imported} routes from the file. Continue?',
  'setup.delete.confirm': 'Delete this route?',
  'setup.config_section': 'Config',
  'setup.tile.edit.aria': 'Edit route',
  'setup.tile.delete.aria': 'Delete route',
  'setup.tile_not_found': 'Route not found',
  'setup.back_to_setup': 'Back to setup',
  'setup.import.title': 'Import config?',
  'setup.import.replace': 'Replace',
  'setup.language_section': 'Language',

  // Dropbox sync
  'sync.section_title': 'Dropbox Sync',
  'sync.connecting': 'Connecting to Dropbox…',
  'sync.no_key.before': 'Dropbox sync is not configured. Set',
  'sync.no_key.after': 'and redeploy.',
  'sync.dropbox_account': 'Dropbox account',
  'sync.last_synced': 'Last synced: {time}',
  'sync.sync_now': 'Sync now',
  'sync.syncing': 'Syncing…',
  'sync.disconnect': 'Disconnect',
  'sync.connect': 'Connect Dropbox',
  'sync.error.sync_failed': 'Sync failed. Check your connection and try again.',
  'sync.error.connect_failed': 'Could not connect to Dropbox. Please try again.',
  'sync.restore.title': 'Dropbox backup found',
  'sync.restore.before_date': 'Your Dropbox has a backup from',
  'sync.restore.before_count': 'with',
  'sync.restore.tile_one': '{count} route',
  'sync.restore.tile_other': '{count} routes',
  'sync.restore.after': 'Restore it, or start fresh? Starting fresh will replace the backup with your current empty state.',
  'sync.restore.start_fresh': 'Start Fresh',
  'sync.restore.restore': 'Restore',

  // Wizard — general
  'wizard.cancel': 'Cancel',
  'wizard.back': 'Back',
  'wizard.next': 'Next',
  'wizard.save': 'Save route',
  'wizard.save_changes': 'Save changes',

  // Wizard — step 1
  'wizard.step1.title': 'Basics',
  'wizard.step1.category_label': 'Direction',
  'wizard.step1.from_home': '🏠 From Home',
  'wizard.step1.to_home': '🏡 To Home',
  'wizard.step1.label_label': 'Label for this route',
  'wizard.step1.label_placeholder': 'e.g. Main office',
  'wizard.step1.emoji_label': 'Icon',

  // Wizard — step 2
  'wizard.step2.title': 'Pick a stop',
  'wizard.step2.placeholder': 'Search by name or number…',
  'wizard.step2.searching': 'Searching…',
  'wizard.step2.no_results': 'No stops found',
  'wizard.step2.lines_count': '{count} lines',
  'wizard.step2.selected_hint': 'Currently selected · search to change',

  // Wizard — step 3
  'wizard.step3.title': 'Choose lines',
  'wizard.step3.select_all': 'Select all',
  'wizard.step3.deselect_all': 'Deselect all',
  'wizard.step3.buses': 'Buses',
  'wizard.step3.trolleybuses': 'Trolleybuses',
  'wizard.step3.trams': 'Trams',
  'wizard.step3.all_hint': 'All lines will be shown',
  'wizard.step3.lines_selected': '{count} lines selected',

  // Wizard — step 4
  'wizard.step4.title': 'Review',
  'wizard.step4.direction': 'Direction',
  'wizard.step4.label': 'Label',
  'wizard.step4.stop': 'Stop',
  'wizard.step4.lines': 'Lines',
  'wizard.step4.all_lines': 'All lines',

  // Board
  'board.back': 'Back',
  'board.refreshing': 'Refreshing…',
  'board.no_departures': 'No departures in the next 30 minutes',
  'board.no_departures_line': 'No {lines} departures found right now',
  'board.auto_refresh': 'Auto-refreshes every 30 seconds',
  'board.error': 'Could not load departures',
  'board.try_again': 'Try again',
  'board.unknown': 'Unknown destination',
  'board.all_lines': 'All lines · 30 min / 5 trips',
  'board.filtered_lines': '{lines} only',
  'board.now': 'Now',
  'board.min': 'min',
  'board.status.on_time': 'On time',
  'board.status.early': 'Early',
  'board.delay': '+{minutes} min',
  'board.refresh.aria': 'Refresh',
  'board.stop_label': 'stop',
  'board.footer': 'La Busche · Sofia Transit',
} as const;

export type TranslationKey = keyof typeof en;
