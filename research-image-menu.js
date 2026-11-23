document.querySelector('.research-main')?.addEventListener('contextmenu', event => {
  if (event.target instanceof HTMLImageElement || event.target instanceof HTMLCanvasElement) {
    event.preventDefault();
  }
});
