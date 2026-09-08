import { useEffect, useMemo, useState } from 'react'
import logo from '../assets/sahai-india-logo.png'
import { closeCitizenComplaint, createCitizenComplaint, getCitizenDashboard } from '../services/citizenApi.js'
import { signOut } from '../services/authApi.js'
import LocationPicker from './LocationPicker.jsx'

const navItems = [
  ['overview', 'Overview'],
  ['file', 'File a complaint'],
  ['complaints', 'My complaints'],
  ['services', 'Find services'],
  ['help', 'Help & safety'],
]

const icons = {
  overview: 'M4 4h6v6H4zM14 4h6v10h-6zM4 14h6v6H4zM14 18h6v2h-6z',
  file: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z',
  complaints: 'M6 2h9l5 5v15H6zM14 2v6h6M9 13h6M9 17h6',
  services: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-5',
  help: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 1-1 1.7M12 17h.01',
}

const categories = [
  ['sanitation', 'Sanitation & waste'], ['roads', 'Roads & potholes'],
  ['water', 'Water supply'], ['electricity', 'Electricity'],
  ['healthcare', 'Public healthcare'], ['food', 'Food support'],
  ['shelter', 'Shelter & welfare'], ['disaster', 'Disaster response'],
  ['safety', 'Public safety'], ['other', 'Other civic issue'],
]

const categoryLabel = Object.fromEntries(categories)
const blankComplaint = {
  title: '', category: '', description: '', severity: 'medium', address: '', city: '',
  district: '', state: '', pincode: '', postOffice: '', lat: '', lng: '', locationSource: '',
}
const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-navy focus:ring-4 focus:ring-blue-100'

function Icon({ name, className = 'h-5 w-5' }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={icons[name]} /></svg>
}

function Status({ value }) {
  const styles = {
    new: 'bg-blue-50 text-blue-700',
    processing: 'bg-amber-50 text-amber-700',
    resolved: 'bg-green-50 text-green-700',
    closed: 'bg-slate-100 text-slate-600',
  }
  return <span className={`rounded-full px-3 py-1 text-[11px] font-extrabold capitalize ${styles[value] || styles.new}`}>{String(value || 'new').replaceAll('_', ' ')}</span>
}

function ComplaintCard({ complaint, onClose, closing = false }) {
  const created = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(complaint.createdAt))
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2"><Status value={complaint.status} /><span className="text-xs font-bold text-slate-400">{complaint.reference || 'Legacy report'}</span></div>
        <h3 className="mt-3 text-lg font-extrabold text-navy">{complaint.title || 'Community report'}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">{complaint.rawText}</p>
      </div>
      <span className="shrink-0 text-xs font-semibold text-slate-400">{created}</span>
    </div>
    <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 text-xs sm:grid-cols-2">
      <p><strong className="text-slate-700">Category:</strong> <span className="text-slate-500">{categoryLabel[complaint.category] || complaint.category || 'Not classified'}</span></p>
      <p><strong className="text-slate-700">Priority:</strong> <span className="capitalize text-slate-500">{complaint.severity}</span></p>
      <p className="sm:col-span-2"><strong className="text-slate-700">Routed to:</strong> <span className="text-slate-500">{complaint.routedDepartment || 'Routing pending'}{complaint.jurisdiction ? ` · ${complaint.jurisdiction}` : ''}</span></p>
      {complaint.address && <p className="sm:col-span-2"><strong className="text-slate-700">Location:</strong> <span className="text-slate-500">{[complaint.address, complaint.city, complaint.pincode].filter(Boolean).join(', ')}</span></p>}
    </div>
    {!['closed', 'resolved'].includes(complaint.status) && <div className="mt-4 flex justify-end"><button type="button" disabled={closing} onClick={() => onClose(complaint)} className="text-xs font-bold text-slate-500 hover:text-red-700 disabled:opacity-50">{closing ? 'Closing…' : 'Close complaint'}</button></div>}
  </article>
}

