function renderSearchPage(siteData, baseUrl, heroImage) {
  const metrics = [
    { label: 'Events indexed', value: siteData.events.length ? String(siteData.events.length) : '0' },
    { label: 'Alliances tracked', value: siteData.alliances.length ? String(siteData.alliances.length) : '0' },
    { label: 'Builds cached', value: siteData.releases.length ? String(siteData.releases.length) : '0' }
  ];

  const hero = renderSubpageHero({
    eyebrow: 'API tooling',
    title: 'Search the cosmos',
    description: 'Leverage backend endpoints to index users, events, and alliances without leaving the static shell.',
    actions: [
      { label: 'Run live search', href: '/api/search' },
      { label: 'API docs', href: '/api/docs', variant: 'ghost' },
      { label: 'Back to overview', href: baseUrl, variant: 'ghost' }
    ],
    metrics,
    heroImage
  });

  return `
${hero}
<section class="panel">
  <div class="panel-heading">
    <h2>Query starters</h2>
    <p class="panel-sub">Leverage backend endpoints to index users, events, and alliances from the static shell.</p>
  </div>
  <div class="panel-body">
    <p>Use the live API to run filtered lookups. The examples below are ready to copy and execute with any HTTP client.</p>
    <div class="code-grid">
      <article>
        <h3>User discovery</h3>
        <pre><code>GET /api/search/users?query=pilot</code></pre>
        <p class="note">Returns profile snippets, location hints, and social handles.</p>
      </article>
      <article>
        <h3>Alliance lookup</h3>
        <pre><code>GET /api/search/alliances?focus=explorer</code></pre>
        <p class="note">Filter by primary focus or recruitment status.</p>
      </article>
      <article>
        <h3>Event manifest</h3>
        <pre><code>GET /api/events?from=today&amp;limit=12</code></pre>
        <p class="note">Paging-ready responses ideal for static overlays.</p>
      </article>
    </div>
  </div>
</section>

<section class="panel">
  <div class="panel-heading">
    <h2>Static tooling tips</h2>
    <p class="panel-sub">Capture responses, cache in JSON, and hydrate components without rebuilding the entire site.</p>
  </div>
  <ul class="tip-list">
    <li><span>Cache results</span> <p>Use <code>${resolveLink(baseUrl, 'data/site-data.json')}</code> as a quick snapshot for home views.</p></li>
    <li><span>Respect pagination</span> <p>Append <code>&amp;page=</code> and <code>&amp;limit=</code> parameters for long-form listings.</p></li>
    <li><span>Authenticate sparingly</span> <p>Only account routes require JWT headers. Public endpoints stay open for static previews.</p></li>
  </ul>
</section>`;
}

function renderAccountPage(siteData, baseUrl, heroImage) {
  const latestRelease = siteData.releases[0];
  const metrics = [
    { label: 'Active alliances', value: siteData.alliances.length ? String(siteData.alliances.length) : '0' },
    { label: 'Upcoming events', value: siteData.events.length ? String(siteData.events.length) : '0' },
    { label: 'Latest build', value: latestRelease ? latestRelease.version : 'Pending' }
  ];

  const hero = renderSubpageHero({
    eyebrow: 'Control deck',
    title: 'Account & support',
    description: 'Manage credentials, request support, and keep sessions synchronized while the site stays static.',
    actions: [
      { label: 'Open status page', href: '/api/status' },
      { label: 'Contact support', href: 'mailto:support@kusher.space', variant: 'ghost' },
      { label: 'Back to overview', href: baseUrl, variant: 'ghost' }
    ],
    metrics,
    heroImage
  });

  return `
${hero}
<section class="panel">
  <div class="panel-heading">
    <h2>Account controls</h2>
    <p class="panel-sub">Static doesn’t mean silent—manage credentials and sessions through the live API.</p>
  </div>
  <div class="card-grid">
    <article class="card">
      <h3>Authenticate</h3>
      <p>Sign in through the backend and reuse the issued JWT for every secured endpoint.</p>
      <pre><code>POST /api/auth/login</code></pre>
      <p class="note">Store tokens in HTTP-only cookies for safer static integrations.</p>
    </article>
    <article class="card">
      <h3>Profile sync</h3>
      <p>Pull profile and game data to refresh static views without rebuilding.</p>
      <pre><code>GET /api/user/profile</code></pre>
      <p class="note">Combine with <code>/api/user/game-data</code> for dashboards.</p>
    </article>
    <article class="card">
      <h3>Session hygiene</h3>
      <p>Trigger remote logout when rotating static caches or deploying new builds.</p>
      <pre><code>POST /api/auth/logout</code></pre>
      <p class="note">Clear stale tokens to avoid ghost sessions.</p>
    </article>
  </div>
</section>

<section class="panel" id="support">
  <div class="panel-heading">
    <h2>Support uplink</h2>
    <p class="panel-sub">Need a human? The static control deck still routes directly to the crew.</p>
  </div>
  <div class="support-grid">
    <article class="card">
      <h3>Email</h3>
      <p>Send structured reports with logs or screenshots.</p>
      <ul class="bullets">
        <li><a href="mailto:support@kusher.space">support@kusher.space</a></li>
        <li>Subject: <code>[Support]</code> + username</li>
        <li>Attach device + build version</li>
      </ul>
    </article>
    <article class="card">
      <h3>Discord bridge</h3>
      <p>Live chat with moderators and fellow pilots.</p>
      <a class="btn" href="https://discord.gg/kusher" target="_blank" rel="noopener">Join Discord</a>
    </article>
    <article class="card">
      <h3>Status checks</h3>
      <p>Verify API response health directly.</p>
      <pre><code>GET /api/status</code></pre>
      <a class="btn" href="/api/status" target="_blank" rel="noopener">Ping status</a>
    </article>
  </div>
</section>`;
}
function renderReleaseRow(release) {
  const notesId = `note-${release.id}`;
  return `<article class="release-row">
    <div class="release-meta">
      <h3>${escapeHtml(release.version)}${release.isBeta ? ' <span class="badge warn">Beta</span>' : ''}</h3>
      <p>Version code ${release.versionCode} · Released ${formatDate(release.createdAt)}</p>
    </div>
    <div class="release-actions">
      <a class="btn" href="/api/game/download/${release.id}">Download</a>
      ${release.releaseNotes ? `<button class="btn ghost" data-toggle-note="${notesId}">View notes</button>` : ''}
    </div>
    ${release.releaseNotes ? `<div class="release-notes" id="${notesId}">${renderMarkdownish(release.releaseNotes)}</div>` : ''}
  </article>`;
}
'use strict';

const path = require('path');
const fs = require('fs/promises');
const { exit } = require('process');

const projectRoot = path.resolve(__dirname, '..');
require('dotenv').config({ path: path.join(projectRoot, '.env') });

