import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import trackingRoutes from '../../api/routes/tracking.routes.js';

describe('tracking routes', () => {
  it('serves pixel.gif with no-cache headers', async () => {
    const app = express();
    app.use('/api/tracking', trackingRoutes);

    const res = await request(app).get('/api/tracking/pixel.gif?event=page_view&sessionId=test-session');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('image/gif');
    expect(res.headers['cache-control']).toContain('no-cache');
    expect(Number(res.headers['content-length'])).toBe(res.body.length);
  });

  it('accepts event POST and returns 204', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/tracking', trackingRoutes);

    const res = await request(app)
      .post('/api/tracking/event')
      .send({ event: 'page_view', sessionId: 's1', metadata: { a: 1 } });

    expect(res.status).toBe(204);
  });
});

