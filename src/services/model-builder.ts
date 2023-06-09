import { Writable } from 'stream';

export type NamespaceDefinition = {
	name: string,
	types: TypeDefinition[]
}

export type TypeDefinition = {
	name: string,
	properties: PropertyDefinition[]
}

export type PropertyDefinition = {
	name: string,
	type: string,
	comment: string
}

export class FileBuilder {
	private namespaces: NamespaceBuilder[] = [];

	constructor() { }

	addNamespace(name: string, cb: (ns: NamespaceBuilder) => void): typeof this {
		const ns = new NamespaceBuilder(name);
		cb(ns);
		this.namespaces.push(ns);
		return this;
	}

	write(stream: Writable) {
		stream.write('/* eslint-disable */');
		for (const ns of this.namespaces) {
			ns.write(stream);
		}
	}
}


export class NamespaceBuilder {
	private namespaces: NamespaceBuilder[] = [];
	private types: TypeBuilder[] = [];

	constructor(private name: string) { }

	addNamespace(name: string, cb: (ns: NamespaceBuilder) => void): typeof this {
		const ns = new NamespaceBuilder(name);
		cb(ns);
		return this;
	}

	addType(name: string, cb: (tb: TypeBuilder) => void | Promise<void>): typeof this {
		const tb = new TypeBuilder(name);
		cb(tb);
		return this;
	}

	write(stream: Writable): void {
		stream.write(`namespace ${this.name} {`)

		for (const ns of this.namespaces) {
			ns.write(stream);
		}

		for (const t of this.types) {
			t.write(stream);
		}

		stream.write(`}`)
	}
}

export class TypeBuilder {
	private props: PropBuilder[] = [];

	constructor(private name: string) { }

	addProp(name: string, type: string, comment?: string): typeof this {
		this.props.push(new PropBuilder(name, type, comment));
		return this;
	}

	write(stream: Writable): void {
		stream.write(`type ${this.name} {`)
		for (const p of this.props) {
			p.write(stream);
		}
		stream.write('}')
	}
}

export class PropBuilder {
	constructor(
		private name: string,
		private type: string,
		private comment?: string
	) { }

	write(stream: Writable) {
		if (this.comment !== undefined) {
			stream.write(`/** ${this.comment} */`)
		}

		stream.write(`${this.name}: ${this.type}`);
	}
}

