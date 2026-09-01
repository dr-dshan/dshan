const GH_API = "https://api.github.com";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });

const html = (body, status = 200) =>
  new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "x-robots-tag": "noindex, nofollow, noarchive",
    },
  });

function ghHeaders(env) {
  return {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "DS-Han-Lab-News-Admin",
  };
}

function cleanSlug(value = "") {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "news";
}

function cleanFilename(value = "") {
  const dot = value.lastIndexOf(".");
  const ext = dot >= 0 ? value.slice(dot).toLowerCase().replace(/[^a-z0-9.]/g, "") : "";
  const base = dot >= 0 ? value.slice(0, dot) : value;
  return `${cleanSlug(base)}${ext || ""}`;
}

function encodeBase64Utf8(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function decodeBase64Utf8(str) {
  const binary = atob(str.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function yamlQuote(s = "") {
  return `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, " ")}"`;
}

function markdownFromPost(p) {
  return `---
title: ${yamlQuote(p.title)}
date: ${yamlQuote(p.date)}
summary: ${yamlQuote(p.summary || "")}
cover: ${yamlQuote(p.cover || "")}
published: ${p.published !== false ? "true" : "false"}
---

${p.body || ""}
`;
}

function parseFrontmatter(raw, path) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  const meta = {};
  let body = raw;
  if (match) {
    body = match[2] || "";
    for (const line of match[1].split("\n")) {
      const i = line.indexOf(":");
      if (i < 0) continue;
      const k = line.slice(0, i).trim();
      let v = line.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
      }
      if (v === "true") v = true;
      if (v === "false") v = false;
      meta[k] = v;
    }
  }
  return {
    path,
    slug: path.split("/").pop().replace(/\.md$/i, ""),
    title: meta.title || "",
    date: meta.date || "",
    summary: meta.summary || "",
    cover: meta.cover || "",
    published: meta.published !== false,
    body,
  };
}

async function gh(env, path, init = {}) {
  const url = `${GH_API}/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: { ...ghHeaders(env), ...(init.headers || {}) },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GitHub API ${res.status}: ${txt.slice(0, 500)}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function getFile(env, path) {
  return gh(env, `/contents/${path}?ref=${encodeURIComponent(env.GITHUB_BRANCH || "main")}`);
}

async function putFile(env, path, contentBase64, message, sha = undefined) {
  const body = {
    message,
    content: contentBase64,
    branch: env.GITHUB_BRANCH || "main",
  };
  if (sha) body.sha = sha;
  return gh(env, `/contents/${path}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function deleteFile(env, path, sha, message) {
  return gh(env, `/contents/${path}`, {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      message,
      sha,
      branch: env.GITHUB_BRANCH || "main",
    }),
  });
}

