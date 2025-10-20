/**
 * Language Selection Functionality
 * Provides multi-language support for the Partner Report
 */

(function() {
  'use strict';
  
  // Available languages
  const languages = {
    'en': {
      name: 'English',
      flag: '🇺🇸',
      translations: {
        'home': 'Home',
        'clients': 'Clients',
        'commissions': 'Commissions',
        'client-lifecycle': 'Client Lifecycle',
        'master-partner': 'Master Partner',
        'events': 'Events',
        'tiers-badges': 'Tiers & Badges',
        'client-funnel': 'Client Funnel',
        'country-analysis': 'Country Analysis',
        'partner-links': 'Partner Links',
        'sitemap': 'Sitemap',
        'database': 'Database',
        'loading': 'Loading...',
        'no-data': 'No data available',
        'error': 'Error loading data',
        'select-partner': 'Select a partner',
        'all-partners': 'All partners',
        'all-countries': 'All countries',
        'all-time': 'All time',
        'filters': 'Filters',
        'time-period': 'Time Period',
        'country': 'Country',
        'tracking-link': 'Tracking Link',
        'client-list': 'Client List',
        'partner-performance-scorecard': 'Partner Performance Scorecard',
        'top-3-recommendations': 'Top 3 Recommendations',
        'quick-insights': 'Quick Insights',
        'lifetime': 'Lifetime',
        'commissions': 'Commissions',
        'volume-traded': 'Volume Traded',
        'deposits': 'Deposits',
        'clients': 'Clients',
        'month-to-date': 'Month to Date',
        'total-revenue': 'Total Revenue',
        'active-clients': 'Active Clients',
        'total-trades': 'Total Trades',
        'avg-trade-size': 'Avg. Trade Size'
      }
    },
    'es': {
      name: 'Español',
      flag: '🇪🇸',
      translations: {
        'home': 'Inicio',
        'clients': 'Clientes',
        'commissions': 'Comisiones',
        'client-lifecycle': 'Ciclo de Vida del Cliente',
        'master-partner': 'Socio Maestro',
        'events': 'Eventos',
        'tiers-badges': 'Niveles y Insignias',
        'client-funnel': 'Embudo de Clientes',
        'country-analysis': 'Análisis por País',
        'partner-links': 'Enlaces del Socio',
        'sitemap': 'Mapa del Sitio',
        'database': 'Base de Datos',
        'loading': 'Cargando...',
        'no-data': 'No hay datos disponibles',
        'error': 'Error al cargar datos',
        'select-partner': 'Seleccionar un socio',
        'all-partners': 'Todos los socios',
        'all-countries': 'Todos los países',
        'all-time': 'Todo el tiempo',
        'filters': 'Filtros',
        'time-period': 'Período de Tiempo',
        'country': 'País',
        'tracking-link': 'Enlace de Seguimiento',
        'client-list': 'Lista de Clientes',
        'partner-performance-scorecard': 'Cuadro de Mando del Socio',
        'top-3-recommendations': 'Top 3 Recomendaciones',
        'quick-insights': 'Insights Rápidos',
        'lifetime': 'De por Vida',
        'commissions': 'Comisiones',
        'volume-traded': 'Volumen Negociado',
        'deposits': 'Depósitos',
        'clients': 'Clientes',
        'month-to-date': 'Mes a la Fecha',
        'total-revenue': 'Ingresos Totales',
        'active-clients': 'Clientes Activos',
        'total-trades': 'Operaciones Totales',
        'avg-trade-size': 'Tamaño Promedio de Operación'
      }
    },
    'fr': {
      name: 'Français',
      flag: '🇫🇷',
      translations: {
        'home': 'Accueil',
        'clients': 'Clients',
        'commissions': 'Commissions',
        'client-lifecycle': 'Cycle de Vie du Client',
        'master-partner': 'Partenaire Principal',
        'events': 'Événements',
        'tiers-badges': 'Niveaux et Badges',
        'client-funnel': 'Entonnoir Client',
        'country-analysis': 'Analyse par Pays',
        'partner-links': 'Liens du Partenaire',
        'sitemap': 'Plan du Site',
        'database': 'Base de Données',
        'loading': 'Chargement...',
        'no-data': 'Aucune donnée disponible',
        'error': 'Erreur lors du chargement',
        'select-partner': 'Sélectionner un partenaire',
        'all-partners': 'Tous les partenaires',
        'all-countries': 'Tous les pays',
        'all-time': 'Tout le temps',
        'filters': 'Filtres',
        'time-period': 'Période',
        'country': 'Pays',
        'tracking-link': 'Lien de Suivi',
        'client-list': 'Liste des Clients',
        'partner-performance-scorecard': 'Tableau de Bord du Partenaire',
        'top-3-recommendations': 'Top 3 Recommandations',
        'quick-insights': 'Insights Rapides',
        'lifetime': 'À Vie',
        'commissions': 'Commissions',
        'volume-traded': 'Volume Négocié',
        'deposits': 'Dépôts',
        'clients': 'Clients',
        'month-to-date': 'Mois en Cours',
        'total-revenue': 'Revenus Totaux',
        'active-clients': 'Clients Actifs',
        'total-trades': 'Opérations Totales',
        'avg-trade-size': 'Taille Moyenne des Opérations'
      }
    },
    'de': {
      name: 'Deutsch',
      flag: '🇩🇪',
      translations: {
        'home': 'Startseite',
        'clients': 'Kunden',
        'commissions': 'Provisionen',
        'client-lifecycle': 'Kundenlebenszyklus',
        'master-partner': 'Master-Partner',
        'events': 'Ereignisse',
        'tiers-badges': 'Stufen und Abzeichen',
        'client-funnel': 'Kunden-Trichter',
        'country-analysis': 'Länderanalyse',
        'partner-links': 'Partner-Links',
        'sitemap': 'Sitemap',
        'database': 'Datenbank',
        'loading': 'Laden...',
        'no-data': 'Keine Daten verfügbar',
        'error': 'Fehler beim Laden',
        'select-partner': 'Partner auswählen',
        'all-partners': 'Alle Partner',
        'all-countries': 'Alle Länder',
        'all-time': 'Alle Zeiten',
        'filters': 'Filter',
        'time-period': 'Zeitraum',
        'country': 'Land',
        'tracking-link': 'Tracking-Link',
        'client-list': 'Kundenliste',
        'partner-performance-scorecard': 'Partner-Leistungsdashboard',
        'top-3-recommendations': 'Top 3 Empfehlungen',
        'quick-insights': 'Schnelle Einblicke',
        'lifetime': 'Lebenszeit',
        'commissions': 'Provisionen',
        'volume-traded': 'Gehandeltes Volumen',
        'deposits': 'Einzahlungen',
        'clients': 'Kunden',
        'month-to-date': 'Monat bis Datum',
        'total-revenue': 'Gesamteinnahmen',
        'active-clients': 'Aktive Kunden',
        'total-trades': 'Gesamte Trades',
        'avg-trade-size': 'Durchschnittliche Trade-Größe'
      }
    },
    'ar': {
      name: 'العربية',
      flag: '🇸🇦',
      translations: {
        'home': 'الرئيسية',
        'clients': 'العملاء',
        'commissions': 'العمولات',
        'client-lifecycle': 'دورة حياة العميل',
        'master-partner': 'الشريك الرئيسي',
        'events': 'الأحداث',
        'tiers-badges': 'المستويات والشارات',
        'client-funnel': 'قمع العملاء',
        'country-analysis': 'تحليل البلدان',
        'partner-links': 'روابط الشريك',
        'sitemap': 'خريطة الموقع',
        'database': 'قاعدة البيانات',
        'loading': 'جاري التحميل...',
        'no-data': 'لا توجد بيانات متاحة',
        'error': 'خطأ في تحميل البيانات',
        'select-partner': 'اختر شريك',
        'all-partners': 'جميع الشركاء',
        'all-countries': 'جميع البلدان',
        'all-time': 'كل الأوقات',
        'filters': 'المرشحات',
        'time-period': 'الفترة الزمنية',
        'country': 'البلد',
        'tracking-link': 'رابط التتبع',
        'client-list': 'قائمة العملاء',
        'partner-performance-scorecard': 'لوحة أداء الشريك',
        'top-3-recommendations': 'أفضل 3 توصيات',
        'quick-insights': 'رؤى سريعة',
        'lifetime': 'مدى الحياة',
        'commissions': 'العمولات',
        'volume-traded': 'حجم التداول',
        'deposits': 'الودائع',
        'clients': 'العملاء',
        'month-to-date': 'الشهر حتى الآن',
        'total-revenue': 'إجمالي الإيرادات',
        'active-clients': 'العملاء النشطون',
        'total-trades': 'إجمالي الصفقات',
        'avg-trade-size': 'متوسط حجم الصفقة'
      }
    }
  };
  
  // Current language
  let currentLanguage = localStorage.getItem('selectedLanguage') || 'en';
  
  // Language Manager
  window.LanguageManager = {
    
    // Get current language
    getCurrentLanguage: function() {
      return currentLanguage;
    },
    
    // Set language
    setLanguage: function(langCode) {
      if (languages[langCode]) {
        currentLanguage = langCode;
        localStorage.setItem('selectedLanguage', langCode);
        this.translatePage();
        this.updateLanguageDropdown();
      }
    },
    
    // Get translation
    translate: function(key) {
      const lang = languages[currentLanguage];
      return lang && lang.translations[key] ? lang.translations[key] : key;
    },
    
    // Translate page elements
    translatePage: function() {
      // Translate navigation labels
      document.querySelectorAll('.side-nav .label').forEach(element => {
        const href = element.closest('a').getAttribute('href');
        if (href) {
          const pageKey = href.replace('.html', '').replace('index', 'home');
          element.textContent = this.translate(pageKey);
        }
      });
      
      // Translate page titles
      const pageTitle = document.querySelector('.page-title');
      if (pageTitle) {
        const titleKey = this.getPageKey();
        pageTitle.textContent = this.translate(titleKey);
      }
      
      // Translate common elements
      document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        element.textContent = this.translate(key);
      });
      
      // Translate select options
      document.querySelectorAll('select option[data-translate]').forEach(option => {
        const key = option.getAttribute('data-translate');
        option.textContent = this.translate(key);
      });
      
      // Update document title
      const pageKey = this.getPageKey();
      document.title = this.translate(pageKey) + ' • Partner Report';
    },
    
    // Get page key for translation
    getPageKey: function() {
      const path = window.location.pathname;
      const filename = path.split('/').pop().replace('.html', '');
      return filename === '' || filename === 'index' ? 'home' : filename;
    },
    
    // Create language dropdown
    createLanguageDropdown: function() {
      const container = document.querySelector('.theme-toggle-container');
      if (!container) return;
      
      const dropdown = document.createElement('div');
      dropdown.className = 'language-dropdown';
      dropdown.style.cssText = `
        position: relative;
        display: inline-block;
        margin-left: 8px;
      `;
      
      const button = document.createElement('button');
      button.className = 'language-btn';
      button.style.cssText = `
        background: var(--panel);
        color: var(--text);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 8px 12px;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s ease;
      `;
      
      const currentLang = languages[currentLanguage];
      button.innerHTML = `${currentLang.flag} ${currentLang.name}`;
      
      const dropdownMenu = document.createElement('div');
      dropdownMenu.className = 'language-dropdown-menu';
      dropdownMenu.style.cssText = `
        position: absolute;
        top: 100%;
        right: 0;
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        min-width: 150px;
        display: none;
        margin-top: 4px;
      `;
      
      // Add language options
      Object.keys(languages).forEach(langCode => {
        const lang = languages[langCode];
        const option = document.createElement('div');
        option.className = 'language-option';
        option.style.cssText = `
          padding: 8px 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.2s ease;
        `;
        option.innerHTML = `${lang.flag} ${lang.name}`;
        
        if (langCode === currentLanguage) {
          option.style.background = 'var(--accent)';
          option.style.color = 'white';
        }
        
        option.addEventListener('click', () => {
          this.setLanguage(langCode);
          dropdownMenu.style.display = 'none';
        });
        
        option.addEventListener('mouseenter', () => {
          if (langCode !== currentLanguage) {
            option.style.background = 'var(--border-light)';
          }
        });
        
        option.addEventListener('mouseleave', () => {
          if (langCode !== currentLanguage) {
            option.style.background = 'transparent';
          }
        });
        
        dropdownMenu.appendChild(option);
      });
      
      // Toggle dropdown
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', () => {
        dropdownMenu.style.display = 'none';
      });
      
      dropdown.appendChild(button);
      dropdown.appendChild(dropdownMenu);
      container.appendChild(dropdown);
      
      return dropdown;
    },
    
    // Update language dropdown
    updateLanguageDropdown: function() {
      const button = document.querySelector('.language-btn');
      if (button) {
        const currentLang = languages[currentLanguage];
        button.innerHTML = `${currentLang.flag} ${currentLang.name}`;
      }
    },
    
    // Initialize language system
    init: function() {
      this.createLanguageDropdown();
      this.translatePage();
    }
  };
  
  // Initialize when DOM is ready
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        window.LanguageManager.init();
      });
    } else {
      window.LanguageManager.init();
    }
  }
  
  // Start initialization
  init();
  
})();
