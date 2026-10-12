/* ============ THEME TOGGLE ============ */
const root = document.documentElement;
const toggleBtn = document.getElementById('themeToggle');
toggleBtn.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  try { localStorage.setItem('danitech-theme', next); } catch {}
});

/* ============ SCROLLED NAVBAR ============ */
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 12);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

/* ============ MOBILE DRAWER ============ */
const drawer = document.getElementById('drawer');
const backdrop = document.getElementById('drawerBackdrop');
const openDrawer = () => { drawer.classList.add('open'); backdrop.classList.add('show'); document.body.style.overflow = 'hidden'; };
const closeDrawer = () => { drawer.classList.remove('open'); backdrop.classList.remove('show'); document.body.style.overflow = ''; };
document.getElementById('menuBtn').addEventListener('click', openDrawer);
document.getElementById('drawerClose').addEventListener('click', closeDrawer);
backdrop.addEventListener('click', closeDrawer);
drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));

/* ============ PARTICLES ============ */
const particles = document.getElementById('particles');
const PCOUNT = 22;
for (let i = 0; i < PCOUNT; i++) {
  const s = document.createElement('span');
  const size = 2 + (i % 4);
  s.style.cssText = `
    left:${(i * 53) % 100}%;
    top:${(i * 37) % 100}%;
    width:${size}px;height:${size}px;
    animation-delay:${(i % 7) * 0.6}s;
    animation-duration:${8 + (i % 6)}s;
  `;
  particles.appendChild(s);
}

/* ============ ICONS (inline SVG strings) ============ */
const icons = {
  code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  mobile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>',
  bot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>',
  palette: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>',
  sparkles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
  cpu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>',
  zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  rocket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>',
  telegram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
};

/* ============ SERVICES ============ */

const services = [
  {
    i: 'code',
    t: 'Web Development',
    d: 'Modern, fast, scalable websites and web applications.',
    m: 'We build responsive business websites, portfolios, e-commerce platforms, dashboards, SaaS products, custom web applications, landing pages, and enterprise solutions using modern technologies with speed, security, and scalability in mind.'
  },
  {
    i: 'mobile',
    t: 'App Development',
    d: 'Mobile and cross-platform apps that users love.',
    m: 'We develop Android, iOS and cross-platform mobile applications with beautiful UI/UX, cloud integration, authentication, payments, APIs, notifications, and long-term maintenance.'
  },
  {
    i: 'bot',
    t: 'Robotics',
    d: 'Intelligent robotic systems and automation solutions.',
    m: 'Dani-Tech designs intelligent robotic systems for homes, businesses, education, agriculture, healthcare, and industrial automation, integrating AI, sensors, computer vision, and IoT.'
  },
  {
    i: 'palette',
    t: 'Graphics Design',
    d: 'Visually striking graphics and digital assets.',
    m: 'We create logos, brand identities, social media graphics, flyers, banners, UI/UX mockups, presentations, advertisements, and marketing materials.'
  },
  {
    i: 'sparkles',
    t: 'Branding',
    d: 'Powerful brand identities and strategies.',
    m: 'Our branding service covers logo design, brand strategy, visual identity, typography, colour systems, brand guidelines, and digital positioning.'
  },
  {
    i: 'share',
    t: 'Social Media Management',
    d: 'Grow and engage audiences online.',
    m: 'We manage social media accounts, create engaging content, schedule posts, run advertising campaigns, monitor analytics, and help businesses grow their online presence.'
  }
];