function ServiceCard({ service }) {
  return <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-blue-50 font-extrabold text-navy">{service.organization.logoUrl ? <img src={service.organization.logoUrl} alt="" className="h-full w-full object-cover" /> : service.organization.name.slice(0, 1)}</span>
      <div className="min-w-0"><p className="text-xs font-bold text-orange-700">{service.category?.name}</p><h3 className="mt-1 font-extrabold text-navy">{service.name}</h3><p className="mt-1 text-xs text-slate-500">{service.organization.name}</p></div>
    </div>
    <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">{service.description}</p>
    <div className="mt-4 grid gap-2 text-xs text-slate-600"><p><strong>Available:</strong> {service.availability || 'Contact organisation'}</p><p><strong>Area:</strong> {service.serviceArea || [service.organization.city, service.organization.state].filter(Boolean).join(', ')}</p><p><strong>Fees:</strong> {service.feeDetails || 'Ask organisation'}</p></div>
    <div className="mt-auto flex items-center gap-3 pt-5">{service.contactPhone && <a href={`tel:${service.contactPhone}`} className="rounded-lg bg-navy px-4 py-2 text-xs font-bold text-white">Call organisation</a>}<details className="relative"><summary className="cursor-pointer list-none text-xs font-bold text-blue-700">Access details</summary><div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600"><strong>Eligibility:</strong> {service.eligibility || 'Contact the organisation'}<br /><strong>How to apply:</strong> {service.applicationProcess || 'Call the organisation'}</div></details></div>
  </article>
}

function Stat({ label, value, note, tone }) {
  const colour = tone === 'green' ? 'bg-green-50 text-green-700' : tone === 'orange' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-navy'
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className={`inline-flex rounded-lg px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${colour}`}>{label}</span><p className="mt-4 text-3xl font-extrabold text-navy">{value}</p><p className="mt-2 text-xs text-slate-500">{note}</p></article>
}

function Overview({ data, onNavigate, onClose, closingId }) {
  const active = data.complaints.filter((item) => !['closed', 'resolved'].includes(item.status))
  const resolved = data.complaints.filter((item) => item.status === 'resolved').length
  const name = data.user.profile?.fullName || data.user.email.split('@')[0]
  return <>
    <section className="relative overflow-hidden rounded-3xl bg-[#071d43] px-6 py-8 text-white shadow-lg sm:px-9 sm:py-10">
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full border-[42px] border-white/5" />
      <div className="relative max-w-2xl"><p className="text-xs font-extrabold uppercase tracking-[.2em] text-orange-300">Citizen workspace</p><h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Namaste, {name}</h1><p className="mt-3 leading-7 text-blue-100">Report a community concern, follow its progress, or find trusted support near you.</p><div className="mt-7 flex flex-wrap gap-3"><button onClick={() => onNavigate('file')} className="rounded-xl bg-saffron px-5 py-3 text-sm font-bold text-white">File a complaint</button><button onClick={() => onNavigate('services')} className="rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold">Find support</button></div></div>
    </section>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Total reports" value={data.complaints.length} note="All complaints filed" /><Stat label="In progress" value={active.length} note="Awaiting resolution" tone="orange" /><Stat label="Resolved" value={resolved} note="Issues marked resolved" tone="green" /><Stat label="Services" value={data.services.length} note="Verified support available" /></div>
    <div className="mt-7 grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
      <section><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-extrabold text-navy">Recent complaints</h2><p className="mt-1 text-xs text-slate-500">Your latest community reports</p></div><button onClick={() => onNavigate('complaints')} className="text-xs font-bold text-blue-700">View all</button></div><div className="grid gap-4">{data.complaints.slice(0, 2).map((item) => <ComplaintCard key={item.id} complaint={item} onClose={onClose} closing={closingId === item.id} />)}{!data.complaints.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><p className="font-extrabold text-navy">No complaints filed</p><p className="mt-2 text-sm text-slate-500">When you notice a civic issue, report it here with a verified location.</p></div>}</div></section>
      <section><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-extrabold text-navy">Support near you</h2><p className="mt-1 text-xs text-slate-500">Active services from verified partners</p></div><button onClick={() => onNavigate('services')} className="text-xs font-bold text-blue-700">Explore</button></div><div className="grid gap-4">{data.services.slice(0, 2).map((service) => <ServiceCard key={service.id} service={service} />)}{!data.services.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Verified services will appear here.</div>}</div></section>
    </div>
  </>
}

