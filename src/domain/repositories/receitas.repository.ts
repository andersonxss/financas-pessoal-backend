import { Receitas } from "@entities";

export interface IReceitasTotalMensal {
	month: string;
	total: string;
}

export interface IReceitasRepository {
	findById(id: string): Promise<Receitas | null>;
	findAll(ano: number, mes: number): Promise<Receitas[]>;
	findAllAno(ano: number): Promise<Receitas[]>;
	findAllMes(mes: number): Promise<Receitas[]>;
	findAllSomalTotalReceitasAno(ano: number): Promise<IReceitasTotalMensal[]>;
    save(data: Receitas): Promise<Receitas>;
    update(data: Receitas): Promise<Receitas>;
    delete(id: string): Promise<void>;
}