document.getElementById("servicesGrid").innerHTML = services.map((s, i) => `
<div class="card service-card glass reveal">
    <div class="head">
        <div class="badge">${icons[s.i]}</div>
        <span class="num">0${i+1}</span>
    </div>

    <h3>${s.t}</h3>

    <p>${s.d}</p>

    <div class="extra" style="display:none;margin-top:15px;color:var(--muted);line-height:1.7;">
        ${s.m}
    </div>

    <button
        onclick="
            const extra=this.previousElementSibling;
            if(extra.style.display==='none'){
                extra.style.display='block';
                this.innerHTML='Show Less ↑';
            }else{
                extra.style.display='none';
                this.innerHTML='Learn More →';
            }
        "
        style="
            margin-top:18px;
            border:none;
            background:none;
            color:#39FF14;
            font-weight:700;
            cursor:pointer;
            font-size:15px;
        ">
        Learn More →
    </button>

</div>
`).join("");

/* ============ PROJECTS ============ */

const projects = [
  {
    n: "FarmLink",
    img: "images/farmlink.jpg",
    d: "FarmLink is Dani-Tech's digital agricultural marketplace connecting farmers, buyers and verified Dani-Tech agents. It enables farmers to list produce, buyers to discover trusted suppliers, and agents to coordinate pickups and deliveries. The platform promotes transparent pricing and efficient agricultural trade across Nigeria.",
    s: "80% Completed",
    c: "dev"
  },

  {
    n: "ConversaAI",
    img: "images/ConversaAI.png",
    d: "ConversaAI is Dani-Tech's intelligent customer engagement platform that helps businesses respond to customers 24/7 through websites and WhatsApp. It answers questions, recommends products and services, captures qualified leads, assists with bookings, and delivers AI-powered customer support tailored to each business.",
    s: "Currently in Development",
    c: "dev"
  },

  {
    n: "Threndz",
    img: "images/threndz1.jpg",
    d: "Threndz is Dani-Tech's next-generation creator platform combining social media, music streaming and video sharing into one ecosystem. It empowers creators to publish content, grow communities and monetize their audience.",
    s: "Coming Soon • 2027",
    c: "soon"
  },

  {
    n: "Climax AI",
    img: "images/climax.jpg",
    d: "Climax AI is Dani-Tech's future AI ecosystem designed to deliver intelligent automation, productivity tools and advanced AI assistants for businesses, developers and everyday users.",
    s: "Coming Soon",
    c: "soon"
  },

  {
    n: "DowealthHR",
    img: "images/dowealthhr.png",
    d: "DowealthHR is a Human Resources Management System developed through a strategic partnership between Dani-Tech and Dowealth Training & Consulting. It brings employee management, attendance tracking, KPI and performance management, payslips, recruitment and other essential workforce tools together in one connected platform.",
    s: "Currently in Development",
    c: "dev"
  },

  {
    n: "AI Lab",
    img: "images/Ailabs.png",
    d: "The Dani-Tech AI Lab is our future research division focused on artificial intelligence, robotics, smart home automation, autonomous systems and next-generation technologies that will shape the future.",
    s: "Coming Soon",
    c: "soon"
  }
];

document.getElementById("projectsGrid").innerHTML = projects.map((p, i) => `
<div class="card project-card glass reveal">

    <img
        src="${p.img}"
        alt="${p.n}"
        style="
            width:100%;
            height:190px;
            object-fit:cover;
            border-radius:18px;
            margin-bottom:18px;
        "
    >

    <div class="head">
        <span class="status ${p.c}">
            ${p.s}
        </span>
    </div>

    <h3>${p.n}</h3>

    <p style="line-height:1.8;">
        ${p.d}
    </p>

    <div class="divider"></div>

    <div class="foot">
        <span>Project · 0${i+1}</span>
        <span>${icons.arrow}</span>
    </div>

</div>
`).join("");

/* ============ AI LAB ============ */
const aiCards = [
  { i: 'cpu', t: 'Generative AI', d: 'Multimodal models, agentic workflows and bespoke fine-tuning.' },
  { i: 'zap', t: 'Autonomous Agents', d: 'Goal-driven agents that reason, plan and act across systems.' },
  { i: 'rocket', t: 'Applied Research', d: 'From paper to production — turning research into shipped product.' },
];
document.getElementById('aiGrid').innerHTML = aiCards.map(c => `
  <div class="ai-card reveal">
    <div class="icon-box">${icons[c.i]}</div>
    <h3>${c.t}</h3>
    <p>${c.d}</p>
    <div class="bars">
      <div class="bar"><div data-w="80"></div></div>
      <div class="bar"><div data-w="62"></div></div>
      <div class="bar"><div data-w="94"></div></div>
    </div>
  </div>
`).join('');