const ADMIN_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive">
<title>News Administration | DS Han Lab.</title>
<style>
:root{--bg:#020b14;--panel:#06182e;--panel2:#0a2035;--text:#eef4f8;--muted:#a9b8c7;--line:rgba(255,255,255,.13);--blue:#168cff}
*{box-sizing:border-box}body{margin:0;font-family:Arial,Helvetica,sans-serif;background:radial-gradient(circle at 8% 15%,rgba(0,192,255,.08),transparent 24%),var(--bg);color:var(--text);line-height:1.55}
header{border-bottom:1px solid var(--line);background:rgba(2,12,22,.97)}.head{max-width:1120px;margin:auto;padding:19px 24px;display:flex;justify-content:space-between;align-items:center;gap:18px}.head strong{font-size:19px}.head small{display:block;color:var(--muted);font-size:10px;letter-spacing:.12em}.wrap{max-width:1120px;margin:auto;padding:38px 24px 80px}.bar{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:22px}.bar h1{margin:0;font-size:34px}
button,.button{border:1px solid rgba(22,140,255,.55);border-radius:6px;background:rgba(22,140,255,.13);color:#fff;padding:10px 13px;font-weight:800;cursor:pointer}.secondary{border-color:var(--line);background:rgba(255,255,255,.04)}.danger{border-color:rgba(255,80,80,.5);background:rgba(255,80,80,.08)}
.panel{border:1px solid var(--line);border-radius:9px;background:rgba(5,20,34,.9);padding:20px;margin-bottom:20px}.list-item{padding:14px 0;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;gap:20px;align-items:center}.list-item:last-child{border-bottom:0}.meta{color:var(--muted);font-size:12px}.actions{display:flex;gap:7px;flex-wrap:wrap}
label{display:block;margin:14px 0 6px;font-size:12px;font-weight:800;color:#dbe8f2}input,textarea{width:100%;border:1px solid var(--line);border-radius:6px;background:#061522;color:#fff;padding:11px 12px;font:inherit}textarea{min-height:270px;resize:vertical}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.preview{max-width:190px;max-height:120px;margin-top:10px;border-radius:6px}.notice{color:var(--muted);font-size:12px}.status{min-height:22px;margin:12px 0;color:#78d7ff;font-size:12px}.hidden{display:none}
@media(max-width:700px){.grid{grid-template-columns:1fr}.list-item{align-items:flex-start;flex-direction:column}.bar{align-items:flex-start;flex-direction:column}}
</style>
</head>
<body>
<header><div class="head"><div><strong>DS Han Lab. News Admin</strong><small>AUTHORIZED EDITORS ONLY</small></div><a class="button secondary" href="https://dr-dshan.github.io/dshan/news.html" target="_blank" rel="noopener">View News ↗</a></div></header>
<main class="wrap">
<div class="bar"><h1>News Administration</h1><button id="newBtn">+ New Post</button></div>
<div id="status" class="status"></div>

<section id="listPanel" class="panel">
  <div id="postList">Loading posts...</div>
</section>

<section id="editor" class="panel hidden">
  <h2 id="editorTitle">New Post</h2>
  <input type="hidden" id="originalPath">
  <div class="grid">
    <div><label>Title</label><input id="title"></div>
    <div><label>Date</label><input id="date" type="date"></div>
  </div>
  <label>Short summary</label><textarea id="summary" style="min-height:90px"></textarea>
  <label>Cover image</label>
  <input id="cover" placeholder="Images/News/...">
  <div style="margin-top:8px"><input id="imageFile" type="file" accept="image/*"></div>
  <div style="margin-top:8px"><button id="uploadBtn" class="secondary">Upload Image to GitHub</button></div>
  <div class="notice">Images are stored automatically under <code>Images/News/</code>. Uploaded image paths can also be pasted into the article body as Markdown.</div>
  <label>Article (Markdown)</label>
  <textarea id="body" placeholder="Write the full article here..."></textarea>
  <label style="display:flex;gap:8px;align-items:center;font-weight:normal"><input id="published" type="checkbox" checked style="width:auto"> Published on website</label>
  <div style="display:flex;gap:8px;margin-top:18px;flex-wrap:wrap"><button id="saveBtn">Publish / Save</button><button id="cancelBtn" class="secondary">Cancel</button></div>
</section>
</main>
<script>
const $=id=>document.getElementById(id);
const setStatus=t=>$("status").textContent=t||"";
const escapeHtml=s=>String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
let posts=[];

async function api(path, options={}) {
  const r=await fetch(path,{...options,headers:{"content-type":"application/json",...(options.headers||{})}});
  const j=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(j.error||("Request failed: "+r.status));
  return j;
}
function showEditor(post=null){
  $("editor").classList.remove("hidden");
  $("editorTitle").textContent=post?"Edit Post":"New Post";
  $("originalPath").value=post?.path||"";
  $("title").value=post?.title||"";
  $("date").value=post?.date||new Date().toISOString().slice(0,10);
  $("summary").value=post?.summary||"";
  $("cover").value=post?.cover||"";
  $("body").value=post?.body||"";
  $("published").checked=post?.published!==false;
  $("editor").scrollIntoView({behavior:"smooth"});
}
function hideEditor(){$("editor").classList.add("hidden");}
async function load(){
  setStatus("Loading...");
  try{
    const data=await api("/api/posts");
    posts=data.posts||[];
    render();
    setStatus("");
  }catch(e){setStatus(e.message)}
}
function render(){
  if(!posts.length){$("postList").innerHTML='<div class="notice">No News Markdown files found in the News folder.</div>';return;}
  $("postList").innerHTML=posts.map((p,i)=>\`
    <div class="list-item">
      <div><strong>\${escapeHtml(p.title||p.slug)}</strong><div class="meta">\${escapeHtml(p.date)} · \${escapeHtml(p.path)}</div></div>
      <div class="actions"><button class="secondary" onclick="editPost(\${i})">Edit</button><button class="danger" onclick="removePost(\${i})">Delete</button></div>
    </div>\`).join("");
}
window.editPost=i=>showEditor(posts[i]);
window.removePost=async i=>{
  const p=posts[i];
  if(!confirm("Delete this News post?\\n\\n"+p.title)) return;
  setStatus("Deleting...");
  try{await api("/api/posts",{method:"DELETE",body:JSON.stringify({path:p.path})});await load();hideEditor();setStatus("Deleted. GitHub Pages will rebuild automatically.");}catch(e){setStatus(e.message)}
};
$("newBtn").onclick=()=>showEditor();
$("cancelBtn").onclick=hideEditor;
$("uploadBtn").onclick=async e=>{
  e.preventDefault();
  const f=$("imageFile").files[0];
  if(!f){setStatus("Choose an image first.");return;}
  if(f.size>8*1024*1024){setStatus("Please use an image smaller than 8 MB.");return;}
  setStatus("Uploading image...");
  try{
    const bytes=new Uint8Array(await f.arrayBuffer());
    let bin=""; const chunk=0x8000;
    for(let i=0;i<bytes.length;i+=chunk) bin+=String.fromCharCode(...bytes.subarray(i,i+chunk));
    const result=await api("/api/image",{method:"POST",body:JSON.stringify({name:f.name,content:btoa(bin),title:$("title").value,date:$("date").value})});
    $("cover").value=result.path;
    const markdown="!["+($("title").value||"News image")+"]("+result.path+")";
    $("body").value += ($("body").value.trim()?"\\n\\n":"")+markdown+"\\n";
    setStatus("Image uploaded: "+result.path);
  }catch(e){setStatus(e.message)}
};
$("saveBtn").onclick=async e=>{
  e.preventDefault();
  const payload={originalPath:$("originalPath").value,title:$("title").value.trim(),date:$("date").value,summary:$("summary").value.trim(),cover:$("cover").value.trim(),body:$("body").value,published:$("published").checked};
  if(!payload.title||!payload.date){setStatus("Title and date are required.");return;}
  setStatus("Saving to GitHub...");
  try{await api("/api/posts",{method:"POST",body:JSON.stringify(payload)});await load();hideEditor();setStatus("Saved. GitHub Actions / Pages rebuild should start automatically.");}catch(e){setStatus(e.message)}
};
load();
</script>
</body>
</html>`;

export default {
  async fetch(request, env) {
    try {
      if (!env.GITHUB_TOKEN) {
        return html("<h1>Configuration error</h1><p>GITHUB_TOKEN secret is not set.</p>", 500);
      }

      const url = new URL(request.url);

      if (request.method === "GET" && url.pathname === "/") {
        return html(ADMIN_HTML);
      }

      if (request.method === "GET" && url.pathname === "/api/posts") {
        let listing = [];
        try {
          listing = await gh(env, `/contents/News?ref=${encodeURIComponent(env.GITHUB_BRANCH || "main")}`);
        } catch (e) {
          if (String(e).includes("404")) return json({ posts: [] });
          throw e;
        }

        const files = Array.isArray(listing)
          ? listing.filter(x => x.type === "file" && /\.md$/i.test(x.name))
          : [];

        const posts = [];
        for (const item of files) {
          const f = await getFile(env, item.path);
          const raw = decodeBase64Utf8(f.content || "");
          posts.push(parseFrontmatter(raw, item.path));
        }
        posts.sort((a,b) => String(b.date).localeCompare(String(a.date)));
        return json({ posts });
      }

      if (request.method === "POST" && url.pathname === "/api/posts") {
        const p = await request.json();
        if (!p.title || !p.date) return json({ error: "Title and date are required." }, 400);

        const slug = cleanSlug(p.title);
        const newPath = `News/${p.date}-${slug}.md`;
        let sha;

        if (p.originalPath) {
          try {
            const existing = await getFile(env, p.originalPath);
            sha = existing.sha;
          } catch (_) {}
        }

        const markdown = markdownFromPost(p);

        if (p.originalPath && p.originalPath !== newPath) {
          await putFile(
            env,
            newPath,
            encodeBase64Utf8(markdown),
            `Update News: ${p.title}`
          );
          if (sha) {
            await deleteFile(
              env,
              p.originalPath,
              sha,
              `Rename News: ${p.title}`
            );
          }
        } else {
          if (!sha) {
            try {
              const existingNew = await getFile(env, newPath);
              sha = existingNew.sha;
            } catch (_) {}
          }
          await putFile(
            env,
            newPath,
            encodeBase64Utf8(markdown),
            sha ? `Update News: ${p.title}` : `Add News: ${p.title}`,
            sha
          );
        }

        return json({ ok: true, path: newPath });
      }

      if (request.method === "DELETE" && url.pathname === "/api/posts") {
        const p = await request.json();
        if (!p.path || !p.path.startsWith("News/") || !p.path.endsWith(".md")) {
          return json({ error: "Invalid News path." }, 400);
        }
        const existing = await getFile(env, p.path);
        await deleteFile(env, p.path, existing.sha, `Delete News: ${p.path}`);
        return json({ ok: true });
      }

      if (request.method === "POST" && url.pathname === "/api/image") {
        const p = await request.json();
        if (!p.content || !p.name) return json({ error: "Image file is required." }, 400);

        const mimeExt = cleanFilename(p.name);
        const prefix = p.date || new Date().toISOString().slice(0, 10);
        const titleSlug = cleanSlug(p.title || "news");
        const unique = Math.random().toString(36).slice(2, 8);
        const path = `Images/News/${prefix}-${titleSlug}-${unique}-${mimeExt}`;

        await putFile(
          env,
          path,
          p.content,
          `Upload News image: ${path}`
        );
        return json({ ok: true, path });
      }

      return json({ error: "Not found" }, 404);
    } catch (e) {
      return json({ error: String(e.message || e) }, 500);
    }
  },
};
