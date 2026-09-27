(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const heroVideo = document.querySelector('.hero-video');
  if (heroVideo && !reduceMotion) {
    const source = heroVideo.querySelector('source[data-src]');
    if (source) {
      source.src = source.dataset.src;
      heroVideo.load();
      heroVideo.play().catch(() => {});
    }
  }
  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const setMenu = open => {
    if (!menuButton || !mobileNav) return;
    mobileNav.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menuButton.innerHTML = open
      ? '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M5 5l14 14M19 5 5 19"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  };
  menuButton?.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  mobileNav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  addEventListener('resize', () => { if (innerWidth > 900) setMenu(false); });
  addEventListener('scroll', () => header?.classList.toggle('scrolled', scrollY > 20), {passive:true});

  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('in-view'); revealObserver.unobserve(entry.target); }
  }), {threshold:.12, rootMargin:'0px 0px -25px 0px'});
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  const animateCount = el => {
    const end = Number(el.dataset.count);
    if (!Number.isFinite(end)) return;
    if (reduceMotion) { el.textContent = end.toFixed(Number(el.dataset.decimals || 0)); return; }
    const start = performance.now();
    const duration = 1500;
    const frame = now => {
      const progress = Math.min(1, (now-start)/duration);
      const eased = 1 - Math.pow(1-progress,3);
      el.textContent = (end*eased).toFixed(Number(el.dataset.decimals || 0));
      if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };
  const countObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { animateCount(entry.target); countObserver.unobserve(entry.target); }
  }), {threshold:.4});
  document.querySelectorAll('.counter').forEach(el => countObserver.observe(el));

  if (!reduceMotion && matchMedia('(pointer:fine)').matches) {
    const parallaxElements = [...document.querySelectorAll('[data-parallax]')];
    let queued = false;
    const updateParallax = () => {
      parallaxElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > innerHeight) return;
        const offset = (rect.top + rect.height/2 - innerHeight/2) * Number(el.dataset.parallax);
        el.style.translate = `0 ${Math.max(-30, Math.min(30, -offset))}px`;
      });
      queued = false;
    };
    addEventListener('scroll', () => { if (!queued) { requestAnimationFrame(updateParallax); queued = true; } }, {passive:true});
    updateParallax();
  }

  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const activateTab = tab => {
    tabs.forEach(t => {
      const active = t === tab;
      t.setAttribute('aria-selected', String(active));
      t.tabIndex = active ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      panel.hidden = !active;
      panel.classList.toggle('active', active);
    });
  };
  tabs.forEach((tab,index) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', e => {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
      e.preventDefault();
      const next = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length-1 : (index+(e.key === 'ArrowRight' ? 1 : -1)+tabs.length)%tabs.length;
      activateTab(tabs[next]); tabs[next].focus();
    });
  });

  const lightbox = document.querySelector('.lightbox');
  document.querySelectorAll('.gallery-item').forEach(item => item.addEventListener('click', () => {
    if (!lightbox) return;
    const img = lightbox.querySelector('img');
    img.src = item.dataset.full;
    img.alt = item.dataset.alt;
    lightbox.querySelector('p').textContent = item.dataset.caption;
    lightbox.showModal();
  }));
  lightbox?.querySelector('.lightbox-close')?.addEventListener('click', () => lightbox.close());
  lightbox?.addEventListener('click', e => { if (e.target === lightbox) lightbox.close(); });

  document.querySelector('#enquiry-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const note = `Hello Shree Boutique, my name is ${data.get('name')}. I'm interested in ${data.get('interest')}.${data.get('message') ? ' ' + data.get('message') : ''}`;
    const status = document.querySelector('#form-status');
    status.textContent = 'Opening WhatsApp with your enquiry…';
    location.href = 'https://wa.me/916297638725?text=' + encodeURIComponent(note);
  });

  // Restore a page's visibility when the browser brings it back from history.
  let pageTransitionTimer;
  const resetPageTransition = () => {
    clearTimeout(pageTransitionTimer);
    document.body.style.removeProperty('opacity');
    document.body.style.removeProperty('transition');
  };
  addEventListener('pageshow', resetPageTransition);
  addEventListener('pagehide', resetPageTransition);

  // A short fade gives internal navigation continuity while leaving normal link behaviour intact.
  if (!reduceMotion) document.querySelectorAll('a[href$=".html"]').forEach(a => a.addEventListener('click', e => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank') return;
    const href = a.getAttribute('href');
    if (!href || href === location.pathname.split('/').pop()) return;
    e.preventDefault();
    clearTimeout(pageTransitionTimer);
    document.body.style.transition = 'opacity .22s ease';
    document.body.style.opacity = '0';
    pageTransitionTimer = setTimeout(() => { location.href = href; }, 220);
  }));
})();
