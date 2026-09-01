import { useMemo, useState } from 'react'

const categories = ['Healthcare', 'Food & nutrition', 'Shelter', 'Education', 'Women & child support', 'Livelihood', 'Disaster relief', 'Legal aid', 'Elder care', 'Other']

const blankService = {
  name: '', category: '', description: '', capacity: '', capacityUnit: 'people per day',
  deliveryMode: 'at_centre', availability: '', serviceArea: '', contactPhone: '',
  eligibility: '', requiredDocuments: '', isActive: true,
}

const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-navy focus:ring-4 focus:ring-blue-100'

function loadDrafts(key) {
  try { return JSON.parse(localStorage.getItem(key)) || [] }
  catch { return [] }
}

function displayMode(mode) {
  return { at_centre: 'At centre', doorstep: 'Doorstep', online: 'Online', mobile_camp: 'Mobile camp' }[mode] || mode
}

function ServiceCard({ service, isDraft, onEdit, onToggle, onDelete, onCopy }) {
  const category = typeof service.category === 'object' ? service.category?.name : service.category
  return <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${service.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{service.isActive ? 'Active' : 'Paused'}</span><span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700">{isDraft ? 'Frontend draft' : 'Database service'}</span></div><h2 className="mt-4 text-lg font-extrabold text-navy">{service.name}</h2><p className="mt-1 text-xs font-bold text-orange-700">{category || 'Uncategorised'}</p></div><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-50 text-xl">✦</span></div>
    <p className="mt-4 min-h-12 text-sm leading-6 text-slate-500">{service.description || 'No description provided.'}</p>
    <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-xs"><div><p className="font-bold uppercase tracking-wide text-slate-400">Capacity</p><p className="mt-1 font-extrabold text-navy">{service.capacity ? `${service.capacity} ${service.capacityUnit || ''}` : 'Not set'}</p></div><div><p className="font-bold uppercase tracking-wide text-slate-400">Mode</p><p className="mt-1 font-extrabold text-navy">{displayMode(service.deliveryMode) || 'Not set'}</p></div><div><p className="font-bold uppercase tracking-wide text-slate-400">Availability</p><p className="mt-1 font-extrabold text-navy">{service.availability || 'Not set'}</p></div><div><p className="font-bold uppercase tracking-wide text-slate-400">Service area</p><p className="mt-1 font-extrabold text-navy">{service.serviceArea || 'Not set'}</p></div></div>
    {(service.eligibility || service.requiredDocuments) && <details className="mt-4 rounded-xl border border-slate-200"><summary className="cursor-pointer p-3 text-xs font-extrabold text-navy">Eligibility and documents</summary><div className="border-t border-slate-100 p-3 text-xs leading-5 text-slate-600">{service.eligibility && <p><strong>Eligibility:</strong> {service.eligibility}</p>}{service.requiredDocuments && <p className="mt-2"><strong>Documents:</strong> {service.requiredDocuments}</p>}</div></details>}
    <div className="mt-5 flex flex-wrap gap-2">{isDraft && <><button onClick={() => onEdit(service)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-navy">Edit</button><button onClick={() => onToggle(service.id)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-navy">{service.isActive ? 'Pause' : 'Activate'}</button><button onClick={() => onCopy(service)} className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700">Copy JSON</button><button onClick={() => onDelete(service.id)} className="ml-auto rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700">Remove</button></>}</div>
  </article>
}

export default function OrganisationServicesPanel({ organisation, canManage }) {
  const storageKey = `sahai-service-drafts:${organisation.id || organisation.registrationNumber || 'organisation'}`
  const [drafts, setDrafts] = useState(() => loadDrafts(storageKey))
  const [form, setForm] = useState(blankService)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const services = useMemo(() => [...drafts, ...(organisation.services || [])], [drafts, organisation.services])

  const saveDrafts = (next) => {
    setDrafts(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
  }
  const change = ({ target }) => setForm((current) => ({ ...current, [target.name]: target.type === 'checkbox' ? target.checked : target.value }))
  const resetForm = () => { setForm(blankService); setEditingId(null); setShowForm(false) }

  const submit = (event) => {
    event.preventDefault()
    const service = {
      ...form,
      capacity: form.capacity === '' ? null : Number(form.capacity),
      id: editingId || `draft-${globalThis.crypto?.randomUUID?.() || Date.now()}`,
      source: 'frontend_draft',
      updatedAt: new Date().toISOString(),
    }
    const next = editingId ? drafts.map((item) => item.id === editingId ? service : item) : [service, ...drafts]
    saveDrafts(next); resetForm(); setMessage(editingId ? 'Service draft updated.' : 'Service draft created in this browser.')
  }
  const edit = (service) => { setForm({ ...blankService, ...service, capacity: service.capacity ?? '' }); setEditingId(service.id); setShowForm(true); setMessage(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const toggle = (id) => saveDrafts(drafts.map((service) => service.id === id ? { ...service, isActive: !service.isActive, updatedAt: new Date().toISOString() } : service))
  const remove = (id) => { saveDrafts(drafts.filter((service) => service.id !== id)); if (editingId === id) resetForm(); setMessage('Service draft removed from this browser.') }
  const copyJson = async (service) => {
    const payload = { ...service }
    delete payload.source
    try { await navigator.clipboard.writeText(JSON.stringify(payload, null, 2)); setMessage('Backend-ready service JSON copied.') }
    catch { setMessage('Copy was blocked by the browser.') }
  }

  return <section><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-orange-700">Service catalogue</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy">Services</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Design the support your organisation provides. Frontend drafts remain in this browser until the service API is created.</p></div>{canManage && <button onClick={() => { if (showForm) resetForm(); else { setForm(blankService); setEditingId(null); setShowForm(true) } }} className="rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white">{showForm ? 'Close form' : '+ Create service'}</button>}</div>
    <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-900"><strong>Frontend prototype:</strong> create, edit, pause, and copy service data now. No service backend endpoint is called.</div>
    {organisation.status !== 'verified' && <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-800">Organisation approval is pending. You can prepare drafts now; public publishing should be enabled after approval.</p>}
    {!canManage && <p className="mt-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-600">Only organisation admins can manage the service catalogue.</p>}

    {showForm && canManage && <form onSubmit={submit} className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex items-center justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-orange-700">{editingId ? 'Edit draft' : 'New service'}</p><h2 className="mt-2 text-xl font-extrabold text-navy">Service information</h2></div><span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">Draft</span></div><div className="mt-6 grid gap-5 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-bold text-slate-700">Service name *</span><input required name="name" maxLength="140" value={form.name} onChange={change} placeholder="Emergency medical assistance" className={inputClass} /></label><label><span className="mb-2 block text-sm font-bold text-slate-700">Category *</span><select required name="category" value={form.category} onChange={change} className={inputClass}><option value="">Select category</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-slate-700">Description *</span><textarea required name="description" rows="4" maxLength="1000" value={form.description} onChange={change} placeholder="Explain what is provided and who it helps." className={inputClass} /></label><label><span className="mb-2 block text-sm font-bold text-slate-700">Capacity</span><input name="capacity" type="number" min="0" value={form.capacity} onChange={change} placeholder="50" className={inputClass} /></label><label><span className="mb-2 block text-sm font-bold text-slate-700">Capacity unit</span><input name="capacityUnit" value={form.capacityUnit} onChange={change} placeholder="people per day" className={inputClass} /></label><label><span className="mb-2 block text-sm font-bold text-slate-700">Delivery mode</span><select name="deliveryMode" value={form.deliveryMode} onChange={change} className={inputClass}><option value="at_centre">At centre</option><option value="doorstep">Doorstep</option><option value="online">Online</option><option value="mobile_camp">Mobile camp</option></select></label><label><span className="mb-2 block text-sm font-bold text-slate-700">Availability</span><input name="availability" value={form.availability} onChange={change} placeholder="Mon–Sat, 9 AM–6 PM" className={inputClass} /></label><label><span className="mb-2 block text-sm font-bold text-slate-700">Service area</span><input name="serviceArea" value={form.serviceArea} onChange={change} placeholder="Districts, wards, or radius" className={inputClass} /></label><label><span className="mb-2 block text-sm font-bold text-slate-700">Public contact number</span><input name="contactPhone" inputMode="tel" value={form.contactPhone} onChange={change} placeholder="9876543210" className={inputClass} /></label><label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-slate-700">Eligibility</span><textarea name="eligibility" rows="3" value={form.eligibility} onChange={change} placeholder="Example: Open to residents below a stated income threshold." className={inputClass} /></label><label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-slate-700">Required documents</span><input name="requiredDocuments" value={form.requiredDocuments} onChange={change} placeholder="Aadhaar, income certificate (comma separated)" className={inputClass} /></label><label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 sm:col-span-2"><input name="isActive" type="checkbox" checked={form.isActive} onChange={change} className="h-4 w-4 accent-green-700" /><span><strong className="block text-sm text-navy">Set as active</strong><small className="text-slate-500">This controls only the frontend draft until the backend is connected.</small></span></label></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={resetForm} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-600">Cancel</button><button className="rounded-xl bg-india-green px-6 py-3 text-sm font-bold text-white">{editingId ? 'Update draft' : 'Create service'}</button></div></form>}
    {message && <p role="status" className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">{message}</p>}
    <div className="mt-7 flex items-center justify-between"><h2 className="font-extrabold text-navy">Service catalogue</h2><span className="text-xs font-bold text-slate-500">{services.length} service{services.length === 1 ? '' : 's'}</span></div>
    <div className="mt-4 grid gap-4 xl:grid-cols-2">{services.length ? services.map((service) => <ServiceCard key={service.id} service={service} isDraft={service.source === 'frontend_draft'} onEdit={edit} onToggle={toggle} onDelete={remove} onCopy={copyJson} />) : <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center xl:col-span-2"><div><span className="text-4xl">✦</span><h2 className="mt-4 font-extrabold text-navy">No services yet</h2><p className="mt-2 text-sm text-slate-500">Create your first service draft to preview the organisation catalogue.</p></div></div>}</div>
  </section>
}