const db = require('../models');
const { Sequelize } = db;
const { Op } = Sequelize;

const DEFAULT_OUTPUT = path.join(projectRoot, 'static-site', 'dist');
const FRONTEND_IMAGES_DIR = path.resolve(projectRoot, '..', 'frontend', 'public', 'images');

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const outDir = path.resolve(options.outDir || DEFAULT_OUTPUT);
  const baseUrl = normalizeBaseUrl(options.baseUrl || '/');

  log(`Generating static site into: ${outDir}`);

  await prepareOutput(outDir);

  await db.testConnection();

  const [events, alliances, versions] = await Promise.all([
    safeQuery(fetchEvents, 'events'),
    safeQuery(fetchAlliances, 'alliances'),
    safeQuery(fetchVersions, 'game versions')
  ]);

  const siteData = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    events,
    alliances,
    releases: versions
  };

  const assetsManifest = await generateAssets(outDir);
  await generatePages(outDir, baseUrl, siteData, assetsManifest);
  await writeJson(path.join(outDir, 'data', 'site-data.json'), siteData);
  await writeRobots(outDir, baseUrl);

  await db.sequelize.close();

  log('Static site generated successfully');
}

function parseArgs(args) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--out' || arg === '--out-dir') {
      options.outDir = args[i + 1];
      i++;
    } else if (arg.startsWith('--out=')) {
      options.outDir = arg.split('=')[1];
    } else if (arg === '--base-url') {
      options.baseUrl = args[i + 1];
      i++;
    } else if (arg.startsWith('--base-url=')) {
      options.baseUrl = arg.split('=')[1];
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      exit(0);
    }
  }
  return options;
}

function printHelp() {
  console.log(`Usage: node build-static-site.js [options]\n\nOptions:\n  --out <dir>         Output directory (default: ${DEFAULT_OUTPUT})\n  --base-url <url>    Base URL for assets (default: /)\n  --help              Show this help message`);
}

function normalizeBaseUrl(url) {
  if (!url) return '/';
  if (!url.startsWith('/')) url = '/' + url;
  if (!url.endsWith('/')) url += '/';
  return url;
}

async function prepareOutput(outDir) {
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });
  const subDirs = ['assets', 'assets/images', 'data', 'pages'];
  await Promise.all(subDirs.map((dir) => fs.mkdir(path.join(outDir, dir), { recursive: true })));
}

async function fetchEvents() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const records = await db.Event.findAll({
    where: {
      event_date: {
        [Op.gte]: today
      }
    },
    order: [
      ['event_date', 'ASC'],
      ['event_time', 'ASC']
    ],
    limit: 24,
    include: [
      {
        model: db.User,
        as: 'creator',
        attributes: ['id', 'username']
      },
      {
        model: db.EventsParticipant,
        as: 'participants',
        attributes: ['id']
      },
      {
        model: db.EventRSVP,
        as: 'rsvps',
        attributes: ['id', 'response']
      }
    ]
  });

  return records.map((event) => {
    const plain = event.get({ plain: true });
    const participantCount = plain.participants ? plain.participants.length : 0;
    const attendingCount = plain.rsvps ? plain.rsvps.filter((r) => r.response === 'attending').length : 0;
    const interestedCount = plain.rsvps ? plain.rsvps.filter((r) => r.response === 'interested').length : 0;

    return {
      id: plain.id,
      title: plain.title,
      type: plain.event_type,
      description: plain.description || 'Stay tuned for more details.',
      eventDate: plain.event_date,
      eventTime: plain.event_time,
      endDate: plain.end_date,
      isFeatured: plain.is_featured,
      registrationRequired: plain.registration_required,
      maxParticipants: plain.max_participants,
      currentParticipants: plain.current_participants || participantCount,
      attendingCount,
      interestedCount,
      prizePool: plain.prize_pool,
      imageUrl: plain.image_url,
      color: plain.color,
      createdBy: plain.creator ? plain.creator.username : 'Kusher Operations'
    };
  });
}

async function fetchAlliances() {
  const records = await db.Alliance.findAll({
    where: {
      status: 'active'
    },
    order: [
      ['level', 'DESC'],
      ['total_xp', 'DESC']
    ],
    limit: 18,
    include: [
      {
        model: db.User,
        as: 'leader',
        attributes: ['id', 'username']
      }
    ]
  });

  return records.map((alliance) => {
    const plain = alliance.get({ plain: true });
    return {
      id: plain.id,
      name: plain.name,
      tag: plain.tag,
      description: plain.description || 'An active Kusher alliance welcoming new members.',
      type: plain.alliance_type,
      focus: plain.primary_focus,
      motto: plain.motto,
      level: plain.level,
      totalXp: plain.total_xp,
      rank: plain.rank,
      maxMembers: plain.max_members,
      membershipType: plain.membership_type,
      logoUrl: plain.logo_url,
      bannerUrl: plain.banner_url,
      colorPrimary: plain.color_primary,
      colorSecondary: plain.color_secondary,
      leader: plain.leader ? plain.leader.username : 'Unknown Leader'
    };
  });
}

async function fetchVersions() {
  const records = await db.GameVersion.findAll({
    where: {
      is_active: true
    },
    order: [
      ['version_code', 'DESC']
    ],
    limit: 10
  });

  return records.map((version) => {
    const plain = version.get({ plain: true });
    return {
      id: plain.id,
      version: plain.version,
      versionCode: plain.version_code,
      releaseNotes: plain.release_notes,
      changelog: plain.changelog,
      fileSize: plain.file_size,
      md5: plain.md5_hash,
      minAndroidVersion: plain.min_android_version,
      isBeta: plain.is_beta,
      downloadCount: plain.download_count,
      createdAt: plain.created_at
    };
  });
}

async function generateAssets(outDir) {
  const assetsDir = path.join(outDir, 'assets');
  await fs.mkdir(assetsDir, { recursive: true });
  await fs.writeFile(path.join(assetsDir, 'styles.css'), STYLESHEET, 'utf8');
  await fs.writeFile(path.join(assetsDir, 'app.js'), APP_SCRIPT, 'utf8');
  await fs.writeFile(path.join(assetsDir, 'placeholder-hero.svg'), PLACEHOLDER_HERO, 'utf8');
  await fs.writeFile(path.join(outDir, 'favicon.svg'), FAVICON, 'utf8');

  const imagesDir = path.join(assetsDir, 'images');
  const heroImages = await copyHeroImages(imagesDir);

  return {
    heroImages
  };
}

