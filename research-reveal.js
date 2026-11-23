(() => {
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const main = document.querySelector('.research-main');
  if (!main) return;

  const elements = [...main.querySelectorAll('.aed-section h2, .aed-themes h2, .aed-vision h2, #roadmap, .aed-roadmap > li, .aed-feedback, .aed-theme, .aed-overview-card')];
  const observer = new IntersectionObserver(entries => {
    for (const {target,isIntersecting} of entries) {
      if (!isIntersecting && !target.matches(':target, :focus-within')) {
        target.style.transitionDelay = '';
        target.classList.remove('is-visible');
      }
    }
    const arriving = entries.filter(entry => entry.isIntersecting && !entry.target.classList.contains('is-visible'));
    arriving.sort((a, b) => elements.indexOf(a.target) - elements.indexOf(b.target));
    arriving.forEach(({target}, index) => show(target, Math.min(index, 4) * 105));
  }, {threshold: [0, 0.12], rootMargin: '0px 0px -45px 0px'});

  function show(element, delay = 0) {
    element.style.transitionDelay = delay ? delay + 'ms' : '';
    element.classList.add('is-visible');
  }

  function revealLinkTarget() {
    const target = main.querySelector(':target');
    if (!target) return;
    elements.filter(element => element === target || element.contains(target)).forEach(element => show(element));
  }

  for (const element of elements) {
    element.classList.add('reveal');
    element.addEventListener('focusin', () => show(element));
    observer.observe(element);
  }
  window.addEventListener('hashchange', revealLinkTarget);
  revealLinkTarget();
})();