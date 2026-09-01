# DS Han Lab Final Integrated Website + Private Wiki

This package is designed to replace the current website upload as a whole while preserving
the existing public site content and styling as much as possible.

## WEBSITE_UPLOAD

This is the public GitHub Pages site.

Changes to the existing site are intentionally small:
- HOME / RESEARCH / PEOPLE / PUBLICATIONS / NEWS now include CONTACT + WIKI in the top menu.
- WIKI is an explicit HTML menu item (not dynamically inserted).
- NEWS includes an explicit `✎ Write News` button.
- `private-app-config.js` is new and contains the ONE Cloudflare URL to update later.
- Existing research, people, publication, news rendering, images, CSS, logo, and GitHub Pages
  build workflow are preserved.
- Pages CMS configuration is removed because this system no longer needs Pages CMS.

After Cloudflare deployment, edit only this line in `WEBSITE_UPLOAD/private-app-config.js`:

    const PRIVATE_APP_BASE =
      "https://dshan-lab-private.YOUR-SUBDOMAIN.workers.dev";

Replace it with your actual Worker URL.

## CLOUDFLARE_PRIVATE_APP

One protected application serves two private tools:

- `/wiki`
  - viewing requires login
  - editing requires login
  - create/edit/delete pages
  - search and categories
  - Word-like rich-text editor
  - font family, per-selection font size, bold, italic, underline
  - text color/highlight, alignment, lists, tables, links
  - image/file upload
  - Word copy/paste support
  - pasted clipboard images automatically upload to private R2
  - pages stored in D1
  - images/files stored in private R2
  - last editor email stored from Cloudflare Access header

- `/news-admin`
  - requires login
  - lists existing `News/*.md`
  - create/edit/delete public News posts
  - images upload automatically to `Images/News/`
  - commits changes to `dr-dshan/dshan` using GitHub Contents API
  - GitHub Actions then rebuilds the public site

## Initial Cloudflare setup

Create in Cloudflare Dashboard:

1. D1 database named:
   `dshan-lab-wiki`

2. R2 bucket named:
   `dshan-lab-wiki-files`

Copy the D1 database ID into:
`CLOUDFLARE_PRIVATE_APP/wrangler.jsonc`

replacing:
`REPLACE_WITH_D1_DATABASE_ID`

## GitHub token

Create a fine-grained GitHub token restricted to:
- repository: `dr-dshan/dshan`
- permission: Contents -> Read and write

Never place that token in HTML or JavaScript.

From PowerShell in `CLOUDFLARE_PRIVATE_APP`:

    npm install
    npx wrangler login --device
    npx wrangler secret put GITHUB_TOKEN
    npm run db:remote
    npm run deploy

If `wrangler login` fails on an institutional network, deployment can instead be done through
the Cloudflare browser/dashboard workflow or from another network.

## Protect Wiki AND News Admin

After deploy, enable Cloudflare Access for the Worker and protect ALL traffic.

Allow only exact approved lab-member email addresses.

This is essential because:
- Wiki viewing must be private.
- Wiki editing must be private.
- News Admin must be private.
- R2 files are delivered through the same protected Worker.

Do not make the R2 bucket public.

## Word copy/paste

The Wiki editor accepts rich HTML from the clipboard. Word headings, bold/italic, lists,
tables, font information, and similar formatting are preserved when the browser provides them.
Clipboard image blobs are uploaded to R2 and inserted into the document.

This is not a DOCX renderer, so exact Word page layout/margins cannot be guaranteed. The
result is a rich web document that can then be edited with the toolbar.

## Public site upload

Once Cloudflare URL is known:

1. Update `WEBSITE_UPLOAD/private-app-config.js`.
2. Upload the contents of `WEBSITE_UPLOAD/` to the root of `dr-dshan/dshan`.
3. Keep the existing GitHub Pages workflow enabled.

The public site remains GitHub Pages. Only private Wiki / News editing runs on Cloudflare.
