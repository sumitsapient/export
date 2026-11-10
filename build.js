const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');
const site = require('./data/site.json');
const products = require('./data/products.json');
const layout = fs.readFileSync(path.join(ROOT, 'src/layout.html'), 'utf8');
const icons = fs.readFileSync(path.join(ROOT, 'src/icons.svg'), 'utf8');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fill = (tpl, vars) => tpl.replace(/{{(\w+)}}/g, (_, k) => (k in vars ? vars[k] : ''));
const write = (rel, data) => {
  const f = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, data);
};
const copyDir = (src, dest) => fs.existsSync(src) && fs.cpSync(src, dest, { recursive: true });
const uniq = key => [...new Set(products.flatMap(p => [].concat(p[key])))].sort();
const tagClass = c => c.toLowerCase();

const header = urlPath => {
  const items = site.nav.map(n => {
    const active = n.match.some(m => (m === '/' ? urlPath === '/' : urlPath.startsWith(m)));
    return `<li><a href="${n.href}"${active ? ' aria-current="page"' : ''}>${esc(n.label)}</a></li>`;
  }).join('\n        ');
  return `<header class="site-header">
  <div class="wrap bar">
    <a class="logo" href="/" aria-label="${site.name} home"><span class="logo-mark" aria-hidden="true">${site.name[0]}</span>${site.name}</a>
    <button class="nav-toggle" aria-expanded="false" aria-controls="primary-nav" aria-label="Menu"><span></span></button>
    <nav id="primary-nav" aria-label="Primary">
      <ul>
        ${items}
        <li><a class="btn btn-solid" href="${site.cta.href.startsWith('#') ? '/' + site.cta.href : site.cta.href}">${esc(site.cta.label)}</a></li>
      </ul>
    </nav>
  </div>
</header>`;
};

const footer = `<footer class="site-footer">
  <div class="wrap">&copy; <span id="yr">${new Date().getFullYear()}</span> ${site.name}. All rights reserved.</div>
</footer>`;

const pages = [];
const page = ({ url, title, description, content, scripts = '' }) => {
  const html = fill(layout, {
    title: esc(title), description: esc(description), scripts, icons,
    header: header(url), content, footer
  });
  write(url === '/' ? 'index.html' : url.slice(1), html);
  pages.push(url);
};

const card = p => `<article class="pcard" data-category="${esc(p.category)}" data-application="${esc(p.application)}" data-origin="${esc(p.origin)}" data-certification="${esc(p.certifications.join('|'))}" data-moq="${esc(p.moqTier)}" data-supply="${esc(p.supplyType)}">
  <div class="pimg ${tagClass(p.category)}" style="--img:url(/images/products/${p.slug}.webp)" role="img" aria-label="${esc(p.name)}"></div>
  <div class="pbody">
    <span class="tag tag-${tagClass(p.category)}">${esc(p.category)}</span>
    <h2>${esc(p.name)}</h2>
    <p class="origin">${esc(p.origin)} Origin &bull; ${esc(p.supplyMode)}</p>
    <dl class="specs">
      <div><dt>MOQ</dt><dd>${esc(p.moq)}</dd></div>
      <div><dt>Packaging</dt><dd>${esc(p.packaging)}</dd></div>
      <div><dt>Supply Type</dt><dd>${esc(p.supplyType)}</dd></div>
    </dl>
    <a class="more" href="/products/${p.slug}.html">View Details &rarr;</a>
  </div>
</article>`;

const select = (id, label, all, values) => `<label>${label}<select id="f-${id}" data-filter="${id}"><option value="">${all}</option>${values.map(v => `<option>${esc(v)}</option>`).join('')}</select></label>`;

// Home
page({
  url: '/',
  title: `${site.name} | Agricultural & Textile Exports from India`,
  description: `${site.name} exports high-quality agricultural ingredients, sustainable textiles and custom sourced products from India to the world.`,
  content: fill(fs.readFileSync(path.join(ROOT, 'src/pages/index.html'), 'utf8'), { email: site.email })
});

