import { getConfiguration } from './config.js';
import { AppConfig } from './models/generated/app-config.js';
import { DbConnector } from './services/db-connectors.js';
import { createSqlServerConnector } from './services/db-connectors/mssql.js';
import { createHandler } from './services/handler.js';
import { createModelGenerator } from './services/model-generator.js';

export type Services = Awaited<ReturnType<typeof createServices>>;
export type ServiceDeps<T extends keyof Services = never> = Pick<Services, T>;

let services: Services | null = null;
export async function getServices() {
	if (services === null) {
		const config = getConfiguration();
		services = await createServices(config);
	}

	return services;
}

export async function createServices(config: AppConfig) {
	let dbConnector: DbConnector;
	dbConnector = await createSqlServerConnector(config, {});
	const modelGenerator = createModelGenerator(config, {});
	const handler = createHandler(config, { dbConnector, modelGenerator });

	return {
		dbConnector,
		handler,
		modelGenerator
	};
}

