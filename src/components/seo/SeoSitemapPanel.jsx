import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Copy, CheckCheck, RefreshCw } from 'lucide-react';

const ALL_PAGES = [
  { page_name: 'Home', path: '/', default_priority: 1.0, default_changefreq: 'weekly' },
  { page_name: 'CreateMove', path: '/CreateMove', default_priority: 0.9, default_changefreq: 'monthly' },
  { page_name: 'SupplierOnboarding', path: '/SupplierOnboarding', default_priority: 0.8, default_changefreq: 'monthly' },
  { page_name: 'MyMoves', path: '/MyMoves', default_priority: 0.5, default_changefreq: 'daily' },
  { page_name: 'Support', path: '/Support', default_priority: 0.6, default_changefreq: 'monthly' },
  { page_name: 'Terms', path: '/Terms', default_priority: 0.3, default_changefreq: 'yearly' },
  { page_name: 'Privacy', path: '/Privacy', default_priority: 0.3, default_changefreq: 'yearly' },
];

function generateSitemap(pages, seoMap, baseUrl, locationPages = []) {
  const today = new Date().toISOString().split('T')[0];

  const staticUrls = pages
    .filter(p => {
      const seo = seoMap[p.page_name];
      return seo ? seo.include_in_sitemap !== false : true;
    })
    .map(p => {
      const seo = seoMap[p.page_name];
      const priority = seo?.sitemap_priority ?? p.default_priority;
      const changefreq = seo?.sitemap_changefreq ?? p.default_changefreq;
      return `  <url>
    <loc>${baseUrl}${p.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`;
    });

  const locationUrls = locationPages
    .filter(lp => lp.is_published)
    .map(lp => `  <url>
    <loc>${baseUrl}/location/${lp.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`);

  const allUrls = [...staticUrls, ...locationUrls].join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls}
</urlset>`;
}

function generateRobotsTxt(sitemapUrl, custom) {
  if (custom) return custom;
  return `User-agent: *
Allow: /
Disallow: /AdminDashboard
Disallow: /AdminBookings
Disallow: /AdminSuppliers
Disallow: /AdminExtras
Disallow: /AdminSupport
Disallow: /AdminCommission
Disallow: /AdminPayFast
Disallow: /Branding
Disallow: /Profile
Disallow: /Settings
Disallow: /Payment
Disallow: /PaymentReturn
Disallow: /PaymentCancelled

Sitemap: ${sitemapUrl}`;
}

export default function SeoSitemapPanel() {
  const [loading, setLoading] = useState(false);
  const [sitemap, setSitemap] = useState('');
  const [robotsTxt, setRobotsTxt] = useState('');
  const [copied, setCopied] = useState('');
  const [baseUrl, setBaseUrl] = useState(window.location.origin);

  const generate = async () => {
    setLoading(true);
    try {
      const [allSeo, orgData, locationPages] = await Promise.all([
        base44.entities.SeoSettings.list(),
        base44.entities.SeoOrganization.list(),
        base44.entities.LocationPage.list(),
      ]);
      const seoMap = {};
      allSeo.forEach(s => { seoMap[s.page_name] = s; });

      const xml = generateSitemap(ALL_PAGES, seoMap, baseUrl, locationPages);
      setSitemap(xml);

      const org = orgData?.[0];
      const robots = generateRobotsTxt(`${baseUrl}/sitemap.xml`, org?.robots_txt_custom);
      setRobotsTxt(robots);
    } finally {
      setLoading(false);
    }
  };

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const download = (content, filename, type = 'text/xml') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <input
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
          value={baseUrl}
          onChange={e => setBaseUrl(e.target.value)}
          placeholder="https://yourdomain.com"
        />
        <Button onClick={generate} disabled={loading} className="bg-black text-white hover:bg-gray-800">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Generate
        </Button>
      </div>

      {sitemap && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm">sitemap.xml</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => copy(sitemap, 'sitemap')}>
                {copied === 'sitemap' ? <CheckCheck className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                Copy
              </Button>
              <Button size="sm" variant="outline" onClick={() => download(sitemap, 'sitemap.xml', 'text/xml')}>
                <Download className="w-3 h-3 mr-1" />Download
              </Button>
            </div>
          </div>
          <pre className="bg-gray-50 border rounded-xl p-4 text-xs font-mono overflow-auto max-h-64 whitespace-pre-wrap">
            {sitemap}
          </pre>
        </div>
      )}

      {robotsTxt && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm">robots.txt</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => copy(robotsTxt, 'robots')}>
                {copied === 'robots' ? <CheckCheck className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                Copy
              </Button>
              <Button size="sm" variant="outline" onClick={() => download(robotsTxt, 'robots.txt', 'text/plain')}>
                <Download className="w-3 h-3 mr-1" />Download
              </Button>
            </div>
          </div>
          <pre className="bg-gray-50 border rounded-xl p-4 text-xs font-mono overflow-auto max-h-48 whitespace-pre-wrap">
            {robotsTxt}
          </pre>
          <p className="text-xs text-gray-400">Upload robots.txt to your domain root, and submit sitemap.xml to Google Search Console.</p>
        </div>
      )}
    </div>
  );
}