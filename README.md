# Forgeview Backend

API + job queue for the Forgeview routing shop. Mirrors the physical-paperwork
metaphor from the frontend: a **work order** is a routing slip, each selected
package is a **station job** that moves independently through its own queue
("station"), and every status change is stamped to an append-only
**routing log** (the traveler card).

## Structure

```
src/
  app.js              Express app + route mounting
  server.js           API process entrypoint
  db/
    schema.sql        Postgres schema
    migrate.js         Runs schema.sql
    pool.js            Connection pool + transaction helper
  models/
    workOrder.js       Core domain logic: create, stamp, recompute status
  queue/
    queues.js          BullMQ queue per station (model3d, renders, turntable, aivideo, variants)
  services/
    meshyService.js    Stub: image -> 3D model (Meshy)
    renderService.js   Stub: GLB -> photoreal angle set (local render or Replicate)
    videoService.js    Stub: image -> AI video clip (Runway / Luma)
  workers/
    stationWorkerFactory.js   Shared worker behavior (stamping, asset writes, retries)
    model3dWorker.js          Station: 3D model generation, chains downstream stations
    rendersWorker.js          Station: render set, chains AI video
    turntableWorker.js        Station: rotation animation
    aiVideoWorker.js          Station: AI product film
    variantsWorker.js         Station: color/material variants
    runWorkers.js             Entrypoint that boots all stations
  routes/
    workOrders.js       Create/list/get work orders
    companies.js        Create/list companies
    uploads.js           Presigned upload URLs for source files
    webhooks.js          Inbound provider callbacks (Meshy, Runway)
```

## Why stations are separate queues

Each package type (`model3d`, `renders`, `turntable`, `aivideo`, `variants`)
has its own BullMQ queue. This means:
- A slow AI video provider never backs up 3D modeling for other orders
- Each station can scale, retry, and be monitored independently
- A work order's overall status (`recomputeWorkOrderStatus`) is *derived*
  from its station jobs, not tracked redundantly — there's one source of truth

## Station dependency chain

```
model3d (from source photos)
   │
   ├─→ renders (from GLB)
   │       └─→ aivideo (from hero render image)
   ├─→ turntable (from GLB)
   └─→ variants (from GLB)
```

Chaining happens inside the worker that produces the dependency (e.g.
`model3dWorker` enqueues `renders`/`turntable`/`variants` once the GLB
exists), not in the API route — the route only enqueues the entry station.

## Stubbed integrations

`meshyService.js`, `renderService.js`, and `videoService.js` all return
fake-but-correctly-shaped responses immediately, with the real `fetch()`
calls commented in place above each stub. Swapping a stub for the real
thing means uncommenting the real call and deleting the fake return —
no changes needed in the workers or routes that call these services.

## Running locally

Requires Postgres and Redis running locally (or update `.env` to point
elsewhere).

```bash
cp .env.example .env
npm install
npm run migrate     # creates schema
npm run dev          # API on :4000
npm run worker        # in a second terminal — boots all stations
```

## Example flow

```bash
# 1. Create a company
curl -X POST localhost:4000/companies \
  -H "Content-Type: application/json" \
  -d '{"name":"Nordlite Manufacturing","contactEmail":"ops@nordlite.example"}'

# 2. Open a work order (use the returned company id)
curl -X POST localhost:4000/work-orders \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "<company-id>",
    "productName": "Pendant Lamp PL-04",
    "material": "Spun aluminum, brushed",
    "dimensions": "14x9x9 in",
    "packages": ["model3d", "renders", "aivideo"],
    "imageUrls": ["https://assets.forgeview.example/uploads/lamp1.jpg"]
  }'

# 3. Poll status / view the traveler card
curl localhost:4000/work-orders/<work-order-id>
```

With the worker process running, the order will move through
`received → in_review/modeling → rendering → ready` automatically via the
stubbed providers, and `routingLog` in the response will show every stamp.

## Next steps to make this real

1. Swap stub bodies in `services/*.js` for real provider calls (keys go in `.env`)
2. Implement real S3/R2 presigning in `routes/uploads.js`
3. Move `model3dWorker`'s synchronous poll to a webhook-driven wait (route
   already scaffolded in `routes/webhooks.js`) — avoids holding a worker
   slot for the full generation time
4. Add auth (API keys per company, or session auth for the dashboard)
5. Add a `GET /work-orders/:id/events` SSE or websocket route so the
   frontend dashboard updates live instead of polling
