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
    apply: string;
    clear: string;
    home: string;
    comingSoon: string;
    comingSoonHint: string;
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
    button: string;
    buttonFor: string;
    title: string;
    createdBy: string;
    updatedBy: string;
    lastChange: string;
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
        isActive: string;
        passwordHash: string;
      };
      kpi_templates: {
        name: string;
        description: string;
        isActive: string;
        items: string;
      };
    };
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
      apply: 'Uygula',
      clear: 'Temizle',
      home: 'Ana sayfa',
      comingSoon: 'Yakında',
      comingSoonHint: 'Bu ekran üzerinde çalışıyoruz, yakında kullanıma açılacak.',
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
      button: 'Kayıt bilgisi',
      buttonFor: '{name} kayıt bilgisi',
      title: 'Kayıt bilgisi',
      createdBy: 'Oluşturan',
      updatedBy: 'Son değiştiren',
      lastChange: 'Son değişiklik: {name} · {date}',
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
          isActive: 'Durum',
          passwordHash: 'Parola',
        },
        kpi_templates: {
          name: 'Şablon adı',
          description: 'Açıklama',
          isActive: 'Durum',
          items: 'KPI’lar',
        },
      },
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
      apply: 'Apply',
      clear: 'Clear',
      home: 'Home',
      comingSoon: 'Coming soon',
      comingSoonHint: 'We are still building this screen; it will be available soon.',
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
      button: 'Record info',
      buttonFor: 'Record info for {name}',
      title: 'Record info',
      createdBy: 'Created by',
      updatedBy: 'Last changed by',
      lastChange: 'Last change: {name} · {date}',
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
          isActive: 'Status',
          passwordHash: 'Password',
        },
        kpi_templates: {
          name: 'Template name',
          description: 'Description',
          isActive: 'Status',
          items: 'KPIs',
        },
      },
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
      apply: 'Применить',
      clear: 'Сбросить',
      home: 'Главная',
      comingSoon: 'Скоро',
      comingSoonHint: 'Мы ещё работаем над этим разделом, он появится в ближайшее время.',
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
      button: 'Сведения о записи',
      buttonFor: 'Сведения о записи: {name}',
      title: 'Сведения о записи',
      createdBy: 'Создал(а)',
      updatedBy: 'Последним изменил(а)',
      lastChange: 'Последнее изменение: {name} · {date}',
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
          isActive: 'Статус',
          passwordHash: 'Пароль',
        },
        kpi_templates: {
          name: 'Название шаблона',
          description: 'Описание',
          isActive: 'Статус',
          items: 'KPI',
        },
      },
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
      apply: 'Ulan',
      clear: 'Arassala',
      home: 'Baş sahypa',
      comingSoon: 'Ýakynda',
      comingSoonHint: 'Bu ekran häzir taýýarlanýar, ýakynda elýeterli bolar.',
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
      button: 'Ýazgy maglumaty',
      buttonFor: '{name} ýazgy maglumaty',
      title: 'Ýazgy maglumaty',
      createdBy: 'Döreden',
      updatedBy: 'Soňky üýtgeden',
      lastChange: 'Soňky üýtgeşme: {name} · {date}',
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
          isActive: 'Ýagdaýy',
          passwordHash: 'Parol',
        },
        kpi_templates: {
          name: 'Şablonyň ady',
          description: 'Düşündiriş',
          isActive: 'Ýagdaýy',
          items: 'KPI-lar',
        },
      },
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
