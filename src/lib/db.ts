import { type IDBPDatabase, openDB } from 'idb';

export class DatabaseService {
	private dbName: string;
	private tableName: string;
	private db: IDBPDatabase | null = null;

	constructor(dbName: string, tableName: string) {
		this.dbName = dbName;
		this.tableName = tableName;
	}

	private async getDatabaseVersion(): Promise<number> {
		const databases = await indexedDB.databases();
		const dbInfo = databases.find(db => db.name === this.dbName);
		return dbInfo?.version ?? 1;
	}

	private async ensureTableExists(db: IDBPDatabase) {
		if (!db.objectStoreNames.contains(this.tableName)) {
			db.close();
			const newVersion = db.version + 1;
			this.db = await openDB(this.dbName, newVersion, {
				upgrade: upgradedDb => {
					if (!upgradedDb.objectStoreNames.contains(this.tableName)) {
						upgradedDb.createObjectStore(this.tableName);
					}
				},
			});
		} else {
			this.db = db;
		}
	}

	private async initDB() {
		const currentVersion = await this.getDatabaseVersion();
		const db = await openDB(this.dbName, currentVersion);
		await this.ensureTableExists(db);
	}

	private async ensureDBInitialized() {
		if (!this.db) {
			await this.initDB();
		}
	}

	async create<T>(key: string, data: T) {
		await this.ensureDBInitialized();
		const tx = this.db!.transaction(this.tableName, 'readwrite');
		const store = tx.objectStore(this.tableName);
		await store.put(data, key);
		await tx.done;
	}

	async get<T>(key: string): Promise<T | undefined> {
		await this.ensureDBInitialized();
		return await this.db!.get(this.tableName, key);
	}

	async getAll<T>(): Promise<{ [key: string]: T }> {
		await this.ensureDBInitialized();
		const tx = this.db!.transaction(this.tableName, 'readonly');
		const store = tx.objectStore(this.tableName);
		const allEntries: { [key: string]: T } = {};
		let cursor = await store.openCursor();

		while (cursor) {
			allEntries[cursor.key as string] = cursor.value;
			cursor = await cursor.continue();
		}

		await tx.done;
		return allEntries;
	}

	async update<T>(key: string, data: T) {
		await this.ensureDBInitialized();
		const tx = this.db!.transaction(this.tableName, 'readwrite');
		const store = tx.objectStore(this.tableName);
		await store.put(data, key);
		await tx.done;
	}

	async delete(key: string) {
		await this.ensureDBInitialized();
		const tx = this.db!.transaction(this.tableName, 'readwrite');
		await tx.objectStore(this.tableName).delete(key);
		await tx.done;
	}

	async clearDatabase() {
		await this.ensureDBInitialized();
		const tx = this.db!.transaction(this.tableName, 'readwrite');
		const store = tx.objectStore(this.tableName);
		const keys = await store.getAllKeys();
		for (const key of keys) {
			await store.delete(key);
		}
		await tx.done;
	}
}
