# DS Han Lab — News Admin + Private Rich-Text Wiki

## What this version adds

Public site remains on GitHub Pages. It is intentionally minimally changed.

The new private Cloudflare application provides:
- Private WIKI: viewing requires Cloudflare Access login
- Wiki create / read / edit / delete
- Search and categories
- Word-like WYSIWYG editing
- Font family and individual font size
- Bold / italic / underline
- Text color and highlight
- Alignment and lists
- Tables and links
- Image/file upload
- Copy/paste from Microsoft Word
- Clipboard images are uploaded automatically to private R2
- D1 stores rich HTML + JSON
- R2 stores images and attachments
- Last editor and last updated timestamp

The public repository never contains Wiki content.

## Architecture

GitHub Pages (public)
  -> WIKI menu
  -> Cloudflare Access (approved email only)
  -> Worker
     -> D1: Wiki documents
     -> R2: Wiki images/files

News remains public. Its editing can use the existing GitHub-backed News Admin.

## Important Word paste behavior

The editor accepts HTML from the clipboard, so Word headings, bold/italic, lists, tables,
font formatting and other rich text are preserved where the browser provides them.
Clipboard image blobs are intercepted and uploaded to R2 automatically.

Microsoft Word has proprietary layout metadata, so pixel-perfect DOCX page layout is not
guaranteed. The goal is rich formatting preservation in a web document, not DOCX rendering.

## Deployment

### A. Public GitHub site

Upload `PUBLIC_SITE_PATCH/lab-private-links.js` to the root of `dr-dshan/dshan`.

On each existing public page where WIKI should appear, add just before `</body>`:

    <script src="./lab-private-links.js"></script>

Do not replace the existing HTML/CSS.

### B. Cloudflare resources

In Cloudflare Dashboard create:

1. D1 database: `dshan-lab-wiki`
2. R2 bucket: `dshan-lab-wiki-files`

Copy the D1 database ID into `wrangler.jsonc` in place of:

    REPLACE_WITH_D1_DATABASE_ID

### C. Install and initialize

In PowerShell inside `CLOUDFLARE_APP`:

    npm install
    npx wrangler login --device
    npm run db:remote
    npm run deploy

If Wrangler login fails on an institutional network, use the Cloudflare Dashboard browser
editor/deployment route or try a network without an outbound proxy/firewall.

### D. Protect the entire private Worker

Cloudflare Dashboard:
Workers & Pages -> dshan-lab-private -> Access -> Protect this Worker behind Access

Choose ALL TRAFFIC.

Allow only exact approved lab-member email addresses.

This is essential: both Wiki viewing and editing must be behind Access.

### E. Connect WIKI button

After deploy, copy the Worker URL and replace:

    https://dshan-lab-private.YOUR-SUBDOMAIN.workers.dev/

inside `PUBLIC_SITE_PATCH/lab-private-links.js`.

## Security notes

- Do not store Wiki pages in the public GitHub repository.
- Do not expose the R2 bucket publicly.
- All file reads go through the Access-protected Worker.
- The current version gives every Access-approved user Wiki read/write/delete rights.
  Role separation (admin/editor/viewer) can be added later.
- Keep Cloudflare Access on "All traffic", not previews-only.

## News

This package focuses on the newly requested private rich-text Wiki and preserves the existing
News design. The earlier GitHub-backed News Admin can be merged into `/news-admin` after the
Cloudflare app is deployed and Access is working, without changing public News storage.
