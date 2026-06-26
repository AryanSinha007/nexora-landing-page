/* ==========================================================
   NEXORA — Landing Page JavaScript
   Features:
     • Loader dismiss
     • Navbar scroll effects
     • Active link highlighting (Intersection Observer)
     • Mobile hamburger toggle
     • Smooth scrolling
     • Typing animation (Hero)
     • Animated counters (About)
     • Scroll-reveal animations
     • Contact form validation
     • Back-to-top button
     • Dark / Light mode toggle (persisted)
     • Page transition on section navigation
     • Scroll progress bar
   ========================================================== */

;(function () {
  'use strict';

  /* ============================================================
     HELPERS
     ============================================================ */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ============================================================
     DOM REFERENCES
     ============================================================ */
  const loader       = $('#loader');
  const navbar       = $('#navbar');
  const navLinks     = $$('.navbar__link');
  const hamburger    = $('#hamburger');
  const navMenu      = $('#nav-links');
  const themeToggle  = $('#theme-toggle');
  const themeIcon    = $('#theme-icon');
  const backToTop    = $('#back-to-top');
  const contactForm  = $('#contact-form');
  const sections     = $$('section[id]');
  const typingTarget = $('#typing-target');
  const pageTransition = $('#page-transition');
  const scrollProgress = $('#scroll-progress');
  let isNavigating   = false;

  /* ============================================================
     1. LOADING SCREEN — auto-dismiss after 800ms
     ============================================================ */
  document.body.style.overflow = 'hidden';

  setTimeout(function () {
    loader.classList.add('hidden');
    document.body.style.overflow = '';
  }, 800);

  /* ============================================================
     2. NAVBAR — SCROLL EFFECTS
     Change background, shadow, and reduce height on scroll
     ============================================================ */
  let lastScrollY = 0;

  function onScroll() {
    const scrollY = window.scrollY;

    // Navbar scrolled class
    if (scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Back-to-top visibility
    if (scrollY > 500) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }

    // Scroll progress bar
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollProgress && docHeight > 0) {
      scrollProgress.style.width = `${Math.min((scrollY / docHeight) * 100, 100)}%`;
    }

    lastScrollY = scrollY;
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  /* ============================================================
     3. ACTIVE NAVIGATION HIGHLIGHTING — Intersection Observer
     ============================================================ */
  const sectionObserverOptions = {
    root: null,
    rootMargin: '-40% 0px -55% 0px', // triggers when section is roughly centered
    threshold: 0,
  };

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, sectionObserverOptions);

  sections.forEach((sec) => sectionObserver.observe(sec));

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      link.classList.remove('navbar__link--clicked');
      void link.offsetWidth;
      link.classList.add('navbar__link--clicked');
    });
  });

  /* ============================================================
     4. SMOOTH SCROLLING + PAGE TRANSITION (nav links)
     ============================================================ */
  function playPageTransition(callback) {
    if (!pageTransition || isNavigating) return;
    isNavigating = true;

    pageTransition.classList.remove('exit');
    pageTransition.classList.add('active');

    setTimeout(() => {
      if (callback) callback();

      pageTransition.classList.add('exit');
      pageTransition.classList.remove('active');

      setTimeout(() => {
        pageTransition.classList.remove('exit');
        isNavigating = false;
      }, 500);
    }, 480);
  }

  function scrollToSection(target) {
    target.scrollIntoView({ behavior: 'smooth' });

    target.classList.remove('section--enter');
    void target.offsetWidth; // restart animation
    target.classList.add('section--enter');

    setTimeout(() => target.classList.remove('section--enter'), 900);
  }

  $$('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const href = this.getAttribute('href');
      const target = $(href);
      if (!target) return;

      // Close mobile menu if open
      if (navMenu.classList.contains('open')) {
        toggleMobileMenu();
      }

      // Skip transition for same-section clicks
      const currentSection = sections.find((sec) => {
        const rect = sec.getBoundingClientRect();
        return rect.top <= window.innerHeight * 0.45 && rect.bottom >= window.innerHeight * 0.45;
      });

      if (currentSection && currentSection.id === target.id) {
        scrollToSection(target);
        return;
      }

      playPageTransition(() => scrollToSection(target));
    });
  });

  /* ============================================================
     5. MOBILE HAMBURGER MENU
     ============================================================ */
  function toggleMobileMenu() {
    const isOpen = hamburger.classList.toggle('open');
    navMenu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', isOpen);
  }

  hamburger.addEventListener('click', toggleMobileMenu);

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (
      navMenu.classList.contains('open') &&
      !navMenu.contains(e.target) &&
      !hamburger.contains(e.target)
    ) {
      toggleMobileMenu();
    }
  });

  /* ============================================================
     6. DARK / LIGHT MODE TOGGLE
     ============================================================ */
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeIcon.textContent = theme === 'dark' ? '☽' : '☀';
    localStorage.setItem('nexora-theme', theme);
  }

  // Init from saved preference or system
  (function initTheme() {
    const saved = localStorage.getItem('nexora-theme');
    if (saved) {
      setTheme(saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  })();

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
  });

  /* ============================================================
     7. TYPING ANIMATION (Hero section)
     ============================================================ */
  const typingPhrases = [
    'Web Experiences',
    'Digital Products',
    'Creative Solutions',
    'Brand Stories',
  ];

  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  const TYPING_SPEED = 90;
  const DELETING_SPEED = 50;
  const PAUSE_END = 2000;
  const PAUSE_DELETE = 600;

  function typeEffect() {
    const currentPhrase = typingPhrases[phraseIndex];

    if (isDeleting) {
      charIndex--;
      typingTarget.textContent = currentPhrase.substring(0, charIndex);
    } else {
      charIndex++;
      typingTarget.textContent = currentPhrase.substring(0, charIndex);
    }

    let delay = isDeleting ? DELETING_SPEED : TYPING_SPEED;

    if (!isDeleting && charIndex === currentPhrase.length) {
      delay = PAUSE_END;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % typingPhrases.length;
      delay = PAUSE_DELETE;
    }

    setTimeout(typeEffect, delay);
  }

  // Start typing after loader hides
  setTimeout(typeEffect, 1200);

  /* ============================================================
     8. ANIMATED COUNTERS (About section)
     ============================================================ */
  const counterCards = $$('.counter-card__number[data-target]');
  let countersAnimated = false;

  function animateCounters() {
    if (countersAnimated) return;
    countersAnimated = true;

    counterCards.forEach((counter) => {
      const target = +counter.getAttribute('data-target');
      const duration = 2000; // ms
      const increment = target / (duration / 16);
      let current = 0;

      function updateCounter() {
        current += increment;
        if (current >= target) {
          counter.textContent = target;
          return;
        }
        counter.textContent = Math.floor(current);
        requestAnimationFrame(updateCounter);
      }

      requestAnimationFrame(updateCounter);
    });
  }

  // Trigger counters when About section is in view
  const aboutSection = $('#about');
  if (aboutSection) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounters();
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    counterObserver.observe(aboutSection);
  }

  /* ============================================================
     9. SCROLL-REVEAL ANIMATIONS (Intersection Observer)
     ============================================================ */
  const revealElements = $$('.reveal');

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  revealElements.forEach((el) => revealObserver.observe(el));

  /* ============================================================
     10. CONTACT FORM VALIDATION
     ============================================================ */
  const nameInput    = $('#name');
  const emailInput   = $('#email');
  const messageInput = $('#message');
  const nameError    = $('#name-error');
  const emailError   = $('#email-error');
  const messageError = $('#message-error');
  const formSuccess  = $('#form-success');

  function validateField(input, errorEl, rules) {
    const value = input.value.trim();
    for (const rule of rules) {
      if (!rule.test(value)) {
        errorEl.textContent = rule.message;
        input.classList.add('error');
        return false;
      }
    }
    errorEl.textContent = '';
    input.classList.remove('error');
    return true;
  }

  const nameRules = [
    { test: (v) => v.length > 0, message: 'Name is required.' },
    { test: (v) => v.length >= 2, message: 'Name must be at least 2 characters.' },
  ];

  const emailRules = [
    { test: (v) => v.length > 0, message: 'Email is required.' },
    {
      test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      message: 'Please enter a valid email.',
    },
  ];

  const messageRules = [
    { test: (v) => v.length > 0, message: 'Message is required.' },
    { test: (v) => v.length >= 10, message: 'Message must be at least 10 characters.' },
  ];

  // Live validation on blur
  nameInput.addEventListener('blur', () => validateField(nameInput, nameError, nameRules));
  emailInput.addEventListener('blur', () => validateField(emailInput, emailError, emailRules));
  messageInput.addEventListener('blur', () => validateField(messageInput, messageError, messageRules));

  // Clear error on input
  [nameInput, emailInput, messageInput].forEach((input) => {
    input.addEventListener('input', () => {
      input.classList.remove('error');
      input.nextElementSibling.textContent = '';
      formSuccess.textContent = '';
    });
  });

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const isNameValid    = validateField(nameInput, nameError, nameRules);
    const isEmailValid   = validateField(emailInput, emailError, emailRules);
    const isMessageValid = validateField(messageInput, messageError, messageRules);

    if (isNameValid && isEmailValid && isMessageValid) {
      formSuccess.textContent = "✓ Message sent successfully! We'll get back to you soon.";
      contactForm.reset();
      // Clear success after 5s
      setTimeout(() => {
        formSuccess.textContent = '';
      }, 5000);
    }
  });

  /* ============================================================
     11. BACK-TO-TOP BUTTON
     ============================================================ */
  backToTop.addEventListener('click', () => {
    playPageTransition(() => {
      const hero = $('#hero');
      if (hero) scrollToSection(hero);
    });
  });

})();