/* ============ TESTIMONIALS ============ */
/* ============ WHAT OUR CLIENTS & PARTNERS SAY ============ */

const testimonials = [

  {
    img: "images/dowealth.jpg",
    n: "Dowealth Training & Consulting",
    r: "HR & Business Consulting",
    f: "Dani-Tech designed and developed our official company website, manages our Facebook content strategy, and is currently developing a Human Resource Management System (HRMS) tailored to our operations. Their professionalism, creativity and dedication have made them a trusted technology partner."
  },

  {
    img: "images/debdan1.jpg",
    n: "DEBDAN NIG. ENTERPRISE",
    r: "Grace-Driven Creations for Everyday Essentials",
    f: "Dani-Tech designed our official company logo and developed our business website, helping us establish a strong digital presence. Their team understood our vision and delivered a professional brand identity that represents our range of products, including liquid wash, Izal, Jik, air cream, body cream and air fresheners."
  },

  {
    img: "images/gb.png",
    n: "GB Holdings",
    r: "Real Estate & Investment Company",
    f: "Dani-Tech designed a professional logo that perfectly represents our company's vision and identity. Their creativity, attention to detail and commitment to quality exceeded our expectations."
  },

  {
    img: "images/richtech.png",
    n: "RichTech",
    r: "Strategic Technology Partner",
    f: "RichTech and Dani-Tech have entered a strategic partnership to develop next-generation smart home solutions. Dani-Tech will provide intelligent home automation systems and smart appliances that will power our future real estate developments."
  }

];

const testiHTML = [...testimonials, ...testimonials].map(t => `
<div class="testi-card glass">

    <div class="testi-head">
        <img src="${t.img}" alt="${t.n}" loading="lazy">

        <div>
            <div class="n">${t.n}</div>
            <div class="r">${t.r}</div>
        </div>
    </div>

    <p>"${t.f}"</p>

</div>
`).join("");

document.getElementById("testiTrack").innerHTML = testiHTML;

/* ============ CLIENTS & STRATEGIC PARTNERS ============ */

const partners = [

{
    n: "Dowealth Training & Consulting",
    logo: "images/dowealth.jpg",
    d: "Official Website • Facebook Management • HRMS Development"
},

{
    n: "DEBDAN NIG. ENTERPRISE",
    logo: "images/debdan1.jpg",
    d: "Logo Design • Official Business Website"
},

{
    n: "RichTech",
    logo: "images/richtech.png",
    d: "Strategic Smart Home Automation Partner"
}

];

document.getElementById("partnersGrid").innerHTML = partners.map(p=>`

<div class="partner-card glass reveal">

    <img
        src="${p.logo}"
        alt="${p.n}"
        style="
            width:90px;
            height:90px;
            object-fit:contain;
            margin:auto;
            display:block;
            border-radius:20px;
            margin-bottom:20px;
        "
    >

    <h3 style="text-align:center;">
        ${p.n}
    </h3>

    <p style="
        text-align:center;
        opacity:.8;
        line-height:1.7;
    ">
        ${p.d}
    </p>

</div>

`).join("");



/* ============ TRUSTED BY LOGOS ============ */

const logos=[

"images/dowealth.jpg",
"images/debdan1.jpg",
"images/richtech.png"

];

