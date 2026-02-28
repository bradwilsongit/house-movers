import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { location_name, city, province, lat, lng, slug, apiKey } = await req.json();
    const siteUrl = 'https://housemovers.base44.app';

    // 1) Generate content via LLM
    const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are an SEO content writer for House Movers — a South African online platform that connects customers to vetted, partnered moving suppliers. Write a conversion-focused service landing page (NOT a blog post or guide).

Location: ${location_name}
City/Metro: ${city || location_name}
Province: ${province || 'South Africa'}

Return a JSON object with EXACTLY these fields:

- seo_title: "House Movers in ${location_name} | Book Vetted Movers Online" (max 65 chars)
- meta_description: 150-160 chars; include location + booking angle, e.g. "Compare vetted moving companies in ${location_name}. Book online, get matched to the right truck size, and track your move. House Movers South Africa."
- h1: MUST contain the phrase "moving companies" e.g. "Top Moving Companies in ${location_name}" or "Trusted Moving Companies in ${location_name}" (max 65 chars)
- hero_paragraph: 2 sentences. Direct, service-led tone. First sentence: you can book online now your move with the top trusted local moving companies in ${location_name}. Second sentence: compare vetted movers and track your move through the House Movers platform.
- local_intro: 3-4 paragraphs (300-400 words total). Direct, service-led tone — NOT bloggy, NOT "this guide will help you". Mention: (1) House Movers is a platform connecting customers to partnered moving suppliers, (2) we handle booking + coordination, (3) common move types in ${location_name} (home, office, small load, long-distance). End with: "Start your booking above to compare movers in ${location_name}."
- service_blocks: Array of exactly 4 objects, each with: { title: string, description: string (2-3 sentences, service-led, mention platform), cta: "Book a move in minutes." }. Titles must be: "Home Moves in ${location_name}", "Office Moves in ${location_name}", "Small Loads & Single Items", "Long-distance Moves from ${location_name}"
- moving_tips: Array of 5-6 practical, location-specific tips as strings. Each tip should be 1-2 sentences. Cover: best times to move (traffic/month-end/weekends), parking/access for apartments/complexes in ${location_name}, security considerations, weather if relevant, booking-ahead advice.
- nearby_areas: Array of 12-18 real suburb/area names near ${location_name} in South Africa (just the names as strings)
- faqs: Array of 8 FAQ objects with "question" and "answer". Questions must include: "How much do movers cost in ${location_name}?", "Do you cover ${location_name} to Cape Town moves?", "How far in advance should I book?", "Do you offer packing services?", "Are your movers vetted?", "What size truck do I need?", plus 2 more location-specific questions. All answers must reference booking via House Movers platform and mention vetted suppliers.

Write like a converting service page. Mention "House Movers" and "partnered suppliers" naturally throughout. Never write "this guide", "essential tips", or editorial filler.`,
      response_json_schema: {
        type: 'object',
        properties: {
          seo_title: { type: 'string' },
          meta_description: { type: 'string' },
          h1: { type: 'string' },
          hero_paragraph: { type: 'string' },
          local_intro: { type: 'string' },
          service_blocks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                cta: { type: 'string' }
              }
            }
          },
          moving_tips: { type: 'array', items: { type: 'string' } },
          nearby_areas: { type: 'array', items: { type: 'string' } },
          faqs: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                question: { type: 'string' },
                answer: { type: 'string' }
              }
            }
          }
        }
      }
    });

    // 2) Generate popular routes via Distance Matrix or LLM fallback
    let popular_routes = [];
    if (lat && lng && apiKey) {
      const majorDestinations = [
        'Cape Town CBD', 'Johannesburg CBD', 'Pretoria CBD',
        'Durban CBD', 'Port Elizabeth', 'Bloemfontein CBD', 'East London', 'Nelspruit', 'Polokwane CBD'
      ];
      const destinations = majorDestinations
        .filter(d => !d.toLowerCase().includes((city || location_name).toLowerCase()))
        .slice(0, 7);

      try {
        const origins = `${lat},${lng}`;
        const dests = destinations.join('|');
        const dmUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origins)}&destinations=${encodeURIComponent(dests)}&key=${apiKey}&units=metric`;
        const dmData = await (await fetch(dmUrl)).json();

        if (dmData.status === 'OK' && dmData.rows?.[0]?.elements) {
          dmData.rows[0].elements.forEach((el, i) => {
            if (el.status === 'OK') {
              popular_routes.push({
                destination: destinations[i],
                distance_km: Math.round(el.distance.value / 1000),
                duration_minutes: Math.round(el.duration.value / 60)
              });
            }
          });
        }
      } catch (_e) { /* fall through to LLM */ }
    }

    // LLM fallback for routes if Distance Matrix returned nothing
    if (popular_routes.length === 0) {
      try {
        const routeResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `List 6 major long-distance routes from ${location_name}, South Africa to other major South African cities. Exclude ${location_name} itself. Return realistic approximate distances and driving times based on real South African road distances.`,
          response_json_schema: {
            type: 'object',
            properties: {
              routes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    destination: { type: 'string' },
                    distance_km: { type: 'number' },
                    duration_minutes: { type: 'number' }
                  }
                }
              }
            }
          }
        });
        popular_routes = routeResult.routes || [];
      } catch (_e) { /* Routes are optional */ }
    }

    // Build services array from service_blocks for backward compatibility
    const services = llmResult.service_blocks?.map(b => b.title) || [];

    const pageData = {
      ...llmResult,
      services,
      popular_routes,
      canonical_url: `${siteUrl}/LocationLanding?slug=${slug}`,
      generation_status: 'complete',
      is_published: true
    };

    return Response.json({ success: true, pageData });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});