// Catalogue
page({
  url: '/products.html',
  title: `Product Catalogue | ${site.name}`,
  description: 'High-quality Indian products, ready for global markets.',
  scripts: '<script src="/js/filter.js" defer></script>',
  content: `<section class="page-banner"><div class="wrap"><h1>Product Catalogue</h1><p>High-quality Indian products, ready for global markets.</p></div></section>
<div class="wrap">
  <form class="filters" aria-label="Filter products" onsubmit="return false">
    ${select('category', 'Category', 'All Categories', uniq('category'))}
    ${select('application', 'Application', 'All Applications', uniq('application'))}
    ${select('origin', 'Origin', 'All Origins', uniq('origin'))}
    ${select('certification', 'Certification', 'All Certifications', uniq('certifications'))}
    ${select('moq', 'MOQ', 'Any MOQ', uniq('moqTier'))}
    ${select('supply', 'Supply Type', 'All Supply Types', uniq('supplyType'))}
    <button type="reset" class="clear">Clear Filters</button>
  </form>
  <p id="no-results" class="no-results" hidden>No products match these filters.</p>
  <div class="pgrid">
    ${products.map(card).join('\n    ')}
    <aside class="pcard enquiry-card" id="enquiry">
      <div class="pbody">
        <h2>Looking for something specific?</h2>
        <p>We source a wide range of Indian products. Tell us what you need and we&rsquo;ll find the best solution for you.</p>
        <a class="btn btn-solid" href="mailto:${site.email}">Start an Enquiry</a>
      </div>
    </aside>
  </div>
</div>`
});

