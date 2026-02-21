import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Injects SEO meta tags + JSON-LD into document <head> based on current page
export default function SeoMetaInjector({ pageName, appSettings }) {
  useEffect(() => {
    let cancelled = false;

    const inject = async () => {
      try {
        // Load page SEO settings
        const [seoList, orgList] = await Promise.all([
          base44.entities.SeoSettings.filter({ page_name: pageName }),
          base44.entities.SeoOrganization.list(),
        ]);

        if (cancelled) return;

        const seo = seoList?.[0];
        const org = orgList?.[0];

        // ── Title ──────────────────────────────────────────
        const title = seo?.seo_title || appSettings?.company_name || 'House Movers';
        document.title = title;

        // ── Helper to upsert <meta> tags ───────────────────
        const setMeta = (attr, value, content) => {
          if (!content) return;
          let el = document.querySelector(`meta[${attr}="${value}"]`);
          if (!el) {
            el = document.createElement('meta');
            el.setAttribute(attr, value);
            document.head.appendChild(el);
          }
          el.setAttribute('content', content);
        };

        const setLink = (rel, href) => {
          if (!href) return;
          let el = document.querySelector(`link[rel="${rel}"]`);
          if (!el) {
            el = document.createElement('link');
            el.setAttribute('rel', rel);
            document.head.appendChild(el);
          }
          el.setAttribute('href', href);
        };

        const removeJsonLd = (id) => {
          const existing = document.getElementById(id);
          if (existing) existing.remove();
        };

        const addJsonLd = (id, data) => {
          removeJsonLd(id);
          const script = document.createElement('script');
          script.type = 'application/ld+json';
          script.id = id;
          script.textContent = JSON.stringify(data, null, 2);
          document.head.appendChild(script);
        };

        if (seo) {
          // Core meta
          setMeta('name', 'description', seo.meta_description);
          setMeta('name', 'robots', seo.robots_directive || 'index, follow');

          // Canonical
          const canonical = seo.canonical_url || window.location.href.split('?')[0];
          setLink('canonical', canonical);

          // Open Graph
          setMeta('property', 'og:title', seo.og_title || title);
          setMeta('property', 'og:description', seo.og_description || seo.meta_description);
          setMeta('property', 'og:image', seo.og_image_url);
          setMeta('property', 'og:url', canonical);
          setMeta('property', 'og:type', 'website');

          // Twitter
          setMeta('name', 'twitter:card', seo.twitter_card_type || 'summary_large_image');
          setMeta('name', 'twitter:title', seo.twitter_title || seo.og_title || title);
          setMeta('name', 'twitter:description', seo.twitter_description || seo.og_description || seo.meta_description);
          setMeta('name', 'twitter:image', seo.twitter_image_url || seo.og_image_url);

          // Page-level JSON-LD
          if (seo.custom_json_ld) {
            try {
              const parsed = JSON.parse(seo.custom_json_ld);
              addJsonLd('jsonld-page-custom', parsed);
            } catch {}
          } else if (seo.schema_type && seo.schema_type !== 'none') {
            const schema = buildPageSchema(seo, title, canonical);
            if (schema) addJsonLd('jsonld-page', schema);
          }
        }

        // Organization-wide JSON-LD
        if (org) {
          const orgSchema = buildOrgSchema(org);
          addJsonLd('jsonld-org', orgSchema);
        }
      } catch (e) {
        // Silent fail — SEO is non-critical
      }
    };

    inject();
    return () => { cancelled = true; };
  }, [pageName]);

  return null;
}

function buildPageSchema(seo, title, canonical) {
  const base = {
    '@context': 'https://schema.org',
    '@type': seo.schema_type,
    name: title,
    url: canonical,
    description: seo.meta_description,
  };

  switch (seo.schema_type) {
    case 'FAQPage': {
      const faqs = seo.schema_fields?.faqs || [];
      return {
        ...base,
        mainEntity: faqs.map(f => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      };
    }
    case 'Article':
      return {
        ...base,
        headline: title,
        datePublished: seo.schema_fields?.date_published,
        author: { '@type': 'Person', name: seo.schema_fields?.author },
      };
    case 'Service':
      return {
        ...base,
        serviceType: seo.schema_fields?.service_type,
        provider: { '@type': 'Organization', name: seo.schema_fields?.provider_name },
        areaServed: seo.schema_fields?.area_served,
      };
    case 'BreadcrumbList': {
      const items = seo.schema_fields?.breadcrumbs || [];
      return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((b, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: b.name,
          item: b.url,
        })),
      };
    }
    default:
      return base;
  }
}

function buildOrgSchema(org) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': org.org_type || 'LocalBusiness',
    name: org.org_name,
    url: org.website_url,
    logo: org.logo_url,
    description: org.description,
    telephone: org.phone,
    email: org.email,
    foundingDate: org.founding_year?.toString(),
    priceRange: org.price_range,
  };

  if (org.address_street) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: org.address_street,
      addressLocality: org.address_city,
      addressRegion: org.address_region,
      postalCode: org.address_postal_code,
      addressCountry: org.address_country || 'ZA',
    };
  }

  if (org.social_profiles?.length) {
    schema.sameAs = org.social_profiles;
  }

  if (org.phone || org.email) {
    schema.contactPoint = {
      '@type': 'ContactPoint',
      telephone: org.phone,
      email: org.email,
      contactType: org.contact_type || 'customer service',
    };
  }

  if (org.service_area) {
    schema.areaServed = org.service_area;
  }

  return schema;
}