async function generatePages(outDir, baseUrl, siteData, assetsManifest = {}) {
  const heroImages = assetsManifest.heroImages || [];
  const primaryHeroImage = heroImages[0]
    ? resolveLink(baseUrl, `assets/images/${heroImages[0]}`)
    : `${baseUrl}assets/placeholder-hero.svg`;

  const pages = [
    {
      file: 'index.html',
      content: renderPage({
        title: 'Kusher Space | Galactic Command Center',
        description: 'A luminous static journey through Kusher Space alliances, events, and downloads.',
        baseUrl,
        activePage: 'home',
        body: renderHome(siteData, baseUrl, heroImages)
      })
    },
    {
      file: path.join('pages', 'events.html'),
      content: renderPage({
        title: 'Events & Alliances | Kusher Space',
        description: 'Browse upcoming missions and the alliances leading them.',
        baseUrl,
        activePage: 'events',
        body: renderEventsPage(siteData.events, siteData.alliances, baseUrl, primaryHeroImage)
      })
    },
    {
      file: path.join('pages', 'download.html'),
      content: renderPage({
        title: 'Downloads | Kusher Space',
        description: 'Secure the freshest Android builds and patch notes.',
        baseUrl,
        activePage: 'download',
        body: renderDownloadsPage(siteData.releases, baseUrl, primaryHeroImage)
      })
    },
    {
      file: path.join('pages', 'search.html'),
      content: renderPage({
        title: 'Search The Cosmos | Kusher Space',
        description: 'Navigate the API-powered directory of players, events, and resources.',
        baseUrl,
        activePage: 'search',
        body: renderSearchPage(siteData, baseUrl, primaryHeroImage)
      })
    },
    {
      file: path.join('pages', 'account.html'),
      content: renderPage({
        title: 'Account & Support | Kusher Space',
        description: 'Manage credentials, request support, and stay secure across the static portal.',
        baseUrl,
        activePage: 'account',
        body: renderAccountPage(siteData, baseUrl, primaryHeroImage)
      })
    }
  ];

  await Promise.all(pages.map((page) => fs.writeFile(path.join(outDir, page.file), page.content, 'utf8')));
  await fs.writeFile(path.join(outDir, 'sitemap.xml'), renderSitemap(baseUrl), 'utf8');
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

async function writeRobots(outDir, baseUrl) {
  const robots = `User-agent: *\nAllow: /\nSitemap: ${resolveLink(baseUrl, 'sitemap.xml')}\n`;
  await fs.writeFile(path.join(outDir, 'robots.txt'), robots, 'utf8');
}

async function copyHeroImages(destinationDir) {
  await fs.mkdir(destinationDir, { recursive: true });
  try {
    const dirEntries = await fs.readdir(FRONTEND_IMAGES_DIR, { withFileTypes: true });
    const heroImages = dirEntries
      .filter((entry) => entry.isFile() && /^kusher_00.*\.png$/i.test(entry.name))
      .map((entry) => entry.name)
      .sort();

    await Promise.all(heroImages.map(async (fileName) => {
      const source = path.join(FRONTEND_IMAGES_DIR, fileName);
      const target = path.join(destinationDir, fileName);
      await fs.copyFile(source, target);
    }));

    return heroImages;
  } catch (error) {
    console.warn(`⚠️  Unable to copy hero images: ${error.message}`);
    return [];
  }
}

async function safeQuery(fn, label) {
  try {
    return await fn();
  } catch (error) {
    console.warn(`⚠️  Failed to fetch ${label}: ${error.message}`);
    return [];
  }
}

function renderPage({ title, description, baseUrl, body, activePage }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="icon" type="image/svg+xml" href="${baseUrl}favicon.svg">
  <link rel="stylesheet" href="${baseUrl}assets/styles.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
</head>
<body>
  ${renderNav(baseUrl, activePage)}
  <main class="content" id="main-content">
    ${body}
  </main>
  ${renderFooter(baseUrl)}
  <script src="${baseUrl}assets/app.js" defer></script>
</body>
</html>`;
}

function renderNav(baseUrl, activePage) {
  const navItems = [
    { key: 'home', label: 'Overview', href: baseUrl },
    { key: 'events', label: 'Events', href: resolveLink(baseUrl, 'pages/events.html') },
    { key: 'download', label: 'Download', href: resolveLink(baseUrl, 'pages/download.html') },
    { key: 'search', label: 'Search', href: resolveLink(baseUrl, 'pages/search.html') },
    { key: 'account', label: 'Account', href: resolveLink(baseUrl, 'pages/account.html') }
  ];

  const links = navItems.map((item) => {
    const isActive = item.key === activePage;
    const activeAttr = isActive ? ' aria-current="page"' : '';
    const activeClass = isActive ? ' is-active' : '';
    return `<a class="nav-link${activeClass}" href="${item.href}"${activeAttr}>${escapeHtml(item.label)}</a>`;
  }).join('');

  return `<header class="site-header">
  <div class="brand">
    <span class="brand-icon">🚀</span>
    <div class="brand-copy">
      <span class="brand-title">Kusher Space</span>
      <span class="brand-tag">Static Control Deck</span>
    </div>
  </div>
  <nav class="site-nav" data-nav-links>
    ${links}
  </nav>
  <button class="nav-toggle" aria-expanded="false" aria-label="Toggle navigation" data-nav-toggle>☰</button>
</header>`;
}

function renderFooter(baseUrl) {
  const year = new Date().getFullYear();
  const socials = [
    { label: 'Discord', href: 'https://discord.gg/kusher', icon: 'discord' },
    { label: 'YouTube', href: 'https://www.youtube.com/@kusherspace', icon: 'youtube' },
    { label: 'X', href: 'https://x.com/kusherspace', icon: 'x' },
    { label: 'Twitch', href: 'https://twitch.tv/kusherspace', icon: 'twitch' }
  ];

  const socialIcons = socials.map(({ label, href, icon }) => {
    return `<li><a class="social-link" href="${href}" target="_blank" rel="noopener" aria-label="${escapeHtml(label)}">${renderSocialIcon(icon)}</a></li>`;
  }).join('');

  return `<footer class="site-footer">
  <div class="footer-text">
    <p class="footer-heading">&copy; ${year} Kusher Space</p>
    <p class="footer-copy">Bright signals across the static frontier. Stay linked for events, deployments, and alliance calls.</p>
    <div class="footer-links">
      <a href="/api/status">API Status</a>
      <span class="separator" role="presentation"></span>
      <a href="/api/docs">API Docs</a>
      <span class="separator" role="presentation"></span>
      <a href="mailto:support@kusher.space">Contact Support</a>
    </div>
  </div>
  <ul class="footer-social">
    ${socialIcons}
  </ul>
</footer>`;
}

function renderSocialIcon(name) {
  switch (name) {
    case 'discord':
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.3 4.37a16 16 0 0 0-4.13-1.33.27.27 0 0 0-.28.14c-.18.33-.38.77-.52 1.11a15.05 15.05 0 0 0-4.81 0 8.74 8.74 0 0 0-.54-1.14.26.26 0 0 0-.28-.14 15.96 15.96 0 0 0-4.13 1.33.24.24 0 0 0-.12.1C2.53 9.14 1.8 13.8 2.13 18.39a.27.27 0 0 0 .1.18 16.26 16.26 0 0 0 4.94 2.5.27.27 0 0 0 .3-.1c.38-.52.72-1.08 1.02-1.66a.27.27 0 0 0-.15-.37 10.78 10.78 0 0 1-1.55-.71.27.27 0 0 1-.03-.46l.12-.09a11.9 11.9 0 0 0 10.52 0l.12.09a.27.27 0 0 1-.03.46c-.5.29-1.02.53-1.56.72a.27.27 0 0 0-.15.37 10.73 10.73 0 0 0 1.02 1.65.27.27 0 0 0 .3.11 16.2 16.2 0 0 0 4.95-2.52.27.27 0 0 0 .1-.18c.41-5.12-.68-9.74-2.98-13.93a.24.24 0 0 0-.12-.1ZM8.93 15.38c-1.03 0-1.87-.95-1.87-2.11s.83-2.12 1.87-2.12c1.05 0 1.88.96 1.87 2.12 0 1.16-.83 2.11-1.87 2.11Zm6.17 0c-1.03 0-1.87-.95-1.87-2.11s.83-2.12 1.87-2.12c1.05 0 1.88.96 1.87 2.12 0 1.16-.82 2.11-1.87 2.11Z"/></svg>`;
    case 'youtube':
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.6 7.2a2.75 2.75 0 0 0-1.94-1.94C17.9 5 12 5 12 5s-5.9 0-7.66.26A2.75 2.75 0 0 0 2.4 7.2 28.4 28.4 0 0 0 2 12a28.4 28.4 0 0 0 .4 4.8 2.75 2.75 0 0 0 1.94 1.94C6.1 19 12 19 12 19s5.9 0 7.66-.26a2.75 2.75 0 0 0 1.94-1.94c.27-1.78.4-3.58.4-4.8a28.4 28.4 0 0 0-.4-4.8Zm-11.7 7.75V9.05l5.2 2.95-5.2 2.95Z"/></svg>`;
    case 'x':
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.7 4.5h-3a.3.3 0 0 0-.2.09l-3.57 3.92-3.66-3.98a.3.3 0 0 0-.21-.09h-4.9a.3.3 0 0 0-.22.5l6.1 6.62-6 6.84a.3.3 0 0 0 .23.5h3a.3.3 0 0 0 .21-.09l3.85-4.35 4.02 4.4a.3.3 0 0 0 .22.1h4.7a.3.3 0 0 0 .23-.5l-6.2-6.78 6.07-6.68a.3.3 0 0 0-.22-.5Z"/></svg>`;
    case 'twitch':
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 3.5 3.1 6.9v11.7h4.4V21h2.8l2.8-2.4h4.1L21 14.3V3.5H4Zm15 10.1-2.4 2h-4.6l-2.8 2.4v-2.4H5.5V5.4H19v8.2ZM16.2 7.7h1.8v4.4h-1.8V7.7Zm-4.6 0h1.8v4.4h-1.8V7.7Z"/></svg>`;
    default:
      return '';
  }
}

      return `<article class="card event-card">
  const highlight = siteData.events[0];
  const latestRelease = siteData.releases[0];
  const heroAllianceHighlights = siteData.alliances.slice(0, 1).map(renderAllianceChip).join('');
  const alliancesPreview = siteData.alliances.slice(0, 4).map(renderAllianceChip).join('');
  const heroImage = heroImages[0] ? resolveLink(baseUrl, `assets/images/${heroImages[0]}`) : `${baseUrl}assets/placeholder-hero.svg`;

  return `
