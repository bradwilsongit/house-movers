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
      prompt: `You are an SEO content writer for a South African moving company. Generate comprehensive SEO content for a location landing page.

Location: ${location_name}
City/Metro: ${city || location_name}
Province: ${province || 'South Africa'}

Return a JSON object with EXACTLY these fields:
- seo_title: Page title tag (max 60 chars), include "Movers ${location_name}" naturally
- meta_description: Meta description (max 155 chars), compelling, include location
- h1: H1 heading with primary keyword + location (max 70 chars)
- hero_paragraph: 2-3 sentence intro paragraph mentioning ${location_name} naturally, talking about professional moving services
- services: Array of 5 services offered (strings), each under 60 chars, specific to moving e.g. "Residential house moving in ${location_name}"
- nearby_areas: Array of 8 real suburbs or areas near ${location_name} in South Africa (just the suburb/area names as strings)
- faqs: Array of 8 FAQ objects with "question" and "answer" fields, tailored to moving in ${location_name}. Answers should be 2-3 sentences.

Make all content natural, helpful, and specific to ${location_name}, South Africa.`,
      response_json_schema: {
        type: 'object',
        properties: {
          seo_title: { type: 'string' },
          meta_description: { type: 'string' },
          h1: { type: 'string' },
          hero_paragraph: { type: 'string' },
          services: { type: 'array', items: { type: 'string' } },
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

    // 2) Generate popular routes via Distance Matrix
    let popular_routes = [];
    if (lat && lng && apiKey) {
      const majorDestinations = [
        'Cape Town CBD', 'Johannesburg CBD', 'Pretoria CBD',
        'Durban CBD', 'Port Elizabeth', 'Bloemfontein CBD', 'East London', 'Nelspruit'
      ];
      const destinations = majorDestinations
        .filter(d => !d.toLowerCase().includes((city || location_name).toLowerCase()))
        .slice(0, 6);

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
      } catch (_e) { /* Routes are optional */ }
    }

    const pageData = {
      ...llmResult,
      popular_routes,
      canonical_url: `${siteUrl}/movers/${slug}`,
      generation_status: 'complete',
      is_published: true
    };

    return Response.json({ success: true, pageData });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});