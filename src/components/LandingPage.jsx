import { useState } from 'react';

/* ═══════════════════════════════════════════
   DELTA4 LANDING PAGE
   Integrated marketing page — unauthenticated users see this at /
   ═══════════════════════════════════════════ */

export default function LandingPage({ onGetStarted }) {
  const [annual, setAnnual] = useState(true);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={S.page}>
      {/* ─── NAV ─── */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <div style={S.navLogo}>
            <span style={S.navDelta}>&Delta;</span>
            <span style={S.navName}>Delta4</span>
          </div>
          <div style={S.navLinks}>
            <button style={S.navLink} onClick={() => scrollTo('how')}>How it works</button>
            <button style={S.navLink} onClick={() => scrollTo('pricing')}>Pricing</button>
            <button style={S.navCta} onClick={onGetStarted}>Sign in</button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section style={S.hero}>
        <div style={S.heroInner}>
          <div style={S.heroBadge}>Built for solopreneurs &amp; corporate professionals</div>
          <h1 style={S.heroH1}>
            Stop guessing what to work on.
            <br />
            <span style={S.heroAccent}>Know which tasks move the needle.</span>
          </h1>
          <p style={S.heroSub}>
            Delta4 is the first daily action system that ranks every task by business impact —
            not urgency, not deadlines, not gut feeling. Whether you're running a solo business or
            leading a corporate team, one formula changes everything. One daily habit. Real compound growth.
          </p>
          <div style={S.heroBtns}>
            <button style={S.heroBtn} onClick={onGetStarted}>Start free &mdash; no card needed</button>
          </div>
          <p style={S.heroProof}>Join solopreneurs and corporate teams who stopped being busy and started being productive.</p>

          {/* App mockup */}
          <div style={S.mockup}>
            <div style={S.mockupHeader}>
              <span style={S.mockupDelta}>&Delta;</span>
              <span style={S.mockupTitle}>Today &middot; Mon Apr 13</span>
              <span style={S.mockupScore}>Earned &Delta; 18.4</span>
            </div>
            {[
              { title: 'Write launch email sequence', d: 8.8, cat: 'Revenue', done: true },
              { title: 'Record module 3 video', d: 7.6, cat: 'Product', done: true },
              { title: 'Post LinkedIn thought piece', d: 6.0, cat: 'Marketing', done: false },
              { title: 'Reconcile invoices', d: 2.4, cat: 'Admin', done: false },
            ].map((t, i) => (
              <div key={i} style={{ ...S.mockRow, opacity: t.done ? 0.6 : 1 }}>
                <div style={{ ...S.mockCheck, ...(t.done ? S.mockCheckDone : {}) }}>
                  {t.done && '\u2713'}
                </div>
                <div style={S.mockBody}>
                  <span style={{ ...S.mockTitle, textDecoration: t.done ? 'line-through' : 'none' }}>{t.title}</span>
                  <span style={S.mockCat}>{t.cat}</span>
                </div>
                <span style={{ ...S.mockDelta, color: t.d >= 7 ? '#E8B931' : t.d >= 4 ? '#7B8CDE' : '#8B9DAF' }}>
                  &Delta;{t.d}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROBLEM ─── */}
      <section style={S.section}>
        <div style={S.container}>
          <h2 style={S.sectionH2}>The productivity trap</h2>
          <p style={S.sectionSub}>
            You're completing tasks every day. But are they the <em>right</em> tasks?
          </p>
          <div style={S.painGrid}>
            {[
              { stat: '80%', text: 'of daily tasks create zero lasting value — whether you run a solo business or manage a corporate team' },
              { stat: '10+', text: 'productivity tools tried and abandoned — none answered "what matters most?"' },
              { stat: '0', text: 'tools on the market that score tasks by actual business impact' },
            ].map((p, i) => (
              <div key={i} style={S.painCard}>
                <div style={S.painStat}>{p.stat}</div>
                <div style={S.painText}>{p.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how" style={{ ...S.section, background: '#161B22' }}>
        <div style={S.container}>
          <h2 style={S.sectionH2}>Three steps, every morning</h2>
          <p style={S.sectionSub}>No setup wizards. No 30-minute onboarding. Score your first task in 60 seconds.</p>
          <div style={S.stepsGrid}>
            {[
              { num: '01', title: 'Score each task', desc: 'Rate short-term payoff and long-term compounding on a simple 1–10 scale. The formula does the rest.' },
              { num: '02', title: 'Work top-down', desc: 'Your ranked list shows highest-impact tasks first. Start at the top. Skip the noise.' },
              { num: '03', title: 'Track your delta', desc: 'Watch your daily and weekly delta scores compound. See which categories of work actually move the business.' },
            ].map((s, i) => (
              <div key={i} style={S.stepCard}>
                <div style={S.stepNum}>{s.num}</div>
                <h3 style={S.stepTitle}>{s.title}</h3>
                <p style={S.stepDesc}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── THE FORMULA ─── */}
      <section style={S.section}>
        <div style={S.container}>
          <h2 style={S.sectionH2}>The Delta Score</h2>
          <p style={S.sectionSub}>
            One number that separates busywork from business-building work.
          </p>
          <div style={S.formulaBox}>
            <div style={S.formulaText}>&Delta; = ST &times; 0.4 &nbsp;+&nbsp; LT &times; 0.6</div>
            <div style={S.formulaExplain}>
              <div style={S.formulaRow}>
                <span style={S.formulaLabel}>ST (Short-term)</span>
                <span style={S.formulaDef}>Immediate payoff — revenue, client delivery, urgent fixes</span>
              </div>
              <div style={S.formulaRow}>
                <span style={S.formulaLabel}>LT (Long-term)</span>
                <span style={S.formulaDef}>Compounding value — systems, content, skills, brand</span>
              </div>
            </div>
            <p style={S.formulaNote}>
              The 60/40 long-term weight is intentional. Solopreneurs who over-index on
              short-term tasks burn out. The formula nudges you toward work that compounds.
            </p>
          </div>

          {/* Example comparison */}
          <div style={S.exGrid}>
            <div style={S.exCard}>
              <div style={{ ...S.exDelta, color: '#E8B931' }}>&Delta; 8.8</div>
              <div style={S.exTask}>"Write launch email sequence"</div>
              <div style={S.exScore}>ST: 7 &middot; LT: 10</div>
              <div style={S.exWhy}>Drives revenue now AND builds an asset you reuse</div>
            </div>
            <div style={S.exCard}>
              <div style={{ ...S.exDelta, color: '#8B9DAF' }}>&Delta; 2.4</div>
              <div style={S.exTask}>"Reconcile invoices"</div>
              <div style={S.exScore}>ST: 4 &middot; LT: 1</div>
              <div style={S.exWhy}>Necessary — but don't let it eat your morning</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── COMPARISON ─── */}
      <section style={{ ...S.section, background: '#161B22' }}>
        <div style={S.container}>
          <h2 style={S.sectionH2}>Not another task manager</h2>
          <p style={S.sectionSub}>
            Every tool organizes tasks. Only Delta4 ranks them by impact.
          </p>
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={{ ...S.th, textAlign: 'left' }}>Feature</th>
                  <th style={S.th}>Delta4</th>
                  <th style={S.th}>Sunsama</th>
                  <th style={S.th}>Todoist</th>
                  <th style={S.th}>Trevor AI</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Impact scoring', true, false, false, false],
                  ['Weighted formula', true, false, false, false],
                  ['Daily ranked list', true, false, true, false],
                  ['Recurring tasks', true, true, true, true],
                  ['Weekly analytics', true, true, false, false],
                  ['Category insights', true, false, false, false],
                  ['Calendar views', true, true, false, true],
                  ['Free tier', true, false, true, true],
                  ['Price (Pro)', '$8/mo', '$16/mo', '$5/mo', '$5/mo'],
                ].map((row, i) => (
                  <tr key={i} style={i % 2 === 0 ? { background: '#0D111799' } : {}}>
                    <td style={{ ...S.td, textAlign: 'left', fontWeight: 500 }}>{row[0]}</td>
                    {row.slice(1).map((v, j) => (
                      <td key={j} style={{ ...S.td, color: v === true ? '#4CAF50' : v === false ? '#555' : '#E6EDF3' }}>
                        {v === true ? '\u2713' : v === false ? '\u2014' : v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── PERSONAS / TESTIMONIALS ─── */}
      <section style={S.section}>
        <div style={S.container}>
          <h2 style={S.sectionH2}>Built for how high-performers actually work</h2>
          <div style={S.personaGrid}>
            {[
              {
                name: 'Sarah, 34',
                role: 'Online course creator',
                quote: 'I used to finish every day exhausted but with nothing to show for it. Now I open Delta4, work the top 3 tasks, and my revenue pipeline actually moves.',
                delta: 'Avg daily \u0394: 6.2 \u2192 8.4 in 4 weeks',
              },
              {
                name: 'Marcus, 28',
                role: 'Consultant + side-project builder',
                quote: 'I only get 10 hours a week for my SaaS. Delta4 makes sure I spend them on the highest-leverage tasks, not just whatever feels urgent.',
                delta: 'Shipped 3x faster with weekly \u0394 tracking',
              },
              {
                name: 'Jen, 41',
                role: 'Fractional CMO',
                quote: 'The category analytics showed me I was spending 60% on admin. I restructured my week and my pipeline tripled in two months.',
                delta: 'Admin ratio: 60% \u2192 20%',
              },
              {
                name: 'David, 38',
                role: 'VP of Operations, Series B startup',
                quote: 'I rolled Delta4 out to my team of 12. Within a month, our sprint velocity doubled because everyone could see which tasks actually moved our KPIs.',
                delta: 'Team sprint velocity: 2x in 30 days',
              },
            ].map((p, i) => (
              <div key={i} style={S.personaCard}>
                <div style={S.personaQuote}>"{p.quote}"</div>
                <div style={S.personaMeta}>
                  <div style={S.personaName}>{p.name}</div>
                  <div style={S.personaRole}>{p.role}</div>
                </div>
                <div style={S.personaDelta}>{p.delta}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" style={{ ...S.section, background: '#161B22' }}>
        <div style={S.container}>
          <h2 style={S.sectionH2}>Simple pricing. Start free.</h2>
          <p style={S.sectionSub}>
            The full scoring engine is free forever. Pro unlocks analytics. Corporate teams get volume licensing.
          </p>

          {/* Toggle */}
          <div style={S.toggle}>
            <button
              style={{ ...S.toggleBtn, ...(annual ? S.toggleActive : {}) }}
              onClick={() => setAnnual(true)}
            >
              Annual <span style={S.toggleSave}>save 33%</span>
            </button>
            <button
              style={{ ...S.toggleBtn, ...(!annual ? S.toggleActive : {}) }}
              onClick={() => setAnnual(false)}
            >
              Monthly
            </button>
          </div>

          <div style={S.priceGrid}>
            {/* FREE */}
            <div style={S.priceCard}>
              <div style={S.priceLabel}>Free</div>
              <div style={S.priceAmount}>$0</div>
              <div style={S.pricePer}>forever</div>
              <ul style={S.priceFeatures}>
                {[
                  'Delta scoring engine',
                  'Unlimited tasks',
                  'Day / Week / Month / Year views',
                  'All 7 recurrence cadences',
                  'Magic link sign-in',
                  'Score strip dashboard',
                ].map((f, i) => (
                  <li key={i} style={S.priceFeature}>
                    <span style={S.priceCheck}>{'\u2713'}</span> {f}
                  </li>
                ))}
              </ul>
              <button style={S.priceBtnOutline} onClick={onGetStarted}>Get started</button>
            </div>

            {/* PRO */}
            <div style={{ ...S.priceCard, ...S.priceCardPro }}>
              <div style={S.pricePopular}>Most popular</div>
              <div style={S.priceLabel}>Pro</div>
              <div style={S.priceAmount}>${annual ? '8' : '12'}</div>
              <div style={S.pricePer}>/month{annual ? ', billed annually' : ''}</div>
              <ul style={S.priceFeatures}>
                {[
                  'Everything in Free',
                  '30-day analytics dashboard',
                  '14-day delta trend chart',
                  'Category breakdown & insights',
                  'Weekly review dashboard',
                  'Weekly email digest',
                  'Priority support',
                ].map((f, i) => (
                  <li key={i} style={S.priceFeature}>
                    <span style={S.priceCheck}>{'\u2713'}</span> {f}
                  </li>
                ))}
              </ul>
              <button style={S.priceBtnGold} onClick={onGetStarted}>Start free, upgrade later</button>
            </div>
          </div>

          {/* CORPORATE */}
          <div style={S.corpBox}>
            <div style={S.corpBadge}>ENTERPRISE</div>
            <h3 style={S.corpHeading}>Corporate license for 10–100 users</h3>
            <p style={S.corpSubtext}>Volume pricing, team dashboards, and onboarding support for organizations.</p>
            <a href="mailto:delta4app@gmail.com" style={S.corpLink}>
              <span style={S.corpMailIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="m22 7-10 5L2 7"/>
                </svg>
              </span>
              delta4app@gmail.com
            </a>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section style={S.cta}>
        <div style={S.container}>
          <div style={S.ctaDelta}>&Delta;</div>
          <h2 style={S.ctaH2}>Your highest-impact day starts now</h2>
          <p style={S.ctaSub}>
            Free forever. No credit card. One magic link and you're in.
          </p>
          <button style={S.ctaBtn} onClick={onGetStarted}>Get started free</button>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={S.footer}>
        <div style={S.footerInner}>
          <div style={S.footerLeft}>
            <span style={S.footerDelta}>&Delta;</span>
            <span style={S.footerName}>Delta4</span>
            <span style={S.footerCopy}>&copy; {new Date().getFullYear()} Elizabeth Campbell Page</span>
          </div>
          <div style={S.footerCenter}>
            <a href="https://x.com/delta4app" target="_blank" rel="noopener noreferrer" style={S.socialIcon} title="X (Twitter)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://linkedin.com/company/delta4app" target="_blank" rel="noopener noreferrer" style={S.socialIcon} title="LinkedIn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
            <a href="https://delta4app.substack.com" target="_blank" rel="noopener noreferrer" style={S.socialIcon} title="Substack">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/></svg>
            </a>
            <a href="https://youtube.com/@delta4app" target="_blank" rel="noopener noreferrer" style={S.socialIcon} title="YouTube">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
            <a href="mailto:delta4app@gmail.com" style={S.socialIcon} title="Email">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="3" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <path d="M2 6l8 5 8-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </a>
          </div>
          <div style={S.footerRight}>
            <span style={S.footerTag}>Impact-Ranked Daily Action System</span>
          </div>
        </div>
      </footer>
    </div>
  );
}


/* ═══════════════════════════════════════════
   STYLES (inline, matching Delta4 design system)
   ═══════════════════════════════════════════ */

const S = {
  page: { minHeight: '100vh', background: '#0D1117', color: '#E6EDF3', fontFamily: "'DM Sans', -apple-system, sans-serif" },

  /* Nav */
  nav: { position: 'sticky', top: 0, zIndex: 100, background: '#0D1117ee', backdropFilter: 'blur(12px)', borderBottom: '1px solid #21262D' },
  navInner: { maxWidth: '1080px', margin: '0 auto', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  navLogo: { display: 'flex', alignItems: 'center', gap: '8px' },
  navDelta: { fontFamily: "'DM Mono', monospace", fontSize: '24px', fontWeight: 700, color: '#E8B931' },
  navName: { fontSize: '18px', fontWeight: 700, color: '#E6EDF3' },
  navLinks: { display: 'flex', alignItems: 'center', gap: '20px' },
  navLink: { background: 'none', border: 'none', color: '#8B9DAF', fontSize: '14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", padding: '4px 0' },
  navCta: { background: 'linear-gradient(135deg, #E8B931, #D4A017)', border: 'none', borderRadius: '8px', color: '#0D1117', padding: '8px 20px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },

  /* Hero */
  hero: { padding: '80px 24px 40px', textAlign: 'center' },
  heroInner: { maxWidth: '720px', margin: '0 auto' },
  heroBadge: { display: 'inline-block', background: '#E8B93115', border: '1px solid #E8B93133', color: '#E8B931', fontSize: '13px', fontWeight: 600, borderRadius: '20px', padding: '6px 16px', marginBottom: '24px' },
  heroH1: { fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, lineHeight: 1.15, marginBottom: '20px', color: '#E6EDF3' },
  heroAccent: { color: '#E8B931' },
  heroSub: { fontSize: '17px', color: '#8B9DAF', lineHeight: 1.6, maxWidth: '560px', margin: '0 auto 32px' },
  heroBtns: { marginBottom: '16px' },
  heroBtn: { background: 'linear-gradient(135deg, #E8B931, #D4A017)', border: 'none', borderRadius: '10px', color: '#0D1117', padding: '14px 36px', fontSize: '16px', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  heroProof: { fontSize: '13px', color: '#555', marginBottom: '48px' },

  /* Mockup */
  mockup: { maxWidth: '440px', margin: '0 auto', background: '#161B22', borderRadius: '16px', border: '1px solid #21262D', overflow: 'hidden', textAlign: 'left' },
  mockupHeader: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderBottom: '1px solid #21262D' },
  mockupDelta: { fontFamily: "'DM Mono', monospace", fontSize: '20px', fontWeight: 700, color: '#E8B931' },
  mockupTitle: { fontSize: '13px', fontWeight: 600, color: '#E6EDF3', flex: 1 },
  mockupScore: { fontFamily: "'DM Mono', monospace", fontSize: '12px', color: '#4CAF50', fontWeight: 600 },
  mockRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', borderBottom: '1px solid #21262D11' },
  mockCheck: { width: '20px', height: '20px', borderRadius: '5px', border: '2px solid #3a3f4a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#4CAF50', flexShrink: 0 },
  mockCheckDone: { background: '#4CAF5022', borderColor: '#4CAF50' },
  mockBody: { flex: 1, minWidth: 0 },
  mockTitle: { display: 'block', fontSize: '13px', fontWeight: 500, color: '#E6EDF3', marginBottom: '2px' },
  mockCat: { fontSize: '10px', color: '#8B9DAF' },
  mockDelta: { fontFamily: "'DM Mono', monospace", fontSize: '13px', fontWeight: 700, flexShrink: 0 },

  /* Sections */
  section: { padding: '80px 24px' },
  container: { maxWidth: '960px', margin: '0 auto' },
  sectionH2: { fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, textAlign: 'center', marginBottom: '12px' },
  sectionSub: { fontSize: '16px', color: '#8B9DAF', textAlign: 'center', maxWidth: '520px', margin: '0 auto 48px', lineHeight: 1.5 },

  /* Pain points */
  painGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' },
  painCard: { background: '#161B22', borderRadius: '14px', border: '1px solid #21262D', padding: '28px 24px', textAlign: 'center' },
  painStat: { fontFamily: "'DM Mono', monospace", fontSize: '40px', fontWeight: 800, color: '#E07B5B', marginBottom: '10px' },
  painText: { fontSize: '14px', color: '#8B9DAF', lineHeight: 1.5 },

  /* Steps */
  stepsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' },
  stepCard: { background: '#0D1117', borderRadius: '14px', border: '1px solid #21262D', padding: '28px 24px' },
  stepNum: { fontFamily: "'DM Mono', monospace", fontSize: '14px', fontWeight: 700, color: '#E8B931', marginBottom: '12px' },
  stepTitle: { fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#E6EDF3' },
  stepDesc: { fontSize: '14px', color: '#8B9DAF', lineHeight: 1.6 },

  /* Formula */
  formulaBox: { background: '#161B22', borderRadius: '16px', border: '1px solid #E8B93133', padding: '36px 28px', textAlign: 'center', maxWidth: '560px', margin: '0 auto 40px' },
  formulaText: { fontFamily: "'DM Mono', monospace", fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 700, color: '#E8B931', marginBottom: '24px' },
  formulaExplain: { display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', marginBottom: '20px' },
  formulaRow: { display: 'flex', gap: '12px', alignItems: 'baseline' },
  formulaLabel: { fontFamily: "'DM Mono', monospace", fontSize: '13px', fontWeight: 700, color: '#E8B931', minWidth: '90px', flexShrink: 0 },
  formulaDef: { fontSize: '14px', color: '#8B9DAF', lineHeight: 1.4 },
  formulaNote: { fontSize: '13px', color: '#555', lineHeight: 1.5, fontStyle: 'italic' },

  /* Example cards */
  exGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', maxWidth: '640px', margin: '0 auto' },
  exCard: { background: '#161B22', borderRadius: '14px', border: '1px solid #21262D', padding: '24px', textAlign: 'center' },
  exDelta: { fontFamily: "'DM Mono', monospace", fontSize: '28px', fontWeight: 800, marginBottom: '8px' },
  exTask: { fontSize: '15px', fontWeight: 600, color: '#E6EDF3', marginBottom: '6px' },
  exScore: { fontFamily: "'DM Mono', monospace", fontSize: '12px', color: '#8B9DAF', marginBottom: '8px' },
  exWhy: { fontSize: '13px', color: '#8B9DAF', lineHeight: 1.4, fontStyle: 'italic' },

  /* Comparison table */
  tableWrap: { overflowX: 'auto', borderRadius: '12px', border: '1px solid #21262D' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '520px' },
  th: { padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#8B9DAF', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #21262D', background: '#0D1117' },
  td: { padding: '10px 16px', textAlign: 'center', borderBottom: '1px solid #21262D11' },

  /* Personas */
  personaGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' },
  personaCard: { background: '#161B22', borderRadius: '14px', border: '1px solid #21262D', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  personaQuote: { fontSize: '14px', color: '#E6EDF3', lineHeight: 1.6, fontStyle: 'italic', flex: 1 },
  personaMeta: { display: 'flex', flexDirection: 'column' },
  personaName: { fontSize: '14px', fontWeight: 700, color: '#E6EDF3' },
  personaRole: { fontSize: '12px', color: '#8B9DAF' },
  personaDelta: { fontFamily: "'DM Mono', monospace", fontSize: '12px', color: '#4CAF50', fontWeight: 600 },

  /* Pricing */
  toggle: { display: 'flex', justifyContent: 'center', gap: '4px', background: '#0D1117', borderRadius: '10px', padding: '4px', maxWidth: '280px', margin: '0 auto 40px', border: '1px solid #21262D' },
  toggleBtn: { flex: 1, padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#8B9DAF', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s' },
  toggleActive: { background: '#E8B931', color: '#0D1117' },
  toggleSave: { fontSize: '10px', fontWeight: 700, marginLeft: '4px', opacity: 0.7 },

  priceGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', maxWidth: '680px', margin: '0 auto' },
  priceCard: { background: '#0D1117', borderRadius: '16px', border: '1px solid #21262D', padding: '36px 28px', textAlign: 'center', position: 'relative' },
  priceCardPro: { border: '2px solid #E8B931', background: '#0D1117' },
  pricePopular: { position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#E8B931', color: '#0D1117', fontSize: '11px', fontWeight: 700, padding: '4px 14px', borderRadius: '12px' },
  priceLabel: { fontSize: '14px', fontWeight: 700, color: '#8B9DAF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' },
  priceAmount: { fontFamily: "'DM Mono', monospace", fontSize: '48px', fontWeight: 800, color: '#E6EDF3', lineHeight: 1 },
  pricePer: { fontSize: '14px', color: '#555', marginBottom: '24px' },
  priceFeatures: { listStyle: 'none', padding: 0, margin: '0 0 28px', textAlign: 'left' },
  priceFeature: { fontSize: '14px', color: '#8B9DAF', padding: '6px 0', lineHeight: 1.4 },
  priceCheck: { color: '#4CAF50', marginRight: '8px', fontWeight: 700 },
  priceBtnOutline: { width: '100%', padding: '12px', background: 'transparent', border: '2px solid #21262D', borderRadius: '10px', color: '#E6EDF3', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  priceBtnGold: { width: '100%', padding: '12px', background: 'linear-gradient(135deg, #E8B931, #D4A017)', border: 'none', borderRadius: '10px', color: '#0D1117', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  corpBox: {
    textAlign: 'center',
    marginTop: '40px',
    padding: '36px 28px',
    background: 'linear-gradient(135deg, rgba(232, 185, 49, 0.12) 0%, rgba(212, 160, 23, 0.06) 100%)',
    borderRadius: '16px',
    border: '2px solid #E8B931',
    boxShadow: '0 8px 32px rgba(232, 185, 49, 0.15)',
    position: 'relative',
  },
  corpBadge: {
    display: 'inline-block',
    padding: '6px 14px',
    background: 'linear-gradient(135deg, #E8B931, #D4A017)',
    color: '#0D1117',
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '1.5px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontFamily: "'DM Mono', monospace",
  },
  corpHeading: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#E6EDF3',
    margin: '0 0 8px 0',
    fontFamily: "'DM Sans', sans-serif",
  },
  corpSubtext: {
    fontSize: '15px',
    color: '#8B9DAF',
    margin: '0 0 20px 0',
    lineHeight: 1.5,
  },
  corpLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '16px',
    fontWeight: 700,
    color: '#E8B931',
    textDecoration: 'none',
    padding: '12px 24px',
    background: 'rgba(232, 185, 49, 0.1)',
    border: '1px solid rgba(232, 185, 49, 0.4)',
    borderRadius: '10px',
    fontFamily: "'DM Mono', monospace",
  },
  corpMailIcon: { display: 'inline-flex', alignItems: 'center' },

  /* CTA */
  cta: { padding: '80px 24px', textAlign: 'center' },
  ctaDelta: { fontFamily: "'DM Mono', monospace", fontSize: '56px', fontWeight: 700, color: '#E8B931', marginBottom: '16px' },
  ctaH2: { fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, marginBottom: '12px' },
  ctaSub: { fontSize: '16px', color: '#8B9DAF', marginBottom: '32px' },
  ctaBtn: { background: 'linear-gradient(135deg, #E8B931, #D4A017)', border: 'none', borderRadius: '10px', color: '#0D1117', padding: '14px 40px', fontSize: '16px', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },

  /* Footer */
  footer: { borderTop: '1px solid #21262D', padding: '24px' },
  footerInner: { maxWidth: '960px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' },
  footerLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
  footerDelta: { fontFamily: "'DM Mono', monospace", fontSize: '18px', fontWeight: 700, color: '#E8B931' },
  footerName: { fontSize: '14px', fontWeight: 700, color: '#E6EDF3' },
  footerCopy: { fontSize: '12px', color: '#555' },
  footerRight: {},
  footerTag: { fontSize: '12px', color: '#555', fontStyle: 'italic' },
};
