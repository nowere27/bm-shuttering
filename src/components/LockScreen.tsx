import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Lock, Shield, Fingerprint } from 'lucide-react';
import toast from 'react-hot-toast';

interface LockScreenProps {
  children: React.ReactNode;
}

const LockScreen: React.FC<LockScreenProps> = ({ children }) => {
  const { t, language } = useLanguage();
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    // Check if security lock is configured in settings
    const isSecurityEnabled = localStorage.getItem('security_lock_enabled') === 'true';
    // If enabled, lock on initial app launch/load
    return isSecurityEnabled;
  });

  const [pin, setPin] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);
  const [hasBiometrics, setHasBiometrics] = useState<boolean>(false);

  // Check if biometric credential authentication is supported
  useEffect(() => {
    if (window.PublicKeyCredential && 
        PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then((available) => {
          if (available) setHasBiometrics(true);
        })
        .catch((err) => console.error("Error checking platform authenticator:", err));
    }
  }, []);

  // Automatically trigger biometric unlock on load if active
  useEffect(() => {
    if (isLocked && hasBiometrics) {
      // Small timeout to let PWA layout load smoothly before prompting biometric dialog
      const timer = setTimeout(() => {
        handleBiometricUnlock();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLocked, hasBiometrics]);

  const handleBiometricUnlock = async () => {
    try {
      // Local authentication check using credential manager API
      if (!window.PublicKeyCredential) {
        toast.error("Biometrics not supported on this browser");
        return;
      }

      // Check if security lock credentials exist
      const savedCredIdHex = localStorage.getItem('security_lock_cred_id');
      if (!savedCredIdHex) {
        // Fallback: If no credential is bound yet, let them authenticate using PIN
        toast.error(language === 'gu' ? "પ્રથમ વાર બાયોમેટ્રિક સેટઅપ કરો" : "Setup Biometrics first in Settings");
        return;
      }

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      // Convert stored hex ID back to buffer
      const credIdBuffer = new Uint8Array(
        savedCredIdHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
      );

      const options: CredentialRequestOptions = {
        publicKey: {
          challenge,
          timeout: 60000,
          allowCredentials: [
            {
              type: 'public-key',
              id: credIdBuffer,
            },
          ],
          userVerification: 'required',
        },
      };

      const assertion = await navigator.credentials.get(options);
      if (assertion) {
        setIsLocked(false);
        toast.success(language === 'gu' ? "અનલોક સફળ રહ્યું" : "Unlock Successful!");
      }
    } catch (err: any) {
      console.warn("Biometric verification cancelled or failed:", err);
      // Suppress toast if aborted/cancelled by user
      if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
        toast.error(language === 'gu' ? "બાયોમેટ્રિક વેરિફિકેશન નિષ્ફળ" : "Biometric Verification Failed");
      }
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const savedPin = localStorage.getItem('security_lock_pin');
    
    // Default fallback pin for initial setup instructions
    const targetPin = savedPin || '1234';

    if (pin === targetPin) {
      setIsLocked(false);
      setPinError(false);
      toast.success(language === 'gu' ? "અનલોક સફળ રહ્યું" : "Unlock Successful!");
    } else {
      setPinError(true);
      setPin('');
      toast.error(language === 'gu' ? "ખોટો પિન!" : "Incorrect PIN!");
      // Vibrate on fail if API exists
      if (navigator.vibrate) navigator.vibrate(100);
    }
  };

  const handleKeyPress = (num: number) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setPinError(false);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  // If pin length reaches 4, automatically validate
  useEffect(() => {
    if (pin.length === 4) {
      const savedPin = localStorage.getItem('security_lock_pin') || '1234';
      if (pin === savedPin) {
        setIsLocked(false);
        setPinError(false);
        toast.success(language === 'gu' ? "અનલોક સફળ રહ્યું" : "Unlock Successful!");
      } else {
        setPinError(true);
        setPin('');
        toast.error(language === 'gu' ? "ખોટો પિન!" : "Incorrect PIN!");
        if (navigator.vibrate) navigator.vibrate(100);
      }
    }
  }, [pin]);

  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900 text-white select-none">
      <div className="w-full max-w-sm px-6 flex flex-col items-center">
        
        {/* Shield Icon */}
        <div className="mb-8 p-4 bg-blue-600/10 border border-blue-500/20 rounded-full animate-pulse text-blue-500">
          <Shield className="w-12 h-12" />
        </div>

        <h1 className="text-xl font-bold text-center mb-1">
          {language === 'gu' ? 'ખાતા કેન્દ્ર' : 'Khata Kendra'}
        </h1>
        <p className="text-sm text-slate-400 text-center mb-8">
          {language === 'gu' ? 'એપ્લિકેશન અનલોક કરવા પિન દાખલ કરો' : 'Enter PIN to unlock application'}
        </p>

        {/* PIN Indicators */}
        <div className="flex gap-4 mb-10 justify-center">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                pinError
                  ? 'border-red-500 bg-red-500 scale-110 animate-bounce'
                  : index < pin.length
                  ? 'border-blue-500 bg-blue-500 scale-110'
                  : 'border-slate-600 bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* Keypad Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6 w-full max-w-[280px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="w-16 h-16 rounded-full bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-xl font-bold flex items-center justify-center outline-none border border-slate-700/50"
            >
              {num}
            </button>
          ))}
          
          {/* Biometrics button or empty */}
          {hasBiometrics ? (
            <button
              onClick={handleBiometricUnlock}
              className="w-16 h-16 rounded-full bg-blue-900/30 border border-blue-500/30 hover:bg-blue-900/50 active:scale-95 transition-all flex items-center justify-center text-blue-400 outline-none"
              title="Biometric Authentication"
            >
              <Fingerprint className="w-7 h-7" />
            </button>
          ) : (
            <div className="w-16 h-16" />
          )}

          <button
            onClick={() => handleKeyPress(0)}
            className="w-16 h-16 rounded-full bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-xl font-bold flex items-center justify-center outline-none border border-slate-700/50"
          >
            0
          </button>

          <button
            onClick={handleBackspace}
            className="w-16 h-16 rounded-full bg-slate-850 hover:bg-slate-800 active:scale-95 transition-all text-sm font-semibold flex items-center justify-center text-slate-400 outline-none"
          >
            {language === 'gu' ? 'સાફ' : 'Del'}
          </button>
        </div>

        {/* Setup Warning for fallback */}
        {!localStorage.getItem('security_lock_pin') && (
          <p className="text-xs text-yellow-500/80 text-center bg-yellow-500/10 py-1.5 px-3 rounded-lg border border-yellow-500/20">
            {language === 'gu'
              ? 'પિન સેટ નથી. ડિફોલ્ટ પિન "1234" નો ઉપયોગ કરો.'
              : 'PIN not configured. Use default PIN "1234".'}
          </p>
        )}

      </div>
    </div>
  );
};

export default LockScreen;
