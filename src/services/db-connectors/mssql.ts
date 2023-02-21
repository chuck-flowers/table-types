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
	COLUMN_TYPE: InformationSchemaColumnType,
	IS_NULLABLE: boolean
};

type InformationSchemaColumnType =
	| 'varchar'

const TYPE_MAPPING: { [K in InformationSchemaColumnType]: ColumnType } = {
	varchar: 'string'
};

export async function createSqlServerConnector(
	config: SqlServerConnectorConfig,
	_deps: SqlServerConnectorDeps
): Promise<DbConnector> {
	const client = await mssql.connect({
		server: config.dbHost,
		port: config.dbPort,
		database: config.dbName,
		user: config.dbUser,
		password: config.dbPass
	} satisfies mssql.config);

	return {
		async getColumnsOfTable(table) {
			const request = client.request();
			const response = await request.query<InformationSchemaColumn>`
				SELECT
					COLUMN_NAME,
					COLUMN_TYPE,
					IS_NULLABLE
				FROM
					InformationSchema.Columns
				WHERE
					TABLE_NAME = ${table}
			`;

			return response.recordset.map<ColumnDefintion>(x => {
				const type = TYPE_MAPPING[x.COLUMN_TYPE];
				if (type === undefined) {
					throw new Error(`Unknown type "${type}" received from SQL Server`);
				}

				return {
					name: x.COLUMN_NAME,
					type,
					isNullable: x.IS_NULLABLE
				};
			});
		}
	};
}

