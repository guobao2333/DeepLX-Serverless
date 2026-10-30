import { createApp, checkCors } from '../src/app.js';

const raw = process.env.CORS_ORIGIN;
const corsOrigin = raw === undefined ? false : checkCors(raw);

export default createApp({ corsOrigin });