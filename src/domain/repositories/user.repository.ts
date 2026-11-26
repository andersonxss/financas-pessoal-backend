import { User } from "@entities";

export interface IUserRepository {
    save(user: User): Promise<User>;
    update(user: User): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    delete(id: string): Promise<void>;
    findAll(): Promise<User[]>;
    validatePassword(user: User, password: string): Promise<boolean>;
}