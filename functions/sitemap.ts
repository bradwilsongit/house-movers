import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const baseUrl = 'https://housemovers.base44.app';
    const today = new Date().toISOString().split('T')[0];

    // Fetch all published location pages
    const locationPages = await base44.asServiceRole.entities.LocationPage.list();

    const staticPages = [
      { path: '/', priority: '1.0', changefreq: 'weekly' },
      { path: '/CreateMove', priority: '0.9', changefreq: 'monthly' },
      { path: '/SupplierOnboarding', priority: '0.8', changefreq: 'monthly' },
      { path: '/Support', priority: '0.6', changefreq: 'monthly' },
      { path: '/Terms', priority: '0.3', changefreq: 'yearly' },
      { path: '/Privacy', priority: '0.3', changefreq: 'yearly' },
    ];

    const staticUrls = staticPages.map(p => `  <url>
    <loc>${baseUrl}${p.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n');

    const locationUrls = locationPages
      .filter(lp => lp.is_published && lp.slug)
      .map(lp => `  <url>
    <loc>${baseUrl}/location/${lp.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${locationUrls}
</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    return new Response(`Error generating sitemap: ${error.message}`, { status: 500 });
  }
});