// Product detail pages
const mail = (p, what) => `mailto:${site.email}?subject=${encodeURIComponent(`${what}: ${p.name}`)}`;
const list = items => `<ul class="ticks">${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;

const detailTabs = p => {
  const tabs = [
    ['Applications', `<div class="tab-split"><ul class="ticks apps">${p.applications.map(a => `<li><strong>${esc(a.name)}</strong> &ndash; ${esc(a.text)}</li>`).join('')}</ul>
      <div class="pimg caption-card ${tagClass(p.category)}" style="--img:url(/images/products/${p.slug}-2.webp)" role="img" aria-label="${esc(p.name)}"><span>${esc(p.caption)}</span></div></div>`],
    ['Quality & Testing', list(p.quality)],
    ['Packaging', list(p.packagingOptions)],
    ['Supply & Logistics', list(p.logistics)],
    ['FAQs', p.faqs.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')]
  ];
  const id = i => `tab-${i}`;
  return `<div class="tabs">
    <div class="tablist" role="tablist" aria-label="Product information">
      ${tabs.map(([l], i) => `<button role="tab" id="${id(i)}" aria-controls="panel-${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${esc(l)}</button>`).join('\n      ')}
    </div>
    ${tabs.map(([l, html], i) => `<section role="tabpanel" id="panel-${i}" aria-labelledby="${id(i)}"${i ? ' hidden' : ''}><h2>${esc(l)}</h2>${html}</section>`).join('\n    ')}
  </div>`;
};

for (const p of products) {
  const thumbs = Array.from({ length: p.gallery }, (_, i) => `/images/products/${p.slug}${i ? '-' + (i + 1) : ''}.webp`);
  page({
    url: `/products/${p.slug}.html`,
    title: `${p.name} | ${site.name}`,
    description: p.summary,
    scripts: '<script src="/js/detail.js" defer></script>',
    content: `<div class="wrap detail">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; <a href="/products.html">Products</a> &rsaquo; <span>${esc(p.name)}</span></nav>
  <div class="detail-grid">
    <div class="gallery">
      <div class="pimg big ${tagClass(p.category)}" id="main-img" style="--img:url(${thumbs[0]})" role="img" aria-label="${esc(p.name)}"></div>
      <div class="thumbs">${thumbs.map((t, i) => `<button type="button" class="pimg thumb ${tagClass(p.category)}" data-src="${t}" style="--img:url(${t})" aria-label="View image ${i + 1}"></button>`).join('')}</div>
    </div>
    <div>
      <div class="tags">${p.tags.map(t => `<span class="tag tag-pill">${esc(t)}</span>`).join('')}</div>
      <h1>${esc(p.name)}</h1>
      <p class="origin"><strong>${esc(p.origin)} Origin</strong></p>
      <p>${esc(p.summary)}</p>
      <div class="cta-row">
        <a class="btn btn-outline" href="${mail(p, 'Specification request')}">Request Specification</a>
        <a class="btn btn-solid" href="${mail(p, 'Sample request')}">Request Sample</a>
        <a class="btn btn-outline wide" href="${mail(p, 'Quote request')}">Request Quote</a>
      </div>
      <div class="spec-box"><h2>Product Specifications</h2>
        <dl class="specs">${p.specs.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      </div>
    </div>
  </div>
  ${detailTabs(p)}
</div>`
  });
}
// Quality & Traceability
const quality = require('./data/quality.json');
const ico = n => `<span class="ic"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#${n}"/></svg></span>`;
page({
  url: '/quality-assurance.html',
  title: `Quality & Traceability | ${site.name}`,
  description: quality.hero.text,
  content: `<section class="page-hero" style="--img:url(/images/quality-hero.webp)"><div class="wrap"><h1>${esc(quality.hero.title)}</h1><p>${esc(quality.hero.text)}</p></div></section>
<section class="wrap process left" aria-labelledby="qp-h">
  <h2 id="qp-h">${esc(quality.process.title)}</h2>
  <ol>${quality.process.steps.map((s, i) => `<li>${ico(s.icon)}${i + 1}. ${esc(s.label)}</li>`).join('')}</ol>
</section>
<section class="wrap certs" aria-labelledby="cert-h">
  <h2 id="cert-h">${esc(quality.certs.title)}</h2>
  <div class="cert-grid">
    <div class="panel">
      <h3>Company Credentials</h3>
      <div class="feature"><span class="badge">${ico(quality.credentials.featured.icon)}</span><div><strong>${esc(quality.credentials.featured.name)}</strong><p>${esc(quality.credentials.featured.text)}</p><a href="${quality.credentials.featured.href}">View Details &rarr;</a></div></div>
      <h3>Other Business Registrations</h3>
      <ul class="ticks warm">${quality.credentials.others.map(o => `<li>${esc(o)}</li>`).join('')}</ul>
    </div>
    <div class="panel">
      <h3>Product-Specific Certifications</h3>
      <ul class="rows">${quality.productCerts.map(c => `<li>${ico(c.icon)}<div><strong>${esc(c.name)}</strong><small>${esc(c.note)}</small></div></li>`).join('')}</ul>
    </div>
    <div class="panel">
      <h3>Verification &amp; Inspection</h3>
      <ul class="rows">${quality.verification.map(c => `<li>${ico(c.icon)}<div><strong>${esc(c.name)}</strong><small>${esc(c.note)}</small></div></li>`).join('')}</ul>
    </div>
  </div>
</section>
<section class="wrap doc-banner" id="enquiry">
  <div class="doc-img" style="--img:url(/images/quality-docs.webp)" role="img" aria-label="Export documentation"></div>
  <p>${esc(quality.banner.text)}</p>
  <a class="btn btn-solid" href="mailto:${site.email}?subject=${encodeURIComponent('Documentation request')}">${esc(quality.banner.cta)}</a>
</section>`
});
// How We Work
const sourcing = require('./data/sourcing.json');
const opt = v => `<option>${esc(v)}</option>`;
page({
  url: '/sourcing-process.html',
  title: `How We Work | ${site.name}`,
  description: sourcing.hero.text,
  scripts: '<script src="/js/rfq.js" defer></script>',
  content: `<section class="page-hero" style="--img:url(/images/sourcing-hero.webp)"><div class="wrap"><h1>${esc(sourcing.hero.title)}</h1><p>${esc(sourcing.hero.text)}</p></div></section>
<section class="wrap process n7" aria-label="Sourcing steps">
  <ol>${sourcing.steps.map((s, i) => `<li>${ico(s.icon)}${i + 1}. ${esc(s.label)}</li>`).join('')}</ol>
</section>
<section class="wrap rfq-grid" id="enquiry">
  <div class="panel intro">
    <h2>${esc(sourcing.intro.title)}</h2>
    <p>${esc(sourcing.intro.text)}</p>
    <ul class="ticks">${sourcing.intro.points.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
    <p class="closing">${esc(sourcing.intro.closing)}</p>
  </div>
  <form class="panel rfq" id="rfq" data-endpoint="${esc(site.formEndpoint)}" data-email="${esc(site.email)}">
    <h2>Request for Quotation (RFQ)</h2>
    <div class="row2">
      <label>Name *<input name="Name" required autocomplete="name"></label>
      <label>Email *<input name="Email" type="email" required autocomplete="email"></label>
    </div>
    <div class="row2">
      <label>Product *<select name="Product" required><option value="">Select product</option>${products.map(p => opt(p.name)).join('')}<option>Other</option></select></label>
      <label>Quantity *<input name="Quantity" required placeholder="e.g. 1,000 kg / 5,000 pcs"></label>
    </div>
    <label>Country of Destination *<select name="Country" required><option value="">Select country</option>${sourcing.countries.map(opt).join('')}</select></label>
    <label>Specification<textarea name="Specification" rows="3" placeholder="Any specific requirements?"></textarea></label>
    <div class="row2">
      <label>Packaging<input name="Packaging" placeholder="e.g. 25 kg bags, cartons"></label>
      <label>Timeline<input name="Timeline" placeholder="e.g. within 30 days"></label>
    </div>
    <fieldset><legend>Private Label / OEM</legend><label class="inline"><input type="radio" name="Private Label" value="Yes"> Yes</label><label class="inline"><input type="radio" name="Private Label" value="No"> No</label></fieldset>
    <button class="btn btn-solid" type="submit">Submit RFQ</button>
    <p class="form-status" role="status" aria-live="polite"></p>
  </form>
</section>
<section class="green-band">
  <div class="wrap band-in">
    <span class="ic">${'<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i9"/></svg>'}</span>
    <div><strong>${esc(sourcing.banner.title)}</strong><p>${esc(sourcing.banner.text)}</p></div>
    <a class="btn btn-cream" href="/products.html">${esc(sourcing.banner.cta)}</a>
  </div>
</section>`
});
// Sustainability
const sus = require('./data/sustainability.json');
page({
  url: '/sustainability.html',
  title: `Sustainability & Vision | ${site.name}`,
  description: sus.hero.text,
  content: `<section class="page-hero light" style="--img:url(/images/sustainability-hero.webp)"><div class="wrap"><h1>${esc(sus.hero.title)}</h1><p>${esc(sus.hero.text)}</p></div></section>
<section class="wrap pillars" aria-labelledby="pil-h">
  <h2 id="pil-h">${esc(sus.pillars.title)}</h2>
  <div class="pillar-grid">${sus.pillars.items.map(p => `<article class="panel pillar">${ico(p.icon)}<h3>${esc(p.name)}</h3><p>${esc(p.text)}</p></article>`).join('')}</div>
</section>
<section class="wrap vision" aria-labelledby="vis-h">
  <div class="vision-box">
    <h2 id="vis-h">${esc(sus.vision.title)}</h2>
    <p class="sub">${esc(sus.vision.text)}</p>
    <ol>${sus.vision.steps.map(s => `<li><span class="vimg" style="--img:url(/images/vision-${s.slug}.webp)" role="img" aria-label="${esc(s.name)}"></span><strong>${esc(s.name)}</strong><small>${esc(s.text)}</small></li>`).join('')}</ol>
  </div>
</section>
<section class="closing-band" style="--img:url(/images/sustainability-closing.webp)">
  <div class="wrap band-in"><span class="ic"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i15"/></svg></span><div><strong>${esc(sus.closing.title)}</strong><p>${esc(sus.closing.text)}</p></div></div>
</section>`
});
copyDir(path.join(ROOT, 'css'), path.join(OUT, 'css'));
copyDir(path.join(ROOT, 'js'), path.join(OUT, 'js'));
copyDir(path.join(ROOT, 'images'), path.join(OUT, 'images'));

write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(u => `  <url><loc>${site.url}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`Built ${pages.length} pages -> dist/`);
