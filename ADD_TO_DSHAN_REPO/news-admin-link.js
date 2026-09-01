(() => {
  // After deploying the Cloudflare Worker, replace ONLY this URL.
  const NEWS_ADMIN_URL =
    "https://dshan-news-admin.YOUR-SUBDOMAIN.workers.dev/";

  const addButton = () => {
    const pageHead = document.querySelector(".page-head");
    if (!pageHead || document.getElementById("news-admin-write-button")) return;

    const button = document.createElement("a");
    button.id = "news-admin-write-button";
    button.href = NEWS_ADMIN_URL;
    button.target = "_blank";
    button.rel = "noopener";
    button.textContent = "✎ Write News";
    button.setAttribute("aria-label", "Open News Administration");

    Object.assign(button.style, {
      display: "inline-block",
      marginTop: "14px",
      padding: "9px 13px",
      border: "1px solid rgba(22,140,255,.58)",
      borderRadius: "6px",
      background: "rgba(22,140,255,.12)",
      color: "#eef4f8",
      fontSize: "12px",
      fontWeight: "800",
      letterSpacing: ".02em"
    });

    button.addEventListener("mouseenter", () => {
      button.style.background = "rgba(22,140,255,.22)";
    });
    button.addEventListener("mouseleave", () => {
      button.style.background = "rgba(22,140,255,.12)";
    });

    pageHead.appendChild(button);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addButton);
  } else {
    addButton();
  }
})();
