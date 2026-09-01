# News CMS setup for Emerging Nanoelectronics Lab

This folder contains everything needed to let authorized editors create News posts
and upload News images without editing HTML.

## How it works

1. An editor signs into Pages CMS with GitHub.
2. They open the **News** collection.
3. They enter:
   - title
   - date
   - short summary
   - optional cover image
   - article body
   - Published toggle
4. Pages CMS saves the post into `News/` and uploaded images into `Images/News/`.
5. That GitHub commit triggers `.github/workflows/pages.yml`.
6. `scripts/build_news.py` creates `data/news.json`.
7. GitHub Pages redeploys automatically.
8. The Home page shows the newest 3 posts.
9. `news.html` shows all posts.
10. `news-post.html` displays a full individual article.

## Files/folders to copy into the repository root

.pages.yml
index.html
news.html
news-post.html

News/
Images/News/
scripts/
.github/workflows/

Do not delete your existing:
research.html
people.html
publications.html
style.css
Images/People/
Publications/

## One-time Pages CMS setup

1. Open the hosted Pages CMS app.
2. Sign in with GitHub.
3. Install/authorize the Pages CMS GitHub App for the repository.
4. Pages CMS reads `.pages.yml` from the repository root.
5. Open **News** and create a post.

## One-time GitHub Pages setting

Because this package includes a custom GitHub Actions deployment:

Repository → Settings → Pages → Build and deployment → Source → **GitHub Actions**

After that, every News save/commit to `main` will rebuild and deploy the site.

## Giving another person permission

Give the editor access to the GitHub repository / Pages CMS workspace at the level
appropriate for your repository. They do not need to edit HTML; they only work
inside the News collection.

## Image storage

Cover images and images inserted into the article are saved in:

Images/News/

The actual files therefore remain in your GitHub repository and are versioned by Git.
