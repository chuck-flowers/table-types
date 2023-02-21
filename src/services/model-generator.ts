import mustache from 'mustache';
import fs from 'node:fs';
import path from 'node:path';
import stream from 'stream';
import { AppConfigSubset } from '../config.js';
import { TableDefinition } from '../models/definitions.js';
import { ServiceDeps } from '../services.js';

type ModelGenerator = ReturnType<typeof createModelGenerator>;
export default ModelGenerator;

export type ModelGeneratorConfig = AppConfigSubset;
export type ModelGeneratorDeps = ServiceDeps;

export function createModelGenerator(_config: ModelGeneratorConfig, _deps: ModelGeneratorDeps) {
	const modUrl = import.meta.url;
	const templatePath = path.resolve(modUrl, 'templates', 'table.mustache')
	if (!fs.existsSync(templatePath)) {
		throw new Error(`The template path "${templatePath}" doesn't exist`);
	}

	const templateBody = fs.readFileSync(templatePath, { encoding: 'utf8' });
	mustache.parse(templateBody);

	return new stream.Transform({
		objectMode: true,
		transform(tableDef: TableDefinition, _encoding, callback) {
			const interfaceString = mustache.render(templateBody, tableDef);
			callback(undefined, interfaceString);
		}
	});
}
