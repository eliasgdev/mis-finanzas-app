import * as XLSX from "xlsx";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { monthKey, MESES, computeAccountBalance } from "./theme";

function monthLabelFromKey(key) {
  const [y, m] = key.split("-");
  return `${MESES[parseInt(m, 10) - 1]} ${y}`;
}

export async function exportFullHistoryToExcel({ incomes, fixedExpenses, quickExpenses, payments, accounts }) {
  // Meses presentes en toda la historia (ingresos, gastos express, pagos registrados)
  const monthsSet = new Set();
  incomes.forEach((i) => monthsSet.add(i.date.slice(0, 7)));
  quickExpenses.forEach((e) => monthsSet.add(e.date.slice(0, 7)));
  Object.keys(payments).forEach((pKey) => {
    const mk = pKey.slice(pKey.lastIndexOf("_") + 1);
    if (/^\d{4}-\d{2}$/.test(mk)) monthsSet.add(mk);
  });
  monthsSet.add(monthKey(new Date()));
  const months = [...monthsSet].sort();

  const wb = XLSX.utils.book_new();

  // ---- Resumen mensual ----
  const resumenRows = [["Mes", "Ingresos", "Gastos fijos pagados", "Gastos express", "Saldo neto"]];
  months.forEach((mk) => {
    const inc = incomes.filter((i) => i.date.startsWith(mk)).reduce((a, b) => a + b.amount, 0);
    const quick = quickExpenses.filter((e) => e.date.startsWith(mk)).reduce((a, b) => a + b.amount, 0);
    const paidFixed = fixedExpenses
      .filter((e) => payments[`${e.id}_${mk}`]?.paid)
      .reduce((a, b) => a + b.amount, 0);
    resumenRows.push([monthLabelFromKey(mk), inc, paidFixed, quick, inc - paidFixed - quick]);
  });
  const wsResumen = XLSX.utils.aoa_to_sheet(resumenRows);
  wsResumen["!cols"] = [{ wch: 20 }, { wch: 14 }, { wch: 20 }, { wch: 16 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen mensual");

  // ---- Cuentas ----
  const cuentasRows = [["Cuenta", "Saldo inicial", "Saldo actual"]];
  accounts.forEach((a) => {
    cuentasRows.push([
      a.name,
      a.initialBalance,
      computeAccountBalance(a, incomes, fixedExpenses, quickExpenses, payments),
    ]);
  });
  const wsCuentas = XLSX.utils.aoa_to_sheet(cuentasRows);
  wsCuentas["!cols"] = [{ wch: 20 }, { wch: 14 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsCuentas, "Cuentas");

  // ---- Ingresos (todos) ----
  const ingresosRows = [["Fecha", "Origen", "Cuenta", "Monto"]];
  [...incomes]
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((i) => {
      const acc = accounts.find((a) => a.id === i.accountId);
      ingresosRows.push([i.date, i.source, acc?.name || "", i.amount]);
    });
  const wsIngresos = XLSX.utils.aoa_to_sheet(ingresosRows);
  wsIngresos["!cols"] = [{ wch: 12 }, { wch: 26 }, { wch: 16 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsIngresos, "Ingresos");

  // ---- Gastos fijos (lista maestra) ----
  const fijosRows = [["Nombre", "Categoría", "Día de vencimiento", "Monto", "Cuenta"]];
  fixedExpenses.forEach((e) => {
    const acc = accounts.find((a) => a.id === e.accountId);
    fijosRows.push([e.name, e.category || "", e.dueDay, e.amount, acc?.name || ""]);
  });
  const wsFijos = XLSX.utils.aoa_to_sheet(fijosRows);
  wsFijos["!cols"] = [{ wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsFijos, "Gastos fijos");

  // ---- Historial de pagos ----
  const pagosRows = [["Gasto", "Mes", "Fecha de pago", "Monto", "Categoría"]];
  Object.keys(payments).forEach((pKey) => {
    if (!payments[pKey]?.paid) return;
    const lastUnderscore = pKey.lastIndexOf("_");
    const expenseId = pKey.slice(0, lastUnderscore);
    const mk = pKey.slice(lastUnderscore + 1);
    const expense = fixedExpenses.find((e) => e.id === expenseId);
    if (!expense) return;
    pagosRows.push([expense.name, monthLabelFromKey(mk), payments[pKey].paidDate || "", expense.amount, expense.category || ""]);
  });
  const wsPagos = XLSX.utils.aoa_to_sheet(pagosRows);
  wsPagos["!cols"] = [{ wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsPagos, "Historial de pagos");

  // ---- Gastos express (todos) ----
  const expressRows = [["Fecha", "Categoría", "Comentario", "Cuenta", "Monto"]];
  [...quickExpenses]
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((e) => {
      const acc = accounts.find((a) => a.id === e.accountId);
      expressRows.push([e.date, e.category || "", e.comment || "", acc?.name || "", e.amount]);
    });
  const wsExpress = XLSX.utils.aoa_to_sheet(expressRows);
  wsExpress["!cols"] = [{ wch: 12 }, { wch: 16 }, { wch: 30 }, { wch: 16 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsExpress, "Gastos express");

  const base64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
  const fileName = `libro-de-cuentas-historial.xlsx`;
  const fileUri = FileSystem.cacheDirectory + fileName;

  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      dialogTitle: "Historial completo",
      UTI: "com.microsoft.excel.xlsx",
    });
  }

  return fileUri;
}