<section class="panel hero-panel">
  <div class="hero-copy">
    <p class="eyebrow">Galactic Broadcast</p>
    <h1>Static command over the Kusher frontier</h1>
    <p class="lead">Dive into luminous deployments, alliance intelligence, and crystalline download paths delivered straight from the backend.</p>
    <div class="btn-group">
      <a class="btn is-active" href="${resolveLink(baseUrl, 'pages/events.html')}">Mission Schedule</a>
      <a class="btn" href="${resolveLink(baseUrl, 'pages/download.html')}">Download Hub</a>
      <a class="btn" href="${resolveLink(baseUrl, 'pages/search.html')}">API Search</a>
    </div>
    <dl class="stacked-metrics">
      <div>
        <dt>Featured Alliances</dt>
        <dd>${siteData.alliances.length || '0'} active</dd>
      </div>
      <div>
        <dt>Upcoming Events</dt>
        <dd>${siteData.events.length || '0'} listed</dd>
      </div>
      <div>
        <dt>Latest Build</dt>
        <dd>${latestRelease ? escapeHtml(latestRelease.version) : 'TBA'}</dd>
      </div>
    </dl>
  </div>
  <div class="hero-visual">
    <picture>
      <source media="(min-width: 720px)" srcset="${heroImage}">
      <img src="${heroImage}" alt="Kusher mission artwork" loading="lazy">
    </picture>
    <div class="hero-caption">
      ${heroAllianceHighlights || '<span>No alliances broadcasting visuals yet.</span>'}
    </div>
  </div>
</section>

<section class="panel">
  <div class="panel-heading">
    <h2>Next launch window</h2>
    <a class="panel-link" href="${resolveLink(baseUrl, 'pages/events.html')}">Full manifest</a>
  </div>
  ${highlight ? renderHighlightEvent(highlight) : renderEmptyState('No upcoming events announced yet. Watch this orbit for updates.')} 
</section>

<section class="panel">
  <div class="panel-heading">
    <h2>Alliance pulses</h2>
    <span class="panel-sub">Signals from the strongest crews online.</span>
  </div>
  <div class="chip-grid">
    ${alliancesPreview || renderEmptyState('Alliances are calibrating. New signals will appear soon.')}
  </div>
</section>

<section class="panel">
  <div class="panel-heading">
    <h2>Download status</h2>
    <a class="panel-link" href="${resolveLink(baseUrl, 'pages/download.html')}">Release notes</a>
  </div>
  ${latestRelease ? renderReleaseHighlight(latestRelease) : renderEmptyState('No published builds yet. Come back after the next deployment cycle.')}
</section>

<section class="panel info-slab">
  <h2>Static transition complete</h2>
  <p>The legacy SPA has been retired in favor of a static constellation powered by live backend data. Keep forging ahead—your APIs, Android app, and alliances stay intact.</p>
  <div class="btn-group">
    <a class="btn" href="${resolveLink(baseUrl, 'pages/account.html')}#support">Request Support</a>
    <a class="btn" href="/api/docs">API Docs</a>
  </div>
