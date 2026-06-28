import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ArrowRight, CheckCircle, Phone, Mail, MapPin, PlayCircle,
  Menu, X, Package, Shield, Clock, TrendingUp, Users, BarChart3,
  FileText, Database, Download, ChevronDown, Star, Quote, ArrowUpRight
} from 'lucide-react';

const Landing = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);
  const [activeFaq, setActiveFaq] = useState(null);
  const [language, setLanguage] = useState('gu');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const t = (key) => {
    const translations = {
      gu: {
        appName: 'ખાતા કેન્દ્ર',
        slogan: 'તમારા બાંધકામને મજબૂત બનાવો, અમારી પ્લેટ્સ સાથે',
        subSlogan: 'ડિજિટલ ભાડા વ્યવસ્થાપન સાથે વિશ્વસનીય સેવા',
        login: 'લોગિન',
        products: 'ઉત્પાદનો',
        howToUse: 'કેવી રીતે વાપરવું',
        viewProducts: 'ઉત્પાદનો જુઓ',
        highQuality: 'ઉચ્ચ ગુણવત્તા',
        qualityDesc: 'MS સ્ટીલની શ્રેષ્ઠ પ્લેટ્સ',
        fastService: 'ઝડપી સેવા',
        serviceDesc: '24 કલાકમાં ડિલિવરી',
        fairRent: 'વાજબી ભાડું',
        rentDesc: 'પારદર્શક કિંમત',
        allSizes: 'બધા સાઈઝ',
        sizesDesc: '9 વિવિધ સાઈઝ ઉપલબ્ધ',
        productsAndPrices: 'ઉત્પાદનો અને કિંમતો',
        ourPlates: 'અમારી પ્લેટ્સ',
        allSizesOnePrice: 'બધી સાઈઝ, એક જ કિંમત - ₹1.5 પ્રતિ દિવસ',
        pricePerDay: 'દિવસ',
        sameRentAllPlates: 'બધી પ્લેટ્સ માટે સમાન ભાડું',
        videoGuide: 'વિડિયો માર્ગદર્શિકા',
        howToUsePlates: 'પ્લેટ્સ કેવી રીતે વાપરવી',
        watchVideo: 'વિડિયો જોઈને સમજો',
        step1: 'પગલું 1',
        selectSize: 'યોગ્ય સાઈઝ પસંદ કરો',
        step2: 'પગલું 2',
        properArrangement: 'યોગ્ય ગોઠવણી કરો',
        step3: 'પગલું 3',
        safeUsage: 'સલામત ઉપયોગ કરો',
        quickLinks: 'ઝડપી લિંક્સ',
        aboutUs: 'અમારા વિશે',
        contactUs: 'સંપર્ક કરો',
        privacyPolicy: 'પ્રાઈવસી પોલિસી',
        terms: 'નિયમો અને શરતો',
        howItWorks: 'કેવી રીતે કામ કરે છે',
        features: 'સુવિધાઓ',
        whyChooseUs: 'અમને કેમ પસંદ કરો',
        testimonials: 'ગ્રાહક પ્રતિસાદ',
        faq: 'વારંવાર પૂછાતા પ્રશ્નો'
      },
      en: {
        appName: 'Neelkanth Plate Depot',
        slogan: 'Strengthen Your Construction with Our Plates',
        subSlogan: 'Reliable Service with Digital Rental Management',
        login: 'Login',
        products: 'Products',
        howToUse: 'How to Use',
        viewProducts: 'View Products',
        highQuality: 'High Quality',
        qualityDesc: 'Premium MS Steel Plates',
        fastService: 'Fast Service',
        serviceDesc: 'Delivery in 24 hours',
        fairRent: 'Fair Rent',
        rentDesc: 'Transparent Pricing',
        allSizes: 'All Sizes',
        sizesDesc: '9 Different Sizes Available',
        productsAndPrices: 'Products & Prices',
        ourPlates: 'Our Plates',
        allSizesOnePrice: 'All Sizes, One Price - ₹1.5 per day',
        pricePerDay: 'day',
        sameRentAllPlates: 'Same rent for all plates',
        videoGuide: 'Video Guide',
        howToUsePlates: 'How to Use Plates',
        watchVideo: 'Watch and Learn',
        step1: 'Step 1',
        selectSize: 'Select Right Size',
        step2: 'Step 2',
        properArrangement: 'Proper Arrangement',
        step3: 'Step 3',
        safeUsage: 'Safe Usage',
        quickLinks: 'Quick Links',
        aboutUs: 'About Us',
        contactUs: 'Contact Us',
        privacyPolicy: 'Privacy Policy',
        terms: 'Terms & Conditions',
        howItWorks: 'How It Works',
        features: 'Features',
        whyChooseUs: 'Why Choose Us',
        testimonials: 'Testimonials',
        faq: 'FAQ'
      }
    };
    return translations[language][key] || key;
  };

  const products = [
    { name: '2 X 3', size: '2 X 3 ફુટ' },
    { name: '21 X 3', size: '21 X 3 ફુટ' },
    { name: '18 X 3', size: '18 X 3 ફુટ' },
    { name: '15 X 3', size: '15 X 3 ફુટ' },
    { name: '12 X 3', size: '12 X 3 ફુટ' },
    { name: '9 X 3', size: '9 X 3 ફુટ' },
    { name: 'પતરા', size: 'પતરા' },
    { name: '2 X 2', size: '2 X 2 ફુટ' },
    { name: '2 ફુટ', size: '2 ફુટ' }
  ];

  const features = [
    {
      icon: Shield,
      title: language === 'gu' ? 'ઉચ્ચ ગુણવત્તા' : 'High Quality',
      description: language === 'gu' ? 'MS સ્ટીલની શ્રેષ્ઠ પ્લેટ્સ' : 'Premium MS Steel Plates'
    },
    {
      icon: Clock,
      title: language === 'gu' ? 'ઝડપી સેવા' : 'Fast Service',
      description: language === 'gu' ? '24 કલાકમાં ડિલિવરી' : 'Delivery in 24 hours'
    },
    {
      icon: TrendingUp,
      title: language === 'gu' ? 'વાજબી ભાડું' : 'Fair Rent',
      description: language === 'gu' ? 'પારદર્શક કિંમત' : 'Transparent Pricing'
    },
    {
      icon: Package,
      title: language === 'gu' ? 'બધા સાઈઝ' : 'All Sizes',
      description: language === 'gu' ? '9 વિવિધ સાઈઝ ઉપલબ્ધ' : '9 Different Sizes Available'
    }
  ];

  const stats = [
    { number: '5000+', label: language === 'gu' ? 'પ્લેટ્સ ઉપલબ્ધ' : 'Plates Available' },
    { number: '500+', label: language === 'gu' ? 'ખુશ ગ્રાહકો' : 'Happy Clients' },
    { number: '10+', label: language === 'gu' ? 'વર્ષનો અનુભવ' : 'Years Experience' },
    { number: '24/7', label: language === 'gu' ? 'સેવા ઉપલબ્ધ' : 'Service Available' }
  ];

  const workSteps = [
    {
      number: '01',
      title: language === 'gu' ? 'ક્લાયન્ટ નોંધણી' : 'Client Registration',
      description: language === 'gu' ? 'સરળ નોંધણી પ્રક્રિયા, તરત જ શરૂ કરો' : 'Simple registration process, start immediately',
      features: [
        language === 'gu' ? 'ડિજિટલ રેકોર્ડ' : 'Digital Record',
        language === 'gu' ? 'યુનિક ID' : 'Unique ID',
        language === 'gu' ? 'સંપૂર્ણ વિગતો' : 'Complete Details'
      ]
    },
    {
      number: '02',
      title: language === 'gu' ? 'પ્લેટ ભાડે મેળવો (ઉધાર)' : 'Rent Plates (Udhar)',
      description: language === 'gu' ? 'જરૂરી પ્લેટ્સ પસંદ કરો અને ડિલિવરી લો' : 'Select required plates and get delivery',
      features: [
        language === 'gu' ? 'ઝડપી ડિલિવરી' : 'Fast Delivery',
        language === 'gu' ? 'ડિજિટલ ચલણ' : 'Digital Challan',
        language === 'gu' ? 'સ્ટોક ટ્રેકિંગ' : 'Stock Tracking'
      ]
    },
    {
      number: '03',
      title: language === 'gu' ? 'પ્લેટ પરત કરો (જમા)' : 'Return Plates (Jama)',
      description: language === 'gu' ? 'કામ પૂરું થાય ત્યારે પ્લેટ્સ પરત કરો' : 'Return plates when work is complete',
      features: [
        language === 'gu' ? 'સરળ રિટર્ન' : 'Easy Return',
        language === 'gu' ? 'આપોઆપ અપડેટ' : 'Auto Update',
        language === 'gu' ? 'બેલેન્સ ગણતરી' : 'Balance Calculation'
      ]
    },
    {
      number: '04',
      title: language === 'gu' ? 'બિલિંગ અને ચુકવણી' : 'Billing & Payment',
      description: language === 'gu' ? 'સચોટ બિલ અને લવચીક ચુકવણી' : 'Accurate bill and flexible payment',
      features: [
        language === 'gu' ? 'આપોઆપ ગણતરી' : 'Auto Calculation',
        language === 'gu' ? 'ડિજિટલ ઈન્વોઈસ' : 'Digital Invoice',
        language === 'gu' ? 'લવચીક ચુકવણી' : 'Flexible Payment'
      ]
    }
  ];

  const systemFeatures = [
    {
      icon: FileText,
      title: language === 'gu' ? 'ચલણ મેનેજમેન્ટ' : 'Challan Management',
      description: language === 'gu' ? 'ઉધાર અને જમા ચલણ, સંપૂર્ણ ડિજિટલ રેકોર્ડ' : 'Udhar and Jama challans, complete digital record',
      details: [
        language === 'gu' ? 'ઝડપી ચલણ જનરેશન' : 'Quick challan generation',
        language === 'gu' ? 'JPEG ડાઉનલોડ' : 'JPEG download',
        language === 'gu' ? 'બહુવિધ સાઈઝ સપોર્ટ' : 'Multiple size support'
      ]
    },
    {
      icon: Database,
      title: language === 'gu' ? 'સ્ટોક ટ્રેકિંગ' : 'Stock Tracking',
      description: language === 'gu' ? 'રીઅલ-ટાઈમ સ્ટોક અપડેટ્સ અને ઉપલબ્ધતા' : 'Real-time stock updates and availability',
      details: [
        language === 'gu' ? 'લાઈવ ઈન્વેન્ટરી' : 'Live inventory',
        language === 'gu' ? 'સાઈઝ-વાઈસ ટ્રેકિંગ' : 'Size-wise tracking',
        language === 'gu' ? 'આપોઆપ અપડેટ' : 'Auto update'
      ]
    },
    {
      icon: Users,
      title: language === 'gu' ? 'ક્લાયન્ટ લેજર (ખાતાવહી)' : 'Client Ledger',
      description: language === 'gu' ? 'સંપૂર્ણ વ્યવહાર ઇતિહાસ અને બેલેન્સ' : 'Complete transaction history and balance',
      details: [
        language === 'gu' ? 'સંપૂર્ણ ઇતિહાસ' : 'Complete history',
        language === 'gu' ? 'રનિંગ બેલેન્સ' : 'Running balance',
        language === 'gu' ? 'ડાઉનલોડ રિપોર્ટ્સ' : 'Download reports'
      ]
    },
    {
      icon: BarChart3,
      title: language === 'gu' ? 'બિલિંગ સિસ્ટમ' : 'Billing System',
      description: language === 'gu' ? 'આપોઆપ ભાડા ગણતરી અને ઈન્વોઈસ' : 'Automatic rent calculation and invoice',
      details: [
        language === 'gu' ? 'આપોઆપ ગણતરી' : 'Auto calculation',
        language === 'gu' ? 'વધારાનો ખર્ચ' : 'Extra costs',
        language === 'gu' ? 'છૂટ વ્યવસ્થાપન' : 'Discount management'
      ]
    }
  ];

  const testimonials = [
    {
      name: language === 'gu' ? 'રાજેશ પટેલ' : 'Rajesh Patel',
      company: 'ABC Construction, સુરત',
      text: language === 'gu'
        ? 'અત્યંત ઉપયોગી સિસ્ટમ છે. બધું ડિજિટલ હોવાથી કોઈ ગોળમાળ નથી. બિલિંગ પણ એકદમ સચોટ અને પારદર્શક છે.'
        : 'Very useful system. Everything is digital so no confusion. Billing is also accurate and transparent.',
      rating: 5
    },
    {
      name: language === 'gu' ? 'મહેશ શાહ' : 'Mahesh Shah',
      company: 'XYZ Builders, અમદાવાદ',
      text: language === 'gu'
        ? 'સેવા ખૂબ જ ઝડપી છે. 24 કલાકમાં પ્લેટ્સ ડિલિવર થઈ જાય છે. કિંમત પણ વાજબી છે.'
        : 'Service is very fast. Plates are delivered within 24 hours. Price is also reasonable.',
      rating: 5
    },
    {
      name: language === 'gu' ? 'અમિત વર્મા' : 'Amit Verma',
      company: 'PQR Developers, વડોદરા',
      text: language === 'gu'
        ? 'ડિજિટલ રેકોર્ડ રાખવાની સુવિધા ખૂબ સારી છે. કોઈ પણ સમયે હિસ્ટરી જોઈ શકાય છે.'
        : 'Digital record keeping facility is very good. Can view history anytime.',
      rating: 5
    }
  ];

  const faqs = [
    {
      q: language === 'gu' ? 'મિનિમમ ભાડા સમયગાળો કેટલો છે?' : 'What is the minimum rental period?',
      a: language === 'gu'
        ? 'મિનિમમ 30 દિવસનો ભાડો લેવાય છે. આનાથી ઓછા દિવસ માટે પણ 30 દિવસનું ચાર્જ લાગશે.'
        : 'Minimum rental period is 30 days. For less than 30 days, 30 days charge will apply.'
    },
    {
      q: language === 'gu' ? 'પ્લેટ્સ નુકસાન થાય તો?' : 'What if plates get damaged?',
      a: language === 'gu'
        ? 'નુકસાનના આધારે ₹100-500 પ્રતિ પ્લેટ ચાર્જ લેવામાં આવશે. નાના સ્ક્રેચ માટે કોઈ ચાર્જ નથી.'
        : 'Depending on damage, ₹100-500 per plate will be charged. No charge for minor scratches.'
    },
    {
      q: language === 'gu' ? 'ડિલિવરી કેવી રીતે થાય?' : 'How is delivery done?',
      a: language === 'gu'
        ? 'અમે તમારી સાઇટ પર ડિલિવરી કરીએ છીએ. ટ્રાન્સપોર્ટ ચાર્જ દૂરીના આધારે ₹500-1000 લેવામાં આવે છે.'
        : 'We deliver to your site. Transport charge of ₹500-1000 based on distance.'
    },
    {
      q: language === 'gu' ? 'ચુકવણી કેવી રીતે કરવી?' : 'How to make payment?',
      a: language === 'gu'
        ? 'રોકડ, બેંક ટ્રાન્સફર, UPI, ચેક - બધી રીતે ચુકવણી સ્વીકાર્ય છે. આંશિક ચુકવણી પણ લઈ શકાય છે.'
        : 'Cash, Bank Transfer, UPI, Cheque - all payment methods accepted. Partial payment also possible.'
    },
    {
      q: language === 'gu' ? 'બિલ ક્યારે આવશે?' : 'When will the bill come?',
      a: language === 'gu'
        ? 'તમે જયારે પ્લેટ્સ પરત કરો ત્યારે અથવા મહિનાના અંતે બિલ જનરેટ થશે. ડિજિટલ ઈન્વોઈસ તરત ડાઉનલોડ કરી શકાય.'
        : 'Bill will be generated when you return plates or at month end. Digital invoice can be downloaded immediately.'
    },
    {
      q: language === 'gu' ? 'સ્ટોક ઉપલબ્ધતા કેવી રીતે ચેક કરું?' : 'How to check stock availability?',
      a: language === 'gu'
        ? 'અમને ફોન કરો અથવા WhatsApp કરો. અમારી સિસ્ટમમાં રીઅલ-ટાઈમ સ્ટોક દેખાય છે.'
        : 'Call us or WhatsApp us. Our system shows real-time stock availability.'
    }
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`fixed top-4 left-4 right-4 z-50 transition-all duration-500 ${scrolled
            ? 'bg-white/90 backdrop-blur-xl shadow-lg border border-gray-200/50'
            : 'bg-white/70 backdrop-blur-md border border-white/20'
          } rounded-2xl`}
      >
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div
              className="flex items-center gap-3 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 blur-lg opacity-60"></div>
                <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600">
                  <Package className="w-5 h-5 text-white" />
                </div>
              </div>
              <span className="text-xl font-bold text-gray-900">{t('appName')}</span>
            </motion.div>

            {/* Desktop Menu */}
            <div className="items-center hidden gap-8 md:flex">
              <a href="#products" className="text-sm font-medium text-gray-700 hover:text-orange-600">
                {t('products')}
              </a>
              <a href="#how-it-works" className="text-sm font-medium text-gray-700 hover:text-orange-600">
                {t('howItWorks')}
              </a>
              <a href="#features" className="text-sm font-medium text-gray-700 hover:text-orange-600">
                {t('features')}
              </a>
              <a href="#faq" className="text-sm font-medium text-gray-700 hover:text-orange-600">
                {t('faq')}
              </a>
              <button
                onClick={() => setLanguage(language === 'gu' ? 'en' : 'gu')}
                className="px-3 py-1.5 text-sm font-medium border rounded-lg hover:bg-gray-50"
              >
                {language === 'gu' ? 'English' : 'ગુજરાતી'}
              </button>
              <motion.button
                onClick={() => window.location.href = '/login'}
                className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-orange-500 to-red-600"
                whileHover={{ scale: 1.05 }}
              >
                {t('login')}
              </motion.button>
            </div>

            {/* Mobile Menu */}
            <div className="flex items-center gap-3 md:hidden">
              <button
                onClick={() => setLanguage(language === 'gu' ? 'en' : 'gu')}
                className="px-3 py-1.5 text-sm font-medium border rounded-lg"
              >
                {language === 'gu' ? 'EN' : 'ગુ'}
              </button>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-gray-200 md:hidden"
              >
                <div className="px-4 py-3 space-y-3">
                  <a href="#products" className="block text-sm font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                    {t('products')}
                  </a>
                  <a href="#how-it-works" className="block text-sm font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                    {t('howItWorks')}
                  </a>
                  <a href="#features" className="block text-sm font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                    {t('features')}
                  </a>
                  <a href="#faq" className="block text-sm font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                    {t('faq')}
                  </a>
                  <button
                    onClick={() => window.location.href = '/login'}
                    className="w-full px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-orange-500 to-red-600"
                  >
                    {t('login')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden sm:pt-40 sm:pb-24">
        <div className="relative px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="mb-4 text-5xl font-extrabold text-gray-900 sm:text-7xl">
                {t('appName')}
              </h1>
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="w-16 h-1 rounded bg-gradient-to-r from-orange-500 to-red-600"></div>
                <Sparkles className="w-6 h-6 text-orange-500" />
                <div className="w-16 h-1 rounded bg-gradient-to-l from-orange-500 to-red-600"></div>
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-3xl mx-auto mb-12 text-xl font-medium text-gray-600 sm:text-2xl"
            >
              "{t('slogan')}"
              <br />
              <span className="text-lg text-gray-500">{t('subSlogan')}</span>
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col items-center justify-center gap-4 mb-16 sm:flex-row"
            >
              <button
                onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 text-lg font-semibold text-white rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 hover:shadow-2xl"
              >
                <span className="flex items-center gap-2">
                  {t('viewProducts')}
                  <ArrowRight className="w-5 h-5" />
                </span>
              </button>
              <button
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 px-8 py-4 text-lg font-semibold border-2 border-gray-300 rounded-2xl hover:bg-gray-50"
              >
                <PlayCircle className="w-5 h-5" />
                {t('howToUse')}
              </button>
            </motion.div>

            {/* Quick Features */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid max-w-4xl grid-cols-2 gap-4 mx-auto lg:grid-cols-4"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="p-6 bg-white border shadow-md rounded-2xl border-gray-200/50"
                >
                  <div className="p-3 mx-auto mb-3 rounded-xl bg-orange-500/10 w-fit">
                    <feature.icon className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="mb-1 text-base font-bold text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="px-4 mx-auto mt-20 max-w-7xl sm:px-6 lg:px-8"
        >
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                className="p-6 text-center bg-white border shadow-lg rounded-2xl border-orange-200/50"
              >
                <div className="mb-2 text-3xl font-extrabold text-orange-600 sm:text-4xl">{stat.number}</div>
                <div className="text-sm font-medium text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white sm:py-24">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 border rounded-full bg-blue-50/50 border-blue-200/50">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-semibold text-blue-600">{t('howItWorks')}</span>
            </div>
            <h2 className="mb-4 text-4xl font-extrabold text-gray-900 sm:text-5xl">
              {language === 'gu' ? 'અમારી સિસ્ટમ કેવી રીતે કામ કરે છે' : 'How Our System Works'}
            </h2>
            <p className="max-w-2xl mx-auto text-xl text-gray-600">
              {language === 'gu'
                ? '4 સરળ પગલાંમાં તમારા બાંધકામ માટે પ્લેટ્સ મેળવો'
                : 'Get plates for your construction in 4 simple steps'}
            </p>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-2">
            {workSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative p-8 bg-white border-2 shadow-lg rounded-2xl border-gray-200/50 hover:shadow-xl"
              >
                <div className="absolute top-8 left-8">
                  <div className="flex items-center justify-center w-16 h-16 text-2xl font-bold text-white rounded-full bg-gradient-to-br from-orange-500 to-red-600">
                    {step.number}
                  </div>
                </div>
                <div className="pl-24">
                  <h3 className="mb-3 text-2xl font-bold text-gray-900">{step.title}</h3>
                  <p className="mb-4 text-gray-600">{step.description}</p>
                  <ul className="space-y-2">
                    {step.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="py-20 bg-gradient-to-b from-white to-gray-50 sm:py-24">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 border rounded-full bg-orange-50/50 border-orange-200/50">
              <Package className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-semibold text-orange-600">{t('productsAndPrices')}</span>
            </div>
            <h2 className="mb-4 text-4xl font-extrabold text-gray-900 sm:text-5xl">
              {t('ourPlates')}
            </h2>
            <p className="max-w-2xl mx-auto mb-8 text-xl text-gray-600">
              {t('allSizesOnePrice')}
            </p>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-3 px-8 py-4 mb-12 border-2 border-orange-300 shadow-lg bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl"
            >
              <div className="flex items-center justify-center w-12 h-12 text-2xl font-bold text-white rounded-full bg-gradient-to-br from-orange-500 to-red-600">
                ₹
              </div>
              <div className="text-left">
                <div className="text-3xl font-extrabold text-gray-900">₹1.5 / {t('pricePerDay')}</div>
                <div className="text-sm text-gray-600">{t('sameRentAllPlates')}</div>
              </div>
            </motion.div>
          </motion.div>

          <div className="grid max-w-4xl grid-cols-2 gap-4 mx-auto sm:grid-cols-3 lg:grid-cols-3">
            {products.map((product, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative p-6 overflow-hidden bg-white border shadow-md rounded-2xl border-gray-200/50 hover:shadow-xl"
              >
                <div className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 text-2xl font-bold text-white rounded-xl bg-gradient-to-br from-orange-500 to-red-600">
                    {product.name.includes('X') ? product.name.split('X')[0].trim() : product.name.charAt(0)}
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-gray-900">{product.size}</h3>
                  <div className="inline-flex items-baseline gap-1 px-4 py-2 rounded-lg bg-orange-50">
                    <span className="text-2xl font-bold text-orange-600">₹1.5</span>
                    <span className="text-sm text-gray-600">/દિવસ</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto mt-12"
          >
            <div className="p-6 border rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/50">
              <div className="flex items-start gap-4">
                <CheckCircle className="flex-shrink-0 w-6 h-6 mt-1 text-blue-600" />
                <div>
                  <h4 className="mb-2 text-lg font-bold text-gray-900">
                    {language === 'gu' ? 'વિશેષ નોંધ' : 'Special Note'}
                  </h4>
                  <p className="text-gray-700">
                    {language === 'gu' ? (
                      <>
                        • બધી પ્લેટ્સ ઉચ્ચ ગુણવત્તાની MS સ્ટીલથી બનેલી છે<br />
                        • મિનિમમ ભાડા સમયગાળો: 30 દિવસ<br />
                        • બલ્ક ઓર્ડર પર વિશેષ ડિસ્કાઉન્ટ<br />
                        • ટ્રાન્સપોર્ટ: ₹500-1000 (દૂરીના આધારે)
                      </>
                    ) : (
                      <>
                        • All plates made of high quality MS Steel<br />
                        • Minimum rental period: 30 days<br />
                        • Special discount on bulk orders<br />
                        • Transport: ₹500-1000 (based on distance)
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* System Features */}
      <section id="features" className="py-20 bg-white sm:py-24">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 border rounded-full bg-purple-50/50 border-purple-200/50">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-semibold text-purple-600">{t('features')}</span>
            </div>
            <h2 className="mb-4 text-4xl font-extrabold text-gray-900 sm:text-5xl">
              {language === 'gu' ? 'સિસ્ટમ સુવિધાઓ' : 'System Features'}
            </h2>
            <p className="max-w-2xl mx-auto text-xl text-gray-600">
              {language === 'gu'
                ? 'સંપૂર્ણ ડિજિટલ સોલ્યુશન તમારા બિઝનેસ માટે'
                : 'Complete digital solution for your business'}
            </p>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-2">
            {systemFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setActiveFeature(activeFeature === index ? null : index)}
                className="p-8 transition-all bg-white border-2 shadow-lg cursor-pointer rounded-2xl border-gray-200/50 hover:shadow-xl hover:border-orange-300"
              >
                <div className="flex items-start gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10">
                    <feature.icon className="w-8 h-8 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-2xl font-bold text-gray-900">{feature.title}</h3>
                      <ChevronDown
                        className={`w-5 h-5 transition-transform ${activeFeature === index ? 'rotate-180' : ''}`}
                      />
                    </div>
                    <p className="mb-4 text-gray-600">{feature.description}</p>
                    <AnimatePresence>
                      {activeFeature === index && (
                        <motion.ul
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-2 overflow-hidden"
                        >
                          {feature.details.map((detail, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                              <ArrowUpRight className="w-4 h-4 text-orange-600" />
                              {detail}
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50 sm:py-24">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 border rounded-full bg-green-50/50 border-green-200/50">
              <Quote className="w-5 h-5 text-green-600" />
              <span className="text-sm font-semibold text-green-600">{t('testimonials')}</span>
            </div>
            <h2 className="mb-4 text-4xl font-extrabold text-gray-900 sm:text-5xl">
              {language === 'gu' ? 'ગ્રાહકો શું કહે છે' : 'What Clients Say'}
            </h2>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="p-8 bg-white border shadow-lg rounded-2xl border-gray-200/50"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="mb-6 text-gray-700">{testimonial.text}</p>
                <div className="pt-4 border-t border-gray-200">
                  <div className="font-bold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.company}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-white sm:py-24">
        <div className="max-w-4xl px-4 mx-auto sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-4xl font-extrabold text-gray-900 sm:text-5xl">
              {t('faq')}
            </h2>
            <p className="text-xl text-gray-600">
              {language === 'gu' ? 'સામાન્ય પ્રશ્નોના જવાબો' : 'Answers to Common Questions'}
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="overflow-hidden border-2 shadow-md rounded-2xl border-gray-200/50"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="flex items-center justify-between w-full p-6 text-left transition-colors hover:bg-gray-50"
                >
                  <span className="text-lg font-bold text-gray-900">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 transition-transform flex-shrink-0 ml-4 ${activeFaq === index ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {activeFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-gray-700">{faq.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-orange-500 to-red-600">
        <div className="max-w-4xl px-4 mx-auto text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-6 text-4xl font-extrabold text-white sm:text-5xl">
              {language === 'gu' ? 'તૈયાર છો શરૂ કરવા?' : 'Ready to Get Started?'}
            </h2>
            <p className="mb-8 text-xl text-white/90">
              {language === 'gu'
                ? 'આજે જ લોગિન કરો અને તમારા બિઝનેસને ડિજિટલ બનાવો'
                : 'Login today and digitize your business'}
            </p>
            <button
              onClick={() => window.location.href = '/login'}
              className="px-8 py-4 text-lg font-semibold text-orange-600 transition-transform bg-white rounded-2xl hover:scale-105"
            >
              {t('login')} <ArrowRight className="inline w-5 h-5 ml-2" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 border-t border-gray-800">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">{t('appName')}</span>
              </div>
              <p className="mb-4 text-sm text-gray-400">
                {language === 'gu'
                  ? 'તમારા બાંધકામ પ્રોજેક્ટ્સ માટે વિશ્વસનીય પ્લેટ ભાડા સેવા'
                  : 'Reliable plate rental service for your construction projects'}
              </p>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-bold text-white uppercase">{t('quickLinks')}</h3>
              <ul className="space-y-2">
                <li><a href="#products" className="text-sm text-gray-400 hover:text-white">{t('products')}</a></li>
                <li><a href="#how-it-works" className="text-sm text-gray-400 hover:text-white">{t('howItWorks')}</a></li>
                <li><a href="#features" className="text-sm text-gray-400 hover:text-white">{t('features')}</a></li>
                <li><a href="#faq" className="text-sm text-gray-400 hover:text-white">{t('faq')}</a></li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-bold text-white uppercase">{t('contactUs')}</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Phone className="flex-shrink-0 w-5 h-5 mt-0.5 text-orange-400" />
                  <div>
                    <p className="text-sm text-gray-400">+91 98765 43210</p>
                    <p className="text-xs text-gray-500">{language === 'gu' ? 'સોમવાર - શનિવાર' : 'Mon - Sat'}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Mail className="flex-shrink-0 w-5 h-5 mt-0.5 text-orange-400" />
                  <p className="text-sm text-gray-400">info@neelkanthplate.com</p>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="flex-shrink-0 w-5 h-5 mt-0.5 text-orange-400" />
                  <p className="text-sm text-gray-400">{language === 'gu' ? 'અમદાવાદ, ગુજરાત' : 'Ahmedabad, Gujarat'}</p>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-gray-800">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-sm text-gray-400">
                © 2025 {t('appName')}. All rights reserved.
              </p>
              <div className="flex gap-6 text-sm text-gray-400">
                <a href="#" className="hover:text-white">{t('privacyPolicy')}</a>
                <a href="#" className="hover:text-white">{t('terms')}</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;