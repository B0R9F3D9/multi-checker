import Dexie from 'dexie';

export class DatabaseService extends Dexie {
	private tableName: string;

	constructor(dbName: string, tableName: string) {
		super(dbName);
		this.tableName = tableName;

		this.version(1).stores({
			[this.tableName]: '++id',
		});
	}

	async create<T extends Record<string, any>>(
		key: string,
		data: T,
	): Promise<void> {
		await this.table(this.tableName).put({ ...data, id: key });
	}

	async get<T extends Record<string, any>>(
		key: string,
	): Promise<T | undefined> {
		return (await this.table(this.tableName).get(key)) as T | undefined;
	}

	async update<T extends Record<string, any>>(
		key: string,
		data: T,
	): Promise<void> {
		await this.table(this.tableName).update(key, { ...data, id: key });
	}
}
