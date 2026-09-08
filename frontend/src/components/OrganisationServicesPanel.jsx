import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createOrganisationService,
  deleteOrganisationService,
  getOrganisationServices,
  updateOrganisationService,
} from '../services/serviceApi.js'

const categories = [
  'Healthcare', 'Food & nutrition', 'Shelter', 'Education', 'Women & child support',
  'Livelihood', 'Disaster relief', 'Legal aid', 'Elder care', 'Other',
]

const deliveryModes = {
  at_centre: 'At centre',
  doorstep: 'Doorstep',
  online: 'Online',
  mobile_camp: 'Mobile camp',
}

const blankService = {
  name: '', category: '', description: '', deliveryMode: 'at_centre', availability: '',
  serviceArea: '', contactPhone: '', capacity: '', capacityUnit: 'people per day',
  eligibility: '', applicationProcess: '', feeDetails: 'Free of cost',
  requiredDocuments: '', isActive: true,
}

const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-navy focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50'

function editableService(service = {}) {
  return {
    name: service.name || '',
    category: typeof service.category === 'object' ? service.category?.name || '' : service.category || '',
    description: service.description || '',
    deliveryMode: service.deliveryMode || 'at_centre',
    availability: service.availability || '',
    serviceArea: service.serviceArea || '',
    contactPhone: service.contactPhone || '',
    capacity: service.capacity ?? '',
    capacityUnit: service.capacityUnit ?? 'people per day',
    eligibility: service.eligibility || '',
    applicationProcess: service.applicationProcess || '',
    feeDetails: service.feeDetails || '',
    requiredDocuments: service.requiredDocuments || '',
    isActive: service.isActive ?? true,
  }
}

function Field({ label, required = false, hint, className = '', children }) {
  return <label className={className}>
    <span className="mb-2 flex items-baseline justify-between gap-3 text-sm font-bold text-slate-700">
      <span>{label}{required && <span className="ml-1 text-orange-600" aria-hidden="true">*</span>}</span>
      {hint && <span className="text-[11px] font-medium text-slate-400">{hint}</span>}
    </span>
    {children}
  </label>
}

function FormSection({ number, title, description, children }) {
  return <section className="border-t border-slate-100 pt-6 first:border-0 first:pt-0">
    <div className="mb-5 flex items-start gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-xs font-extrabold text-navy">{number}</span>
      <div>
        <h3 className="font-extrabold text-navy">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
    </div>
    <div className="grid gap-5 sm:grid-cols-2">{children}</div>
  </section>
}

function SummaryCard({ label, value, note, tone = 'blue' }) {
  const toneClass = tone === 'green' ? 'bg-green-50 text-green-700' : tone === 'orange' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-navy'
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className={`mb-4 grid h-9 w-9 place-items-center rounded-xl text-sm font-extrabold ${toneClass}`}>{label.slice(0, 1)}</div>
    <p className="text-2xl font-extrabold text-navy">{value}</p>
    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-2 text-xs text-slate-400">{note}</p>
  </article>
}

function Detail({ label, value }) {
  return <div className="min-w-0">
    <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">{label}</p>
    <p className="mt-1 break-words text-sm font-bold leading-5 text-slate-700">{value || 'Needs update'}</p>
  </div>
}

