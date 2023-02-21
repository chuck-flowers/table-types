import { ColumnDefintion } from '../models/definitions.js';

export type DbConnector = {
	getColumnsOfTable(table: string, schema?: string): Promise<ColumnDefintion[]>;
	close(): Promise<void>;
};

