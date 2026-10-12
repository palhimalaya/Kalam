export const DB_NAME = "loksewa-civil-mcq";
export const DB_VERSION = 1;

export function assertCanOpenDatabase(foundVersion: number): void {
  if (foundVersion > DB_VERSION) {
    throw new Error(`This browser has database version ${foundVersion}, which is newer than this app (${DB_VERSION}).`);
  }
}
