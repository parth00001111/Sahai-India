import { useEffect, useState } from 'react'
import logo from './assets/sahai-india-logo.png'
import modiPoster from './assets/sahai-india-modi-poster.png'
import AuthPage from './components/AuthPage.jsx'
import OrganisationOnboarding from './components/OrganisationOnboarding.jsx'

const slides = [
  { tag: 'Seva is the strength of a nation', title: 'Together, we lift every citizen', text: 'Sahai India connects people in need with compassionate volunteers, trusted organisations, and essential services—because progress begins when no one is left behind.', image: modiPoster, dark: true, note: 'Concept visual • No official endorsement is implied' },
  { tag: 'Seva • Sahyog • Samarthan', title: 'Support that reaches every Indian', text: 'Discover trusted organisations, public services, and community programmes—all in one helpful place.', gradient: 'from-orange-100 via-white to-green-100', dark: false },
  { tag: 'Community first', title: 'Find the right help, closer to home', text: 'Connect with organisations working across health, education, livelihoods, women’s safety, and disaster relief.', gradient: 'from-[#0a3472] via-[#12509a] to-[#138808]', dark: true },
  { tag: 'Together for India', title: 'Turn compassion into meaningful action', text: 'Volunteer, support a cause, or help someone discover services that can make a lasting difference.', gradient: 'from-[#138808] via-[#e3a51d] to-[#f97316]', dark: true },
]

const organisations = [
  ['HE', 'Health & Emergency', 'Medical support and relief', 'bg-rose-50 text-rose-700'],
  ['ED', 'Education Network', 'Learning and scholarships', 'bg-amber-50 text-amber-700'],
  ['WR', 'Women & Rights', 'Safety and empowerment', 'bg-purple-50 text-purple-700'],
  ['SK', 'Skills India Partners', 'Training and livelihoods', 'bg-blue-50 text-blue-700'],
  ['DR', 'Disaster Response', 'Rapid community assistance', 'bg-orange-50 text-orange-700'],
  ['EC', 'Elder Care Alliance', 'Dignity and daily support', 'bg-emerald-50 text-emerald-700'],
]

const testimonials = [
  ['Add an approved message from a public leader here about community partnership and citizen-first service.', 'Verified leader name', 'Official designation • Government body'],
  ['Use this space for an authorised statement highlighting the impact of Sahai India and its partner organisations.', 'Verified leader name', 'Official designation • Public institution'],
  ['Publish only a verified testimonial with its date, source, and permission details for public trust.', 'Verified leader name', 'Official designation • State or district'],
]

const faqs = [
  ['What is Sahai India?', 'Sahai India is a citizen-support platform designed to help people discover trusted organisations, social initiatives, and useful public services in one place.'],
  ['How can I find help near me?', 'Browse the organisation directory by cause, location, and type of support. Contact details and availability can be shown on every verified profile.'],
  ['How does an NGO join the platform?', 'Registered organisations can use “Join as an organisation”. Their identity and documents should be reviewed before publication.'],
  ['Is Sahai India a government website?', 'Sahai India is a public-service platform. Unless formally authorised, it should not claim to be an official Government of India website or imply government endorsement.'],
  ['Is there a fee to access services?', 'Browsing is intended to be free. Partner programmes may have eligibility conditions, which should be clearly stated on their profiles.'],
]

const portals = [
  ['National Portal of India', 'https://www.india.gov.in/'], ['MyGov India', 'https://www.mygov.in/'],
  ['UMANG', 'https://web.umang.gov.in/'], ['DigiLocker', 'https://www.digilocker.gov.in/'],
  ['Public Grievance Portal', 'https://pgportal.gov.in/'], ['National Scholarship Portal', 'https://scholarships.gov.in/'],
]

function Heading({ label, title, text, left = false }) {
  return <div className={`${left ? '' : 'mx-auto text-center'} mb-10 max-w-2xl`}><p className="mb-3 text-xs font-extrabold uppercase tracking-[.22em] text-orange-700">{label}</p><h2 className="font-serif text-3xl font-bold tracking-tight text-navy sm:text-4xl">{title}</h2>{text && <p className="mt-4 leading-7 text-slate-600">{text}</p>}</div>
}

