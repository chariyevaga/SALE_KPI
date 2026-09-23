export type Locale = 'tr' | 'en' | 'ru' | 'tk';

export const SUPPORTED_LOCALES: Locale[] = ['tr', 'en', 'ru', 'tk'];

export const LOCALE_LABELS: Record<Locale, string> = {
  tr: 'Türkçe',
  en: 'English',
  ru: 'Русский',
  tk: 'Türkmen',
};

interface TranslationShape {
  common: {
    showPassword: string;
    hidePassword: string;
    close: string;
    closeDialog: string;
    breadcrumb: string;
    cancel: string;
    confirm: string;
    confirmTitle: string;
    apply: string;
    clear: string;
    home: string;
    bulkActions: string;
    selectedCount: string;
    clearSelection: string;
    selectAll: string;
    selectItem: string;
  };
  login: {
    brand: string;
    title: string;
    subtitle: string;
    usernameLabel: string;
    usernamePlaceholder: string;
    passwordLabel: string;
    submit: string;
    submitting: string;
    errorInvalidCredentials: string;
    errorGeneric: string;
    sessionExpired: string;
    rememberMe: string;
    forgotPassword: string;
    forgotPasswordHelp: string;
  };
  appShell: {
    logout: string;
    language: string;
    openMenu: string;
    closeMenu: string;
    navEmployees: string;
    navLeaderboard: string;
    navMyKpi: string;
    navKpiPlans: string;
    navVisitorCounts: string;
    navKpiTemplates: string;
    navSettings: string;
    navSessions: string;
  };
  employees: {
    title: string;
    loading: string;
    errorLoading: string;
    empty: string;
    managerBadge: string;
    inactiveBadge: string;
    addEmployee: string;
    statusColumn: string;
    searchPlaceholder: string;
    noSearchResults: string;
    filters: string;
    resultCount: string;
    filtersActiveCount: string;
    filterStatusAll: string;
    filterOnlyActive: string;
    filterOnlyInactive: string;
    filterManagers: string;
    filterErpLinked: string;
    filterWithAvatar: string;
    sortLabel: string;
    sortFirstnameAsc: string;
    sortFirstnameDesc: string;
    sortLastname: string;
    sortUsername: string;
    sortNewest: string;
    sortOldest: string;
    columnLastname: string;
    columnUsername: string;
    columnPhone: string;
    columnActions: string;
    openCard: string;
    editEmployee: string;
    activeBadge: string;
    bulkActivate: string;
    bulkDeactivate: string;
    bulkDeactivateConfirm: string;
    bulkActivated: string;
    bulkDeactivated: string;
    bulkError: string;
    selfSelectHint: string;
  };
  settings: {
    profilePhoto: string;
    changePhoto: string;
    cropPhoto: string;
    cropHint: string;
    zoom: string;
    cropSave: string;
    photoError: string;
    photoReadError: string;
    changePassword: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    passwordMismatch: string;
    passwordTooShort: string;
    currentPasswordIncorrect: string;
    passwordChangeError: string;
    passwordUpdated: string;
    submitPassword: string;
    saving: string;
    theme: string;
    themeLight: string;
    themeDark: string;
    themeSystem: string;
  };
  sessions: {
    title: string;
    loading: string;
    errorLoading: string;
    empty: string;
    currentDevice: string;
    lastSeen: string;
    signedInAt: string;
    expiresAt: string;
    ipAddress: string;
    unknownDevice: string;
    revoke: string;
    revoking: string;
    logoutAll: string;
    logoutAllConfirm: string;
    revokeConfirm: string;
    rememberMeBadge: string;
    shortSessionBadge: string;
    expiryHint: string;
    revokeError: string;
    logoutAllError: string;
  };
  employeeCard: {
    title: string;
    email: string;
    erpCode: string;
    noErpLink: string;
    scanHint: string;
    noQrHint: string;
    viewPhoto: string;
    managerRole: string;
    employeeRole: string;
  };
  employeeForm: {
    tabDetails: string;
    tabSessions: string;
    tabKpi: string;
    tabKpiPlans: string;
    tabSalary: string;
    goToKpiPlans: string;
    sessionsRevokeAll: string;
    titleCreate: string;
    titleEdit: string;
    loading: string;
    errorLoading: string;
    erpEmployeesError: string;
    usernameLabel: string;
    passwordLabelCreate: string;
    passwordLabelEdit: string;
    passwordHintEdit: string;
    firstnameLabel: string;
    lastnameLabel: string;
    emailLabel: string;
    phoneLabel: string;
    fullAccessLabel: string;
    fullAccessHint: string;
    visitorCountsLabel: string;
    visitorCountsHint: string;
    erpEmployeeLabel: string;
    erpEmployeeNone: string;
    erpEmployeeSearchPlaceholder: string;
    erpEmployeeNoResults: string;
    save: string;
    saving: string;
    deactivate: string;
    deactivating: string;
    reactivate: string;
    reactivating: string;
    selfDeactivateHint: string;
    usernameRequired: string;
    usernameTooShort: string;
    passwordRequired: string;
    passwordTooShort: string;
    firstnameRequired: string;
    lastnameRequired: string;
    emailInvalid: string;
    deactivateError: string;
    reactivateError: string;
    genericSaveError: string;
  };
  kpiTemplates: {
    title: string;
    searchPlaceholder: string;
    statusLabel: string;
    statusAll: string;
    statusActive: string;
    statusInactive: string;
    loading: string;
    errorLoading: string;
    empty: string;
    noSearchResults: string;
    resultCount: string;
    add: string;
    inactiveBadge: string;
    kpiCount: string;
    weightSummary: string;
    columnName: string;
    columnDescription: string;
    columnKpis: string;
    columnWeight: string;
    columnStatus: string;
    columnActions: string;
    editTemplate: string;
    activeBadge: string;
    bulkCopy: string;
    bulkActivate: string;
    bulkDeactivate: string;
    bulkDeactivateConfirm: string;
    bulkCopied: string;
    bulkActivated: string;
    bulkDeactivated: string;
    bulkDelete: string;
    bulkDeleteConfirm: string;
    bulkDeleted: string;
    bulkDeleteInUse: string;
    bulkError: string;
  };
  kpiTemplateForm: {
    titleCreate: string;
    titleEdit: string;
    loading: string;
    errorLoading: string;
    nameLabel: string;
    namePlaceholder: string;
    descriptionLabel: string;
    itemsTitle: string;
    itemsHint: string;
    addItem: string;
    itemTitle: string;
    removeItem: string;
    definitionLabel: string;
    definitionPlaceholder: string;
    definitionNoResults: string;
    definitionsError: string;
    weightLabel: string;
    targetLabel: string;
    unitMoney: string;
    unitCount: string;
    unitScore: string;
    storesPlaceholder: string;
    storesNoResults: string;
    storesError: string;
    removeStore: string;
    itemGroupsPlaceholder: string;
    itemGroupsNoResults: string;
    itemGroupsError: string;
    itemGroupOption: string;
    removeItemGroup: string;
    ungroupedHint: string;
    unknownItemGroup: string;
    selectPlaceholder: string;
    noInputs: string;
    totalWeight: string;
    totalWeightUnder: string;
    totalWeightOver: string;
    weightOver: string;
    weightUnder: string;
    save: string;
    saving: string;
    inactiveNotice: string;
    deactivate: string;
    deactivating: string;
    reactivate: string;
    reactivating: string;
    deactivateError: string;
    delete: string;
    deleting: string;
    deleteConfirm: string;
    deleteHint: string;
    deleteError: string;
    deleteInUse: string;
    copy: string;
    copying: string;
    copyHint: string;
    copyError: string;
    copiedNotice: string;
    nameRequired: string;
    itemsRequired: string;
    definitionRequired: string;
    weightInvalid: string;
    targetInvalid: string;
    inputRequired: string;
    duplicateItem: string;
    unknownDefinition: string;
    invalidInput: string;
    unknownStore: string;
    nameTaken: string;
    genericSaveError: string;
  };
  recordInfo: {
    buttonFor: string;
    title: string;
    createdBy: string;
    updatedBy: string;
    system: string;
    history: string;
    historyEmpty: string;
    historyHint: string;
    loading: string;
    error: string;
    loadMore: string;
    actionCreate: string;
    actionUpdate: string;
    actionDelete: string;
    actionActivate: string;
    actionDeactivate: string;
    viaBulkStatus: string;
    viaBulkCopy: string;
    copiedFrom: string;
    valueAdded: string;
    valueRemoved: string;
    valueChanged: string;
    valueYes: string;
    valueNo: string;
    valueActive: string;
    valueInactive: string;
    itemsBefore: string;
    itemsAfter: string;
    target: string;
    fields: {
      employees: {
        username: string;
        firstname: string;
        lastname: string;
        email: string;
        phoneNumber: string;
        erpEmployeeId: string;
        avatarId: string;
        fullAccess: string;
        canEnterVisitorCounts: string;
        isActive: string;
        passwordHash: string;
      };
      kpi_templates: {
        name: string;
        description: string;
        isActive: string;
        items: string;
      };
      kpi_periods: {
        year: string;
        month: string;
        status: string;
        closedAt: string;
      };
      kpi_assignments: {
        periodId: string;
        employeeId: string;
        templateId: string;
        templateName: string;
        items: string;
      };
      store_visitor_counts: {
        storeId: string;
        visitDate: string;
        visitorCount: string;
      };
      employee_salaries: {
        employeeId: string;
        effectiveMonth: string;
        amount: string;
        currency: string;
        fixedPercent: string;
        kpiPercent: string;
      };
    };
  };
  kpiPlans: {
    title: string;
    periodLabel: string;
    newPeriodTitle: string;
    year: string;
    month: string;
    open: string;
    statusOpen: string;
    statusClosed: string;
    closePeriod: string;
    newPeriod: string;
    closeConfirm: string;
    closeConfirmFinal: string;
    reopenPeriod: string;
    reopened: string;
    reopenExpired: string;
    periodOpenHint: string;
    periodClosedReopenable: string;
    periodClosedFinal: string;
    periodPlans: string;
    periodMissingTargets: string;
    deletePlan: string;
    deleted: string;
    closed: string;
    assign: string;
    assignTitle: string;
    templateLabel: string;
    employeesLabel: string;
    employeeSearch: string;
    assignSubmit: string;
    assigned: string;
    copyFrom: string;
    copyConfirm: string;
    copied: string;
    copiedNone: string;
    loading: string;
    errorLoading: string;
    empty: string;
    emptyPeriods: string;
    noSearchResults: string;
    searchPlaceholder: string;
    resultCount: string;
    targetProgress: string;
    columnEmployee: string;
    columnTemplate: string;
    columnTargets: string;
    columnActions: string;
    openPlan: string;
    openPlanShort: string;
    calculateAll: string;
    calculatingAll: string;
    calculatedAll: string;
    calculatedAllIncomplete: string;
    columnScore: string;
    noScore: string;
    scoreValue: string;
    assignError: string;
    alreadyAssigned: string;
    ineligible: string;
    reasonInactive: string;
    reasonMissingErpLink: string;
    reasonAlreadyAssigned: string;
    periodClosedError: string;
    selectTemplate: string;
    employeesEmpty: string;
  };
  kpiPlanForm: {
    title: string;
    loading: string;
    errorLoading: string;
    save: string;
    saved: string;
    saveError: string;
    closedError: string;
    invalidTarget: string;
    targetLabel: string;
    missingTarget: string;
    weight: string;
    stores: string;
    itemGroups: string;
    currency: string;
    recommendation: string;
    recommendationMonths: string;
    applyRecommendation: string;
    applyAll: string;
    applyConfirmOne: string;
    applyConfirmAll: string;
    applyConfirmButton: string;
    emptyTarget: string;
    combinedHint: string;
    manualHint: string;
    noRecommendation: string;
    deletePlan: string;
    deleteConfirm: string;
    deleteError: string;
    closedNotice: string;
    calculate: string;
    calculating: string;
    calculated: string;
    calculatedIncomplete: string;
    actualLabel: string;
    actualPlaceholder: string;
    actualHint: string;
    calculatedItem: string;
  };
  myKpi: {
    title: string;
    loading: string;
    errorLoading: string;
    empty: string;
    period: string;
    periodOption: string;
    periodOpen: string;
    periodClosed: string;
    weight: string;
    target: string;
    noTarget: string;
    emptyEmployee: string;
    errorLoadingEmployee: string;
  };
  leaderboard: {
    title: string;
    period: string;
    templateFilter: string;
    allTemplates: string;
    loading: string;
    errorLoading: string;
    empty: string;
    autoEvery: string;
    autoOff: string;
    periodClosed: string;
    updatedAt: string;
    notCalculated: string;
    scoredOf: string;
    you: string;
    rank: string;
    unranked: string;
    colRank: string;
    colEmployee: string;
    colTemplate: string;
    colScore: string;
    myStanding: string;
    placeShort: string;
    myNotCalculated: string;
    amongCount: string;
    gapToNext: string;
    leading: string;
    podium: string;
    others: string;
    openKpi: string;
  };
  salary: {
    loading: string;
    errorLoading: string;
    empty: string;
    noneYet: string;
    currentTitle: string;
    sinceMonth: string;
    fromMonth: string;
    inForce: string;
    history: string;
    fixedPart: string;
    kpiPart: string;
    splitLabel: string;
    add: string;
    addTitle: string;
    editTitle: string;
    editFor: string;
    deleteFor: string;
    deleteConfirm: string;
    deleteError: string;
    delete: string;
    effectiveMonth: string;
    effectiveHint: string;
    amount: string;
    amountPlaceholder: string;
    currency: string;
    fixedPercent: string;
    kpiPercent: string;
    preview: string;
    save: string;
    saving: string;
    saveError: string;
    errorMonthExists: string;
    errorPercentTotal: string;
  };
  kpiSalary: {
    title: string;
    since: string;
    show: string;
    hide: string;
    hidden: string;
    payable: string;
    fixedOnly: string;
    barLabel: string;
    fixedPart: string;
    kpiPart: string;
    byScore: string;
    fullSalary: string;
    interim: string;
    final: string;
    notCalculated: string;
    itemValue: string;
    itemEarned: string;
    noSalary: string;
    kpiEarnedShort: string;
    planListHint: string;
  };
  kpiProgress: {
    totalScore: string;
    outOf: string;
    notCalculated: string;
    calculatedAt: string;
    incomplete: string;
    achievement: string;
    percent: string;
    reached: string;
    actualOfTarget: string;
    actualOnly: string;
    contribution: string;
    noTarget: string;
    noActual: string;
    meterLabel: string;
    scoreMeterLabel: string;
  };
  visitorCounts: {
    title: string;
    store: string;
    date: string;
    count: string;
    countPlaceholder: string;
    save: string;
    update: string;
    saving: string;
    saved: string;
    replaceHint: string;
    existing: string;
    loading: string;
    errorLoading: string;
    empty: string;
    people: string;
    edit: string;
    editFor: string;
    deleteFor: string;
    deleteConfirm: string;
    deleted: string;
    errorUnknownStore: string;
    errorFutureDate: string;
    errorClosed: string;
    saveError: string;
    columnDate: string;
    columnStore: string;
    columnCount: string;
    columnActions: string;
    add: string;
    addTitle: string;
    editTitle: string;
    filters: string;
    filterDates: string;
    filterFrom: string;
    filterTo: string;
    rangeInvalid: string;
    rangeFrom: string;
    rangeTo: string;
    removeFilter: string;
    resultCount: string;
    emptyFiltered: string;
  };
  errors: {
    generic: string;
    network: string;
    validation: string;
    unauthorized: string;
    forbidden: string;
    notFound: string;
    conflict: string;
    payloadTooLarge: string;
    tooManyRequests: string;
    server: string;
  };
}

