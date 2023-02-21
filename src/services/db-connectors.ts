import { ColumnDefintion } from '../models/definitions.js';

export type DbConnector = {
	getColumnsOfTable(table: string): Promise<ColumnDefintion[]>;
};

