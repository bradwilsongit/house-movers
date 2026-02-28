import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import {
  MapPin, CheckCircle2, ChevronRight, Clock, Route,
  HelpCircle, ArrowRight, Truck, Shield, Star, Lightbulb,
  Building2, Package, Home
} from 'lucide-react';
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

    document.title = page.seo_title || `House Movers in ${page.location_name} | Book Vetted Movers Online`;

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
    setLink('canonical', page.canonical_url || `${window.location.origin}/LocationLanding?slug=${slug}`);
    setMeta('property', 'og:title', page.seo_title);
    setMeta('property', 'og:description', page.meta_description);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:url', page.canonical_url);

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
      areaServed: { '@type': 'City', name: page.location_name }
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

  const getQuoteUrl = () => createPageUrl(`CreateMove?prefill_location=${encodeURIComponent(page?.location_name || '')}`);

  const serviceIcons = [Home, Building2, Package, Truck];

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

      {/* ── Hero Banner ─────────────────────────────────────────── */}
      <div className="bg-gray-50 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">

            {/* Left: Text */}
            <div className="flex-1 max-w-xl">
              {/* Trust badge */}
              <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 text-sm text-gray-700 mb-6 shadow-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Trusted by 10,000+ customers
              </div>

              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                <Link to={createPageUrl('Home')} className="hover:text-gray-600 transition-colors">Home</Link>
                <ChevronRight className="w-3 h-3" />
                <span>Movers</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-gray-600">{page.location_name}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3 leading-tight">
                {page.h1 || `House Movers in ${page.location_name}`}
              </h1>
              <p className="text-gray-500 text-lg mb-8 leading-relaxed">{page.hero_paragraph}</p>

              <div className="flex flex-wrap gap-3 mb-10">
                <Link to={getQuoteUrl()}>
                  <Button className="bg-black text-white hover:bg-gray-800 font-semibold text-base px-7 py-3 h-auto">
                    Plan Your Move <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to={createPageUrl('SupplierOnboarding')}>
                  <Button variant="outline" className="font-semibold text-base px-7 py-3 h-auto border-gray-300">
                    Join as a Mover
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="border-t border-gray-200 pt-8 flex gap-8">
                <div>
                  <p className="text-2xl font-bold text-gray-900">500+</p>
                  <p className="text-sm text-gray-500">Verified Movers</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">4.8</p>
                  <p className="text-sm text-gray-500">Average Rating</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">50K+</p>
                  <p className="text-sm text-gray-500">Moves Completed</p>
                </div>
              </div>
            </div>

            {/* Right: Image card with route overlay */}
            <div className="flex-1 max-w-lg w-full">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <img
                  src={(() => {
                    const photos = [
                      'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=800&q=80',
                      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
                      'https://images.unsplash.com/photo-1603796846097-bee99e4a601f?w=800&q=80',
                      'https://images.unsplash.com/photo-1464082354059-27db6ce50048?w=800&q=80',
                      'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80',
                      'https://images.unsplash.com/photo-1572373625060-0d9d1b84eff4?w=800&q=80',
                      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
                      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
                    ];
                    const hash = (page.slug || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
                    return photos[hash % photos.length];
                  })()}
                  alt={`Moving companies in ${page.location_name}`}
                  className="w-full h-64 object-cover"
                />
                {/* Move confirmed card */}
                {page.popular_routes?.filter(r => r.distance_km)[0] && (() => {
                  const route = page.popular_routes.filter(r => r.distance_km)[0];
                  return (
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">Move Confirmed</p>
                          <p className="text-xs text-gray-500">{page.location_name} → {route.destination}</p>
                        </div>
                      </div>
                      <span className="text-green-600 text-sm font-semibold">Active</span>
                    </div>
                  );
                })()}
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">

        {/* ── Local Intro ──────────────────────────────────────────── */}
        {page.local_intro && (
          <section>
            <div className="prose prose-gray max-w-none">
              {page.local_intro.split('\n').filter(p => p.trim()).map((para, i) => (
                <p key={i} className="text-gray-600 leading-relaxed mb-4 text-base">{para.trim()}</p>
              ))}
            </div>
          </section>
        )}

        {/* ── Service Blocks ───────────────────────────────────────── */}
        {page.service_blocks?.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Moving Services in {page.location_name}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {page.service_blocks.map((block, i) => {
                const Icon = serviceIcons[i] || Truck;
                return (
                  <div key={i} className="border border-gray-200 rounded-2xl p-6 hover:border-gray-300 hover:shadow-sm transition-all">
                    <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{block.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-4">{block.description}</p>
                    <Link to={getQuoteUrl()} className="text-sm font-semibold text-black hover:underline flex items-center gap-1">
                      {block.cta || 'Book a move in minutes.'} <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Key Routes ───────────────────────────────────────────── */}
        {page.popular_routes?.filter(r => r.distance_km).length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Key Routes from {page.location_name}</h2>
            <p className="text-gray-500 text-sm mb-6">We cover long-distance moves from {page.location_name} to all major destinations across South Africa. Book via House Movers for vetted long-haul suppliers.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {page.popular_routes.filter(r => r.distance_km).map((route, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all group">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center shrink-0">
                    <Route className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {page.location_name} → {route.destination}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                      <span>{route.distance_km} km</span>
                      <span>·</span>
                      <Clock className="w-3 h-3" />
                      <span>~{route.duration_minutes >= 60
                        ? `${Math.floor(route.duration_minutes / 60)}h ${route.duration_minutes % 60 > 0 ? `${route.duration_minutes % 60}m` : ''}`
                        : `${route.duration_minutes} min`} drive</span>
                    </p>
                  </div>
                  <Link to={getQuoteUrl()} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </Link>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">Drive times are estimates. Long-distance quotes include fuel, toll, and crew costs.</p>
          </section>
        )}

        {/* ── Areas We Cover ───────────────────────────────────────── */}
        {page.nearby_areas?.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Areas We Cover Near {page.location_name}</h2>
            <p className="text-gray-500 text-sm mb-5">Our partnered suppliers operate across {page.location_name} and the surrounding areas. Not listed? You can still book — we cover the wider {page.city || page.location_name} region.</p>
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

        {/* ── Moving Tips ──────────────────────────────────────────── */}
        {page.moving_tips?.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Moving Tips for {page.location_name}</h2>
            <p className="text-gray-500 text-sm mb-6">Practical advice to make your move in {page.location_name} as smooth as possible.</p>
            <div className="space-y-3">
              {page.moving_tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-gray-700 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Why House Movers ─────────────────────────────────────── */}
        <section className="bg-gray-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Why Book Through House Movers?</h2>
          <p className="text-gray-500 text-sm mb-6">We're a platform, not just a moving company. That means you get choice, transparency, and accountability — every time.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Shield, title: 'Vetted, Partnered Suppliers', desc: 'Every supplier on our platform is screened and rated by real customers.' },
              { icon: Star, title: 'Transparent Pricing', desc: 'Get itemised quotes before you commit. No hidden costs, no surprises.' },
              { icon: Truck, title: 'Right Truck for Your Move', desc: 'We match you to the correct vehicle size — whether it\'s a single item or a full house.' },
              { icon: CheckCircle2, title: 'Booking & Support', desc: 'Manage everything online. Our team is available if anything comes up.' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                  <p className="text-gray-500 text-sm mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQs ─────────────────────────────────────────────────── */}
        {page.faqs?.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions — {page.location_name}</h2>
            <div className="space-y-3">
              {page.faqs.map((faq, i) => (
                <details key={i} className="group border rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between gap-3 p-4 cursor-pointer list-none hover:bg-gray-50 transition-colors">
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
          <p className="text-gray-300 mb-2">Get matched with trusted, vetted movers in your area.</p>
          <p className="text-gray-400 text-sm mb-8">Free quote · Right truck size · Partnered suppliers</p>
          <Link to={getQuoteUrl()}>
            <Button className="bg-white text-black hover:bg-gray-100 font-semibold text-base px-8 py-3 h-auto">
              Get Quotes & Book Now <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </section>

      </div>
    </div>
  );
}