function ComplaintForm({ onCreated }) {
  const [form, setForm] = useState(blankComplaint)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const change = ({ target }) => setForm((current) => ({ ...current, [target.name]: target.value }))
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError('')
    try {
      const complaintPayload = {
        title: form.title,
        category: form.category,
        description: form.description,
        severity: form.severity,
        address: form.address,
        city: form.city,
        district: form.district,
        state: form.state,
        pincode: form.pincode,
        postOffice: form.postOffice,
        lat: form.lat,
        lng: form.lng,
      }
      const complaint = await createCitizenComplaint(complaintPayload)
      setForm(blankComplaint)
      onCreated(complaint)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return <section>
    <p className="text-xs font-extrabold uppercase tracking-[.18em] text-orange-700">Community reporting</p><h1 className="mt-2 text-3xl font-extrabold text-navy">File a civic complaint</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Describe the issue clearly and verify its exact location so it can be routed to the relevant department.</p>
    <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs leading-5 text-blue-900"><strong>Before you submit:</strong> Sahai India records and routes your report within this platform. The generated reference is not an official government grievance number.</div>
    <form onSubmit={submit} className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <fieldset disabled={saving} className="grid gap-5 sm:grid-cols-2">
        <label><span className="mb-2 block text-sm font-bold text-slate-700">Issue category *</span><select required name="category" value={form.category} onChange={change} className={inputClass}><option value="">Select the type of issue</option>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label><span className="mb-2 block text-sm font-bold text-slate-700">Urgency *</span><select required name="severity" value={form.severity} onChange={change} className={inputClass}><option value="low">Low — minor inconvenience</option><option value="medium">Medium — affects several people</option><option value="high">High — serious community impact</option><option value="critical">Critical — immediate risk</option></select></label>
        <label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-slate-700">Short title *</span><input required name="title" minLength="2" maxLength="140" value={form.title} onChange={change} placeholder="Overflowing waste near the main market" className={inputClass} /></label>
        <label className="sm:col-span-2"><span className="mb-2 flex justify-between text-sm font-bold text-slate-700"><span>What is happening? *</span><span className="text-xs font-medium text-slate-400">{form.description.length}/3000</span></span><textarea required name="description" minLength="2" maxLength="3000" rows="5" value={form.description} onChange={change} placeholder="Explain when the problem started, who is affected, and any immediate risk." className={inputClass} /></label>
        <LocationPicker value={form} onChange={(location) => setForm((current) => ({ ...current, ...location }))} title="Verify the complaint location" addressLabel="Street address and landmark" />
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 sm:col-span-2">{error}</p>}
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-slate-500">Do not include passwords, bank details, or highly sensitive personal information.</p><button className="shrink-0 rounded-xl bg-india-green px-6 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Submitting safely…' : 'Submit complaint'}</button></div>
      </fieldset>
    </form>
  </section>
}

export default function CitizenDashboard({ user, onExit }) {
  const [active, setActive] = useState('overview')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [closingId, setClosingId] = useState('')
  const [serviceQuery, setServiceQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    getCitizenDashboard().then((result) => { if (!cancelled) setData(result) }).catch((requestError) => { if (!cancelled) setError(requestError.message) }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const filteredServices = useMemo(() => {
    if (!data) return []
    const term = serviceQuery.trim().toLowerCase()
    if (!term) return data.services
    return data.services.filter((service) => [service.name, service.description, service.category?.name, service.serviceArea, service.organization.name].filter(Boolean).join(' ').toLowerCase().includes(term))
  }, [data, serviceQuery])

  const closeComplaint = async (complaint) => {
    if (!window.confirm(`Close complaint ${complaint.reference || ''}?`)) return
    setClosingId(complaint.id); setError('')
    try {
      const updated = await closeCitizenComplaint(complaint.id)
      setData((current) => ({ ...current, complaints: current.complaints.map((item) => item.id === updated.id ? updated : item) }))
      setSuccess('Complaint closed.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setClosingId('')
    }
  }

  const created = (complaint) => {
    setData((current) => ({ ...current, complaints: [complaint, ...current.complaints] }))
    setSuccess(`Complaint ${complaint.reference} was recorded and routed to ${complaint.routedDepartment}.`)
    setActive('complaints')
  }

  const logout = async () => {
    try { await signOut() } catch { /* Clear the local session even if the server is unavailable. */ }
    sessionStorage.removeItem('sahai-user')
    onExit?.()
  }

  if (loading) return <main className="grid min-h-screen place-items-center bg-slate-50"><div className="text-center"><img src={logo} alt="" className="mx-auto h-16 w-16" /><p className="mt-4 text-sm font-bold text-navy">Loading your citizen workspace…</p></div></main>
  if (!data) return <main className="grid min-h-screen place-items-center bg-slate-50 p-5"><div className="max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm"><h1 className="text-xl font-extrabold text-navy">Dashboard unavailable</h1><p className="mt-3 text-sm text-red-700">{error || 'Please try again.'}</p><button onClick={onExit} className="mt-6 rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white">Back to homepage</button></div></main>

  return <div className="min-h-screen bg-[#f6f8fb] text-ink">
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-3 sm:px-6"><button onClick={() => setActive('overview')} className="flex items-center gap-3 text-left"><img src={logo} alt="" className="h-11 w-11 object-contain" /><span><strong className="block text-lg font-extrabold text-navy">SAHAI <span className="text-india-green">INDIA</span></strong><small className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">Citizen portal</small></span></button><div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-xs font-bold text-navy">{data.user.profile?.fullName || user?.email || data.user.email}</p><p className="text-[11px] text-slate-400">Citizen account</p></div><button onClick={logout} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:border-red-200 hover:text-red-700">Sign out</button></div></div></header>
    <div className="mx-auto flex max-w-[1500px]">
      <aside className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white lg:sticky lg:top-[69px] lg:h-[calc(100vh-69px)] lg:w-64 lg:shrink-0 lg:border-r lg:border-t-0"><nav className="flex justify-around p-2 lg:grid lg:gap-1 lg:p-5" aria-label="Citizen dashboard">{navItems.map(([id, label]) => <button key={id} onClick={() => { setActive(id); setSuccess(''); setError('') }} className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-bold lg:flex-row lg:gap-3 lg:px-4 lg:py-3 lg:text-sm ${active === id ? 'bg-navy text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-navy'}`}><Icon name={id} className="h-5 w-5 shrink-0" /><span className="truncate">{label}</span></button>)}</nav></aside>
      <main className="min-w-0 flex-1 p-4 pb-24 sm:p-7 sm:pb-24 lg:p-9 lg:pb-9">
        {(success || error) && <div role={error ? 'alert' : 'status'} className={`mb-5 flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-sm font-semibold ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-800'}`}><span>{error || success}</span><button onClick={() => { setError(''); setSuccess('') }}>×</button></div>}
        {active === 'overview' && <Overview data={data} onNavigate={setActive} onClose={closeComplaint} closingId={closingId} />}
        {active === 'file' && <ComplaintForm onCreated={created} />}
        {active === 'complaints' && <section><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-orange-700">Track progress</p><h1 className="mt-2 text-3xl font-extrabold text-navy">My complaints</h1><p className="mt-2 text-sm text-slate-500">References, routing, location, and current status in one place.</p></div><button onClick={() => setActive('file')} className="rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white">+ New complaint</button></div><div className="mt-6 grid gap-4">{data.complaints.map((item) => <ComplaintCard key={item.id} complaint={item} onClose={closeComplaint} closing={closingId === item.id} />)}{!data.complaints.length && <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center"><h2 className="font-extrabold text-navy">No complaints yet</h2><p className="mt-2 text-sm text-slate-500">Your submitted reports will appear here.</p></div>}</div></section>}
        {active === 'services' && <section><p className="text-xs font-extrabold uppercase tracking-[.18em] text-orange-700">Trusted support</p><h1 className="mt-2 text-3xl font-extrabold text-navy">Find services</h1><p className="mt-2 text-sm text-slate-500">Browse active support from verified partner organisations.</p><input type="search" value={serviceQuery} onChange={(event) => setServiceQuery(event.target.value)} placeholder="Search by service, category, organisation, or area" className={`${inputClass} mt-6 max-w-2xl`} /><div className="mt-6 grid gap-5 xl:grid-cols-2">{filteredServices.map((service) => <ServiceCard key={service.id} service={service} />)}{!filteredServices.length && <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 xl:col-span-2">No matching active services found.</div>}</div></section>}
        {active === 'help' && <section><p className="text-xs font-extrabold uppercase tracking-[.18em] text-orange-700">Use the portal safely</p><h1 className="mt-2 text-3xl font-extrabold text-navy">Help & safety</h1><div className="mt-6 grid gap-5 lg:grid-cols-2"><article className="rounded-2xl border border-red-200 bg-red-50 p-6"><h2 className="font-extrabold text-red-900">Immediate danger?</h2><p className="mt-3 text-sm leading-6 text-red-800">Do not wait for an online complaint. Contact the appropriate local emergency authority or emergency service immediately.</p></article><article className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-extrabold text-navy">What happens after filing?</h2><ol className="mt-4 grid gap-3 text-sm leading-6 text-slate-600"><li><strong>1.</strong> Your location and complaint are recorded.</li><li><strong>2.</strong> Sahai suggests the relevant department and jurisdiction.</li><li><strong>3.</strong> You can follow status changes using your reference.</li></ol></article><article className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2"><h2 className="font-extrabold text-navy">Privacy checklist</h2><div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2"><p>✓ Share only information needed to explain the issue.</p><p>✓ Verify the map location before submitting.</p><p>✓ Never share passwords, OTPs, or bank details.</p><p>✓ Keep your complaint reference for follow-up.</p></div></article></div></section>}
      </main>
    </div>
  </div>
}
