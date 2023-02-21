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
>;

export function createHandler(config: HandlerConfig, deps: HandlerDeps) {
	const {
		dbConnector
	} = deps;

	return async (): Promise<void> => {
		for (const table of config.tables) {
			const columns = await dbConnector.getColumnsOfTable(table);
			const tableDef: TableDefinition = {
				name: table,
				columns
			};
		}
	};
}

