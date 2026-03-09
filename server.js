const express = require('express');
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const app = express();
const PORT = 3000;
const POSTS_DIR = path.join(__dirname, 'posts');

if (!fs.existsSync(POSTS_DIR)) {
  fs.mkdirSync(POSTS_DIR, { recursive: true });
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Only allow safe slug characters to prevent path traversal
function isValidSlug(slug) {
  return /^[a-z0-9][a-z0-9-]*$/.test(slug);
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 80);
}

function getUniqueSlug(title, excludeSlug = null) {
  let base = slugify(title) || 'untitled';
  let slug = base;
  let counter = 1;
  while (
    fs.existsSync(path.join(POSTS_DIR, `${slug}.md`)) &&
    slug !== excludeSlug
  ) {
    slug = `${base}-${counter++}`;
  }
  return slug;
}

// GET /api/posts — list all posts (metadata only)
app.get('/api/posts', (req, res) => {
  try {
    const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
    const posts = files.map(file => {
      const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');
      const { data } = matter(raw);
      return { slug: path.basename(file, '.md'), ...data };
    });
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/posts/:slug — single post with content
app.get('/api/posts/:slug', (req, res) => {
  const { slug } = req.params;
  if (!isValidSlug(slug)) return res.status(400).json({ error: 'Invalid slug' });
  const filePath = path.join(POSTS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Post not found' });
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(raw);
    res.json({ slug, ...data, content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/posts — create post
app.post('/api/posts', (req, res) => {
  const { title, content = '', tags = '' } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
  try {
    const slug = getUniqueSlug(title);
    const date = new Date().toISOString();
    const fileContent = matter.stringify(content, { title: title.trim(), date, tags });
    fs.writeFileSync(path.join(POSTS_DIR, `${slug}.md`), fileContent);
    res.status(201).json({ slug, title, date, tags });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/posts/:slug — update post
app.put('/api/posts/:slug', (req, res) => {
  const { slug } = req.params;
  if (!isValidSlug(slug)) return res.status(400).json({ error: 'Invalid slug' });
  const filePath = path.join(POSTS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Post not found' });
  try {
    const existing = matter(fs.readFileSync(filePath, 'utf-8'));
    const { title, content, tags } = req.body;
    const updatedData = {
      ...existing.data,
      title: title !== undefined ? title.trim() : existing.data.title,
      tags: tags !== undefined ? tags : existing.data.tags,
      updated: new Date().toISOString(),
    };
    const updatedContent = content !== undefined ? content : existing.content;
    fs.writeFileSync(filePath, matter.stringify(updatedContent, updatedData));
    res.json({ slug, ...updatedData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/posts/:slug — delete post
app.delete('/api/posts/:slug', (req, res) => {
  const { slug } = req.params;
  if (!isValidSlug(slug)) return res.status(400).json({ error: 'Invalid slug' });
  const filePath = path.join(POSTS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Post not found' });
  try {
    fs.unlinkSync(filePath);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Blog running at http://localhost:${PORT}`);
});