</section>`;
}

function renderHighlightEvent(event) {
  return `<article class="spotlight-card" role="article">
    <header class="spotlight-header">
      <span class="spotlight-tag">Upcoming highlight</span>
      <h3>${escapeHtml(event.title)}</h3>
    </header>
    <p class="spotlight-body">${escapeHtml(truncate(event.description, 260))}</p>
    <dl class="metric-row">
      <div><dt>Date</dt><dd>${formatDate(event.eventDate)}</dd></div>
      <div><dt>Time</dt><dd>${formatTime(event.eventTime)}</dd></div>
      <div><dt>Type</dt><dd>${escapeHtml(event.type)}</dd></div>
      <div><dt>Host</dt><dd>${escapeHtml(event.createdBy)}</dd></div>
    </dl>
    <footer class="spotlight-footer">
      <span class="badge">${event.attendingCount} attending</span>
      <span class="badge subtle">${event.interestedCount} interested</span>
      ${event.registrationRequired ? '<span class="badge warn">Registration required</span>' : ''}
    </footer>
  </article>`;
}

function renderAllianceChip(alliance) {
  return `<article class="alliance-chip">
    <div class="chip-core">
      <span class="chip-title">${escapeHtml(alliance.name)}</span>
      ${alliance.tag ? `<span class="chip-tag">${escapeHtml(alliance.tag)}</span>` : ''}
    </div>
    <p>${escapeHtml(truncate(alliance.description || 'Alliance description forthcoming.', 120))}</p>
    <dl>
      <div><dt>Leader</dt><dd>${escapeHtml(alliance.leader)}</dd></div>
      <div><dt>Level</dt><dd>${alliance.level || 1}</dd></div>
    </dl>
  </article>`;
}

function renderSubpageHero({ eyebrow, title, description, actions = [], metrics = [], heroImage }) {
  const actionMarkup = actions.length
    ? `<div class="btn-group">${actions.map((action, index) => renderHeroAction(action, index)).join('')}</div>`
    : '';

  const metricsMarkup = metrics.length
    ? `<dl class="stacked-metrics">${metrics.map((metric) => {
        const label = metric && metric.label ? escapeHtml(metric.label) : '';
        const value = metric && metric.value !== undefined && metric.value !== null ? escapeHtml(String(metric.value)) : '';
        return `<div><dt>${label}</dt><dd>${value}</dd></div>`;
      }).join('')}</dl>`
    : '';

  const classes = ['panel', 'sub-hero-panel'];
  if (!heroImage) {
    classes.push('single');
  }

  const visualMarkup = heroImage
    ? `<div class="hero-visual sub-hero-visual">
    <picture>
      <source media="(min-width: 720px)" srcset="${heroImage}">
      <img src="${heroImage}" alt="" loading="lazy">
    </picture>
  </div>`
    : '';

  return `
<section class="${classes.join(' ')}">
  <div class="hero-copy">
    ${eyebrow ? `<p class="eyebrow">${escapeHtml(eyebrow)}</p>` : ''}
    <h1>${escapeHtml(title)}</h1>
    <p class="lead">${escapeHtml(description)}</p>
    ${actionMarkup}
    ${metricsMarkup}
  </div>
  ${visualMarkup}
</section>`;
}

function renderHeroAction(action, index) {
  if (!action || !action.href || !action.label) {
    return '';
  }

  const classes = ['btn'];
  if (action.variant === 'ghost') {
    classes.push('ghost');
  } else if (action.variant === 'primary' || index === 0) {
    classes.push('is-active');
  }

  const isMailto = action.href.startsWith('mailto:');
  const target = action.external && !isMailto ? ' target="_blank" rel="noopener"' : '';

  return `<a class="${classes.join(' ')}" href="${action.href}"${target}>${escapeHtml(action.label)}</a>`;
}

function renderEventsPage(events, alliances, baseUrl, heroImage) {
  const metrics = [
    { label: 'Upcoming events', value: events.length ? String(events.length) : '0' },
    { label: 'Active alliances', value: alliances.length ? String(alliances.length) : '0' },
    { label: 'Next host', value: events.length ? events[0].createdBy : 'TBA' }
  ];

  const hero = renderSubpageHero({
    eyebrow: 'Operations',
    title: 'Mission schedule',
    description: 'Track confirmed deployments, tournaments, and alliance broadcasts without leaving static mode.',
    actions: [
      { label: 'API events feed', href: '/api/events' },
      { label: 'Download hub', href: resolveLink(baseUrl, 'pages/download.html'), variant: 'ghost' },
      { label: 'Back to overview', href: baseUrl, variant: 'ghost' }
    ],
    metrics,
    heroImage
  });

  const eventCards = events.length
    ? events.map(renderEventCard).join('')
    : renderEmptyState('No upcoming events. Check back soon for mission updates.');

  const allianceCards = alliances.length
    ? alliances.slice(0, 6).map(renderAllianceCard).join('')
    : renderEmptyState('Alliances are calibrating their beacons. New squads will surface soon.');

  return `
${hero}
<section class="panel">
  <div class="panel-heading">
    <h2>Upcoming deployments</h2>
    <p class="panel-sub">A forward log of confirmed deployments, tournaments, and community flights.</p>
  </div>
  <div class="card-grid">
    ${eventCards}
  </div>
</section>

<section class="panel">
  <div class="panel-heading">
    <h2>Alliance uplinks</h2>
    <p class="panel-sub">Active crews broadcasting open recruitment and achievements.</p>
  </div>
  <div class="card-grid alliance-grid">
    ${allianceCards}
  </div>
