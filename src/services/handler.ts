import process from 'node:process';
import stream from 'node:stream';
import { ColumnDefintion } from '../models/definitions.js';
import { AppConfig, ColumnOverride, SchemaConfig, TableConfig } from '../models/generated/app-config.js';
import { DbConnector } from './db-connectors.js';
import { FileBuilder, TypeBuilder } from './model-builder.js';
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
		const fileBuilder = new FileBuilder();

		this.modelGenerator.pipe(this.output);

		for (const db of this.config.databases) {
			const dbConnector = this.dbConnectors[db.name];

			for (const schema of db.schemas) {
				this.buildSchema(fileBuilder, schema, dbConnector);
			}
		}

		fileBuilder.write(this.output);
	}

	private buildSchema(fileBuilder: FileBuilder, schema: SchemaConfig, dbConnector: DbConnector) {
		fileBuilder.addNamespace(schema.name, ns => {
			for (const table of schema.tables) {
				ns.addType(table.name, t => {
					this.buildTable(t, schema, table, dbConnector);
				});
			}
		})
	}

	private buildTable(t: TypeBuilder, schema: SchemaConfig, table: TableConfig, dbConnector: DbConnector) {
		dbConnector.getColumnsOfTable(schema, table).then(columns => {

			// Apply any overrides
			const colOverrides = table.overrides;
			if (colOverrides !== undefined) {
				columns = columns.filter(column => {
					const override = colOverrides[column.name];
					return this.applyOverride(column, override);
				});
			}

			// Build each of the columns
			for (const col of columns) {
				t.addProp(col.name, col.type, col.rawType);
			}
		});
	}

	private applyOverride(column: ColumnDefintion, override: ColumnOverride): boolean {

		// If no override is specified, generate this column as normal
		if (override === undefined) {
			return true;
		}

		// Ignore the column if it has been blacklisted
		if ('ignore' in override) {
			return !override.ignore;
		}

		// Override nullability if configured
		if ('nullable' in override) {
			column.isNullable = override.nullable;
		}

		// Override the type if configured
		if ('type' in override) {
			column.type = override.type;
		}

		return true;
	}
}

