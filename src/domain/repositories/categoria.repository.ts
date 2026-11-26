import { Categoria } from "@entities";

export interface ICategoriaRepository {
    findByName(name: string): Promise<Categoria | null>;
    findAll(): Promise<Categoria[]>;
    findById(id: string): Promise<Categoria | null>;
    save(data: Categoria): Promise<Categoria>;
    update(data: Categoria): Promise<Categoria>;
    delete(id: string): Promise<void>;
}