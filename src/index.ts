import { getServices } from './services.js';

const services = await getServices();
await services.handler();

