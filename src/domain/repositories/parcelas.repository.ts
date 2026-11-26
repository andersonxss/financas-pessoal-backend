import { Parcelas } from "@entities";

export interface IParcelasRepository {
    findByName(name: string): Promise<Parcelas | null>;
    findAll(): Promise<Parcelas[]>;
    findById(id: string): Promise<Parcelas | null>;
    findShowParcela(id: string): Promise<Parcelas | null>;
    save(data: Parcelas): Promise<Parcelas>;
    update(data: Parcelas): Promise<Parcelas>;
}