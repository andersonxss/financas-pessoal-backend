import { Pagamentos } from "@entities";

export interface IPagamentosRepository {
    findByName(name: string): Promise<Pagamentos | null>;
    findAll(): Promise<Pagamentos[]>;
    findById(id: string): Promise<Pagamentos | null>;
    save(data: Pagamentos): Promise<Pagamentos>;
    update(data: Pagamentos): Promise<Pagamentos>
}