import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { Settings as SettingsIcon, Globe, Layers, CheckCircle, Download, Type, Lock, Shield, Fingerprint, Key, Share2, CalendarClock, LayoutGrid, ChevronRight } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from '../utils/supabase';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const {
    dateSortingMethod,
    setDateSortingMethod,
    defaultLedgerDownloadFormat,
    setDefaultLedgerDownloadFormat,
    fontSize,
    setFontSize,
    resetFontSize,
    showDriverDetails,
    setShowDriverDetails,
    shareBillMode,
    setShareBillMode,
  } = useSettings();

  const [securityEnabled, setSecurityEnabled] = React.useState(() => localStorage.getItem('security_lock_enabled') === 'true');
  const [pin, setPin] = React.useState(() => localStorage.getItem('security_lock_pin') || '1234');
  const [hasBiometrics, setHasBiometrics] = React.useState(false);
  const [isBiometricRegistered, setIsBiometricRegistered] = React.useState(() => !!localStorage.getItem('security_lock_cred_id'));

  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [authPin, setAuthPin] = React.useState('');
  const [pendingToggle, setPendingToggle] = React.useState<boolean | null>(null);

  // Monthly bill cron on/off — stored in app_settings so the server-side
  // cron job can check it. null while loading from DB.
  const [cronEnabled, setCronEnabled] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'monthly_bill_cron_enabled')
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load cron setting:', error);
          return;
        }
        setCronEnabled(data ? data.value !== 'false' : true);
      });
  }, []);

  const handleToggleCron = async () => {
    if (cronEnabled === null) return; // still loading
    const next = !cronEnabled;
    setCronEnabled(next);
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'monthly_bill_cron_enabled', value: String(next), updated_at: new Date().toISOString() });
    if (error) {
      console.error('Failed to save cron setting:', error);
      setCronEnabled(!next); // revert on failure
      toast.error('Failed to save setting');
    } else {
      toast.success(next ? (t('cronEnabled') || 'Monthly billing on') : (t('cronDisabled') || 'Monthly billing off'));
    }
  };

  React.useEffect(() => {
    if (window.PublicKeyCredential && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => setHasBiometrics(available))
        .catch(err => console.error(err));
    }
  }, []);

  const handleAuthBiometric = async () => {
    try {
      if (!window.PublicKeyCredential) return;
      const savedCredIdHex = localStorage.getItem('security_lock_cred_id');
      if (!savedCredIdHex) return;

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      const credIdBuffer = new Uint8Array(
        savedCredIdHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
      );

      const options: CredentialRequestOptions = {
        publicKey: {
          challenge,
          timeout: 60000,
          allowCredentials: [{ type: 'public-key', id: credIdBuffer }],
          userVerification: 'required',
        },
      };

      const assertion = await navigator.credentials.get(options);
      if (assertion && pendingToggle !== null) {
        setSecurityEnabled(pendingToggle);
        localStorage.setItem('security_lock_enabled', String(pendingToggle));
        setShowAuthModal(false);
        setPendingToggle(null);
        toast.success(language === 'gu' ? "પ્રમાણીકરણ સફળ" : "Authentication Successful!");
      }
    } catch (err: any) {
      console.warn(err);
      if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
        toast.error(language === 'gu' ? "વેરિફિકેશન નિષ્ફળ" : "Biometric Verification Failed");
      }
    }
  };

  const handleAuthPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const savedPin = localStorage.getItem('security_lock_pin');
    if (authPin === savedPin && pendingToggle !== null) {
      setSecurityEnabled(pendingToggle);
      localStorage.setItem('security_lock_enabled', String(pendingToggle));
      setShowAuthModal(false);
      setPendingToggle(null);
      setAuthPin('');
      toast.success(language === 'gu' ? "પ્રમાણીકરણ સફળ" : "Authentication Successful!");
    } else {
      toast.error(language === 'gu' ? "ખોટો પિન!" : "Incorrect PIN!");
      setAuthPin('');
    }
  };

  const handleToggleSecurity = () => {
    const hasExistingPin = localStorage.getItem('security_lock_pin');
    const targetState = !securityEnabled;
    
    if (hasExistingPin) {
      setPendingToggle(targetState);
      setShowAuthModal(true);
      setAuthPin('');
      // Auto-trigger biometric if registered
      if (isBiometricRegistered) {
        setTimeout(() => {
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);
          const savedCredIdHex = localStorage.getItem('security_lock_cred_id');
          if (savedCredIdHex) {
            const credIdBuffer = new Uint8Array(
              savedCredIdHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
            );
            navigator.credentials.get({
              publicKey: {
                challenge,
                timeout: 60000,
                allowCredentials: [{ type: 'public-key', id: credIdBuffer }],
                userVerification: 'required',
              }
            }).then(assertion => {
              if (assertion) {
                setSecurityEnabled(targetState);
                localStorage.setItem('security_lock_enabled', String(targetState));
                setShowAuthModal(false);
                setPendingToggle(null);
                toast.success(language === 'gu' ? "પ્રમાણીકરણ સફળ" : "Authentication Successful!");
              }
            }).catch(err => {
              console.warn(err);
            });
          }
        }, 300);
      }
    } else {
      setSecurityEnabled(targetState);
      localStorage.setItem('security_lock_enabled', String(targetState));
    }
  };

  const handleSave = () => {
    if (securityEnabled) {
      if (!/^\d{4}$/.test(pin)) {
        toast.error(language === 'gu' ? 'પિન બરાબર ૪ અંકોનો હોવો જોઈએ!' : 'PIN must be exactly 4 digits!');
        return;
      }
      localStorage.setItem('security_lock_pin', pin);
    }
    localStorage.setItem('security_lock_enabled', String(securityEnabled));
    toast.success(t('settingsSaved') || 'Settings saved successfully!');
  };

  const registerBiometrics = async () => {
    try {
      if (!window.PublicKeyCredential) {
        toast.error("Biometrics not supported on this device/browser");
        return;
      }

      // Use existing PIN if it is a valid 4-digit number, otherwise generate a random one
      const generatedPin = pin && pin.length === 4 ? pin : Math.floor(1000 + Math.random() * 9000).toString();

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const userId = new Uint8Array(16);
      window.crypto.getRandomValues(userId);

      const creationOptions: CredentialCreationOptions = {
        publicKey: {
          challenge,
          rp: {
            name: "Khata Kendra PWA",
            id: window.location.hostname || "localhost"
          },
          user: {
            id: userId,
            name: "admin@khatakendra.com",
            displayName: "Administrator"
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" }, // ES256
            { alg: -257, type: "public-key" } // RS256
          ],
          timeout: 60000,
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          }
        }
      };

      const credential = await navigator.credentials.create(creationOptions) as PublicKeyCredential;
      if (credential) {
        // Convert arrayBuffer to hex string to store in localStorage
        const rawId = new Uint8Array(credential.rawId);
        const hexId = Array.from(rawId).map(b => b.toString(16).padStart(2, '0')).join('');

        localStorage.setItem('security_lock_cred_id', hexId);
        localStorage.setItem('security_lock_pin', generatedPin);

        setPin(generatedPin);
        setIsBiometricRegistered(true);

        toast.success(
          language === 'gu'
            ? `બાયોમેટ્રિક સેટ થયું! તમારો બેકઅપ પિન: ${generatedPin}`
            : `Biometrics set! Your backup PIN: ${generatedPin}`,
          { duration: 6000 }
        );
      }
    } catch (err: any) {
      console.error(err);
      if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
        toast.error(language === 'gu' ? "નોંધણી નિષ્ફળ રહી" : "Registration failed");
      }
    }
  };

  const removeBiometrics = () => {
    localStorage.removeItem('security_lock_cred_id');
    setIsBiometricRegistered(false);
    toast.success(language === 'gu' ? "બાયોમેટ્રિક દૂર કરવામાં આવ્યું" : "Biometrics removed");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      <Toaster position="top-right" />
      <Navbar />

      <main className="flex-1 w-full px-4 py-8 pb-24 sm:px-6 lg:px-8 lg:ml-64 transition-all duration-200">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Header — hidden on mobile (navbar already shows page title) */}
          <div className="hidden lg:flex items-center gap-3 border-b border-gray-200 pb-4">
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
              <SettingsIcon className="w-6 h-6 animate-[spin_10s_linear_infinite]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('settings')}</h1>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-1">
            {/* Challan Export Design Card */}
            <button
              onClick={() => navigate('/settings/challan-designer')}
              className="w-full text-left bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:border-blue-300 transition-colors"
            >
              <div className="p-4 sm:p-6 flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                    {language === 'gu' ? 'ચલણ એક્સપોર્ટ ડિઝાઇન' : 'Challan Export Designs'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    {language === 'gu'
                      ? 'એક્સપોર્ટ થયેલ ચલણ કેવું દેખાય તે ડિઝાઇન કરો: બેકગ્રાઉન્ડ ટેમ્પલેટ સેટ કરો અને ડેટા ફીલ્ડ્સ તેના પર ગોઠવો.'
                      : 'Design how exported challans look: set a background template and drag data fields onto it. Configure per item type.'}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>

            {/* Bill Calculation Settings Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <Layers className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                  {t('billCalculationSettings')}
                </h3>
              </div>
              <div className="p-4 sm:p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {t('dateSortingMethod')}
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">

                    {/* Standard Method Option */}
                    <button
                      onClick={() => setDateSortingMethod('standard')}
                      className={`relative p-4 rounded-xl border text-left transition-all ${dateSortingMethod === 'standard'
                          ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm sm:text-base text-gray-900">
                          {t('standardSorting')}
                        </span>
                        {dateSortingMethod === 'standard' && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {t('standardSortingDesc')}
                      </p>
                    </button>

                    {/* Jama First Option */}
                    <button
                      onClick={() => setDateSortingMethod('jamaFirst')}
                      className={`relative p-4 rounded-xl border text-left transition-all ${dateSortingMethod === 'jamaFirst'
                          ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm sm:text-base text-gray-900">
                          {t('jamaFirstSorting')}
                        </span>
                        {dateSortingMethod === 'jamaFirst' && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {t('jamaFirstSortingDesc')}
                      </p>
                    </button>

                  </div>
                </div>
              </div>
            </div>

            {/* Ledger Download Settings Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <Download className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                  {t('ledgerDownloadSettings')}
                </h3>
              </div>
              <div className="p-4 sm:p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {t('defaultLedgerDownloadFormat')}
                  </label>
                  <div className="grid gap-4 sm:grid-cols-3">

                    {/* Detailed Option */}
                    <button
                      onClick={() => setDefaultLedgerDownloadFormat('detailed')}
                      className={`relative p-4 rounded-xl border text-left transition-all ${defaultLedgerDownloadFormat === 'detailed'
                          ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm sm:text-base text-gray-900">
                          {t('detailed')}
                        </span>
                        {defaultLedgerDownloadFormat === 'detailed' && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {t('detailedFormatDesc')}
                      </p>
                    </button>

                    {/* Simple Option */}
                    <button
                      onClick={() => setDefaultLedgerDownloadFormat('simple')}
                      className={`relative p-4 rounded-xl border text-left transition-all ${defaultLedgerDownloadFormat === 'simple'
                          ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm sm:text-base text-gray-900">
                          {t('simple')}
                        </span>
                        {defaultLedgerDownloadFormat === 'simple' && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {t('simpleFormatDesc')}
                      </p>
                    </button>

                    {/* Split Option */}
                    <button
                      onClick={() => setDefaultLedgerDownloadFormat('split')}
                      className={`relative p-4 rounded-xl border text-left transition-all ${defaultLedgerDownloadFormat === 'split'
                          ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm sm:text-base text-gray-900">
                          {t('split')}
                        </span>
                        {defaultLedgerDownloadFormat === 'split' && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {t('splitFormatDesc')}
                      </p>
                    </button>

                  </div>
                </div>
              </div>
            </div>

            {/* Font Size Settings Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Type className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                    {t('fontSizeSettings') || 'Font Size'}
                  </h3>
                </div>
                <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  {fontSize}px
                </span>
              </div>

              <div className="p-4 sm:p-6 space-y-5">

                {/* Quick preset buttons */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    {t('quickSelect') || 'Quick Select'}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'A', size: 13, name: t('small') || 'Small' },
                      { label: 'A', size: 15, name: t('medium') || 'Normal' },
                      { label: 'A', size: 17, name: t('large') || 'Large' },
                      { label: 'A', size: 20, name: t('xlarge') || 'X-Large' },
                    ].map((preset) => (
                      <button
                        key={preset.size}
                        onClick={() => setFontSize(preset.size)}
                        className={`flex flex-col items-center py-3 px-2 rounded-xl border transition-all ${fontSize === preset.size
                            ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-500'
                            : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'
                          }`}
                      >
                        <span
                          style={{ fontSize: `${preset.size}px`, lineHeight: 1 }}
                          className="font-bold text-gray-800 mb-1"
                        >
                          {preset.label}
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium">{preset.name}</span>
                        {fontSize === preset.size && (
                          <CheckCircle className="w-3.5 h-3.5 text-blue-600 mt-1" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {t('customSize') || 'Custom'}
                    </p>
                    <button
                      onClick={resetFontSize}
                      className="text-xs text-blue-500 hover:text-blue-700 font-semibold transition-colors"
                    >
                      {t('reset') || 'Reset'}
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400" style={{ fontSize: '12px' }}>A</span>
                    <input
                      type="range"
                      min={12}
                      max={22}
                      step={1}
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="flex-1 h-2 accent-blue-600 cursor-pointer"
                      style={{ accentColor: '#2563eb' }}
                    />
                    <span className="text-base font-bold text-gray-400" style={{ fontSize: '22px' }}>A</span>
                  </div>

                  <div className="flex justify-between mt-1 px-1">
                    {[12, 14, 16, 18, 20, 22].map(s => (
                      <span
                        key={s}
                        onClick={() => setFontSize(s)}
                        className={`text-[10px] cursor-pointer select-none transition-colors ${fontSize === s ? 'text-blue-600 font-bold' : 'text-gray-400 hover:text-gray-600'
                          }`}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Live preview */}
                <div className="p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50">
                  <p className="text-[11px] text-gray-400 mb-1.5 font-medium uppercase tracking-wide">
                    {t('preview') || 'Preview'}
                  </p>
                  <p style={{ fontSize: `${fontSize}px` }} className="text-gray-800 font-semibold leading-snug">
                    {t('fontPreviewText') || 'ખાતા કેન્દ્ર — Khata Kendra'}
                  </p>
                  <p style={{ fontSize: `${fontSize * 0.85}px` }} className="text-gray-500 mt-1 leading-snug">
                    {t('fontPreviewSub') || 'Bills · Challans · Ledger · Stock'}
                  </p>
                </div>

              </div>
            </div>

            {/* Language Settings Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <Globe className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                  {t('languageSettings')}
                </h3>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {t('selectLanguage')}
                  </label>
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => setLanguage('gu')}
                      className={`flex-1 px-6 py-2.5 rounded-lg text-sm font-semibold border transition-all ${language === 'gu'
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      ગુજરાતી
                    </button>
                    <button
                      onClick={() => setLanguage('en')}
                      className={`flex-1 px-6 py-2.5 rounded-lg text-sm font-semibold border transition-all ${language === 'en'
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      English
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Extra Fields Settings Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <SettingsIcon className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                  {t('extraFieldsSettings') || 'Feature Visibility Settings'}
                </h3>
              </div>
              <div className="p-4 sm:p-6">
                <button
                  onClick={() => setShowDriverDetails(!showDriverDetails)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${showDriverDetails
                      ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                >
                  <div className="pr-4">
                    <span className="font-bold text-sm sm:text-base text-gray-900 block mb-1">
                      {t('enableDriverMobileVehicle') || 'Enable Driver Mobile Number & Vehicle'}
                    </span>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {t('enableDriverMobileVehicleDesc') || 'Show fields for Driver Mobile and Vehicle details during Jama and Udhar challan creation.'}
                    </p>
                  </div>
                  <div className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out shadow-inner ${showDriverDetails ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${showDriverDetails ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </div>
                </button>
              </div>
            </div>

            {/* Monthly Bill Cron Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <CalendarClock className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                  {t('monthlyBillCronSettings') || 'Automatic Monthly Billing'}
                </h3>
              </div>
              <div className="p-4 sm:p-6">
                <button
                  onClick={handleToggleCron}
                  disabled={cronEnabled === null}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all disabled:opacity-60 ${cronEnabled
                      ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                >
                  <div className="pr-4">
                    <span className="font-bold text-sm sm:text-base text-gray-900 block mb-1">
                      {t('enableMonthlyBillCron') || 'Auto-create bills on the 1st'}
                    </span>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {t('enableMonthlyBillCronDesc') || 'On the 1st of every month, draft bills are created automatically for all clients with pending billing. Turn off to stop scheduled billing; the Create All Bills button keeps working either way.'}
                    </p>
                  </div>
                  <div className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out shadow-inner ${cronEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${cronEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </div>
                </button>
              </div>
            </div>

            {/* Bill Sharing Settings Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <Share2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                  {t('billSharingSettings')}
                </h3>
              </div>
              <div className="p-4 sm:p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {t('shareBillMode')}
                  </label>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                    {t('shareBillModeDesc')}
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Share as Image */}
                    <button
                      onClick={() => setShareBillMode('image')}
                      className={`relative p-4 rounded-xl border text-left transition-all ${shareBillMode === 'image'
                          ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm sm:text-base text-gray-900">
                          {t('shareAsImage')}
                        </span>
                        {shareBillMode === 'image' && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </button>

                    {/* Share as Text */}
                    <button
                      onClick={() => setShareBillMode('text')}
                      className={`relative p-4 rounded-xl border text-left transition-all ${shareBillMode === 'text'
                          ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm sm:text-base text-gray-900">
                          {t('shareAsText')}
                        </span>
                        {shareBillMode === 'text' && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* PWA Security Settings Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                  {language === 'gu' ? 'એપ્લિકેશન સુરક્ષા સેટિંગ્સ' : 'App Security & Lock Settings'}
                </h3>
              </div>
              <div className="p-4 sm:p-6 space-y-6">

                {/* Enable Lock Switch */}
                <button
                  onClick={handleToggleSecurity}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${securityEnabled
                      ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                >
                  <div className="pr-4">
                    <span className="font-bold text-sm sm:text-base text-gray-900 block mb-1">
                      {language === 'gu' ? 'એપ લોક ચાલુ કરો' : 'Enable Application Lock'}
                    </span>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {language === 'gu' ? 'મોબાઇલ PWA શરૂ થવા પર પિન અથવા ફિંગરપ્રિન્ટ પૂછશે.' : 'Require PIN or Biometrics authentication on app startup.'}
                    </p>
                  </div>
                  <div className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out shadow-inner ${securityEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${securityEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </div>
                </button>

                {securityEnabled && (
                  <div className="space-y-4 pt-4 border-t border-gray-100">

                    {/* PIN Input */}
                    <div className="max-w-xs">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center justify-between">
                        <span>{language === 'gu' ? '૪-અંકનો સુરક્ષા પિન' : '4-Digit Security PIN'}</span>
                        {isBiometricRegistered && (
                          <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                            {language === 'gu' ? 'બાયોમેટ્રિક બેકઅપ પિન' : 'Biometric Backup PIN'}
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <Key className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                        <input
                          type="password"
                          pattern="[0-9]*"
                          inputMode="numeric"
                          maxLength={4}
                          value={pin}
                          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          className="w-full py-2.5 pl-10 pr-4 text-gray-900 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-mono text-lg tracking-widest text-center"
                          placeholder="••••"
                        />
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">
                        {language === 'gu'
                          ? 'બાયોમેટ્રિક કામ ન કરે અથવા ઉપલબ્ધ ન હોય ત્યારે અનલોક કરવા માટે કસ્ટમ પિન સેટ કરો.'
                          : 'Set a custom backup PIN to use if biometrics is unavailable or fails.'}
                      </p>
                    </div>

                    {/* Biometrics Setup */}
                    {hasBiometrics && (
                      <div className="pt-4 border-t border-gray-100">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          {language === 'gu' ? 'બાયોમેટ્રિક લોક (ફિંગરપ્રિન્ટ / ફેસ આઈડી)' : 'Biometric Lock (Fingerprint / FaceID)'}
                        </label>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          {isBiometricRegistered ? (
                            <>
                              <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                                <Fingerprint className="w-5 h-5" />
                                <span>{language === 'gu' ? 'બાયોમેટ્રિક લોક સક્રિય છે' : 'Biometrics registered'}</span>
                              </div>
                              <button
                                onClick={removeBiometrics}
                                className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-center"
                              >
                                {language === 'gu' ? 'દૂર કરો' : 'Remove'}
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={registerBiometrics}
                              className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              <Fingerprint className="w-4 h-4" />
                              {language === 'gu' ? 'બાયોમેટ્રિક સેટઅપ કરો' : 'Register Biometric Credential'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>

          </div>

          {/* Save Button Row */}
          <div className="flex justify-end pt-4 pb-24 sm:pb-6">
            <button
              onClick={handleSave}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl shadow transition-all flex items-center justify-center gap-2"
            >
              {t('saveConfiguration')}
            </button>
          </div>

          {/* Auth Verification Modal */}
          {showAuthModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black bg-opacity-60 sm:p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 animate-scale-in border border-gray-100">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 p-3 bg-blue-50 text-blue-600 rounded-full animate-bounce">
                    <Shield className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {language === 'gu' ? 'સુરક્ષા ચકાસણી' : 'Security Verification'}
                  </h3>
                  <p className="text-xs text-gray-500 mb-6">
                    {language === 'gu' 
                      ? 'સેટિંગ બદલવા માટે તમારો પિન અથવા બાયોમેટ્રિક દાખલ કરો.' 
                      : 'Enter your PIN or use biometrics to verify it\'s you.'}
                  </p>

                  <form onSubmit={handleAuthPinSubmit} className="w-full space-y-4">
                    <div className="relative max-w-[200px] mx-auto">
                      <Key className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                      <input
                        type="password"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        maxLength={4}
                        value={authPin}
                        onChange={(e) => setAuthPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="w-full py-2.5 pl-10 pr-4 text-gray-900 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-mono text-lg tracking-widest text-center"
                        placeholder="••••"
                        autoFocus
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAuthModal(false);
                          setPendingToggle(null);
                        }}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        {language === 'gu' ? 'રદ કરો' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        disabled={authPin.length !== 4}
                        className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        {language === 'gu' ? 'ચકાસો' : 'Verify'}
                      </button>
                    </div>

                    {isBiometricRegistered && (
                      <button
                        type="button"
                        onClick={handleAuthBiometric}
                        className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 rounded-xl transition-colors mt-2"
                      >
                        <Fingerprint className="w-4 h-4" />
                        {language === 'gu' ? 'બાયોમેટ્રિક સ્કેન કરો' : 'Scan Biometrics'}
                      </button>
                    )}
                  </form>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default Settings;
