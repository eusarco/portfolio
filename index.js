/* =============================================
   SELECTORS
   ============================================= */
const NAV_BAR        = document.getElementById('navBar');
const NAV_LIST       = document.getElementById('navList');
const HAMBURGER_BTN  = document.getElementById('hamburgerBtn');
const THEME_BTN      = document.getElementById('themeToggleBtn');
const NAV_LINKS      = Array.from(document.querySelectorAll('.nav__list-link'));
const SERVICE_BOXES  = document.querySelectorAll('.service-card__box');
const ACTIVE_CLASS   = 'active';
const BREAKPOINT     = 576;

let currentServiceBG  = null;
let currentActiveLink = document.querySelector('.nav__list-link.active');
let ticking           = false;

/* =============================================
   THEME — light / dark toggle
   ============================================= */
const applyTheme = (theme) => {
  if (theme === 'light') {
    document.documentElement.classList.add('light');
  } else {
    document.documentElement.classList.remove('light');
  }
  localStorage.setItem('eus-theme', theme);
};

// Load saved preference, fallback to dark
const savedTheme = localStorage.getItem('eus-theme') || 'dark';
applyTheme(savedTheme);

THEME_BTN.addEventListener('click', () => {
  const isLight = document.documentElement.classList.contains('light');
  applyTheme(isLight ? 'dark' : 'light');
});

/* =============================================
   NAV — scrolled state
   ============================================= */
window.addEventListener('scroll', () => {
  NAV_BAR.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

/* =============================================
   MOBILE NAV — open / close
   ============================================= */
const closeNav = () => {
  NAV_LIST.classList.remove('open');
  HAMBURGER_BTN.classList.remove('hamburger--open');
  HAMBURGER_BTN.setAttribute('aria-expanded', 'false');
  document.body.style.overflowY = '';
};

const openNav = () => {
  NAV_LIST.classList.add('open');
  HAMBURGER_BTN.classList.add('hamburger--open');
  HAMBURGER_BTN.setAttribute('aria-expanded', 'true');
  document.body.style.overflowY = 'hidden';
};

HAMBURGER_BTN.addEventListener('click', () => {
  NAV_LIST.classList.contains('open') ? closeNav() : openNav();
});

NAV_LINKS.forEach(link => {
  link.addEventListener('click', () => { closeNav(); link.blur(); });
});

window.addEventListener('resize', () => {
  if (window.innerWidth >= BREAKPOINT) closeNav();
}, { passive: true });

/* =============================================
   SCROLL SPY — throttled with rAF
   ============================================= */
const updateActiveLink = () => {
  const navHeight = NAV_BAR.getBoundingClientRect().height;
  const scrollPos = window.scrollY + navHeight + 40;
  const sections  = document.querySelectorAll(
    '#heroHeader, #about, #services, #works, #certifications, #contact'
  );

  let activeSection = null;
  sections.forEach(s => { if (s.offsetTop <= scrollPos) activeSection = s; });
  if (!activeSection) return;

  const id   = activeSection.getAttribute('id');
  const link = NAV_LINKS.find(l => l.getAttribute('href') === '#' + id);
  if (link && link !== currentActiveLink) {
    currentActiveLink.classList.remove(ACTIVE_CLASS);
    link.classList.add(ACTIVE_CLASS);
    currentActiveLink = link;
  }
};

window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => { updateActiveLink(); ticking = false; });
    ticking = true;
  }
}, { passive: true });

/* =============================================
   SMOOTH SCROLL
   ============================================= */
const easeOutQuint = t => 1 - Math.pow(1 - t, 5);

const smoothScrollTo = (targetY) => {
  const startY   = window.scrollY;
  const distance = targetY - startY;
  const duration = 100;
  let startTime  = null;

  const step = (ts) => {
    if (!startTime) startTime = ts;
    const progress = Math.min((ts - startTime) / duration, 1);
    window.scrollTo(0, startY + distance * easeOutQuint(progress));
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

NAV_LINKS.forEach(link => {
  link.addEventListener('click', (e) => {
    const href   = link.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    const navHeight = NAV_BAR.getBoundingClientRect().height;
    smoothScrollTo(target.getBoundingClientRect().top + window.scrollY - navHeight);
  });
});

/* =============================================
   SERVICE CARD — lerp glow blob
   ============================================= */
SERVICE_BOXES.forEach(service => {
  const bg = service.querySelector('.service-card__bg');
  if (!bg) return;

  let mouseX = 0, mouseY = 0, blobX = 0, blobY = 0, animating = false;
  const lerp = (a, b, t) => a + (b - a) * t;

  const animateBlob = () => {
    blobX = lerp(blobX, mouseX, 0.12);
    blobY = lerp(blobY, mouseY, 0.12);
    bg.style.left = blobX + 'px';
    bg.style.top  = blobY + 'px';
    if (Math.abs(blobX - mouseX) > 0.5 || Math.abs(blobY - mouseY) > 0.5) {
      requestAnimationFrame(animateBlob);
    } else {
      animating = false;
    }
  };

  service.addEventListener('mouseenter', e => {
    currentServiceBG = bg;
    const r = service.getBoundingClientRect();
    mouseX = e.clientX - r.left; mouseY = e.clientY - r.top;
    blobX = mouseX; blobY = mouseY;
    bg.style.opacity = '1';
    if (!animating) { animating = true; requestAnimationFrame(animateBlob); }
  });
  service.addEventListener('mousemove', e => {
    if (!currentServiceBG) return;
    const r = service.getBoundingClientRect();
    mouseX = e.clientX - r.left; mouseY = e.clientY - r.top;
    if (!animating) { animating = true; requestAnimationFrame(animateBlob); }
  });
  service.addEventListener('mouseleave', () => {
    bg.style.opacity = '0';
    currentServiceBG = null;
    animating = false;
  });
});

/* =============================================
   SCROLL REVEAL
   ============================================= */
const revealElements = document.querySelectorAll(
  '.service-card__box, .work__box, .cert-card, .about__details, .about__tech-stack'
);

revealElements.forEach(el => {
  el.style.opacity   = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity   = '1';
      entry.target.style.transform = 'translateY(0)';
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

revealElements.forEach(el => revealObserver.observe(el));

function openCertModal(filePath, title) {
    const modal = document.getElementById('cert-modal');
    document.getElementById('cert-modal-title').textContent = title;
    document.getElementById('cert-modal-iframe').src = filePath;
    document.getElementById('cert-modal-download').href = filePath;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
}

function closeCertModal(event) {
    // Close if clicking the backdrop or the X button
    if (event && event.target !== document.getElementById('cert-modal')) return;
    const modal = document.getElementById('cert-modal');
    modal.classList.remove('is-open');
    document.getElementById('cert-modal-iframe').src = '';
    document.body.style.overflow = '';
}

// Also close with Escape key
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeCertModal();
});