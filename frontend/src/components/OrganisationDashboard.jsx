import { useMemo, useState } from 'react'
import logo from '../assets/sahai-india-logo.png'

const navItems = [
  ['overview', 'Overview'],
  ['services', 'Services'],
  ['requests', 'Help requests'],
  ['team', 'Team'],
  ['documents', 'Documents'],
  ['reports', 'Reports'],
]

const sectionCopy = {
  services: ['Services', 'Create and manage the support programmes visible to citizens.', 'No services published yet', 'You can prepare service details after your organisation is approved.'],
  requests: ['Help requests', 'Review and coordinate requests assigned to your organisation.', 'No requests assigned', 'New requests will appear here after verification and service activation.'],
  team: ['Team', 'Manage staff access and responsibilities for your organisation.', '1 administrator', 'The onboarding contact currently has administrator access.'],
  documents: ['Documents', 'Track the documents provided for organisation verification.', 'Documents under review', 'The Sahai India verification team is reviewing your submitted records.'],
  reports: ['Reports', 'Understand your organisation’s reach, response time, and impact.', 'Reports unlock after approval', 'Impact reporting begins when your services become active.'],
}

function MiniIcon({ name }) {
  const paths = {
    overview: 'M4 4h6v6H4zM14 4h6v10h-6zM4 14h6v6H4zM14 18h6v2h-6z',
    services: 'M5 6h14M5 12h14M5 18h9',
    requests: 'M7 3h10v4H7zM5 5H3v16h18V5h-2M8 12h8M8 16h5',
    team: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    documents: 'M6 2h9l5 5v15H6zM14 2v6h6M9 13h6M9 17h6',
    reports: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill={name === 'overview' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>
}

function StatusPill({ status }) {
  const verified = status === 'verified'
  return <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold ${verified ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}><span className={`h-2 w-2 rounded-full ${verified ? 'bg-india-green' : 'bg-amber-500'}`} />{verified ? 'Verified partner' : 'Approval pending'}</span>
}

function EmptySection({ active, status }) {
  const [title, description, headline, detail] = sectionCopy[active]
  const locked = status !== 'verified' && ['services', 'team', 'reports'].includes(active)
  return <section>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-orange-700">Organisation workspace</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy">{title}</h1><p className="mt-2 text-sm text-slate-500">{description}</p></div>{active === 'services' && <button disabled={locked} className="rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-300">+ Add service</button>}</div>
    {active === 'documents' && <div className="mt-7 grid gap-3"><DocumentRow name="Registration certificate" required /><DocumentRow name="Organisation PAN" required /><DocumentRow name="Address proof" /><DocumentRow name="Authorisation letter" /></div>}
    {active === 'team' && <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-4"><span className="grid h-11 w-11 place-items-center rounded-full bg-blue-50 font-extrabold text-navy">A</span><div className="min-w-0 flex-1"><p className="font-bold text-navy">Organisation administrator</p><p className="truncate text-sm text-slate-500">Primary onboarding contact</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">Admin</span></div></div>}
    <div className="mt-7 grid min-h-64 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center"><div><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-navy"><MiniIcon name={active} /></span><h2 className="mt-5 text-lg font-bold text-navy">{headline}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{detail}</p>{locked && <p className="mt-4 text-xs font-bold text-amber-700">Available after verification</p>}</div></div>
  </section>
}

function DocumentRow({ name, required = false }) {
  return <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-navy"><MiniIcon name="documents" /></span><div className="min-w-0 flex-1"><p className="font-bold text-navy">{name}</p><p className="text-xs text-slate-500">{required ? 'Required document' : 'Supporting document'}</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">In review</span></div>
}

function Overview({ organisation }) {
  const verified = organisation.status === 'verified'
  const submittedDate = useMemo(() => organisation.submittedAt
    ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(organisation.submittedAt))
    : 'Recently', [organisation.submittedAt])
  const stats = [
    ['Profile completion', '85%', 'Complete optional documents'],
    ['Active services', verified ? '0' : '—', verified ? 'Create your first service' : 'Unlocks after approval'],
    ['Open requests', verified ? '0' : '—', verified ? 'No new requests' : 'Unlocks after approval'],
    ['People reached', '0', 'Impact reported this month'],
  ]
  return <section>
    <div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-orange-700">Organisation workspace</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy">Welcome, {organisation.organisationName || 'Partner organisation'}</h1><p className="mt-2 text-sm text-slate-500">Here is what needs your attention today.</p></div>

    <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value, note]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-3 text-3xl font-extrabold text-navy">{value}</p><p className="mt-2 text-xs text-slate-500">{note}</p></article>)}</div>

    <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-lg font-extrabold text-navy">Verification progress</h2><p className="mt-1 text-sm text-slate-500">Application submitted on {submittedDate}</p></div><span className="text-sm font-extrabold text-amber-700">2 of 3</span></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-2/3 rounded-full bg-gradient-to-r from-saffron to-amber-400" /></div><ol className="mt-6 space-y-5"><Timeline done title="Application received" text="Organisation details and documents were submitted." /><Timeline done title="Document review" text="The verification team is checking your records." /><Timeline title="Approval & activation" text="Services and team tools unlock after approval." /></ol></article>
      <article className="rounded-3xl bg-[#071d43] p-6 text-white shadow-sm"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-orange-300">Quick actions</p><div className="mt-5 grid gap-3"><Action label="Review organisation profile" available /><Action label="Check submitted documents" available /><Action label="Publish a new service" available={verified} /><Action label="Invite a team member" available={verified} /></div></article>
    </div>

    <article className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-extrabold text-navy">Recent activity</h2><div className="mt-5 flex gap-4"><span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-amber-400 ring-4 ring-amber-50" /><div><p className="font-bold text-slate-800">Application moved to document review</p><p className="mt-1 text-sm text-slate-500">We will notify your official email when the review is complete.</p><p className="mt-2 text-xs font-semibold text-slate-400">Submitted {submittedDate}</p></div></div></article>
  </section>
}

