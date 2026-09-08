export const COLORS = {
  paper: "#EDE8DC",
  card: "#FBF8F1",
  ink: "#1C2E28",
  inkSoft: "#4A5C55",
  line: "#D9D0BB",
  gold: "#9C6F2F",
  goldBg: "#EFE3C8",
  rust: "#9C4636",
  rustBg: "#F1DCD5",
};

export const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export const EXPENSE_CATEGORIES = [
  "Vivienda", "Servicios", "Comida", "Transporte", "Gasolina",
  "Salud", "Entretenimiento", "Suscripciones", "Deudas", "Otros",
];

export function fmtMoney(n) {
  const sign = n < 0 ? "-" : "";
  return sign + "$" + Math.round(Math.abs(n)).toLocaleString("es-CO");
}

export function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// Saldo real de una cuenta: inicial + ingresos recibidos - gastos fijos PAGADOS - gastos express, todos asignados a esa cuenta.
export function computeAccountBalance(account, incomes, fixedExpenses, quickExpenses, payments) {
  const inc = incomes.filter((i) => i.accountId === account.id).reduce((a, b) => a + b.amount, 0);
  const quick = quickExpenses.filter((e) => e.accountId === account.id).reduce((a, b) => a + b.amount, 0);
  let paidFixed = 0;
  fixedExpenses
    .filter((e) => e.accountId === account.id)
    .forEach((e) => {
      Object.keys(payments).forEach((pKey) => {
        if (pKey.startsWith(e.id + "_") && payments[pKey]?.paid) {
          paidFixed += e.amount;
        }
      });
    });
  return account.initialBalance + inc - quick - paidFixed;
}
