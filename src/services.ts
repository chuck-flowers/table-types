import { getConfiguration } from './config.js';
import { DbConnector } from './services/db-connectors.js';
import { createSqlServerConnector } from './services/db-connectors/mssql.js';
import { createHandler } from './services/handler.js';
import { createModelGenerator } from './services/model-generator.js';

export type Services = Awaited<ReturnType<typeof createServices>>;
export type ServiceDeps<T extends keyof Services = never> = Pick<Services, T>;

let services: Services | null = null;
export async function getServices() {
	if (services === null) {
		services = await createServices();
	}

	return services;
}

export async function createServices() {
	const config = getConfiguration();

	let dbConnector: DbConnector;
	dbConnector = await createSqlServerConnector(config, {});
	const handler = createHandler(config, { dbConnector });
	const modelGenerator = createModelGenerator(config, {});

	return {
		dbConnector,
		handler,
		modelGenerator
	};
}

