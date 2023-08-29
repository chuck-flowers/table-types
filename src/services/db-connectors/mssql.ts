import mssql from 'mssql';
import { ColumnDefintion } from '../../models/definitions.js';
import { ColumnType, DbConfig, SchemaConfig, TableConfig } from '../../models/generated/app-config.js';
import { DbConnector } from '../db-connectors.js';

type InformationSchemaColumn = {
	COLUMN_NAME: string,
	DATA_TYPE: InformationSchemaColumnType,
	IS_NULLABLE: 'YES' | 'NO'
};

type InformationSchemaColumnType =
	| 'bigint'
	| 'bit'
	| 'char'
	| 'date'
	| 'datetime'
	| 'datetime2'
	| 'decimal'
	| 'float'
	| 'int'
	| 'money'
	| 'numeric'
	| 'nvarchar'
	| 'smallint'
	| 'text'
	| 'time'
	| 'uniqueidentifier'
	| 'varchar'

const TYPE_MAPPING: Record<InformationSchemaColumnType, ColumnType> = {
	bigint: 'number',
	bit: 'boolean',
	char: 'string',
	date: 'Date',
	datetime: 'Date',
	datetime2: 'Date',
	decimal: 'number',
	float: 'number',
	int: 'number',
	money: 'number',
	numeric: 'number',
	smallint: 'number',
	text: 'string',
	time: 'Date',
	uniqueidentifier: 'string',
	varchar: 'string',
	nvarchar: 'string'
};

export default class SqlServerConnector implements DbConnector {
	private pool: mssql.ConnectionPool;

	constructor(config: DbConfig) {
		this.pool = new mssql.ConnectionPool({
			server: config.host,
			port: config.port,
			database: config.name,
			authentication: {
				options: {
					userName: config.user,
					password: config.pass
				}
			},
			options: {
				trustServerCertificate: true
			}
		} satisfies mssql.config);
	}

	async getColumnsOfTable(schema: SchemaConfig, table: TableConfig): Promise<ColumnDefintion[]> {
		const pool = await this.getPool();
		const request = pool.request();
		const { recordset: dbColumns } = await request.query<InformationSchemaColumn>`
			SELECT
				COLUMN_NAME,
				DATA_TYPE,
				IS_NULLABLE
			FROM
				INFORMATION_SCHEMA.COLUMNS
			WHERE
				TABLE_NAME = ${table.name}
				AND TABLE_SCHEMA = ${schema.name}
		`;

		return dbColumns.map((x): ColumnDefintion | null => {
			let type: ColumnType;
			type = TYPE_MAPPING[x.DATA_TYPE];

			if (type === undefined) {
				throw new Error(`Unknown type "${x.DATA_TYPE}" received from SQL Server`);
			}

			return {
				name: x.COLUMN_NAME,
				type,
				rawType: x.DATA_TYPE,
				isNullable: x.IS_NULLABLE === 'YES'
			} satisfies ColumnDefintion;
		}).filter((x): x is ColumnDefintion => x !== null);
	}

	async close(): Promise<void> {
		const pool = await this.getPool();
		return pool.close();
	}

	private async getPool(): Promise<mssql.ConnectionPool> {
		if (!this.pool.connected) {
			await this.pool.connect();
		}

		return this.pool;
	}
}

