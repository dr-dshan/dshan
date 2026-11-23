(() => {
  const main = document.querySelector('.research-main');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  main.querySelectorAll('.aed-art[data-scene]').forEach(setupScene);
  main.querySelectorAll('.aed-motion-diagram').forEach(setupDiagram);

  function setupDiagram(diagram) {
    let onScreen = !('IntersectionObserver' in window);
    const update = () => diagram.classList.toggle('is-playing', onScreen && !reduced.matches && !document.hidden);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting && entry.intersectionRatio >= .18;
        update();
      }, {threshold: .18}).observe(diagram);
    }
    reduced.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
    update();
  }

  function setupScene(figure) {
    const canvas = figure.querySelector('canvas');
    const story = figure.querySelector('.aed-story');
    const steps = story ? Array.from(story.querySelectorAll('template'), item => item.content.textContent.trim()) : [];
    const renderer = createResearchScene(canvas, Number(figure.dataset.scene), showStep);
    if (!renderer) return;
    function showStep(index) {
      if (story && steps[index]) story.querySelector('.aed-step-description').textContent = steps[index];
    }
    if (story) story.hidden = false;
    let visible = !('IntersectionObserver' in window);

    function sync() {
      if (visible) renderer.draw();
      renderer.setPlaying(visible && !document.hidden && !reduced.matches);
    }

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting && entry.intersectionRatio >= .18;
        sync();
      }, {threshold:.18});
      observer.observe(canvas);
    }
    if ('ResizeObserver' in window) {
      const resize = new ResizeObserver(() => { if (visible) renderer.draw(); });
      resize.observe(canvas);
    }
    reduced.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    sync();
  }
})();