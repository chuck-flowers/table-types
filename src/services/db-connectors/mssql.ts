import mssql from 'mssql';
import { AppConfigSubset } from '../../config.js';
import { ColumnDefintion, ColumnType } from '../../models/definitions.js';
import { ServiceDeps } from '../../services.js';
import { DbConnector } from '../db-connectors.js';

type SqlServerConnector = ReturnType<typeof createSqlServerConnector>;
export default SqlServerConnector;

export type SqlServerConnectorConfig = AppConfigSubset<
	| 'dbHost'
	| 'dbPort'
	| 'dbName'
	| 'dbUser'
	| 'dbPass'
>;
export type SqlServerConnectorDeps = ServiceDeps;

type InformationSchemaColumn = {
	COLUMN_NAME: string,
	DATA_TYPE: InformationSchemaColumnType,
	IS_NULLABLE: 'YES' | 'NO'
};

type InformationSchemaColumnType =
	| 'datetime'
	| 'decimal'
	| 'float'
	| 'int'
	| 'money'
	| 'numeric'
	| 'time'
	| 'varchar'

const TYPE_MAPPING: { [K in InformationSchemaColumnType]: ColumnType } = {
	datetime: 'Date',
	decimal: 'number',
	float: 'number',
	int: 'number',
	money: 'number',
	numeric: 'number',
	time: 'Date',
	varchar: 'string',
};

export async function createSqlServerConnector(
	config: SqlServerConnectorConfig,
	_deps: SqlServerConnectorDeps
): Promise<DbConnector> {
	const client = await mssql.connect({
		server: config.dbHost,
		port: config.dbPort,
		database: config.dbName,
		authentication: {
			options: {
				userName: config.dbUser,
				password: config.dbPass
			}
		},
		options: {
			trustServerCertificate: true
		}
	} satisfies mssql.config);

	return {
		async getColumnsOfTable(table, schema) {
			const request = client.request();
			let response: mssql.IResult<InformationSchemaColumn>;
			if (schema !== undefined) {
				response = await request.query`
					SELECT
						COLUMN_NAME,
						DATA_TYPE,
						IS_NULLABLE
					FROM
						INFORMATION_SCHEMA.COLUMNS
					WHERE
						TABLE_NAME = ${table}
						AND TABLE_SCHEMA = ${schema ?? null}
				`;
			} else {
				response = await request.query`
					SELECT
						COLUMN_NAME,
						DATA_TYPE,
						IS_NULLABLE
					FROM
						INFORMATION_SCHEMA.COLUMNS
					WHERE
						TABLE_NAME = ${table}
				`;
			}

			return response.recordset.map(x => {
				const type = TYPE_MAPPING[x.DATA_TYPE];
				if (type === undefined) {
					throw new Error(`Unknown type "${x.DATA_TYPE}" received from SQL Server`);
				}

				return {
					name: x.COLUMN_NAME,
					type,
					isNullable: x.IS_NULLABLE === 'YES'
				} satisfies ColumnDefintion;
			});
		},
		async close() {
			return client.close();
		}
	};
}

