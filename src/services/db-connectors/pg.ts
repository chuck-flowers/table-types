import postgres from 'postgres';
import { ColumnType, DbConfig, SchemaConfig, TableConfig } from '../../models/generated/app-config';
import { ColumnDefintion as ColumnDefinition } from '../../models/definitions';
import { DbConnector } from '../db-connectors';

type InformationSchemaRow = {
	table_schema: string,
	table_name: string,
	column_name: string,
	data_type: string,
	is_nullable: 'YES' | 'NO'
};

export default class PostgresConnector implements DbConnector {
	private client: postgres.Sql;

	constructor(config: DbConfig) {
		this.client = postgres({
			host: config.host,
			port: config.port,
			user: config.user,
			password: config.pass,
			database: config.name
		});
	}

	async getColumnsOfTable(schema: SchemaConfig, table: TableConfig) {
		const result = await this.client<InformationSchemaRow[]>`
			SELECT
				table_schema,
				table_name,
				column_name,
				data_type,
				is_nullable
			FROM
				information_schema.columns c
			WHERE
				table_schema = ${schema.name}
				AND table_name = ${table.name}
		`;

		return result.map<ColumnDefinition>(x => {
			return {
				name: x.column_name,
				rawType: x.data_type,
				type: this.mapFromPgType(x.data_type),
				isNullable: x.is_nullable === 'YES'
			};
		});
	}

	close() {
		return this.client.end();
	}

	private mapFromPgType(input: string): ColumnType {
		switch (input.toLowerCase()) {
			case 'char':
			case 'character varying':
			case 'character':
			case 'text':
			case 'uuid':
			case 'varchar':
				return 'string';
			case 'boolean':
				return 'boolean';
			case 'bigint':
			case 'bigserial':
			case 'decimal':
			case 'double precision':
			case 'integer':
			case 'numeric':
			case 'real':
			case 'serial':
			case 'smallint':
			case 'smallserial':
				return 'number'
			case 'DATE':
			case 'TIMESTAMP':
			case 'timestamp without time zone':
			case 'TIMESTAMPTZ':
				return 'Date';
			default:
				throw new Error(`Unknown Postgres type: ${input}`);
		}
	}
}

