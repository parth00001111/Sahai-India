import { useId, useState } from 'react'
import logo from '../assets/sahai-india-logo.png'
import { createOrganisation } from '../services/organisationApi.js'

const organisationTypes = [
  ['ngo', 'NGO / nonprofit'], ['govt', 'Government organisation'], ['hospital', 'Hospital / health provider'],
  ['shelter', 'Shelter'], ['foodbank', 'Food bank'],
]
const legalStructures = [
  ['ngo_trust', 'NGO / Trust'], ['section8', 'Section 8 company'], ['society', 'Registered society'],
  ['govt_body', 'Government body'], ['social_enterprise', 'Social enterprise'], ['other', 'Other'],
]
const focusAreas = ['Education', 'Healthcare', 'Women & child welfare', 'Livelihoods', 'Disaster relief', 'Elder care', 'Environment', 'Legal aid']

const initialForm = {
  organisationName: '', organisationType: '', legalStructure: '', registrationNumber: '', yearEstablished: '',
  website: '', description: '', contactName: '', designation: '', email: '', phone: '', alternatePhone: '',
  address: '', city: '', district: '', state: '', pincode: '', serviceAreas: '', beneficiaries: '',
  focusAreas: [], registrationCertificate: null, panDocument: null, addressProof: null, logo: null,
  authorisedLetter: null, declaration: false,
}

function Field({ label, required, hint, children }) {
  return <label className="block">
    <span className="mb-2 block text-sm font-bold text-slate-700">{label}{required && <span className="ml-1 text-red-500">*</span>}</span>
    {children}
    {hint && <span className="mt-1.5 block text-xs leading-5 text-slate-500">{hint}</span>}
  </label>
}

