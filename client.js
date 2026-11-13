window.__ModuleLoader__.load({
  id: 'dsh-project-evolution',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'projectEvolution'
    const API = '/api/project-evolution'

    const en = {
      'nav': 'Project Evolution',
      'nav.conversation': 'Evolution',
      'title': 'Project Evolution',
      'subtitle': 'Verified project experience, reviewable skills, and reversible changes.',
      'tabs.overview': 'Overview',
      'tabs.skills': 'Skills',
      'tabs.evolution': 'Evolution',
      'tabs.knowledge': 'Knowledge',
      'tabs.settings': 'Settings',
      'common.refresh': 'Refresh',
      'common.analyze': 'Analyze last turn',
      'common.loading': 'Loading…',
      'common.none': 'None',
      'common.cancel': 'Cancel',
      'common.close': 'Close',
      'common.save': 'Save',
      'common.saving': 'Saving…',
      'common.delete': 'Delete',
      'common.confirm': 'Confirm',
      'common.notTested': 'Not tested',
      'common.pass': 'PASS',
      'common.fail': 'FAIL',
      'common.blocked': 'Blocked',
      'common.enabled': 'Enabled',
      'common.disabled': 'Disabled',
      'common.project': 'Project',
      'common.global': 'Global',
      'common.unknown': 'Unknown',
      'common.bytes': '{n} B',
      'common.evidence': 'Evidence',
      'common.reason': 'Reason',
      'common.status': 'Status',
      'common.created': 'Created',
      'common.version': 'Version',
      'common.versions': 'Versions',
      'common.actions': 'Actions',
      'common.search': 'Search',
      'common.description': 'Description',
      'common.path': 'Path',
      'common.session': 'Session',
      'common.error': 'Something went wrong',
      'common.dismiss': 'Dismiss',
      'overview.project': 'Current project',
      'overview.root': 'Project root',
      'overview.git': 'Git',
      'overview.branch': 'Branch',
      'overview.dirty': 'Uncommitted changes',
      'overview.clean': 'Clean working tree',
      'overview.notGit': 'Not a Git repository',
      'overview.pending': 'Pending proposals',
      'overview.projectSkills': 'Project skills',
      'overview.confirmed': 'Confirmed knowledge',
      'overview.lastAnalysis': 'Last analysis',
      'overview.never': 'Not analyzed yet',
      'overview.how': 'How this works',
      'overview.step1': 'A substantive turn is observed: file changes, a real test result, or an explicit correction.',
      'overview.step2': 'Evidence is masked, deduplicated, and stored only in this project.',
      'overview.step3': 'A reusable procedure becomes a proposal. You review its diff and backtest before anything is written.',
      'overview.recentRuns': 'Recent verification runs',
      'overview.noRuns': 'No verification runs recorded yet.',
      'overview.limits': 'Storage and limits',
      'overview.knowledgeCount': '{n} of {max} knowledge rows',
      'overview.proposalCount': '{n} of {max} proposals',
      'overview.retention': '{n} days retention',
      'skills.new': 'New skill draft',
      'skills.empty': 'No project skills yet. A verified task can produce a proposal, or you can write a draft.',
      'skills.globalEmpty': 'No global skills discovered.',
      'skills.detailEmpty': 'Select a project skill to inspect, edit, version, or roll back.',
      'skills.projectGroup': 'Project skills',
      'skills.globalGroup': 'Global skills (read-only here)',
      'skills.createdBy': 'Created by',
      'skills.confidence': 'Confidence',
      'skills.evidenceScore': 'Evidence score',
      'skills.whenToUse': 'When to use',
      'skills.editor': 'Proposal editor',
      'skills.editorHint': 'Editing never writes directly. Saving creates a reviewable proposal with a diff and deterministic backtest.',
      'skills.name': 'Skill name',
      'skills.content': 'SKILL.md content',
      'skills.saveProposal': 'Save as proposal',
      'skills.reason': 'Why this change is useful',
      'skills.disable': 'Disable',
      'skills.enable': 'Enable',
      'skills.archive': 'Archive',
      'skills.publish': 'Publish globally…',
      'skills.publishHint': 'Copies this project skill to the global skill root after explicit confirmation. Other projects will see it.',
      'skills.versions': 'Version history',
      'skills.noVersions': 'No saved versions yet.',
      'skills.rollback': 'Roll back',
      'skills.archiveConfirm': 'Archive this project skill? It moves out of .dsh/skills into the local archive. Git history is not rewritten.',
      'skills.rollbackConfirm': 'Roll back "{skill}" to {version}? The current content is saved as a new version first.',
      'skills.publishConfirm': 'Publish "{skill}" globally? This affects every project in this DSH profile. The plugin does not push or commit.',
      'skills.publishDisabled': 'Global publication is disabled in Settings. Enable it first; publishing still requires a separate confirmation.',
      'skills.untracked': 'Manual skill: edit through the native skill manager.',
      'skills.noChanges': 'No changes to save.',
      'evolution.empty': 'No proposals yet. Run “Analyze last turn” after a verified change.',
      'evolution.detailEmpty': 'Select a proposal to review its diff, checks, and backtest.',
      'evolution.autoAcceptOff': 'Automatic acceptance is off. Every proposal waits for your review.',
      'evolution.accept': 'Accept proposal',
      'evolution.reject': 'Reject',
      'evolution.accepted': 'Accepted',
      'evolution.rejected': 'Rejected',
      'evolution.blocked': 'Blocked',
      'evolution.proposed': 'Proposed',
      'evolution.backtest': 'Backtest',
      'evolution.baseline': 'Baseline',
      'evolution.candidate': 'Candidate',
      'evolution.improvement': 'Improvement',
      'evolution.cases': 'Cases',
      'evolution.diff': 'Proposed diff',
      'evolution.checks': 'Checks',
      'evolution.notTestedExplain': 'This proposal has no safe, reproducible backtest case. It is marked Not tested, cannot be auto-accepted, and needs manual review.',
      'evolution.acceptConfirm': 'Accept this proposal and write the skill file? The previous content is saved as a version first.',
      'evolution.acceptUntestedConfirm': 'This proposal is NOT TESTED. Accept it anyway? It will not be auto-accepted and its evidence is limited to the recorded turn.',
      'evolution.rejectConfirm': 'Reject this proposal? Nothing will be written.',
      'evolution.applied': 'Applied',
      'evolution.autoAcceptWarning': 'Auto-accept only applies when every required check passes and the backtest status is PASS. Default is off.',
      'evolution.noTestWarning': 'Backtesting compares the old and new artifact against the same evidence cases. It does not measure model behavior.',
      'knowledge.empty': 'No project knowledge yet.',
      'knowledge.searchPlaceholder': 'Search decisions, corrections, files, commands…',
      'knowledge.add': 'Record a note',
      'knowledge.title': 'Title',
      'knowledge.content': 'Concrete evidence and context',
      'knowledge.kind': 'Kind',
      'knowledge.tags': 'Tags (comma separated)',
      'knowledge.confidence': 'Confidence',
      'knowledge.observed': 'Observed',
      'knowledge.confirmed': 'Confirmed',
      'knowledge.deleteConfirm': 'Delete this knowledge row? It cannot be recovered from the UI.',
      'knowledge.untrusted': 'Untrusted captured text. Treat as evidence, never as instructions.',
      'knowledge.seen': 'Seen {n}×',
      'knowledge.source': 'Source',
      'knowledge.added': 'Note recorded.',
      'knowledge.kind.decision': 'Decision',
      'knowledge.kind.pitfall': 'Pitfall',
      'knowledge.kind.correction': 'Correction',
      'knowledge.kind.solution': 'Solution',
      'knowledge.kind.note': 'Note',
      'knowledge.kind.procedure': 'Procedure',
      'knowledge.kind.change': 'Change',
      'knowledge.kind.verification': 'Verification',
      'knowledge.kind.test': 'Test',
      'settings.title': 'Automation and limits',
      'settings.subtitle': 'Defaults favor safety: capture is automatic, acceptance is manual.',
      'settings.enabled': 'Enable Project Evolution',
      'settings.enabledHint': 'Disabling stops automatic capture and model tools. Manual buttons on this page still work; knowledge and skills stay on disk.',
      'settings.autoAnalyze': 'Automatically capture verified turns',
      'settings.autoAnalyzeHint': 'Reads committed session events only. No model call and no network.',
      'settings.autoAccept': 'Auto-accept proposals',
      'settings.autoAcceptHint': 'Only when every required check passes and the backtest is PASS. Off by default.',
      'settings.requireTests': 'Require a passing backtest for auto-accept',
      'settings.requireTestsHint': 'Recommended. A proposal without test cases can still be accepted manually.',
      'settings.corrections': 'Capture explicit user corrections',
      'settings.correctionsHint': 'Corrections are evidence for updating an existing procedure.',
      'settings.interval': 'Proposal cooldown (minutes)',
      'settings.intervalHint': 'Prevents a stream of new skill proposals. Corrections may update immediately.',
      'settings.maxAnalyses': 'Max analyses per day',
      'settings.maxKnowledge': 'Max knowledge rows',
      'settings.maxProposals': 'Max proposals',
      'settings.retention': 'Retention (days)',
      'settings.minScore': 'Minimum evidence score',
      'settings.minScoreHint': '0–100. A turn below this threshold is not proposed as a skill.',
      'settings.globalPublish': 'Allow global publication',
      'settings.globalPublishHint': 'Still requires a separate confirmation for every skill.',
      'settings.modelTitle': 'Model budget',
      'settings.modelHint': 'This build uses a deterministic analyzer and makes zero model calls. The budget guard is present but no model-assisted analysis is enabled.',
      'settings.maxModelCalls': 'Max model calls per day (reserved)',
      'settings.storage': 'Storage',
      'settings.storageHint': 'Knowledge and history live in <project>/.dsh/project-evolution and are git-ignored. Project skills live in <project>/.dsh/skills and remain tracked by Git.',
      'settings.saved': 'Settings saved.',
      'settings.autoAcceptOnWarning': 'Auto-accept is enabled. It will only write a skill after all required checks and a PASS backtest.',
      'settings.modelCallsZero': '0 (deterministic only)',
      'settings.projectsTitle': 'All projects',
      'settings.projectsSubtitle': 'Skills, knowledge, and evidence across every DSH workspace. Automation below is global.',
      'settings.projectPicker': 'Choose a project',
      'settings.projectsCount': 'Projects: {n}',
      'settings.noProjects': 'No DSH workspaces or project sessions yet.',
      'settings.noProjectSession': 'No chats in this project yet. Open a chat here to collect evidence.',
      'settings.projectChats': '{n} chats',
      'settings.projectWorkspaces': '{n} folders',
      'settings.chats': 'Chats',
      'settings.folders': 'Folders',
      'settings.projectSkills': 'skills',
      'settings.projectKnowledge': 'knowledge rows',
      'settings.projectPending': 'pending proposals',
      'settings.projectLastActive': 'Last activity',
      'settings.projectSkillsTitle': 'Project skills',
      'settings.projectNoSkills': 'No project skills yet.',
      'settings.projectStorageTitle': 'Project storage',
      'settings.projectNextTitle': 'Next step',
      'settings.projectOpenHint': 'Open a chat in this project and use the Project Evolution tab to review proposals and run analyses.',
      'settings.globalScope': 'These automation settings apply to every project.',
      'settings.refreshProjects': 'Refresh list',
      'settings.untitledProject': 'Untitled project',
      'error.noSession': 'No session is available. Open a project session first.',
      'error.action': 'Action failed: {message}',
      'error.load': 'Could not load Project Evolution: {message}',
      'status.tests': 'Tests',
      'status.notRun': 'Not tested',
      'status.checks': 'Checks',
      'status.auto': 'auto',
      'status.manual': 'manual',
      'time.never': 'Never',
    }

    const ru = {
      'nav': 'Эволюция проекта',
      'nav.conversation': 'Эволюция',
      'title': 'Эволюция проекта',
      'subtitle': 'Подтверждённый опыт проекта, проверяемые навыки и обратимые изменения.',
      'tabs.overview': 'Обзор',
      'tabs.skills': 'Навыки',
      'tabs.evolution': 'Эволюция',
      'tabs.knowledge': 'Знания',
      'tabs.settings': 'Настройки',
      'common.refresh': 'Обновить',
      'common.analyze': 'Анализ последнего хода',
      'common.loading': 'Загрузка…',
      'common.none': 'Нет',
      'common.cancel': 'Отмена',
      'common.close': 'Закрыть',
      'common.save': 'Сохранить',
      'common.saving': 'Сохранение…',
      'common.delete': 'Удалить',
      'common.confirm': 'Подтвердить',
      'common.notTested': 'Не тестировалось',
      'common.pass': 'PASS',
      'common.fail': 'FAIL',
      'common.blocked': 'Заблокировано',
      'common.enabled': 'Включён',
      'common.disabled': 'Отключён',
      'common.project': 'Проект',
      'common.global': 'Глобальный',
      'common.unknown': 'Неизвестно',
      'common.bytes': '{n} Б',
      'common.evidence': 'Доказательства',
      'common.reason': 'Причина',
      'common.status': 'Статус',
      'common.created': 'Создано',
      'common.version': 'Версия',
      'common.versions': 'Версии',
      'common.actions': 'Действия',
      'common.search': 'Поиск',
      'common.description': 'Описание',
      'common.path': 'Путь',
      'common.session': 'Сессия',
      'common.error': 'Произошла ошибка',
      'common.dismiss': 'Скрыть',
      'overview.project': 'Текущий проект',
      'overview.root': 'Корень проекта',
      'overview.git': 'Git',
      'overview.branch': 'Ветка',
      'overview.dirty': 'Есть незакоммиченные изменения',
      'overview.clean': 'Рабочее дерево чистое',
      'overview.notGit': 'Не Git-репозиторий',
      'overview.pending': 'Ожидают решения',
      'overview.projectSkills': 'Проектные навыки',
      'overview.confirmed': 'Подтверждённые знания',
      'overview.lastAnalysis': 'Последний анализ',
      'overview.never': 'Анализ ещё не выполнялся',
      'overview.how': 'Как это работает',
      'overview.step1': 'Наблюдается содержательный ход: изменения файлов, реальный результат тестов или явная правка пользователя.',
      'overview.step2': 'Доказательства маскируются, дедуплицируются и хранятся только в этом проекте.',
      'overview.step3': 'Многоразовая процедура становится предложением. Вы проверяете diff и бэктест до любой записи.',
      'overview.recentRuns': 'Последние проверки',
      'overview.noRuns': 'Проверок пока нет.',
      'overview.limits': 'Хранилище и лимиты',
      'overview.knowledgeCount': '{n} из {max} записей знаний',
      'overview.proposalCount': '{n} из {max} предложений',
      'overview.retention': 'Хранение {n} дней',
      'skills.new': 'Черновик нового навыка',
      'skills.empty': 'Проектных навыков пока нет. Проверенная задача может создать предложение, либо напишите черновик.',
      'skills.globalEmpty': 'Глобальные навыки не найдены.',
      'skills.detailEmpty': 'Выберите проектный навык, чтобы посмотреть, отредактировать, вернуть версию или откатить.',
      'skills.projectGroup': 'Проектные навыки',
      'skills.globalGroup': 'Глобальные навыки (только чтение)',
      'skills.createdBy': 'Создал',
      'skills.confidence': 'Уверенность',
      'skills.evidenceScore': 'Оценка доказательств',
      'skills.whenToUse': 'Когда использовать',
      'skills.editor': 'Редактор предложения',
      'skills.editorHint': 'Редактирование ничего не записывает напрямую. Сохранение создаёт предложение с diff и детерминированным бэктестом.',
      'skills.name': 'Имя навыка',
      'skills.content': 'Содержимое SKILL.md',
      'skills.saveProposal': 'Сохранить как предложение',
      'skills.reason': 'Почему изменение полезно',
      'skills.disable': 'Отключить',
      'skills.enable': 'Включить',
      'skills.archive': 'В архив',
      'skills.publish': 'Опубликовать глобально…',
      'skills.publishHint': 'Копирует навык в глобальный корень после явного подтверждения. Его увидят другие проекты.',
      'skills.versions': 'История версий',
      'skills.noVersions': 'Сохранённых версий пока нет.',
      'skills.rollback': 'Откатить',
      'skills.archiveConfirm': 'Отправить навык в архив? Он будет перемещён из .dsh/skills в локальный архив. История Git не переписывается.',
      'skills.rollbackConfirm': 'Откатить «{skill}» к версии {version}? Текущее содержимое сначала сохраняется как новая версия.',
      'skills.publishConfirm': 'Опубликовать «{skill}» глобально? Это затронет все проекты в профиле DSH. Плагин не делает commit или push.',
      'skills.publishDisabled': 'Глобальная публикация отключена в настройках. Включите её; публикация всё равно потребует отдельного подтверждения.',
      'skills.untracked': 'Ручной навык: редактируйте через штатный менеджер навыков.',
      'skills.noChanges': 'Нет изменений для сохранения.',
      'evolution.empty': 'Предложений пока нет. Нажмите «Анализ последнего хода» после проверенного изменения.',
      'evolution.detailEmpty': 'Выберите предложение, чтобы увидеть diff, проверки и бэктест.',
      'evolution.autoAcceptOff': 'Автопринятие выключено. Каждое предложение ждёт вашего решения.',
      'evolution.accept': 'Принять предложение',
      'evolution.reject': 'Отклонить',
      'evolution.accepted': 'Принято',
      'evolution.rejected': 'Отклонено',
      'evolution.blocked': 'Заблокировано',
      'evolution.proposed': 'Предложено',
      'evolution.backtest': 'Бэктест',
      'evolution.baseline': 'Базовая версия',
      'evolution.candidate': 'Кандидат',
      'evolution.improvement': 'Улучшение',
      'evolution.cases': 'Кейсы',
      'evolution.diff': 'Предлагаемый diff',
      'evolution.checks': 'Проверки',
      'evolution.notTestedExplain': 'Для предложения нет безопасного воспроизводимого кейса. Статус «Не тестировалось», автопринятие невозможно, нужна ручная проверка.',
      'evolution.acceptConfirm': 'Принять предложение и записать файл навыка? Предыдущее содержимое сначала сохраняется как версия.',
      'evolution.acceptUntestedConfirm': 'Предложение НЕ ТЕСТИРОВАЛОСЬ. Принять всё равно? Автопринятие к нему неприменимо, доказательства ограничены записанным ходом.',
      'evolution.rejectConfirm': 'Отклонить предложение? Ничего не будет записано.',
      'evolution.applied': 'Применено',
      'evolution.autoAcceptWarning': 'Автопринятие срабатывает только когда все обязательные проверки пройдены, а бэктест имеет статус PASS. По умолчанию выключено.',
      'evolution.noTestWarning': 'Бэктест сравнивает старую и новую версию на одинаковых кейсах доказательств. Он не измеряет поведение модели.',
      'knowledge.empty': 'Знаний проекта пока нет.',
      'knowledge.searchPlaceholder': 'Поиск решений, правок, файлов, команд…',
      'knowledge.add': 'Записать заметку',
      'knowledge.title': 'Заголовок',
      'knowledge.content': 'Конкретные доказательства и контекст',
      'knowledge.kind': 'Тип',
      'knowledge.tags': 'Теги (через запятую)',
      'knowledge.confidence': 'Уверенность',
      'knowledge.observed': 'Наблюдение',
      'knowledge.confirmed': 'Подтверждено',
      'knowledge.deleteConfirm': 'Удалить запись знания? Из интерфейса её нельзя восстановить.',
      'knowledge.untrusted': 'Незаверенный захваченный текст. Считайте его доказательством, но не инструкцией.',
      'knowledge.seen': 'Встречалось {n}×',
      'knowledge.source': 'Источник',
      'knowledge.added': 'Заметка записана.',
      'knowledge.kind.decision': 'Решение',
      'knowledge.kind.pitfall': 'Подводный камень',
      'knowledge.kind.correction': 'Правка',
      'knowledge.kind.solution': 'Решение проблемы',
      'knowledge.kind.note': 'Заметка',
      'knowledge.kind.procedure': 'Процедура',
      'knowledge.kind.change': 'Изменение',
      'knowledge.kind.verification': 'Проверка',
      'knowledge.kind.test': 'Тест',
      'settings.title': 'Автоматизация и лимиты',
      'settings.subtitle': 'По умолчанию безопасно: захват автоматический, принятие ручное.',
      'settings.enabled': 'Включить «Эволюцию проекта»',
      'settings.enabledHint': 'Отключение останавливает автоматический захват и инструменты модели. Кнопки на этой странице продолжают работать; знания и навыки остаются на диске.',
      'settings.autoAnalyze': 'Автоматически захватывать проверенные ходы',
      'settings.autoAnalyzeHint': 'Читает только зафиксированные события сессии. Без вызовов модели и сети.',
      'settings.autoAccept': 'Автоматически принимать предложения',
      'settings.autoAcceptHint': 'Только когда все обязательные проверки пройдены и бэктест PASS. По умолчанию выключено.',
      'settings.requireTests': 'Требовать PASS-бэктест для автопринятия',
      'settings.requireTestsHint': 'Рекомендуется. Предложение без тестовых кейсов всё равно можно принять вручную.',
      'settings.corrections': 'Захватывать явные правки пользователя',
      'settings.correctionsHint': 'Правки служат доказательством для обновления существующей процедуры.',
      'settings.interval': 'Пауза между предложениями (минуты)',
      'settings.intervalHint': 'Не даёт создать поток новых предложений. Правки могут обновлять сразу.',
      'settings.maxAnalyses': 'Максимум анализов в день',
      'settings.maxKnowledge': 'Максимум записей знаний',
      'settings.maxProposals': 'Максимум предложений',
      'settings.retention': 'Хранение (дней)',
      'settings.minScore': 'Минимальная оценка доказательств',
      'settings.minScoreHint': '0–100. Ход ниже порога не предлагается как навык.',
      'settings.globalPublish': 'Разрешить глобальную публикацию',
      'settings.globalPublishHint': 'Всё равно требует отдельного подтверждения для каждого навыка.',
      'settings.modelTitle': 'Бюджет модели',
      'settings.modelHint': 'В этой сборке используется детерминированный анализатор и ноль вызовов модели. Ограничитель бюджета присутствует, но модельный анализ не включён.',
      'settings.maxModelCalls': 'Максимум вызовов модели в день (резерв)',
      'settings.storage': 'Хранилище',
      'settings.storageHint': 'Знания и история лежат в <project>/.dsh/project-evolution и игнорируются Git. Проектные навыки лежат в <project>/.dsh/skills и остаются под контролем Git.',
      'settings.saved': 'Настройки сохранены.',
      'settings.autoAcceptOnWarning': 'Автопринятие включено. Запись произойдёт только после всех обязательных проверок и PASS-бэктеста.',
      'settings.modelCallsZero': '0 (только детерминированно)',
      'settings.projectsTitle': 'Все проекты',
      'settings.projectsSubtitle': 'Навыки, знания и доказательства по всем рабочим пространствам DSH. Автоматизация ниже — глобальная.',
      'settings.projectPicker': 'Выберите проект',
      'settings.projectsCount': 'Проектов: {n}',
      'settings.noProjects': 'Пока нет рабочих пространств DSH или сессий проектов.',
      'settings.noProjectSession': 'В этом проекте ещё нет чатов. Откройте чат здесь, чтобы собирать доказательства.',
      'settings.projectChats': 'Чатов: {n}',
      'settings.projectWorkspaces': 'Папок: {n}',
      'settings.chats': 'Чаты',
      'settings.folders': 'Папки',
      'settings.projectSkills': 'навыков',
      'settings.projectKnowledge': 'записей знаний',
      'settings.projectPending': 'ожидают решения',
      'settings.projectLastActive': 'Последняя активность',
      'settings.projectSkillsTitle': 'Навыки проекта',
      'settings.projectNoSkills': 'Проектных навыков пока нет.',
      'settings.projectStorageTitle': 'Хранилище проекта',
      'settings.projectNextTitle': 'Что дальше',
      'settings.projectOpenHint': 'Откройте чат этого проекта и вкладку «Эволюция проекта», чтобы смотреть предложения и запускать анализ.',
      'settings.globalScope': 'Эти настройки автоматизации применяются ко всем проектам.',
      'settings.refreshProjects': 'Обновить список',
      'settings.untitledProject': 'Проект без названия',
      'error.noSession': 'Нет доступной сессии. Сначала откройте сессию проекта.',
      'error.action': 'Действие не выполнено: {message}',
      'error.load': 'Не удалось загрузить «Эволюцию проекта»: {message}',
      'status.tests': 'Тесты',
      'status.notRun': 'Не тестировалось',
      'status.checks': 'Проверки',
      'status.auto': 'авто',
      'status.manual': 'вручную',
      'time.never': 'Никогда',
    }

    const css = `
.pe-root{--pe-radius:12px;--pe-gap:14px;color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.5;width:100%;max-width:1160px;margin:0 auto;padding:12px 16px 40px 20px;box-sizing:border-box;container-type:inline-size;min-width:0;overflow-x:clip}
.pe-root *{box-sizing:border-box}
.pe-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin:0 0 14px;flex-wrap:wrap}
.pe-title{margin:0 0 3px;font-size:18px;font-weight:650;letter-spacing:-.01em}
.pe-sub{margin:0;color:var(--dsw-alias-label-secondary);font-size:12.5px;max-width:720px}
.pe-head-actions{display:flex;gap:8px;flex-wrap:wrap}
.pe-tabs{display:flex;gap:2px;border-bottom:1px solid var(--dsw-alias-border-l1);margin:0 0 16px;overflow-x:auto;scrollbar-width:thin}
.pe-tab{appearance:none;background:transparent;border:0;border-bottom:2px solid transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;font:inherit;font-weight:550;padding:9px 12px;white-space:nowrap}
.pe-tab:hover{color:var(--dsw-alias-label-primary)}
.pe-tab[aria-selected="true"]{border-bottom-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary)}
.pe-btn{appearance:none;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-radius:8px;padding:6px 11px;font:inherit;font-size:12px;font-weight:550;cursor:pointer;display:inline-flex;align-items:center;gap:6px;min-height:30px}
.pe-btn:hover{background:var(--dsw-alias-bg-layer-2)}
.pe-btn:disabled{opacity:.45;cursor:default}
.pe-btn-primary{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-foreground)}
.pe-btn-primary:hover{background:var(--dsw-alias-button-primary-hover);border-color:var(--dsw-alias-button-primary-hover);color:var(--dsw-alias-label-primary-foreground)}
.pe-btn-danger{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary)}
.pe-btn-ghost{background:transparent;border-color:transparent;color:var(--dsw-alias-label-secondary)}
.pe-btn-ghost:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.pe-grid{display:grid;gap:var(--pe-gap)}
.pe-grid-4{grid-template-columns:repeat(4,minmax(0,1fr))}
.pe-grid-2{grid-template-columns:repeat(2,minmax(0,1fr))}
.pe-card{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:var(--pe-radius);padding:14px;min-width:0;container-type:inline-size}
.pe-card-title{font-weight:650;font-size:12px;color:var(--dsw-alias-label-secondary);text-transform:uppercase;letter-spacing:.04em;margin:0 0 10px}
.pe-stat-value{font-size:24px;font-weight:650;letter-spacing:-.02em;line-height:1.1}
.pe-stat-label{color:var(--dsw-alias-label-secondary);font-size:12px;margin-top:3px}
.pe-kv{display:grid;grid-template-columns:120px minmax(0,1fr);gap:7px 12px;align-items:start}
.pe-kv dt{color:var(--dsw-alias-label-secondary);font-size:12px}
.pe-kv dd{margin:0;min-width:0;overflow-wrap:anywhere}
.pe-code{font-family:var(--dsw-font-mono,ui-monospace,SFMono-Regular,Menlo,Consolas,monospace);font-size:11.5px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);border-radius:6px;padding:2px 5px;overflow-wrap:anywhere}
.pe-badge{display:inline-flex;align-items:center;gap:4px;border-radius:999px;padding:1px 7px;font-size:10.5px;font-weight:600;border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary);white-space:nowrap}
.pe-badge-ok{color:var(--dsw-alias-state-success-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary) 45%,transparent)}
.pe-badge-warn{color:var(--dsw-alias-state-warn-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 45%,transparent)}
.pe-badge-bad{color:var(--dsw-alias-state-error-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 45%,transparent)}
.pe-badge-brand{color:var(--dsw-alias-brand-primary);border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 45%,transparent)}
.pe-muted{color:var(--dsw-alias-label-secondary)}
.pe-small{font-size:11.5px}
.pe-mono{font-family:var(--dsw-font-mono,ui-monospace,SFMono-Regular,Menlo,Consolas,monospace)}
.pe-divider{height:1px;background:var(--dsw-alias-border-l1);margin:12px 0}
.pe-list{display:flex;flex-direction:column;gap:4px;min-width:0}
.pe-row{display:flex;align-items:center;gap:8px;padding:7px 8px;border-radius:7px;border:1px solid transparent;background:transparent;text-align:left;font:inherit;color:inherit;cursor:pointer;width:100%;min-width:0}
.pe-row:hover{background:var(--dsw-alias-bg-layer-2)}
.pe-row[aria-selected="true"]{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-border-l1)}
.pe-row-main{min-width:0;flex:1}
.pe-row-title{font-weight:550;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pe-row-sub{color:var(--dsw-alias-label-secondary);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pe-split{display:grid;grid-template-columns:280px minmax(0,1fr);gap:16px;align-items:start}
.pe-split-narrow{display:grid;grid-template-columns:320px minmax(0,1fr);gap:16px;align-items:start}
.pe-scroll{max-height:440px;overflow:auto;padding-right:3px;scrollbar-width:thin}
.pe-section-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 7px}
.pe-section-head h3{margin:0;font-size:12px;color:var(--dsw-alias-label-secondary);text-transform:uppercase;letter-spacing:.04em}
.pe-empty{border:1px dashed var(--dsw-alias-border-l1);border-radius:10px;padding:20px;text-align:center;color:var(--dsw-alias-label-secondary);font-size:12px}
.pe-alert{border:1px solid var(--dsw-alias-border-l1);border-left:3px solid var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-1);border-radius:8px;padding:9px 11px;font-size:12px;margin:0 0 12px;color:var(--dsw-alias-label-primary)}
.pe-alert-error{border-left-color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 6%,var(--dsw-alias-bg-layer-1))}
.pe-alert-warn{border-left-color:var(--dsw-alias-state-warn-primary)}
.pe-alert-ok{border-left-color:var(--dsw-alias-state-success-primary)}
.pe-form{display:grid;gap:10px}
.pe-field{display:grid;gap:4px;min-width:0}
.pe-field label{font-size:11.5px;color:var(--dsw-alias-label-secondary);font-weight:550}
.pe-input,.pe-select,.pe-textarea{width:100%;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px;padding:7px 9px;min-height:32px}
.pe-textarea{min-height:260px;resize:vertical;font-family:var(--dsw-font-mono,ui-monospace,SFMono-Regular,Menlo,Consolas,monospace);font-size:11.5px;line-height:1.55;white-space:pre}
.pe-textarea-small{min-height:90px;font-family:inherit;font-size:12.5px;white-space:pre-wrap}
.pe-input:focus,.pe-select:focus,.pe-textarea:focus{outline:2px solid color-mix(in srgb,var(--dsw-alias-brand-primary) 45%,transparent);outline-offset:0;border-color:var(--dsw-alias-brand-primary)}
.pe-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.pe-toggle{display:flex;align-items:flex-start;gap:9px;padding:10px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-1)}
.pe-toggle input{margin:3px 0 0;accent-color:var(--dsw-alias-brand-primary);flex:none}
.pe-toggle-text{min-width:0;display:flex;flex-direction:column;gap:2px}
.pe-toggle-title{font-weight:550;font-size:12.5px}
.pe-toggle-hint{color:var(--dsw-alias-label-secondary);font-size:11.5px;margin-top:2px}
.pe-diff{border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-base);overflow:auto;max-height:420px;font-family:var(--dsw-font-mono,ui-monospace,SFMono-Regular,Menlo,Consolas,monospace);font-size:11px;line-height:1.5}
.pe-diff-line{display:block;padding:0 9px;white-space:pre;min-height:16px}
.pe-diff-add{background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 13%,transparent);color:var(--dsw-alias-state-success-primary)}
.pe-diff-del{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 13%,transparent);color:var(--dsw-alias-state-error-primary)}
.pe-diff-hunk{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary)}
.pe-checks{display:grid;gap:5px}
.pe-check{display:flex;align-items:flex-start;gap:8px;font-size:12px}
.pe-check-icon{flex:none;width:44px;font-size:10px;font-weight:700;padding-top:1px}
.pe-skill-body{border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-base);padding:12px;max-height:360px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;font-family:var(--dsw-font-mono,ui-monospace,SFMono-Regular,Menlo,Consolas,monospace);font-size:11.5px;line-height:1.55}
.pe-timeline{display:grid;gap:9px}
.pe-time-item{display:grid;grid-template-columns:8px minmax(0,1fr);gap:9px;align-items:start}
.pe-dot{width:7px;height:7px;border-radius:50%;background:var(--dsw-alias-brand-primary);margin-top:6px}
.pe-time-title{font-weight:550}
.pe-split .pe-card,.pe-split-narrow .pe-card{overflow:hidden}
.pe-nowrap{white-space:nowrap}
.pe-right{margin-left:auto}
.pe-stack{display:grid;gap:9px}
.pe-inline{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.pe-global-note{font-size:11px;color:var(--dsw-alias-label-secondary);border-top:1px solid var(--dsw-alias-border-l1);padding-top:9px;margin-top:9px}
.pe-loading{display:grid;place-items:center;min-height:180px;color:var(--dsw-alias-label-secondary)}
.pe-spinner{width:18px;height:18px;border-radius:50%;border:2px solid var(--dsw-alias-border-l1);border-top-color:var(--dsw-alias-brand-primary);animation:pe-spin .8s linear infinite;margin-bottom:8px}
@keyframes pe-spin{to{transform:rotate(360deg)}}
@media (max-width:820px){.pe-grid-4{grid-template-columns:repeat(2,minmax(0,1fr))}.pe-split,.pe-split-narrow{grid-template-columns:1fr}.pe-scroll{max-height:300px}.pe-kv{grid-template-columns:95px minmax(0,1fr)}}
@container (max-width:700px){.pe-grid-4{grid-template-columns:repeat(2,minmax(0,1fr))}.pe-split,.pe-split-narrow{grid-template-columns:1fr}}
@container (max-width:620px){.pe-grid-2{grid-template-columns:1fr}}
@container (max-width:360px){.pe-kv{grid-template-columns:1fr;gap:2px}.pe-kv dt{margin-top:7px}.pe-kv dt:first-child{margin-top:0}}
@media (max-width:480px){.pe-grid-4,.pe-grid-2{grid-template-columns:1fr}.pe-tab{padding:8px 9px}.pe-title{font-size:16px}.pe-root{padding-bottom:18px}}
@media (prefers-reduced-motion:reduce){.pe-spinner{animation:none}}
`

    const tagId = 'dsh-project-evolution/settings.css'
    if (typeof document !== 'undefined' && !document.querySelector('style[data-plugin-evolution="' + tagId + '"]')) {
      const style = document.createElement('style')
      style.dataset.plugin = 'dsh-project-evolution'
      style.dataset.pluginEvolution = tagId
      style.textContent = css
      document.head.appendChild(style)
    }

    function interpolate(text, params) {
      if (!params) return text
      return String(text).replace(/\{(\w+)\}/g, (match, key) => (params[key] === undefined ? match : String(params[key])))
    }

    function bindT(ctx) {
      const t = ctx.locale.bind(NS)
      return (key, params) => interpolate(t(key), params)
    }

    async function apiGet(path, query = {}) {
      const url = new URL(API + path, window.location.origin)
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
      }
      const response = await fetch(url, { credentials: 'same-origin', headers: { accept: 'application/json' } })
      return readResponse(response)
    }

    async function apiPost(payload) {
      const response = await fetch(API + '/action', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(payload),
      })
      return readResponse(response)
    }

    async function readResponse(response) {
      let body
      try {
        body = await response.json()
      } catch {
        throw new Error(`HTTP ${response.status}`)
      }
      if (!response.ok || body?.ok === false) {
        const error = new Error(body?.error?.message || `HTTP ${response.status}`)
        error.code = body?.error?.code
        throw error
      }
      return body
    }

    function formatDate(value, locale) {
      if (!value) return '—'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return String(value)
      try {
        return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
          dateStyle: 'medium', timeStyle: 'short',
        }).format(date)
      } catch {
        return date.toLocaleString()
      }
    }

    function badge(text, kind = '') {
      return h('span', { className: `pe-badge ${kind ? `pe-badge-${kind}` : ''}` }, text)
    }

    function statusBadge(status, t) {
      if (status === 'PASS' || status === 'accepted') return badge(status === 'accepted' ? t('evolution.accepted') : t('common.pass'), 'ok')
      if (status === 'FAIL' || status === 'blocked' || status === 'rejected') {
        return badge(status === 'rejected' ? t('evolution.rejected') : status === 'blocked' ? t('evolution.blocked') : t('common.fail'), 'bad')
      }
      if (status === 'NOT_TESTED' || !status) return badge(t('common.notTested'), 'warn')
      if (status === 'proposed') return badge(t('evolution.proposed'), 'brand')
      return badge(String(status))
    }

    function currentSession(useSessions, preferredId) {
      if (typeof useSessions !== 'function') return null
      // The shell exposes a selector hook, not a plain state object.
      const list = useSessions((state) => state)
      const ids = Array.isArray(list?.ids) ? list.ids : Object.keys(list?.byId || {})
      if (!ids.length) return null
      // A conversation view is scoped to the shell's active session. Never
      // substitute another project's session when that id is not in this
      // snapshot; the view will show its "no session" state instead.
      if (preferredId) return list.byId?.[preferredId] ?? null
      let best = null
      let bestScore = -1
      for (const id of ids) {
        const session = list.byId?.[id]
        if (!session) continue
        const cwd = session.cwd || session.preview?.cwd
        const score = Number(session.retainedBy?.mainView || 0) * 10 + Number(session.retainedBy?.panel || 0) + (cwd ? 1 : 0)
        if (score > bestScore) {
          best = session
          bestScore = score
        }
      }
      return best
    }

    function useLocaleRevision(ctx) {
      const [revision, setRevision] = React.useState(ctx.locale?.getSnapshot?.().revision ?? 0)
      React.useEffect(() => {
        if (!ctx.locale?.subscribe) return undefined
        setRevision(ctx.locale.getSnapshot().revision)
        return ctx.locale.subscribe(() => setRevision(ctx.locale.getSnapshot().revision))
      }, [ctx])
      return revision
    }

    function Button({ children, onClick, disabled, variant, title, type = 'button' }) {
      return h('button', {
        type,
        className: `pe-btn${variant ? ` pe-btn-${variant}` : ''}`,
        onClick,
        disabled: Boolean(disabled),
        title,
      }, children)
    }

    function Toggle({ checked, onChange, title, hint, disabled }) {
      return h('label', { className: 'pe-toggle' },
        h('input', { type: 'checkbox', checked: Boolean(checked), onChange: (event) => onChange(event.target.checked), disabled }),
        h('span', { className: 'pe-toggle-text' },
          h('span', { className: 'pe-toggle-title' }, title),
          hint ? h('span', { className: 'pe-toggle-hint' }, hint) : null,
        ),
      )
    }

    function Field({ label, children, hint }) {
      return h('div', { className: 'pe-field' },
        h('label', null, label),
        children,
        hint ? h('div', { className: 'pe-small pe-muted' }, hint) : null,
      )
    }

    function Diff({ diff, t }) {
      if (!diff) return h('div', { className: 'pe-empty' }, t('common.none'))
      const lines = diff.split('\n')
      return h('div', { className: 'pe-diff' }, lines.map((line, index) => {
        let cls = 'pe-diff-line'
        if (line.startsWith('+') && !line.startsWith('+++')) cls += ' pe-diff-add'
        else if (line.startsWith('-') && !line.startsWith('---')) cls += ' pe-diff-del'
        else if (line.startsWith('@@')) cls += ' pe-diff-hunk'
        return h('span', { key: index, className: cls }, line || ' ')
      }))
    }

    function Overview({ data, t, locale }) {
      const { project, status, config, runs } = data
      const counts = status.counts
      const git = project.git || {}
      return h('div', { className: 'pe-grid' },
        h('div', { className: 'pe-grid pe-grid-4' },
          h('div', { className: 'pe-card' }, h('div', { className: 'pe-stat-value' }, counts.pendingProposals), h('div', { className: 'pe-stat-label' }, t('overview.pending'))),
          h('div', { className: 'pe-card' }, h('div', { className: 'pe-stat-value' }, data.catalog.project.length), h('div', { className: 'pe-stat-label' }, t('overview.projectSkills'))),
          h('div', { className: 'pe-card' }, h('div', { className: 'pe-stat-value' }, counts.confirmedKnowledge), h('div', { className: 'pe-stat-label' }, t('overview.confirmed'))),
          h('div', { className: 'pe-card' }, h('div', { className: 'pe-stat-value pe-small', style: { fontSize: 13, fontWeight: 600 } }, status.lastAnalysisAt ? formatDate(status.lastAnalysisAt, locale) : t('overview.never')), h('div', { className: 'pe-stat-label' }, t('overview.lastAnalysis'))),
        ),
        h('div', { className: 'pe-grid pe-grid-2' },
          h('div', { className: 'pe-card' },
            h('h3', { className: 'pe-card-title' }, t('overview.project')),
            h('dl', { className: 'pe-kv' },
              h('dt', null, t('overview.root')), h('dd', null, h('span', { className: 'pe-code' }, project.root)),
              h('dt', null, t('overview.git')),
              h('dd', null, project.isGit
                ? h('span', { className: 'pe-inline' }, badge(git.branch || 'detached', 'brand'), badge(git.dirty ? t('overview.dirty') : t('overview.clean'), git.dirty ? 'warn' : 'ok'), git.head ? h('span', { className: 'pe-code' }, git.head) : null)
                : t('overview.notGit')),
              h('dt', null, t('common.session')), h('dd', null, data.session?.id ? h('span', { className: 'pe-code' }, data.session.id) : '—'),
            ),
          ),
          h('div', { className: 'pe-card' },
            h('h3', { className: 'pe-card-title' }, t('overview.limits')),
            h('div', { className: 'pe-stack' },
              h('div', null, t('overview.knowledgeCount', { n: counts.knowledge, max: config.maxKnowledgeEntries })),
              h('div', null, t('overview.proposalCount', { n: counts.proposals, max: config.maxProposals })),
              h('div', null, t('overview.retention', { n: config.retentionDays })),
              h('div', { className: 'pe-inline' },
                badge(config.enabled === false ? t('common.disabled') : t('common.enabled'), config.enabled === false ? 'warn' : 'ok'),
                badge(`${t('settings.autoAnalyze')}: ${config.autoAnalyze ? t('common.enabled') : t('common.disabled')}`, config.autoAnalyze ? '' : 'warn'),
                badge(config.autoAccept ? `${t('settings.autoAccept')}: ${t('common.enabled')}` : t('evolution.autoAcceptOff'), config.autoAccept ? 'warn' : ''),
              ),
            ),
          ),
        ),
        h('div', { className: 'pe-card' },
          h('h3', { className: 'pe-card-title' }, t('overview.how')),
          h('div', { className: 'pe-timeline' },
            [t('overview.step1'), t('overview.step2'), t('overview.step3')].map((text, index) =>
              h('div', { className: 'pe-time-item', key: index }, h('span', { className: 'pe-dot' }), h('div', null, h('span', { className: 'pe-time-title' }, `${index + 1}. `), h('span', { className: 'pe-muted' }, text)))),
          ),
        ),
        h('div', { className: 'pe-card' },
          h('h3', { className: 'pe-card-title' }, t('overview.recentRuns')),
          runs.length === 0 ? h('div', { className: 'pe-empty' }, t('overview.noRuns')) : h('div', { className: 'pe-list' },
            runs.map((run) => h('div', { key: run.id, className: 'pe-row', style: { cursor: 'default' } },
              h('div', { className: 'pe-row-main' },
                h('div', { className: 'pe-row-title' }, `${run.kind}${run.skill ? ` · ${run.skill}` : ''}`),
                h('div', { className: 'pe-row-sub' }, formatDate(run.createdAt, locale)),
              ),
              statusBadge(run.status, t),
            )),
          ),
        ),
      )
    }

    function SkillsTab({ data, t, locale, sessionId, busy, onAction, onSelectProposal, notify }) {
      const projectSkills = data.catalog.project
      const globals = data.catalog.global
      const [selectedName, setSelectedName] = React.useState(projectSkills[0]?.name || '')
      const [detail, setDetail] = React.useState(null)
      const [loadingDetail, setLoadingDetail] = React.useState(false)
      const [draft, setDraft] = React.useState('')
      const [draftReason, setDraftReason] = React.useState('')
      const [creating, setCreating] = React.useState(false)
      const [editing, setEditing] = React.useState(false)
      const [newName, setNewName] = React.useState('')
      const [dirty, setDirty] = React.useState(false)

      const selected = projectSkills.find((skill) => skill.name === selectedName)

      React.useEffect(() => {
        if (!selectedName || creating) {
          setDetail(null)
          return undefined
        }
        let alive = true
        setLoadingDetail(true)
        apiGet('/skill', { sessionId, name: selectedName })
          .then((result) => {
            if (!alive) return
            setDetail(result)
            if (!dirty) setDraft(result.skill?.content || '')
          })
          .catch((error) => notify(error.message, 'error'))
          .finally(() => { if (alive) setLoadingDetail(false) })
        return () => { alive = false }
      }, [selectedName, data.generatedAt, creating])

      function startNew() {
        setCreating(true)
        setEditing(false)
        setSelectedName('')
        setDirty(false)
        setNewName('')
        setDraftReason('')
        setDraft(templateSkill('', data.project.name))
        setDetail(null)
      }

      function startEdit() {
        if (!detail?.skill) return
        setCreating(false)
        setEditing(true)
        setDirty(false)
        setDraft(detail.skill.content)
        setDraftReason('')
      }

      function cancelEdit() {
        setEditing(false)
        setDirty(false)
        setDraft(detail?.skill?.content || '')
        setDraftReason('')
      }

      async function saveProposal() {
        if (!draft.trim()) {
          notify(t('skills.noChanges'), 'warn')
          return
        }
        if (!dirty && !creating) {
          notify(t('skills.noChanges'), 'warn')
          return
        }
        const content = creating && newName.trim()
          ? draft.replace(/^name:\s*.*$/m, `name: "${newName.trim()}"`)
          : draft
        const payload = creating
          ? { action: 'propose', name: newName.trim(), content, reason: draftReason || 'Manual skill draft.' }
          : { action: 'propose-edit', skill: selectedName, content, reason: draftReason || 'Manual edit.' }
        payload.sessionId = sessionId
        const result = await onAction(payload, t('skills.saveProposal'))
        const proposal = result?.proposal?.proposal || result?.proposal || result
        if (!proposal?.id) return
        setDirty(false)
        setEditing(false)
        setCreating(false)
        onSelectProposal(proposal.id)
      }

      async function toggleSkill() {
        if (!detail?.skill) return
        await onAction({ action: 'set-enabled', skill: selectedName, enabled: !detail.skill.enabled, sessionId }, t('common.saving'))
      }

      async function archiveSkill() {
        if (!detail?.skill) return
        if (!window.confirm(t('skills.archiveConfirm'))) return
        const result = await onAction({ action: 'archive', skill: selectedName, sessionId }, t('common.saving'))
        if (!result) return
        setSelectedName('')
        setDetail(null)
      }

      async function publishSkill() {
        if (!detail?.skill) return
        if (!data.config.globalPublishAllowed) {
          notify(t('skills.publishDisabled'), 'warn')
          return
        }
        if (!window.confirm(t('skills.publishConfirm', { skill: selectedName }))) return
        await onAction({ action: 'publish-global', skill: selectedName, confirm: true, sessionId }, t('common.saving'))
      }

      async function rollback(version) {
        if (!window.confirm(t('skills.rollbackConfirm', { skill: selectedName, version }))) return
        await onAction({ action: 'rollback', skill: selectedName, version, sessionId }, t('skills.rollback'))
        setDirty(false)
      }

      const canArchive = detail?.skill?.scope === 'project' && detail?.skill?.metadata?.created_by === 'project-evolution'
      return h('div', { className: 'pe-split' },
        h('div', { className: 'pe-card' },
          h('div', { className: 'pe-section-head' },
            h('h3', null, t('skills.projectGroup')),
            h(Button, { variant: 'ghost', onClick: startNew, title: t('skills.new') }, `+ ${t('skills.new')}`),
          ),
          h('div', { className: 'pe-list pe-scroll' },
            projectSkills.length === 0 ? h('div', { className: 'pe-empty' }, t('skills.empty')) : projectSkills.map((skill) =>
              h('button', {
                type: 'button', key: skill.name, className: 'pe-row', 'aria-selected': !creating && selectedName === skill.name,
                onClick: () => { setCreating(false); setEditing(false); setSelectedName(skill.name); setDirty(false) },
              },
                h('div', { className: 'pe-row-main' },
                  h('div', { className: 'pe-row-title' }, skill.name),
                  h('div', { className: 'pe-row-sub' }, skill.description || skill.relativePath),
                ),
                skill.enabled ? null : badge(t('common.disabled'), 'warn'),
              )),
          ),
          h('div', { className: 'pe-global-note' },
            h('div', { className: 'pe-section-head', style: { marginBottom: 6 } }, h('h3', null, t('skills.globalGroup'))),
            globals.length === 0 ? h('div', { className: 'pe-small pe-muted' }, t('skills.globalEmpty')) : h('div', { className: 'pe-list pe-scroll' },
              globals.map((skill) => h('div', { key: skill.name, className: 'pe-row', style: { cursor: 'default' } },
                h('div', { className: 'pe-row-main' },
                  h('div', { className: 'pe-row-title' }, skill.name),
                  h('div', { className: 'pe-row-sub' }, skill.description),
                ),
                badge(t('common.global')),
              )),
            ),
          ),
        ),
        h('div', { className: 'pe-card' },
          creating || editing ? h('div', { className: 'pe-stack' },
            h('div', { className: 'pe-section-head' }, h('h3', null, creating ? t('skills.new') : t('skills.editor')), h('div', { className: 'pe-small pe-muted' }, t('skills.editorHint'))),
            creating ? h(Field, { label: t('skills.name') }, h('input', {
              className: 'pe-input', value: newName, placeholder: 'use-verified-workflow',
              onChange: (event) => {
                const value = event.target.value.toLowerCase()
                setNewName(value)
                if (!dirty) setDraft((current) => current.replace(/^name:\s*.*$/m, `name: "${value}"`))
              },
            })) : null,
            h(Field, { label: t('skills.reason') }, h('input', { className: 'pe-input', value: draftReason, onChange: (event) => setDraftReason(event.target.value) })),
            h(Field, { label: t('skills.content') }, h('textarea', { className: 'pe-textarea', value: draft, onChange: (event) => { setDraft(event.target.value); setDirty(true) } })),
            h('div', { className: 'pe-actions' },
              h(Button, { variant: 'primary', onClick: saveProposal, disabled: Boolean(busy) }, busy || t('skills.saveProposal')),
              h(Button, { variant: 'ghost', onClick: () => { setCreating(false); setEditing(false); if (creating) setSelectedName(projectSkills[0]?.name || ''); else cancelEdit() } }, t('common.cancel')),
            ),
          ) : !selected ? h('div', { className: 'pe-empty' }, t('skills.detailEmpty')) : loadingDetail && !detail
            ? h('div', { className: 'pe-loading' }, h('div', { className: 'pe-spinner' }), t('common.loading'))
            : h('div', { className: 'pe-stack' },
              h('div', { className: 'pe-section-head' },
                h('div', null,
                  h('div', { style: { fontWeight: 650, fontSize: 14 } }, selected.name),
                  h('div', { className: 'pe-small pe-muted' }, selected.relativePath || selected.path || ''),
                ),
                h('div', { className: 'pe-inline' },
                  badge(selected.scope === 'project' ? t('common.project') : t('common.global'), 'brand'),
                  badge(selected.enabled ? t('common.enabled') : t('common.disabled'), selected.enabled ? 'ok' : 'warn'),
                ),
              ),
              h('dl', { className: 'pe-kv' },
                h('dt', null, t('common.description')), h('dd', null, selected.description || '—'),
                h('dt', null, t('skills.whenToUse')), h('dd', null, selected.whenToUse || '—'),
                h('dt', null, t('skills.createdBy')), h('dd', null, selected.createdBy || '—'),
                h('dt', null, t('skills.confidence')), h('dd', null, selected.confidence || '—'),
                h('dt', null, t('skills.evidenceScore')), h('dd', null, selected.evidenceScore ? `${selected.evidenceScore}/100` : '—'),
              ),
              h('div', { className: 'pe-actions' },
                h(Button, { variant: 'primary', onClick: startEdit, disabled: !detail?.skill }, t('skills.editor')),
                h(Button, { onClick: toggleSkill, disabled: Boolean(busy) || !detail?.skill }, selected.enabled ? t('skills.disable') : t('skills.enable')),
                h(Button, { onClick: publishSkill, disabled: Boolean(busy) || !detail?.skill || !data.config.globalPublishAllowed, title: data.config.globalPublishAllowed ? '' : t('skills.publishDisabled') }, t('skills.publish')),
                canArchive ? h(Button, { variant: 'danger', onClick: archiveSkill, disabled: Boolean(busy) }, t('skills.archive')) : null,
              ),
              detail?.skill ? h('div', { className: 'pe-skill-body' }, detail.skill.content) : null,
              !creating && detail?.skill ? h('div', { className: 'pe-stack' },
                h('div', { className: 'pe-section-head' }, h('h3', null, t('skills.versions'))),
                (detail.versions || []).length === 0 ? h('div', { className: 'pe-empty' }, t('skills.noVersions')) : detail.versions.map((version) =>
                  h('div', { key: version.version, className: 'pe-card', style: { padding: 10 } },
                    h('div', { className: 'pe-inline' },
                      h('span', { className: 'pe-mono pe-small' }, version.version),
                      h('span', { className: 'pe-small pe-muted' }, formatDate(version.createdAt, locale)),
                      h('span', { className: 'pe-small pe-muted' }, t('common.bytes', { n: version.bytes })),
                      h('span', { className: 'pe-right' }, h(Button, { onClick: () => rollback(version.version), disabled: Boolean(busy) }, t('skills.rollback'))),
                    ),
                    h('details', { style: { marginTop: 6 } }, h('summary', { className: 'pe-small pe-muted' }, t('evolution.diff')), h(Diff, { diff: version.diff, t })),
                  )),
              ) : null,
            ),
        ),
      )
    }

    function EvolutionTab({ data, t, locale, sessionId, busy, onAction, selectedId, setSelectedId, notify }) {
      const [reason, setReason] = React.useState('')
      const proposals = data.proposals
      const selected = proposals.find((proposal) => proposal.id === selectedId) || proposals[0]

      async function accept() {
        if (!selected) return
        const untested = selected.tests?.status !== 'PASS'
        const message = untested ? t('evolution.acceptUntestedConfirm') : t('evolution.acceptConfirm')
        if (!window.confirm(message)) return
        await onAction({ action: 'accept', proposalId: selected.id, expectedRevision: selected.revision, sessionId }, t('evolution.accept'))
      }

      async function reject() {
        if (!selected) return
        if (!window.confirm(t('evolution.rejectConfirm'))) return
        await onAction({ action: 'reject', proposalId: selected.id, expectedRevision: selected.revision, reason: reason || 'Rejected by user.', sessionId }, t('evolution.reject'))
      }

      return h('div', { className: 'pe-split-narrow' },
        h('div', { className: 'pe-card' },
          h('div', { className: 'pe-section-head' }, h('h3', null, t('tabs.evolution')), h('span', { className: 'pe-badge' }, String(proposals.length))),
          proposals.length === 0 ? h('div', { className: 'pe-empty' }, t('evolution.empty')) : h('div', { className: 'pe-list pe-scroll' },
            proposals.map((proposal) => h('button', {
              type: 'button', key: proposal.id, className: 'pe-row', 'aria-selected': selected?.id === proposal.id,
              onClick: () => setSelectedId(proposal.id),
            },
              h('div', { className: 'pe-row-main' },
                h('div', { className: 'pe-row-title' }, proposal.skill),
                h('div', { className: 'pe-row-sub' }, `${proposal.kind} · ${formatDate(proposal.createdAt, locale)}`),
              ),
              statusBadge(proposal.status, t),
            )),
          ),
        ),
        h('div', { className: 'pe-card' },
          !selected ? h('div', { className: 'pe-empty' }, t('evolution.detailEmpty')) : h('div', { className: 'pe-stack' },
            h('div', { className: 'pe-section-head' },
              h('div', null,
                h('div', { style: { fontWeight: 650, fontSize: 14 } }, selected.skill),
                h('div', { className: 'pe-small pe-muted' }, `${selected.id} · ${formatDate(selected.createdAt, locale)}`),
              ),
              statusBadge(selected.status, t),
            ),
            h('div', { className: 'pe-alert' }, selected.reason),
            !data.config.autoAccept ? h('div', { className: 'pe-alert pe-alert-ok' }, t('evolution.autoAcceptOff')) : h('div', { className: 'pe-alert pe-alert-warn' }, t('evolution.autoAcceptOnWarning')),
            h('div', { className: 'pe-grid pe-grid-2' },
              h('div', { className: 'pe-card', style: { padding: 10 } },
                h('h3', { className: 'pe-card-title' }, t('evolution.backtest')),
                h('div', { className: 'pe-inline' }, statusBadge(selected.tests?.status, t), h('span', { className: 'pe-small pe-muted' }, `${selected.tests?.candidate?.score ?? 0}%`)),
                h('div', { className: 'pe-small pe-muted', style: { marginTop: 6 } }, selected.tests?.note || t('evolution.noTestWarning')),
              ),
              h('div', { className: 'pe-card', style: { padding: 10 } },
                h('h3', { className: 'pe-card-title' }, t('evolution.checks')),
                h('div', { className: 'pe-checks' }, (selected.checks || []).map((check) =>
                  h('div', { className: 'pe-check', key: check.id },
                    h('span', { className: `pe-check-icon ${check.status === 'PASS' ? 'pe-badge-ok' : check.status === 'FAIL' ? 'pe-badge-bad' : 'pe-badge-warn'}` }, check.status === 'PASS' ? t('common.pass') : check.status === 'FAIL' ? t('common.fail') : t('common.notTested')),
                    h('span', null, check.label),
                  )),
                ),
              ),
            ),
            selected.tests?.status === 'NOT_TESTED' ? h('div', { className: 'pe-alert pe-alert-warn' }, t('evolution.notTestedExplain')) : null,
            h('div', { className: 'pe-section-head' }, h('h3', null, t('evolution.diff'))),
            h(Diff, { diff: selected.diff, t }),
            selected.status === 'proposed' ? h('div', { className: 'pe-stack' },
              h('div', { className: 'pe-divider' }),
              h(Field, { label: t('common.reason') }, h('input', { className: 'pe-input', value: reason, onChange: (event) => setReason(event.target.value) })),
              h('div', { className: 'pe-actions' },
                h(Button, { variant: 'primary', onClick: accept, disabled: Boolean(busy) }, t('evolution.accept')),
                h(Button, { variant: 'danger', onClick: reject, disabled: Boolean(busy) }, t('evolution.reject')),
              ),
            ) : null,
            selected.applied ? h('div', { className: 'pe-small pe-muted' }, `${t('evolution.applied')}: ${formatDate(selected.applied.at, locale)} · ${selected.applied.actor}`) : null,
          ),
        ),
      )
    }

    function KnowledgeTab({ t, locale, sessionId, busy, onAction, notify, knowledge, reloadKnowledge }) {
      const [query, setQuery] = React.useState('')
      const [showAdd, setShowAdd] = React.useState(false)
      const [form, setForm] = React.useState({ title: '', content: '', kind: 'note', tags: '', confidence: 'observed' })
      const filtered = knowledge.filter((row) => {
        if (!query.trim()) return true
        const haystack = `${row.title}\n${row.content}\n${(row.tags || []).join(' ')}`.toLowerCase()
        return haystack.includes(query.toLowerCase())
      })

      async function addNote() {
        if (!form.title.trim() || !form.content.trim()) {
          notify(t('common.error'), 'warn')
          return
        }
        const result = await onAction({ action: 'record-note', ...form, tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean), sessionId }, t('common.saving'))
        if (!result) return
        setShowAdd(false)
        setForm({ title: '', content: '', kind: 'note', tags: '', confidence: 'observed' })
        await reloadKnowledge()
      }

      async function remove(id) {
        if (!window.confirm(t('knowledge.deleteConfirm'))) return
        await onAction({ action: 'delete-knowledge', id, sessionId }, t('common.delete'))
        await reloadKnowledge()
      }

      return h('div', { className: 'pe-stack' },
        h('div', { className: 'pe-actions' },
          h('input', { className: 'pe-input', style: { maxWidth: 420 }, placeholder: t('knowledge.searchPlaceholder'), value: query, onChange: (event) => setQuery(event.target.value) }),
          h(Button, { variant: showAdd ? 'ghost' : 'primary', onClick: () => setShowAdd(!showAdd) }, showAdd ? t('common.cancel') : `+ ${t('knowledge.add')}`),
        ),
        showAdd ? h('div', { className: 'pe-card pe-form' },
          h(Field, { label: t('knowledge.title') }, h('input', { className: 'pe-input', value: form.title, onChange: (event) => setForm({ ...form, title: event.target.value }) })),
          h(Field, { label: t('knowledge.content') }, h('textarea', { className: 'pe-textarea pe-textarea-small', value: form.content, onChange: (event) => setForm({ ...form, content: event.target.value }) })),
          h('div', { className: 'pe-grid pe-grid-2' },
            h(Field, { label: t('knowledge.kind') }, h('select', { className: 'pe-select', value: form.kind, onChange: (event) => setForm({ ...form, kind: event.target.value }) },
              ['note', 'decision', 'pitfall', 'correction', 'solution'].map((kind) => h('option', { key: kind, value: kind }, t(`knowledge.kind.${kind}`))),
            )),
            h(Field, { label: t('knowledge.confidence') }, h('select', { className: 'pe-select', value: form.confidence, onChange: (event) => setForm({ ...form, confidence: event.target.value }) },
              h('option', { value: 'observed' }, t('knowledge.observed')),
              h('option', { value: 'confirmed' }, t('knowledge.confirmed')),
            )),
          ),
          h(Field, { label: t('knowledge.tags') }, h('input', { className: 'pe-input', value: form.tags, onChange: (event) => setForm({ ...form, tags: event.target.value }) })),
          h('div', { className: 'pe-actions' }, h(Button, { variant: 'primary', onClick: addNote, disabled: Boolean(busy) }, t('common.save'))),
        ) : null,
        filtered.length === 0 ? h('div', { className: 'pe-empty' }, t('knowledge.empty')) : h('div', { className: 'pe-list' },
          filtered.map((row) => h('div', { className: 'pe-card', key: row.id },
            h('div', { className: 'pe-inline' },
              badge(t(`knowledge.kind.${row.kind}`) || row.kind, 'brand'),
              badge(row.confidence === 'confirmed' ? t('knowledge.confirmed') : t('knowledge.observed'), row.confidence === 'confirmed' ? 'ok' : ''),
              row.untrusted ? badge(t('knowledge.untrusted'), 'warn') : null,
              h('span', { className: 'pe-small pe-muted' }, formatDate(row.createdAt, locale)),
              row.seenCount > 1 ? h('span', { className: 'pe-small pe-muted' }, t('knowledge.seen', { n: row.seenCount })) : null,
              h('span', { className: 'pe-right' }, h(Button, { variant: 'ghost', onClick: () => remove(row.id), disabled: Boolean(busy) }, t('common.delete'))),
            ),
            h('div', { style: { fontWeight: 600, margin: '6px 0 3px' } }, row.title),
            h('div', { style: { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' } }, row.content),
            row.tags?.length ? h('div', { className: 'pe-inline', style: { marginTop: 7 } }, row.tags.map((tag) => badge(tag))) : null,
            row.source?.sessionId ? h('div', { className: 'pe-small pe-muted', style: { marginTop: 7 } }, `${t('knowledge.source')}: ${row.source.sessionId}${row.source.turn ? ` · #${row.source.turn}` : ''}`) : null,
          )),
        ),
      )
    }

    function AutomationSettings({ config, t, busy, onAction, notify, storageRoot, globalScope }) {
      const [form, setForm] = React.useState(config || {})
      const [dirty, setDirty] = React.useState(false)
      React.useEffect(() => { if (!dirty && config) setForm(config) }, [config, dirty])
      const update = (key, value) => {
        setDirty(true)
        setForm((current) => ({ ...current, [key]: value }))
      }

      async function save() {
        const payload = {
          enabled: form.enabled !== false,
          autoAnalyze: form.autoAnalyze !== false,
          autoAccept: form.autoAccept === true,
          analyzeIntervalMinutes: Number(form.analyzeIntervalMinutes),
          maxAnalysesPerDay: Number(form.maxAnalysesPerDay),
          maxModelCallsPerDay: Number(form.maxModelCallsPerDay),
          maxInputChars: Number(form.maxInputChars),
          maxKnowledgeEntries: Number(form.maxKnowledgeEntries),
          maxProposals: Number(form.maxProposals),
          retentionDays: Number(form.retentionDays),
          minEvidenceScore: Number(form.minEvidenceScore),
          captureUserCorrections: form.captureUserCorrections !== false,
          requireTestsForAutoAccept: form.requireTestsForAutoAccept !== false,
          globalPublishAllowed: form.globalPublishAllowed === true,
        }
        const saved = await onAction({ action: 'save-settings', settings: payload }, t('common.saving'))
        if (saved) {
          setDirty(false)
          notify(t('settings.saved'), 'ok')
        }
      }

      if (!config) return h('div', { className: 'pe-empty' }, t('common.loading'))

      return h('div', { className: 'pe-stack' },
        h('div', { className: 'pe-section-head' },
          h('div', null,
            h('h3', null, t('settings.title')),
            h('div', { className: 'pe-small pe-muted' }, t('settings.subtitle')),
            globalScope ? h('div', { className: 'pe-small pe-muted', style: { marginTop: 3 } }, t('settings.globalScope')) : null,
          ),
        ),
        h('div', { className: 'pe-grid pe-grid-2' },
          h('div', { className: 'pe-stack' },
            h(Toggle, { checked: form.enabled !== false, onChange: (value) => update('enabled', value), title: t('settings.enabled'), hint: t('settings.enabledHint') }),
            h(Toggle, { checked: form.autoAnalyze !== false, onChange: (value) => update('autoAnalyze', value), title: t('settings.autoAnalyze'), hint: t('settings.autoAnalyzeHint') }),
            h(Toggle, { checked: form.captureUserCorrections !== false, onChange: (value) => update('captureUserCorrections', value), title: t('settings.corrections'), hint: t('settings.correctionsHint') }),
            h(Toggle, { checked: form.autoAccept === true, onChange: (value) => update('autoAccept', value), title: t('settings.autoAccept'), hint: t('settings.autoAcceptHint') }),
            h(Toggle, { checked: form.requireTestsForAutoAccept !== false, onChange: (value) => update('requireTestsForAutoAccept', value), title: t('settings.requireTests'), hint: t('settings.requireTestsHint') }),
            h(Toggle, { checked: form.globalPublishAllowed === true, onChange: (value) => update('globalPublishAllowed', value), title: t('settings.globalPublish'), hint: t('settings.globalPublishHint') }),
          ),
          h('div', { className: 'pe-stack' },
            h('div', { className: 'pe-card pe-form' },
              h('div', { className: 'pe-grid pe-grid-2' },
                h(Field, { label: t('settings.interval') }, h('input', { type: 'number', min: 1, max: 1440, className: 'pe-input', value: form.analyzeIntervalMinutes, onChange: (event) => update('analyzeIntervalMinutes', event.target.value) })),
                h(Field, { label: t('settings.maxAnalyses') }, h('input', { type: 'number', min: 1, max: 500, className: 'pe-input', value: form.maxAnalysesPerDay, onChange: (event) => update('maxAnalysesPerDay', event.target.value) })),
                h(Field, { label: t('settings.maxKnowledge') }, h('input', { type: 'number', min: 20, max: 5000, className: 'pe-input', value: form.maxKnowledgeEntries, onChange: (event) => update('maxKnowledgeEntries', event.target.value) })),
                h(Field, { label: t('settings.maxProposals') }, h('input', { type: 'number', min: 10, max: 2000, className: 'pe-input', value: form.maxProposals, onChange: (event) => update('maxProposals', event.target.value) })),
                h(Field, { label: t('settings.retention') }, h('input', { type: 'number', min: 1, max: 3650, className: 'pe-input', value: form.retentionDays, onChange: (event) => update('retentionDays', event.target.value) })),
                h(Field, { label: t('settings.minScore'), hint: t('settings.minScoreHint') }, h('input', { type: 'number', min: 1, max: 100, className: 'pe-input', value: form.minEvidenceScore, onChange: (event) => update('minEvidenceScore', event.target.value) })),
              ),
            ),
            h('div', { className: 'pe-card' },
              h('h3', { className: 'pe-card-title' }, t('settings.modelTitle')),
              h('div', { className: 'pe-small pe-muted', style: { marginBottom: 8 } }, t('settings.modelHint')),
              h('div', { className: 'pe-inline' }, badge(t('settings.modelCallsZero'), 'ok'), h('span', { className: 'pe-small pe-muted' }, t('settings.maxModelCalls') + ': 0')),
            ),
            storageRoot ? h('div', { className: 'pe-card' },
              h('h3', { className: 'pe-card-title' }, t('settings.storage')),
              h('div', { className: 'pe-small pe-muted' }, t('settings.storageHint')),
              h('div', { className: 'pe-code', style: { marginTop: 7 } }, storageRoot + '/.dsh/project-evolution'),
              h('div', { className: 'pe-code', style: { marginTop: 4 } }, storageRoot + '/.dsh/skills'),
            ) : null,
            form.autoAccept ? h('div', { className: 'pe-alert pe-alert-warn' }, t('settings.autoAcceptOnWarning')) : null,
            h('div', { className: 'pe-actions' }, h(Button, { variant: 'primary', onClick: save, disabled: Boolean(busy) }, busy || t('common.save'))),
          ),
        ),
      )
    }

    function templateSkill(name, projectName) {
      const skillName = name || 'use-verified-project-workflow'
      return `---
name: "${skillName}"
description: "Use when working on a verified ${projectName || 'project'} procedure. Replace this draft with a concrete trigger."
whenToUse: "Describe the exact task shape that should load this skill."
created_by: project-evolution
confidence: observed
evidence_score: 0
---

# Replace with the procedure title

## When to use

State the concrete trigger, project area, and preconditions.

## Procedure

1. Inspect the current state.
2. Apply the smallest change.
3. Run the verification command.
4. Report the real command output.

## Verification

- Replace with an actual command from this project.

## Pitfalls

- Do not copy secrets into this skill.
- Do not claim a check passed without output.
`
    }

    function ProjectEvolution(props) {
      const ctx = props.pluginContext
      const revision = useLocaleRevision(ctx)
      const t = React.useMemo(() => bindT(ctx), [ctx, revision])
      const locale = ctx.locale.getSnapshot().active
      const session = currentSession(props.useSessions, props.sessionId)
      const sessionId = session?.id
      const [tab, setTab] = React.useState('overview')
      const [data, setData] = React.useState(null)
      const [knowledge, setKnowledge] = React.useState([])
      const [loading, setLoading] = React.useState(true)
      const [busy, setBusy] = React.useState('')
      const [error, setError] = React.useState('')
      const [notice, setNotice] = React.useState(null)
      const [selectedProposal, setSelectedProposal] = React.useState('')
      const [generatedAt, setGeneratedAt] = React.useState(0)
      const loadedRef = React.useRef(false)
      const requestRef = React.useRef(0)
      const knowledgeRequestRef = React.useRef(0)

      const notify = React.useCallback((message, kind = 'error') => {
        setNotice({ message, kind })
        if (kind === 'ok') {
          window.setTimeout(() => setNotice((current) => (current?.message === message ? null : current)), 3500)
        }
      }, [])

      const loadKnowledge = React.useCallback(async (query = '') => {
        if (!sessionId) return
        const requestId = ++knowledgeRequestRef.current
        try {
          const result = await apiGet('/knowledge', { sessionId, query })
          if (requestId !== knowledgeRequestRef.current) return
          setKnowledge(result.knowledge || [])
        } catch (loadError) {
          if (requestId === knowledgeRequestRef.current) notify(loadError.message, 'error')
        }
      }, [sessionId, notify])

      const load = React.useCallback(async () => {
        // Only the first load replaces the whole page with a spinner. Polls and
        // actions must not unmount tabs, or an unsaved draft would disappear.
        if (!loadedRef.current) setLoading(true)
        setError('')
        const requestId = ++requestRef.current
        try {
          if (!sessionId) {
            if (requestId !== requestRef.current) return
            setData(null)
            setKnowledge([])
            setLoading(false)
            return
          }
          const [overview, knowledgeResult] = await Promise.all([
            apiGet('/overview', { sessionId }),
            apiGet('/knowledge', { sessionId }),
          ])
          if (requestId !== requestRef.current) return
          setData(overview)
          setKnowledge(knowledgeResult.knowledge || [])
          setGeneratedAt(Date.now())
          loadedRef.current = true
        } catch (loadError) {
          if (requestId === requestRef.current) setError(t('error.load', { message: loadError.message }))
        } finally {
          if (requestId === requestRef.current) setLoading(false)
        }
      }, [sessionId, t])

      React.useEffect(() => {
        requestRef.current += 1
        knowledgeRequestRef.current += 1
        loadedRef.current = false
        setData(null)
        setLoading(true)
      }, [sessionId])

      React.useEffect(() => { load() }, [load])

      React.useEffect(() => {
        const timer = window.setInterval(() => { load() }, 30000)
        return () => window.clearInterval(timer)
      }, [load])

      async function onAction(payload, busyLabel) {
        setBusy(String(busyLabel || t('common.saving')))
        setNotice(null)
        try {
          const result = await apiPost({ ...payload, sessionId })
          await load()
          return result?.result
        } catch (actionError) {
          notify(t('error.action', { message: actionError.message }), 'error')
          return null
        } finally {
          setBusy('')
        }
      }

      async function analyze() {
        const result = await onAction({ action: 'analyze' }, t('common.analyze'))
        if (!result) return
        const proposal = result.proposal?.proposal || result.proposal
        if (proposal?.id) {
          setSelectedProposal(proposal.id)
          setTab('evolution')
          notify(t('evolution.proposed'), 'ok')
        } else {
          notify(result.signals?.substantive ? t('evolution.empty') : t('skills.empty'), 'warn')
        }
      }

      const tabs = [
        ['overview', 'tabs.overview'],
        ['skills', 'tabs.skills'],
        ['evolution', 'tabs.evolution'],
        ['knowledge', 'tabs.knowledge'],
      ]

      return h('div', { className: 'pe-root' },
        h('div', { className: 'pe-head' },
          h('div', null,
            h('h2', { className: 'pe-title' }, t('title')),
            h('p', { className: 'pe-sub' }, t('subtitle')),
          ),
          h('div', { className: 'pe-head-actions' },
            h(Button, { onClick: load, disabled: loading || Boolean(busy) }, t('common.refresh')),
            h(Button, { onClick: analyze, disabled: !sessionId || Boolean(busy), title: !sessionId ? t('error.noSession') : '' }, t('common.analyze')),
          ),
        ),
        h('div', { className: 'pe-tabs', role: 'tablist' }, tabs.map(([id, key]) =>
          h('button', {
            type: 'button', key: id, role: 'tab', className: 'pe-tab', 'aria-selected': tab === id,
            onClick: () => setTab(id),
          }, t(key)),
        )),
        error ? h('div', { className: 'pe-alert pe-alert-error' }, error) : null,
        notice ? h('div', { className: `pe-alert ${notice.kind === 'ok' ? 'pe-alert-ok' : notice.kind === 'warn' ? 'pe-alert-warn' : 'pe-alert-error'}` },
          h('div', { className: 'pe-inline' }, h('span', null, notice.message), h('span', { className: 'pe-right' }, h(Button, { variant: 'ghost', onClick: () => setNotice(null) }, t('common.dismiss')))),
        ) : null,
        !sessionId ? h('div', { className: 'pe-alert pe-alert-warn' }, t('error.noSession')) : null,
        loading ? h('div', { className: 'pe-loading' }, h('div', { className: 'pe-spinner' }), t('common.loading'))
          : !data ? h('div', { className: 'pe-empty' }, error || t('error.noSession'))
            : h(React.Fragment, null,
              tab === 'overview' ? h(Overview, { data, t, locale }) : null,
              tab === 'skills' ? h(SkillsTab, { data, t, locale, sessionId, busy: Boolean(busy), onAction, onSelectProposal: (id) => { setSelectedProposal(id); setTab('evolution') }, notify }) : null,
              tab === 'evolution' ? h(EvolutionTab, { data, t, locale, sessionId, busy: Boolean(busy), onAction, selectedId: selectedProposal, setSelectedId: setSelectedProposal, notify }) : null,
              tab === 'knowledge' ? h(KnowledgeTab, { t, locale, sessionId, busy: Boolean(busy), onAction, notify, knowledge, reloadKnowledge: () => loadKnowledge() }) : null,
            ),
      )
    }

    function ProjectEvolutionSettingsPage(props) {
      const ctx = props.pluginContext
      const revision = useLocaleRevision(ctx)
      const t = React.useMemo(() => bindT(ctx), [ctx, revision])
      const locale = ctx.locale.getSnapshot().active
      const [projects, setProjects] = React.useState([])
      const [config, setConfig] = React.useState(null)
      const [selectedKey, setSelectedKey] = React.useState('')
      const [detail, setDetail] = React.useState(null)
      const [reloadToken, setReloadToken] = React.useState(0)
      const [loading, setLoading] = React.useState(true)
      const [detailLoading, setDetailLoading] = React.useState(false)
      const [busy, setBusy] = React.useState('')
      const [error, setError] = React.useState('')
      const [notice, setNotice] = React.useState(null)
      const rootRef = React.useRef(null)

      React.useEffect(() => {
        const node = rootRef.current
        if (!node || typeof node.getBoundingClientRect !== 'function') return
        if (node.getBoundingClientRect().top < 0 && typeof node.scrollIntoView === 'function') {
          node.scrollIntoView({ block: 'start', inline: 'nearest' })
        }
      }, [])

      const notify = React.useCallback((message, kind = 'error') => {
        setNotice({ message, kind })
        if (kind === 'ok') {
          window.setTimeout(() => setNotice((current) => (current?.message === message ? null : current)), 3500)
        }
      }, [])

      const loadProjects = React.useCallback(async () => {
        setLoading(true)
        setError('')
        try {
          const result = await apiGet('/projects')
          const rows = Array.isArray(result.projects) ? result.projects : []
          setProjects(rows)
          setConfig(result.config || null)
          setSelectedKey((current) => (rows.some((row) => row.key === current) ? current : (rows[0]?.key || '')))
          setReloadToken((value) => value + 1)
        } catch (loadError) {
          setError(t('error.load', { message: loadError.message }))
        } finally {
          setLoading(false)
        }
      }, [t])

      React.useEffect(() => { loadProjects() }, [loadProjects])

      const selected = projects.find((row) => row.key === selectedKey)
      const sessionId = selected?.sessionId || ''

      React.useEffect(() => {
        let alive = true
        if (!sessionId) {
          setDetail(null)
          setDetailLoading(false)
          return () => { alive = false }
        }
        setDetail(null)
        setDetailLoading(true)
        apiGet('/overview', { sessionId })
          .then((result) => { if (alive) setDetail(result) })
          .catch((loadError) => { if (alive) notify(t('error.load', { message: loadError.message }), 'error') })
          .finally(() => { if (alive) setDetailLoading(false) })
        return () => { alive = false }
      }, [sessionId, reloadToken, t, notify])

      async function onAction(payload, busyLabel) {
        setBusy(String(busyLabel || t('common.saving')))
        setNotice(null)
        try {
          const result = await apiPost(payload)
          if (result?.result?.config) setConfig(result.result.config)
          return result?.result
        } catch (actionError) {
          notify(t('error.action', { message: actionError.message }), 'error')
          return null
        } finally {
          setBusy('')
        }
      }

      const counts = detail?.status?.counts || {}
      const skills = detail?.catalog?.project || []
      const selectedTitle = selected ? (selected.title || selected.name || t('settings.untitledProject')) : ''

      return h('div', { ref: rootRef, className: 'pe-root pe-global-settings' },
        h('div', { className: 'pe-head' },
          h('div', null,
            h('h2', { className: 'pe-title' }, t('settings.projectsTitle')),
            h('p', { className: 'pe-sub' }, t('settings.projectsSubtitle')),
          ),
          h('div', { className: 'pe-head-actions' },
            h(Button, { onClick: loadProjects, disabled: loading || Boolean(busy) }, t('settings.refreshProjects')),
          ),
        ),
        error ? h('div', { className: 'pe-alert pe-alert-error' }, error) : null,
        notice ? h('div', { className: `pe-alert ${notice.kind === 'ok' ? 'pe-alert-ok' : notice.kind === 'warn' ? 'pe-alert-warn' : 'pe-alert-error'}` },
          h('div', { className: 'pe-inline' }, h('span', null, notice.message), h('span', { className: 'pe-right' }, h(Button, { variant: 'ghost', onClick: () => setNotice(null) }, t('common.dismiss')))),
        ) : null,
        loading ? h('div', { className: 'pe-loading' }, h('div', { className: 'pe-spinner' }), t('common.loading'))
          : h(React.Fragment, null,
            h('div', { className: 'pe-card' },
              h('div', { className: 'pe-section-head' },
                h('h3', null, t('settings.projectPicker')),
                h('span', { className: 'pe-badge' }, t('settings.projectsCount', { n: projects.length })),
              ),
              projects.length === 0 ? h('div', { className: 'pe-empty' }, t('settings.noProjects'))
                : h(React.Fragment, null,
                  h(Field, { label: t('common.project') },
                    h('select', {
                      className: 'pe-select',
                      value: selectedKey,
                      onChange: (event) => { setSelectedKey(event.target.value); setDetail(null) },
                    }, projects.map((project) => h('option', { key: project.key, value: project.key }, `${project.title || project.name} — ${project.root}`))),
                  ),
                  selected ? h('dl', { className: 'pe-kv', style: { marginTop: 12 } },
                    h('dt', null, t('common.project')),
                    h('dd', null, selectedTitle),
                    h('dt', null, t('overview.root')),
                    h('dd', null, h('span', { className: 'pe-code' }, selected.root)),
                    h('dt', null, t('settings.projectLastActive')),
                    h('dd', null, formatDate(selected.lastActiveAt, locale)),
                    h('dt', null, t('settings.folders')),
                    h('dd', null, String(selected.workspaceCount ?? 0)),
                    h('dt', null, t('settings.chats')),
                    h('dd', null, String(selected.sessionCount ?? 0)),
                  ) : null,
                  selected ? h('div', { style: { marginTop: 12 } },
                    h('div', { className: 'pe-small pe-muted' }, t('settings.projectStorageTitle')),
                    h('div', { className: 'pe-code', style: { marginTop: 5 } }, selected.root + '/.dsh/project-evolution'),
                    h('div', { className: 'pe-code', style: { marginTop: 4 } }, selected.root + '/.dsh/skills'),
                  ) : null,
                ),
            ),
            selected && !sessionId ? h('div', { className: 'pe-alert pe-alert-warn' }, t('settings.noProjectSession')) : null,
            detailLoading ? h('div', { className: 'pe-loading' }, h('div', { className: 'pe-spinner' }), t('common.loading')) : null,
            detail ? h('div', { className: 'pe-stack' },
              h('div', { className: 'pe-grid pe-grid-4' },
                h('div', { className: 'pe-card' }, h('div', { className: 'pe-stat-value' }, String(skills.length)), h('div', { className: 'pe-stat-label' }, t('settings.projectSkills'))),
                h('div', { className: 'pe-card' }, h('div', { className: 'pe-stat-value' }, String(counts.knowledge ?? 0)), h('div', { className: 'pe-stat-label' }, t('settings.projectKnowledge'))),
                h('div', { className: 'pe-card' }, h('div', { className: 'pe-stat-value' }, String(counts.pendingProposals ?? 0)), h('div', { className: 'pe-stat-label' }, t('settings.projectPending'))),
                h('div', { className: 'pe-card' }, h('div', { className: 'pe-stat-value' }, String(selected?.sessionCount ?? 0)), h('div', { className: 'pe-stat-label' }, t('settings.chats'))),
              ),
              h('div', { className: 'pe-grid pe-grid-2' },
                h('div', { className: 'pe-card' },
                  h('div', { className: 'pe-section-head' },
                    h('h3', null, t('settings.projectSkillsTitle')),
                    h('span', { className: 'pe-badge' }, String(skills.length)),
                  ),
                  skills.length === 0 ? h('div', { className: 'pe-empty' }, t('settings.projectNoSkills'))
                    : h('div', { className: 'pe-list pe-scroll' }, skills.map((skill) => h('div', { key: skill.name, className: 'pe-row', style: { cursor: 'default' } },
                      h('div', { className: 'pe-row-main' },
                        h('div', { className: 'pe-row-title' }, skill.name),
                        h('div', { className: 'pe-row-sub' }, skill.description || skill.relativePath || ''),
                      ),
                      h('div', { className: 'pe-inline' },
                        badge(skill.enabled ? t('common.enabled') : t('common.disabled'), skill.enabled ? 'ok' : 'warn'),
                        Number(skill.evidenceScore) ? badge(`${t('common.evidence')} ${skill.evidenceScore}`) : null,
                      ),
                    ))),
                ),
                h('div', { className: 'pe-card' },
                  h('h3', { className: 'pe-card-title' }, t('settings.projectNextTitle')),
                  h('div', { className: 'pe-small pe-muted', style: { marginTop: 7 } }, t('settings.projectOpenHint')),
                ),
              ),
            ) : null,
            config ? h(AutomationSettings, { config, t, busy, onAction, notify, storageRoot: '', globalScope: true })
              : h('div', { className: 'pe-empty' }, error || t('common.loading')),
          ),
      )
    }

    function ProjectEvolutionView(props) {
      const ctx = props.pluginContext
      return h(ProjectEvolution, { ...props, pluginContext: ctx })
    }

    function ProjectEvolutionSettings(props) {
      const ctx = props.pluginContext
      return h(ProjectEvolutionSettingsPage, { ...props, pluginContext: ctx })
    }

    return {
      name: 'dsh-project-evolution',
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { en, ru }), 'project-evolution: dictionaries')
        ctx.slots.inject('conversation.view', () => ctx.slots.register({
          name: 'conversation.view',
          id: 'project-evolution',
          order: 40,
          // The shell caps a tab label at 88px. The full product name stays in
          // the view heading and the Settings label; this keeps the fifth tab
          // readable instead of ellipsizing to "Project Evolu…".
          label: () => ctx.locale.bind(NS)('nav.conversation'),
          locale: NS,
        }, (props) => h(ProjectEvolutionView, { ...props, pluginContext: ctx })))
        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'project-evolution',
          order: 35,
          label: () => ctx.locale.bind(NS)('nav'),
          locale: NS,
        }, (props) => h(ProjectEvolutionSettings, { ...props, pluginContext: ctx })))
      },
    }
  },
})
