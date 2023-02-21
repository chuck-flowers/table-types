import stream from 'stream';
import { AppConfigSubset } from '../config.js';
import { TableDefinition } from '../models/definitions.js';
import { ServiceDeps } from '../services.js';

type ModelGenerator = ReturnType<typeof createModelGenerator>;
export default ModelGenerator;

export type ModelGeneratorConfig = AppConfigSubset;
export type ModelGeneratorDeps = ServiceDeps;

export function createModelGenerator(_config: ModelGeneratorConfig, _deps: ModelGeneratorDeps) {
	return new stream.Transform({
		objectMode: true,
		transform(tableDef: TableDefinition, _encoding, callback) {
			let interfaceString = `export interface ${tableDef.name} {\n`;
			for (const column of tableDef.columns) {
				if (column.isNullable) {
					interfaceString += `  ${column.name}: ${column.type} | null;\n`;
				} else {
					interfaceString += `  ${column.name}: ${column.type};\n`;
				}
			}
			interfaceString += '};\n';
			callback(undefined, interfaceString);
		}
	});
}

