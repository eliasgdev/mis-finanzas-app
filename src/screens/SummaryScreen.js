import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from "react-native";
import { COLORS, fmtMoney, monthKey, MESES } from "../theme";
import { exportFullHistoryToExcel } from "../exportExcel";

export default function SummaryScreen({
  incomes,
  fixedExpenses,
  quickExpenses,
  payments,
  accounts,
  currentMonth,
  setCurrentMonth,
}) {
  const [exporting, setExporting] = useState(false);
  const mKey = monthKey(currentMonth);

  const income = useMemo(
    () => incomes.filter((i) => i.date.startsWith(mKey)).reduce((a, b) => a + b.amount, 0),
    [incomes, mKey]
  );

  const quickTotal = useMemo(
    () => quickExpenses.filter((e) => e.date.startsWith(mKey)).reduce((a, b) => a + b.amount, 0),
    [quickExpenses, mKey]
  );

  const totalFixed = fixedExpenses.reduce((a, b) => a + b.amount, 0);
  const paidFixed = fixedExpenses
    .filter((e) => payments[`${e.id}_${mKey}`]?.paid)
    .reduce((a, b) => a + b.amount, 0);
  const pendingFixed = totalFixed - paidFixed;

  const balance = income - totalFixed - quickTotal;

  const pending = useMemo(
    () =>
      [...fixedExpenses]
        .filter((e) => !payments[`${e.id}_${mKey}`]?.paid)
        .sort((a, b) => a.dueDay - b.dueDay),
    [fixedExpenses, payments, mKey]
  );

  function shiftMonth(delta) {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() + delta);
    setCurrentMonth(d);
  }

  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    try {
      await exportFullHistoryToExcel({ incomes, fixedExpenses, quickExpenses, payments, accounts });
    } catch (e) {
      Alert.alert("No se pudo exportar", "Intenta de nuevo en un momento.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => shiftMonth(-1)} style={styles.navBtn}>
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.navLabel}>
          {MESES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>
        <TouchableOpacity onPress={() => shiftMonth(1)} style={styles.navBtn}>
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.balanceBlock}>
        <Text style={styles.balanceCaption}>Saldo proyectado del mes</Text>
        <Text style={[styles.balanceFigure, balance < 0 && { color: COLORS.rust }]}>{fmtMoney(balance)}</Text>
        <Text style={styles.balanceSub}>Ingresos − gastos fijos − gastos express</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>Ingresos</Text>
          <Text style={[styles.pillValue, { color: COLORS.gold }]}>{fmtMoney(income)}</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>Gastos express</Text>
          <Text style={[styles.pillValue, { color: COLORS.rust }]}>{fmtMoney(quickTotal)}</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>Fijos pagados</Text>
          <Text style={[styles.pillValue, { color: COLORS.ink }]}>{fmtMoney(paidFixed)}</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>Fijos pendientes</Text>
          <Text style={[styles.pillValue, { color: COLORS.rust }]}>{fmtMoney(pendingFixed)}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.exportBtn} onPress={handleExport} disabled={exporting}>
        <Text style={styles.exportBtnText}>
          {exporting ? "Generando..." : "⬇  Descargar historial en Excel"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Pendientes por pagar</Text>
      <FlatList
        data={pending}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {fixedExpenses.length === 0
              ? "No has agregado gastos fijos todavía."
              : "Todo pagado este mes. 🎉"}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.pendingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingName}>{item.name}</Text>
              <Text style={styles.pendingDue}>Día {item.dueDay}</Text>
            </View>
            <Text style={styles.pendingAmount}>{fmtMoney(item.amount)}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  nav: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 18, marginTop: 8 },
  navBtn: { padding: 6 },
  navArrow: { fontSize: 20, color: COLORS.inkSoft },
  navLabel: { fontSize: 19, fontWeight: "600", color: COLORS.ink, minWidth: 170, textAlign: "center", textTransform: "capitalize" },
  balanceBlock: { alignItems: "center", marginVertical: 18 },
  balanceCaption: { fontSize: 12, color: COLORS.inkSoft, marginBottom: 4 },
  balanceFigure: { fontSize: 38, fontWeight: "700", color: COLORS.ink },
  balanceSub: { fontSize: 11, color: COLORS.inkSoft, marginTop: 4, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  pill: {
    flexBasis: "47%",
    flexGrow: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.card,
    padding: 12,
  },
  pillLabel: { fontSize: 10.5, color: COLORS.inkSoft, marginBottom: 4 },
  pillValue: { fontSize: 15, fontWeight: "700" },
  exportBtn: {
    borderWidth: 1,
    borderColor: COLORS.ink,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  exportBtnText: { color: COLORS.ink, fontWeight: "600", fontSize: 13.5 },
  sectionTitle: { fontSize: 13, fontWeight: "600", color: COLORS.inkSoft, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  empty: { textAlign: "center", color: COLORS.inkSoft, marginTop: 30, lineHeight: 20 },
  pendingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  pendingName: { fontSize: 14.5, fontWeight: "600", color: COLORS.ink },
  pendingDue: { fontSize: 12, color: COLORS.inkSoft, marginTop: 2 },
  pendingAmount: { fontSize: 14.5, fontWeight: "700", color: COLORS.rust },
});
