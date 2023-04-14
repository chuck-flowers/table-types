import { ColumnType } from './generated/app-config';

export type TableDefinition = {
	name: string,
	columns: ColumnDefintion[]
};

export type ColumnDefintion = {
	name: string,
	type: ColumnType,
	rawType: string,
	isNullable: boolean
};

