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
    let frame;
    let started;
    let elapsed = 0;
    const spinVectors = Array.from(figure.querySelectorAll('.viz-spin-vector'));
    const atoms = Array.from(figure.querySelectorAll('.viz-atom'));
    const lattice = figure.querySelector('.viz-lattice-wave');
    const chiralSpins = Array.from(figure.querySelectorAll('.viz-chiral-spin'));
    const continuous = demo === 1 || demo === 3 || demo === 4;
    let active = false;

    function sample(announce = false) {
      const value = Math.random() < Number(bias.value) ? 1 : 0;
      samples.push(value);
      if (samples.length > 25) samples.shift();
      const height = bit => bit ? 58 : 134;
      const points = samples.map((bit, index) => 'H' + (48 + index * 15) + 'V' + height(bit));
      trace.setAttribute('d', 'M48 ' + height(samples[0]) + points.join('') + 'h15');
      const point = figure.querySelector('.viz-sample-point');
      point.setAttribute('cx', 48 + samples.length * 15);
      point.setAttribute('cy', height(value));
      const share = samples.reduce((sum, bit) => sum + bit, 0) / samples.length;
      figure.querySelector('.viz-sample-share').setAttribute('width', 238 * share);
      figure.querySelector('.viz-share-label').textContent = Math.round(100 * share) + '%';
      if (announce) status.textContent = 'Sampled ' + value + '.';
    }

    function draw(phase) {
      if (demo === 1) {
        spinVectors.forEach((vector, index) => {
          const angle = phase - index * .86;
          const x = 12 * Math.cos(angle);
          const y = -20 + 5 * Math.sin(angle);
          // Project the precession cone into the plane of the figure.
          const length = Math.hypot(x, y);
          const tipX = x - 5 * x / length;
          const tipY = y - 5 * y / length;
          const sideX = 3 * y / length;
          const sideY = -3 * x / length;
          vector.setAttribute('d', `M0 0L${x} ${y}M${tipX + sideX} ${tipY + sideY}L${x} ${y}L${tipX - sideX} ${tipY - sideY}`);
        });
        const wave = atoms.map((atom, index) => {
          const y = 189 + 10 * Math.sin(phase - index * .86);
          atom.setAttribute('cy', y);
          return atom.getAttribute('cx') + ' ' + y;
        });
        lattice.setAttribute('d', 'M' + wave.join('L'));
      }
      if (demo === 4) {
        chiralSpins.forEach(spin => {
          const handedness = Number(spin.dataset.side) ? -1 : 1;
          const angle = handedness * (-80 + Number(spin.dataset.site) * 50 + phase * 180 / Math.PI);
          spin.setAttribute('transform', 'rotate(' + angle + ')');
        });
      }
    }

    function animate(time) {
      started ??= time;
      draw((elapsed + time - started) / (demo === 1 ? 320 : 750));
      frame = requestAnimationFrame(animate);
    }

    function pauseMotion() {
      cancelAnimationFrame(frame);
      if (started !== undefined) elapsed += performance.now() - started;
      started = undefined;
    }

    function render() {
      figure.classList.toggle('is-active', active);
      if (demo === 1) {
        play.textContent = active ? (reduced.matches ? 'Reset diagram' : 'Pause motion') : (reduced.matches ? 'Show alternate state' : defaultLabel);
        status.textContent = active ? (reduced.matches ? 'Alternate positions shown without motion.' : 'Motion running.') : '';
      }
      if (demo === 4) {
        play.textContent = active ? (reduced.matches ? 'Reset diagram' : 'Pause textures') : (reduced.matches ? 'Show alternate orientation' : defaultLabel);
        status.textContent = active ? 'The two textures have opposite winding.' : '';
      }
      if (demo === 3) {
        play.hidden = reduced.matches;
        play.textContent = active ? 'Pause samples' : defaultLabel;
        status.textContent = active ? 'Sampling.' : '';
      }
    }

    function stop() {
      if (!continuous) return;
      if (demo !== 3) pauseMotion();
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
      if (demo === 1 || demo === 4) {
        if (reduced.matches) draw(active ? Math.PI / 2 : 0);
        else if (active) frame = requestAnimationFrame(animate);
        else pauseMotion();
      }
      render();
      if (demo === 0) {
        play.textContent = active ? 'Reset magnetization' : defaultLabel;
        status.textContent = active ? 'Magnetization reversed.' : 'Initial magnetization restored.';
      } else if (demo === 2) {
        status.textContent = active ? 'Antiparallel · higher resistance.' : 'Parallel · lower resistance.';
      }
    });

    draw(0);
    figure.querySelector('.aed-controls').hidden = false;
    render();
    reduced.addEventListener('change', stop);
    if ('IntersectionObserver' in window && continuous) {
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