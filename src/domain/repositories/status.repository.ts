import { Status } from "@entities";

export interface IStatusRepository {
    findByName(name: string): Promise<Status | null>;
    findAll(): Promise<Status[]>;
    findById(id: string): Promise<Status | null>;
    save(data: Status): Promise<Status>;
    update(data: Status): Promise<Status>;
    delete(id: string): Promise<void>;
}