function ServiceCard({ service, canManage, disabled, busy, onEdit, onToggle, onDelete }) {
  const category = typeof service.category === 'object' ? service.category?.name : service.category
  const capacity = service.capacity !== null && service.capacity !== undefined
    ? `${Number(service.capacity).toLocaleString('en-IN')} ${service.capacityUnit || ''}`.trim()
    : 'Not limited'

  return <article className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:p-6">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold ${service.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}><span className={`h-1.5 w-1.5 rounded-full ${service.isActive ? 'bg-green-600' : 'bg-slate-400'}`} />{service.isActive ? 'Active' : 'Paused'}</span>
          <span className="rounded-full bg-orange-50 px-3 py-1 text-[11px] font-bold text-orange-700">{category || 'Uncategorised'}</span>
        </div>
        <h2 className="mt-4 text-xl font-extrabold leading-tight text-navy">{service.name}</h2>
      </div>
      <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-lg font-extrabold text-navy">S</span>
    </div>
    <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">{service.description}</p>
    <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 rounded-2xl bg-slate-50 p-4">
      <Detail label="Delivery" value={deliveryModes[service.deliveryMode]} />
      <Detail label="Availability" value={service.availability} />
      <Detail label="Service area" value={service.serviceArea} />
      <Detail label="Capacity" value={capacity} />
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold">
      {service.contactPhone ? <a href={`tel:${service.contactPhone}`} className="text-blue-700 hover:underline">Call {service.contactPhone}</a> : <span className="text-amber-700">Contact needs update</span>}
      <span className="text-slate-500">{service.feeDetails || 'Fee details need update'}</span>
    </div>
    <details className="mt-4 rounded-xl border border-slate-200 open:bg-slate-50">
      <summary className="cursor-pointer list-none px-4 py-3 text-xs font-extrabold text-navy">How to access this service <span className="float-right text-slate-400">＋</span></summary>
      <div className="grid gap-4 border-t border-slate-200 px-4 py-4 text-xs leading-5 text-slate-600">
        <div><strong className="text-slate-800">Eligibility</strong><p className="mt-1">{service.eligibility || 'Needs update'}</p></div>
        <div><strong className="text-slate-800">Application process</strong><p className="mt-1">{service.applicationProcess || 'Needs update'}</p></div>
        <div><strong className="text-slate-800">Documents</strong><p className="mt-1">{service.requiredDocuments || 'No documents specified'}</p></div>
      </div>
    </details>
    {canManage && <div className="mt-auto flex flex-wrap gap-2 pt-5">
      <button type="button" disabled={disabled} onClick={() => onEdit(service)} className="rounded-lg bg-navy px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Edit service</button>
      <button type="button" disabled={disabled} onClick={() => onToggle(service)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50">{busy === 'toggle' ? 'Saving…' : service.isActive ? 'Pause' : 'Activate'}</button>
      <button type="button" disabled={disabled} onClick={() => onDelete(service)} className="ml-auto rounded-lg px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50">{busy === 'delete' ? 'Removing…' : 'Remove'}</button>
    </div>}
  </article>
}

export default function OrganisationServicesPanel({ organisation, canManage, onChanged }) {
  const [services, setServices] = useState(() => organisation.services || [])
  const [form, setForm] = useState(blankService)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busyAction, setBusyAction] = useState({ id: '', action: '' })
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const operationPending = loading || saving || Boolean(busyAction.id)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await getOrganisationServices()
      setServices(Array.isArray(result) ? result : [])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    getOrganisationServices()
      .then((result) => { if (!cancelled) setServices(Array.isArray(result) ? result : []) })
      .catch((requestError) => { if (!cancelled) setError(requestError.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const summary = useMemo(() => ({
    active: services.filter((service) => service.isActive).length,
    accessReady: services.filter((service) => service.contactPhone && service.applicationProcess && service.feeDetails).length,
  }), [services])

  const visibleServices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return services.filter((service) => {
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? service.isActive : !service.isActive)
      const category = typeof service.category === 'object' ? service.category?.name : service.category
      const haystack = [service.name, service.description, category, service.serviceArea].filter(Boolean).join(' ').toLowerCase()
      return matchesStatus && (!normalizedQuery || haystack.includes(normalizedQuery))
    })
  }, [query, services, statusFilter])

  const syncParent = async () => {
    try { await onChanged?.() }
    catch { /* The mutation succeeded; a later refresh can resync summary data. */ }
  }

  const change = ({ target }) => setForm((current) => ({ ...current, [target.name]: target.type === 'checkbox' ? target.checked : target.value }))
  const resetForm = () => { setForm(blankService); setEditingId(null); setShowForm(false) }
  const openCreate = () => { setForm(blankService); setEditingId(null); setShowForm(true); setError(''); setMessage('') }

  const submit = async (event) => {
    event.preventDefault()
    if (operationPending) return
    setSaving(true); setError(''); setMessage('')
    const payload = editableService(form)
    payload.capacity = form.capacity === '' ? null : Number(form.capacity)
    try {
      const saved = editingId ? await updateOrganisationService(editingId, payload) : await createOrganisationService(payload)
      setServices((current) => editingId ? current.map((service) => service.id === editingId ? saved : service) : [saved, ...current])
      const successMessage = editingId ? 'Service details updated.' : 'Service added to your catalogue.'
      resetForm(); setMessage(successMessage)
      await syncParent()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const edit = (service) => {
    if (operationPending) return
    setForm(editableService(service)); setEditingId(service.id); setShowForm(true); setMessage(''); setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggle = async (service) => {
    if (operationPending) return
    setBusyAction({ id: service.id, action: 'toggle' }); setError(''); setMessage('')
    try {
      const updated = await updateOrganisationService(service.id, { isActive: !service.isActive })
      setServices((current) => current.map((item) => item.id === service.id ? updated : item))
      setMessage(updated.isActive ? 'Service activated.' : 'Service paused.')
      await syncParent()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyAction({ id: '', action: '' })
    }
  }

  const remove = async (service) => {
    if (operationPending || !window.confirm(`Remove “${service.name}” from the catalogue?`)) return
    setBusyAction({ id: service.id, action: 'delete' }); setError(''); setMessage('')
    try {
      await deleteOrganisationService(service.id)
      setServices((current) => current.filter((item) => item.id !== service.id))
      if (editingId === service.id) resetForm()
      setMessage('Service removed from your catalogue.')
      await syncParent()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyAction({ id: '', action: '' })
    }
  }

  return <section aria-busy={operationPending}>
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-orange-700">Service catalogue</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy">Services people can rely on</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Keep every service accurate, actionable, and easy for citizens to understand.</p></div>
      {canManage && <button type="button" disabled={operationPending} onClick={showForm ? resetForm : openCreate} className="shrink-0 rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-950 disabled:opacity-50">{showForm ? 'Close form' : '+ Add service'}</button>}
    </div>

    {organisation.status !== 'verified' && <div className="mt-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900"><span aria-hidden="true">ⓘ</span><p><strong>Private workspace:</strong> services will be publicly available after organisation verification.</p></div>}
    {!canManage && <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-600">You can view the catalogue. Only organisation admins can add or change services.</div>}

    <div className="mt-6 grid gap-4 sm:grid-cols-3">
      <SummaryCard label="Total services" value={services.length} note="All catalogue entries" />
      <SummaryCard label="Active now" value={summary.active} note="Available to citizens" tone="green" />
      <SummaryCard label="Access-ready" value={summary.accessReady} note="Contact, steps, and fees complete" tone="orange" />
    </div>

    {showForm && canManage && <form onSubmit={submit} aria-busy={saving} className="mt-7 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 px-5 py-5 sm:px-7"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-orange-700">{editingId ? 'Edit catalogue entry' : 'New catalogue entry'}</p><div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-xl font-extrabold text-navy">{editingId ? 'Update service details' : 'Add a service'}</h2><p className="text-xs font-semibold text-slate-500"><span className="text-orange-600">*</span> Required information</p></div></div>
      <fieldset disabled={operationPending} className="grid gap-7 p-5 sm:p-7">
        <FormSection number="01" title="Service basics" description="Give citizens a clear, recognisable overview.">
          <Field label="Service name" required><input required name="name" minLength="2" maxLength="140" value={form.name} onChange={change} placeholder="Emergency medical assistance" className={inputClass} /></Field>
          <Field label="Category" required><select required name="category" value={form.category} onChange={change} className={inputClass}><option value="">Select a category</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></Field>
          <Field label="What the service provides" required hint={`${form.description.length}/1000`} className="sm:col-span-2"><textarea required name="description" rows="4" minLength="2" maxLength="1000" value={form.description} onChange={change} placeholder="Describe the support, expected outcome, and who it is designed to help." className={inputClass} /></Field>
        </FormSection>

        <FormSection number="02" title="Access and availability" description="Tell people where, when, and how they can reach the service.">
          <Field label="Delivery mode" required><select required name="deliveryMode" value={form.deliveryMode} onChange={change} className={inputClass}>{Object.entries(deliveryModes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
          <Field label="Availability" required><input required name="availability" minLength="2" maxLength="200" value={form.availability} onChange={change} placeholder="Mon–Sat, 9 AM–6 PM" className={inputClass} /></Field>
          <Field label="Service area" required><input required name="serviceArea" minLength="2" maxLength="300" value={form.serviceArea} onChange={change} placeholder="Lucknow district or Pan-India online" className={inputClass} /></Field>
          <Field label="Public contact number" required><input required name="contactPhone" type="tel" inputMode="tel" minLength="7" maxLength="20" value={form.contactPhone} onChange={change} placeholder="+91 98765 43210" className={inputClass} /></Field>
          <Field label="Capacity" hint="Optional"><input name="capacity" type="number" min="0" max="10000000" step="1" value={form.capacity} onChange={change} placeholder="50" className={inputClass} /></Field>
          <Field label="Capacity unit" hint="Optional"><input name="capacityUnit" maxLength="80" value={form.capacityUnit} onChange={change} placeholder="people per day" className={inputClass} /></Field>
          <Field label="Fee information" required className="sm:col-span-2"><input required name="feeDetails" minLength="2" maxLength="300" value={form.feeDetails} onChange={change} placeholder="Free of cost or ₹100 registration fee" className={inputClass} /></Field>
        </FormSection>

        <FormSection number="03" title="Eligibility and application" description="Set expectations before someone contacts your team.">
          <Field label="Who is eligible" required className="sm:col-span-2"><textarea required name="eligibility" rows="3" minLength="2" maxLength="2000" value={form.eligibility} onChange={change} placeholder="Example: Residents of Lucknow aged 60 years or above." className={inputClass} /></Field>
          <Field label="How to apply or access" required className="sm:col-span-2"><textarea required name="applicationProcess" rows="3" minLength="2" maxLength="1200" value={form.applicationProcess} onChange={change} placeholder="Call the helpline, complete a short registration, then visit the centre." className={inputClass} /></Field>
          <Field label="Required documents" hint="Optional; write ‘None’ when helpful" className="sm:col-span-2"><textarea name="requiredDocuments" rows="2" maxLength="1000" value={form.requiredDocuments} onChange={change} placeholder="Aadhaar card, income certificate" className={inputClass} /></Field>
        </FormSection>

        <label className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4"><input name="isActive" type="checkbox" checked={form.isActive} onChange={change} className="mt-0.5 h-4 w-4 accent-green-700" /><span><strong className="block text-sm text-green-900">Service is active</strong><small className="mt-1 block leading-5 text-green-700">Turn this off if the service is temporarily unavailable. Its information will remain saved.</small></span></label>
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end"><button type="button" onClick={resetForm} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-600">Cancel</button><button type="submit" className="rounded-xl bg-india-green px-6 py-3 text-sm font-bold text-white shadow-sm disabled:opacity-50">{saving ? 'Saving service…' : editingId ? 'Save changes' : 'Add service'}</button></div>
      </fieldset>
    </form>}

    {(message || error) && <p role={error ? 'alert' : 'status'} aria-live="polite" className={`mt-5 rounded-xl border px-4 py-3 text-sm font-semibold ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-800'}`}>{error || message}</p>}

    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div className="relative flex-1"><span aria-hidden="true" className="pointer-events-none absolute left-3 top-2.5 text-slate-400">⌕</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search services or locations" aria-label="Search services" className="w-full rounded-xl border-0 bg-slate-50 py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-100" /></div>
      <div className="mt-3 flex rounded-xl bg-slate-100 p-1 sm:mt-0" role="group" aria-label="Filter services by status">{['all', 'active', 'paused'].map((status) => <button key={status} type="button" onClick={() => setStatusFilter(status)} className={`rounded-lg px-4 py-2 text-xs font-bold capitalize ${statusFilter === status ? 'bg-white text-navy shadow-sm' : 'text-slate-500'}`}>{status}</button>)}</div>
    </div>

    <div className="mt-5 flex items-center justify-between gap-4"><div><h2 className="font-extrabold text-navy">Catalogue</h2><p className="mt-1 text-xs text-slate-500">Showing {visibleServices.length} of {services.length} services</p></div><button type="button" disabled={operationPending} onClick={load} className="text-xs font-extrabold text-blue-700 disabled:opacity-50">Refresh</button></div>

    {loading ? <div role="status" className="mt-4 grid min-h-64 place-items-center rounded-3xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500">Loading services…</div> : <div className="mt-4 grid gap-5 xl:grid-cols-2">{visibleServices.length ? visibleServices.map((service) => <ServiceCard key={service.id} service={service} canManage={canManage} disabled={operationPending} busy={busyAction.id === service.id ? busyAction.action : ''} onEdit={edit} onToggle={toggle} onDelete={remove} />) : <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center xl:col-span-2"><div><span aria-hidden="true" className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-xl font-extrabold text-navy">S</span><h2 className="mt-4 font-extrabold text-navy">{services.length ? 'No matching services' : 'Your catalogue is empty'}</h2><p className="mt-2 text-sm text-slate-500">{services.length ? 'Try another search or status filter.' : canManage ? 'Add your first service with clear access information.' : 'No services have been added yet.'}</p>{canManage && !services.length && <button type="button" onClick={openCreate} className="mt-5 rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white">Add first service</button>}</div></div>}</div>}
  </section>
}
