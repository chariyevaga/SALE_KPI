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
