import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { booking_id, latitude, longitude, is_active } = await req.json();

    if (!booking_id || latitude === undefined || longitude === undefined) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if there's an existing location record for this booking
    const existing = await base44.asServiceRole.entities.DriverLocation.filter({ booking_id });

    if (existing && existing.length > 0) {
      // Update the existing record
      await base44.asServiceRole.entities.DriverLocation.update(existing[0].id, {
        latitude,
        longitude,
        is_active: is_active !== undefined ? is_active : true,
        driver_id: user.id,
      });
    } else {
      // Create a new record
      await base44.asServiceRole.entities.DriverLocation.create({
        booking_id,
        driver_id: user.id,
        latitude,
        longitude,
        is_active: true,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});