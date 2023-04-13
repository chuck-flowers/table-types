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

export type ColumnType =
	| 'string'
	| 'number'
	| 'boolean'
	| 'Date';

