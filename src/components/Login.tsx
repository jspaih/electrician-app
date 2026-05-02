import { useState } from 'react'
import { Zap, Fingerprint, Eye, EyeOff } from 'lucide-react'
import { useT, useLang } from '../hooks/useT'
import { useStore } from '../store/useStore'

interface Props {
  onLogin: () => void
}

const DEFAULT_USER = 'admin'
const DEFAULT_PASS = 'admin'

const L = {
  en: {
    appName: 'Electrician Manager',
    signInSubtitle: 'Sign in to your account',
    username: 'Username',
    password: 'Password',
    usernamePlaceholder: 'Enter username',
    passwordPlaceholder: 'Enter password',
    signIn: 'Sign In',
    or: 'or',
    biometricIdle: 'Use Biometric Login',
    biometricLoading: 'Authenticating...',
    defaultHint: 'Default: admin / admin',
    wrongCreds: 'Invalid username or password',
    noWebAuthn: 'Biometric authentication is not supported on this device',
    noAuthenticator: 'No biometric authenticator found on this device',
    cancelled: 'Biometric authentication was cancelled',
    biometricFailed: 'Biometric authentication failed. Please use username/password.',
    langToggle: 'العربية',
  },
  ar: {
    appName: 'مدير الأعمال للكهربائي',
    signInSubtitle: 'سجّل الدخول إلى حسابك',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    usernamePlaceholder: 'أدخل اسم المستخدم',
    passwordPlaceholder: 'أدخل كلمة المرور',
    signIn: 'تسجيل الدخول',
    or: 'أو',
    biometricIdle: 'استخدام الدخول البيومتري',
    biometricLoading: 'جاري المصادقة...',
    defaultHint: 'الافتراضي: admin / admin',
    wrongCreds: 'اسم المستخدم أو كلمة المرور غير صحيحة',
    noWebAuthn: 'المصادقة البيومترية غير مدعومة على هذا الجهاز',
    noAuthenticator: 'لم يتم العثور على مصادق بيومتري على هذا الجهاز',
    cancelled: 'تم إلغاء المصادقة البيومترية',
    biometricFailed: 'فشلت المصادقة البيومترية. يرجى استخدام اسم المستخدم / كلمة المرور.',
    langToggle: 'English',
  },
} as const

export default function Login({ onLogin }: Props) {
  const t = useT(L)
  const lang = useLang()
  const updateSettings = useStore(s => s.updateSettings)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function toggleLang() {
    updateSettings({ language: lang === 'en' ? 'ar' : 'en' })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const storedUser = localStorage.getItem('app_username') || DEFAULT_USER
    const storedPass = localStorage.getItem('app_password') || DEFAULT_PASS
    if (username === storedUser && password === storedPass) {
      localStorage.setItem('app_authenticated', 'true')
      onLogin()
    } else {
      setError(t.wrongCreds)
    }
  }

  async function handleBiometric() {
    setError('')
    setLoading(true)

    try {
      if (!window.PublicKeyCredential) {
        setError(t.noWebAuthn)
        setLoading(false)
        return
      }

      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      if (!available) {
        setError(t.noAuthenticator)
        setLoading(false)
        return
      }

      const credentialId = localStorage.getItem('app_biometric_credId')

      if (!credentialId) {
        const challenge = new Uint8Array(32)
        crypto.getRandomValues(challenge)

        const createOptions: PublicKeyCredentialCreationOptions = {
          challenge,
          rp: { name: 'Electrician Manager', id: window.location.hostname },
          user: {
            id: new Uint8Array(16),
            name: 'admin',
            displayName: 'Admin User',
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 60000,
        }

        const credential = await navigator.credentials.create({ publicKey: createOptions }) as PublicKeyCredential
        if (credential) {
          const rawId = Array.from(new Uint8Array(credential.rawId))
          localStorage.setItem('app_biometric_credId', JSON.stringify(rawId))
          localStorage.setItem('app_authenticated', 'true')
          onLogin()
        }
      } else {
        const challenge = new Uint8Array(32)
        crypto.getRandomValues(challenge)
        const storedId = new Uint8Array(JSON.parse(credentialId))

        const getOptions: PublicKeyCredentialRequestOptions = {
          challenge,
          allowCredentials: [{ id: storedId, type: 'public-key' }],
          userVerification: 'required',
          timeout: 60000,
        }

        const assertion = await navigator.credentials.get({ publicKey: getOptions })
        if (assertion) {
          localStorage.setItem('app_authenticated', 'true')
          onLogin()
        }
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') setError(t.cancelled)
      else setError(t.biometricFailed)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-sm relative">
        {/* Language toggle */}
        <button
          onClick={toggleLang}
          className="absolute top-0 right-0 text-xs text-gray-500 hover:text-yellow-400 transition-colors"
        >
          {t.langToggle}
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-gray-900" />
          </div>
          <h1 className="text-2xl font-bold text-white">{t.appName}</h1>
          <p className="text-gray-500 text-sm mt-1">{t.signInSubtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="label">{t.username}</label>
            <input
              className="input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder={t.usernamePlaceholder}
              autoComplete="username"
              autoFocus
            />
          </div>
          <div>
            <label className="label">{t.password}</label>
            <div className="relative">
              <input
                className="input pr-10"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                autoComplete="current-password"
              />
              <button
                type="button"
                className={`absolute ${lang === 'ar' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300`}
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800/50 rounded-lg px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full py-2.5">
            {t.signIn}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-gray-800 px-2 text-gray-500">{t.or}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleBiometric}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:border-yellow-500 hover:text-yellow-300 transition-colors text-sm disabled:opacity-50"
          >
            <Fingerprint className="w-5 h-5" />
            {loading ? t.biometricLoading : t.biometricIdle}
          </button>
        </form>

        <p className="text-center text-xs text-gray-600 mt-4">
          {t.defaultHint}
        </p>
      </div>
    </div>
  )
}