</section>`;
}
function renderEventCard(event) {
  return `<article class="card event-card">
    <header>
      <span class="badge inline">${escapeHtml(event.type)}</span>
      <h2>${escapeHtml(event.title)}</h2>
    </header>
    <p>${escapeHtml(truncate(event.description, 320))}</p>
    <dl class="metric-row">
      <div><dt>Date</dt><dd>${formatDate(event.eventDate)}</dd></div>
      <div><dt>Time</dt><dd>${formatTime(event.eventTime)}</dd></div>
      <div><dt>Host</dt><dd>${escapeHtml(event.createdBy)}</dd></div>
      <div><dt>RSVP</dt><dd>${event.attendingCount} attending · ${event.interestedCount} interested</dd></div>
    </dl>
    ${event.prizePool ? `<p class="note">Prize Pool: ${escapeHtml(event.prizePool)}</p>` : ''}
    <footer class="card-footer">
      ${event.registrationRequired ? '<span class="badge warn">Registration required</span>' : '<span class="badge subtle">Open access</span>'}
      ${event.maxParticipants ? `<span class="badge subtle">${event.currentParticipants || 0}/${event.maxParticipants} slots</span>` : ''}
    </footer>
  </article>`;
}

function renderAllianceCard(alliance) {
  return `<article class="card alliance-card">
    <header>
      <span class="badge inline">${escapeHtml(alliance.type || 'mixed')}</span>
      <h2>${escapeHtml(alliance.name)}${alliance.tag ? ` <span class="tag">[${escapeHtml(alliance.tag)}]</span>` : ''}</h2>
    </header>
    <p>${escapeHtml(truncate(alliance.description || 'Alliance description pending.', 240))}</p>
    <dl class="metric-row">
      <div><dt>Leader</dt><dd>${escapeHtml(alliance.leader)}</dd></div>
      <div><dt>Focus</dt><dd>${escapeHtml(alliance.focus || 'Community')}</dd></div>
      <div><dt>Level</dt><dd>${alliance.level || 1}</dd></div>
      <div><dt>Max Crew</dt><dd>${alliance.maxMembers ? `${alliance.maxMembers}` : 'Unlimited'}</dd></div>
      <div><dt>Membership</dt><dd>${escapeHtml(alliance.membershipType || 'approval')}</dd></div>
    </dl>
  </article>`;
}

function renderDownloadsPage(releases, baseUrl, heroImage) {
  const hasReleases = Boolean(releases.length);
  const latest = hasReleases ? releases[0] : null;
  const totalDownloads = releases.reduce((sum, release) => sum + (release.downloadCount || 0), 0);

  const metrics = [
    { label: 'Published builds', value: hasReleases ? String(releases.length) : '0' },
    { label: 'Latest version', value: latest ? latest.version : 'Pending' },
    { label: 'Total downloads', value: totalDownloads ? String(totalDownloads) : '0' }
  ];

  const hero = renderSubpageHero({
    eyebrow: 'Android pipeline',
    title: 'Download hub',
    description: 'Secure Android builds directly from the backend deployment channel.',
    actions: [
      latest ? { label: 'Download latest APK', href: `/api/game/download/${latest.id}` } : null,
      { label: 'API changelog', href: '/api/docs', variant: 'ghost' },
      { label: 'Back to overview', href: baseUrl, variant: 'ghost' }
    ].filter(Boolean),
    metrics,
    heroImage
  });

  const highlight = hasReleases
    ? `<article class="spotlight-card download-spotlight">
    <header class="spotlight-header">
      <span class="spotlight-tag">Latest build</span>
      <h3>${escapeHtml(latest.version)}${latest.isBeta ? ' <span class="badge warn">Beta</span>' : ''}</h3>
    </header>
    <p class="spotlight-body">${escapeHtml(truncate(latest.releaseNotes || 'See changelog for details.', 220))}</p>
    <dl class="metric-row">
      <div><dt>Version code</dt><dd>${latest.versionCode}</dd></div>
      <div><dt>File size</dt><dd>${latest.fileSize || 'n/a'}</dd></div>
      <div><dt>Checksums</dt><dd>${escapeHtml(latest.md5 || 'pending')}</dd></div>
      <div><dt>Downloads</dt><dd>${latest.downloadCount || 0}</dd></div>
    </dl>
    <div class="btn-group">
      <a class="btn is-active" href="/api/game/download/${latest.id}">Download APK</a>
      <a class="btn" href="#release-history">Full history</a>
    </div>
  </article>`
    : renderEmptyState('No downloadable builds published yet.');

  const history = hasReleases ? releases.map((release) => renderReleaseRow(release)).join('') : '';

  const historySection = hasReleases
    ? `
<section class="panel" id="release-history">
  <div class="panel-heading">
    <h2>Release history</h2>
    <p class="panel-sub">Expand notes for every historical build.</p>
  </div>
  <div class="release-table">
    ${history}
  </div>
</section>`
    : '';

  return `
${hero}
<section class="panel">
  <div class="panel-heading">
    <h2>Latest build</h2>
    <p class="panel-sub">Secure Android builds directly from the backend deployment channel.</p>
  </div>
  ${highlight}
</section>
${historySection}`;
}

function renderSitemap(baseUrl) {
  const urls = ['', 'pages/events.html', 'pages/download.html', 'pages/search.html', 'pages/account.html'];
  const locs = urls.map((segment) => {
    const loc = resolveLink(baseUrl, segment);
    return `  <url><loc>${escapeXml(loc)}</loc></url>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${locs}
</urlset>`;
}

function renderEmptyState(message) {
  return `<div class="empty-state">
  <p>${escapeHtml(message)}</p>
</div>`;
}

function renderReleaseHighlight(release) {
  return `<article class="spotlight-card download-spotlight">
    <header class="spotlight-header">
      <span class="spotlight-tag">Latest version</span>
      <h3>${escapeHtml(release.version)}</h3>
    </header>
    <p class="spotlight-body">${escapeHtml(truncate(release.releaseNotes || 'No release notes provided.', 260))}</p>
    <dl class="metric-row">
      <div><dt>Version code</dt><dd>${release.versionCode}</dd></div>
      <div><dt>Downloads</dt><dd>${release.downloadCount || 0}</dd></div>
      <div><dt>File size</dt><dd>${release.fileSize || 'n/a'}</dd></div>
    </dl>
    <div class="btn-group">
      <a class="btn is-active" href="/api/game/download/${release.id}">Download APK</a>
      <a class="btn" href="/api/docs">Changelog API</a>
    </div>
  </article>`;
}

function renderMarkdownish(text) {
  if (!text) return '';
  const escaped = escapeHtml(text);
  return escaped
    .replace(/^# (.*)$/gm, '<strong>$1</strong>')
    .replace(/^## (.*)$/gm, '<strong>$1</strong>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

function formatDate(value) {
  if (!value) return 'TBA';
  const date = new Date(value);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatTime(value) {
  if (!value) return 'All day';
  return value.substring(0, 5);
}

function truncate(text, length) {
  if (!text) return '';
  return text.length > length ? text.substring(0, length - 3) + '...' : text;
}

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeXml(value) {
  return escapeHtml(value);
}

function resolveLink(baseUrl, target) {
  if (!target) {
    return baseUrl;
  }
  const lower = target.toLowerCase();
  if (lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('mailto:')) {
    return target;
  }
  if (target.startsWith('/')) {
    return target;
  }
  return baseUrl + target;
}

function log(message) {
  console.log(`🧱 ${message}`);
}

const STYLESHEET = `:root {
  color-scheme: dark light;
  --light-bg: #FFFFFF;
  --dark-bg: #000000;
  --purple: #8F00FF;
  --purple-faded: rgba(143, 0, 255, 0.65);
  --green: #7FFF00;
  --green-faded: rgba(127, 255, 0, 0.65);
  --surface: rgba(15, 15, 25, 0.92);
  --surface-alt: rgba(28, 28, 40, 0.85);
  --text-strong: #F4F8FF;
  --text-body: #D8DCEA;
  --text-muted: rgba(216, 220, 234, 0.74);
  --separator: rgba(255, 255, 255, 0.18);
  --shadow: rgba(143, 0, 255, 0.35);
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background: radial-gradient(circle at top left, var(--purple-faded) 0%, rgba(0, 0, 0, 0) 45%),
    radial-gradient(circle at bottom right, rgba(127, 255, 0, 0.25) 0%, rgba(0, 0, 0, 0) 55%),
    linear-gradient(160deg, #090910 0%, #040406 45%, #0c0c16 100%);
  color: var(--text-body);
}

a {
  color: inherit;
  text-decoration: none;
}

.site-header {
  position: fixed;
  top: 4vh;
  left: 0;
  width: 92vw;
  height: 12vh;
  margin-right: 8vw;
  padding: 0 3vw;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--surface);
  border-radius: 0 2.5rem 2.5rem 0;
  border: 1px solid var(--green-faded);
  box-shadow: 0 24px 60px var(--shadow);
  backdrop-filter: blur(22px);
  z-index: 40;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.brand-icon {
  display: grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  border-radius: 1rem;
  background: linear-gradient(140deg, var(--purple), var(--green));
  color: var(--light-bg);
  font-size: 1.4rem;
}

.brand-copy {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.brand-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-strong);
}