export const translations: Record<Locale, TranslationShape> = {
  tr: {
    common: {
      showPassword: 'Parolayı göster',
      hidePassword: 'Parolayı gizle',
      close: 'Kapat',
      closeDialog: '{title} penceresini kapat',
      breadcrumb: 'Gezinme yolu',
      cancel: 'Vazgeç',
      confirm: 'Onayla',
      confirmTitle: 'Emin misiniz?',
      apply: 'Uygula',
      clear: 'Temizle',
      home: 'Ana sayfa',
      bulkActions: 'Toplu işlemler',
      selectedCount: '{count} seçili',
      clearSelection: 'Seçimi temizle',
      selectAll: 'Listelenenlerin tümünü seç',
      selectItem: '{name} seç',
    },
    login: {
      brand: 'Retail KPI Platform',
      title: 'Giriş yap',
      subtitle: 'Hesabınıza giriş yaparak başlayın',
      usernameLabel: 'Kullanıcı adı',
      usernamePlaceholder: 'Örn. admin',
      passwordLabel: 'Parola',
      submit: 'Giriş yap',
      submitting: 'Giriş yapılıyor…',
      errorInvalidCredentials: 'Kullanıcı adı veya parola hatalı.',
      errorGeneric: 'Giriş yapılamadı. Bağlantınızı kontrol edin.',
      sessionExpired: 'Oturumunuz sona erdi. Lütfen yeniden giriş yapın.',
      rememberMe: 'Beni hatırla',
      forgotPassword: 'Şifremi unuttum',
      forgotPasswordHelp:
        'Parola sıfırlama e-postası şu anda desteklenmiyor. Lütfen yöneticinizden parolanızı sıfırlamasını isteyin.',
    },
    appShell: {
      logout: 'Çıkış yap',
      language: 'Dil',
      openMenu: 'Menüyü aç',
      closeMenu: 'Menüyü kapat',
      navEmployees: 'Çalışanlar',
      navLeaderboard: 'Sıralama tablosu',
      navMyKpi: 'KPI’larım',
      navKpiPlans: 'KPI planları',
      navVisitorCounts: 'Ziyaretçi sayıları',
      navKpiTemplates: 'KPI şablonları',
      navSettings: 'Ayarlar',
      navSessions: 'Oturumlarım',
    },
    employees: {
      title: 'Çalışanlar',
      loading: 'Yükleniyor…',
      errorLoading: 'Çalışanlar yüklenemedi.',
      empty: 'Henüz çalışan eklenmemiş.',
      managerBadge: 'Yönetici',
      inactiveBadge: 'Pasif',
      addEmployee: 'Yeni çalışan ekle',
      statusColumn: 'Durum',
      searchPlaceholder: 'Ad, soyad, kullanıcı adı, e-posta veya telefonda ara',
      noSearchResults: 'Aramanızla eşleşen çalışan bulunamadı.',
      filters: 'Filtreler',
      resultCount: '{count} çalışan',
      filtersActiveCount: '{count} filtre aktif',
      filterStatusAll: 'Tümü',
      filterOnlyActive: 'Yalnızca aktif çalışanlar',
      filterOnlyInactive: 'Yalnızca pasif çalışanlar',
      filterManagers: 'Yalnızca yöneticiler',
      filterErpLinked: 'ERP personeline bağlı',
      filterWithAvatar: 'Profil fotoğrafı olanlar',
      sortLabel: 'Sıralama',
      sortFirstnameAsc: 'Ad (A→Z)',
      sortFirstnameDesc: 'Ad (Z→A)',
      sortLastname: 'Soyad (A→Z)',
      sortUsername: 'Kullanıcı adı (A→Z)',
      sortNewest: 'En yeni',
      sortOldest: 'En eski',
      columnLastname: 'Soyad',
      columnUsername: 'Kullanıcı adı',
      columnPhone: 'Telefon',
      columnActions: 'İşlem',
      openCard: '{name} çalışan kartını aç',
      editEmployee: '{name} çalışanını düzenle',
      activeBadge: 'Aktif',
      bulkActivate: 'Aktifleştir',
      bulkDeactivate: 'Pasifleştir',
      bulkDeactivateConfirm:
        '{count} çalışan pasifleştirilsin mi? Açık oturumları kapatılır ve yeniden aktifleştirilene kadar giriş yapamazlar.',
      bulkActivated: '{count} çalışan aktifleştirildi.',
      bulkDeactivated: '{count} çalışan pasifleştirildi, oturumları kapatıldı.',
      bulkError: 'Toplu işlem tamamlanamadı. Lütfen tekrar deneyin.',
      selfSelectHint: 'Kendi hesabınızı toplu işlemle değiştiremezsiniz.',
    },
    settings: {
      profilePhoto: 'Profil fotoğrafı',
      changePhoto: 'Fotoğrafı değiştir',
      cropPhoto: 'Fotoğrafı kırp',
      cropHint: 'Fotoğrafı sürükleyerek konumlandırın, kaydırıcı ile yakınlaştırın',
      zoom: 'Fotoğraf yakınlaştırma düzeyi',
      cropSave: 'Kırp ve kaydet',
      photoError: 'Fotoğraf güncellenemedi. Lütfen tekrar deneyin.',
      photoReadError: 'Seçilen fotoğraf okunamadı. Lütfen başka bir dosya deneyin.',
      changePassword: 'Parola değiştir',
      currentPassword: 'Mevcut parola',
      newPassword: 'Yeni parola',
      confirmPassword: 'Parolayı onayla',
      passwordMismatch: 'Parolalar eşleşmiyor.',
      passwordTooShort: 'Parola en az 6 karakter olmalıdır.',
      currentPasswordIncorrect: 'Mevcut parola hatalı.',
      passwordChangeError: 'Parola değiştirilemedi. Lütfen tekrar deneyin.',
      passwordUpdated: 'Parola güncellendi.',
      submitPassword: 'Parolayı değiştir',
      saving: 'Kaydediliyor…',
      theme: 'Tema',
      themeLight: 'Açık',
      themeDark: 'Koyu',
      themeSystem: 'Sistem',
    },
    sessions: {
      title: 'Oturumlarım',
      loading: 'Yükleniyor…',
      errorLoading: 'Oturumlar yüklenemedi.',
      empty: 'Aktif oturum bulunmuyor.',
      currentDevice: 'Bu cihaz',
      lastSeen: 'Son görülme',
      signedInAt: 'Giriş',
      expiresAt: 'Bitiş',
      ipAddress: 'IP adresi',
      unknownDevice: 'Bilinmeyen cihaz',
      revoke: 'Oturumu kapat',
      revoking: 'Kapatılıyor…',
      logoutAll: 'Tüm cihazlardan çık',
      logoutAllConfirm:
        'Tüm cihazlardaki oturumlar kapatılacak ve yeniden giriş yapmanız gerekecek. Devam edilsin mi?',
      revokeConfirm: 'Bu cihazdaki oturum kapatılacak. Devam edilsin mi?',
      rememberMeBadge: 'Kalıcı oturum',
      shortSessionBadge: 'Kısa oturum',
      expiryHint: 'Oturum her kullanımda uzar; bu tarihe kadar işlem yapılmazsa kapanır.',
      revokeError: 'Oturum kapatılamadı. Lütfen tekrar deneyin.',
      logoutAllError: 'Oturumlar kapatılamadı. Lütfen tekrar deneyin.',
    },
    employeeCard: {
      title: 'Çalışan kartı',
      email: 'E-posta',
      erpCode: 'ERP kodu',
      noErpLink: 'ERP bağlantısı yok',
      scanHint: 'ERP personel kodunu içerir; okutarak doğrulayın',
      noQrHint: 'Karekod üretmek için bu çalışanı bir ERP personeline bağlayın.',
      viewPhoto: 'Fotoğrafı büyüt',
      managerRole: 'Yönetici',
      employeeRole: 'Çalışan',
    },
    employeeForm: {
      tabDetails: 'Bilgiler',
      tabSessions: 'Oturumlar',
      tabKpi: 'KPI',
      tabKpiPlans: 'KPI planları',
      tabSalary: 'Maaş',
      goToKpiPlans: 'KPI planları ekranına git',
      sessionsRevokeAll: 'Tüm oturumları kapat',
      titleCreate: 'Yeni çalışan',
      titleEdit: 'Çalışanı düzenle',
      loading: 'Yükleniyor…',
      errorLoading: 'Çalışan bilgileri yüklenemedi.',
      erpEmployeesError: 'ERP satış personeli listesi yüklenemedi.',
      usernameLabel: 'Kullanıcı adı',
      passwordLabelCreate: 'Parola',
      passwordLabelEdit: 'Yeni parola (opsiyonel)',
      passwordHintEdit: 'Boş bırakılırsa mevcut parola değişmez.',
      firstnameLabel: 'Ad',
      lastnameLabel: 'Soyad',
      emailLabel: 'E-posta (opsiyonel)',
      phoneLabel: 'Telefon (opsiyonel)',
      fullAccessLabel: 'Yönetici erişimi',
      fullAccessHint: 'Çalışanlar ve dosya yönetimi gibi ekranlara erişebilir.',
      visitorCountsLabel: 'Ziyaretçi sayısı girebilir',
      visitorCountsHint:
        'Mağazalara her gün giren kişi sayısını "Ziyaretçi sayıları" ekranından girer.',
      erpEmployeeLabel: 'ERP satış personeli (opsiyonel)',
      erpEmployeeNone: 'Bağlı değil',
      erpEmployeeSearchPlaceholder: 'Kod veya ad ile arayın',
      erpEmployeeNoResults: 'Eşleşen satış personeli bulunamadı.',
      save: 'Kaydet',
      saving: 'Kaydediliyor…',
      deactivate: 'Çalışanı devre dışı bırak',
      deactivating: 'Devre dışı bırakılıyor…',
      reactivate: 'Yeniden etkinleştir',
      reactivating: 'Etkinleştiriliyor…',
      selfDeactivateHint: 'Kendi hesabınızı buradan devre dışı bırakamazsınız.',
      usernameRequired: 'Kullanıcı adı zorunludur.',
      usernameTooShort: 'Kullanıcı adı en az 3 karakter olmalıdır.',
      passwordRequired: 'Parola zorunludur.',
      passwordTooShort: 'Parola en az 8 karakter olmalıdır.',
      firstnameRequired: 'Ad zorunludur.',
      lastnameRequired: 'Soyad zorunludur.',
      emailInvalid: 'Geçerli bir e-posta adresi girin.',
      deactivateError: 'Çalışan devre dışı bırakılamadı.',
      reactivateError: 'Çalışan yeniden etkinleştirilemedi.',
      genericSaveError: 'Kaydedilemedi. Lütfen tekrar deneyin.',
    },
    kpiTemplates: {
      title: 'KPI şablonları',
      searchPlaceholder: 'Ad veya açıklama ara',
      statusLabel: 'Durum',
      statusAll: 'Tümü',
      statusActive: 'Aktif',
      statusInactive: 'Pasif',
      loading: 'Yükleniyor…',
      errorLoading: 'KPI şablonları yüklenemedi.',
      empty: 'Henüz KPI şablonu yok.',
      noSearchResults: 'Aramaya uygun şablon bulunamadı.',
      resultCount: '{count} şablon',
      add: 'Yeni KPI şablonu',
      inactiveBadge: 'Pasif',
      kpiCount: '{count} KPI',
      weightSummary: 'Ağırlık %{total}',
      columnName: 'Ad',
      columnDescription: 'Açıklama',
      columnKpis: 'KPI sayısı',
      columnWeight: 'Toplam ağırlık',
      columnStatus: 'Durum',
      columnActions: 'İşlem',
      editTemplate: '{name} şablonunu düzenle',
      activeBadge: 'Aktif',
      bulkCopy: 'Kopyala',
      bulkActivate: 'Aktifleştir',
      bulkDeactivate: 'Pasifleştir',
      bulkDeactivateConfirm:
        '{count} şablon pasifleştirilsin mi? İstediğiniz zaman yeniden aktifleştirebilirsiniz.',
      bulkCopied: '{count} şablon kopyalandı; kopyaların adına “(2)” gibi bir numara eklendi.',
      bulkActivated: '{count} şablon aktifleştirildi.',
      bulkDeactivated: '{count} şablon pasifleştirildi.',
      bulkDelete: 'Sil',
      bulkDeleteConfirm:
        '{count} şablon kalıcı olarak silinsin mi? Bu işlem geri alınamaz. KPI planında kullanılan şablon silinmez.',
      bulkDeleted: '{count} şablon kalıcı olarak silindi.',
      bulkDeleteInUse:
        'Şu şablonlar KPI planlarında kullanıldığı için silinemez: {names}. Bunları yalnız pasifleştirebilirsiniz.',
      bulkError: 'Toplu işlem tamamlanamadı. Lütfen tekrar deneyin.',
    },
    kpiTemplateForm: {
      titleCreate: 'Yeni KPI şablonu',
      titleEdit: 'KPI şablonunu düzenle',
      loading: 'Yükleniyor…',
      errorLoading: 'Şablon yüklenemedi.',
      nameLabel: 'Şablon adı',
      namePlaceholder: 'ör. MÜDÜR KPI 01',
      descriptionLabel: 'Açıklama (opsiyonel)',
      itemsTitle: 'KPI’lar',
      itemsHint:
        'Ağırlıkların toplamı tam %100 olmalı. Hedef isteğe bağlıdır; şablon döneme atanırken değiştirilebilir.',
      addItem: 'KPI ekle',
      itemTitle: '{number}. KPI',
      removeItem: '{number}. KPI satırını kaldır',
      definitionLabel: 'KPI',
      definitionPlaceholder: 'KPI ara ve seç',
      definitionNoResults: 'Eşleşen KPI bulunamadı.',
      definitionsError: 'KPI listesi yüklenemedi.',
      weightLabel: 'Ağırlık (%)',
      targetLabel: 'Hedef ({unit})',
      unitMoney: 'tutar',
      unitCount: 'adet',
      unitScore: 'puan',
      storesPlaceholder: 'Mağaza ara ve ekle',
      storesNoResults: 'Eşleşen mağaza bulunamadı.',
      storesError: 'Mağaza listesi yüklenemedi.',
      removeStore: '{name} mağazasını kaldır',
      itemGroupsPlaceholder: 'Malzeme grubu ara ve ekle',
      itemGroupsNoResults: 'Grup bulunamadı.',
      itemGroupsError: 'Malzeme grupları yüklenemedi.',
      itemGroupOption: '{code} · {count} ürün',
      removeItemGroup: '{name} grubunu çıkar',
      ungroupedHint:
        'Grubu boş ürünler hiçbir grup KPI’ına girmez: son 12 ayda cironun %{share}’i. Ürün kartlarına Tiger’da grup verildikçe dahil olurlar.',
      unknownItemGroup: '{number}. KPI artık bulunmayan malzeme grubu içeriyor: {codes}.',
      selectPlaceholder: 'Seçin',
      noInputs: 'Bu KPI için hedef dışında ek bilgi gerekmez.',
      totalWeight: 'Toplam ağırlık: %{total} / %100',
      totalWeightUnder: 'Toplam ağırlık: %{total} / %100 · %{difference} eksik',
      totalWeightOver: 'Toplam ağırlık: %{total} / %100 · %{difference} fazla, kaydedilemez',
      weightOver: 'Ağırlıkların toplamı %100’ü aşıyor (şu an %{total}). Bu şekilde kaydedilemez.',
      weightUnder: 'Ağırlıkların toplamı tam %100 olmalı (şu an %{total}).',
      save: 'Kaydet',
      saving: 'Kaydediliyor…',
      inactiveNotice: 'Bu şablon pasif.',
      deactivate: 'Şablonu pasifleştir',
      deactivating: 'Pasifleştiriliyor…',
      reactivate: 'Tekrar etkinleştir',
      reactivating: 'Etkinleştiriliyor…',
      deactivateError: 'Şablon pasifleştirilemedi.',
      delete: 'Şablonu sil',
      deleting: 'Siliniyor…',
      deleteConfirm: '“{name}” şablonu kalıcı olarak silinsin mi? Bu işlem geri alınamaz.',
      deleteHint: 'KPI planında kullanılmayan şablon kalıcı olarak silinebilir.',
      deleteError: 'Şablon silinemedi.',
      deleteInUse:
        'Bu şablondan {count} KPI planı oluşturulmuş, bu yüzden silinemez. Şablonu pasifleştirebilirsiniz.',
      copy: 'Kopyasını oluştur',
      copying: 'Kopyalanıyor…',
      copyHint: 'Kaydedilmiş son hâli bütün KPI’larıyla kopyalanır.',
      copyError: 'Şablon kopyalanamadı.',
      copiedNotice:
        '“{name}” şablonundan kopyalandı. Adını ve bilgilerini düzenleyip kaydedebilirsiniz.',
      nameRequired: 'Şablon adı zorunludur.',
      itemsRequired: 'En az bir KPI ekleyin.',
      definitionRequired: '{number}. satır için bir KPI seçin.',
      weightInvalid:
        '{number}. KPI için 0,01 ile 100 arasında, en fazla 2 ondalıklı bir ağırlık girin.',
      targetInvalid:
        '{number}. KPI için hedef 0 veya daha büyük, en fazla 4 ondalıklı bir sayı olmalı.',
      inputRequired: '{number}. KPI için “{field}” alanı zorunludur.',
      duplicateItem: '{number}. KPI, {other}. KPI ile aynı (aynı KPI ve aynı bilgiler).',
      unknownDefinition: '{number}. KPI artık aktif değil veya bulunamadı.',
      invalidInput: '{number}. KPI’nin bilgileri geçersiz.',
      unknownStore: '{number}. KPI artık bulunmayan bir mağaza içeriyor.',
      nameTaken: 'Bu adla bir KPI şablonu zaten var.',
      genericSaveError: 'Şablon kaydedilemedi. Lütfen tekrar deneyin.',
    },
    recordInfo: {
      buttonFor: '{name} kayıt bilgisi',
      title: 'Kayıt bilgisi',
      createdBy: 'Oluşturan',
      updatedBy: 'Son değiştiren',
      system: 'Sistem',
      history: 'Değişiklik geçmişi',
      historyEmpty: 'Bu kayıt için henüz değişiklik kaydı yok.',
      historyHint:
        'Değişiklik geçmişi bu özellik açıldığından beri tutuluyor; daha eski değişiklikler listede görünmez.',
      loading: 'Yükleniyor…',
      error: 'Kayıt bilgisi yüklenemedi.',
      loadMore: 'Daha fazla göster',
      actionCreate: 'Oluşturuldu',
      actionUpdate: 'Güncellendi',
      actionDelete: 'Silindi',
      actionActivate: 'Aktifleştirildi',
      actionDeactivate: 'Pasifleştirildi',
      viaBulkStatus: 'toplu işlemle',
      viaBulkCopy: 'toplu kopyalamayla',
      copiedFrom: '“{name}” şablonundan kopyalandı',
      valueAdded: 'eklendi',
      valueRemoved: 'kaldırıldı',
      valueChanged: 'değiştirildi',
      valueYes: 'Evet',
      valueNo: 'Hayır',
      valueActive: 'Aktif',
      valueInactive: 'Pasif',
      itemsBefore: 'Önce',
      itemsAfter: 'Sonra',
      target: 'hedef {value}',
      fields: {
        employees: {
          username: 'Kullanıcı adı',
          firstname: 'Ad',
          lastname: 'Soyad',
          email: 'E-posta',
          phoneNumber: 'Telefon',
          erpEmployeeId: 'ERP satış personeli',
          avatarId: 'Profil fotoğrafı',
          fullAccess: 'Yönetici erişimi',
          canEnterVisitorCounts: 'Ziyaretçi sayısı girebilir',
          isActive: 'Durum',
          passwordHash: 'Parola',
        },
        kpi_templates: {
          name: 'Şablon adı',
          description: 'Açıklama',
          isActive: 'Durum',
          items: 'KPI’lar',
        },
        kpi_periods: {
          year: 'Yıl',
          month: 'Ay',
          status: 'Durum',
          closedAt: 'Kapanış zamanı',
        },
        kpi_assignments: {
          periodId: 'Dönem',
          employeeId: 'Çalışan',
          templateId: 'Şablon',
          templateName: 'Şablon adı',
          items: 'KPI’lar',
        },
        store_visitor_counts: {
          storeId: 'Mağaza',
          visitDate: 'Gün',
          visitorCount: 'Giren kişi sayısı',
        },
        employee_salaries: {
          employeeId: 'Çalışan',
          effectiveMonth: 'Geçerli olduğu ay',
          amount: 'Maaş',
          currency: 'Para birimi',
          fixedPercent: 'Sabit yüzde',
          kpiPercent: 'KPI yüzdesi',
        },
      },
    },
    kpiPlans: {
      title: 'KPI planları',
      periodLabel: 'Dönem',
      newPeriodTitle: 'Yeni dönem aç',
      year: 'Yıl',
      month: 'Ay',
      open: 'Dönemi aç',
      statusOpen: 'Açık',
      statusClosed: 'Kapalı',
      closePeriod: 'Dönemi kapat',
      newPeriod: 'Yeni dönem',
      closeConfirm:
        '{period} dönemi kapatılsın mı? Kapalı dönemde plan, hedef ve puan değiştirilemez. Yanlışlıkla kapatırsanız {date} tarihine kadar yeniden açabilirsiniz.',
      closeConfirmFinal:
        '{period} dönemi kapatılsın mı? Yeniden açma süresi geçtiği için kapanış kesin olur; plan, hedef ve puan bir daha değiştirilemez.',
      reopenPeriod: 'Dönemi yeniden aç',
      reopened: '{period} dönemi yeniden açıldı.',
      reopenExpired: 'Bu dönem {date} tarihine kadar yeniden açılabilirdi; artık kesinleşti.',
      periodOpenHint: 'Planlar, hedefler ve puanlar değiştirilebilir.',
      periodClosedReopenable:
        'Değişiklik yapılamaz. Yanlışlıkla kapattıysanız {date} tarihine kadar yeniden açabilirsiniz.',
      periodClosedFinal: 'Kesinleşti: değişiklik yapılamaz, yeniden açılamaz.',
      periodPlans: '{count} plan',
      periodMissingTargets: '{count} planın hedefi eksik',
      deletePlan: '{name} planını sil',
      deleted: '{name} çalışanının planı silindi.',
      closed: '{period} dönemi kapatıldı.',
      assign: 'Şablon ata',
      assignTitle: 'Şablon ata',
      templateLabel: 'KPI şablonu',
      employeesLabel: 'Çalışanlar',
      employeeSearch: 'Çalışan ara',
      assignSubmit: 'Plan oluştur',
      assigned: '{count} çalışana plan verildi.',
      copyFrom: '{period} ayından kopyala',
      copyConfirm: '{period} dönemindeki planlar hedefleriyle kopyalansın mı?',
      copied: '{created} plan kopyalandı, {skipped} çalışan atlandı.',
      copiedNone: 'Kopyalanacak uygun plan bulunamadı.',
      loading: 'Yükleniyor…',
      errorLoading: 'Planlar yüklenemedi.',
      empty: 'Bu dönemde henüz plan yok.',
      emptyPeriods: 'Henüz KPI dönemi yok. Başlamak için bir ay açın.',
      noSearchResults: 'Aramaya uygun plan bulunamadı.',
      searchPlaceholder: 'Çalışan ara',
      resultCount: '{count} plan',
      targetProgress: '{done}/{total} hedef',
      columnEmployee: 'Çalışan',
      columnTemplate: 'Şablon',
      columnTargets: 'Hedefler',
      columnActions: 'İşlem',
      openPlan: '{name} planını aç',
      openPlanShort: 'Aç',
      calculateAll: 'Tümünü hesapla',
      calculatingAll: 'Hesaplanıyor…',
      calculatedAll: '{count} planın puanı hesaplandı.',
      calculatedAllIncomplete: '{count} planın puanı hesaplandı; {incomplete} planın puanı eksik.',
      columnScore: 'Puan',
      noScore: '—',
      scoreValue: '{value} puan',
      assignError: 'Plan oluşturulamadı.',
      alreadyAssigned: 'Bu çalışanların bu dönemde zaten planı var: {names}',
      ineligible: 'Bu çalışanlara plan verilemez: {names}',
      reasonInactive: 'pasif',
      reasonMissingErpLink: 'Tiger satış personeli eşlemesi yok',
      reasonAlreadyAssigned: 'planı zaten var',
      periodClosedError: 'Dönem kapalı olduğu için değişiklik yapılamadı.',
      selectTemplate: 'Şablon seçin',
      employeesEmpty: 'Çalışan bulunamadı.',
    },
    kpiPlanForm: {
      title: 'KPI planı',
      loading: 'Yükleniyor…',
      errorLoading: 'Plan yüklenemedi.',
      save: 'Hedefleri kaydet',
      saved: 'Hedefler kaydedildi.',
      saveError: 'Hedefler kaydedilemedi.',
      closedError: 'Dönem kapalı; hedefler değiştirilemez.',
      invalidTarget: 'Hedef geçersiz. Negatif olmayan, en fazla 4 ondalıklı bir sayı girin.',
      targetLabel: 'Hedef',
      missingTarget: 'Hedef girilmedi',
      weight: 'Ağırlık %{value}',
      stores: 'Mağazalar',
      itemGroups: 'Gruplar',
      currency: 'Para birimi',
      recommendation: 'Ortalama {average} · Ulaşılabilir max {max} · Önerilen {recommended}',
      recommendationMonths: '{count} aylık veri',
      applyRecommendation: 'Öneriyi uygula',
      applyAll: 'Bütün önerileri uygula',
      applyConfirmOne:
        "{name}: hedef {change} olacak.\nKaydet'e basınca kalıcı olur. Emin misiniz?",
      applyConfirmAll:
        "Şu hedefler değişecek:\n{changes}\nKaydet'e basınca kalıcı olur. Emin misiniz?",
      applyConfirmButton: 'Uygula',
      emptyTarget: 'boş',
      combinedHint: 'birden fazla mağaza toplandı',
      manualHint: 'Bu KPI elle girilir; raporu yoktur.',
      noRecommendation: 'Bu KPI için rapor verisi yok.',
      deletePlan: 'Planı sil',
      deleteConfirm: '{name} çalışanının {period} planı silinsin mi?',
      deleteError: 'Plan silinemedi.',
      closedNotice: '{period} dönemi kapalı; hedefler salt okunur.',
      calculate: 'Hesapla',
      calculating: 'Hesaplanıyor…',
      calculated: 'Puan hesaplandı.',
      calculatedIncomplete: 'Puan hesaplandı; {done}/{total} satır puanlanabildi.',
      actualLabel: 'Gerçekleşen',
      actualPlaceholder: 'Elle girilir',
      actualHint: 'Bu KPI Tiger’dan hesaplanmaz; değeri siz girersiniz.',
      calculatedItem: 'Bu KPI Tiger’dan hesaplanıyor, elle girilemez.',
    },
    myKpi: {
      title: 'KPI’larım',
      loading: 'Yükleniyor…',
      errorLoading: 'KPI planınız yüklenemedi.',
      empty: 'Size henüz bir KPI planı verilmedi.',
      period: 'Dönem',
      periodOption: '{period} · {score} puan',
      periodOpen: 'Dönem açık; puan henüz kesinleşmedi.',
      periodClosed: 'Dönem kapandı; puan kesinleşti.',
      weight: 'Ağırlık',
      target: 'Hedef',
      noTarget: 'Hedef henüz girilmedi',
      emptyEmployee: 'Bu çalışana henüz bir KPI planı verilmedi.',
      errorLoadingEmployee: 'Çalışanın KPI planı yüklenemedi.',
    },
    leaderboard: {
      title: 'Sıralama tablosu',
      period: 'Dönem',
      templateFilter: 'Şablona göre süz',
      allTemplates: 'Tümü',
      loading: 'Yükleniyor…',
      errorLoading: 'Sıralama yüklenemedi.',
      empty: 'Bu dönemde henüz KPI planı yok.',
      autoEvery: 'Puanlar {minutes} dakikada bir kendiliğinden güncellenir',
      autoOff: 'Otomatik güncelleme kapalı',
      periodClosed: 'Dönem kapandı; puanlar kesin',
      updatedAt: 'son güncelleme {at}',
      notCalculated: 'Puan henüz hesaplanmadı',
      scoredOf: '{done}/{total} KPI puanlandı',
      you: 'Sen',
      rank: '{rank}. sıra',
      unranked: 'Sırası yok',
      colRank: 'Sıra',
      colEmployee: 'Çalışan',
      colTemplate: 'Şablon',
      colScore: 'Puan',
      myStanding: 'Senin yerin',
      placeShort: 'sıra',
      myNotCalculated: 'Puanın henüz hesaplanmadı.',
      amongCount: '{count} kişi arasında',
      gapToNext: '{rank}. sıraya çıkmak için {gap} puan daha',
      leading: 'Zirvedesin! Böyle devam.',
      podium: 'İlk üç',
      others: 'Diğer sıralar',
      openKpi: "{name} KPI'larını aç",
    },
    salary: {
      loading: 'Yükleniyor…',
      errorLoading: 'Maaşlar yüklenemedi.',
      empty: 'Bu çalışana henüz maaş girilmedi.',
      noneYet: 'Bu ay için geçerli maaş yok; ilk maaş daha sonraki bir aydan başlıyor.',
      currentTitle: 'Şu an geçerli maaş',
      sinceMonth: '{month} ayından beri geçerli',
      fromMonth: '{month} ayından itibaren',
      inForce: 'Şu an geçerli',
      history: 'Maaş geçmişi',
      fixedPart: 'Sabit %{percent}',
      kpiPart: 'KPI %{percent}',
      splitLabel: 'Sabit %{fixed}, KPI %{kpi}',
      add: 'Maaş ekle',
      addTitle: 'Maaş ekle',
      editTitle: 'Maaşı düzelt',
      editFor: 'Maaşı düzelt: {range}',
      deleteFor: 'Maaşı sil: {range}',
      deleteConfirm:
        '{month} ayından itibaren geçerli maaş silinsin mi? O aydan sonra bir önceki maaş geçerli olur.',
      deleteError: 'Maaş silinemedi.',
      delete: 'Sil',
      effectiveMonth: 'Geçerli olduğu ay',
      effectiveHint: 'Bu aydan itibaren, yeni bir maaş girilene kadar geçerlidir.',
      amount: 'Maaş',
      amountPlaceholder: 'Örn. 12000',
      currency: 'Para birimi',
      fixedPercent: 'Sabit (%)',
      kpiPercent: 'KPI (%)',
      preview: 'Sabit {fixed} + KPI {kpi}',
      save: 'Kaydet',
      saving: 'Kaydediliyor…',
      saveError: 'Maaş kaydedilemedi.',
      errorMonthExists: 'Bu çalışanın bu ay için zaten bir maaşı var.',
      errorPercentTotal: 'Sabit ve KPI yüzdelerinin toplamı 100 olmalı.',
    },
    kpiSalary: {
      title: 'Maaş',
      since: '{month} ayından beri geçerli maaş',
      show: 'Göster',
      hide: 'Gizle · {seconds}',
      hidden: 'Gizli tutar; göstermek için dokunun',
      payable: 'Bu dönem alınacak',
      fixedOnly: 'Sabit kısım (KPI henüz hesaplanmadı)',
      barLabel: 'Sabit %{fixed}, KPI %{kpi}, puan {score}',
      fixedPart: 'Sabit %{percent}',
      kpiPart: 'KPI %{percent}',
      byScore: 'Puan {score} üzerinden',
      fullSalary: 'Toplam maaş',
      interim: 'Dönem açık: puan değiştikçe tutar da değişir.',
      final: 'Dönem kapandı; tutar kesin.',
      notCalculated: 'KPI kısmı, puan hesaplanınca eklenecek.',
      itemValue: 'Maaştaki değeri',
      itemEarned: 'Kazanılan',
      noSalary:
        'Bu çalışanın bu ay için geçerli maaşı yok; maaş, çalışanın Maaş sekmesinden girilir.',
      kpiEarnedShort: "KPI'dan kazanılan",
      planListHint: 'Maaş tutarları gizli; göstermek için dokunun.',
    },
    kpiProgress: {
      totalScore: 'Toplam puan',
      outOf: '/ {max}',
      notCalculated: 'Puan henüz hesaplanmadı.',
      calculatedAt: 'Son hesaplama: {at}',
      incomplete: '{done}/{total} KPI puanlandı; kalanların hedefi ya da gerçekleşeni yok.',
      achievement: 'Gerçekleşme',
      percent: '%{value}',
      reached: 'Hedefe ulaşıldı',
      actualOfTarget: 'Gerçekleşen {actual} / hedef {target}',
      actualOnly: 'Gerçekleşen {actual}',
      contribution: 'Katkı {score} / {weight}',
      noTarget: 'Hedef girilmediği için puanlanmadı.',
      noActual: 'Gerçekleşen girilmediği için puanlanmadı.',
      meterLabel: '{name} gerçekleşmesi',
      scoreMeterLabel: '{name} toplam puanı',
    },
    visitorCounts: {
      title: 'Ziyaretçi sayıları',
      store: 'Mağaza',
      date: 'Gün',
      count: 'Giren kişi sayısı',
      countPlaceholder: 'Örn. 184',
      save: 'Kaydet',
      update: 'Güncelle',
      saving: 'Kaydediliyor…',
      saved: '{store} · {date}: {count} kişi kaydedildi.',
      replaceHint: 'Aynı mağaza ve gün yeniden girilirse sayı güncellenir.',
      existing: 'Bu gün için kayıtlı sayı: {count}. Kaydedince değişir.',
      loading: 'Yükleniyor…',
      errorLoading: 'Girişler yüklenemedi.',
      empty: 'Henüz giriş yok.',
      people: 'kişi',
      edit: 'Düzenle',
      editFor: '{store} · {date} girişini düzenle',
      deleteFor: '{store} · {date} girişini sil',
      deleteConfirm: '{store} mağazasının {date} günlük sayısı silinsin mi?',
      deleted: 'Giriş silindi.',
      errorUnknownStore: 'Seçilen mağaza Tiger’da bulunamadı.',
      errorFutureDate: 'Gelecekteki bir gün için sayı girilemez.',
      errorClosed: 'Bu gün kapalı bir KPI dönemine ait; sayı değiştirilemez.',
      saveError: 'Sayı kaydedilemedi.',
      columnDate: 'Gün',
      columnStore: 'Mağaza',
      columnCount: 'Giren kişi',
      columnActions: 'İşlem',
      add: 'Sayı ekle',
      addTitle: 'Ziyaretçi sayısı ekle',
      editTitle: 'Ziyaretçi sayısını düzelt',
      filters: 'Filtreler',
      filterDates: 'Tarih aralığı',
      filterFrom: 'Başlangıç günü',
      filterTo: 'Bitiş günü',
      rangeInvalid: 'Başlangıç günü bitiş gününden sonra olamaz.',
      rangeFrom: '{date} ve sonrası',
      rangeTo: '{date} ve öncesi',
      removeFilter: '{filter} filtresini kaldır',
      resultCount: '{count} kayıt',
      emptyFiltered: 'Bu filtrelere uyan kayıt yok.',
    },
    errors: {
      generic: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
      network: 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.',
      validation: 'Girdiğiniz bilgileri kontrol edin.',
      unauthorized: 'Oturumunuz sona erdi. Lütfen yeniden giriş yapın.',
      forbidden: 'Bu işlemi yapmaya yetkiniz yok.',
      notFound: 'İstenen kayıt bulunamadı.',
      conflict: 'Bu bilgiler başka bir kayıtla çakışıyor.',
      payloadTooLarge: 'Seçilen dosya izin verilen boyuttan büyük.',
      tooManyRequests: 'Çok fazla deneme yapıldı. Lütfen biraz bekleyin.',
      server: 'Sunucuda bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
    },
  },
  en: {
    common: {
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      close: 'Close',
      closeDialog: 'Close {title}',
      breadcrumb: 'Breadcrumb',
      cancel: 'Cancel',
      confirm: 'Confirm',
      confirmTitle: 'Are you sure?',
      apply: 'Apply',
      clear: 'Clear',
      home: 'Home',
      bulkActions: 'Bulk actions',
      selectedCount: '{count} selected',
      clearSelection: 'Clear selection',
      selectAll: 'Select all listed',
      selectItem: 'Select {name}',
    },
    login: {
      brand: 'Retail KPI Platform',
      title: 'Sign in',
      subtitle: 'Sign in to your account to get started',
      usernameLabel: 'Username',
      usernamePlaceholder: 'e.g. admin',
      passwordLabel: 'Password',
      submit: 'Sign in',
      submitting: 'Signing in…',
      errorInvalidCredentials: 'Incorrect username or password.',
      errorGeneric: 'Could not sign in. Check your connection.',
      sessionExpired: 'Your session has ended. Please sign in again.',
      rememberMe: 'Remember me',
      forgotPassword: 'Forgot password?',
      forgotPasswordHelp:
        'Password reset by email is not supported yet. Please ask an administrator to reset your password.',
    },
    appShell: {
      logout: 'Log out',
      language: 'Language',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      navEmployees: 'Employees',
      navLeaderboard: 'Leaderboard',
      navMyKpi: 'My KPI',
      navKpiPlans: 'KPI plans',
      navVisitorCounts: 'Visitor counts',
      navKpiTemplates: 'KPI templates',
      navSessions: 'My sessions',
      navSettings: 'Settings',
    },
    employees: {
      title: 'Employees',
      loading: 'Loading…',
      errorLoading: 'Could not load employees.',
      empty: 'No employees yet.',
      managerBadge: 'Admin',
      inactiveBadge: 'Inactive',
      addEmployee: 'Add employee',
      statusColumn: 'Status',
      searchPlaceholder: 'Search name, surname, username, email or phone',
      noSearchResults: 'No employees match your search.',
      filters: 'Filters',
      resultCount: '{count} employees',
      filtersActiveCount: '{count} filters active',
      filterStatusAll: 'All',
      filterOnlyActive: 'Active employees only',
      filterOnlyInactive: 'Inactive employees only',
      filterManagers: 'Admins only',
      filterErpLinked: 'Linked to an ERP rep',
      filterWithAvatar: 'Has a profile photo',
      sortLabel: 'Sort',
      sortFirstnameAsc: 'First name (A→Z)',
      sortFirstnameDesc: 'First name (Z→A)',
      sortLastname: 'Last name (A→Z)',
      sortUsername: 'Username (A→Z)',
      sortNewest: 'Newest',
      sortOldest: 'Oldest',
      columnLastname: 'Last name',
      columnUsername: 'Username',
      columnPhone: 'Phone',
      columnActions: 'Actions',
      openCard: 'Open employee card for {name}',
      editEmployee: 'Edit {name}',
      activeBadge: 'Active',
      bulkActivate: 'Activate',
      bulkDeactivate: 'Deactivate',
      bulkDeactivateConfirm:
        'Deactivate the selected employees ({count})? Their open sessions will be closed and they cannot sign in until reactivated.',
      bulkActivated: 'Employees activated: {count}.',
      bulkDeactivated: 'Employees deactivated and signed out: {count}.',
      bulkError: 'The bulk action could not be completed. Please try again.',
      selfSelectHint: 'You cannot change your own account with a bulk action.',
    },
    settings: {
      profilePhoto: 'Profile photo',
      changePhoto: 'Change photo',
      cropPhoto: 'Crop photo',
      cropHint: 'Drag the photo to position it, use the slider to zoom',
      zoom: 'Photo zoom level',
      cropSave: 'Crop and save',
      photoError: 'Could not update the photo. Please try again.',
      photoReadError: 'Could not read the selected photo. Please try another file.',
      changePassword: 'Change password',
      currentPassword: 'Current password',
      newPassword: 'New password',
      confirmPassword: 'Confirm password',
      passwordMismatch: 'Passwords do not match.',
      passwordTooShort: 'Password must be at least 6 characters.',
      currentPasswordIncorrect: 'The current password is incorrect.',
      passwordChangeError: 'Could not change the password. Please try again.',
      passwordUpdated: 'Password updated.',
      submitPassword: 'Change password',
      saving: 'Saving…',
      theme: 'Theme',
      themeLight: 'Light',
      themeDark: 'Dark',
      themeSystem: 'System',
    },
    sessions: {
      title: 'My sessions',
      loading: 'Loading…',
      errorLoading: 'Could not load sessions.',
      empty: 'No active sessions.',
      currentDevice: 'This device',
      lastSeen: 'Last seen',
      signedInAt: 'Signed in',
      expiresAt: 'Expires',
      ipAddress: 'IP address',
      unknownDevice: 'Unknown device',
      revoke: 'Sign out',
      revoking: 'Signing out…',
      logoutAll: 'Sign out of all devices',
      logoutAllConfirm:
        'This signs you out on every device and you will need to log in again. Continue?',
      revokeConfirm: 'This signs out the session on that device. Continue?',
      rememberMeBadge: 'Long-lived session',
      shortSessionBadge: 'Short session',
      expiryHint: 'The session extends on each use; it closes if left idle past this time.',
      revokeError: 'Could not sign out this session. Please try again.',
      logoutAllError: 'Could not sign out the sessions. Please try again.',
    },
    employeeCard: {
      title: 'Employee card',
      email: 'Email',
      erpCode: 'ERP code',
      noErpLink: 'Not linked to ERP',
      scanHint: 'Holds the ERP staff code; scan it to verify',
      noQrHint: 'Link this employee to an ERP rep to generate a QR code.',
      viewPhoto: 'View full photo',
      managerRole: 'Admin',
      employeeRole: 'Employee',
    },
    employeeForm: {
      tabDetails: 'Details',
      tabSessions: 'Sessions',
      tabKpi: 'KPI',
      tabKpiPlans: 'KPI plans',
      tabSalary: 'Salary',
      goToKpiPlans: 'Go to KPI plans',
      sessionsRevokeAll: 'Sign out everywhere',
      titleCreate: 'New employee',
      titleEdit: 'Edit employee',
      loading: 'Loading…',
      errorLoading: 'Could not load the employee details.',
      erpEmployeesError: 'Could not load the ERP sales representative list.',
      usernameLabel: 'Username',
      passwordLabelCreate: 'Password',
      passwordLabelEdit: 'New password (optional)',
      passwordHintEdit: 'Leave blank to keep the current password.',
      firstnameLabel: 'First name',
      lastnameLabel: 'Last name',
      emailLabel: 'Email (optional)',
      phoneLabel: 'Phone (optional)',
      fullAccessLabel: 'Admin access',
      fullAccessHint: 'Can access screens like employees and file management.',
      visitorCountsLabel: 'Can enter visitor counts',
      visitorCountsHint:
        'Enters how many people walked into the stores each day on the "Visitor counts" screen.',
      erpEmployeeLabel: 'ERP sales rep (optional)',
      erpEmployeeNone: 'Not linked',
      erpEmployeeSearchPlaceholder: 'Search by code or name',
      erpEmployeeNoResults: 'No matching sales rep found.',
      save: 'Save',
      saving: 'Saving…',
      deactivate: 'Deactivate employee',
      deactivating: 'Deactivating…',
      reactivate: 'Reactivate',
      reactivating: 'Reactivating…',
      selfDeactivateHint: 'You cannot deactivate your own account from here.',
      usernameRequired: 'Username is required.',
      usernameTooShort: 'Username must be at least 3 characters.',
      passwordRequired: 'Password is required.',
      passwordTooShort: 'Password must be at least 8 characters.',
      firstnameRequired: 'First name is required.',
      lastnameRequired: 'Last name is required.',
      emailInvalid: 'Enter a valid email address.',
      deactivateError: 'Could not deactivate the employee.',
      reactivateError: 'Could not reactivate the employee.',
      genericSaveError: 'Could not save. Please try again.',
    },
    kpiTemplates: {
      title: 'KPI templates',
      searchPlaceholder: 'Search name or description',
      statusLabel: 'Status',
      statusAll: 'All',
      statusActive: 'Active',
      statusInactive: 'Inactive',
      loading: 'Loading…',
      errorLoading: 'Could not load the KPI templates.',
      empty: 'No KPI templates yet.',
      noSearchResults: 'No templates match your search.',
      resultCount: '{count} templates',
      add: 'New KPI template',
      inactiveBadge: 'Inactive',
      kpiCount: '{count} KPIs',
      weightSummary: 'Weight {total}%',
      columnName: 'Name',
      columnDescription: 'Description',
      columnKpis: 'KPIs',
      columnWeight: 'Total weight',
      columnStatus: 'Status',
      columnActions: 'Actions',
      editTemplate: 'Edit {name}',
      activeBadge: 'Active',
      bulkCopy: 'Copy',
      bulkActivate: 'Activate',
      bulkDeactivate: 'Deactivate',
      bulkDeactivateConfirm:
        'Deactivate the selected templates ({count})? You can reactivate them at any time.',
      bulkCopied: 'Templates copied: {count}. Each copy got a number such as “(2)” in its name.',
      bulkActivated: 'Templates activated: {count}.',
      bulkDeactivated: 'Templates deactivated: {count}.',
      bulkDelete: 'Delete',
      bulkDeleteConfirm:
        'Delete {count} templates for good? This cannot be undone. Templates used by a KPI plan are kept.',
      bulkDeleted: 'Templates deleted: {count}.',
      bulkDeleteInUse:
        'These templates are used by KPI plans and cannot be deleted: {names}. You can only deactivate them.',
      bulkError: 'The bulk action could not be completed. Please try again.',
    },
    kpiTemplateForm: {
      titleCreate: 'New KPI template',
      titleEdit: 'Edit KPI template',
      loading: 'Loading…',
      errorLoading: 'Could not load the template.',
      nameLabel: 'Template name',
      namePlaceholder: 'e.g. STORE MANAGER KPI 01',
      descriptionLabel: 'Description (optional)',
      itemsTitle: 'KPIs',
      itemsHint:
        'Weights must add up to exactly 100%. The target is optional and can be changed when the template is assigned to a period.',
      addItem: 'Add KPI',
      itemTitle: 'KPI {number}',
      removeItem: 'Remove KPI {number}',
      definitionLabel: 'KPI',
      definitionPlaceholder: 'Search and pick a KPI',
      definitionNoResults: 'No matching KPI found.',
      definitionsError: 'Could not load the KPI list.',
      weightLabel: 'Weight (%)',
      targetLabel: 'Target ({unit})',
      unitMoney: 'amount',
      unitCount: 'count',
      unitScore: 'points',
      storesPlaceholder: 'Search and add a store',
      storesNoResults: 'No matching store found.',
      storesError: 'Could not load the store list.',
      removeStore: 'Remove {name}',
      itemGroupsPlaceholder: 'Search and add an item group',
      itemGroupsNoResults: 'No group found.',
      itemGroupsError: 'Item groups could not be loaded.',
      itemGroupOption: '{code} · {count} items',
      removeItemGroup: 'Remove group {name}',
      ungroupedHint:
        'Items without a group count in no group KPI: {share}% of the last 12 months’ sales. They count once their item cards get a group in Tiger.',
      unknownItemGroup: 'KPI {number} contains item groups that no longer exist: {codes}.',
      selectPlaceholder: 'Select',
      noInputs: 'This KPI needs nothing besides the target.',
      totalWeight: 'Total weight: {total}% / 100%',
      totalWeightUnder: 'Total weight: {total}% / 100% · {difference}% missing',
      totalWeightOver: 'Total weight: {total}% / 100% · {difference}% over, cannot be saved',
      weightOver:
        'Weights exceed 100% (currently {total}%). The template cannot be saved like this.',
      weightUnder: 'Weights must add up to exactly 100% (currently {total}%).',
      save: 'Save',
      saving: 'Saving…',
      inactiveNotice: 'This template is inactive.',
      deactivate: 'Deactivate template',
      deactivating: 'Deactivating…',
      reactivate: 'Reactivate',
      reactivating: 'Reactivating…',
      deactivateError: 'Could not deactivate the template.',
      delete: 'Delete template',
      deleting: 'Deleting…',
      deleteConfirm: 'Delete the template “{name}” for good? This cannot be undone.',
      deleteHint: 'A template no KPI plan uses can be deleted for good.',
      deleteError: 'Could not delete the template.',
      deleteInUse:
        '{count} KPI plans were built from this template, so it cannot be deleted. You can deactivate it instead.',
      copy: 'Create a copy',
      copying: 'Copying…',
      copyHint: 'The last saved version is copied with all of its KPIs.',
      copyError: 'Could not copy the template.',
      copiedNotice: 'Copied from “{name}”. You can edit its name and details and save.',
      nameRequired: 'Template name is required.',
      itemsRequired: 'Add at least one KPI.',
      definitionRequired: 'Pick a KPI for row {number}.',
      weightInvalid:
        'Enter a weight between 0.01 and 100 with at most 2 decimals for KPI {number}.',
      targetInvalid: 'The target of KPI {number} must be 0 or more with at most 4 decimals.',
      inputRequired: '“{field}” is required for KPI {number}.',
      duplicateItem: 'KPI {number} repeats KPI {other} (same KPI and same details).',
      unknownDefinition: 'KPI {number} is no longer active or was not found.',
      invalidInput: 'The details of KPI {number} are invalid.',
      unknownStore: 'KPI {number} contains a store that no longer exists.',
      nameTaken: 'A KPI template with this name already exists.',
      genericSaveError: 'Could not save the template. Please try again.',
    },
    recordInfo: {
      buttonFor: 'Record info for {name}',
      title: 'Record info',
      createdBy: 'Created by',
      updatedBy: 'Last changed by',
      system: 'System',
      history: 'Change history',
      historyEmpty: 'No changes have been recorded for this record yet.',
      historyHint:
        'Changes are recorded since this feature was turned on; older changes do not appear here.',
      loading: 'Loading…',
      error: 'Could not load the record info.',
      loadMore: 'Show more',
      actionCreate: 'Created',
      actionUpdate: 'Updated',
      actionDelete: 'Deleted',
      actionActivate: 'Activated',
      actionDeactivate: 'Deactivated',
      viaBulkStatus: 'via bulk action',
      viaBulkCopy: 'via bulk copy',
      copiedFrom: 'Copied from “{name}”',
      valueAdded: 'added',
      valueRemoved: 'removed',
      valueChanged: 'changed',
      valueYes: 'Yes',
      valueNo: 'No',
      valueActive: 'Active',
      valueInactive: 'Inactive',
      itemsBefore: 'Before',
      itemsAfter: 'After',
      target: 'target {value}',
      fields: {
        employees: {
          username: 'Username',
          firstname: 'First name',
          lastname: 'Last name',
          email: 'Email',
          phoneNumber: 'Phone',
          erpEmployeeId: 'ERP sales rep',
          avatarId: 'Profile photo',
          fullAccess: 'Admin access',
          canEnterVisitorCounts: 'Can enter visitor counts',
          isActive: 'Status',
          passwordHash: 'Password',
        },
        kpi_templates: {
          name: 'Template name',
          description: 'Description',
          isActive: 'Status',
          items: 'KPIs',
        },
        kpi_periods: {
          year: 'Year',
          month: 'Month',
          status: 'Status',
          closedAt: 'Closed at',
        },
        kpi_assignments: {
          periodId: 'Period',
          employeeId: 'Employee',
          templateId: 'Template',
          templateName: 'Template name',
          items: 'KPIs',
        },
        store_visitor_counts: {
          storeId: 'Store',
          visitDate: 'Day',
          visitorCount: 'People who came in',
        },
        employee_salaries: {
          employeeId: 'Employee',
          effectiveMonth: 'Effective from',
          amount: 'Salary',
          currency: 'Currency',
          fixedPercent: 'Fixed percent',
          kpiPercent: 'KPI percent',
        },
      },
    },
    kpiPlans: {
      title: 'KPI plans',
      periodLabel: 'Period',
      newPeriodTitle: 'Open a new period',
      year: 'Year',
      month: 'Month',
      open: 'Open period',
      statusOpen: 'Open',
      statusClosed: 'Closed',
      closePeriod: 'Close period',
      newPeriod: 'New period',
      closeConfirm:
        'Close the {period} period? Plans, targets and scores can no longer be changed. If you close it by mistake, you can reopen it until {date}.',
      closeConfirmFinal:
        'Close the {period} period? The reopening window has passed, so closing is final: plans, targets and scores can never be changed again.',
      reopenPeriod: 'Reopen period',
      reopened: 'The {period} period is open again.',
      reopenExpired: 'This period could be reopened until {date}; it is final now.',
      periodOpenHint: 'Plans, targets and scores can be changed.',
      periodClosedReopenable:
        'Nothing can be changed. If it was closed by mistake, you can reopen it until {date}.',
      periodClosedFinal: 'Final: nothing can be changed and it cannot be reopened.',
      periodPlans: '{count} plans',
      periodMissingTargets: '{count} plans are missing targets',
      deletePlan: 'Delete the plan of {name}',
      deleted: 'The plan of {name} was deleted.',
      closed: 'The {period} period is closed.',
      assign: 'Assign template',
      assignTitle: 'Assign template',
      templateLabel: 'KPI template',
      employeesLabel: 'Employees',
      employeeSearch: 'Search employees',
      assignSubmit: 'Create plans',
      assigned: '{count} employees got a plan.',
      copyFrom: 'Copy from {period}',
      copyConfirm: 'Copy the plans of {period} with their targets?',
      copied: '{created} plans copied, {skipped} employees skipped.',
      copiedNone: 'No plan could be copied.',
      loading: 'Loading…',
      errorLoading: 'Could not load the plans.',
      empty: 'No plans in this period yet.',
      emptyPeriods: 'No KPI period yet. Open a month to start.',
      noSearchResults: 'No plans match your search.',
      searchPlaceholder: 'Search employees',
      resultCount: '{count} plans',
      targetProgress: '{done}/{total} targets',
      columnEmployee: 'Employee',
      columnTemplate: 'Template',
      columnTargets: 'Targets',
      columnActions: 'Actions',
      openPlan: 'Open the plan of {name}',
      openPlanShort: 'Open',
      calculateAll: 'Calculate all',
      calculatingAll: 'Calculating…',
      calculatedAll: '{count} plans were scored.',
      calculatedAllIncomplete: '{count} plans were scored; {incomplete} are still incomplete.',
      columnScore: 'Score',
      noScore: '—',
      scoreValue: '{value} pts',
      assignError: 'Could not create the plans.',
      alreadyAssigned: 'These employees already have a plan in this period: {names}',
      ineligible: 'These employees cannot be given this template: {names}',
      reasonInactive: 'inactive',
      reasonMissingErpLink: 'no Tiger salesperson link',
      reasonAlreadyAssigned: 'already has a plan',
      periodClosedError: 'The period is closed, so nothing was changed.',
      selectTemplate: 'Select a template',
      employeesEmpty: 'No employees found.',
    },
    kpiPlanForm: {
      title: 'KPI plan',
      loading: 'Loading…',
      errorLoading: 'Could not load the plan.',
      save: 'Save targets',
      saved: 'Targets saved.',
      saveError: 'Could not save the targets.',
      closedError: 'The period is closed; targets cannot be changed.',
      invalidTarget:
        'The target is invalid. Enter a number that is not negative, with at most 4 decimals.',
      targetLabel: 'Target',
      missingTarget: 'No target yet',
      weight: 'Weight {value}%',
      stores: 'Stores',
      itemGroups: 'Groups',
      currency: 'Currency',
      recommendation: 'Average {average} · Achievable max {max} · Suggested {recommended}',
      recommendationMonths: '{count} months of data',
      applyRecommendation: 'Apply suggestion',
      applyAll: 'Apply every suggestion',
      applyConfirmOne: '{name}: target {change}.\nIt is kept once you press Save. Are you sure?',
      applyConfirmAll:
        'These targets will change:\n{changes}\nThey are kept once you press Save. Are you sure?',
      applyConfirmButton: 'Apply',
      emptyTarget: 'empty',
      combinedHint: 'several stores added up',
      manualHint: 'This KPI is entered by hand; it has no report.',
      noRecommendation: 'No report data for this KPI.',
      deletePlan: 'Delete plan',
      deleteConfirm: 'Delete the {period} plan of {name}?',
      deleteError: 'Could not delete the plan.',
      closedNotice: 'The {period} period is closed; targets are read-only.',
      calculate: 'Calculate',
      calculating: 'Calculating…',
      calculated: 'The score was calculated.',
      calculatedIncomplete: 'The score was calculated; {done}/{total} rows could be scored.',
      actualLabel: 'Actual',
      actualPlaceholder: 'Typed in',
      actualHint: 'Tiger cannot measure this KPI; you enter the value.',
      calculatedItem: 'This KPI is read from Tiger and cannot be typed in.',
    },
    myKpi: {
      title: 'My KPI',
      loading: 'Loading…',
      errorLoading: 'Could not load your KPI plan.',
      empty: 'No KPI plan has been assigned to you yet.',
      period: 'Period',
      periodOption: '{period} · {score} pts',
      periodOpen: 'Period open; the score is not final yet.',
      periodClosed: 'Period closed; the score is final.',
      weight: 'Weight',
      target: 'Target',
      noTarget: 'No target yet',
      emptyEmployee: 'This employee has no KPI plan yet.',
      errorLoadingEmployee: "Could not load the employee's KPI plan.",
    },
    leaderboard: {
      title: 'Leaderboard',
      period: 'Period',
      templateFilter: 'Filter by template',
      allTemplates: 'All',
      loading: 'Loading…',
      errorLoading: 'Could not load the leaderboard.',
      empty: 'There are no KPI plans in this period yet.',
      autoEvery: 'Scores update on their own every {minutes} minutes',
      autoOff: 'Automatic updates are off',
      periodClosed: 'Period closed; scores are final',
      updatedAt: 'last updated {at}',
      notCalculated: 'Score not calculated yet',
      scoredOf: '{done}/{total} KPIs scored',
      you: 'You',
      rank: 'Rank {rank}',
      unranked: 'Not ranked',
      colRank: 'Rank',
      colEmployee: 'Employee',
      colTemplate: 'Template',
      colScore: 'Score',
      myStanding: 'Your place',
      placeShort: 'place',
      myNotCalculated: 'Your score has not been calculated yet.',
      amongCount: 'out of {count} people',
      gapToNext: '{gap} more points to reach place {rank}',
      leading: 'You are on top! Keep it up.',
      podium: 'Top three',
      others: 'Everyone else',
      openKpi: "Open {name}'s KPIs",
    },
    salary: {
      loading: 'Loading…',
      errorLoading: 'Could not load the salaries.',
      empty: 'No salary has been entered for this employee yet.',
      noneYet: 'No salary is in force this month; the first one starts in a later month.',
      currentTitle: 'Salary in force',
      sinceMonth: 'In force since {month}',
      fromMonth: 'From {month} on',
      inForce: 'In force now',
      history: 'Salary history',
      fixedPart: 'Fixed {percent}%',
      kpiPart: 'KPI {percent}%',
      splitLabel: 'Fixed {fixed}%, KPI {kpi}%',
      add: 'Add salary',
      addTitle: 'Add salary',
      editTitle: 'Correct salary',
      editFor: 'Correct salary: {range}',
      deleteFor: 'Delete salary: {range}',
      deleteConfirm:
        'Delete the salary in force from {month}? The previous salary will apply from that month on.',
      deleteError: 'Could not delete the salary.',
      delete: 'Delete',
      effectiveMonth: 'Effective from',
      effectiveHint: 'Applies from this month until a newer salary is entered.',
      amount: 'Salary',
      amountPlaceholder: 'e.g. 12000',
      currency: 'Currency',
      fixedPercent: 'Fixed (%)',
      kpiPercent: 'KPI (%)',
      preview: 'Fixed {fixed} + KPI {kpi}',
      save: 'Save',
      saving: 'Saving…',
      saveError: 'Could not save the salary.',
      errorMonthExists: 'This employee already has a salary for this month.',
      errorPercentTotal: 'Fixed and KPI percentages must add up to 100.',
    },
    kpiSalary: {
      title: 'Salary',
      since: 'Salary in force since {month}',
      show: 'Show',
      hide: 'Hide · {seconds}',
      hidden: 'Hidden amount; tap to show',
      payable: 'Payable for this period',
      fixedOnly: 'Fixed part (KPIs not calculated yet)',
      barLabel: 'Fixed {fixed}%, KPI {kpi}%, score {score}',
      fixedPart: 'Fixed {percent}%',
      kpiPart: 'KPI {percent}%',
      byScore: 'At a score of {score}',
      fullSalary: 'Full salary',
      interim: 'Period open: the amount changes as the score does.',
      final: 'Period closed; the amount is final.',
      notCalculated: 'The KPI part is added once the score is calculated.',
      itemValue: 'Worth of salary',
      itemEarned: 'Earned',
      noSalary:
        "This employee has no salary in force for this month; enter one on the employee's Salary tab.",
      kpiEarnedShort: 'Earned from KPIs',
      planListHint: 'Salary amounts are hidden; tap to show.',
    },
    kpiProgress: {
      totalScore: 'Total score',
      outOf: '/ {max}',
      notCalculated: 'The score has not been calculated yet.',
      calculatedAt: 'Last calculated: {at}',
      incomplete: '{done}/{total} KPIs scored; the rest have no target or no actual value.',
      achievement: 'Achievement',
      percent: '{value}%',
      reached: 'Target reached',
      actualOfTarget: 'Actual {actual} / target {target}',
      actualOnly: 'Actual {actual}',
      contribution: 'Contribution {score} / {weight}',
      noTarget: 'Not scored: there is no target.',
      noActual: 'Not scored: the actual value has not been entered.',
      meterLabel: '{name} achievement',
      scoreMeterLabel: '{name} total score',
    },
    visitorCounts: {
      title: 'Visitor counts',
      store: 'Store',
      date: 'Day',
      count: 'People who came in',
      countPlaceholder: 'e.g. 184',
      save: 'Save',
      update: 'Update',
      saving: 'Saving…',
      saved: '{store} · {date}: {count} people saved.',
      replaceHint: 'Entering the same store and day again replaces the number.',
      existing: 'Already saved for this day: {count}. Saving replaces it.',
      loading: 'Loading…',
      errorLoading: 'Could not load the entries.',
      empty: 'No entries yet.',
      people: 'people',
      edit: 'Edit',
      editFor: 'Edit the entry of {store} · {date}',
      deleteFor: 'Delete the entry of {store} · {date}',
      deleteConfirm: 'Delete the count of {store} for {date}?',
      deleted: 'The entry was deleted.',
      errorUnknownStore: 'The selected store was not found in Tiger.',
      errorFutureDate: 'A count cannot be entered for a future day.',
      errorClosed: 'This day belongs to a closed KPI period; its count cannot change.',
      saveError: 'The count could not be saved.',
      columnDate: 'Day',
      columnStore: 'Store',
      columnCount: 'People',
      columnActions: 'Actions',
      add: 'Add count',
      addTitle: 'Add visitor count',
      editTitle: 'Correct visitor count',
      filters: 'Filters',
      filterDates: 'Date range',
      filterFrom: 'From',
      filterTo: 'To',
      rangeInvalid: 'The start day cannot be after the end day.',
      rangeFrom: '{date} onwards',
      rangeTo: 'Up to {date}',
      removeFilter: 'Remove filter {filter}',
      resultCount: 'Entries: {count}',
      emptyFiltered: 'No entries match these filters.',
    },
    errors: {
      generic: 'An unexpected error occurred. Please try again.',
      network: 'Could not connect to the server. Check your internet connection.',
      validation: 'Check the information you entered.',
      unauthorized: 'Your session has ended. Please sign in again.',
      forbidden: 'You do not have permission to perform this action.',
      notFound: 'The requested record was not found.',
      conflict: 'This information conflicts with another record.',
      payloadTooLarge: 'The selected file exceeds the allowed size.',
      tooManyRequests: 'Too many attempts. Please wait a moment.',
      server: 'A server error occurred. Please try again later.',
    },
  },
  ru: {
    common: {
      showPassword: 'Показать пароль',
      hidePassword: 'Скрыть пароль',
      close: 'Закрыть',
      closeDialog: 'Закрыть окно «{title}»',
      breadcrumb: 'Навигационная цепочка',
      cancel: 'Отмена',
      confirm: 'Подтвердить',
      confirmTitle: 'Вы уверены?',
      apply: 'Применить',
      clear: 'Сбросить',
      home: 'Главная',
      bulkActions: 'Массовые действия',
      selectedCount: 'Выбрано: {count}',
      clearSelection: 'Снять выделение',
      selectAll: 'Выбрать все в списке',
      selectItem: 'Выбрать: {name}',
    },
    login: {
      brand: 'Retail KPI Platform',
      title: 'Вход',
      subtitle: 'Войдите в свою учётную запись, чтобы начать',
      usernameLabel: 'Имя пользователя',
      usernamePlaceholder: 'Например, admin',
      passwordLabel: 'Пароль',
      submit: 'Войти',
      submitting: 'Выполняется вход…',
      errorInvalidCredentials: 'Неверное имя пользователя или пароль.',
      errorGeneric: 'Не удалось войти. Проверьте подключение.',
      sessionExpired: 'Сессия завершена. Пожалуйста, войдите снова.',
      rememberMe: 'Запомнить меня',
      forgotPassword: 'Забыли пароль?',
      forgotPasswordHelp:
        'Сброс пароля по эл. почте пока не поддерживается. Обратитесь к администратору для сброса пароля.',
    },
    appShell: {
      logout: 'Выйти',
      language: 'Язык',
      openMenu: 'Открыть меню',
      closeMenu: 'Закрыть меню',
      navEmployees: 'Сотрудники',
      navLeaderboard: 'Рейтинг',
      navMyKpi: 'Мои KPI',
      navKpiPlans: 'Планы KPI',
      navVisitorCounts: 'Посетители',
      navKpiTemplates: 'Шаблоны KPI',
      navSessions: 'Мои сессии',
      navSettings: 'Настройки',
    },
    employees: {
      title: 'Сотрудники',
      loading: 'Загрузка…',
      errorLoading: 'Не удалось загрузить сотрудников.',
      empty: 'Сотрудники ещё не добавлены.',
      managerBadge: 'Админ',
      inactiveBadge: 'Неактивен',
      addEmployee: 'Добавить сотрудника',
      statusColumn: 'Статус',
      searchPlaceholder: 'Поиск по имени, фамилии, логину, эл. почте или телефону',
      noSearchResults: 'Нет сотрудников, соответствующих запросу.',
      filters: 'Фильтры',
      resultCount: 'Сотрудников: {count}',
      filtersActiveCount: 'Активных фильтров: {count}',
      filterStatusAll: 'Все',
      filterOnlyActive: 'Только активные',
      filterOnlyInactive: 'Только неактивные',
      filterManagers: 'Только администраторы',
      filterErpLinked: 'Привязан к продавцу ERP',
      filterWithAvatar: 'С фотографией профиля',
      sortLabel: 'Сортировка',
      sortFirstnameAsc: 'Имя (А→Я)',
      sortFirstnameDesc: 'Имя (Я→А)',
      sortLastname: 'Фамилия (А→Я)',
      sortUsername: 'Логин (А→Я)',
      sortNewest: 'Сначала новые',
      sortOldest: 'Сначала старые',
      columnLastname: 'Фамилия',
      columnUsername: 'Логин',
      columnPhone: 'Телефон',
      columnActions: 'Действия',
      openCard: 'Открыть карточку сотрудника {name}',
      editEmployee: 'Редактировать сотрудника {name}',
      activeBadge: 'Активен',
      bulkActivate: 'Активировать',
      bulkDeactivate: 'Деактивировать',
      bulkDeactivateConfirm:
        'Деактивировать выбранных сотрудников ({count})? Их сессии будут завершены, и они не смогут войти, пока их снова не активируют.',
      bulkActivated: 'Активировано сотрудников: {count}.',
      bulkDeactivated: 'Деактивировано сотрудников: {count}, их сессии завершены.',
      bulkError: 'Не удалось выполнить массовое действие. Попробуйте ещё раз.',
      selfSelectHint: 'Собственную учётную запись нельзя изменить массовым действием.',
    },
    settings: {
      profilePhoto: 'Фото профиля',
      changePhoto: 'Изменить фото',
      cropPhoto: 'Обрезать фото',
      cropHint: 'Перетащите фото, чтобы расположить его, ползунком измените масштаб',
      zoom: 'Масштаб фотографии',
      cropSave: 'Обрезать и сохранить',
      photoError: 'Не удалось обновить фото. Попробуйте ещё раз.',
      photoReadError: 'Не удалось прочитать выбранное фото. Выберите другой файл.',
      changePassword: 'Смена пароля',
      currentPassword: 'Текущий пароль',
      newPassword: 'Новый пароль',
      confirmPassword: 'Подтвердите пароль',
      passwordMismatch: 'Пароли не совпадают.',
      passwordTooShort: 'Пароль должен содержать не менее 6 символов.',
      currentPasswordIncorrect: 'Текущий пароль указан неверно.',
      passwordChangeError: 'Не удалось изменить пароль. Попробуйте ещё раз.',
      passwordUpdated: 'Пароль обновлён.',
      submitPassword: 'Сменить пароль',
      saving: 'Сохранение…',
      theme: 'Тема',
      themeLight: 'Светлая',
      themeDark: 'Тёмная',
      themeSystem: 'Системная',
    },
    sessions: {
      title: 'Мои сессии',
      loading: 'Загрузка…',
      errorLoading: 'Не удалось загрузить сессии.',
      empty: 'Активных сессий нет.',
      currentDevice: 'Это устройство',
      lastSeen: 'Последняя активность',
      signedInAt: 'Вход',
      expiresAt: 'Истекает',
      ipAddress: 'IP-адрес',
      unknownDevice: 'Неизвестное устройство',
      revoke: 'Завершить сессию',
      revoking: 'Завершение…',
      logoutAll: 'Выйти на всех устройствах',
      logoutAllConfirm:
        'Сессии будут завершены на всех устройствах, потребуется войти заново. Продолжить?',
      revokeConfirm: 'Сессия на этом устройстве будет завершена. Продолжить?',
      rememberMeBadge: 'Долгая сессия',
      shortSessionBadge: 'Короткая сессия',
      expiryHint:
        'Сессия продлевается при каждом использовании и закрывается при бездействии до этого времени.',
      revokeError: 'Не удалось завершить сессию. Попробуйте ещё раз.',
      logoutAllError: 'Не удалось завершить сессии. Попробуйте ещё раз.',
    },
    employeeCard: {
      title: 'Карточка сотрудника',
      email: 'Эл. почта',
      erpCode: 'Код ERP',
      noErpLink: 'Не привязан к ERP',
      scanHint: 'Содержит код сотрудника ERP; отсканируйте для проверки',
      noQrHint: 'Привяжите сотрудника к продавцу ERP, чтобы создать QR-код.',
      viewPhoto: 'Открыть фото',
      managerRole: 'Администратор',
      employeeRole: 'Сотрудник',
    },
    employeeForm: {
      tabDetails: 'Данные',
      tabSessions: 'Сессии',
      tabKpi: 'KPI',
      tabKpiPlans: 'KPI-планы',
      tabSalary: 'Зарплата',
      goToKpiPlans: 'Перейти к KPI-планам',
      sessionsRevokeAll: 'Завершить все сессии',
      titleCreate: 'Новый сотрудник',
      titleEdit: 'Редактировать сотрудника',
      loading: 'Загрузка…',
      errorLoading: 'Не удалось загрузить данные сотрудника.',
      erpEmployeesError: 'Не удалось загрузить список продавцов ERP.',
      usernameLabel: 'Имя пользователя',
      passwordLabelCreate: 'Пароль',
      passwordLabelEdit: 'Новый пароль (необязательно)',
      passwordHintEdit: 'Оставьте пустым, чтобы не менять текущий пароль.',
      firstnameLabel: 'Имя',
      lastnameLabel: 'Фамилия',
      emailLabel: 'Эл. почта (необязательно)',
      phoneLabel: 'Телефон (необязательно)',
      fullAccessLabel: 'Права администратора',
      fullAccessHint: 'Доступ к разделам «Сотрудники» и управлению файлами.',
      visitorCountsLabel: 'Может вводить число посетителей',
      visitorCountsHint: 'Вводит на экране «Посетители», сколько человек за день вошло в магазины.',
      erpEmployeeLabel: 'Продавец ERP (необязательно)',
      erpEmployeeNone: 'Не привязан',
      erpEmployeeSearchPlaceholder: 'Поиск по коду или имени',
      erpEmployeeNoResults: 'Подходящие продавцы не найдены.',
      save: 'Сохранить',
      saving: 'Сохранение…',
      deactivate: 'Деактивировать сотрудника',
      deactivating: 'Деактивация…',
      reactivate: 'Восстановить',
      reactivating: 'Восстановление…',
      selfDeactivateHint: 'Вы не можете деактивировать собственную учётную запись здесь.',
      usernameRequired: 'Имя пользователя обязательно.',
      usernameTooShort: 'Имя пользователя должно содержать не менее 3 символов.',
      passwordRequired: 'Пароль обязателен.',
      passwordTooShort: 'Пароль должен содержать не менее 8 символов.',
      firstnameRequired: 'Имя обязательно.',
      lastnameRequired: 'Фамилия обязательна.',
      emailInvalid: 'Введите корректный адрес электронной почты.',
      deactivateError: 'Не удалось деактивировать сотрудника.',
      reactivateError: 'Не удалось восстановить сотрудника.',
      genericSaveError: 'Не удалось сохранить. Попробуйте ещё раз.',
    },
    kpiTemplates: {
      title: 'Шаблоны KPI',
      searchPlaceholder: 'Поиск по названию или описанию',
      statusLabel: 'Статус',
      statusAll: 'Все',
      statusActive: 'Активные',
      statusInactive: 'Неактивные',
      loading: 'Загрузка…',
      errorLoading: 'Не удалось загрузить шаблоны KPI.',
      empty: 'Шаблонов KPI пока нет.',
      noSearchResults: 'Нет шаблонов, соответствующих запросу.',
      resultCount: 'Шаблонов: {count}',
      add: 'Новый шаблон KPI',
      inactiveBadge: 'Неактивен',
      kpiCount: 'KPI: {count}',
      weightSummary: 'Вес {total} %',
      columnName: 'Название',
      columnDescription: 'Описание',
      columnKpis: 'KPI',
      columnWeight: 'Общий вес',
      columnStatus: 'Статус',
      columnActions: 'Действия',
      editTemplate: 'Редактировать {name}',
      activeBadge: 'Активен',
      bulkCopy: 'Копировать',
      bulkActivate: 'Активировать',
      bulkDeactivate: 'Деактивировать',
      bulkDeactivateConfirm:
        'Деактивировать выбранные шаблоны ({count})? Их можно снова активировать в любой момент.',
      bulkCopied:
        'Скопировано шаблонов: {count}. К названиям копий добавлен номер, например «(2)».',
      bulkActivated: 'Активировано шаблонов: {count}.',
      bulkDeactivated: 'Деактивировано шаблонов: {count}.',
      bulkDelete: 'Удалить',
      bulkDeleteConfirm:
        'Удалить {count} шаблонов безвозвратно? Действие нельзя отменить. Шаблоны, используемые планами KPI, сохраняются.',
      bulkDeleted: 'Удалено шаблонов: {count}.',
      bulkDeleteInUse:
        'Эти шаблоны используются планами KPI и не могут быть удалены: {names}. Их можно только деактивировать.',
      bulkError: 'Не удалось выполнить массовое действие. Попробуйте ещё раз.',
    },
    kpiTemplateForm: {
      titleCreate: 'Новый шаблон KPI',
      titleEdit: 'Редактирование шаблона KPI',
      loading: 'Загрузка…',
      errorLoading: 'Не удалось загрузить шаблон.',
      nameLabel: 'Название шаблона',
      namePlaceholder: 'напр. KPI ДИРЕКТОРА 01',
      descriptionLabel: 'Описание (необязательно)',
      itemsTitle: 'KPI',
      itemsHint:
        'Сумма весов должна быть ровно 100 %. Цель необязательна, её можно изменить при назначении шаблона на период.',
      addItem: 'Добавить KPI',
      itemTitle: 'KPI {number}',
      removeItem: 'Удалить KPI {number}',
      definitionLabel: 'KPI',
      definitionPlaceholder: 'Найдите и выберите KPI',
      definitionNoResults: 'Подходящие KPI не найдены.',
      definitionsError: 'Не удалось загрузить список KPI.',
      weightLabel: 'Вес (%)',
      targetLabel: 'Цель ({unit})',
      unitMoney: 'сумма',
      unitCount: 'количество',
      unitScore: 'баллы',
      storesPlaceholder: 'Найдите и добавьте магазин',
      storesNoResults: 'Подходящие магазины не найдены.',
      storesError: 'Не удалось загрузить список магазинов.',
      removeStore: 'Удалить {name}',
      itemGroupsPlaceholder: 'Найдите и добавьте группу товаров',
      itemGroupsNoResults: 'Группа не найдена.',
      itemGroupsError: 'Не удалось загрузить группы товаров.',
      itemGroupOption: '{code} · товаров: {count}',
      removeItemGroup: 'Убрать группу {name}',
      ungroupedHint:
        'Товары без группы не входят ни в один групповой KPI: {share}% выручки за 12 месяцев. Они будут учитываться, когда карточкам в Tiger назначат группу.',
      unknownItemGroup: 'KPI {number} содержит несуществующие группы товаров: {codes}.',
      selectPlaceholder: 'Выберите',
      noInputs: 'Для этого KPI нужна только цель.',
      totalWeight: 'Общий вес: {total} % / 100 %',
      totalWeightUnder: 'Общий вес: {total} % / 100 % · не хватает {difference} %',
      totalWeightOver: 'Общий вес: {total} % / 100 % · превышение {difference} %, сохранить нельзя',
      weightOver: 'Сумма весов превышает 100 % (сейчас {total} %). Сохранить в таком виде нельзя.',
      weightUnder: 'Сумма весов должна быть ровно 100 % (сейчас {total} %).',
      save: 'Сохранить',
      saving: 'Сохранение…',
      inactiveNotice: 'Этот шаблон неактивен.',
      deactivate: 'Деактивировать шаблон',
      deactivating: 'Деактивация…',
      reactivate: 'Активировать снова',
      reactivating: 'Активация…',
      deactivateError: 'Не удалось деактивировать шаблон.',
      delete: 'Удалить шаблон',
      deleting: 'Удаление…',
      deleteConfirm: 'Удалить шаблон «{name}» безвозвратно? Действие нельзя отменить.',
      deleteHint:
        'Шаблон, который не используется ни одним планом KPI, можно удалить безвозвратно.',
      deleteError: 'Не удалось удалить шаблон.',
      deleteInUse:
        'По этому шаблону создано планов KPI: {count}, поэтому его нельзя удалить. Его можно деактивировать.',
      copy: 'Создать копию',
      copying: 'Копирование…',
      copyHint: 'Копируется последняя сохранённая версия со всеми KPI.',
      copyError: 'Не удалось скопировать шаблон.',
      copiedNotice: 'Скопировано из «{name}». Можно изменить название и данные и сохранить.',
      nameRequired: 'Название шаблона обязательно.',
      itemsRequired: 'Добавьте хотя бы один KPI.',
      definitionRequired: 'Выберите KPI для строки {number}.',
      weightInvalid:
        'Для KPI {number} укажите вес от 0,01 до 100, не более 2 знаков после запятой.',
      targetInvalid:
        'Цель KPI {number} должна быть не меньше 0 и иметь не более 4 знаков после запятой.',
      inputRequired: 'Для KPI {number} поле «{field}» обязательно.',
      duplicateItem: 'KPI {number} повторяет KPI {other} (тот же KPI и те же данные).',
      unknownDefinition: 'KPI {number} больше не активен или не найден.',
      invalidInput: 'Данные KPI {number} некорректны.',
      unknownStore: 'KPI {number} содержит несуществующий магазин.',
      nameTaken: 'Шаблон KPI с таким названием уже существует.',
      genericSaveError: 'Не удалось сохранить шаблон. Попробуйте ещё раз.',
    },
    recordInfo: {
      buttonFor: 'Сведения о записи: {name}',
      title: 'Сведения о записи',
      createdBy: 'Создал(а)',
      updatedBy: 'Последним изменил(а)',
      system: 'Система',
      history: 'История изменений',
      historyEmpty: 'Для этой записи ещё нет сохранённых изменений.',
      historyHint:
        'Изменения сохраняются с момента включения этой функции; более ранние изменения здесь не отображаются.',
      loading: 'Загрузка…',
      error: 'Не удалось загрузить сведения о записи.',
      loadMore: 'Показать ещё',
      actionCreate: 'Создано',
      actionUpdate: 'Изменено',
      actionDelete: 'Удалено',
      actionActivate: 'Активировано',
      actionDeactivate: 'Деактивировано',
      viaBulkStatus: 'массовым действием',
      viaBulkCopy: 'массовым копированием',
      copiedFrom: 'Скопировано из «{name}»',
      valueAdded: 'добавлено',
      valueRemoved: 'удалено',
      valueChanged: 'изменено',
      valueYes: 'Да',
      valueNo: 'Нет',
      valueActive: 'Активен',
      valueInactive: 'Неактивен',
      itemsBefore: 'Было',
      itemsAfter: 'Стало',
      target: 'цель {value}',
      fields: {
        employees: {
          username: 'Имя пользователя',
          firstname: 'Имя',
          lastname: 'Фамилия',
          email: 'Эл. почта',
          phoneNumber: 'Телефон',
          erpEmployeeId: 'Продавец ERP',
          avatarId: 'Фото профиля',
          fullAccess: 'Права администратора',
          canEnterVisitorCounts: 'Может вводить число посетителей',
          isActive: 'Статус',
          passwordHash: 'Пароль',
        },
        kpi_templates: {
          name: 'Название шаблона',
          description: 'Описание',
          isActive: 'Статус',
          items: 'KPI',
        },
        kpi_periods: {
          year: 'Год',
          month: 'Месяц',
          status: 'Статус',
          closedAt: 'Время закрытия',
        },
        kpi_assignments: {
          periodId: 'Период',
          employeeId: 'Сотрудник',
          templateId: 'Шаблон',
          templateName: 'Название шаблона',
          items: 'KPI',
        },
        store_visitor_counts: {
          storeId: 'Магазин',
          visitDate: 'День',
          visitorCount: 'Сколько человек вошло',
        },
        employee_salaries: {
          employeeId: 'Сотрудник',
          effectiveMonth: 'Действует с',
          amount: 'Зарплата',
          currency: 'Валюта',
          fixedPercent: 'Фиксированная доля, %',
          kpiPercent: 'Доля KPI, %',
        },
      },
    },
    kpiPlans: {
      title: 'Планы KPI',
      periodLabel: 'Период',
      newPeriodTitle: 'Открыть новый период',
      year: 'Год',
      month: 'Месяц',
      open: 'Открыть период',
      statusOpen: 'Открыт',
      statusClosed: 'Закрыт',
      closePeriod: 'Закрыть период',
      newPeriod: 'Новый период',
      closeConfirm:
        'Закрыть период {period}? Планы, цели и баллы больше нельзя будет изменить. Если закроете по ошибке, период можно открыть заново до {date}.',
      closeConfirmFinal:
        'Закрыть период {period}? Срок повторного открытия прошёл, поэтому закрытие окончательное: планы, цели и баллы больше не изменить.',
      reopenPeriod: 'Открыть период заново',
      reopened: 'Период {period} снова открыт.',
      reopenExpired: 'Этот период можно было открыть заново до {date}; теперь он окончательный.',
      periodOpenHint: 'Планы, цели и баллы можно изменять.',
      periodClosedReopenable:
        'Изменения невозможны. Если период закрыт по ошибке, его можно открыть заново до {date}.',
      periodClosedFinal: 'Окончательно: изменения невозможны, открыть заново нельзя.',
      periodPlans: 'Планов: {count}',
      periodMissingTargets: 'Планов с незаполненными целями: {count}',
      deletePlan: 'Удалить план: {name}',
      deleted: 'План сотрудника {name} удалён.',
      closed: 'Период {period} закрыт.',
      assign: 'Назначить шаблон',
      assignTitle: 'Назначить шаблон',
      templateLabel: 'Шаблон KPI',
      employeesLabel: 'Сотрудники',
      employeeSearch: 'Поиск сотрудника',
      assignSubmit: 'Создать планы',
      assigned: 'Планы получили сотрудников: {count}.',
      copyFrom: 'Копировать из {period}',
      copyConfirm: 'Скопировать планы периода {period} вместе с целями?',
      copied: 'Скопировано планов: {created}, пропущено сотрудников: {skipped}.',
      copiedNone: 'Подходящих планов для копирования нет.',
      loading: 'Загрузка…',
      errorLoading: 'Не удалось загрузить планы.',
      empty: 'В этом периоде пока нет планов.',
      emptyPeriods: 'Периодов KPI ещё нет. Откройте месяц, чтобы начать.',
      noSearchResults: 'По запросу планов не найдено.',
      searchPlaceholder: 'Поиск сотрудника',
      resultCount: 'Планов: {count}',
      targetProgress: '{done}/{total} целей',
      columnEmployee: 'Сотрудник',
      columnTemplate: 'Шаблон',
      columnTargets: 'Цели',
      columnActions: 'Действие',
      openPlan: 'Открыть план: {name}',
      openPlanShort: 'Открыть',
      calculateAll: 'Рассчитать все',
      calculatingAll: 'Расчёт…',
      calculatedAll: 'Рассчитаны баллы {count} планов.',
      calculatedAllIncomplete: 'Рассчитаны баллы {count} планов; у {incomplete} балл неполный.',
      columnScore: 'Балл',
      noScore: '—',
      scoreValue: '{value} б.',
      assignError: 'Не удалось создать планы.',
      alreadyAssigned: 'У этих сотрудников уже есть план в периоде: {names}',
      ineligible: 'Этим сотрудникам нельзя назначить шаблон: {names}',
      reasonInactive: 'неактивен',
      reasonMissingErpLink: 'нет связи с продавцом Tiger',
      reasonAlreadyAssigned: 'план уже есть',
      periodClosedError: 'Период закрыт, изменения не сохранены.',
      selectTemplate: 'Выберите шаблон',
      employeesEmpty: 'Сотрудники не найдены.',
    },
    kpiPlanForm: {
      title: 'План KPI',
      loading: 'Загрузка…',
      errorLoading: 'Не удалось загрузить план.',
      save: 'Сохранить цели',
      saved: 'Цели сохранены.',
      saveError: 'Не удалось сохранить цели.',
      closedError: 'Период закрыт; цели изменить нельзя.',
      invalidTarget:
        'Неверная цель. Введите неотрицательное число не более чем с 4 знаками после запятой.',
      targetLabel: 'Цель',
      missingTarget: 'Цель не задана',
      weight: 'Вес {value}%',
      stores: 'Магазины',
      itemGroups: 'Группы',
      currency: 'Валюта',
      recommendation: 'Среднее {average} · Достижимый максимум {max} · Рекомендуется {recommended}',
      recommendationMonths: 'данных за {count} мес.',
      applyRecommendation: 'Применить рекомендацию',
      applyAll: 'Применить все рекомендации',
      applyConfirmOne: '{name}: цель {change}.\nСохранится после нажатия «Сохранить». Вы уверены?',
      applyConfirmAll:
        'Изменятся цели:\n{changes}\nСохранятся после нажатия «Сохранить». Вы уверены?',
      applyConfirmButton: 'Применить',
      emptyTarget: 'пусто',
      combinedHint: 'несколько магазинов суммированы',
      manualHint: 'Этот KPI вводится вручную; отчёта нет.',
      noRecommendation: 'Для этого KPI нет данных отчёта.',
      deletePlan: 'Удалить план',
      deleteConfirm: 'Удалить план {period} сотрудника {name}?',
      deleteError: 'Не удалось удалить план.',
      closedNotice: 'Период {period} закрыт; цели только для чтения.',
      calculate: 'Рассчитать',
      calculating: 'Расчёт…',
      calculated: 'Балл рассчитан.',
      calculatedIncomplete: 'Балл рассчитан; оценено строк: {done}/{total}.',
      actualLabel: 'Факт',
      actualPlaceholder: 'Вводится вручную',
      actualHint: 'Этот KPI не рассчитывается из Tiger; значение вводите вы.',
      calculatedItem: 'Этот KPI читается из Tiger и не вводится вручную.',
    },
    myKpi: {
      title: 'Мои KPI',
      loading: 'Загрузка…',
      errorLoading: 'Не удалось загрузить ваш план KPI.',
      empty: 'Вам ещё не назначен план KPI.',
      period: 'Период',
      periodOption: '{period} · {score} б.',
      periodOpen: 'Период открыт; балл ещё не окончательный.',
      periodClosed: 'Период закрыт; балл окончательный.',
      weight: 'Вес',
      target: 'Цель',
      noTarget: 'Цель ещё не задана',
      emptyEmployee: 'У этого сотрудника пока нет KPI-плана.',
      errorLoadingEmployee: 'Не удалось загрузить KPI-план сотрудника.',
    },
    leaderboard: {
      title: 'Рейтинг',
      period: 'Период',
      templateFilter: 'Фильтр по шаблону',
      allTemplates: 'Все',
      loading: 'Загрузка…',
      errorLoading: 'Не удалось загрузить рейтинг.',
      empty: 'В этом периоде пока нет KPI-планов.',
      autoEvery: 'Баллы обновляются автоматически каждые {minutes} мин',
      autoOff: 'Автообновление выключено',
      periodClosed: 'Период закрыт; баллы окончательные',
      updatedAt: 'обновлено {at}',
      notCalculated: 'Балл ещё не рассчитан',
      scoredOf: 'Оценено KPI: {done}/{total}',
      you: 'Вы',
      rank: '{rank}-е место',
      unranked: 'Без места',
      colRank: 'Место',
      colEmployee: 'Сотрудник',
      colTemplate: 'Шаблон',
      colScore: 'Балл',
      myStanding: 'Ваше место',
      placeShort: 'место',
      myNotCalculated: 'Ваш балл ещё не рассчитан.',
      amongCount: 'из {count} человек',
      gapToNext: 'Ещё {gap} балла до {rank}-го места',
      leading: 'Вы на первом месте! Так держать.',
      podium: 'Тройка лидеров',
      others: 'Остальные места',
      openKpi: 'Открыть KPI: {name}',
    },
    salary: {
      loading: 'Загрузка…',
      errorLoading: 'Не удалось загрузить зарплаты.',
      empty: 'Зарплата этому сотруднику ещё не введена.',
      noneYet: 'В этом месяце зарплата не действует; первая начинается позже.',
      currentTitle: 'Действующая зарплата',
      sinceMonth: 'Действует с: {month}',
      fromMonth: 'С {month}',
      inForce: 'Действует сейчас',
      history: 'История зарплаты',
      fixedPart: 'Фикс. {percent}%',
      kpiPart: 'KPI {percent}%',
      splitLabel: 'Фикс. {fixed}%, KPI {kpi}%',
      add: 'Добавить зарплату',
      addTitle: 'Добавить зарплату',
      editTitle: 'Исправить зарплату',
      editFor: 'Исправить зарплату: {range}',
      deleteFor: 'Удалить зарплату: {range}',
      deleteConfirm:
        'Удалить зарплату, действующую с {month}? С этого месяца будет действовать предыдущая.',
      deleteError: 'Не удалось удалить зарплату.',
      delete: 'Удалить',
      effectiveMonth: 'Действует с месяца',
      effectiveHint: 'Действует с этого месяца, пока не введена новая зарплата.',
      amount: 'Зарплата',
      amountPlaceholder: 'Напр. 12000',
      currency: 'Валюта',
      fixedPercent: 'Фикс. (%)',
      kpiPercent: 'KPI (%)',
      preview: 'Фикс. {fixed} + KPI {kpi}',
      save: 'Сохранить',
      saving: 'Сохранение…',
      saveError: 'Не удалось сохранить зарплату.',
      errorMonthExists: 'У сотрудника уже есть зарплата за этот месяц.',
      errorPercentTotal: 'Сумма фиксированной доли и доли KPI должна быть 100.',
    },
    kpiSalary: {
      title: 'Зарплата',
      since: 'Действует с {month}',
      show: 'Показать',
      hide: 'Скрыть · {seconds}',
      hidden: 'Сумма скрыта; нажмите, чтобы показать',
      payable: 'К выплате за период',
      fixedOnly: 'Фиксированная часть (KPI ещё не рассчитаны)',
      barLabel: 'Фикс. {fixed}%, KPI {kpi}%, балл {score}',
      fixedPart: 'Фикс. {percent}%',
      kpiPart: 'KPI {percent}%',
      byScore: 'При балле {score}',
      fullSalary: 'Полная зарплата',
      interim: 'Период открыт: сумма меняется вместе с баллом.',
      final: 'Период закрыт; сумма окончательная.',
      notCalculated: 'Часть KPI добавится после расчёта балла.',
      itemValue: 'Доля в зарплате',
      itemEarned: 'Заработано',
      noSalary:
        'У сотрудника нет действующей зарплаты за этот месяц; её вводят на вкладке «Зарплата».',
      kpiEarnedShort: 'Заработано по KPI',
      planListHint: 'Суммы зарплаты скрыты; нажмите, чтобы показать.',
    },
    kpiProgress: {
      totalScore: 'Итоговый балл',
      outOf: '/ {max}',
      notCalculated: 'Балл ещё не рассчитан.',
      calculatedAt: 'Последний расчёт: {at}',
      incomplete: 'Оценено {done}/{total} KPI; у остальных нет цели или факта.',
      achievement: 'Выполнение',
      percent: '{value}%',
      reached: 'Цель достигнута',
      actualOfTarget: 'Факт {actual} / цель {target}',
      actualOnly: 'Факт {actual}',
      contribution: 'Вклад {score} / {weight}',
      noTarget: 'Не оценено: цель не задана.',
      noActual: 'Не оценено: факт не введён.',
      meterLabel: 'Выполнение: {name}',
      scoreMeterLabel: 'Итоговый балл: {name}',
    },
    visitorCounts: {
      title: 'Посетители',
      store: 'Магазин',
      date: 'День',
      count: 'Сколько человек вошло',
      countPlaceholder: 'Напр. 184',
      save: 'Сохранить',
      update: 'Обновить',
      saving: 'Сохранение…',
      saved: '{store} · {date}: сохранено, {count} чел.',
      replaceHint: 'Если снова ввести тот же магазин и день, число заменится.',
      existing: 'На этот день уже сохранено: {count}. Сохранение заменит число.',
      loading: 'Загрузка…',
      errorLoading: 'Не удалось загрузить записи.',
      empty: 'Записей пока нет.',
      people: 'чел.',
      edit: 'Изменить',
      editFor: 'Изменить запись: {store} · {date}',
      deleteFor: 'Удалить запись: {store} · {date}',
      deleteConfirm: 'Удалить число посетителей магазина {store} за {date}?',
      deleted: 'Запись удалена.',
      errorUnknownStore: 'Выбранный магазин не найден в Tiger.',
      errorFutureDate: 'Нельзя вводить число за будущий день.',
      errorClosed: 'Этот день относится к закрытому периоду KPI; число изменить нельзя.',
      saveError: 'Не удалось сохранить число.',
      columnDate: 'День',
      columnStore: 'Магазин',
      columnCount: 'Посетители',
      columnActions: 'Действие',
      add: 'Добавить',
      addTitle: 'Добавить число посетителей',
      editTitle: 'Исправить число посетителей',
      filters: 'Фильтры',
      filterDates: 'Период',
      filterFrom: 'С',
      filterTo: 'По',
      rangeInvalid: 'Начальная дата не может быть позже конечной.',
      rangeFrom: 'С {date}',
      rangeTo: 'По {date}',
      removeFilter: 'Убрать фильтр {filter}',
      resultCount: 'Записей: {count}',
      emptyFiltered: 'Нет записей по этим фильтрам.',
    },
    errors: {
      generic: 'Произошла непредвиденная ошибка. Попробуйте ещё раз.',
      network: 'Не удалось подключиться к серверу. Проверьте интернет-соединение.',
      validation: 'Проверьте введённые данные.',
      unauthorized: 'Сессия завершена. Войдите снова.',
      forbidden: 'У вас нет разрешения на выполнение этого действия.',
      notFound: 'Запрошенная запись не найдена.',
      conflict: 'Эти данные конфликтуют с другой записью.',
      payloadTooLarge: 'Выбранный файл превышает допустимый размер.',
      tooManyRequests: 'Слишком много попыток. Подождите немного.',
      server: 'Произошла ошибка сервера. Повторите попытку позже.',
    },
  },
  tk: {
    common: {
      showPassword: 'Paroly görkez',
      hidePassword: 'Paroly gizle',
      close: 'Ýap',
      closeDialog: '{title} penjiresini ýap',
      breadcrumb: 'Nawigasiýa ýoly',
      cancel: 'Ýatyr',
      confirm: 'Tassykla',
      confirmTitle: 'Ynamyňyz barmy?',
      apply: 'Ulan',
      clear: 'Arassala',
      home: 'Baş sahypa',
      bulkActions: 'Köpçülikleýin amallar',
      selectedCount: '{count} saýlandy',
      clearSelection: 'Saýlawy aýyr',
      selectAll: 'Sanawdakylaryň hemmesini saýla',
      selectItem: '{name} saýla',
    },
    login: {
      brand: 'Retail KPI Platform',
      title: 'Giriş',
      subtitle: 'Başlamak üçin hasabyňyza giriň',
      usernameLabel: 'Ulanyjy ady',
      usernamePlaceholder: 'Mysal üçin, admin',
      passwordLabel: 'Parol',
      submit: 'Giriş et',
      submitting: 'Giriş edilýär…',
      errorInvalidCredentials: 'Ulanyjy ady ýa-da parol nädogry.',
      errorGeneric: 'Giriş edip bolmady. Internet baglanyşygyňyzy barlaň.',
      sessionExpired: 'Sessiýaňyz tamamlandy. Täzeden giriň.',
      rememberMe: 'Meni ýatda sakla',
      forgotPassword: 'Paroly unutdyňyzmy?',
      forgotPasswordHelp:
        'E-poçta arkaly parol sıfırlama heniz goldanmaýar. Parolyňyzy sıfırlamak üçin admin bilen habarlaşyň.',
    },
    appShell: {
      logout: 'Çykyş',
      language: 'Dil',
      openMenu: 'Menýuny aç',
      closeMenu: 'Menýuny ýap',
      navEmployees: 'Işgärler',
      navLeaderboard: 'Reýting tablisasy',
      navMyKpi: 'Meniň KPI-larym',
      navKpiPlans: 'KPI meýilnamalary',
      navVisitorCounts: 'Gelýänleriň sany',
      navKpiTemplates: 'KPI şablonlary',
      navSessions: 'Meniň sessiýalarym',
      navSettings: 'Sazlamalar',
    },
    employees: {
      title: 'Işgärler',
      loading: 'Ýüklenýär…',
      errorLoading: 'Işgärler ýüklenip bilinmedi.',
      empty: 'Heniz işgär goşulmady.',
      managerBadge: 'Admin',
      inactiveBadge: 'Passiw',
      addEmployee: 'Täze işgär goş',
      statusColumn: 'Ýagdaýy',
      searchPlaceholder: 'Ady, familiýasy, ulanyjy ady, e-poçta ýa-da telefon boýunça gözle',
      noSearchResults: 'Gözlegiňize laýyk işgär tapylmady.',
      filters: 'Filtrler',
      resultCount: '{count} işgär',
      filtersActiveCount: '{count} filtr işjeň',
      filterStatusAll: 'Ählisi',
      filterOnlyActive: 'Diňe aktiw işgärler',
      filterOnlyInactive: 'Diňe passiw işgärler',
      filterManagers: 'Diňe adminler',
      filterErpLinked: 'ERP satyjysyna baglanan',
      filterWithAvatar: 'Profil suraty barlar',
      sortLabel: 'Tertip',
      sortFirstnameAsc: 'Ady (A→Z)',
      sortFirstnameDesc: 'Ady (Z→A)',
      sortLastname: 'Familiýasy (A→Z)',
      sortUsername: 'Ulanyjy ady (A→Z)',
      sortNewest: 'Iň täze',
      sortOldest: 'Iň köne',
      columnLastname: 'Familiýasy',
      columnUsername: 'Ulanyjy ady',
      columnPhone: 'Telefon',
      columnActions: 'Amal',
      openCard: '{name} işgär kartasyny aç',
      editEmployee: '{name} işgärini üýtget',
      activeBadge: 'Aktiw',
      bulkActivate: 'Aktiwleşdir',
      bulkDeactivate: 'Passiwleşdir',
      bulkDeactivateConfirm:
        '{count} işgär passiwleşdirilsinmi? Açyk sessiýalary ýapylar we gaýtadan aktiwleşdirilýänçä ulgama girip bilmezler.',
      bulkActivated: '{count} işgär aktiwleşdirildi.',
      bulkDeactivated: '{count} işgär passiwleşdirildi, sessiýalary ýapyldy.',
      bulkError: 'Köpçülikleýin amal tamamlanmady. Gaýtadan synanyşyň.',
      selfSelectHint: 'Öz hasabyňyzy köpçülikleýin amal bilen üýtgedip bilmersiňiz.',
    },
    settings: {
      profilePhoto: 'Profil suraty',
      changePhoto: 'Suraty üýtget',
      cropPhoto: 'Suraty kes',
      cropHint: 'Surady süýşürip ýerleşdiriň, slaýder bilen ulaldyň',
      zoom: 'Suratyň ulaldyş derejesi',
      cropSave: 'Kes we sakla',
      photoError: 'Surat täzelenip bilinmedi. Gaýtadan synanyşyň.',
      photoReadError: 'Saýlanan surat okalmady. Başga faýly synap görüň.',
      changePassword: 'Paroly üýtget',
      currentPassword: 'Häzirki parol',
      newPassword: 'Täze parol',
      confirmPassword: 'Paroly tassykla',
      passwordMismatch: 'Parollar gabat gelmeýär.',
      passwordTooShort: 'Parol azyndan 6 belgiden ybarat bolmaly.',
      currentPasswordIncorrect: 'Häzirki parol nädogry.',
      passwordChangeError: 'Paroly üýtgedip bolmady. Gaýtadan synanyşyň.',
      passwordUpdated: 'Parol täzelendi.',
      submitPassword: 'Paroly üýtget',
      saving: 'Saklanýar…',
      theme: 'Tema',
      themeLight: 'Açyk',
      themeDark: 'Goýy',
      themeSystem: 'Ulgam',
    },
    sessions: {
      title: 'Meniň sessiýalarym',
      loading: 'Ýüklenýär…',
      errorLoading: 'Sessiýalar ýüklenip bilinmedi.',
      empty: 'Aktiw sessiýa ýok.',
      currentDevice: 'Bu enjam',
      lastSeen: 'Soňky görlen',
      signedInAt: 'Giriş',
      expiresAt: 'Gutarýar',
      ipAddress: 'IP salgysy',
      unknownDevice: 'Näbelli enjam',
      revoke: 'Sessiýany ýap',
      revoking: 'Ýapylýar…',
      logoutAll: 'Ähli enjamlardan çyk',
      logoutAllConfirm:
        'Ähli enjamlardaky sessiýalar ýapylar we gaýtadan girmeli bolarsyňyz. Dowam edilsinmi?',
      revokeConfirm: 'Bu enjamdaky sessiýa ýapylar. Dowam edilsinmi?',
      rememberMeBadge: 'Uzyn sessiýa',
      shortSessionBadge: 'Gysga sessiýa',
      expiryHint: 'Sessiýa her ulanylanda uzalýar; şu wagta çenli hereket edilmese ýapylýar.',
      revokeError: 'Sessiýany ýapyp bolmady. Gaýtadan synanyşyň.',
      logoutAllError: 'Sessiýalary ýapyp bolmady. Gaýtadan synanyşyň.',
    },
    employeeCard: {
      title: 'Işgär kartasy',
      email: 'E-poçta',
      erpCode: 'ERP kody',
      noErpLink: 'ERP bilen baglanyşyk ýok',
      scanHint: 'ERP işgär kodyny saklaýar; barlamak üçin okadyň',
      noQrHint: 'QR kod döretmek üçin bu işgäri ERP satyjysyna baglaň.',
      viewPhoto: 'Suraty ulalt',
      managerRole: 'Admin',
      employeeRole: 'Işgär',
    },
    employeeForm: {
      tabDetails: 'Maglumatlar',
      tabSessions: 'Sessiýalar',
      tabKpi: 'KPI',
      tabKpiPlans: 'KPI meýilnamalary',
      tabSalary: 'Aýlyk',
      goToKpiPlans: 'KPI meýilnamalaryna geç',
      sessionsRevokeAll: 'Ähli sessiýalary ýap',
      titleCreate: 'Täze işgär',
      titleEdit: 'Işgäri üýtget',
      loading: 'Ýüklenýär…',
      errorLoading: 'Işgär maglumatlary ýüklenip bilinmedi.',
      erpEmployeesError: 'ERP satyjylarynyň sanawy ýüklenip bilinmedi.',
      usernameLabel: 'Ulanyjy ady',
      passwordLabelCreate: 'Parol',
      passwordLabelEdit: 'Täze parol (hökman däl)',
      passwordHintEdit: 'Boş goýulsa, häzirki parol üýtgemez.',
      firstnameLabel: 'Ady',
      lastnameLabel: 'Familiýasy',
      emailLabel: 'E-poçta (hökman däl)',
      phoneLabel: 'Telefon (hökman däl)',
      fullAccessLabel: 'Admin hukugy',
      fullAccessHint: 'Işgärler we faýl dolandyryşy ýaly ekranlara girip bilýär.',
      visitorCountsLabel: 'Gelýänleriň sanyny girizip biler',
      visitorCountsHint:
        'Dükanlara her gün giren adam sanyny "Gelýänleriň sany" ekranynda girizýär.',
      erpEmployeeLabel: 'ERP satyjysy (hökman däl)',
      erpEmployeeNone: 'Baglanmadyk',
      erpEmployeeSearchPlaceholder: 'Kod ýa-da at boýunça gözläň',
      erpEmployeeNoResults: 'Laýyk gelýän satyjy tapylmady.',
      save: 'Sakla',
      saving: 'Saklanýar…',
      deactivate: 'Işgäri passiwleşdir',
      deactivating: 'Passiwleşdirilýär…',
      reactivate: 'Gaýtadan aktiwleşdir',
      reactivating: 'Aktiwleşdirilýär…',
      selfDeactivateHint: 'Öz hasabyňyzy şu ýerden passiwleşdirip bilmersiňiz.',
      usernameRequired: 'Ulanyjy ady hökmany.',
      usernameTooShort: 'Ulanyjy ady azyndan 3 belgiden ybarat bolmaly.',
      passwordRequired: 'Parol hökmany.',
      passwordTooShort: 'Parol azyndan 8 belgiden ybarat bolmaly.',
      firstnameRequired: 'Ady hökmany.',
      lastnameRequired: 'Familiýasy hökmany.',
      emailInvalid: 'Dogry e-poçta salgysyny giriziň.',
      deactivateError: 'Işgäri passiwleşdirip bolmady.',
      reactivateError: 'Işgäri gaýtadan aktiwleşdirip bolmady.',
      genericSaveError: 'Saklanyp bilinmedi. Gaýtadan synanyşyň.',
    },
    kpiTemplates: {
      title: 'KPI şablonlary',
      searchPlaceholder: 'Ady ýa-da düşündirişi boýunça gözle',
      statusLabel: 'Ýagdaýy',
      statusAll: 'Ählisi',
      statusActive: 'Aktiw',
      statusInactive: 'Passiw',
      loading: 'Ýüklenýär…',
      errorLoading: 'KPI şablonlary ýüklenip bilinmedi.',
      empty: 'Heniz KPI şablony ýok.',
      noSearchResults: 'Gözlegiňize laýyk şablon tapylmady.',
      resultCount: '{count} şablon',
      add: 'Täze KPI şablony',
      inactiveBadge: 'Passiw',
      kpiCount: '{count} KPI',
      weightSummary: 'Agram {total}%',
      columnName: 'Ady',
      columnDescription: 'Düşündiriş',
      columnKpis: 'KPI sany',
      columnWeight: 'Jemi agram',
      columnStatus: 'Ýagdaýy',
      columnActions: 'Hereket',
      editTemplate: '{name} şablonyny üýtget',
      activeBadge: 'Aktiw',
      bulkCopy: 'Nusgala',
      bulkActivate: 'Aktiwleşdir',
      bulkDeactivate: 'Passiwleşdir',
      bulkDeactivateConfirm:
        '{count} şablon passiwleşdirilsinmi? Islän wagtyňyz gaýtadan aktiwleşdirip bilersiňiz.',
      bulkCopied: '{count} şablon nusgalandy; nusgalaryň adyna “(2)” ýaly san goşuldy.',
      bulkActivated: '{count} şablon aktiwleşdirildi.',
      bulkDeactivated: '{count} şablon passiwleşdirildi.',
      bulkDelete: 'Poz',
      bulkDeleteConfirm:
        '{count} şablon hemişelik pozulsynmy? Bu amal yzyna alynmaýar. KPI meýilnamasynda ulanylýan şablon pozulmaýar.',
      bulkDeleted: '{count} şablon hemişelik pozuldy.',
      bulkDeleteInUse:
        'Şu şablonlar KPI meýilnamalarynda ulanylýar we pozulyp bilinmeýär: {names}. Olary diňe passiwleşdirip bilersiňiz.',
      bulkError: 'Köpçülikleýin amal tamamlanmady. Gaýtadan synanyşyň.',
    },
    kpiTemplateForm: {
      titleCreate: 'Täze KPI şablony',
      titleEdit: 'KPI şablonyny üýtget',
      loading: 'Ýüklenýär…',
      errorLoading: 'Şablon ýüklenip bilinmedi.',
      nameLabel: 'Şablonyň ady',
      namePlaceholder: 'mysal üçin MÜDÜR KPI 01',
      descriptionLabel: 'Düşündiriş (hökman däl)',
      itemsTitle: 'KPI-lar',
      itemsHint:
        'Agramlaryň jemi takyk 100% bolmaly. Maksat hökman däl; şablon döwre bellenende üýtgedip bolýar.',
      addItem: 'KPI goş',
      itemTitle: 'KPI {number}',
      removeItem: 'KPI {number} setirini aýyr',
      definitionLabel: 'KPI',
      definitionPlaceholder: 'KPI gözle we saýla',
      definitionNoResults: 'Laýyk KPI tapylmady.',
      definitionsError: 'KPI sanawy ýüklenip bilinmedi.',
      weightLabel: 'Agram (%)',
      targetLabel: 'Maksat ({unit})',
      unitMoney: 'möçber',
      unitCount: 'sany',
      unitScore: 'bal',
      storesPlaceholder: 'Dükan gözle we goş',
      storesNoResults: 'Laýyk dükan tapylmady.',
      storesError: 'Dükanlaryň sanawy ýüklenip bilinmedi.',
      removeStore: '{name} dükanyny aýyr',
      itemGroupsPlaceholder: 'Haryt toparyny gözläň we goşuň',
      itemGroupsNoResults: 'Topar tapylmady.',
      itemGroupsError: 'Haryt toparlary ýüklenip bilinmedi.',
      itemGroupOption: '{code} · {count} haryt',
      removeItemGroup: '{name} toparyny aýyr',
      ungroupedHint:
        'Topary bolmadyk harytlar hiç bir topar KPI-syna girmeýär: soňky 12 aýda satuwyň %{share}-i. Tiger-de haryt kartlaryna topar berlende hasaba alynýar.',
      unknownItemGroup:
        '{number}-nji KPI indi ýok bolan haryt toparlaryny öz içine alýar: {codes}.',
      selectPlaceholder: 'Saýlaň',
      noInputs: 'Bu KPI üçin maksatdan başga maglumat gerek däl.',
      totalWeight: 'Jemi agram: {total}% / 100%',
      totalWeightUnder: 'Jemi agram: {total}% / 100% · {difference}% ýetmezçilik',
      totalWeightOver: 'Jemi agram: {total}% / 100% · {difference}% artyk, saklap bolmaýar',
      weightOver:
        'Agramlaryň jemi 100%-den geçýär (häzir {total}%). Şeýle ýagdaýda saklap bolmaýar.',
      weightUnder: 'Agramlaryň jemi takyk 100% bolmaly (häzir {total}%).',
      save: 'Sakla',
      saving: 'Saklanýar…',
      inactiveNotice: 'Bu şablon passiw.',
      deactivate: 'Şablony passiwleşdir',
      deactivating: 'Passiwleşdirilýär…',
      reactivate: 'Gaýtadan aktiwleşdir',
      reactivating: 'Aktiwleşdirilýär…',
      deactivateError: 'Şablony passiwleşdirip bolmady.',
      delete: 'Şablony poz',
      deleting: 'Pozulýar…',
      deleteConfirm: '“{name}” şablony hemişelik pozulsynmy? Bu amal yzyna alynmaýar.',
      deleteHint: 'KPI meýilnamasynda ulanylmaýan şablon hemişelik pozulyp bilner.',
      deleteError: 'Şablon pozulmady.',
      deleteInUse:
        'Bu şablondan {count} KPI meýilnamasy döredilipdir, şonuň üçin pozulyp bilinmeýär. Ony passiwleşdirip bilersiňiz.',
      copy: 'Nusgasyny döret',
      copying: 'Nusgalanýar…',
      copyHint: 'Iň soňky saklanan görnüşi ähli KPI-lary bilen nusgalanýar.',
      copyError: 'Şablony nusgalap bolmady.',
      copiedNotice:
        '“{name}” şablonyndan nusgalandy. Adyny we maglumatlaryny üýtgedip saklap bilersiňiz.',
      nameRequired: 'Şablonyň ady hökmany.',
      itemsRequired: 'Iň bolmanda bir KPI goşuň.',
      definitionRequired: 'Setir {number} üçin KPI saýlaň.',
      weightInvalid:
        'KPI {number} üçin 0,01 bilen 100 aralygynda, iň köp 2 onluk belgili agram giriziň.',
      targetInvalid:
        'KPI {number} üçin maksat 0-dan kiçi bolmaly däl we iň köp 4 onluk belgisi bolmaly.',
      inputRequired: 'KPI {number} üçin “{field}” meýdany hökmany.',
      duplicateItem:
        'KPI {number} KPI {other} bilen gaýtalanýar (şol bir KPI we şol bir maglumatlar).',
      unknownDefinition: 'KPI {number} indi aktiw däl ýa-da tapylmady.',
      invalidInput: 'KPI {number} maglumatlary nädogry.',
      unknownStore: 'KPI {number} indi ýok bolan dükany öz içine alýar.',
      nameTaken: 'Bu atly KPI şablony eýýäm bar.',
      genericSaveError: 'Şablony saklap bolmady. Gaýtadan synanyşyň.',
    },
    recordInfo: {
      buttonFor: '{name} ýazgy maglumaty',
      title: 'Ýazgy maglumaty',
      createdBy: 'Döreden',
      updatedBy: 'Soňky üýtgeden',
      system: 'Ulgam',
      history: 'Üýtgeşmeler taryhy',
      historyEmpty: 'Bu ýazgy üçin entek üýtgeşme ýazylmady.',
      historyHint:
        'Üýtgeşmeler bu aýratynlyk açylandan bäri ýazylýar; has öňki üýtgeşmeler bu ýerde görünmeýär.',
      loading: 'Ýüklenýär…',
      error: 'Ýazgy maglumatyny ýükläp bolmady.',
      loadMore: 'Ýene görkez',
      actionCreate: 'Döredildi',
      actionUpdate: 'Üýtgedildi',
      actionDelete: 'Pozuldy',
      actionActivate: 'Aktiwleşdirildi',
      actionDeactivate: 'Passiwleşdirildi',
      viaBulkStatus: 'köpçülikleýin amal bilen',
      viaBulkCopy: 'köpçülikleýin nusgalamak bilen',
      copiedFrom: '“{name}” şablonyndan nusgalandy',
      valueAdded: 'goşuldy',
      valueRemoved: 'aýryldy',
      valueChanged: 'üýtgedildi',
      valueYes: 'Hawa',
      valueNo: 'Ýok',
      valueActive: 'Aktiw',
      valueInactive: 'Passiw',
      itemsBefore: 'Öň',
      itemsAfter: 'Soň',
      target: 'maksat {value}',
      fields: {
        employees: {
          username: 'Ulanyjy ady',
          firstname: 'Ady',
          lastname: 'Familiýasy',
          email: 'E-poçta',
          phoneNumber: 'Telefon',
          erpEmployeeId: 'ERP satyjysy',
          avatarId: 'Profil suraty',
          fullAccess: 'Admin hukugy',
          canEnterVisitorCounts: 'Gelýänleriň sanyny girizip biler',
          isActive: 'Ýagdaýy',
          passwordHash: 'Parol',
        },
        kpi_templates: {
          name: 'Şablonyň ady',
          description: 'Düşündiriş',
          isActive: 'Ýagdaýy',
          items: 'KPI-lar',
        },
        kpi_periods: {
          year: 'Ýyl',
          month: 'Aý',
          status: 'Ýagdaýy',
          closedAt: 'Ýapylan wagty',
        },
        kpi_assignments: {
          periodId: 'Döwür',
          employeeId: 'Işgär',
          templateId: 'Şablon',
          templateName: 'Şablonyň ady',
          items: 'KPI-lar',
        },
        store_visitor_counts: {
          storeId: 'Dükan',
          visitDate: 'Gün',
          visitorCount: 'Giren adam sany',
        },
        employee_salaries: {
          employeeId: 'Işgär',
          effectiveMonth: 'Güýje girýän aýy',
          amount: 'Aýlyk',
          currency: 'Pul birligi',
          fixedPercent: 'Hemişelik göterim',
          kpiPercent: 'KPI göterimi',
        },
      },
    },
    kpiPlans: {
      title: 'KPI meýilnamalary',
      periodLabel: 'Döwür',
      newPeriodTitle: 'Täze döwür aç',
      year: 'Ýyl',
      month: 'Aý',
      open: 'Döwri aç',
      statusOpen: 'Açyk',
      statusClosed: 'Ýapyk',
      closePeriod: 'Döwri ýap',
      newPeriod: 'Täze döwür',
      closeConfirm:
        '{period} döwri ýapylsynmy? Ýapyk döwürde meýilnama, maksat we bal üýtgedilip bilinmeýär. Ýalňyşlyk bilen ýapsaňyz, {date} senesine çenli gaýtadan açyp bilersiňiz.',
      closeConfirmFinal:
        '{period} döwri ýapylsynmy? Gaýtadan açmak möhleti geçdi, şonuň üçin ýapmak kesgitli bolar: meýilnama, maksat we bal indi üýtgedilip bilinmez.',
      reopenPeriod: 'Döwri gaýtadan aç',
      reopened: '{period} döwri gaýtadan açyldy.',
      reopenExpired: 'Bu döwri {date} senesine çenli gaýtadan açyp bolýardy; indi kesgitlendi.',
      periodOpenHint: 'Meýilnamalar, maksatlar we ballar üýtgedilip bilner.',
      periodClosedReopenable:
        'Üýtgeşme girizip bolmaýar. Ýalňyşlyk bilen ýapylan bolsa, {date} senesine çenli gaýtadan açyp bilersiňiz.',
      periodClosedFinal: 'Kesgitlendi: üýtgeşme girizip bolmaýar, gaýtadan açylmaýar.',
      periodPlans: '{count} meýilnama',
      periodMissingTargets: '{count} meýilnamanyň maksady doly däl',
      deletePlan: '{name} işgäriniň meýilnamasyny poz',
      deleted: '{name} işgäriniň meýilnamasy pozuldy.',
      closed: '{period} döwri ýapyldy.',
      assign: 'Şablon belle',
      assignTitle: 'Şablon belle',
      templateLabel: 'KPI şablony',
      employeesLabel: 'Işgärler',
      employeeSearch: 'Işgär gözle',
      assignSubmit: 'Meýilnama döret',
      assigned: '{count} işgäre meýilnama berildi.',
      copyFrom: '{period} aýyndan göçür',
      copyConfirm: '{period} döwrüniň meýilnamalary maksatlary bilen göçürilsinmi?',
      copied: '{created} meýilnama göçürildi, {skipped} işgär geçildi.',
      copiedNone: 'Göçürmäge amatly meýilnama tapylmady.',
      loading: 'Ýüklenýär…',
      errorLoading: 'Meýilnamalar ýüklenmedi.',
      empty: 'Bu döwürde entek meýilnama ýok.',
      emptyPeriods: 'Entek KPI döwri ýok. Başlamak üçin bir aý açyň.',
      noSearchResults: 'Gözlege laýyk meýilnama tapylmady.',
      searchPlaceholder: 'Işgär gözle',
      resultCount: '{count} meýilnama',
      targetProgress: '{done}/{total} maksat',
      columnEmployee: 'Işgär',
      columnTemplate: 'Şablon',
      columnTargets: 'Maksatlar',
      columnActions: 'Amal',
      openPlan: '{name} meýilnamasyny aç',
      openPlanShort: 'Aç',
      calculateAll: 'Hemmesini hasapla',
      calculatingAll: 'Hasaplanýar…',
      calculatedAll: '{count} meýilnamanyň baly hasaplandy.',
      calculatedAllIncomplete:
        '{count} meýilnamanyň baly hasaplandy; {incomplete} sanysy doly däl.',
      columnScore: 'Bal',
      noScore: '—',
      scoreValue: '{value} bal',
      assignError: 'Meýilnama döredilmedi.',
      alreadyAssigned: 'Bu işgärleriň bu döwürde eýýäm meýilnamasy bar: {names}',
      ineligible: 'Bu işgärlere şablon berip bolmaýar: {names}',
      reasonInactive: 'passiw',
      reasonMissingErpLink: 'Tiger satyjy baglanyşygy ýok',
      reasonAlreadyAssigned: 'meýilnamasy eýýäm bar',
      periodClosedError: 'Döwür ýapyk bolany üçin üýtgeşme ýazylmady.',
      selectTemplate: 'Şablon saýlaň',
      employeesEmpty: 'Işgär tapylmady.',
    },
    kpiPlanForm: {
      title: 'KPI meýilnamasy',
      loading: 'Ýüklenýär…',
      errorLoading: 'Meýilnama ýüklenmedi.',
      save: 'Maksatlary sakla',
      saved: 'Maksatlar saklandy.',
      saveError: 'Maksatlar saklanmady.',
      closedError: 'Döwür ýapyk; maksatlar üýtgedilip bilinmeýär.',
      invalidTarget: 'Maksat nädogry. Otrisatel bolmadyk, iň köp 4 onluk belgili san giriziň.',
      targetLabel: 'Maksat',
      missingTarget: 'Maksat girizilmedi',
      weight: 'Agram {value}%',
      stores: 'Dükanlar',
      itemGroups: 'Toparlar',
      currency: 'Walýuta',
      recommendation: 'Ortaça {average} · Ýetip boljak iň ýokary {max} · Teklip {recommended}',
      recommendationMonths: '{count} aýlyk maglumat',
      applyRecommendation: 'Teklibi ulan',
      applyAll: 'Ähli teklipleri ulan',
      applyConfirmOne:
        '{name}: maksat {change} bolar.\nÝatda sakla basylanda hemişelik bolar. Ynamyňyz barmy?',
      applyConfirmAll:
        'Şu maksatlar üýtgeýär:\n{changes}\nÝatda sakla basylanda hemişelik bolar. Ynamyňyz barmy?',
      applyConfirmButton: 'Ulan',
      emptyTarget: 'boş',
      combinedHint: 'birnäçe dükan jemlendi',
      manualHint: 'Bu KPI el bilen girizilýär; hasabaty ýok.',
      noRecommendation: 'Bu KPI üçin hasabat maglumaty ýok.',
      deletePlan: 'Meýilnamany poz',
      deleteConfirm: '{name} işgäriniň {period} meýilnamasy pozulsynmy?',
      deleteError: 'Meýilnama pozulmady.',
      closedNotice: '{period} döwri ýapyk; maksatlar diňe okalýar.',
      calculate: 'Hasapla',
      calculating: 'Hasaplanýar…',
      calculated: 'Bal hasaplandy.',
      calculatedIncomplete: 'Bal hasaplandy; {done}/{total} setir bahalandy.',
      actualLabel: 'Hakyky',
      actualPlaceholder: 'El bilen girizilýär',
      actualHint: 'Bu KPI Tiger’dan hasaplanmaýar; bahany siz girizýärsiňiz.',
      calculatedItem: 'Bu KPI Tiger’dan okalýar, el bilen girizilmeýär.',
    },
    myKpi: {
      title: 'Meniň KPI-larym',
      loading: 'Ýüklenýär…',
      errorLoading: 'KPI meýilnamaňyz ýüklenmedi.',
      empty: 'Size entek KPI meýilnamasy berilmedi.',
      period: 'Döwür',
      periodOption: '{period} · {score} bal',
      periodOpen: 'Döwür açyk; bal entek kesgitlenmedi.',
      periodClosed: 'Döwür ýapyldy; bal kesgitlendi.',
      weight: 'Agram',
      target: 'Maksat',
      noTarget: 'Maksat entek girizilmedi',
      emptyEmployee: 'Bu işgäre entek KPI meýilnamasy berilmedi.',
      errorLoadingEmployee: 'Işgäriň KPI meýilnamasy ýüklenip bilmedi.',
    },
    leaderboard: {
      title: 'Reýting tablisasy',
      period: 'Döwür',
      templateFilter: 'Şablon boýunça süzgüç',
      allTemplates: 'Hemmesi',
      loading: 'Ýüklenýär…',
      errorLoading: 'Reýting ýüklenip bilmedi.',
      empty: 'Bu döwürde entek KPI meýilnamasy ýok.',
      autoEvery: 'Ballar her {minutes} minutda özbaşdak täzelenýär',
      autoOff: 'Awtomatik täzelenme öçük',
      periodClosed: 'Döwür ýapyldy; ballar gutarnykly',
      updatedAt: 'soňky täzelenme {at}',
      notCalculated: 'Bal entek hasaplanmady',
      scoredOf: '{done}/{total} KPI bahalandyryldy',
      you: 'Siz',
      rank: '{rank}-nji orun',
      unranked: 'Orny ýok',
      colRank: 'Orun',
      colEmployee: 'Işgär',
      colTemplate: 'Şablon',
      colScore: 'Bal',
      myStanding: 'Siziň orunyňyz',
      placeShort: 'orun',
      myNotCalculated: 'Balyňyz entek hasaplanmady.',
      amongCount: '{count} adamyň arasynda',
      gapToNext: '{rank}-nji orna çykmak üçin ýene {gap} bal',
      leading: 'Siz birinji! Şeýle dowam ediň.',
      podium: 'Ilkinji üçlük',
      others: 'Beýleki orunlar',
      openKpi: '{name} KPI-laryny aç',
    },
    salary: {
      loading: 'Ýüklenýär…',
      errorLoading: 'Aýlyklar ýüklenip bilmedi.',
      empty: 'Bu işgäre entek aýlyk girizilmedi.',
      noneYet: 'Bu aý üçin güýjünde aýlyk ýok; ilkinji aýlyk has soňky aýdan başlaýar.',
      currentTitle: 'Häzirki aýlyk',
      sinceMonth: '{month} aýyndan bäri güýjünde',
      fromMonth: '{month} aýyndan başlap',
      inForce: 'Häzir güýjünde',
      history: 'Aýlyk taryhy',
      fixedPart: 'Hemişelik %{percent}',
      kpiPart: 'KPI %{percent}',
      splitLabel: 'Hemişelik %{fixed}, KPI %{kpi}',
      add: 'Aýlyk goş',
      addTitle: 'Aýlyk goş',
      editTitle: 'Aýlygy düzet',
      editFor: 'Aýlygy düzet: {range}',
      deleteFor: 'Aýlygy poz: {range}',
      deleteConfirm:
        '{month} aýyndan başlap güýjündäki aýlyk pozulsynmy? Şol aýdan soň öňki aýlyk güýje girer.',
      deleteError: 'Aýlyk pozulyp bilmedi.',
      delete: 'Poz',
      effectiveMonth: 'Güýje girýän aýy',
      effectiveHint: 'Şu aýdan başlap, täze aýlyk girizilýänçä güýjünde bolýar.',
      amount: 'Aýlyk',
      amountPlaceholder: 'Mysal üçin 12000',
      currency: 'Pul birligi',
      fixedPercent: 'Hemişelik (%)',
      kpiPercent: 'KPI (%)',
      preview: 'Hemişelik {fixed} + KPI {kpi}',
      save: 'Ýatda sakla',
      saving: 'Ýatda saklanýar…',
      saveError: 'Aýlyk ýatda saklanyp bilmedi.',
      errorMonthExists: 'Bu işgäriň bu aý üçin eýýäm aýlygy bar.',
      errorPercentTotal: 'Hemişelik we KPI göterimleriniň jemi 100 bolmaly.',
    },
    kpiSalary: {
      title: 'Aýlyk',
      since: '{month} aýyndan bäri güýjündäki aýlyk',
      show: 'Görkez',
      hide: 'Gizle · {seconds}',
      hidden: 'Gizlin mukdar; görmek üçin basyň',
      payable: 'Bu döwür üçin alynjak',
      fixedOnly: 'Hemişelik bölek (KPI entek hasaplanmady)',
      barLabel: 'Hemişelik %{fixed}, KPI %{kpi}, bal {score}',
      fixedPart: 'Hemişelik %{percent}',
      kpiPart: 'KPI %{percent}',
      byScore: '{score} bal boýunça',
      fullSalary: 'Doly aýlyk',
      interim: 'Döwür açyk: bal üýtgedigiçe mukdar hem üýtgeýär.',
      final: 'Döwür ýapyldy; mukdar gutarnykly.',
      notCalculated: 'KPI bölegi bal hasaplanandan soň goşular.',
      itemValue: 'Aýlykdaky gymmaty',
      itemEarned: 'Gazanylan',
      noSalary:
        'Bu işgäriň bu aý üçin güýjündäki aýlygy ýok; aýlyk işgäriň Aýlyk bölüminden girizilýär.',
      kpiEarnedShort: 'KPI-dan gazanylan',
      planListHint: 'Aýlyk mukdarlary gizlin; görmek üçin basyň.',
    },
    kpiProgress: {
      totalScore: 'Jemi bal',
      outOf: '/ {max}',
      notCalculated: 'Bal entek hasaplanmady.',
      calculatedAt: 'Soňky hasaplama: {at}',
      incomplete: '{done}/{total} KPI bahalandy; galanlarynyň maksady ýa-da hakykaty ýok.',
      achievement: 'Ýerine ýetiriş',
      percent: '{value}%',
      reached: 'Maksada ýetildi',
      actualOfTarget: 'Hakyky {actual} / maksat {target}',
      actualOnly: 'Hakyky {actual}',
      contribution: 'Goşandy {score} / {weight}',
      noTarget: 'Maksat girizilmedi, şonuň üçin bahalanmady.',
      noActual: 'Hakyky baha girizilmedi, şonuň üçin bahalanmady.',
      meterLabel: '{name}: ýerine ýetiriş',
      scoreMeterLabel: '{name}: jemi bal',
    },
    visitorCounts: {
      title: 'Gelýänleriň sany',
      store: 'Dükan',
      date: 'Gün',
      count: 'Giren adam sany',
      countPlaceholder: 'Mysal üçin, 184',
      save: 'Sakla',
      update: 'Täzele',
      saving: 'Saklanýar…',
      saved: '{store} · {date}: {count} adam saklandy.',
      replaceHint: 'Şol bir dükan we gün gaýtadan girizilse, san täzelenýär.',
      existing: 'Bu gün üçin saklanan san: {count}. Saklasaňyz üýtgär.',
      loading: 'Ýüklenýär…',
      errorLoading: 'Girizmeler ýüklenmedi.',
      empty: 'Entek girizme ýok.',
      people: 'adam',
      edit: 'Üýtget',
      editFor: '{store} · {date} girizmesini üýtget',
      deleteFor: '{store} · {date} girizmesini poz',
      deleteConfirm: '{store} dükanynyň {date} günki sany pozulsynmy?',
      deleted: 'Girizme pozuldy.',
      errorUnknownStore: 'Saýlanan dükan Tiger-da tapylmady.',
      errorFutureDate: 'Geljekdäki gün üçin san girizip bolmaýar.',
      errorClosed: 'Bu gün ýapyk KPI döwrüne degişli; sany üýtgedip bolmaýar.',
      saveError: 'San saklanmady.',
      columnDate: 'Gün',
      columnStore: 'Dükan',
      columnCount: 'Adam',
      columnActions: 'Amal',
      add: 'San goş',
      addTitle: 'Gelen adam sanyny goş',
      editTitle: 'Gelen adam sanyny düzet',
      filters: 'Süzgüçler',
      filterDates: 'Sene aralygy',
      filterFrom: 'Başlangyç güni',
      filterTo: 'Soňky gün',
      rangeInvalid: 'Başlangyç güni soňky günden soň bolup bilmez.',
      rangeFrom: '{date} we soňra',
      rangeTo: '{date} çenli',
      removeFilter: '{filter} süzgüjini aýyr',
      resultCount: '{count} ýazgy',
      emptyFiltered: 'Bu süzgüçlere laýyk ýazgy ýok.',
    },
    errors: {
      generic: 'Garaşylmadyk ýalňyşlyk ýüze çykdy. Gaýtadan synanyşyň.',
      network: 'Serwere birikmek başartmady. Internet baglanyşygyňyzy barlaň.',
      validation: 'Girizen maglumatlaryňyzy barlaň.',
      unauthorized: 'Sessiýaňyz tamamlandy. Gaýtadan giriň.',
      forbidden: 'Bu amaly ýerine ýetirmäge hukugyňyz ýok.',
      notFound: 'Talap edilen ýazgy tapylmady.',
      conflict: 'Bu maglumatlar başga bir ýazgy bilen gabat gelýär.',
      payloadTooLarge: 'Saýlanan faýl rugsat berlen ölçegden uly.',
      tooManyRequests: 'Gaty köp synanyşyk edildi. Biraz garaşyň.',
      server: 'Serwerde ýalňyşlyk ýüze çykdy. Soňrak gaýtadan synanyşyň.',
    },
  },
};
