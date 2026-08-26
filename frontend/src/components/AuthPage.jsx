import { useState } from 'react'
import logo from '../assets/sahai-india-logo.png'
import { signIn, signUp } from '../services/authApi.js'

const emptyForm = {
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  userType: 'citizen',
}

function AuthPage({ initialMode, onBack }) {
  const [mode, setMode] = useState(initialMode)
  const [form, setForm] = useState(emptyForm)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  const isSignup = mode === 'signup'

  const updateField = ({ target: { name, value } }) => {
    const nextValue = name === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value
    setForm((current) => ({ ...current, [name]: nextValue }))
    setError('')
  }

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setForm(emptyForm)
    setError('')
    setSuccess(null)
  }

  const validate = () => {
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Enter a valid email address.'
    if (isSignup && !/^\d{10}$/.test(form.phone)) return 'Enter a valid 10-digit phone number.'
    if (isSignup && form.password.length < 8) return 'Password must contain at least 8 characters.'
    if (!isSignup && !form.password) return 'Enter your password.'
    if (isSignup && form.password !== form.confirmPassword) return 'Passwords do not match.'
    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = isSignup
        ? await signUp({ email: form.email.trim(), phone: form.phone, password: form.password, userType: form.userType })
        : await signIn({ email: form.email.trim(), password: form.password })

      const user = result.data || {}
      sessionStorage.setItem('sahai-user', JSON.stringify({ id: user.id, email: user.email, userType: user.userType }))
      setSuccess({ message: result.message || (isSignup ? 'Account created successfully.' : 'Signed in successfully.'), user })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return <main className="grid min-h-screen place-items-center bg-[#fffaf2] px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-green-100 bg-white p-8 text-center shadow-xl sm:p-10">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-50 text-3xl text-india-green">✓</span>
        <p className="mt-6 text-xs font-extrabold uppercase tracking-[.2em] text-india-green">Authentication successful</p>
        <h1 className="mt-3 font-serif text-3xl font-bold text-navy">Welcome to Sahai India</h1>
        <p className="mt-3 leading-7 text-slate-600">{success.message}</p>
        {success.user?.email && <p className="mt-2 text-sm font-semibold text-slate-500">{success.user.email}</p>}
        <button onClick={onBack} className="mt-8 w-full rounded-xl bg-navy px-5 py-3.5 font-bold text-white transition hover:bg-blue-950">Continue to homepage</button>
      </section>
    </main>
  }

  return <main className="relative min-h-screen overflow-hidden bg-[#f7f9fc]">
    <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-saffron via-white to-india-green" />
    <div className="fine-grid absolute inset-0 opacity-60" />
    <div className="relative mx-auto grid min-h-screen max-w-7xl items-stretch lg:grid-cols-[.9fr_1.1fr]">
      <section className="relative hidden overflow-hidden bg-[#071d43] px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-32 top-24 h-96 w-96 rounded-full border-[64px] border-white/[.04]" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-india-green/15 blur-2xl" />
        <button onClick={onBack} className="relative flex w-fit items-center gap-2 text-sm font-semibold text-blue-100 transition hover:text-white">← Back to homepage</button>
        <div className="relative my-auto max-w-lg">
          <div className="mb-8 flex items-center gap-4"><span className="rounded-2xl bg-white p-2"><img src={logo} alt="" className="h-16 w-16 object-contain" /></span><span><strong className="block font-serif text-2xl">Sahai India</strong><span className="text-xs uppercase tracking-[.18em] text-blue-200">Help • Hope • Humanity</span></span></div>
          <p className="text-xs font-extrabold uppercase tracking-[.22em] text-orange-300">Safe • Simple • Secure</p>
          <h2 className="mt-4 font-serif text-5xl font-bold leading-tight">Your connection to trusted support.</h2>
          <p className="mt-6 max-w-md text-lg leading-8 text-blue-100">Access organisations, services, and community programmes through one citizen-first platform.</p>
          <div className="mt-10 grid grid-cols-3 gap-3 border-t border-white/10 pt-7 text-center text-xs text-blue-100"><span>Verified network</span><span>Private access</span><span>People first</span></div>
        </div>
        <p className="relative text-xs text-blue-300">Sahai India is not an official Government of India website unless expressly authorised.</p>
      </section>

      <section className="relative flex items-center justify-center px-4 py-10 sm:px-8 lg:px-14">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-9">
          <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm font-bold text-navy lg:hidden">← Back to homepage</button>
          <div className="mb-8 lg:hidden"><img src={logo} alt="Sahai India" className="h-16 w-16 object-contain" /></div>
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-orange-700">{isSignup ? 'Join the network' : 'Welcome back'}</p>
          <h1 className="mt-3 font-serif text-3xl font-bold text-navy sm:text-4xl">{isSignup ? 'Create your account' : 'Sign in to Sahai India'}</h1>
          <p className="mt-3 leading-7 text-slate-600">{isSignup ? 'Register as a citizen or organisation staff member.' : 'Enter your registered details to continue.'}</p>

          <div className="mt-7 grid grid-cols-2 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Authentication mode">
            <button type="button" onClick={() => switchMode('login')} className={`rounded-lg px-4 py-2.5 text-sm font-bold transition ${!isSignup ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'}`}>Log in</button>
            <button type="button" onClick={() => switchMode('signup')} className={`rounded-lg px-4 py-2.5 text-sm font-bold transition ${isSignup ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'}`}>Sign up</button>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
            {isSignup && <fieldset><legend className="mb-2 text-sm font-bold text-slate-700">I am registering as</legend><div className="grid grid-cols-2 gap-3"><label className={`cursor-pointer rounded-xl border p-3 text-sm transition ${form.userType === 'citizen' ? 'border-orange-300 bg-orange-50 text-navy' : 'border-slate-200 text-slate-600'}`}><input type="radio" name="userType" value="citizen" checked={form.userType === 'citizen'} onChange={updateField} className="mr-2 accent-orange-600" />Citizen</label><label className={`cursor-pointer rounded-xl border p-3 text-sm transition ${form.userType === 'org_staff' ? 'border-green-300 bg-green-50 text-navy' : 'border-slate-200 text-slate-600'}`}><input type="radio" name="userType" value="org_staff" checked={form.userType === 'org_staff'} onChange={updateField} className="mr-2 accent-green-700" />Organisation staff</label></div></fieldset>}

            <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">Email address</span><input name="email" type="email" autoComplete="email" value={form.email} onChange={updateField} placeholder="name@example.com" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-navy focus:ring-4 focus:ring-blue-100" required /></label>

            {isSignup && <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">Mobile number</span><div className="flex rounded-xl border border-slate-300 bg-white transition focus-within:border-navy focus-within:ring-4 focus-within:ring-blue-100"><span className="grid place-items-center border-r border-slate-200 px-4 text-sm font-bold text-slate-500">+91</span><input name="phone" type="tel" inputMode="numeric" autoComplete="tel" value={form.phone} onChange={updateField} placeholder="10-digit number" className="min-w-0 flex-1 rounded-r-xl px-4 py-3.5 text-slate-900 outline-none placeholder:text-slate-400" required /></div></label>}

            <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">Password</span><div className="flex rounded-xl border border-slate-300 bg-white transition focus-within:border-navy focus-within:ring-4 focus-within:ring-blue-100"><input name="password" type={showPassword ? 'text' : 'password'} autoComplete={isSignup ? 'new-password' : 'current-password'} value={form.password} onChange={updateField} placeholder={isSignup ? 'At least 8 characters' : 'Enter your password'} className="min-w-0 flex-1 rounded-l-xl px-4 py-3.5 text-slate-900 outline-none placeholder:text-slate-400" required /><button type="button" onClick={() => setShowPassword((visible) => !visible)} className="px-4 text-xs font-bold text-navy">{showPassword ? 'Hide' : 'Show'}</button></div></label>

            {isSignup && <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">Confirm password</span><input name="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.confirmPassword} onChange={updateField} placeholder="Enter the same password" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-navy focus:ring-4 focus:ring-blue-100" required /></label>}

            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">{error}</div>}

            <button type="submit" disabled={loading} className="w-full rounded-xl border border-navy bg-navy px-5 py-3.5 font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-200 hover:bg-gradient-to-r hover:from-saffron hover:via-white hover:to-india-green hover:text-navy disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0">{loading ? 'Please wait…' : isSignup ? 'Create account' : 'Log in securely'}</button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">{isSignup ? 'Already registered?' : 'New to Sahai India?'} <button type="button" onClick={() => switchMode(isSignup ? 'login' : 'signup')} className="font-bold text-orange-700 hover:underline">{isSignup ? 'Log in' : 'Create an account'}</button></p>
        </div>
      </section>
    </div>
  </main>
}

export default AuthPage
