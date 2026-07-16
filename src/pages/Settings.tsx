import React from 'react';
import Navbar from '../components/Navbar';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { Settings as SettingsIcon, Globe, Layers, CheckCircle, Download, Type, Lock, Shield, Fingerprint, Key } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const Settings: React.FC = () => {
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
  } = useSettings();

  const [securityEnabled, setSecurityEnabled] = React.useState(() => localStorage.getItem('security_lock_enabled') === 'true');
  const [pin, setPin] = React.useState(() => localStorage.getItem('security_lock_pin') || '1234');
  const [hasBiometrics, setHasBiometrics] = React.useState(false);
  const [isBiometricRegistered, setIsBiometricRegistered] = React.useState(() => !!localStorage.getItem('security_lock_cred_id'));

  React.useEffect(() => {
    if (window.PublicKeyCredential && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => setHasBiometrics(available))
        .catch(err => console.error(err));
    }
  }, []);

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

      // Generate a compulsory random 4-digit PIN for backup
      const generatedPin = Math.floor(1000 + Math.random() * 9000).toString();

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
          
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
              <SettingsIcon className="w-6 h-6 animate-[spin_10s_linear_infinite]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('settings')}</h1>
              <p className="text-xs sm:text-sm text-gray-500">{t('settingsSubtitle')}</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-1">
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
                      className={`relative p-4 rounded-xl border text-left transition-all ${
                        dateSortingMethod === 'standard'
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
                      className={`relative p-4 rounded-xl border text-left transition-all ${
                        dateSortingMethod === 'jamaFirst'
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
                      className={`relative p-4 rounded-xl border text-left transition-all ${
                        defaultLedgerDownloadFormat === 'detailed'
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
                      className={`relative p-4 rounded-xl border text-left transition-all ${
                        defaultLedgerDownloadFormat === 'simple'
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
                      className={`relative p-4 rounded-xl border text-left transition-all ${
                        defaultLedgerDownloadFormat === 'split'
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
                        className={`flex flex-col items-center py-3 px-2 rounded-xl border transition-all ${
                          fontSize === preset.size
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
                        className={`text-[10px] cursor-pointer select-none transition-colors ${
                          fontSize === s ? 'text-blue-600 font-bold' : 'text-gray-400 hover:text-gray-600'
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
                  <div className="flex gap-3">
                    <button
                      onClick={() => setLanguage('gu')}
                      className={`px-6 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                        language === 'gu'
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      ગુજરાતી
                    </button>
                    <button
                      onClick={() => setLanguage('en')}
                      className={`px-6 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                        language === 'en'
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
              <div className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900">
                      {t('enableDriverMobileVehicle') || 'Enable Driver Mobile Number & Vehicle'}
                    </label>
                    <p className="text-xs text-gray-500">
                      {t('enableDriverMobileVehicleDesc') || 'Show fields for Driver Mobile and Vehicle details during Jama and Udhar challan creation.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDriverDetails(!showDriverDetails)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      showDriverDetails ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        showDriverDetails ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
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
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900">
                      {language === 'gu' ? 'એપ લોક ચાલુ કરો' : 'Enable Application Lock'}
                    </label>
                    <p className="text-xs text-gray-500">
                      {language === 'gu' ? 'મોબાઇલ PWA શરૂ થવા પર પિન અથવા ફિંગરપ્રિન્ટ પૂછશે.' : 'Require PIN or Biometrics authentication on app startup.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setSecurityEnabled(!securityEnabled)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      securityEnabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        securityEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {securityEnabled && (
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    
                    {/* PIN Input */}
                    <div className="max-w-xs">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center justify-between">
                        <span>{language === 'gu' ? '૪-અંકનો સુરક્ષા પિન' : '4-Digit Security PIN'}</span>
                        {isBiometricRegistered && (
                          <span className="text-[10px] bg-green-100 text-green-800 font-bold px-1.5 py-0.5 rounded">
                            {language === 'gu' ? 'બાયોમેટ્રિક બેકઅપ પિન' : 'Biometric Backup PIN'}
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <Key className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                        <input
                          type={isBiometricRegistered ? "text" : "password"}
                          pattern="[0-9]*"
                          inputMode="numeric"
                          maxLength={4}
                          value={pin}
                          disabled={isBiometricRegistered}
                          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          className={`w-full py-2.5 pl-10 pr-4 text-gray-900 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-mono text-lg tracking-widest text-center ${
                            isBiometricRegistered ? 'bg-gray-105 font-bold cursor-not-allowed text-blue-600' : ''
                          }`}
                          placeholder="••••"
                        />
                      </div>
                      {isBiometricRegistered && (
                        <p className="text-[11px] text-gray-500 mt-1">
                          {language === 'gu' 
                            ? 'બાયોમેટ્રિક સક્રિય હોવાને કારણે પિન આપોઆપ જનરેટ થયો છે.' 
                            : 'This PIN is automatically generated for biometric backup recovery.'}
                        </p>
                      )}
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
                                className="px-4 py-2 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                              >
                                {language === 'gu' ? 'દૂર કરો' : 'Remove'}
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={registerBiometrics}
                              className="px-4 py-2.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-2"
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
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl shadow transition-all flex items-center gap-2"
            >
                  {t('saveConfiguration')}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Settings;
