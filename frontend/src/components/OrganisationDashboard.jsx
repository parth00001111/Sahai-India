import { useMemo, useState } from 'react'
import logo from '../assets/sahai-india-logo.png'
import { addOrganisationMember, revokeOrganisationInvitation, updateMyOrganisation } from '../services/organisationApi.js'
import OrganisationTasksPanel from './OrganisationTasksPanel.jsx'
import OrganisationServicesPanel from './OrganisationServicesPanel.jsx'

const navItems = [
  ['overview', 'Overview'],
  ['profile', 'Organisation profile'],
  ['services', 'Services'],
  ['tasks', 'Tasks'],
  ['team', 'Team'],
  ['documents', 'Documents'],
]

const iconPaths = {
  overview: 'M4 4h6v6H4zM14 4h6v10h-6zM4 14h6v6H4zM14 18h6v2h-6z',
  profile: 'M4 21v-4a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4M12 9a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  services: 'M5 6h14M5 12h14M5 18h9',
  tasks: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  team: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87',
  documents: 'M6 2h9l5 5v15H6zM14 2v6h6M9 13h6M9 17h6',
}

function Icon({ name }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill={name === 'overview' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={iconPaths[name]} /></svg>
}

function StatusPill({ status }) {
  const styles = {
    verified: ['bg-green-100 text-green-800', 'bg-india-green', 'Verified partner'],
    rejected: ['bg-red-100 text-red-800', 'bg-red-500', 'Action required'],
    pending: ['bg-amber-100 text-amber-800', 'bg-amber-500', 'Approval pending'],
  }
  const [wrapper, dot, label] = styles[status] || styles.pending
  return <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold ${wrapper}`}><span className={`h-2 w-2 rounded-full ${dot}`} />{label}</span>
}

function SectionHeader({ eyebrow, title, description, action }) {
  return <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-orange-700">{eyebrow}</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p></div>{action}</div>
}

function Overview({ organisation, onNavigate }) {
  const submittedDate = useMemo(() => organisation.submittedAt
    ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(organisation.submittedAt))
    : 'Recently', [organisation.submittedAt])
  const profileFields = ['name', 'description', 'contactName', 'email', 'city', 'state', 'serviceAreas', 'focusAreas']
  const completed = profileFields.filter((field) => Array.isArray(organisation[field]) ? organisation[field].length : organisation[field]).length
  const completion = Math.round((completed / profileFields.length) * 100)
  const stats = [
    ['Profile', `${completion}%`, 'Organisation details completed'],
    ['Services', organisation.services?.length || 0, 'Services in your workspace'],
    ['Team', organisation.members?.length || 1, 'Connected staff accounts'],
    ['Annual reach', Number(organisation.beneficiariesCount || 0).toLocaleString('en-IN'), 'People supported'],
  ]

  return <section>
    <SectionHeader eyebrow="Organisation workspace" title={`Welcome, ${organisation.organisationName || 'Partner organisation'}`} description="A clear view of your application, team, services, and organisation details." />
    <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value, note]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-3 text-3xl font-extrabold text-navy">{value}</p><p className="mt-2 text-xs text-slate-500">{note}</p></article>)}</div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-extrabold text-navy">Application status</h2><p className="mt-1 text-sm text-slate-500">Submitted {submittedDate}</p></div><StatusPill status={organisation.status} /></div><div className="mt-6 grid gap-4"><ProgressRow done title="Application received" text="Your profile and verification documents are saved." /><ProgressRow done={organisation.status !== 'rejected'} title="Document review" text={organisation.status === 'rejected' ? 'Review the application with the support team.' : 'The verification team is checking your records.'} /><ProgressRow done={organisation.status === 'verified'} title="Approval & activation" text={organisation.status === 'verified' ? 'Your organisation workspace is active.' : 'Publishing tools unlock after approval.'} /></div></article>
      <article className="rounded-3xl bg-[#071d43] p-6 text-white shadow-sm"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-orange-300">Quick access</p><div className="mt-5 grid gap-3">{[['profile', 'Review organisation profile'], ['team', 'Manage team members'], ['documents', 'View submitted documents'], ['services', 'View services']].map(([key, label]) => <button key={key} onClick={() => onNavigate(key)} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[.07] px-4 py-3 text-left text-sm font-bold transition hover:bg-white/[.13]"><span>{label}</span><span>→</span></button>)}</div></article>
    </div>
  </section>
}

function ProgressRow({ done = false, title, text }) {
  return <div className="flex gap-4"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-extrabold ${done ? 'bg-green-100 text-india-green' : 'bg-slate-100 text-slate-400'}`}>{done ? '✓' : '•'}</span><div><p className="font-bold text-navy">{title}</p><p className="mt-1 text-sm text-slate-500">{text}</p></div></div>
}

