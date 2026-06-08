import type { TranslationKey } from './en';

export const bg: Partial<Record<TranslationKey, string>> = {
  // App-wide
  'app.name': 'La Busche',
  'app.tagline': 'Градски транспорт София · на живо',
  'app.footer': 'ЦГМ · GTFS данни на живо',

  // Metadata
  'meta.title': 'La Busche',
  'meta.description': 'Лично виртуално табло за градския транспорт в София',

  // Welcome / About
  'welcome.tagline': 'Твоето лично виртуално табло за градския транспорт в София.',
  'welcome.point1.title': 'Лично виртуално табло',
  'welcome.point1.desc': 'Виртуално табло на живо за спирките и линиите, които реално ползваш.',
  'welcome.point2.title': 'Твоите спирки, твоите линии',
  'welcome.point2.desc': 'Направи маршрут за всяко място, до което пътуваш или от което се връщаш.',
  'welcome.point3.title': 'Работи на всяко устройство',
  'welcome.point3.desc': 'Без инсталация — работи в браузъра на телефона и компютъра. Можете да добдавите на екрана на телефона за бърз достъп.',
  'welcome.point4.title': 'Възможност за Dropbox синхронизация',
  'welcome.point4.desc': 'Запази backup на настройките и ги ползвай на различни устройства.',
  'welcome.credit': 'Данните за градския транспорт са предоставени от Център за градска мобилност (CC BY-SA).',
  'welcome.cta': 'Настрой първия си маршрут',
  'welcome.skip': 'Пропусни засега',
  'welcome.close': 'Затвори',
  'welcome.about': 'За приложението',
  'welcome.language_note': 'Достъпно на английски и на български',

  // Loading states
  'loading.cold_start': 'Зареждам данните за транспорта…',
  'loading.arrivals': 'Зареждам пристиганията…',

  // Home screen
  'home.empty.title': 'Още няма маршрути',
  'home.empty.message': 'Натисни ⚙️, за да настроиш маршрута си',
  'home.empty.cta': 'Настрой маршрут',
  'home.setup.aria': 'Отвори настройките',
  'home.tab.from_home': '🏠 От вкъщи',
  'home.tab.to_home': '🏡 Към вкъщи',
  'home.empty.from_home.title': 'Още няма маршрути в посока от вкъщи',
  'home.empty.to_home.title': 'Още няма маршрути в посока към вкъщи',
  'home.empty.from_home.message': 'Натисни ⚙️, за да добавиш първия маршрут от вкъщи.',
  'home.empty.to_home.message': 'Натисни ⚙️, за да добавиш първи маршрут за връщане.',

  // Category labels
  'category.from_home': 'От вкъщи',
  'category.to_home': 'Към вкъщи',

  // Setup page
  'setup.title': 'Настройки',
  'setup.done': 'Готово',
  'setup.add': '+ Добави маршрут',
  'setup.empty': 'Още няма маршрути.\nНатисни "+ Добави маршрут", за да започнеш.',
  'setup.tiles_section': 'Твоите маршрути',
  'setup.export': 'Запази настройки във файл',
  'setup.import': 'Зареди настройки от файл',
  'setup.import.invalid': 'Файлът не изглежда валиден. Избери валидна конфигурация за La Busche.',
  'setup.import.confirm': 'Това ще замени текущите ти маршрути ({current}) с маршрутите от файла ({imported}). Продължаваме ли?',
  'setup.delete.confirm': 'Да изтрия ли този маршрут?',
  'setup.config_section': 'Конфигурация',
  'setup.tile.edit.aria': 'Редактирай маршрут',
  'setup.tile.delete.aria': 'Изтрий маршрут',
  'setup.tile_not_found': 'Маршрутът не е намерен',
  'setup.back_to_setup': 'Назад към настройките',
  'setup.import.title': 'Да заредя ли настройките?',
  'setup.import.replace': 'Замени',
  'setup.language_section': 'Език',

  // Dropbox sync
  'sync.section_title': 'Dropbox синхронизация',
  'sync.connecting': 'Свързване с Dropbox…',
  'sync.no_key.before': 'Синхронизацията с Dropbox не е настроена. Добави',
  'sync.no_key.after': 'и публикувай отново.',
  'sync.dropbox_account': 'Dropbox account',
  'sync.last_synced': 'Последна синхронизация: {time}',
  'sync.sync_now': 'Синхронизирай',
  'sync.syncing': 'Синхронизиране…',
  'sync.disconnect': 'Разкачи',
  'sync.connect': 'Свържи Dropbox',
  'sync.error.sync_failed': 'Синхронизацията беше неуспешна. Провери връзката и опитай пак.',
  'sync.error.connect_failed': 'Неуспешно свързване с Dropbox. Опитай пак.',
  'sync.restore.title': 'Намерено е резервно копие в Dropbox',
  'sync.restore.before_date': 'В Dropbox има резервно копие от',
  'sync.restore.before_count': 'с',
  'sync.restore.tile_one': '{count} маршрут',
  'sync.restore.tile_other': '{count} маршрута',
  'sync.restore.after': 'Да го възстановя ли или да започнеш начисто? Ако започнеш начисто, резервното копие ще се замени с текущото празно състояние.',
  'sync.restore.start_fresh': 'Започни начисто',
  'sync.restore.restore': 'Възстанови',

  // Wizard — general
  'wizard.cancel': 'Отказ',
  'wizard.back': 'Назад',
  'wizard.next': 'Напред',
  'wizard.save': 'Запази маршрут',
  'wizard.save_changes': 'Запази промените',

  // Wizard — step 1
  'wizard.step1.title': 'Начало',
  'wizard.step1.category_label': 'Посока',
  'wizard.step1.from_home': '🏠 От вкъщи',
  'wizard.step1.to_home': '🏡 Към вкъщи',
  'wizard.step1.label_label': 'Име на маршрута',
  'wizard.step1.label_placeholder': 'напр. Работа',
  'wizard.step1.emoji_label': 'Иконка',

  // Wizard — step 2
  'wizard.step2.title': 'Избери спирка',
  'wizard.step2.placeholder': 'Търси по име или номер…',
  'wizard.step2.searching': 'Търсене…',
  'wizard.step2.no_results': 'Няма намерени спирки',
  'wizard.step2.lines_count': 'Линии: {count}',
  'wizard.step2.selected_hint': 'Избрана в момента · потърси, за да смениш',

  // Wizard — step 3
  'wizard.step3.title': 'Избери линии',
  'wizard.step3.select_all': 'Избери всички',
  'wizard.step3.deselect_all': 'Изчисти избора',
  'wizard.step3.buses': 'Автобуси',
  'wizard.step3.trolleybuses': 'Тролеи',
  'wizard.step3.trams': 'Трамваи',
  'wizard.step3.all_hint': 'Ще се показват всички линии',
  'wizard.step3.lines_selected': 'Избрани линии: {count}',

  // Wizard — step 4
  'wizard.step4.title': 'Преглед',
  'wizard.step4.direction': 'Посока',
  'wizard.step4.label': 'Име',
  'wizard.step4.stop': 'Спирка',
  'wizard.step4.lines': 'Линии',
  'wizard.step4.all_lines': 'Всички линии',

  // Board
  'board.back': 'Назад',
  'board.refreshing': 'Обновяване…',
  'board.no_departures': 'Няма пристигания в следващите 30 минути',
  'board.no_departures_line': 'Няма пристигания за {lines} в момента',
  'board.auto_refresh': 'Обновява се автоматично на 30 секунди',
  'board.error': 'Неуспешно зареждане на пристиганията',
  'board.try_again': 'Опитай пак',
  'board.unknown': 'Непозната дестинация',
  'board.all_lines': 'Всички линии · 30 мин / 5 курса',
  'board.filtered_lines': 'Само {lines}',
  'board.now': 'Сега',
  'board.min': 'мин',
  'board.status.on_time': 'Навреме',
  'board.status.early': 'Подранява',
  'board.delay': '+{minutes} мин',
  'board.refresh.aria': 'Обнови',
  'board.stop_label': 'спирка',
  'board.footer': 'La Busche · Градски транспорт София',
};
