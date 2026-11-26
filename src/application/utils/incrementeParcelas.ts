interface IRequest {
  dia: number;
  mes: number;
  ano: number;
  index: number | any;
}

export const incrementeParcelas = ({ dia, mes, ano, index }: IRequest) => {
  const data = new Date();

  // Corrigir fevereiro para não ter dia maior que 28
  if (dia > 28 && mes === 2) {
    dia = 28;
  }

  // Se passar de 12 parcelas, avançar um ano e resetar o mês
  if (index > 12) {
    ano += 1;
    mes = 1;
  }

  // Criando a data diretamente em UTC para evitar problemas de fuso horário
  const dataUTC = new Date(
    Date.UTC(
      ano,
      mes - 1,
      dia,
      data.getHours(),
      data.getMinutes(),
      data.getSeconds(),
      data.getMilliseconds(),
    ),
  ); // 12:00:00 para evitar ajuste de horário

  return dataUTC.toISOString(); // Retorna no formato ISO (YYYY-MM-DDTHH:mm:ss.sssZ)
};