document.getElementById("logoTrack").innerHTML=[...logos,...logos,...logos]
.map(logo=>`

<div
style="
display:flex;
align-items:center;
justify-content:center;
min-width:180px;
padding:20px;
">

<img
src="${logo}"
loading="lazy"
style="
width:120px;
height:120px;
object-fit:contain;
transition:.4s;
filter:grayscale(10%);
"
/>

</div>

`).join("");



/* ============ CONTACT CARDS ============ */
const contacts = [
  { i: 'whatsapp', l: 'WhatsApp', v: '+234 912 880 2572', h: 'https://wa.me/2349128802572' },
  { i: 'phone', l: 'Phone', v: '+234 912 880 2572', h: 'tel:+2349128802572' },
  { i: 'mail', l: 'Email', v: 'danitech011@gmail.com', h: 'mailto:danitech011@gmail.com' },
  { i: 'instagram', l: 'Instagram', v: '@danielhenry7473', h: 'https://www.instagram.com/danielhenry7473' },
  { i: 'facebook', l: 'Facebook', v: 'Daniel Oloruntoba', h: 'https://www.facebook.com/daniel.oloruntoba.505' },
  { i: 'telegram', l: 'Telegram', v: '@danitech01', h: 'https://t.me/danitech01' },
  { i: 'x', l: 'X', v: '@Oloruntoba95970', h: 'https://x.com/Oloruntoba95970' },
];
document.getElementById('contactList').innerHTML = contacts.map(c => `
  <a class="contact-card reveal" href="${c.h}" target="_blank" rel="noreferrer">
    <div class="ic">${icons[c.i]}</div>
    <div class="info"><div class="l">${c.l}</div><div class="v">${c.v}</div></div>
  </a>
`).join('');

/* ============ SOCIALS ============ */
const socials = [
  { i: 'instagram', h: 'https://www.instagram.com/danielhenry7473' },
  { i: 'facebook', h: 'https://www.facebook.com/daniel.oloruntoba.505' },
  { i: 'x', h: 'https://x.com/Oloruntoba95970' },
  { i: 'telegram', h: 'https://t.me/danitech01' },
  { i: 'whatsapp', h: 'https://wa.me/2349128802572' },
  { i: 'linkedin', h: '#' },
];
document.getElementById('socials').innerHTML = socials.map(s => `
  <a href="${s.h}" target="_blank" rel="noreferrer" aria-label="social">${icons[s.i]}</a>
`).join('');

/* ============ CONTACT FORM ============ */
const form = document.getElementById('contactForm');
const status = document.getElementById('formStatus');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const name = (data.get('name') || '').toString().trim();
  const email = (data.get('email') || '').toString().trim();
  const service = (data.get('service') || '').toString().trim();
  const message = (data.get('message') || '').toString().trim();
  status.className = 'form-status';
  if (!name || !email || !message) {
    status.textContent = 'Please fill in your name, email and a message.';
    status.classList.add('err');
    return;
  }
  const subject = encodeURIComponent(`New inquiry from ${name} — ${service || 'General'}`);
  const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nService: ${service}\n\n${message}`);
  window.location.href = `mailto:danitech011@gmail.com?subject=${subject}&body=${body}`;
  setTimeout(() => {
    status.textContent = '✓ Your message client opened — finish sending to deliver it to danitech011@gmail.com.';
    status.classList.add('ok');
    form.reset();
  }, 500);
});

/* ============ REVEAL ON SCROLL ============ */
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      // animate bars inside ai-card when visible
      entry.target.querySelectorAll('.bars .bar > div').forEach((b) => {
        const w = b.getAttribute('data-w');
        if (w) b.style.width = w + '%';
      });
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));
// also kick off bars in ai-card on initial paint (in case already in view)
setTimeout(() => {
  document.querySelectorAll('.ai-card.in .bars .bar > div, .ai-card .bars .bar > div').forEach((b) => {
    const w = b.getAttribute('data-w');
    if (w && !b.style.width) b.style.width = w + '%';
  });
}, 800);

/* ============ YEAR (already 2026 in markup, no-op) ============ */
