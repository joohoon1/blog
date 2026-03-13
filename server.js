const express = require('express');
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { execSync } = require('child_process');

const app = express();
const PORT = 3000;
const POSTS_DIR = path.join(__dirname, 'posts');

if (!fs.existsSync(POSTS_DIR)) {
  fs.mkdirSync(POSTS_DIR, { recursive: true });
}

const DRAFTS_DIR = path.join(__dirname, 'drafts');
if (!fs.existsSync(DRAFTS_DIR)) {
  fs.mkdirSync(DRAFTS_DIR, { recursive: true });
}

app.use(express.json({ limit: '20mb' }));
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
  const { title, content = '', tags = '', draftId } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
  try {
    const slug = getUniqueSlug(title);
    const date = new Date().toISOString();

    // Move draft uploads to the post's permanent slug directory and fix URLs
    let finalContent = content;
    if (draftId && isValidSlug(draftId)) {
      const draftUploadsDir = path.join(__dirname, 'public', 'uploads', draftId);
      if (fs.existsSync(draftUploadsDir)) {
        fs.renameSync(draftUploadsDir, path.join(__dirname, 'public', 'uploads', slug));
        finalContent = content.replace(new RegExp(`/uploads/${draftId}/`, 'g'), `/uploads/${slug}/`);
      }
    }

    const fileContent = matter.stringify(finalContent, { title: title.trim(), date, tags });
    fs.writeFileSync(path.join(POSTS_DIR, `${slug}.md`), fileContent);

    try {
      const repoRoot = __dirname;
      execSync(`git add posts/${slug}.md`, { cwd: repoRoot });
      const uploadsDir = path.join(__dirname, 'public', 'uploads', slug);
      if (fs.existsSync(uploadsDir)) {
        execSync(`git add public/uploads/${slug}`, { cwd: repoRoot });
      }
      execSync(`git commit -m "Publish: ${title.trim().replace(/"/g, '\\"')}"`, { cwd: repoRoot });
      execSync('git push origin main', { cwd: repoRoot });
    } catch (gitErr) {
      console.error('Git error:', gitErr.message);
    }

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

    try {
      const repoRoot = __dirname;
      const postTitle = updatedData.title;
      execSync(`git add posts/${slug}.md`, { cwd: repoRoot });
      const uploadsDir = path.join(__dirname, 'public', 'uploads', slug);
      if (fs.existsSync(uploadsDir)) {
        execSync(`git add public/uploads/${slug}`, { cwd: repoRoot });
      }
      execSync(`git commit -m "Update: ${postTitle.replace(/"/g, '\\"')}"`, { cwd: repoRoot });
      execSync('git push origin main', { cwd: repoRoot });
    } catch (gitErr) {
      console.error('Git error:', gitErr.message);
    }

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
    const uploadsDir = path.join(__dirname, 'public', 'uploads', slug);
    if (fs.existsSync(uploadsDir)) fs.rmSync(uploadsDir, { recursive: true });
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/uploads/:postId — list images for a specific post
app.get('/api/uploads/:postId', (req, res) => {
  const { postId } = req.params;
  if (!isValidSlug(postId)) return res.status(400).json({ error: 'Invalid post ID' });
  const uploadsDir = path.join(__dirname, 'public', 'uploads', postId);
  if (!fs.existsSync(uploadsDir)) return res.json([]);
  try {
    const files = fs.readdirSync(uploadsDir)
      .filter(f => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f))
      .map(f => ({ name: f, url: `/uploads/${postId}/${f}` }))
      .reverse();
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/uploads/:postId/:filename — delete an image
app.delete('/api/uploads/:postId/:filename', (req, res) => {
  const { postId, filename } = req.params;
  if (!isValidSlug(postId)) return res.status(400).json({ error: 'Invalid post ID' });
  if (!/^[a-z0-9][a-z0-9._-]*\.[a-z0-9]+$/.test(filename)) return res.status(400).json({ error: 'Invalid filename' });
  const filePath = path.join(__dirname, 'public', 'uploads', postId, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
  try {
    fs.unlinkSync(filePath);
    res.json({ message: 'File deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/upload — upload an image (base64 JSON body)
app.post('/api/upload', (req, res) => {
  const { name, type, data, postId } = req.body;
  const ALLOWED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (!ALLOWED.includes(type)) return res.status(400).json({ error: 'Unsupported file type' });
  if (!data) return res.status(400).json({ error: 'No file data' });
  if (!postId || !isValidSlug(postId)) return res.status(400).json({ error: 'Invalid post ID' });
  try {
    const buffer = Buffer.from(data, 'base64');
    if (buffer.length > 10 * 1024 * 1024) return res.status(400).json({ error: 'File too large (max 10MB)' });
    const ext = path.extname(name).toLowerCase();
    if (!/^\.[a-z0-9]+$/.test(ext)) return res.status(400).json({ error: 'Invalid file extension' });
    const base = path.basename(name, ext).toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 40);
    const filename = `${Date.now()}-${base}${ext}`;
    const uploadsDir = path.join(__dirname, 'public', 'uploads', postId);
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    fs.writeFileSync(path.join(uploadsDir, filename), buffer);
    res.json({ url: `/uploads/${postId}/${filename}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/drafts — list all drafts
app.get('/api/drafts', (req, res) => {
  try {
    const files = fs.readdirSync(DRAFTS_DIR).filter(f => f.endsWith('.json'));
    const drafts = files.map(file => {
      const data = JSON.parse(fs.readFileSync(path.join(DRAFTS_DIR, file), 'utf-8'));
      return { id: path.basename(file, '.json'), ...data };
    });
    drafts.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    res.json(drafts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/drafts/:id — get a draft
app.get('/api/drafts/:id', (req, res) => {
  const { id } = req.params;
  if (!isValidSlug(id)) return res.status(400).json({ error: 'Invalid draft id' });
  const filePath = path.join(DRAFTS_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Draft not found' });
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json({ id, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/drafts/:id — save or update a draft
app.put('/api/drafts/:id', (req, res) => {
  const { id } = req.params;
  if (!isValidSlug(id)) return res.status(400).json({ error: 'Invalid draft id' });
  try {
    const { title = '', content = '', tags = '' } = req.body;
    const draft = { title, content, tags, savedAt: new Date().toISOString() };
    fs.writeFileSync(path.join(DRAFTS_DIR, `${id}.json`), JSON.stringify(draft, null, 2));
    res.json({ id, ...draft });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/drafts/:id — delete a draft
app.delete('/api/drafts/:id', (req, res) => {
  const { id } = req.params;
  if (!isValidSlug(id)) return res.status(400).json({ error: 'Invalid draft id' });
  const filePath = path.join(DRAFTS_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Draft not found' });
  try {
    fs.unlinkSync(filePath);
    // Only delete uploads for new-post drafts; edit drafts share the post's upload folder
    if (!id.startsWith('edit-')) {
      const uploadsDir = path.join(__dirname, 'public', 'uploads', id);
      if (fs.existsSync(uploadsDir)) fs.rmSync(uploadsDir, { recursive: true });
    }
    res.json({ message: 'Draft deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Blog running at http://localhost:${PORT}`);
});
