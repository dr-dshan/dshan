(() => {
  // CHANGE THIS ONE LINE after Cloudflare deployment.
  const PRIVATE_APP_BASE =
    "https://dshan-lab-private.YOUR-SUBDOMAIN.workers.dev";

  document.querySelectorAll("[data-private-route]").forEach((link) => {
    const route = link.getAttribute("data-private-route") || "";
    link.href = PRIVATE_APP_BASE.replace(/\/$/, "") + route;
  });
})();