function App() {
  const [slide, setSlide] = useState(0)
  const [menu, setMenu] = useState(false)
  const [authMode, setAuthMode] = useState(null)
  const [onboardingUser, setOnboardingUser] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  useEffect(() => { const id = setInterval(() => setSlide((n) => (n + 1) % slides.length), 6500); return () => clearInterval(id) }, [])
  const move = (n) => setSlide((current) => (current + n + slides.length) % slides.length)

  const openOnboarding = (user = null) => {
    let savedUser = user
    if (!savedUser) {
      try { savedUser = JSON.parse(sessionStorage.getItem('sahai-user')) } catch { savedUser = null }
    }
    setOnboardingUser(savedUser)
    setShowOnboarding(true)
  }

  if (showOnboarding) return <OrganisationOnboarding user={onboardingUser} onBack={() => setShowOnboarding(false)} />
  if (authMode) return <AuthPage initialMode={authMode} onBack={() => setAuthMode(null)} onOrganisationOnboarding={(user) => { setAuthMode(null); openOnboarding(user) }} />

  return <div className="min-h-screen overflow-x-hidden bg-[#fffdf9] text-ink">
    <div className="h-1.5 bg-gradient-to-r from-saffron via-white to-india-green" />
    <div className="border-b border-slate-200 bg-slate-50 text-[11px] text-slate-600 sm:text-xs"><div className="mx-auto flex max-w-7xl justify-between px-4 py-2 sm:px-6"><span>भारत के लोगों के लिए • For the people of India</span><div className="flex gap-4"><a href="#main">Skip to content</a><span>हिंदी</span><span className="font-bold text-navy">A+</span></div></div></div>

    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8" aria-label="Main navigation">
        <a href="#" className="group flex min-w-0 items-center gap-3" aria-label="Sahai India home"><img src={logo} alt="" className="h-14 w-14 shrink-0 object-contain transition duration-300 group-hover:scale-105 sm:h-16 sm:w-16"/><span className="border-l-2 border-orange-200 pl-3"><strong className="flex items-baseline gap-1.5 text-xl font-extrabold tracking-[.04em] sm:text-2xl"><span className="text-navy">SAHAI</span><span className="bg-gradient-to-r from-saffron to-india-green bg-clip-text text-transparent">INDIA</span></strong><span aria-hidden="true" className="mt-1 flex h-0.5 w-full overflow-hidden rounded-full"><span className="w-1/3 bg-saffron"/><span className="w-1/3 bg-slate-100"/><span className="w-1/3 bg-india-green"/></span><span className="mt-1 block text-[9px] font-bold tracking-[.14em] text-india-green sm:text-[10px]">सेवा • सहयोग • विश्वास</span></span></a>
        <div className="hidden items-center gap-7 lg:flex">{['About','Organisations','Impact','FAQ'].map(x => <a key={x} href={`#${x.toLowerCase()}`} className="text-sm font-semibold text-slate-700 hover:text-orange-700">{x}</a>)}</div>
        <div className="hidden gap-3 sm:flex"><button onClick={() => setAuthMode('login')} className="rounded-lg border border-navy bg-white px-4 py-2.5 text-sm font-bold text-navy shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-transparent hover:bg-gradient-to-r hover:from-orange-100 hover:via-white hover:to-green-100 hover:shadow-md">Log in</button><button onClick={() => setAuthMode('signup')} className="rounded-lg border border-navy bg-navy px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-200 hover:bg-gradient-to-r hover:from-saffron hover:via-white hover:to-india-green hover:text-navy hover:shadow-md">Sign up</button></div>
        <button onClick={() => setMenu(!menu)} aria-expanded={menu} aria-label="Toggle menu" className="grid h-11 w-11 place-items-center rounded-lg border border-slate-200 text-2xl text-navy sm:hidden">☰</button>
      </nav>
      {menu && <div className="border-t bg-white px-4 py-4 sm:hidden"><div className="grid gap-2">{['About','Organisations','Impact','FAQ'].map(x => <a key={x} href={`#${x.toLowerCase()}`} onClick={() => setMenu(false)} className="rounded-lg px-3 py-2 font-semibold hover:bg-orange-50">{x}</a>)}<div className="mt-2 grid grid-cols-2 gap-3"><button onClick={() => { setMenu(false); setAuthMode('login') }} className="rounded-lg border border-navy bg-white py-2 font-bold text-navy transition-all duration-300 hover:border-transparent hover:bg-gradient-to-r hover:from-orange-100 hover:via-white hover:to-green-100 hover:shadow-md">Log in</button><button onClick={() => { setMenu(false); setAuthMode('signup') }} className="rounded-lg border border-navy bg-navy py-2 font-bold text-white transition-all duration-300 hover:border-orange-200 hover:bg-gradient-to-r hover:from-saffron hover:via-white hover:to-india-green hover:text-navy hover:shadow-md">Sign up</button></div></div></div>}
    </header>

    <main id="main">
      <section id="about" className="bg-slate-50 p-3 sm:p-5 lg:p-7" aria-label="Featured programmes">
        <div className="relative mx-auto min-h-[500px] max-w-[1440px] overflow-hidden rounded-[1.75rem] bg-navy shadow-xl sm:min-h-[560px]">
          {slides.map((item,i) => <article key={item.title} aria-hidden={slide !== i} className={`absolute inset-0 transition-opacity duration-700 ${slide === i ? 'z-10 opacity-100' : 'pointer-events-none opacity-0'}`}>
            {item.image ? <div className="absolute inset-0 bg-cover bg-[68%_center] sm:bg-center" style={{ backgroundImage: `url(${item.image})` }}/> : <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient}`}/>}<div className={`absolute inset-0 ${item.image ? 'bg-gradient-to-r from-[#06172f]/95 via-[#06172f]/60 to-transparent' : 'fine-grid'}`}/><div className="absolute -right-20 -top-20 h-96 w-96 rounded-full border-[70px] border-white/10"/><div className="absolute -bottom-32 right-[8%] h-80 w-80 rounded-full bg-white/10"/>
            <div className="relative z-10 flex min-h-[500px] items-center px-7 py-16 sm:min-h-[560px] sm:px-14 lg:px-20"><div className={`max-w-2xl ${item.dark ? 'text-white' : 'text-navy'}`}>
              <p className="mb-6 inline-flex items-center gap-3 rounded-full bg-white/90 px-4 py-2 text-xs font-extrabold uppercase tracking-[.15em] text-navy shadow"><span className="h-2 w-2 rounded-full bg-saffron"/>{item.tag}</p>
              <h1 className="font-serif text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">{item.title}</h1>
              <p className={`mt-6 max-w-xl text-base leading-7 sm:text-lg ${item.dark ? 'text-white/85' : 'text-slate-700'}`}>{item.text}</p>
              <div className="mt-9 flex flex-wrap gap-3"><a href="#organisations" className="rounded-lg bg-navy px-6 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-blue-950">Find support →</a><button type="button" onClick={() => openOnboarding()} className={`rounded-lg border px-6 py-3.5 text-sm font-bold ${item.dark ? 'border-white/50 bg-white/10' : 'border-navy/30 bg-white/70 text-navy'}`}>Join as an organisation</button></div>
              {item.note && <p className="mt-5 text-xs font-semibold tracking-wide text-white/70">{item.note}</p>}
            </div></div>
          </article>)}
          <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2 rounded-full bg-white/95 p-2 shadow-lg"><button onClick={() => move(-1)} aria-label="Previous slide" className="h-10 w-10 rounded-full text-navy hover:bg-blue-50">←</button>{slides.map((_,i) => <button key={i} onClick={() => setSlide(i)} aria-label={`Go to slide ${i+1}`} className={`h-2.5 rounded-full transition-all ${slide === i ? 'w-8 bg-saffron' : 'w-2.5 bg-slate-300'}`}/>)}<button onClick={() => move(1)} aria-label="Next slide" className="h-10 w-10 rounded-full text-navy hover:bg-blue-50">→</button></div>
        </div>
      </section>

      <section id="organisations" className="bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28"><div className="mx-auto max-w-7xl"><Heading label="Our network" title="Help, powered by partnership" text="Explore NGOs, civil-society groups, and public-service organisations working together for people across India."/><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{organisations.map(([initials,name,detail,color]) => <a key={name} href="#connect" className="group flex items-center gap-4 rounded-2xl border border-slate-200 p-5 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg"><span className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl text-sm font-extrabold ${color}`}>{initials}</span><span className="flex-1"><strong className="block text-navy">{name}</strong><span className="mt-1 block text-sm text-slate-500">{detail}</span></span><span className="text-xl text-slate-300 group-hover:text-saffron">→</span></a>)}</div><div className="mt-8 text-center"><button className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-bold text-navy hover:border-navy hover:bg-blue-50">View all organisations</button></div></div></section>

      <section id="impact" className="relative overflow-hidden bg-[#071d43] px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28"><div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-saffron via-white to-india-green"/><div className="relative mx-auto max-w-7xl"><div className="mx-auto mb-10 max-w-2xl text-center"><p className="mb-3 text-xs font-bold uppercase tracking-[.22em] text-orange-300">Voices of service</p><h2 className="font-serif text-3xl font-bold sm:text-4xl">Leaders on people-first progress</h2><p className="mt-4 text-blue-100">A dedicated space for approved statements from public leaders and institutions.</p></div><div className="grid gap-5 lg:grid-cols-3">{testimonials.map(([quote,name,role],i) => <article key={i} className="rounded-2xl border border-white/10 bg-white/[.07] p-7"><div className="mb-4 font-serif text-4xl text-saffron">“</div><p className="min-h-32 leading-7 text-blue-50">{quote}</p><div className="mt-7 border-t border-white/10 pt-5"><p className="font-bold">{name}</p><p className="mt-1 text-xs text-blue-200">{role}</p></div></article>)}</div><p className="mt-6 text-center text-xs text-blue-200">Sample content — replace with authorised, attributable testimonials before publication.</p></div></section>

      <section id="faq" className="bg-[#fffaf2] px-4 py-20 sm:px-6 lg:px-8 lg:py-28"><div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[.75fr_1.25fr]"><div><Heading label="Help centre" title="Frequently asked questions" text="Quick answers about the platform, access, and partnerships." left/><div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm"><p className="font-bold text-navy">Still need help?</p><p className="mt-2 text-sm text-slate-600">Our support team can guide you to the right resource.</p><a href="mailto:help@sahaiindia.in" className="mt-4 inline-block text-sm font-bold text-orange-700">Contact support →</a></div></div><div className="space-y-3">{faqs.map(([q,a],i) => <details key={q} open={i === 0} className="group rounded-xl border border-slate-200 bg-white shadow-sm"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-bold text-navy"><span>{q}</span><span className="grid h-8 w-8 place-items-center rounded-full bg-orange-50 text-xl text-saffron transition group-open:rotate-45">+</span></summary><p className="px-5 pb-5 pr-14 text-sm leading-7 text-slate-600">{a}</p></details>)}</div></div></section>
    </main>

    <footer id="connect" className="bg-[#06172f] text-white"><div className="border-b border-white/10 px-4 py-14 sm:px-6 lg:px-8"><div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-4"><div><div className="flex items-center gap-3"><span className="rounded-xl bg-white p-1"><img src={logo} alt="" className="h-14 w-14 object-contain"/></span><span><strong className="block font-serif text-xl">Sahai India</strong><small className="uppercase tracking-[.15em] text-blue-200">Together, we serve</small></span></div><p className="mt-5 text-sm leading-6 text-slate-300">Connecting people, organisations, and essential services to build a more supported India.</p><p className="mt-4 text-xs text-slate-400">Not an official Government of India website unless expressly stated and authorised.</p></div><div><h3 className="font-bold">Explore</h3><div className="mt-5 grid gap-3 text-left text-sm text-slate-300">{['About Sahai India','Find an organisation','Volunteer with us','Partner onboarding','Stories of impact'].map(x => x === 'Partner onboarding' ? <button key={x} type="button" onClick={() => openOnboarding()} className="w-fit hover:text-orange-300">{x}</button> : <a key={x} href="#" className="hover:text-orange-300">{x}</a>)}</div></div><div><h3 className="font-bold">Useful government portals</h3><div className="mt-5 grid gap-3 text-sm text-slate-300">{portals.map(([name,url]) => <a key={name} href={url} target="_blank" rel="noreferrer" className="hover:text-orange-300">{name} ↗</a>)}</div></div><div><h3 className="font-bold">Contact & support</h3><div className="mt-5 grid gap-3 text-sm text-slate-300"><a href="mailto:help@sahaiindia.in">help@sahaiindia.in</a><a href="tel:+911800000000">1800-000-000</a><span>Monday–Saturday, 9 AM–6 PM</span><span>New Delhi, India</span></div><button className="mt-6 rounded-lg bg-saffron px-5 py-3 text-sm font-bold">Get help now</button></div></div></div><div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-slate-400 sm:flex-row sm:justify-between"><p>© {new Date().getFullYear()} Sahai India. All rights reserved.</p><div className="flex flex-wrap gap-5"><a href="#">Privacy policy</a><a href="#">Terms of use</a><a href="#">Accessibility</a><a href="#">Sitemap</a></div></div></footer>
  </div>
}

export default App
