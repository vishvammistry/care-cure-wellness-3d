const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Scroll-reveal (fade in) ---------- */
function initReveal() {
  const elements = document.querySelectorAll('.fade-up');
  if (!('IntersectionObserver' in window) || elements.length === 0) {
    elements.forEach((el) => el.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  elements.forEach((el) => observer.observe(el));
}

/* ---------- Navbar: transparent-over-hero, solid once scrolled ---------- */
function initNavbarScroll() {
  const nav = document.querySelector('.navbar');
  if (!nav) return;
  const update = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

/* ---------- Mobile hamburger menu ---------- */
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const menu = document.getElementById('mobile-menu');
  const closeBtn = document.getElementById('mobile-menu-close');
  if (!hamburger || !menu) return;

  function close() {
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    menu.classList.remove('open');
  }

  hamburger.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  if (closeBtn) closeBtn.addEventListener('click', close);
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
}

/* ---------- Animated stat counters (hero) ---------- */
function initStatCounters() {
  const host = document.querySelector('.hero-stats');
  const targets = document.querySelectorAll('[data-count]');
  if (!host || targets.length === 0) return;

  function runCount(el, target, duration = 1400) {
    if (reduceMotion) {
      el.textContent = target;
      return;
    }
    let start = null;
    function frame(ts) {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(frame);
      else el.textContent = target;
    }
    requestAnimationFrame(frame);
  }

  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => runCount(el, Number(el.dataset.count)));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        targets.forEach((el) => runCount(el, Number(el.dataset.count)));
        io.disconnect();
      }
    });
  }, { threshold: 0.3 });
  io.observe(host);
}

/* ---------- Contact form: opens a pre-filled email (no backend to send to) ---------- */
function initContactForm() {
  const form = document.getElementById('enquiry-form');
  const status = document.getElementById('f-status');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = (data.get('name') || '').toString().trim();
    const company = (data.get('company') || '').toString().trim();
    const phone = (data.get('phone') || '').toString().trim();
    const email = (data.get('email') || '').toString().trim();
    const service = (data.get('service') || '').toString().trim();
    const size = (data.get('size') || '').toString().trim();
    const message = (data.get('message') || '').toString().trim();

    const bodyLines = [
      `Name: ${name}`,
      `Company: ${company}`,
      `Phone: ${phone}`,
      email ? `Email: ${email}` : null,
      service ? `Service Required: ${service}` : null,
      size ? `Workforce Size: ${size}` : null,
      message ? `\nMessage:\n${message}` : null,
    ].filter(Boolean).join('\n');

    const subject = `New Enquiry from ${name || 'Website Visitor'}${company ? ' (' + company + ')' : ''}`;
    const mailto = `mailto:info@carecurewellness.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines)}`;

    if (status) status.textContent = 'Opening your email app with this enquiry pre-filled…';
    window.location.href = mailto;
  });
}

function init() {
  initReveal();
  initNavbarScroll();
  initMobileMenu();
  initStatCounters();
  initContactForm();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
