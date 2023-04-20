import stream from 'stream';
import { TableDefinition } from '../models/definitions.js';

export default class ModelGenerator extends stream.Transform {
	constructor() {
		super({
			objectMode: true,
			transform(tableDef: TableDefinition, _encoding, callback) {
				let interfaceString = `export interface ${tableDef.name} {\n`;
				for (const column of tableDef.columns) {
					if (column.isNullable) {
						interfaceString += `  ${column.name}: ${column.type} | null; // ${column.rawType}\n`;
					} else {
						interfaceString += `  ${column.name}: ${column.type}; // ${column.rawType}\n`;
					}
				}
				interfaceString += '};\n';
				callback(undefined, interfaceString);
			}
		})
	}
}

