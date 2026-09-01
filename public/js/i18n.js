/**
 * Transitly — Internationalization (i18n) & Persistent Credential Cache Engine
 * Supports seamless multi-language translation (English, Hindi, Punjabi) across all 8 web pages.
 * Remembers language selection and user credentials via Cookies (1-year persistent) and LocalStorage cache.
 */

(function () {
  'use strict';

  // -------------------------------------------------------------
  // 1. Supported Languages
  // -------------------------------------------------------------
  const LANGUAGES = {
    en: {
      code: 'en',
      name: 'English (IN)',
      label: 'English (India)',
      flag: '🇮🇳'
    },
    hi: {
      code: 'hi',
      name: 'Hindi (हिंदी)',
      label: 'हिन्दी (Hindi)',
      flag: '🇮🇳'
    },
    pa: {
      code: 'pa',
      name: 'Punjabi (ਪੰਜਾਬੀ)',
      label: 'ਪੰਜਾਬੀ (Punjabi)',
      flag: '🇮🇳'
    }
  };

  // -------------------------------------------------------------
  // 2. Full Multi-Language Dictionaries
  // -------------------------------------------------------------
  const TRANSLATIONS = {
    // English (Default)
    en: {
      // Top Navigation & Bottom Nav
      'app_title': 'Transitly',
      'nav_deliver': 'Deliver',
      'nav_tracking': 'Tracking',
      'nav_history': 'History',
      'nav_profile': 'Profile',

      // Settings Page
      'settings_heading': 'Settings',
      'settings_subtitle': 'Manage your preferences and account settings.',
      'settings_notif_section': 'Notifications & Alerts',
      'settings_push': 'Push Notifications',
      'settings_push_sub': 'Live bus dispatch & arrival pings',
      'settings_sms': 'WhatsApp & SMS Alerts',
      'settings_sms_sub': 'OTP delivery codes & tracking links',
      'settings_device_section': 'Device & Security',
      'settings_gps': 'Continuous GPS Location',
      'settings_gps_sub': 'Used for real-time corridor matching',
      'settings_biometrics': 'Biometric App Lock',
      'settings_biometrics_sub': 'FaceID / TouchID for wallet payments',
      'settings_lang': 'App Language',
      'settings_help': 'Help & Support',
      'settings_signout': 'Sign Out',
      'settings_modal_select_lang': 'Select Language',
      'settings_version': 'Transitly v2.4.1 • Multi-Modal Transit Engine',

      // Deliver / Home Page
      'deliver_hero_title': 'Send Parcel Anywhere',
      'deliver_hero_subtitle': 'Bus-to-Door Logistics',
      'deliver_book_now': 'Book Now',
      'deliver_search_placeholder': 'From: Mohali, Punjab ➔ Where to send?',
      'deliver_how_it_works': 'HOW IT WORKS',
      'deliver_public_bus': 'Public Bus Transport',
      'deliver_doorstep': 'Door-to-Door Partners',
      'deliver_services_heading': 'Fast Intercity Delivery',
      'deliver_use_gps': 'Use Live GPS Location',
      'deliver_allow_gps': 'Allow GPS',
      'deliver_tap_for_rates': 'Tap allow for automatic bus hub rates',
      'deliver_modal_title': 'Book Intercity Parcel',
      'deliver_corridor': 'Select Intercity Corridor',
      'deliver_weight': 'Package Weight (kg)',
      'deliver_pickup_address': 'Pickup Hub / Doorstep Address',
      'deliver_receiver_name': 'Receiver Full Name',
      'deliver_receiver_phone': 'Receiver Phone Number',
      'deliver_drop_address': 'Destination Doorstep Address',
      'deliver_confirm_pay': 'Confirm & Pay',
      'deliver_check_fare': 'Evaluate Feasibility & Rates',
      'deliver_est_fare': 'Estimated Total Fare:',
      'deliver_success_title': 'Booking Confirmed!',

      // Live Tracking Page
      'tracking_page_title': 'Live Intercity Bus Tracking',
      'tracking_gps_live': 'GPS LIVE JOURNEY',
      'tracking_speed': 'Speed',
      'tracking_est_arrival': 'EST. ARRIVAL',
      'tracking_journey_controls': 'Journey Controls:',
      'tracking_btn_start': 'Start',
      'tracking_btn_restart': 'Restart',
      'tracking_btn_end': 'End',
      'tracking_distance_left': 'Distance Left',
      'tracking_next_hub': 'Next Handoff Hub',
      'tracking_dest_bay': 'Destination Bus Bay ➔ Doorstep Agent',
      'tracking_demo_chips': 'Live Demos:',
      'tracking_search_placeholder': 'Search Tracking ID (e.g. TRK-88219)...',
      'tracking_start_live': 'Start Live',
      'tracking_step_picked': 'Package Picked Up (Doorstep)',
      'tracking_step_loaded': 'Loaded in Bus Cargo Bay',
      'tracking_step_transit': 'In Transit — Fleet Bus',
      'tracking_step_handoff': 'Regional Intercity Terminal Handoff',
      'tracking_step_delivered': 'Out for Delivery / Delivered',

      // History Page
      'history_heading': 'Delivery History',
      'history_subtitle': 'Track past & active consignments',
      'history_search_placeholder': 'Search tracking ID, city or date...',
      'history_tab_all': 'All',
      'history_tab_delivered': 'Delivered',
      'history_tab_intransit': 'In Transit',
      'history_tab_cancelled': 'Cancelled',
      'history_btn_track_live': 'Track Live',
      'history_btn_invoice': 'Invoice',
      'history_btn_rebook': 'Rebook',

      // Profile Page
      'profile_heading': 'Profile',
      'profile_edit_btn': 'Edit Profile',
      'profile_upload_device': 'Upload from Device',
      'profile_parcels_count': 'parcels',
      'profile_saved_addresses': 'Saved Addresses',
      'profile_payment_methods': 'Payment Methods',
      'profile_help_support': 'Help & Support (Anmol)',
      'profile_settings': 'Settings',
      'profile_logout': 'Log Out',
      'profile_modal_title': 'Edit Profile',
      'profile_modal_browse': 'Browse',
      'profile_modal_cancel': 'Cancel',
      'profile_modal_save': 'Save Changes',

      // Saved Addresses Page
      'addr_heading': 'Saved Addresses',
      'addr_subtitle': 'Manage your default pickup and delivery hubs.',
      'addr_btn_add': 'Add New Address',
      'addr_badge_default': 'Default Pickup',
      'addr_modal_title': 'Add New Address',
      'addr_modal_save': 'Save Address',

      // Payment Methods Page
      'pay_heading': 'Payment Methods',
      'pay_subtitle': 'Manage credit cards, UPI and billing.',
      'pay_btn_add': 'Add Payment Method',
      'pay_badge_default': 'Default',
      'pay_btn_set_default': 'Set Default',
      'pay_modal_title': 'Add Payment Method',
      'pay_modal_save': 'Save Payment Method',

      // Help & Support Page
      'help_heading': 'Help & Support',
      'help_subtitle': 'Get instant assistance from Anmol & operations team.',
      'help_chat_btn': 'Chat on WhatsApp (Anmol)',
      'help_call_btn': 'Call Support (+91 7988342544)',
      'help_ticket_btn': 'Submit Support Ticket',
      'help_faq_title': 'Frequently Asked Questions',
      'help_search_placeholder': 'Search questions or topics...',
      'help_modal_title': 'Submit Support Ticket',
      'help_modal_submit': 'Submit Ticket',

      'common_lang_changed': 'Language switched to English'
    },

    // Hindi (हिन्दी)
    hi: {
      // Top Navigation & Bottom Nav
      'app_title': 'Transitly',
      'nav_deliver': 'पार्सल भेजें',
      'nav_tracking': 'लाइव ट्रैकिंग',
      'nav_history': 'इतिहास',
      'nav_profile': 'प्रोफ़ाइल',

      // Settings Page
      'settings_heading': 'सेटिंग्स',
      'settings_subtitle': 'अपनी प्राथमिकताएं और खाता सेटिंग्स प्रबंधित करें।',
      'settings_notif_section': 'सूचनाएं और अलर्ट',
      'settings_push': 'पुश सूचनाएं',
      'settings_push_sub': 'लाइव बस प्रस्थान व आगमन सूचना',
      'settings_sms': 'व्हाट्सएप और एसएमएस अलर्ट',
      'settings_sms_sub': 'ओटीपी डिलीवरी कोड और ट्रैकिंग लिंक',
      'settings_device_section': 'डिवाइस और सुरक्षा',
      'settings_gps': 'निरंतर जीपीएस लोकेशन',
      'settings_gps_sub': 'रीयल-टाइम बस कॉरिडोर मिलान के लिए',
      'settings_biometrics': 'बायोमेट्रिक ऐप लॉक',
      'settings_biometrics_sub': 'सुरक्षित भुगतान के लिए फेस/टच आईडी',
      'settings_lang': 'ऐप की भाषा',
      'settings_help': 'सहायता और सपोर्ट',
      'settings_signout': 'साइन आउट',
      'settings_modal_select_lang': 'भाषा चुनें',
      'settings_version': 'Transitly v2.4.1 • मल्टी-मोडल ट्रांजिट इंजन',

      // Deliver / Home Page
      'deliver_hero_title': 'कहीं भी पार्सल भेजें',
      'deliver_hero_subtitle': 'बस-टू-डोर इंटरसिटी लॉजिस्टिक्स',
      'deliver_book_now': 'अभी बुक करें',
      'deliver_search_placeholder': 'कहाँ से: मोहाली, पंजाब ➔ कहाँ भेजना है?',
      'deliver_how_it_works': 'यह कैसे काम करता है',
      'deliver_public_bus': 'सरकारी व इंटरसिटी बस नेटवर्क',
      'deliver_doorstep': 'डोरस्टेप डिलीवरी पार्टनर',
      'deliver_services_heading': 'तेज़ इंटरसिटी पार्सल सेवा',
      'deliver_use_gps': 'लाइव जीपीएस लोकेशन का उपयोग करें',
      'deliver_allow_gps': 'अनुमति दें',
      'deliver_tap_for_rates': 'ऑटोमैटिक बस स्टैंड दरों के लिए अनुमति दें',
      'deliver_modal_title': 'इंटरसिटी पार्सल बुक करें',
      'deliver_corridor': 'पारगमन मार्ग (कॉरिडोर) चुनें',
      'deliver_weight': 'पैकेज का वज़न (किलो)',
      'deliver_pickup_address': 'पिकअप हब / घर का पता',
      'deliver_receiver_name': 'प्राप्तकर्ता का नाम',
      'deliver_receiver_phone': 'प्राप्तकर्ता का फ़ोन नंबर',
      'deliver_drop_address': 'गंतव्य पता (घर/दफ्तर)',
      'deliver_confirm_pay': 'पुष्टि करें और भुगतान करें',
      'deliver_check_fare': 'किराया व मार्ग जांचें',
      'deliver_est_fare': 'अनुमानित कुल किराया:',
      'deliver_success_title': 'बुकिंग सफलतापूर्वक संपन्न!',

      // Live Tracking Page
      'tracking_page_title': 'लाइव इंटरसिटी बस ट्रैकिंग',
      'tracking_gps_live': 'लाइव जीपीएस यात्रा',
      'tracking_speed': 'गति',
      'tracking_est_arrival': 'अनुमानित आगमन',
      'tracking_journey_controls': 'यात्रा नियंत्रण:',
      'tracking_btn_start': 'शुरू करें',
      'tracking_btn_restart': 'पुनः प्रारंभ',
      'tracking_btn_end': 'समाप्त करें',
      'tracking_distance_left': 'शेष दूरी',
      'tracking_next_hub': 'अगला हैंडऑफ़ बस स्टैंड',
      'tracking_dest_bay': 'गंतव्य बस बे ➔ डोरस्टेप डिलीवरी एजेंट',
      'tracking_demo_chips': 'लाइव डेमो:',
      'tracking_search_placeholder': 'ट्रैकिंग आईडी खोजें (उदा. TRK-88219)...',
      'tracking_start_live': 'लाइव देखें',
      'tracking_step_picked': 'पैकेज पिकअप हो गया (घर से)',
      'tracking_step_loaded': 'बस कार्गो बे में लोड हुआ',
      'tracking_step_transit': 'मार्ग में गतिशील — फ्लीट बस',
      'tracking_step_handoff': 'क्षेत्रीय इंटरसिटी टर्मिनल हैंडऑफ़',
      'tracking_step_delivered': 'डिलीवरी के लिए रवाना / डिलीवर',

      // History Page
      'history_heading': 'डिलीवरी इतिहास',
      'history_subtitle': 'पिछले और सक्रिय पार्सल देखें',
      'history_search_placeholder': 'ट्रैकिंग आईडी, शहर या तारीख खोजें...',
      'history_tab_all': 'सभी',
      'history_tab_delivered': 'डिलीवर हो चुके',
      'history_tab_intransit': 'रास्ते में (इन-ट्रांजिट)',
      'history_tab_cancelled': 'रद्द किए गए',
      'history_btn_track_live': 'लाइव ट्रैक करें',
      'history_btn_invoice': 'चालान / रसीद',
      'history_btn_rebook': 'पुनः बुक करें',

      // Profile Page
      'profile_heading': 'प्रोफ़ाइल',
      'profile_edit_btn': 'प्रोफ़ाइल संपादित करें',
      'profile_upload_device': 'डिवाइस से फोटो लगाएं',
      'profile_parcels_count': 'पार्सल',
      'profile_saved_addresses': 'सहेजे गए पते',
      'profile_payment_methods': 'भुगतान के तरीके',
      'profile_help_support': 'सहायता और सपोर्ट (अनमोल)',
      'profile_settings': 'सेटिंग्स',
      'profile_logout': 'लॉग आउट',
      'profile_modal_title': 'प्रोफ़ाइल संपादित करें',
      'profile_modal_browse': 'डिवाइस से चुनें',
      'profile_modal_cancel': 'रद्द करें',
      'profile_modal_save': 'बदलाव सहेजें',

      // Saved Addresses Page
      'addr_heading': 'सहेजे गए पते',
      'addr_subtitle': 'अपने डिफ़ॉल्ट पिकअप और डिलीवरी पते प्रबंधित करें।',
      'addr_btn_add': 'नया पता जोड़ें',
      'addr_badge_default': 'डिफ़ॉल्ट पिकअप',
      'addr_modal_title': 'नया पता जोड़ें',
      'addr_modal_save': 'पता सहेजें',

      // Payment Methods Page
      'pay_heading': 'भुगतान के तरीके',
      'pay_subtitle': 'क्रेडिट कार्ड, यूपीआई और बिलिंग प्रबंधित करें।',
      'pay_btn_add': 'भुगतान विधि जोड़ें',
      'pay_badge_default': 'डिफ़ॉल्ट',
      'pay_btn_set_default': 'डिफ़ॉल्ट बनाएं',
      'pay_modal_title': 'नया भुगतान तरीका जोड़ें',
      'pay_modal_save': 'भुगतान विधि सहेजें',

      // Help & Support Page
      'help_heading': 'सहायता और सपोर्ट',
      'help_subtitle': 'अनमोल और ऑपरेशंस टीम से तुरंत सहायता प्राप्त करें।',
      'help_chat_btn': 'व्हाट्सएप पर चैट करें (अनमोल)',
      'help_call_btn': 'कॉल करें (+91 7988342544)',
      'help_ticket_btn': 'सपोर्ट टिकट भेजें',
      'help_faq_title': 'अक्सर पूछे जाने वाले प्रश्न (FAQ)',
      'help_search_placeholder': 'प्रश्न या विषय खोजें...',
      'help_modal_title': 'सपोर्ट टिकट भेजें',
      'help_modal_submit': 'टिकट जमा करें',

      'common_lang_changed': 'भाषा बदलकर हिन्दी कर दी गई है'
    },

    // Punjabi (ਪੰਜਾਬੀ)
    pa: {
      // Top Navigation & Bottom Nav
      'app_title': 'Transitly',
      'nav_deliver': 'ਪਾਰਸਲ ਭੇਜੋ',
      'nav_tracking': 'ਲਾਈਵ ਟਰੈਕਿੰਗ',
      'nav_history': 'ਇਤਿਹਾਸ',
      'nav_profile': 'ਪ੍ਰੋਫਾਈਲ',

      // Settings Page
      'settings_heading': 'ਸੈਟਿੰਗਾਂ',
      'settings_subtitle': 'ਆਪਣੀਆਂ ਤਰਜੀਹਾਂ ਅਤੇ ਖਾਤਾ ਸੈਟਿੰਗਾਂ ਦਾ ਪ੍ਰਬੰਧਨ ਕਰੋ।',
      'settings_notif_section': 'ਸੂਚਨਾਵਾਂ ਅਤੇ ਅਲਰਟ',
      'settings_push': 'ਪੁਸ਼ ਸੂਚਨਾਵਾਂ',
      'settings_push_sub': 'ਲਾਈਵ ਬੱਸ ਰਵਾਨਗੀ ਅਤੇ ਪਹੁੰਚ ਸੂਚਨਾ',
      'settings_sms': 'ਵਟਸਐਪ ਅਤੇ ਐਸਐਮਐਸ ਅਲਰਟ',
      'settings_sms_sub': 'ਓਟੀਪੀ ਡਿਲੀਵਰੀ ਕੋਡ ਅਤੇ ਟਰੈਕਿੰਗ ਲਿੰਕ',
      'settings_device_section': 'ਡਿਵਾਈਸ ਅਤੇ ਸੁਰੱਖਿਆ',
      'settings_gps': 'ਨਿਰੰਤਰ ਜੀਪੀਐਸ ਲੋਕੇਸ਼ਨ',
      'settings_gps_sub': 'ਰੀਅਲ-ਟਾਈਮ ਬੱਸ ਰੂਟ ਮਿਲਾਨ ਲਈ',
      'settings_biometrics': 'ਬਾਇਓਮੈਟ੍ਰਿਕ ਐਪ ਲੌਕ',
      'settings_biometrics_sub': 'ਸੁਰੱਖਿਅਤ ਭੁਗਤਾਨ ਲਈ ਫੇਸ/ਟਚ ਆਈਡੀ',
      'settings_lang': 'ਐਪ ਦੀ ਭਾਸ਼ਾ',
      'settings_help': 'ਸਹਾਇਤਾ ਅਤੇ ਸਪੋਰਟ',
      'settings_signout': 'ਸਾਈਨ ਆਉਟ',
      'settings_modal_select_lang': 'ਭਾਸ਼ਾ ਚੁਣੋ',
      'settings_version': 'Transitly v2.4.1 • ਮਲਟੀ-ਮੋਡਲ ਟਰਾਂਜ਼ਿਟ ਇੰਜਣ',

      // Deliver / Home Page
      'deliver_hero_title': 'ਕਿਤੇ ਵੀ ਪਾਰਸਲ ਭੇਜੋ',
      'deliver_hero_subtitle': 'ਬੱਸ-ਟੂ-ਡੋਰ ਇੰਟਰਸਿਟੀ ਲੌਜਿਸਟਿਕਸ',
      'deliver_book_now': 'ਹੁਣੇ ਬੁੱਕ ਕਰੋ',
      'deliver_search_placeholder': 'ਕਿੱਥੋਂ: ਮੋਹਾਲੀ, ਪੰਜਾਬ ➔ ਕਿੱਥੇ ਭੇਜਣਾ ਹੈ?',
      'deliver_how_it_works': 'ਇਹ ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ',
      'deliver_public_bus': 'ਸਰਕਾਰੀ ਅਤੇ ਇੰਟਰਸਿਟੀ ਬੱਸ ਨੈੱਟਵਰਕ',
      'deliver_doorstep': 'ਡੋਰਸਟੈਪ ਡਿਲੀਵਰੀ ਪਾਰਟਨਰ',
      'deliver_services_heading': 'ਤੇਜ਼ ਇੰਟਰਸਿਟੀ ਪਾਰਸਲ ਸੇਵਾ',
      'deliver_use_gps': 'ਲਾਈਵ ਜੀਪੀਐਸ ਲੋਕੇਸ਼ਨ ਦੀ ਵਰਤੋਂ ਕਰੋ',
      'deliver_allow_gps': 'ਮਨਜ਼ੂਰੀ ਦਿਓ',
      'deliver_tap_for_rates': 'ਆਟੋਮੈਟਿਕ ਬੱਸ ਸਟੈਂਡ ਰੇਟਾਂ ਲਈ ਮਨਜ਼ੂਰੀ ਦਿਓ',
      'deliver_modal_title': 'ਇੰਟਰਸਿਟੀ ਪਾਰਸਲ ਬੁੱਕ ਕਰੋ',
      'deliver_corridor': 'ਟਰਾਂਜ਼ਿਟ ਰੂਟ ਚੁਣੋ',
      'deliver_weight': 'ਪੈਕੇਜ ਦਾ ਭਾਰ (ਕਿਲੋ)',
      'deliver_pickup_address': 'ਪਿਕਅੱਪ ਹੱਬ / ਘਰ ਦਾ ਪਤਾ',
      'deliver_receiver_name': 'ਪ੍ਰਾਪਤਕਰਤਾ ਦਾ ਨਾਮ',
      'deliver_receiver_phone': 'ਪ੍ਰਾਪਤਕਰਤਾ ਦਾ ਫ਼ੋਨ ਨੰਬਰ',
      'deliver_drop_address': 'ਮੰਜ਼ਿਲ ਦਾ ਪਤਾ (ਘਰ/ਦਫ਼ਤਰ)',
      'deliver_confirm_pay': 'ਪੁਸ਼ਟੀ ਕਰੋ ਅਤੇ ਭੁਗਤਾਨ ਕਰੋ',
      'deliver_check_fare': 'ਕਿਰਾਇਆ ਅਤੇ ਰੂਟ ਜਾਂਚੋ',
      'deliver_est_fare': 'ਅਨੁਮਾਨਿਤ ਕੁੱਲ ਕਿਰਾਇਆ:',
      'deliver_success_title': 'ਬੁਕਿੰਗ ਸਫਲਤਾਪੂਰਵਕ ਹੋ ਗਈ!',

      // Live Tracking Page
      'tracking_page_title': 'ਲਾਈਵ ਇੰਟਰਸਿਟੀ ਬੱਸ ਟਰੈਕਿੰਗ',
      'tracking_gps_live': 'ਲਾਈਵ ਜੀਪੀਐਸ ਯਾਤਰਾ',
      'tracking_speed': 'ਗਤੀ',
      'tracking_est_arrival': 'ਅਨੁਮਾਨਿਤ ਪਹੁੰਚ',
      'tracking_journey_controls': 'ਯਾਤਰਾ ਨਿਯੰਤਰਣ:',
      'tracking_btn_start': 'ਸ਼ੁਰੂ ਕਰੋ',
      'tracking_btn_restart': 'ਮੁੜ ਸ਼ੁਰੂ ਕਰੋ',
      'tracking_btn_end': 'ਸਮਾਪਤ ਕਰੋ',
      'tracking_distance_left': 'ਬਾਕੀ ਦੂਰੀ',
      'tracking_next_hub': 'ਅਗਲਾ ਹੈਂਡਆਫ ਬੱਸ ਅੱਡਾ',
      'tracking_dest_bay': 'ਮੰਜ਼ਿਲ ਬੱਸ ਬੇ ➔ ਡੋਰਸਟੈਪ ਡਿਲੀਵਰੀ ਏਜੰਟ',
      'tracking_demo_chips': 'ਲਾਈਵ ਡੈਮੋ:',
      'tracking_search_placeholder': 'ਟਰੈਕਿੰਗ ਆਈਡੀ ਖੋਜੋ (ਉਦਾ. TRK-88219)...',
      'tracking_start_live': 'ਲਾਈਵ ਵੇਖੋ',
      'tracking_step_picked': 'ਪੈਕੇਜ ਪਿਕਅੱਪ ਹੋ ਗਿਆ (ਘਰੋਂ)',
      'tracking_step_loaded': 'ਬੱਸ ਕਾਰਗੋ ਬੇ ਵਿੱਚ ਲੋਡ ਹੋਇਆ',
      'tracking_step_transit': 'ਰਸਤੇ ਵਿੱਚ ਗਤੀਸ਼ੀਲ — ਫਲੀਟ ਬੱਸ',
      'tracking_step_handoff': 'ਖੇਤਰੀ ਇੰਟਰਸਿਟੀ ਟਰਮੀਨਲ ਹੈਂਡਆਫ',
      'tracking_step_delivered': 'ਡਿਲੀਵਰੀ ਲਈ ਰਵਾਨਾ / ਡਿਲੀਵਰਡ',

      // History Page
      'history_heading': 'ਡਿਲੀਵਰੀ ਇਤਿਹਾਸ',
      'history_subtitle': 'ਪਿਛਲੇ ਅਤੇ ਸਰਗਰਮ ਪਾਰਸਲ ਵੇਖੋ',
      'history_search_placeholder': 'ਟਰੈਕਿੰਗ ਆਈਡੀ, ਸ਼ਹਿਰ ਜਾਂ ਮਿਤੀ ਖੋਜੋ...',
      'history_tab_all': 'ਸਾਰੇ',
      'history_tab_delivered': 'ਡਿਲੀਵਰ ਹੋ ਚੁੱਕੇ',
      'history_tab_intransit': 'ਰਸਤੇ ਵਿੱਚ (ਇਨ-ਟ੍ਰਾਂਜ਼ਿਟ)',
      'history_tab_cancelled': 'ਰੱਦ ਕੀਤੇ ਗਏ',
      'history_btn_track_live': 'ਲਾਈਵ ਟਰੈਕ ਕਰੋ',
      'history_btn_invoice': 'ਰਸੀਦ / ਬਿੱਲ',
      'history_btn_rebook': 'ਦੁਬਾਰਾ ਬੁੱਕ ਕਰੋ',

      // Profile Page
      'profile_heading': 'ਪ੍ਰੋਫਾਈਲ',
      'profile_edit_btn': 'ਪ੍ਰੋਫਾਈਲ ਸੰਪਾਦਿਤ ਕਰੋ',
      'profile_upload_device': 'ਡਿਵਾਈਸ ਤੋਂ ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ',
      'profile_parcels_count': 'ਪਾਰਸਲ',
      'profile_saved_addresses': 'ਸੁਰੱਖਿਅਤ ਕੀਤੇ ਪਤੇ',
      'profile_payment_methods': 'ਭੁਗਤਾਨ ਦੇ ਤਰੀਕੇ',
      'profile_help_support': 'ਸਹਾਇਤਾ ਅਤੇ ਸਪੋਰਟ (ਅਨਮੋਲ)',
      'profile_settings': 'ਸੈਟਿੰਗਾਂ',
      'profile_logout': 'ਲਾਗ ਆਉਟ',
      'profile_modal_title': 'ਪ੍ਰੋਫਾਈਲ ਸੰਪਾਦਿਤ ਕਰੋ',
      'profile_modal_browse': 'ਡਿਵਾਈਸ ਤੋਂ ਚੁਣੋ',
      'profile_modal_cancel': 'ਰੱਦ ਕਰੋ',
      'profile_modal_save': 'ਤਬਦੀਲੀਆਂ ਸੁਰੱਖਿਅਤ ਕਰੋ',

      // Saved Addresses Page
      'addr_heading': 'ਸੁਰੱਖਿਅਤ ਕੀਤੇ ਪਤੇ',
      'addr_subtitle': 'ਆਪਣੇ ਪਿਕਅੱਪ ਅਤੇ ਡਿਲੀਵਰੀ ਪਤੇ ਸੰਭਾਲੋ।',
      'addr_btn_add': 'ਨਵਾਂ ਪਤਾ ਸ਼ਾਮਲ ਕਰੋ',
      'addr_badge_default': 'ਮੂਲ ਪਿਕਅੱਪ',
      'addr_modal_title': 'ਨਵਾਂ ਪਤਾ ਸ਼ਾਮਲ ਕਰੋ',
      'addr_modal_save': 'ਪਤਾ ਸੁਰੱਖਿਅਤ ਕਰੋ',

      // Payment Methods Page
      'pay_heading': 'ਭੁਗਤਾਨ ਦੇ ਤਰੀਕੇ',
      'pay_subtitle': 'ਕ੍ਰੈਡਿਟ ਕਾਰਡ, ਯੂਪੀਆਈ ਅਤੇ ਬਿਲਿੰਗ ਦਾ ਪ੍ਰਬੰਧਨ ਕਰੋ।',
      'pay_btn_add': 'ਭੁਗਤਾਨ ਵਿਧੀ ਸ਼ਾਮਲ ਕਰੋ',
      'pay_badge_default': 'ਮੂਲ',
      'pay_btn_set_default': 'ਮੂਲ ਬਣਾਓ',
      'pay_modal_title': 'ਨਵਾਂ ਭੁਗਤਾਨ ਤਰੀਕਾ ਸ਼ਾਮਲ ਕਰੋ',
      'pay_modal_save': 'ਭੁਗਤਾਨ ਤਰੀਕਾ ਸੁਰੱਖਿਅਤ ਕਰੋ',

      // Help & Support Page
      'help_heading': 'ਸਹਾਇਤਾ ਅਤੇ ਸਪੋਰਟ',
      'help_subtitle': 'ਅਨਮੋਲ ਅਤੇ ਟੀਮ ਤੋਂ ਤੁਰੰਤ ਸਹਾਇਤਾ ਪ੍ਰਾਪਤ ਕਰੋ।',
      'help_chat_btn': 'ਵਟਸਐਪ \'ਤੇ ਗੱਲਬਾਤ ਕਰੋ (ਅਨਮੋਲ)',
      'help_call_btn': 'ਕਾਲ ਕਰੋ (+91 7988342544)',
      'help_ticket_btn': 'ਸਪੋਰਟ ਟਿਕਟ ਭੇਜੋ',
      'help_faq_title': 'ਅਕਸਰ ਪੁੱਛੇ ਜਾਂਦੇ ਸਵਾਲ (FAQ)',
      'help_search_placeholder': 'ਸਵਾਲ ਜਾਂ ਵਿਸ਼ਾ ਖੋਜੋ...',
      'help_modal_title': 'ਸਪੋਰਟ ਟਿਕਟ ਭੇਜੋ',
      'help_modal_submit': 'ਟਿਕਟ ਜਮ੍ਹਾਂ ਕਰੋ',

      'common_lang_changed': 'ਭਾਸ਼ਾ ਬਦਲ ਕੇ ਪੰਜਾਬੀ ਕਰ ਦਿੱਤੀ ਗਈ ਹੈ'
    }
  };

  // -------------------------------------------------------------
  // 3. Cookie & Cache Helpers
  // -------------------------------------------------------------
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
    return null;
  }

  function setCookie(name, value, days = 365) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  }

  function getCachedUser() {
    try {
      const stored = localStorage.getItem('transitly_user') || getCookie('transitly_user');
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return {
      name: 'Anmol',
      email: 'anmolrajotiy@gmail.com',
      phone: '+91 7988342544',
      avatarUrl: localStorage.getItem('transitly_user_avatar') || getCookie('transitly_user_avatar') || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBzAACyzyleKmM4JQVt8Aa-jr70QVcpj9loY9wKp5o9O4E4p6Pw4_DrVmOHt4kkJfjfzprBQFcotrP67UIXwwodZ_N8y_NQMBXmYt1FUgmWEZU3RkLHv9mtX5_jewodrd3AC22FofPIl1pDv6bTKcqN63TR8-Ce6clfaRjIaxwp6CeKnOIoGAZdfBFJX_YfrWG4DCAk26zr7uiOS6j2JNkj4E16URTfm8orQCRZ5X_7hBMsGpV5UeKJ'
    };
  }

  function setCachedUser(userData) {
    if (!userData) return;
    const current = getCachedUser();
    const merged = { ...current, ...userData };
    try {
      localStorage.setItem('transitly_user', JSON.stringify(merged));
      setCookie('transitly_user', JSON.stringify(merged), 365);
      if (merged.avatarUrl) {
        localStorage.setItem('transitly_user_avatar', merged.avatarUrl);
        setCookie('transitly_user_avatar', merged.avatarUrl, 365);
      }
    } catch (_) {}
    return merged;
  }

  // -------------------------------------------------------------
  // 4. Current Language Resolution
  // -------------------------------------------------------------
  function getActiveLanguage() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = (urlParams.get('lang') || '').toLowerCase();
    if (urlLang === 'hi' || urlLang === 'hindi') return 'hi';
    if (urlLang === 'pa' || urlLang === 'punjabi') return 'pa';
    if (urlLang === 'en' || urlLang === 'english') return 'en';

    const cookieLang = (getCookie('transitly_lang') || '').toLowerCase();
    if (cookieLang === 'hi' || cookieLang.includes('hindi')) return 'hi';
    if (cookieLang === 'pa' || cookieLang.includes('punjabi')) return 'pa';
    if (cookieLang === 'en' || cookieLang.includes('english')) return 'en';

    const localLang = (localStorage.getItem('transitly_lang') || '').toLowerCase();
    if (localLang === 'hi' || localLang.includes('hindi')) return 'hi';
    if (localLang === 'pa' || localLang.includes('punjabi')) return 'pa';
    if (localLang === 'en' || localLang.includes('english')) return 'en';

    return 'en';
  }

  let activeLang = getActiveLanguage();

  function t(key, fallbackText) {
    const dict = TRANSLATIONS[activeLang] || TRANSLATIONS.en;
    if (dict && dict[key]) return dict[key];
    if (TRANSLATIONS.en[key]) return TRANSLATIONS.en[key];
    return fallbackText || key;
  }

  // -------------------------------------------------------------
  // 5. Deterministic Translation Engine
  // -------------------------------------------------------------
  function translateDOM() {
    const currentLang = activeLang;
    document.documentElement.lang = currentLang;
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

    // 1. Explicit data-i18n translation
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.innerText = dict[key];
      }
    });

    // 2. Explicit data-i18n-placeholder translation
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key]) {
        el.setAttribute('placeholder', dict[key]);
      }
    });

    // 3. Fallback placeholder map
    const placeholderMap = {
      'inputGlobalSearch': 'deliver_search_placeholder',
      'trackingInput': 'tracking_search_placeholder',
      'historySearchInput': 'history_search_placeholder',
      'faqSearchInput': 'help_search_placeholder'
    };
    Object.keys(placeholderMap).forEach(id => {
      const el = document.getElementById(id);
      const key = placeholderMap[id];
      if (el && dict[key]) {
        el.setAttribute('placeholder', dict[key]);
      }
    });

    // 4. Update Current Language Label in Settings
    const labelCurrentLang = document.getElementById('labelCurrentLanguage');
    if (labelCurrentLang && LANGUAGES[currentLang]) {
      labelCurrentLang.innerText = LANGUAGES[currentLang].name;
    }
  }

  // -------------------------------------------------------------
  // 6. Set Language & Synchronize (Cookie + LocalStorage + Backend)
  // -------------------------------------------------------------
  async function setLanguage(langCode, shouldReload = true) {
    let normalized = (langCode || 'en').toLowerCase();
    if (normalized.includes('hi') || normalized.includes('hindi')) normalized = 'hi';
    else if (normalized.includes('pa') || normalized.includes('punjabi')) normalized = 'pa';
    else normalized = 'en';

    activeLang = normalized;

    // 1. Save in 1-year persistent cookie
    setCookie('transitly_lang', normalized, 365);

    // 2. Save in LocalStorage Cache
    localStorage.setItem('transitly_lang', normalized);

    // 3. Update document root
    document.documentElement.lang = normalized;

    // 4. Sync with Backend User Profile Settings
    try {
      await fetch('/api/v1/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: LANGUAGES[normalized].name })
      });
    } catch (_) {}

    // 5. Update DOM immediately
    translateDOM();

    // 6. If reload is requested, navigate with preserved search parameters
    if (shouldReload) {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('lang', normalized);
      window.location.href = currentUrl.toString();
    }
  }

  // -------------------------------------------------------------
  // 7. Global API Export & Auto-Execute on Load
  // -------------------------------------------------------------
  window.TransitlyI18n = {
    languages: LANGUAGES,
    translations: TRANSLATIONS,
    getActiveLanguage: () => activeLang,
    getCookie,
    setCookie,
    getCachedUser,
    setCachedUser,
    setLanguage,
    t,
    translateDOM
  };

  // Run automatically when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', translateDOM);
  } else {
    translateDOM();
  }
})();
