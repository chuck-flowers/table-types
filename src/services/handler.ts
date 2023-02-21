import process from 'node:process';
import stream from 'node:stream';
import { AppConfigSubset } from '../config.js';
import { TableDefinition } from '../models/definitions.js';
import { ServiceDeps } from '../services.js';

type Handler = ReturnType<typeof createHandler>;
export default Handler;

export type HandlerConfig = AppConfigSubset<
	| 'tables'
>;
export type HandlerDeps = ServiceDeps<
	| 'dbConnector'
	| 'modelGenerator'
>;

export function createHandler(config: HandlerConfig, deps: HandlerDeps) {
	const {
		dbConnector,
		modelGenerator
	} = deps;

	const output: stream.Writable = process.stdout;

	return async (): Promise<void> => {
		modelGenerator.pipe(output)
		for (const table of config.tables) {
			const columns = await dbConnector.getColumnsOfTable(table.name, table.schema);
			const tableDef: TableDefinition = {
				name: table.name,
				columns
			};

			modelGenerator.write(tableDef);
		}
		modelGenerator.end();
	};
}

