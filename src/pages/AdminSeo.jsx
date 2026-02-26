import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Globe, ArrowLeftRight, Building2, Map, ChevronRight, CheckCircle2, XCircle, MapPin } from 'lucide-react';
import SeoPageEditor from '@/components/seo/SeoPageEditor';
import SeoOrganizationEditor from '@/components/seo/SeoOrganizationEditor';
import SeoRedirectsManager from '@/components/seo/SeoRedirectsManager';
import SeoSitemapPanel from '@/components/seo/SeoSitemapPanel';
import LocationPageGenerator from '@/components/seo/LocationPageGenerator';

const ALL_PAGES = [
  { page_name: 'Home', page_label: 'Home', group: 'Public' },
  { page_name: 'SupplierOnboarding', page_label: 'Supplier Onboarding', group: 'Public' },
  { page_name: 'Terms', page_label: 'Terms & Conditions', group: 'Public' },
  { page_name: 'Privacy', page_label: 'Privacy Policy', group: 'Public' },
  { page_name: 'Support', page_label: 'Support', group: 'Public' },
  { page_name: 'CreateMove', page_label: 'Create Move', group: 'Customer' },
  { page_name: 'MyMoves', page_label: 'My Moves', group: 'Customer' },
  { page_name: 'BookingDetails', page_label: 'Booking Details', group: 'Customer' },
  { page_name: 'CustomerExtras', page_label: 'Order Extras', group: 'Customer' },
  { page_name: 'SupplierDashboard', page_label: 'Supplier Dashboard', group: 'Supplier' },
  { page_name: 'SupplierJobs', page_label: 'Supplier Jobs', group: 'Supplier' },
  { page_name: 'SupplierProfile', page_label: 'Supplier Profile', group: 'Supplier' },
  { page_name: 'AdminDashboard', page_label: 'Admin Dashboard', group: 'Admin' },
  { page_name: 'AdminBookings', page_label: 'Admin Bookings', group: 'Admin' },
  { page_name: 'AdminSuppliers', page_label: 'Admin Suppliers', group: 'Admin' },
  { page_name: 'AdminExtras', page_label: 'Admin Extras', group: 'Admin' },
  { page_name: 'AdminSupport', page_label: 'Admin Support', group: 'Admin' },
];

const GROUP_COLORS = {
  Public: 'bg-green-100 text-green-700',
  Customer: 'bg-blue-100 text-blue-700',
  Supplier: 'bg-purple-100 text-purple-700',
  Admin: 'bg-gray-100 text-gray-700',
};

export default function AdminSeo() {
  const [seoMap, setSeoMap] = useState({});
  const [selectedPage, setSelectedPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.SeoSettings.list(),
      base44.entities.AppSettings.list()
    ]).then(([seoData, appData]) => {
      const map = {};
      seoData.forEach(s => { map[s.page_name] = s; });
      setSeoMap(map);
      if (appData[0]?.google_maps_api_key) setApiKey(appData[0].google_maps_api_key);
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    // Reload map after save
    const data = await base44.entities.SeoSettings.list();
    const map = {};
    data.forEach(s => { map[s.page_name] = s; });
    setSeoMap(map);
  };

  const groups = [...new Set(ALL_PAGES.map(p => p.group))];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SEO Manager</h1>
          <p className="text-gray-500 mt-1">Optimise every page for search engines without touching code.</p>
        </div>

        <Tabs defaultValue="pages">
          <TabsList className="grid grid-cols-5 w-full max-w-3xl mb-8">
            <TabsTrigger value="pages"><Search className="w-4 h-4 mr-2" />Pages</TabsTrigger>
            <TabsTrigger value="locations"><MapPin className="w-4 h-4 mr-2" />Locations</TabsTrigger>
            <TabsTrigger value="organization"><Building2 className="w-4 h-4 mr-2" />Organisation</TabsTrigger>
            <TabsTrigger value="redirects"><ArrowLeftRight className="w-4 h-4 mr-2" />Redirects</TabsTrigger>
            <TabsTrigger value="sitemap"><Map className="w-4 h-4 mr-2" />Sitemap</TabsTrigger>
          </TabsList>

          {/* ── Pages Tab ──────────────────────────────── */}
          <TabsContent value="pages">
            {selectedPage ? (
              <div>
                <Button variant="ghost" className="mb-4" onClick={() => setSelectedPage(null)}>
                  ← Back to all pages
                </Button>
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <CardTitle>{selectedPage.page_label}</CardTitle>
                      <Badge className={GROUP_COLORS[selectedPage.group]}>{selectedPage.group}</Badge>
                    </div>
                    <CardDescription>SEO settings for the {selectedPage.page_label} page</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SeoPageEditor
                      seo={{ page_name: selectedPage.page_name, page_label: selectedPage.page_label, ...seoMap[selectedPage.page_name] }}
                      onSave={handleSave}
                    />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-6">
                {loading ? (
                  <div className="text-center py-12 text-gray-400">Loading pages...</div>
                ) : (
                  groups.map(group => (
                    <div key={group}>
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">{group} Pages</h3>
                      <div className="grid gap-2">
                        {ALL_PAGES.filter(p => p.group === group).map(page => {
                          const seo = seoMap[page.page_name];
                          const hasSettings = !!seo;
                          const indexed = !seo || (seo.robots_directive || '').startsWith('index');
                          const inSitemap = !seo || seo.include_in_sitemap !== false;
                          return (
                            <button
                              key={page.page_name}
                              onClick={() => setSelectedPage(page)}
                              className="w-full flex items-center gap-4 p-4 bg-white border rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-left"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">{page.page_label}</span>
                                  <Badge className={`text-xs ${GROUP_COLORS[group]}`}>{group}</Badge>
                                  {!hasSettings && <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-300">Not configured</Badge>}
                                </div>
                                {seo?.seo_title && (
                                  <p className="text-xs text-gray-500 truncate">{seo.seo_title}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <div className="flex items-center gap-1 text-xs">
                                  {indexed
                                    ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                    : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                                  <span className="text-gray-400">Index</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs">
                                  {inSitemap
                                    ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                    : <XCircle className="w-3.5 h-3.5 text-gray-300" />}
                                  <span className="text-gray-400">Sitemap</span>
                                </div>
                                {seo?.focus_keyword && (
                                  <Badge variant="outline" className="text-xs hidden sm:flex">{seo.focus_keyword}</Badge>
                                )}
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </TabsContent>

          {/* ── Organisation Tab ───────────────────────── */}
          <TabsContent value="organization">
            <Card>
              <CardHeader>
                <CardTitle>Organisation Schema</CardTitle>
                <CardDescription>
                  Generates a global JSON-LD block injected on every page. Helps search engines understand who you are.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SeoOrganizationEditor />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Redirects Tab ──────────────────────────── */}
          <TabsContent value="redirects">
            <Card>
              <CardHeader>
                <CardTitle>301/302 Redirects Manager</CardTitle>
                <CardDescription>
                  Manage URL redirects. Note: redirect enforcement requires server-level or hosting configuration.
                  Use this to document and export your redirect rules.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SeoRedirectsManager />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Sitemap Tab ────────────────────────────── */}
          <TabsContent value="sitemap">
            <Card>
              <CardHeader>
                <CardTitle>Sitemap & Robots.txt Generator</CardTitle>
                <CardDescription>
                  Generate your sitemap.xml and robots.txt. Download and upload to your domain root, then submit to Google Search Console.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SeoSitemapPanel />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}