function Timeline({ done = false, title, text }) {
  return <li className="flex gap-4"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-extrabold ${done ? 'bg-green-100 text-india-green' : 'bg-slate-100 text-slate-400'}`}>{done ? '✓' : '3'}</span><div><p className="font-bold text-navy">{title}</p><p className="mt-1 text-sm text-slate-500">{text}</p></div></li>
}

function Action({ label, available }) {
  return <button disabled={!available} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[.07] px-4 py-3 text-left text-sm font-bold transition hover:bg-white/[.12] disabled:cursor-not-allowed disabled:text-blue-200/50"><span>{label}</span><span>{available ? '→' : '🔒'}</span></button>
}

export default function OrganisationDashboard({ organisation, onBack, onRefresh }) {
  const [active, setActive] = useState('overview')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMessage, setRefreshMessage] = useState('')
  const status = organisation.status || 'pending'
  const initials = (organisation.organisationName || 'Organisation').split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase()

  return <div className="min-h-screen bg-[#f5f7fb] text-ink">
    <div className="h-1.5 bg-gradient-to-r from-saffron via-white to-india-green" />
    {status !== 'verified' && <div role="status" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm font-semibold text-amber-900"><span><span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500" />Your organisation approval is pending. Management features will unlock after verification.</span><button disabled={refreshing} onClick={async () => { setRefreshing(true); setRefreshMessage(''); try { const latest = await onRefresh?.(); setRefreshMessage(latest?.status === 'verified' ? 'Approval confirmed' : 'Still under review') } catch (error) { setRefreshMessage(error.message) } finally { setRefreshing(false) } }} className="rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-extrabold hover:bg-amber-100 disabled:opacity-60">{refreshing ? 'Checking…' : 'Check status'}</button>{refreshMessage && <span className="text-xs">{refreshMessage}</span>}</div>}
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6"><div className="flex items-center gap-3"><button onClick={() => setMobileMenu(!mobileMenu)} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 lg:hidden" aria-label="Toggle dashboard navigation">☰</button><img src={logo} alt="Sahai India" className="h-10 w-10 object-contain" /><div className="hidden sm:block"><strong className="block text-sm text-navy">Sahai India</strong><span className="text-xs text-slate-500">Partner workspace</span></div></div><div className="flex items-center gap-3"><StatusPill status={status} /><button onClick={onBack} className="hidden rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-navy hover:bg-slate-50 sm:block">View website</button><span className="grid h-10 w-10 place-items-center rounded-full bg-navy text-xs font-extrabold text-white">{initials}</span></div></div></header>

    <div className="mx-auto flex max-w-[1600px]">
      <aside className={`${mobileMenu ? 'block' : 'hidden'} fixed inset-x-0 z-30 border-b border-slate-200 bg-white p-4 shadow-xl lg:static lg:block lg:min-h-[calc(100vh-105px)] lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r lg:p-5 lg:shadow-none`}><div className="mb-6 rounded-2xl bg-slate-50 p-4"><p className="truncate font-extrabold text-navy">{organisation.organisationName || 'Organisation'}</p><p className="mt-1 truncate text-xs text-slate-500">ID: {organisation.id?.slice(0, 12) || 'Application created'}</p></div><nav className="grid gap-1">{navItems.map(([key, label]) => <button key={key} onClick={() => { setActive(key); setMobileMenu(false) }} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition ${active === key ? 'bg-blue-50 text-navy' : 'text-slate-600 hover:bg-slate-50 hover:text-navy'}`}><MiniIcon name={key} />{label}{status !== 'verified' && ['services', 'team', 'reports'].includes(key) && <span className="ml-auto text-xs opacity-50">●</span>}</button>)}</nav><div className="mt-6 border-t border-slate-200 pt-5"><button onClick={onBack} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-600 hover:bg-slate-50">← Back to website</button></div></aside>
      <main className="min-w-0 flex-1 p-4 sm:p-7 lg:p-9">{active === 'overview' ? <Overview organisation={organisation} /> : <EmptySection active={active} status={status} />}</main>
    </div>
  </div>
}