.brand-tag {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--green-faded);
}

.site-nav {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1.35rem;
  border-radius: 999px;
  border: 1px solid var(--green);
  background: var(--green);
  color: var(--dark-bg);
  font-weight: 600;
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.nav-link:hover {
  transform: scale(0.9);
  background: var(--purple);
  border-color: var(--purple);
  color: var(--light-bg);
}

.nav-link.is-active {
  background: var(--purple);
  border-color: var(--purple);
  color: var(--light-bg);
}

.nav-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.9rem;
  border: 1px solid var(--green-faded);
  background: var(--surface-alt);
  color: var(--text-strong);
  font-size: 1.2rem;
}

.content {
  width: 84vw;
  margin-left: 8vw;
  margin-top: calc(12vh + 8vh);
  margin-bottom: 14vh;
  display: flex;
  flex-direction: column;
  gap: 6vh;
}

.panel {
  padding: 2.5rem 3rem;
  background: var(--surface);
  border-radius: 1.75rem;
  border: 1px solid var(--separator);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.panel-body {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  color: var(--text-body);
}

.panel-heading {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-bottom: 1px solid var(--separator);
  padding-bottom: 1.25rem;
}

.panel-heading h1,
.panel-heading h2 {
  margin: 0;
  color: var(--text-strong);
}

.panel-sub {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.panel-link {
  align-self: flex-start;
  color: var(--green);
  font-weight: 600;
}

.hero-panel {
  display: grid;
  gap: 3rem;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr);
}

.sub-hero-panel {
  display: grid;
  gap: 2.5rem;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  align-items: center;
  background: linear-gradient(140deg, rgba(143, 0, 255, 0.18), rgba(15, 15, 25, 0.92));
}

.sub-hero-panel.single {
  grid-template-columns: 1fr;
}

.sub-hero-panel .hero-copy h1 {
  margin: 0 0 0.6rem;
  font-size: clamp(2.2rem, 3.8vw, 3rem);
  color: var(--text-strong);
}

.sub-hero-panel .hero-copy .lead {
  max-width: 52ch;
}

.sub-hero-panel .btn-group {
  margin-top: 1.25rem;
}

.sub-hero-visual img {
  border-radius: 1.8rem;
  box-shadow: 0 22px 48px rgba(0, 0, 0, 0.35);
  width: 100%;
  object-fit: cover;
  aspect-ratio: 16 / 9;
}

.hero-copy h1 {
  margin: 0 0 0.5rem;
  font-size: clamp(2.4rem, 4vw, 3.2rem);
  color: var(--text-strong);
}

.hero-copy .lead {
  font-size: 1.05rem;
  color: var(--text-muted);
}

.eyebrow {
  display: inline-flex;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  background: var(--purple-faded);
  color: var(--light-bg);
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.btn-group {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.6rem 1.5rem;
  border-radius: 999px;
  border: 1px solid var(--green);
  background: var(--green);
  color: var(--dark-bg);
  font-weight: 600;
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.btn:hover {
  transform: scale(0.9);
  background: var(--purple);
  border-color: var(--purple);
  color: var(--light-bg);
}

.btn.is-active {
  background: var(--purple);
  border-color: var(--purple);
  color: var(--light-bg);
}

.btn.ghost {
  background: transparent;
  border-color: var(--purple-faded);
  color: var(--text-strong);
}

.stacked-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
}

.stacked-metrics dt {
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.stacked-metrics dd {
  margin: 0.2rem 0 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-strong);
}

.hero-visual {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.hero-visual img {
  width: 100%;
  border-radius: 2rem;
  object-fit: cover;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
}

.hero-caption {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.chip-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}

.alliance-chip {
  padding: 1.5rem;
  border-radius: 1.25rem;
  background: var(--surface-alt);
  border: 1px solid var(--separator);
}

.alliance-chip .chip-core {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.chip-title {
  color: var(--text-strong);
  font-weight: 600;
}

.chip-tag {
  padding: 0.1rem 0.5rem;
  border-radius: 0.75rem;
  background: var(--purple-faded);
  color: var(--light-bg);
  font-size: 0.7rem;
  text-transform: uppercase;
}

.tag {
  font-size: 0.75rem;
  color: var(--green);
}

.alliance-chip dl,
.metric-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
  margin: 1rem 0 0;
}

.alliance-chip dt,
.metric-row dt {
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.alliance-chip dd,
.metric-row dd {
  margin: 0.25rem 0 0;
  font-weight: 600;
  color: var(--text-strong);
}

.spotlight-card {
  padding: 2rem;
  border-radius: 1.5rem;
  background: var(--surface-alt);
  border: 1px solid var(--separator);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.spotlight-header {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.spotlight-header h3 {
  margin: 0;
  color: var(--text-strong);
}

.spotlight-tag {
  align-self: flex-start;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  background: var(--purple-faded);
  color: var(--light-bg);
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.spotlight-body {
  color: var(--text-body);
  margin: 0;
}

.spotlight-footer {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
}

.alliance-grid {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.card {
  padding: 1.9rem;
  border-radius: 1.4rem;
  background: var(--surface-alt);
  border: 1px solid var(--separator);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card header h2,
.card header h3 {
  margin: 0;
  color: var(--text-strong);
}

.card p {
  margin: 0;
  color: var(--text-body);
}

.card-footer {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background: var(--purple-faded);
  color: var(--light-bg);
  font-size: 0.75rem;
  font-weight: 600;
}

.badge.inline {
  background: var(--green);
  color: var(--dark-bg);
}

.badge.subtle {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-muted);
}

.badge.warn {
  background: rgba(255, 105, 97, 0.25);
  color: #ffb3ad;
}

.note {
  color: var(--text-muted);
  font-size: 0.85rem;
  border-left: 2px solid var(--purple-faded);
  padding-left: 0.75rem;
}

.release-table {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.release-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1.25rem;
  padding: 1.5rem;
  border-radius: 1.25rem;
  background: var(--surface-alt);
  border: 1px solid var(--separator);
}

.release-meta h3 {
  margin: 0 0 0.4rem;
  color: var(--text-strong);
}

.release-meta p {
  margin: 0;
  color: var(--text-muted);
}

.release-actions {
  display: flex;
  gap: 0.25rem;
  align-items: flex-start;
}

.release-notes {
  grid-column: 1 / -1;
  display: none;
  margin-top: 0.5rem;
  padding: 1.25rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-body);
}

.release-notes.open {
  display: block;
}

.code-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

pre {
  margin: 0;
  padding: 0.85rem 1.1rem;
  border-radius: 1rem;
  background: rgba(0, 0, 0, 0.45);
  color: var(--light-bg);
  font-family: 'DM Mono', 'Fira Code', monospace;
  font-size: 0.9rem;
}

code {
  font-family: inherit;
  color: var(--green);
}

.tip-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 1.1rem;
}

.tip-list li {
  display: grid;
  gap: 0.35rem;
  border-left: 3px solid var(--purple);
  padding-left: 1rem;
}

.tip-list li span {
  font-weight: 600;
  color: var(--text-strong);
}

.support-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

.bullets {
  margin: 0;
  padding-left: 1.2rem;
  color: var(--text-body);
}

.bullets li {
  margin: 0.35rem 0;
}

.empty-state {
  padding: 2.25rem;
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-muted);
  text-align: center;
}

.info-slab {
  background: linear-gradient(135deg, var(--purple-faded), var(--surface));
}

.site-footer {
  width: 92vw;
  min-height: 8vh;
  margin: 8vh 0 4vh;
  margin-left: 8vw;
  padding: 2rem 3rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  background: var(--surface);
  border-radius: 2.5rem 0 0 2.5rem;
  border: 1px solid var(--separator);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.35);
}

.footer-text {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.footer-heading {
  margin: 0;
  color: var(--text-strong);
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.footer-copy {
  margin: 0;
  color: var(--text-muted);
}

.footer-links {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  color: var(--green);
}

.separator {
  width: 1px;
  height: 1rem;
  background: var(--separator);
}

.footer-social {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: 0.5rem;
}

.social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 999px;
  background: var(--surface-alt);
  border: 1px solid var(--separator);
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.social-link svg {
  width: 1.35rem;
  height: 1.35rem;
  fill: var(--text-strong);
}

.social-link:hover {
  transform: scale(0.9);
  background: var(--purple);
  border-color: var(--purple);
}

@media (min-width: 720px) {
  .hero-visual img {
    aspect-ratio: 16 / 9;
  }
}

@media (max-width: 719px) {
  .site-header {
    width: 94vw;
    margin-right: 6vw;
    padding: 0 6vw;
  }
  .hero-panel {
    grid-template-columns: 1fr;
  }
  .sub-hero-panel {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  .hero-visual img {
    aspect-ratio: 1 / 1;
  }
  .sub-hero-visual img {
    aspect-ratio: 1 / 1;
  }
}

@media (max-width: 960px) {
  .content {
    width: 92vw;
    margin-left: 4vw;
  }
  .sub-hero-panel {
    grid-template-columns: 1fr;
  }
  .site-footer {
    width: 94vw;
    margin-left: 4vw;
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 820px) {
  .site-header {
    height: auto;
    padding: 1.25rem 6vw;
    border-radius: 0 0 1.5rem 1.5rem;
  }
  .site-nav {
    display: none;
    position: absolute;
    top: 100%;
    right: 6vw;
    margin-top: 1rem;
    padding: 1rem;
    flex-direction: column;
    background: var(--surface);
    border-radius: 1.25rem;
    border: 1px solid var(--separator);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
  }
  .site-nav.open {
    display: flex;
  }
  .nav-toggle {
    display: inline-flex;
  }
}
`;

const APP_SCRIPT = `document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.querySelector('[data-nav-toggle]');
  const navLinks = document.querySelector('[data-nav-links]');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  document.querySelectorAll('[data-toggle-note]').forEach((button) => {
    const targetId = button.getAttribute('data-toggle-note');
    const panel = document.getElementById(targetId);
    if (!panel) return;
    button.addEventListener('click', () => {
      const isOpen = panel.classList.toggle('open');
      button.classList.toggle('is-active', isOpen);
      button.textContent = isOpen ? 'Hide notes' : 'View notes';
    });
  });
});
`;

const PLACEHOLDER_HERO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450">
  <defs>
    <radialGradient id="bg" cx="50%" cy="45%" r="75%">
      <stop offset="0%" stop-color="#8F00FF" stop-opacity="0.75" />
      <stop offset="60%" stop-color="#280046" stop-opacity="0.55" />
      <stop offset="100%" stop-color="#080010" stop-opacity="1" />
    </radialGradient>
    <linearGradient id="beam" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7FFF00" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#8F00FF" stop-opacity="0.4" />
    </linearGradient>
  </defs>
  <rect width="800" height="450" fill="url(#bg)" />
  <ellipse cx="400" cy="360" rx="280" ry="90" fill="rgba(0,0,0,0.55)" />
  <path d="M160 300 Q400 120 640 300" fill="none" stroke="url(#beam)" stroke-width="18" stroke-linecap="round" />
  <circle cx="400" cy="220" r="110" fill="none" stroke="#7FFF00" stroke-width="6" stroke-opacity="0.45" />
  <circle cx="400" cy="220" r="70" fill="none" stroke="#8F00FF" stroke-width="4" stroke-opacity="0.55" />
  <circle cx="400" cy="220" r="12" fill="#7FFF00" />
  <text x="50%" y="78%" text-anchor="middle" fill="#D8DCEA" font-family="Inter, sans-serif" font-size="28" opacity="0.75">Kusher Space Static Signal</text>
</svg>`;

const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6c5ce7" />
      <stop offset="100%" stop-color="#8c7bff" />
    </linearGradient>
  </defs>
  <circle cx="32" cy="32" r="30" fill="url(#g)" />
  <path d="M18 40 L30 20 L40 32 L46 22" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="46" cy="22" r="4" fill="#fff" />
</svg>`;

main().catch((error) => {
  console.error('❌ Static site generation failed:', error);
  db.sequelize.close().catch(() => {});
  process.exit(1);
});
