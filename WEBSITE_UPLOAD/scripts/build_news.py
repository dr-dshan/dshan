#!/usr/bin/env python3

from pathlib import Path
import json
import re

import yaml
import markdown


ROOT = Path(__file__).resolve().parents[1]
NEWS_DIR = ROOT / "News"
OUTPUT_DIR = ROOT / "data"
OUTPUT_FILE = OUTPUT_DIR / "news.json"


def split_frontmatter(text):
    """Return (frontmatter_dict, markdown_body)."""
    if not text.startswith("---"):
        return {}, text

    match = re.match(
        r"^---\s*\n(.*?)\n---\s*\n?(.*)$",
        text,
        flags=re.S,
    )

    if not match:
        return {}, text

    metadata = yaml.safe_load(match.group(1)) or {}
    body = match.group(2).strip()

    return metadata, body


def normalize_image_path(value):
    if not value:
        return ""

    value = str(value).strip()

    # Keep paths project-relative so the site also works when GitHub Pages
    # is served from username.github.io/repository-name/.
    value = value.lstrip("/")

    if value.startswith("./"):
        value = value[2:]

    return value


def main():
    posts = []

    for filepath in sorted(NEWS_DIR.glob("*.md")):
        text = filepath.read_text(encoding="utf-8")
        meta, body_markdown = split_frontmatter(text)

        if meta.get("published", True) is False:
            continue

        title = str(meta.get("title", filepath.stem)).strip()
        date = str(meta.get("date", "")).strip()
        summary = str(meta.get("summary", "")).strip()
        cover = normalize_image_path(meta.get("cover", ""))

        slug = filepath.stem

        body_html = markdown.markdown(
            body_markdown,
            extensions=[
                "extra",
                "sane_lists",
            ],
        )

        posts.append(
            {
                "slug": slug,
                "title": title,
                "date": date,
                "summary": summary,
                "cover": cover,
                "body_html": body_html,
            }
        )

    posts.sort(
        key=lambda post: (post.get("date", ""), post.get("title", "")),
        reverse=True,
    )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    OUTPUT_FILE.write_text(
        json.dumps(posts, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"Generated {OUTPUT_FILE} with {len(posts)} published news item(s).")


if __name__ == "__main__":
    main()