function ProfilePanel({ organisation, onSaved, canEdit }) {
  const [form, setForm] = useState(() => ({
    name: organisation.name || '', description: organisation.description || '', website: organisation.website || '',
    contactName: organisation.contactName || '', designation: organisation.designation || '', email: organisation.email || '',
    contactPhone: organisation.contactPhone || '', address: organisation.address || '', city: organisation.city || '',
    district: organisation.district || '', state: organisation.state || '', pincode: organisation.pincode || '',
    serviceAreas: organisation.serviceAreas || '', beneficiariesCount: organisation.beneficiariesCount ?? '',
  }))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-navy focus:ring-4 focus:ring-blue-100'
  const change = ({ target }) => setForm((current) => ({ ...current, [target.name]: target.value }))

  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError(''); setMessage('')
    if (!canEdit) { setSaving(false); return }
    const updates = { ...form }
    if (updates.beneficiariesCount === '') delete updates.beneficiariesCount
    if (!updates.contactPhone) delete updates.contactPhone
    try { await updateMyOrganisation(updates); await onSaved(); setMessage('Organisation profile updated.') }
    catch (requestError) { setError(requestError.message) }
    finally { setSaving(false) }
  }

  return <section><SectionHeader eyebrow="Manage profile" title="Organisation profile" description="Keep the public and contact information in your database accurate." />
    <form onSubmit={submit} className="mt-7 space-y-6">
      {!canEdit && <p className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-semibold text-navy">You have staff access. An organisation admin can update this profile.</p>}
      <fieldset disabled={!canEdit} className="space-y-6 disabled:opacity-75">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><h2 className="font-extrabold text-navy">Basic information</h2><div className="mt-5 grid gap-5 sm:grid-cols-2"><Field label="Organisation name"><input required name="name" value={form.name} onChange={change} className={inputClass} /></Field><Field label="Website"><input name="website" type="url" value={form.website} onChange={change} placeholder="https://example.org" className={inputClass} /></Field><div className="sm:col-span-2"><Field label="About your organisation"><textarea name="description" rows="4" maxLength="700" value={form.description} onChange={change} className={`${inputClass} resize-y`} /></Field></div><Field label="Areas served"><input required name="serviceAreas" value={form.serviceAreas} onChange={change} className={inputClass} /></Field><Field label="People supported annually"><input name="beneficiariesCount" type="number" min="0" value={form.beneficiariesCount} onChange={change} className={inputClass} /></Field></div></div>
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><h2 className="font-extrabold text-navy">Contact and location</h2><div className="mt-5 grid gap-5 sm:grid-cols-2"><Field label="Contact person"><input required name="contactName" value={form.contactName} onChange={change} className={inputClass} /></Field><Field label="Designation"><input required name="designation" value={form.designation} onChange={change} className={inputClass} /></Field><Field label="Official email"><input required name="email" type="email" value={form.email} onChange={change} className={inputClass} /></Field><Field label="Contact phone"><input name="contactPhone" inputMode="numeric" maxLength="10" value={form.contactPhone} onChange={change} className={inputClass} /></Field><div className="sm:col-span-2"><Field label="Address"><input name="address" value={form.address} onChange={change} className={inputClass} /></Field></div><Field label="City"><input required name="city" value={form.city} onChange={change} className={inputClass} /></Field><Field label="District"><input required name="district" value={form.district} onChange={change} className={inputClass} /></Field><Field label="State / UT"><input required name="state" value={form.state} onChange={change} className={inputClass} /></Field><Field label="PIN code"><input required name="pincode" inputMode="numeric" maxLength="6" value={form.pincode} onChange={change} className={inputClass} /></Field></div></div>
      {(message || error) && <p role="status" className={`rounded-xl border px-4 py-3 text-sm font-semibold ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-800'}`}>{error || message}</p>}
      {canEdit && <div className="flex justify-end"><button disabled={saving} className="rounded-xl bg-navy px-6 py-3 text-sm font-bold text-white shadow-sm disabled:opacity-60">{saving ? 'Saving…' : 'Save profile'}</button></div>}
      </fieldset>
    </form>
  </section>
}

function Field({ label, children }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>{children}</label>
}

