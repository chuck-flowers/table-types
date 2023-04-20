import process from 'node:process';
import stream from 'node:stream';
import { TableDefinition } from '../models/definitions.js';
import { AppConfig } from '../models/generated/app-config.js';
import { DbConnector } from './db-connectors.js';
import ModelGenerator from './model-generator.js';

export default class Handler {
	private output: stream.Writable;

	constructor(
		private config: AppConfig,
		private dbConnectors: Record<string, DbConnector>,
		private modelGenerator: ModelGenerator
	) {
		this.output = process.stdout;
	}

	async execute() {

		this.output.write('/* eslint-disable */\n');
		this.modelGenerator.pipe(this.output)

		for (const db of this.config.databases) {
			const dbConnector = this.dbConnectors[db.name];
			for (const schema of db.schemas) {
				for (const table of schema.tables) {
					const columns = await dbConnector.getColumnsOfTable(schema, table);
					const tableDef: TableDefinition = {
						name: table.name,
						columns
					};

					this.modelGenerator.write(tableDef);
				}
			}
		}

		this.modelGenerator.end();
	}
}

