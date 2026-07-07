const fs = require('fs');
const path = require('path');

// Paths
const articlesPath = path.join(__dirname, 'admin', 'data', 'articles.json');
const categoriesPath = path.join(__dirname, 'admin', 'data', 'categories.json');
const blogDir = path.join(__dirname, 'blog');

// Load Data
const { articles } = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
const { categories } = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));

// Helper replacements
function updateArticlesInHTML(originalHtml, articlesList) {
  const startIndex = originalHtml.indexOf('const articles = [');
  if (startIndex === -1) return originalHtml;
  
  const endIndex = originalHtml.indexOf('];', startIndex);
  if (endIndex === -1) return originalHtml;
  
  const before = originalHtml.substring(0, startIndex);
  const after = originalHtml.substring(endIndex + 2);
  
  return before + `const articles = ${JSON.stringify(articlesList, null, 2)}` + after;
}

function updateCategoriesInHTML(originalHtml, categoriesList) {
  const startIndex = originalHtml.indexOf('const categories = [');
  if (startIndex === -1) return originalHtml;
  
  const endIndex = originalHtml.indexOf('];', startIndex);
  if (endIndex === -1) return originalHtml;
  
  const before = originalHtml.substring(0, startIndex);
  const after = originalHtml.substring(endIndex + 2);
  
  return before + `const categories = ${JSON.stringify(categoriesList, null, 2)}` + after;
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\u0621-\u064A\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function getProcessedArticleHTML(template, art) {
  const cat = categories.find(c => c.id === art.category) || { name: art.category, slug: art.category };
  let html = template;

  // Replace Page Title
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${art.metaTitle || art.title} - مدونة ToolRar<\/title>`);
  
  // Replace Meta description
  html = html.replace(/<meta name="description" content="[^"]*"/i, `<meta name="description" content="${art.metaDesc || art.excerpt}"`);
  
  // Replace Canonicals
  html = html.replace(/href="https:\/\/toolrar\.com\/blog\/text-tools\/asrar-almhtrfyn-kyf-ttsdr-mnsat-akhtbar\.html"/g, `href="https://toolrar.com/blog/${art.category}/${art.slug}.html"`);
  html = html.replace(/content="https:\/\/toolrar\.com\/blog\/text-tools\/asrar-almhtrfyn-kyf-ttsdr-mnsat-akhtbar\.html"/g, `content="https://toolrar.com/blog/${art.category}/${art.slug}.html"`);
  
  // Replace OG Title & Description
  html = html.replace(/<meta property="og:title" content="[^"]*"/i, `<meta property="og:title" content="${art.title}"`);
  html = html.replace(/<meta property="og:description" content="[^"]*"/i, `<meta property="og:description" content="${art.metaDesc || art.excerpt}"`);

  // Replace JSON-LD Schemas
  const faqSchema = art.faq && art.faq.length > 0 ? `
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": ${JSON.stringify(art.faq.map(f => ({
    "@type": "Question",
    "name": f.q,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": f.a
    }
  })))}
}
</script>` : '';

  const articleSchema = `
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": ${JSON.stringify(art.title)},
  "description": ${JSON.stringify(art.metaDesc || art.excerpt)},
  "url": "https://toolrar.com/blog/${art.category}/${art.slug}.html",
  "datePublished": "${art.createdAt || new Date().toISOString()}",
  "dateModified": "${art.updatedAt || new Date().toISOString()}",
  "author": { "@type": "Person", "name": "${art.author || 'Toolrar'}" },
  "publisher": { "@type": "Organization", "name": "ToolRar", "url": "https://toolrar.com" },
  "image": "img/${art.slug}.png"
}
</script>`;

  const schemaStart = html.indexOf('<script type="application/ld+json">');
  if (schemaStart !== -1) {
    const schemaEnd = html.indexOf('<link rel="preload"', schemaStart);
    if (schemaEnd !== -1) {
      html = html.substring(0, schemaStart) + articleSchema + faqSchema + "\n" + html.substring(schemaEnd);
    }
  }

  // Replace breadcrumbs & title headers
  html = html.replace(/href="index\.html" class="category-badge">أدوات النصوص<\/a>/g, `<a href="index.html" class="category-badge">${cat.name}</a>`);
  html = html.replace(/href="index\.html">أدوات النصوص<\/a>/g, `href="index.html">${cat.name}</a>`);
  
  const breadcrumbSpanStart = html.indexOf('<span style="color:#A5B4FC">');
  if (breadcrumbSpanStart !== -1) {
    const breadcrumbSpanEnd = html.indexOf('</span>', breadcrumbSpanStart);
    if (breadcrumbSpanEnd !== -1) {
      html = html.substring(0, breadcrumbSpanStart) + `<span style="color:#A5B4FC">${art.title}</span>` + html.substring(breadcrumbSpanEnd + 7);
    }
  }

  const h1Start = html.indexOf('<h1>');
  if (h1Start !== -1) {
    const h1End = html.indexOf('</h1>', h1Start);
    if (h1End !== -1) {
      html = html.substring(0, h1Start) + `<h1>${art.title}</h1>` + html.substring(h1End + 5);
    }
  }

  html = html.replace(/> 2026-07-06<\/span>/g, `> ${art.date}</span>`);

  // Replace main content block
  const contentStart = html.indexOf('<div class="article-content">');
  if (contentStart !== -1) {
    const contentEnd = html.indexOf('<div class="faq-inline">', contentStart);
    if (contentEnd !== -1) {
      const newContentBlock = `
