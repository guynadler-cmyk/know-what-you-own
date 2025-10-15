// Storage interface is not used for this application
// All data is fetched from SEC EDGAR API and processed in real-time

export interface IStorage {}

export class MemStorage implements IStorage {
  constructor() {}
}

export const storage = new MemStorage();
