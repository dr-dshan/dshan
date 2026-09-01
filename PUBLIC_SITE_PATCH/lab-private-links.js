(() => {
  const PRIVATE_APP_URL = "https://dshan-lab-private.YOUR-SUBDOMAIN.workers.dev/";

  function addWiki() {
    const navs = document.querySelectorAll("nav, .nav-links, .site-nav");
    navs.forEach(nav => {
      if (nav.querySelector('[data-lab-wiki]')) return;
      const links = [...nav.querySelectorAll("a")];
      if (!links.length) return;
      const a = document.createElement("a");
      a.href = PRIVATE_APP_URL + "wiki";
      a.textContent = "WIKI";
      a.dataset.labWiki = "1";
      a.target = "_blank";
      a.rel = "noopener";
      const contact = links.find(x => x.textContent.trim().toLowerCase() === "contact");
      if (contact) contact.insertAdjacentElement("afterend", a);
      else nav.appendChild(a);
    });
  }
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", addWiki)
    : addWiki();
})();