function DocumentUpload({ id, label, help, required, file, onChange, accept = '.pdf,.jpg,.jpeg,.png' }) {
  return <label htmlFor={id} className={`group flex cursor-pointer items-start gap-4 rounded-2xl border border-dashed p-4 transition ${file ? 'border-green-300 bg-green-50/60' : 'border-slate-300 bg-slate-50 hover:border-orange-300 hover:bg-orange-50/40'}`}>
    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl ${file ? 'bg-white text-india-green' : 'bg-white text-navy shadow-sm'}`}>{file ? '✓' : '↑'}</span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-bold text-navy">{label}{required && <span className="ml-1 text-red-500">*</span>}</span>
      <span className="mt-1 block truncate text-xs leading-5 text-slate-500">{file ? file.name : help}</span>
      {file && <span className="mt-1 block text-xs font-bold text-india-green">Ready to upload · Change file</span>}
    </span>
    <input id={id} type="file" accept={accept} onChange={onChange} className="sr-only" />
  </label>
}

function OrganisationOnboarding({ user, onBack }) {
  const uploadPrefix = useId()
  const [form, setForm] = useState({ ...initialForm, email: user?.email || '' })
  const [error, setError] = useState('')
  const [submission, setSubmission] = useState(null)
  const [saving, setSaving] = useState(false)

  const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-navy focus:ring-4 focus:ring-blue-100'

  const updateField = ({ target: { name, value, type, checked } }) => {
    let nextValue = type === 'checkbox' ? checked : value
    if (['phone', 'alternatePhone'].includes(name)) nextValue = value.replace(/\D/g, '').slice(0, 10)
    if (name === 'pincode') nextValue = value.replace(/\D/g, '').slice(0, 6)
    setForm((current) => ({ ...current, [name]: nextValue }))
    setError('')
  }

  const updateFile = (name) => ({ target }) => {
    const file = target.files?.[0] || null
    if (file && file.size > 5 * 1024 * 1024) {
      setError(`${file.name} is larger than 5 MB.`)
      target.value = ''
      return
    }
    setForm((current) => ({ ...current, [name]: file }))
    setError('')
  }

  const toggleFocus = (area) => {
    setForm((current) => ({
      ...current,
      focusAreas: current.focusAreas.includes(area) ? current.focusAreas.filter((item) => item !== area) : [...current.focusAreas, area],
    }))
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const requiredFields = ['organisationName', 'organisationType', 'legalStructure', 'registrationNumber', 'yearEstablished', 'description', 'contactName', 'designation', 'email', 'phone', 'address', 'city', 'district', 'state', 'pincode', 'serviceAreas']
    if (requiredFields.some((field) => !String(form[field]).trim())) return setError('Please complete all fields marked with an asterisk.')
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError('Enter a valid official email address.')
    if (!/^\d{10}$/.test(form.phone)) return setError('Enter a valid 10-digit contact number.')
    if (!/^\d{6}$/.test(form.pincode)) return setError('Enter a valid 6-digit PIN code.')
    if (!form.focusAreas.length) return setError('Select at least one focus area.')
    if (!form.registrationCertificate || !form.panDocument) return setError('Add the registration certificate and PAN document.')
    if (!form.declaration) return setError('Please confirm the declaration before submitting.')

    setSaving(true)
    setError('')
    try {
      const result = await createOrganisation(form)
      sessionStorage.setItem('sahai-organisation-onboarding', JSON.stringify({
        organisationName: form.organisationName,
        registrationNumber: form.registrationNumber,
        id: result.data?.id,
        submittedAt: new Date().toISOString(),
        status: result.data?.verificationStatus || 'pending',
      }))
      setSubmission(result)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (requestError) {
      setError(requestError.message)
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    } finally {
      setSaving(false)
    }
  }

  if (submission) {
    const status = submission.data?.verificationStatus || 'pending'
    return <main className="grid min-h-screen place-items-center bg-[#f7f9fc] px-4 py-12">
      <section className="w-full max-w-xl rounded-3xl border border-green-100 bg-white p-8 text-center shadow-xl sm:p-12">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-50 text-4xl text-india-green">✓</span>
        <p className="mt-7 text-xs font-extrabold uppercase tracking-[.2em] text-india-green">Application submitted</p>
        <h1 className="mt-3 font-serif text-3xl font-bold text-navy sm:text-4xl">Your organisation is under review</h1>
        <p className="mx-auto mt-4 max-w-md leading-7 text-slate-600">{submission.message} Updates for <strong>{form.organisationName}</strong> will be sent to {form.email}.</p>
        <div className="mt-7 rounded-2xl bg-slate-50 p-5 text-left text-sm"><div className="flex justify-between gap-4"><span className="text-slate-500">Application status</span><strong className={status === 'verified' ? 'text-india-green' : 'text-amber-700'}>{status === 'verified' ? 'Verified' : 'Pending review'}</strong></div><div className="mt-3 flex justify-between gap-4"><span className="text-slate-500">Application ID</span><strong className="max-w-[220px] truncate text-navy">{submission.data?.id || 'Created'}</strong></div></div>
        <button onClick={onBack} className="mt-8 w-full rounded-xl bg-navy px-5 py-3.5 font-bold text-white transition hover:bg-blue-950">Continue to homepage</button>
      </section>
    </main>
  }

  return <main className="min-h-screen bg-[#f7f9fc] text-ink">
    <div className="h-1.5 bg-gradient-to-r from-saffron via-white to-india-green" />
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6"><div className="flex items-center gap-3"><img src={logo} alt="Sahai India" className="h-12 w-12 object-contain" /><div><strong className="block text-lg text-navy">Organisation onboarding</strong><span className="text-xs text-slate-500">Verification & partner profile</span></div></div><button onClick={onBack} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-navy hover:bg-slate-50">Save & exit</button></div></header>

    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[280px_1fr] lg:py-12">
      <aside className="h-fit rounded-3xl bg-[#071d43] p-6 text-white lg:sticky lg:top-8">
        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-orange-300">Partner application</p>
        <h1 className="mt-3 font-serif text-2xl font-bold">Tell us about your organisation</h1>
        <p className="mt-3 text-sm leading-6 text-blue-100">These details help the admin team verify your organisation and create a trusted public profile.</p>
        <ol className="mt-7 space-y-5 text-sm">
          {['Organisation details', 'Contact & address', 'Work & reach', 'Verification documents'].map((item, index) => <li key={item} className="flex items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/20 bg-white/10 font-bold">{index + 1}</span><span className="font-semibold text-blue-50">{item}</span></li>)}
        </ol>
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[.06] p-4 text-xs leading-5 text-blue-100"><strong className="mb-1 block text-white">Your information is protected</strong>Documents are visible only to authorised Sahai India administrators during verification.</div>
      </aside>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm leading-6 text-navy"><strong>Partner application.</strong> Complete this form to submit your organisation and verification documents to Sahai India.</div>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-7 flex items-start gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-50 font-bold text-orange-700">01</span><div><h2 className="font-serif text-2xl font-bold text-navy">Organisation details</h2><p className="mt-1 text-sm text-slate-500">Use information exactly as shown on registration records.</p></div></div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Organisation name" required><input name="organisationName" value={form.organisationName} onChange={updateField} placeholder="Name used publicly" className={inputClass} /></Field>
            <Field label="Organisation type" required><select name="organisationType" value={form.organisationType} onChange={updateField} className={inputClass}><option value="">Select type</option>{organisationTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
            <Field label="Legal structure" required><select name="legalStructure" value={form.legalStructure} onChange={updateField} className={inputClass}><option value="">Select legal structure</option>{legalStructures.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
            <Field label="Registration number" required><input name="registrationNumber" value={form.registrationNumber} onChange={updateField} placeholder="e.g. DL/2020/001234" className={inputClass} /></Field>
            <Field label="Year established" required><input name="yearEstablished" type="number" min="1800" max={new Date().getFullYear()} value={form.yearEstablished} onChange={updateField} placeholder="YYYY" className={inputClass} /></Field>
            <Field label="Website or social profile" hint="Optional"><input name="website" type="url" value={form.website} onChange={updateField} placeholder="https://yourorganisation.org" className={inputClass} /></Field>
            <div className="sm:col-span-2"><Field label="About the organisation" required hint="Briefly explain your mission, work, and who you support."><textarea name="description" value={form.description} onChange={updateField} rows="4" maxLength="700" placeholder="Describe your organisation in 100–150 words" className={`${inputClass} resize-y`} /><span className="mt-1 block text-right text-xs text-slate-400">{form.description.length}/700</span></Field></div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-7 flex items-start gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 font-bold text-navy">02</span><div><h2 className="font-serif text-2xl font-bold text-navy">Authorised contact & address</h2><p className="mt-1 text-sm text-slate-500">Who should the Sahai India admin team contact?</p></div></div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Contact person" required><input name="contactName" value={form.contactName} onChange={updateField} placeholder="Full name" className={inputClass} /></Field>
            <Field label="Designation" required><input name="designation" value={form.designation} onChange={updateField} placeholder="e.g. Director, Trustee" className={inputClass} /></Field>
            <Field label="Official email" required><input name="email" type="email" value={form.email} onChange={updateField} placeholder="contact@organisation.org" className={inputClass} /></Field>
            <Field label="Mobile number" required><div className="flex rounded-xl border border-slate-300 bg-white focus-within:border-navy focus-within:ring-4 focus-within:ring-blue-100"><span className="grid place-items-center border-r border-slate-200 px-4 text-sm font-bold text-slate-500">+91</span><input name="phone" inputMode="numeric" value={form.phone} onChange={updateField} placeholder="10-digit number" className="min-w-0 flex-1 rounded-r-xl px-4 py-3 text-sm outline-none" /></div></Field>
            <div className="sm:col-span-2"><Field label="Registered office address" required><textarea name="address" value={form.address} onChange={updateField} rows="3" placeholder="Building, street, locality" className={`${inputClass} resize-y`} /></Field></div>
            <Field label="City / town" required><input name="city" value={form.city} onChange={updateField} className={inputClass} /></Field>
            <Field label="District" required><input name="district" value={form.district} onChange={updateField} className={inputClass} /></Field>
            <Field label="State / UT" required><input name="state" value={form.state} onChange={updateField} placeholder="e.g. Delhi" className={inputClass} /></Field>
            <Field label="PIN code" required><input name="pincode" inputMode="numeric" value={form.pincode} onChange={updateField} placeholder="6-digit PIN" className={inputClass} /></Field>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-7 flex items-start gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-green-50 font-bold text-india-green">03</span><div><h2 className="font-serif text-2xl font-bold text-navy">Work & service reach</h2><p className="mt-1 text-sm text-slate-500">Help people and admins understand the support you provide.</p></div></div>
          <fieldset><legend className="text-sm font-bold text-slate-700">Primary focus areas <span className="text-red-500">*</span></legend><div className="mt-3 flex flex-wrap gap-2">{focusAreas.map((area) => <label key={area} className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition ${form.focusAreas.includes(area) ? 'border-green-300 bg-green-50 text-green-800' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}><input type="checkbox" checked={form.focusAreas.includes(area)} onChange={() => toggleFocus(area)} className="sr-only" />{form.focusAreas.includes(area) ? '✓ ' : ''}{area}</label>)}</div></fieldset>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="Areas served" required hint="Mention states, districts, or pan-India coverage."><input name="serviceAreas" value={form.serviceAreas} onChange={updateField} placeholder="e.g. Delhi NCR, Jaipur" className={inputClass} /></Field>
            <Field label="People supported annually" hint="Optional estimate"><input name="beneficiaries" type="number" min="0" value={form.beneficiaries} onChange={updateField} placeholder="e.g. 2500" className={inputClass} /></Field>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-7 flex items-start gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-purple-50 font-bold text-purple-700">04</span><div><h2 className="font-serif text-2xl font-bold text-navy">Verification documents</h2><p className="mt-1 text-sm text-slate-500">PDF, JPG, or PNG · Maximum 5 MB per file.</p></div></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <DocumentUpload id={`${uploadPrefix}-registration`} label="Registration certificate" required help="Trust deed, society or incorporation certificate" file={form.registrationCertificate} onChange={updateFile('registrationCertificate')} />
            <DocumentUpload id={`${uploadPrefix}-pan`} label="Organisation PAN" required help="Clear scan or photograph of PAN card" file={form.panDocument} onChange={updateFile('panDocument')} />
            <DocumentUpload id={`${uploadPrefix}-address`} label="Registered address proof" help="Utility bill, lease, or official letter" file={form.addressProof} onChange={updateFile('addressProof')} />
            <DocumentUpload id={`${uploadPrefix}-letter`} label="Authorisation letter" help="If applicant is not a trustee/director" file={form.authorisedLetter} onChange={updateFile('authorisedLetter')} />
            <DocumentUpload id={`${uploadPrefix}-logo`} label="Organisation logo" help="PNG or JPG preferred for public profile" file={form.logo} onChange={updateFile('logo')} accept=".jpg,.jpeg,.png" />
          </div>
          <label className="mt-7 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"><input name="declaration" type="checkbox" checked={form.declaration} onChange={updateField} className="mt-1 h-4 w-4 accent-green-700" /><span className="text-sm leading-6 text-slate-600">I confirm that I am authorised to submit these details and that the information and documents provided are accurate. <span className="text-red-500">*</span></span></label>
        </section>

        {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">{error}</div>}
        <div className="flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-slate-500">Submitting sends this application to the admin review queue.</p><div className="flex gap-3"><button type="button" onClick={onBack} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-navy hover:bg-slate-50">Save for later</button><button type="submit" disabled={saving} className="rounded-xl bg-navy px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-950 disabled:opacity-60">{saving ? 'Submitting…' : 'Submit for verification →'}</button></div></div>
      </form>
    </div>
  </main>
}

export default OrganisationOnboarding
