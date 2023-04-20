import { ColumnDefintion } from '../models/definitions.js';
import { SchemaConfig, TableConfig } from '../models/generated/app-config.js';

export interface DbConnector {
	getColumnsOfTable(schema: SchemaConfig, table: TableConfig): Promise<ColumnDefintion[]>;
	close(): Promise<void>;
};

