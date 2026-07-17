import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Shield, Fingerprint, Delete, AlertTriangle, Lock, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface LockScreenProps {
  children: React.ReactNode;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 1000; // 30 seconds lockout

const LockScreen: React.FC<LockScreenProps> = ({ children }) => {
  const { language } = useLanguage();
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return localStorage.getItem('security_lock_enabled') === 'true';
  });

  const [pin, setPin] = useState<string>('');
  const [shake, setShake] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [hasBiometrics, setHasBiometrics] = useState<boolean>(false);
  const [biometricLoading, setBiometricLoading] = useState<boolean>(false);

  // Rate limiting state
  const [attempts, setAttempts] = useState<number>(() => {
    const stored = localStorage.getItem('lock_attempts');
    return stored ? parseInt(stored, 10) : 0;
  });
  const [lockedOutUntil, setLockedOutUntil] = useState<number | null>(() => {
    const stored = localStorage.getItem('lock_lockout_until');
    return stored ? parseInt(stored, 10) : null;
  });
  const [lockedOutSecondsLeft, setLockedOutSecondsLeft] = useState<number>(0);

  const isLockedOut = lockedOutUntil !== null && Date.now() < lockedOutUntil;

  const t = (gu: string, en: string) => (language === 'gu' ? gu : en);

  // --- Countdown Timer for Lockout ---
  useEffect(() => {
    if (!isLockedOut) {
      setLockedOutSecondsLeft(0);
      return;
    }
    const tick = () => {
      const remaining = Math.ceil(((lockedOutUntil ?? 0) - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedOutUntil(null);
        localStorage.removeItem('lock_lockout_until');
        setAttempts(0);
        localStorage.removeItem('lock_attempts');
        setLockedOutSecondsLeft(0);
      } else {
        setLockedOutSecondsLeft(remaining);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isLockedOut, lockedOutUntil]);

  // --- Biometric Check ---
  useEffect(() => {
    if (!window.PublicKeyCredential) return;
    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.()
      .then((available) => { if (available) setHasBiometrics(true); })
      .catch(() => {});
  }, []);

  // Auto-trigger biometrics on load
  useEffect(() => {
    if (isLocked && hasBiometrics && !isLockedOut) {
      const timer = setTimeout(() => triggerBiometricUnlock(), 700);
      return () => clearTimeout(timer);
    }
  }, [isLocked, hasBiometrics]);

  // --- Keyboard Support ---
  useEffect(() => {
    if (!isLocked) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleKeyPress(parseInt(e.key, 10));
      else if (e.key === 'Backspace') handleBackspace();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isLocked, pin, isLockedOut]);

  // --- Auto-validate when 4 digits entered ---
  useEffect(() => {
    if (pin.length === 4) {
      validatePin(pin);
    }
  }, [pin]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
    if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
  };

  const unlockSuccess = () => {
    setSuccess(true);
    setAttempts(0);
    localStorage.removeItem('lock_attempts');
    localStorage.removeItem('lock_lockout_until');
    setTimeout(() => setIsLocked(false), 600);
  };

  const validatePin = (inputPin: string) => {
    if (isLockedOut) return;
    const savedPin = localStorage.getItem('security_lock_pin') || '1234';
    if (inputPin === savedPin) {
      unlockSuccess();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      localStorage.setItem('lock_attempts', String(newAttempts));
      setPin('');
      triggerShake();
      if (newAttempts >= MAX_ATTEMPTS) {
        const lockoutEnd = Date.now() + LOCKOUT_DURATION_MS;
        setLockedOutUntil(lockoutEnd);
        localStorage.setItem('lock_lockout_until', String(lockoutEnd));
        toast.error(t('ઘણા ખોટા પ્રયત્નો. 30 સેકન્ડ રાહ જુઓ.', `Too many attempts. Wait 30 seconds.`));
      } else {
        toast.error(t(
          `ખોટો પિન! ${MAX_ATTEMPTS - newAttempts} પ્રયત્ન બાકી`,
          `Wrong PIN! ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts === 1 ? '' : 's'} left`
        ));
      }
    }
  };

  const handleKeyPress = (num: number) => {
    if (isLockedOut || pin.length >= 4 || success) return;
    setPin(prev => prev + String(num));
  };

  const handleBackspace = () => {
    if (isLockedOut || success) return;
    setPin(prev => prev.slice(0, -1));
  };

  const triggerBiometricUnlock = useCallback(async () => {
    if (!window.PublicKeyCredential || biometricLoading || isLockedOut) return;
    const savedCredIdHex = localStorage.getItem('security_lock_cred_id');
    if (!savedCredIdHex) {
      toast.error(t('સેટિંગ્સ માં બાયોમેટ્રિક સ્થાપિત કરો', 'Setup Biometrics in Settings first'));
      return;
    }
    setBiometricLoading(true);
    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      const credIdBuffer = new Uint8Array(
        savedCredIdHex.match(/.{1,2}/g)!.map(b => parseInt(b, 16))
      );
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          allowCredentials: [{ type: 'public-key', id: credIdBuffer }],
          userVerification: 'required',
        },
      });
      if (assertion) unlockSuccess();
    } catch (err: any) {
      if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
        toast.error(t('બાયોમેટ્રિક નિષ્ફળ', 'Biometric failed'));
      }
    } finally {
      setBiometricLoading(false);
    }
  }, [biometricLoading, isLockedOut]);

  if (!isLocked) return <>{children}</>;

  const attemptsLeft = MAX_ATTEMPTS - attempts;
  const pinHasDefaultWarning = !localStorage.getItem('security_lock_pin');

  return (
    <div
      className="lock-screen-root"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(145deg, #0a0f1e 0%, #0d1424 50%, #0a1228 100%)',
        userSelect: 'none', WebkitUserSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Background Blobs */}
      <div style={{
        position: 'absolute', width: 340, height: 340,
        borderRadius: '50%', top: '-100px', left: '-60px',
        background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 280, height: 280,
        borderRadius: '50%', bottom: '-80px', right: '-40px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <style>{`
        @keyframes ls-shake {
          0%,100%{transform:translateX(0)} 15%{transform:translateX(-8px)}
          30%{transform:translateX(8px)} 45%{transform:translateX(-6px)}
          60%{transform:translateX(6px)} 75%{transform:translateX(-3px)} 90%{transform:translateX(3px)}
        }
        @keyframes ls-pop-in {
          0%{transform:scale(0.3);opacity:0}
          70%{transform:scale(1.12)}
          100%{transform:scale(1);opacity:1}
        }
        @keyframes ls-success-ring {
          0%{box-shadow:0 0 0 0 rgba(34,197,94,0.5)}
          100%{box-shadow:0 0 0 22px rgba(34,197,94,0)}
        }
        @keyframes ls-pulse-dot {
          0%,100%{transform:scale(1)} 50%{transform:scale(1.25)}
        }
        @keyframes ls-fade-in {
          from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)}
        }
        @keyframes ls-spin-slow {
          from{transform:rotate(0deg)} to{transform:rotate(360deg)}
        }
        .ls-fade-in { animation: ls-fade-in 0.45s ease both; }
        .ls-pin-dot-filled { animation: ls-pop-in 0.18s ease both; }
        .ls-numpad-btn:active { transform: scale(0.92); }
        .ls-numpad-btn:hover { background: rgba(255,255,255,0.10) !important; }
      `}</style>

      <div
        className="ls-fade-in"
        style={{
          width: '100%', maxWidth: 340,
          padding: '0 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}
      >
        {/* App Shield Icon */}
        <div style={{
          marginBottom: 20,
          width: 72, height: 72,
          borderRadius: '50%',
          background: success
            ? 'linear-gradient(135deg,#16a34a,#22c55e)'
            : 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: success
            ? '0 0 0 0 rgba(34,197,94,0.4)'
            : '0 8px 32px rgba(59,130,246,0.35)',
          transition: 'all 0.4s ease',
          animation: success ? 'ls-success-ring 0.6s ease forwards' : undefined,
        }}>
          {success
            ? <CheckCircle2 style={{ width: 36, height: 36, color: '#fff' }} />
            : <Shield style={{ width: 36, height: 36, color: '#fff' }} />
          }
        </div>

        {/* App Title */}
        <h1 style={{
          fontSize: 20, fontWeight: 700,
          color: '#f1f5f9', margin: '0 0 4px',
          letterSpacing: '-0.3px',
          textAlign: 'center',
        }}>
          {t('ખાતા કેન્દ્ર', 'Khata Kendra')}
        </h1>
        <p style={{
          fontSize: 13, color: '#64748b',
          margin: '0 0 28px', textAlign: 'center',
          lineHeight: 1.5,
        }}>
          {isLockedOut
            ? t('⛔ ઘણા ખોટા પ્રયત્નો', '⛔ Too many failed attempts')
            : success
            ? t('✓ અનલોક સફળ', '✓ Unlocked Successfully')
            : t('પિન દાખલ કરો', 'Enter your PIN to continue')}
        </p>

        {/* PIN Dots */}
        <div
          style={{
            display: 'flex', gap: 16,
            marginBottom: 32, justifyContent: 'center',
            animation: shake ? 'ls-shake 0.55s ease' : undefined,
          }}
        >
          {[0, 1, 2, 3].map(i => {
            const filled = i < pin.length;
            const errored = shake;
            const isSuccess = success && filled;
            return (
              <div
                key={i}
                className={filled && !errored ? 'ls-pin-dot-filled' : undefined}
                style={{
                  width: 16, height: 16,
                  borderRadius: '50%',
                  border: `2.5px solid ${
                    isSuccess ? '#22c55e'
                    : errored && filled ? '#ef4444'
                    : filled ? '#3b82f6'
                    : '#334155'
                  }`,
                  background: filled
                    ? (isSuccess ? '#22c55e' : errored ? '#ef4444' : '#3b82f6')
                    : 'transparent',
                  transition: 'all 0.15s ease',
                  boxShadow: filled && !errored && !isSuccess
                    ? '0 0 10px rgba(59,130,246,0.6)'
                    : undefined,
                }}
              />
            );
          })}
        </div>

        {/* Lockout Banner */}
        {isLockedOut ? (
          <div style={{
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.35)',
            borderRadius: 14,
            padding: '16px 20px',
            marginBottom: 28,
            width: '100%',
            textAlign: 'center',
          }}>
            <AlertTriangle style={{ width: 22, height: 22, color: '#f87171', marginBottom: 6 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: '#f87171', margin: '0 0 4px' }}>
              {t('અસ્થાયી રૂપે બ્લૉક', 'Temporarily Blocked')}
            </p>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
              {t(`${lockedOutSecondsLeft} સેકન્ડ પ્રતીક્ષા કરો`, `Please wait ${lockedOutSecondsLeft}s`)}
            </p>
            {/* Countdown bar */}
            <div style={{
              marginTop: 10, height: 4,
              background: 'rgba(239,68,68,0.2)',
              borderRadius: 99, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${(lockedOutSecondsLeft / (LOCKOUT_DURATION_MS / 1000)) * 100}%`,
                background: '#ef4444',
                borderRadius: 99,
                transition: 'width 1s linear',
              }} />
            </div>
          </div>
        ) : (
          /* Attempts warning */
          !success && attempts > 0 && attempts < MAX_ATTEMPTS && (
            <div style={{
              background: 'rgba(245,158,11,0.10)',
              border: '1px solid rgba(245,158,11,0.28)',
              borderRadius: 10, padding: '8px 14px',
              marginBottom: 20, textAlign: 'center',
            }}>
              <p style={{ fontSize: 12, color: '#fbbf24', margin: 0 }}>
                {t(
                  `⚠️ ${attemptsLeft} પ્રયત્ન બાકી`,
                  `⚠️ ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining`
                )}
              </p>
            </div>
          )
        )}

        {/* Numpad */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)',
          gap: 14,
          width: '100%',
          maxWidth: 280,
          opacity: isLockedOut || success ? 0.35 : 1,
          pointerEvents: isLockedOut || success ? 'none' : 'auto',
          transition: 'opacity 0.3s ease',
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <NumpadButton key={num} label={String(num)} onPress={() => handleKeyPress(num)} />
          ))}

          {/* Biometric / Empty */}
          {hasBiometrics ? (
            <button
              className="ls-numpad-btn"
              onClick={triggerBiometricUnlock}
              disabled={biometricLoading || isLockedOut || success}
              style={numpadBtnStyle({ special: true, loading: biometricLoading })}
              title={t('બાયોમેટ્રિક', 'Biometric Unlock')}
            >
              {biometricLoading
                ? <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    border: '2.5px solid rgba(99,102,241,0.3)',
                    borderTopColor: '#818cf8',
                    animation: 'ls-spin-slow 0.8s linear infinite',
                  }} />
                : <Fingerprint style={{ width: 24, height: 24, color: '#818cf8' }} />
              }
            </button>
          ) : (
            <div style={{ width: '100%', aspectRatio: '1/1' }} />
          )}

          <NumpadButton label="0" onPress={() => handleKeyPress(0)} />

          {/* Backspace */}
          <button
            className="ls-numpad-btn"
            onClick={handleBackspace}
            disabled={pin.length === 0 || isLockedOut || success}
            style={numpadBtnStyle({ disabled: pin.length === 0 })}
          >
            <Delete style={{
              width: 22, height: 22,
              color: pin.length === 0 ? '#334155' : '#94a3b8',
              transition: 'color 0.2s',
            }} />
          </button>
        </div>

        {/* Default PIN warning */}
        {pinHasDefaultWarning && !isLockedOut && (
          <div style={{
            marginTop: 24,
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 10, padding: '8px 14px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 11, color: '#fbbf24', margin: 0 }}>
              {t(
                'ⓘ ડિફૉલ્ટ પિન: 1234 | સ્ટ. > સ. > પ. ઉપર પિન સ્ટ. ફ. કરો',
                'ⓘ Default PIN: 1234 — Set a custom PIN in Settings'
              )}
            </p>
          </div>
        )}

        {/* Lock icon footer */}
        <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 6, opacity: 0.3 }}>
          <Lock style={{ width: 12, height: 12, color: '#64748b' }} />
          <span style={{ fontSize: 10, color: '#64748b', letterSpacing: '0.5px' }}>
            {t('સુરક્ષિત', 'SECURED')}
          </span>
        </div>
      </div>
    </div>
  );
};

// ── Helpers ──────────────────────────────────────────────────────────────

function numpadBtnStyle(opts: { special?: boolean; loading?: boolean; disabled?: boolean } = {}): React.CSSProperties {
  return {
    width: '100%',
    aspectRatio: '1/1',
    borderRadius: '50%',
    border: opts.special
      ? '1.5px solid rgba(99,102,241,0.30)'
      : '1.5px solid rgba(255,255,255,0.07)',
    background: opts.special
      ? 'rgba(99,102,241,0.10)'
      : 'rgba(255,255,255,0.055)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: opts.disabled ? 'default' : 'pointer',
    transition: 'all 0.15s ease',
    outline: 'none',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
  };
}

interface NumpadButtonProps { label: string; onPress: () => void; }
const NumpadButton: React.FC<NumpadButtonProps> = ({ label, onPress }) => (
  <button
    className="ls-numpad-btn"
    onClick={onPress}
    style={{
      ...numpadBtnStyle(),
      fontSize: 22,
      fontWeight: 500,
      color: '#e2e8f0',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      letterSpacing: '-0.5px',
    }}
  >
    {label}
  </button>
);

export default LockScreen;
