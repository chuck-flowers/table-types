import mssql from 'mssql';
import { ColumnDefintion } from '../../models/definitions.js';
import { ColumnType, DbConfig } from '../../models/generated/app-config.js';
import { ServiceDeps } from '../../services.js';
import { DbConnector } from '../db-connectors.js';

type SqlServerConnector = ReturnType<typeof createSqlServerConnector>;
export default SqlServerConnector;

export type SqlServerConnectorConfig = DbConfig;
export type SqlServerConnectorDeps = ServiceDeps;

type InformationSchemaColumn = {
	COLUMN_NAME: string,
	DATA_TYPE: InformationSchemaColumnType,
	IS_NULLABLE: 'YES' | 'NO'
};

type InformationSchemaColumnType =
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
	| 'time'
	| 'varchar'

const TYPE_MAPPING: Record<InformationSchemaColumnType, ColumnType> = {
	char: 'string',
	date: 'Date',
	datetime: 'Date',
	datetime2: 'Date',
	decimal: 'number',
	float: 'number',
	int: 'number',
	money: 'number',
	numeric: 'number',
	time: 'Date',
	varchar: 'string',
	nvarchar: 'string'
};

export async function createSqlServerConnector(
	config: SqlServerConnectorConfig,
	_deps: SqlServerConnectorDeps
): Promise<DbConnector> {
	const client = await mssql.connect({
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

	return {
		async getColumnsOfTable(schema, table) {
			const request = client.request();
			let response: mssql.IResult<InformationSchemaColumn>;
			response = await request.query`
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

			return response.recordset.map((x): ColumnDefintion | null => {
				const columnOverride = table.overrides?.[x.COLUMN_NAME];

				// If the column should be ignored, don't generate a definition
				if (columnOverride !== undefined && 'ignore' in columnOverride && columnOverride.ignore === true) {
					return null;
				}

				let type: ColumnType;
				if (columnOverride !== undefined && 'type' in columnOverride) {
					type = columnOverride.type;
				} else {
					type = TYPE_MAPPING[x.DATA_TYPE];
				}

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
		},
		async close() {
			return client.close();
		}
	};
}