<div class="article-content">
<div class="featured-image-wrap"><img src="img/${art.slug}.png" alt="${art.imageAlt || art.title}" title="${art.imageTitle || art.title}" width="1200" height="630" loading="lazy" class="article-featured-image"><span class="watermark">www.toolrar.com</span></div>
${art.content}
</div>
`;
      html = html.substring(0, contentStart) + newContentBlock + html.substring(contentEnd);
    }
  }

  // Build FAQ elements
  let faqBlock = '';
  if (art.faq && art.faq.length > 0) {
    faqBlock = `
<div class="faq-sidebar"><h3 class="faq-sidebar-title">❓ الأسئلة الشائعة</h3><div class="faq-sidebar-list">
`;
    art.faq.forEach((f, idx) => {
      faqBlock += `
<div class="faq-sidebar-item"><button class="faq-sidebar-q" onclick="toggleFaq(${idx})">${f.q}<svg class="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></button><div class="faq-sidebar-a" id="faqAnswer${idx}"><p>${f.a}</p></div></div>
`;
    });
    faqBlock += '</div></div>';
  }

  // Inline FAQs replacement
  const faqInlineStart = html.indexOf('<div class="faq-inline">');
  if (faqInlineStart !== -1) {
    const faqInlineEnd = html.indexOf('<div class="author-box">', faqInlineStart);
    if (faqInlineEnd !== -1) {
      html = html.substring(0, faqInlineStart) + `<div class="faq-inline">${faqBlock}</div>\n` + html.substring(faqInlineEnd);
    }
  }

  // Sidebar TOC and FAQ
  const sidebarStart = html.indexOf('<div class="sidebar">');
  if (sidebarStart !== -1) {
    const sidebarEnd = html.indexOf('</div>\n</div>\n</section>', sidebarStart);
    if (sidebarEnd !== -1) {
      const tocHTML = rebuildTOC(art.content);
      const newSidebarBlock = `
<div class="sidebar">
${tocHTML}
${faqBlock}
</div>
`;
      html = html.substring(0, sidebarStart) + newSidebarBlock + html.substring(sidebarEnd);
    }
  }

  return html;
}

function rebuildTOC(content) {
  const headings = [];
  const regex = /<h([23])([^>]*)>([^<]+)<\/h[23]>/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    headings.push({ level: match[1], text: match[3] });
  }
  if (headings.length === 0) return '';

  let toc = '<nav class="toc"><h3 class="toc-title">📋 فهرس المقال</h3><ul class="toc-list">';
  headings.forEach(h => {
    const id = slugify(h.text);
    const isSub = h.level === '3';
    toc += `
<li class="toc-item ${isSub ? 'toc-sub' : ''}"><a href="#${id}" class="toc-link">${h.text}</a></li>
`;
  });
  toc += '</ul></nav>';
  return toc;
}

// 1. Sync blog/index.html
const indexHtmlPath = path.join(blogDir, 'index.html');
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
indexHtml = updateArticlesInHTML(indexHtml, articles);
indexHtml = updateCategoriesInHTML(indexHtml, categories);
fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
console.log('✔ Generated blog/index.html');

// 2. Sync category pages and individual article pages
const sampleArticlePath = path.join(blogDir, 'text-tools', 'asrar-almhtrfyn-kyf-ttsdr-mnsat-akhtbar.html');
const articleTemplate = fs.readFileSync(sampleArticlePath, 'utf8');

const sampleCategoryPath = path.join(blogDir, 'text-tools', 'index.html');
const categoryTemplate = fs.readFileSync(sampleCategoryPath, 'utf8');

categories.forEach(cat => {
  const catFolder = path.join(blogDir, cat.slug);
  if (!fs.existsSync(catFolder)) {
    fs.mkdirSync(catFolder, { recursive: true });
    fs.mkdirSync(path.join(catFolder, 'img'), { recursive: true });
  }

  // Generate category index.html
  const specificCatIndexPath = path.join(catFolder, 'index.html');
  let catHTML = '';
  if (fs.existsSync(specificCatIndexPath)) {
    const currentCatIndex = fs.readFileSync(specificCatIndexPath, 'utf8');
    catHTML = updateArticlesInHTML(currentCatIndex, articles.filter(a => a.category === cat.id));
  } else {
    catHTML = updateArticlesInHTML(categoryTemplate, articles.filter(a => a.category === cat.id));
    catHTML = catHTML.replace(/أدوات النصوص والكلمات/g, cat.name);
    catHTML = catHTML.replace(/text-tools/g, cat.slug);
    if (cat.description) {
      catHTML = catHTML.replace(/أحدث المقالات والأدلة حول أدوات تحرير النصوص وتحليل الكلمات وعدد الأحرف والترجمة والتدقيق الإملائي. كل ما تحتاجه لتحسين كتابتك وإتقان المحتوى./g, cat.description);
    }
  }
  fs.writeFileSync(specificCatIndexPath, catHTML, 'utf8');
  console.log(`✔ Generated blog/${cat.slug}/index.html`);

  // Generate articles in this category
  const catArticles = articles.filter(a => a.category === cat.id);
  catArticles.forEach(art => {
    const artHTML = getProcessedArticleHTML(articleTemplate, art);
    fs.writeFileSync(path.join(catFolder, `${art.slug}.html`), artHTML, 'utf8');
    console.log(`✔ Generated blog/${cat.slug}/${art.slug}.html`);
  });
});

console.log('🎉 Initial Blog sync complete!');