function TeamPanel({ organisation, onChanged, canManage }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('staff')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [createdInvitation, setCreatedInvitation] = useState(null)
  const [revoking, setRevoking] = useState('')
  const members = organisation.members || []
  const invitations = organisation.invitations || []
  const invitationUrl = (token) => `${window.location.origin}${window.location.pathname}?invite=${token}`
  const copyInvitation = async (token) => {
    try { await navigator.clipboard.writeText(invitationUrl(token)); setMessage('Invitation link copied.') }
    catch { setError('Copy failed. Select and copy the link manually.') }
  }
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setMessage(''); setError('')
    try {
      const result = await addOrganisationMember({ email: email.trim().toLowerCase(), role })
      await onChanged(); setEmail(''); setRole('staff')
      if (result.kind === 'invitation') { setCreatedInvitation(result); setMessage('Invite created. Copy and share the secure link.') }
      else { setCreatedInvitation(null); setMessage('Existing account added to the team.') }
    }
    catch (requestError) { setError(requestError.message) }
    finally { setSaving(false) }
  }
  const revoke = async (id) => {
    setRevoking(id); setMessage(''); setError('')
    try { await revokeOrganisationInvitation(id); await onChanged(); if (createdInvitation?.id === id) setCreatedInvitation(null); setMessage('Invitation revoked.') }
    catch (requestError) { setError(requestError.message) }
    finally { setRevoking('') }
  }
  return <section><SectionHeader eyebrow="Access control" title="Team" description="Add registered organisation-staff accounts and assign the right level of access." />
    {canManage ? <form onSubmit={submit} className="mt-7 grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-[1fr_150px_auto]"><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="staff@example.org" className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-navy focus:ring-4 focus:ring-blue-100" /><select value={role} onChange={(event) => setRole(event.target.value)} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"><option value="staff">Staff</option><option value="admin">Admin</option></select><button disabled={saving} className="rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? 'Working…' : 'Add or invite'}</button><p className="text-xs text-slate-500 sm:col-span-3">Existing organisation accounts are added immediately. New users receive a secure signup link that you can copy and share.</p>{(message || error) && <p role="status" className={`text-sm font-semibold sm:col-span-3 ${error ? 'text-red-700' : 'text-green-700'}`}>{error || message}</p>}{createdInvitation && <div className="flex gap-2 sm:col-span-3"><input readOnly value={invitationUrl(createdInvitation.token)} className="min-w-0 flex-1 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-900" /><button type="button" onClick={() => copyInvitation(createdInvitation.token)} className="rounded-lg bg-india-green px-4 py-2 text-xs font-bold text-white">Copy link</button></div>}</form> : <p className="mt-7 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-semibold text-navy">You can view the team. Only organisation admins can add members.</p>}
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-extrabold text-navy">Active members</h2></div>{members.map((member, index) => <div key={member.id || member.user?.id || index} className="flex items-center gap-4 border-b border-slate-100 p-5 last:border-0"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-50 font-extrabold text-navy">{member.user?.email?.[0]?.toUpperCase() || 'M'}</span><div className="min-w-0 flex-1"><p className="truncate font-bold text-navy">{member.user?.email || 'Organisation member'}</p><p className="mt-1 text-xs text-slate-500">{member.user?.phone ? `+91 ${member.user.phone}` : 'No phone provided'}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-600">{member.role || 'staff'}</span></div>)}</div>
    {canManage && invitations.length > 0 && <div className="mt-6 overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm"><div className="border-b border-amber-100 bg-amber-50 px-5 py-4"><h2 className="font-extrabold text-amber-900">Pending invitations</h2></div>{invitations.map((invite) => <div key={invite.id} className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-5 last:border-0"><div className="min-w-0 flex-1"><p className="truncate font-bold text-navy">{invite.email}</p><p className="mt-1 text-xs text-slate-500">{invite.role} · Expires {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(invite.expiresAt))}</p></div><button onClick={() => copyInvitation(invite.token)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-navy">Copy link</button><button disabled={revoking === invite.id} onClick={() => revoke(invite.id)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-60">{revoking === invite.id ? 'Revoking…' : 'Revoke'}</button></div>)}</div>}
  </section>
}

function DocumentsPanel({ organisation }) {
  const documents = [
    ['Registration certificate', organisation.registrationCertUrl, true], ['Organisation PAN', organisation.panDocUrl, true],
    ['Address proof', organisation.addressProofUrl, false], ['Authorisation letter', organisation.authLetterUrl, false], ['Organisation logo', organisation.logoUrl, false],
  ]
  return <section><SectionHeader eyebrow="Verification" title="Documents" description="A concise record of the files submitted with your application." /><div className="mt-7 grid gap-3">{documents.map(([name, url, required]) => <div key={name} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-navy"><Icon name="documents" /></span><div className="min-w-0 flex-1"><p className="font-bold text-navy">{name}</p><p className="text-xs text-slate-500">{required ? 'Required document' : 'Supporting document'}</p></div>{url ? <a href={url} target="_blank" rel="noreferrer" className="rounded-lg bg-green-50 px-3 py-2 text-xs font-bold text-green-700">View file ↗</a> : <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500">Not submitted</span>}</div>)}</div></section>
}

export default function OrganisationDashboard({ organisation, onBack, onRefresh }) {
  const [active, setActive] = useState('overview')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMessage, setRefreshMessage] = useState('')
  const status = organisation.status || 'pending'
  const canManage = organisation.currentUserRole === 'admin'
  const initials = (organisation.organisationName || 'Organisation').split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase()
  const refresh = async () => { setRefreshing(true); setRefreshMessage(''); try { const latest = await onRefresh?.(); setRefreshMessage(latest?.status === 'verified' ? 'Approval confirmed' : latest?.status === 'rejected' ? 'Review required' : 'Still under review'); return latest } finally { setRefreshing(false) } }

  return <div className="min-h-screen bg-[#f5f7fb] text-ink"><div className="h-1.5 bg-gradient-to-r from-saffron via-white to-india-green" />
    {status !== 'verified' && <div role="status" className={`flex flex-wrap items-center justify-center gap-3 border-b px-4 py-2.5 text-center text-sm font-semibold ${status === 'rejected' ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}><span><span className={`mr-2 inline-block h-2 w-2 rounded-full ${status === 'rejected' ? 'bg-red-500' : 'animate-pulse bg-amber-500'}`} />{status === 'rejected' ? 'Your application needs attention. Contact Sahai India support before making changes.' : 'Your organisation approval is pending. Your submitted information remains available here.'}</span><button disabled={refreshing} onClick={refresh} className="rounded-lg border border-current/20 bg-white px-3 py-1 text-xs font-extrabold disabled:opacity-60">{refreshing ? 'Checking…' : 'Check status'}</button>{refreshMessage && <span className="text-xs">{refreshMessage}</span>}</div>}
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6"><div className="flex items-center gap-3"><button onClick={() => setMobileMenu(!mobileMenu)} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 lg:hidden" aria-label="Toggle dashboard navigation">☰</button><img src={organisation.logoUrl || logo} alt="" className="h-10 w-10 rounded-lg object-contain" /><div className="hidden sm:block"><strong className="block text-sm text-navy">{organisation.organisationName}</strong><span className="text-xs text-slate-500">Partner workspace</span></div></div><div className="flex items-center gap-3"><StatusPill status={status} /><button onClick={onBack} className="hidden rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-navy hover:bg-slate-50 sm:block">View website</button><span className="grid h-10 w-10 place-items-center rounded-full bg-navy text-xs font-extrabold text-white">{initials}</span></div></div></header>
    <div className="mx-auto flex max-w-[1500px]"><aside className={`${mobileMenu ? 'block' : 'hidden'} fixed inset-x-0 z-30 border-b border-slate-200 bg-white p-4 shadow-xl lg:static lg:block lg:min-h-[calc(100vh-105px)] lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r lg:p-5 lg:shadow-none`}><div className="mb-5 rounded-2xl bg-slate-50 p-4"><p className="truncate font-extrabold text-navy">{organisation.organisationName}</p><p className="mt-1 truncate text-xs text-slate-500">{organisation.registrationNumber}</p></div><nav className="grid gap-1">{navItems.map(([key, label]) => <button key={key} onClick={() => { setActive(key); setMobileMenu(false) }} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition ${active === key ? 'bg-blue-50 text-navy' : 'text-slate-600 hover:bg-slate-50 hover:text-navy'}`}><Icon name={key} />{label}</button>)}</nav><button onClick={onBack} className="mt-6 w-full border-t border-slate-200 px-4 pt-5 text-left text-sm font-bold text-slate-600">← Back to website</button></aside>
      <main className="min-w-0 flex-1 p-4 sm:p-7 lg:p-9">{active === 'overview' && <Overview organisation={organisation} onNavigate={setActive} />}{active === 'profile' && <ProfilePanel organisation={organisation} onSaved={refresh} canEdit={canManage} />}{active === 'services' && <OrganisationServicesPanel organisation={organisation} canManage={canManage} />}{active === 'tasks' && <OrganisationTasksPanel organisation={organisation} />}{active === 'team' && <TeamPanel organisation={organisation} onChanged={refresh} canManage={canManage} />}{active === 'documents' && <DocumentsPanel organisation={organisation} />}</main></div>
  </div>
}
