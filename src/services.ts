import { getConfiguration } from './config.js';
import { AppConfig } from './models/generated/app-config.js';
import { DbConnector } from './services/db-connectors.js';
import SqlServerConnector from './services/db-connectors/mssql.js';
import Handler from './services/handler.js';
import ModelGenerator from './services/model-generator.js';

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
	let dbConnectors: Record<string, DbConnector> = {};
	for (const db of config.databases) {
		let dbConnector: DbConnector;
		dbConnector = new SqlServerConnector(db);
		dbConnectors[db.name] = dbConnector;
	}

	const modelGenerator = new ModelGenerator();
	const handler = new Handler(config, dbConnectors, modelGenerator);

	return {
		dbConnectors,
		handler,
		modelGenerator,
		async close() {
			for (const dbConn of Object.values(dbConnectors)) {
				await dbConn.close();
			}
		}
	};
}

