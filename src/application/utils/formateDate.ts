

export const spliDateFormate = (date: Date) => {
    const newDate = new Date(date);
    const [ano, mes, dia] = newDate.toISOString().split('T')[0].split('-');
    return { ano: Number(ano), mes: Number(mes), dia: Number(dia) };
}