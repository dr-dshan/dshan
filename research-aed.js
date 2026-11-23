(() => {
  const main = document.querySelector('.research-main');
  const tablist = main.querySelector('.aed-tabs');
  const tabs = Array.from(tablist.querySelectorAll('a'));
  const panels = tabs.map(tab => document.getElementById(tab.hash.slice(1)));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const demos = Array.from(main.querySelectorAll('.aed-demo')).map(setupDemo);

  tablist.setAttribute('role', 'tablist');
  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panels[index].id);
    panels[index].setAttribute('role', 'tabpanel');
    panels[index].setAttribute('aria-labelledby', tab.id);
    panels[index].tabIndex = 0;

    tab.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      choose(index, true);
    });
    tab.addEventListener('keydown', event => {
      const positions = {ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: tabs.length - 1};
      if (event.key === ' ') {
        event.preventDefault();
        choose(index, true);
      } else if (Object.hasOwn(positions, event.key)) {
        event.preventDefault();
        const next = (positions[event.key] + tabs.length) % tabs.length;
        choose(next, true);
        tabs[next].focus();
      }
    });
  });

  function choose(index, updateAddress) {
    tabs.forEach((tab, position) => {
      const selected = position === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[position].hidden = !selected;
      if (!selected) demos[position]();
    });
    if (updateAddress && location.hash !== tabs[index].hash) {
      history.pushState(null, '', tabs[index].hash);
    }
  }

  function selectFromAddress(initial = false) {
    const index = tabs.findIndex(tab => tab.hash === location.hash);
    if (index >= 0 || initial || !location.hash) choose(Math.max(0, index), false);
    if (index >= 0 && initial) requestAnimationFrame(() => panels[index].scrollIntoView());
  }

  function setupDemo(figure) {
    const demo = Number(figure.dataset.demo);
    const play = figure.querySelector('.aed-play');
    const status = figure.querySelector('.aed-status');
    const trace = figure.querySelector('.trace');
    const bias = figure.querySelector('.aed-bias');
    const defaultLabel = play.textContent;
    const samples = [];
    let timer;
    let active = false;

    function sample(announce = false) {
      const value = Math.random() < Number(bias.value) ? 1 : 0;
      samples.push(value);
      if (samples.length > 25) samples.shift();
      const height = bit => bit ? 58 : 134;
      const points = samples.map((bit, index) => 'H' + (48 + index * 15) + 'V' + height(bit));
      trace.setAttribute('d', 'M48 ' + height(samples[0]) + points.join('') + 'h15');
      if (announce) status.textContent = 'Sampled ' + value + '.';
    }

    function render() {
      figure.classList.toggle('is-active', active);
      if (demo === 1) {
        play.textContent = active ? (reduced.matches ? 'Reset diagram' : 'Pause motion') : (reduced.matches ? 'Show alternate state' : defaultLabel);
        status.textContent = active ? (reduced.matches ? 'Alternate positions shown without motion.' : 'Motion running.') : '';
      }
      if (demo === 3) {
        play.hidden = reduced.matches;
        play.textContent = active ? 'Pause samples' : defaultLabel;
        status.textContent = active ? 'Sampling.' : '';
      }
    }

    function stop() {
      if (demo !== 1 && demo !== 3) return;
      active = false;
      clearInterval(timer);
      render();
    }

    if (demo === 3) {
      for (let i = 0; i < 25; i++) sample();
      figure.querySelector('.aed-sample').addEventListener('click', () => sample(true));
      bias.addEventListener('change', () => {
        samples.length = 0;
        sample(false);
        status.textContent = 'Bias set to ' + bias.selectedOptions[0].textContent.toLowerCase() + '. New trace started.';
      });
    }

    play.addEventListener('click', () => {
      active = !active;
      if (demo === 3) {
        clearInterval(timer);
        if (active) timer = setInterval(sample, 150);
      }
      render();
      if (demo === 0) {
        play.textContent = active ? 'Reset magnetization' : defaultLabel;
        status.textContent = active ? 'Magnetization reversed.' : 'Initial magnetization restored.';
      } else if (demo === 2) {
        status.textContent = active ? 'Antiparallel · higher resistance.' : 'Parallel · lower resistance.';
      } else if (demo === 4) {
        play.setAttribute('aria-pressed', String(active));
        status.textContent = active ? 'Mirror-related textures have opposite handedness.' : '';
      }
    });

    if (demo === 4) play.setAttribute('aria-pressed', 'false');
    figure.querySelector('.aed-controls').hidden = false;
    render();
    reduced.addEventListener('change', stop);
    if ('IntersectionObserver' in window && (demo === 1 || demo === 3)) {
      const observer = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting && active) stop();
      });
      observer.observe(figure);
    }
    return stop;
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) demos.forEach(stop => stop());
  });
  window.addEventListener('hashchange', () => selectFromAddress());
  selectFromAddress(true);
})();