import process from 'node:process';
import stream from 'node:stream';
import { TableDefinition } from '../models/definitions.js';
import { AppConfig } from '../models/generated/app-config.js';
import { ServiceDeps } from '../services.js';

type Handler = ReturnType<typeof createHandler>;
export default Handler;

export type HandlerDeps = ServiceDeps<
	| 'dbConnectors'
	| 'modelGenerator'
>;

export function createHandler(config: AppConfig, deps: HandlerDeps) {
	const {
		dbConnectors,
		modelGenerator
	} = deps;

	const output: stream.Writable = process.stdout;

	return async (): Promise<void> => {
		modelGenerator.pipe(output)
		for (const db of config.databases) {
			const dbConnector = dbConnectors[db.name];
			for (const schema of db.schemas) {
				for (const table of schema.tables) {
					const columns = await dbConnector.getColumnsOfTable(table.name, schema.name);
					const tableDef: TableDefinition = {
						name: table.name,
						columns
					};

					modelGenerator.write(tableDef);
				}
			}
		}
		modelGenerator.end();
	};
}

