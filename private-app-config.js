(() => {
  // CHANGE THIS ONE LINE after Cloudflare deployment.
  const PRIVATE_APP_BASE =
    "https://dshan-lab-private.benfoldsvi.workers.dev";

  document.querySelectorAll("[data-private-route]").forEach((link) => {
    const route = link.getAttribute("data-private-route") || "";
    link.href = PRIVATE_APP_BASE.replace(/\/$/, "") + route;
  });
})();