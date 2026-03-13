#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const POSTS_DIR = path.join(__dirname, 'posts');
const PUBLIC_DIR = path.join(__dirname, 'public');
const DIST_DIR = path.join(__dirname, 'dist');

marked.setOptions({ breaks: true, gfm: true });

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function renderTags(tags) {
  if (!tags || !String(tags).trim()) return '';
  return `<div class="tags">${String(tags).split(',').map(t => `<span class="tag">${escapeHtml(t.trim())}</span>`).join('')}</div>`;
}

// Clean and recreate dist/
if (fs.existsSync(DIST_DIR)) fs.rmSync(DIST_DIR, { recursive: true });
fs.mkdirSync(DIST_DIR);

// Copy style.css
fs.copyFileSync(path.join(PUBLIC_DIR, 'style.css'), path.join(DIST_DIR, 'style.css'));

// Copy uploads/ if it exists
const uploadsDir = path.join(PUBLIC_DIR, 'uploads');
if (fs.existsSync(uploadsDir)) {
  fs.cpSync(uploadsDir, path.join(DIST_DIR, 'uploads'), { recursive: true });
}

// Read and sort posts
const posts = fs.readdirSync(POSTS_DIR)
  .filter(f => f.endsWith('.md'))
  .map(file => {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');
    const { data, content } = matter(raw);
    return { slug: path.basename(file, '.md'), ...data, content };
  })
  .sort((a, b) => new Date(b.date) - new Date(a.date));

// Generate index.html
const postCards = posts.length === 0
  ? '<div class="empty-state"><p>No posts yet.</p></div>'
  : `<div class="posts-list">${posts.map(p => `
    <article class="post-card">
      <div class="post-card-meta">${escapeHtml(formatDate(p.date))}${p.updated ? ' · edited' : ''}</div>
      <h2 class="post-card-title"><a href="${escapeHtml(p.slug)}.html">${escapeHtml(p.title)}</a></h2>
      ${renderTags(p.tags)}
    </article>`).join('')}</div>`;

fs.writeFileSync(path.join(DIST_DIR, 'index.html'), `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Joohoon's Blog</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <header>
      <span class="blog-title">Joohoon's Blog</span>
    </header>
    <main>${postCards}</main>
  </div>
</body>
</html>`);

// Generate one HTML file per post
for (const post of posts) {
  const metaParts = [formatDate(post.date)];
  if (post.updated) metaParts.push(`edited ${formatDate(post.updated)}`);

  // Rewrite absolute upload URLs to relative (needed for GitHub Pages subdirectory hosting)
  const contentHtml = marked.parse(post.content || '')
    .replace(/\/uploads\//g, 'uploads/');

  fs.writeFileSync(path.join(DIST_DIR, `${post.slug}.html`), `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(post.title)} — Joohoon's Blog</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <a href="index.html" class="back-link">← All posts</a>
    <main>
      <article>
        <header class="post-header">
          <h1>${escapeHtml(post.title)}</h1>
          <div class="post-header-meta">${metaParts.map(escapeHtml).join(' · ')}</div>
          ${renderTags(post.tags)}
        </header>
        <div class="post-content">${contentHtml}</div>
      </article>
    </main>
  </div>
</body>
</html>`);
}

console.log(`Built ${posts.length} post(s) → dist/`);
