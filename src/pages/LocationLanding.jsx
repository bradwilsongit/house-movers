import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { MapPin, CheckCircle2, ChevronRight, Clock, Route, HelpCircle, ArrowRight, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LocationLanding() {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

  useEffect(() => {
    if (!slug) { setNotFound(true); setLoading(false); return; }
    loadPage();
  }, [slug]);

  useEffect(() => {
    if (!page) return;
    // Inject SEO meta tags
    document.title = page.seo_title || `Movers in ${page.location_name} | House Movers South Africa`;

    const setMeta = (attr, val, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[${attr}="${val}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, val); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    const setLink = (rel, href) => {
      if (!href) return;
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); document.head.appendChild(el); }
      el.setAttribute('href', href);
    };

    setMeta('name', 'description', page.meta_description);
    setMeta('name', 'robots', 'index, follow');
    // Canonical should be the actual working URL with slug param
    const canonicalUrl = `${window.location.origin}/LocationLanding?slug=${slug}`;
    setLink('canonical', canonicalUrl);
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:title', page.seo_title);
    setMeta('property', 'og:description', page.meta_description);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:url', page.canonical_url);

    // JSON-LD: LocalBusiness + FAQPage
    const removeJsonLd = (id) => { const el = document.getElementById(id); if (el) el.remove(); };
    const addJsonLd = (id, data) => {
      removeJsonLd(id);
      const s = document.createElement('script');
      s.type = 'application/ld+json'; s.id = id;
      s.textContent = JSON.stringify(data, null, 2);
      document.head.appendChild(s);
    };

    addJsonLd('jsonld-location-business', {
      '@context': 'https://schema.org',
      '@type': 'MovingCompany',
      name: 'House Movers South Africa',
      url: page.canonical_url,
      description: page.meta_description,
      areaServed: {
        '@type': 'City',
        name: page.location_name
      }
    });

    if (page.faqs?.length) {
      addJsonLd('jsonld-location-faq', {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: page.faqs.map(f => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer }
        }))
      });
    }
  }, [page]);

  const loadPage = async () => {
    try {
      const results = await base44.entities.LocationPage.filter({ slug, is_published: true });
      if (results.length > 0) {
        setPage(results[0]);
      } else {
        setNotFound(true);
      }
    } catch (e) {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const getQuoteUrl = () => {
    return createPageUrl(`CreateMove?prefill_location=${encodeURIComponent(page?.location_name || '')}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <Truck className="w-10 h-10 text-gray-300" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
          <p className="text-gray-500 mb-6">This location page doesn't exist or hasn't been published yet.</p>
          <Link to={createPageUrl('Home')}><Button>Back to Home</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── CTA Banner (always top) ─────────────────────────────── */}
      <div className="bg-black text-white py-4 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-lg">Moving in {page.location_name}?</p>
            <p className="text-gray-300 text-sm">Get an instant quote in minutes.</p>
          </div>
          <Link to={getQuoteUrl()}>
            <Button className="bg-white text-black hover:bg-gray-100 font-semibold shrink-0">
              Get a Quote <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link to={createPageUrl('Home')} className="hover:text-black">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Movers</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-black font-medium">{page.location_name}</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">{page.h1}</h1>
          <p className="text-lg text-gray-600 leading-relaxed max-w-2xl">{page.hero_paragraph}</p>
        </section>

        {/* ── Services ─────────────────────────────────────────────── */}
        {page.services?.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Services in {page.location_name}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {page.services.map((service, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-gray-800 text-sm font-medium">{service}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Nearby Areas ─────────────────────────────────────────── */}
        {page.nearby_areas?.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Areas We Cover Near {page.location_name}</h2>
            <p className="text-gray-500 text-sm mb-5">We service {page.location_name} and all surrounding suburbs and areas.</p>
            <div className="flex flex-wrap gap-2">
              {page.nearby_areas.map((area, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200 transition-colors">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  {area}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ── Popular Routes ────────────────────────────────────────── */}
        {page.popular_routes?.filter(r => r.distance_km).length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Moving Routes from {page.location_name}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {page.popular_routes.filter(r => r.distance_km).map((route, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-xl hover:border-gray-300 transition-all">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center shrink-0">
                    <Route className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {page.location_name} → {route.destination}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                      <span>{route.distance_km} km</span>
                      <span>·</span>
                      <Clock className="w-3 h-3" />
                      <span>~{route.duration_minutes >= 60
                        ? `${Math.floor(route.duration_minutes / 60)}h ${route.duration_minutes % 60}m`
                        : `${route.duration_minutes} min`} drive</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── FAQs ─────────────────────────────────────────────────── */}
        {page.faqs?.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions – {page.location_name}</h2>
            <div className="space-y-4">
              {page.faqs.map((faq, i) => (
                <details key={i} className="group border rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between gap-3 p-4 cursor-pointer list-none hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="font-medium text-sm text-gray-900">{faq.question}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 group-open:rotate-90 transition-transform" />
                  </summary>
                  <div className="px-4 pb-4 pt-0">
                    <p className="text-sm text-gray-600 leading-relaxed pl-7">{faq.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* ── Final CTA ─────────────────────────────────────────────── */}
        <section className="bg-black text-white rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Ready to move in {page.location_name}?</h2>
          <p className="text-gray-300 mb-6">Get matched with trusted, vetted movers in your area. Free quote in under 2 minutes.</p>
          <Link to={getQuoteUrl()}>
            <Button className="bg-white text-black hover:bg-gray-100 font-semibold text-base px-8 py-3 h-auto">
              Get a Free Quote <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </section>

      </div>
    </div>
  );
}