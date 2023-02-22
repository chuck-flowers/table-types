import { AppConfig } from './models/generated/app-config.js';
import { createServices } from './services.js';

export default async function generateTypes(config: AppConfig) {
	const services = await createServices(config);
	await services.handler();
	await services.close();
}

