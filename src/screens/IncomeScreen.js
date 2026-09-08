import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from "react-native";
import { COLORS, fmtMoney, monthKey } from "../theme";
import BottomSheet from "../components/BottomSheet";

export default function IncomeScreen({ incomes, setIncomes, currentMonth, accounts }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id);
  const [date, setDate] = useState(todayStr());

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  const monthIncomes = useMemo(() => {
    const key = monthKey(currentMonth);
    return incomes
      .filter((i) => i.date.startsWith(key))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [incomes, currentMonth]);

  const total = monthIncomes.reduce((a, b) => a + b.amount, 0);

  function openAdd() {
    setEditingId(null);
    setAmount("");
    setSource("");
    setAccountId(accounts[0]?.id);
    setDate(todayStr());
    setSheetOpen(true);
  }

  function openEdit(item) {
    setEditingId(item.id);
    setAmount(String(item.amount));
    setSource(item.source);
    setAccountId(item.accountId || accounts[0]?.id);
    setDate(item.date);
    setSheetOpen(true);
  }

  function save() {
    const num = parseFloat(amount.replace(/[^0-9.]/g, ""));
    if (!num || num <= 0) return;
    if (editingId) {
      setIncomes(
        incomes.map((i) => (i.id === editingId ? { ...i, amount: num, source, accountId, date } : i))
      );
    } else {
      setIncomes([
        ...incomes,
        { id: "inc_" + Date.now(), amount: num, source: source.trim() || "Ingreso", accountId, date },
      ]);
    }
    setSheetOpen(false);
  }

  function remove() {
    setIncomes(incomes.filter((i) => i.id !== editingId));
    setSheetOpen(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.totalBlock}>
        <Text style={styles.totalLabel}>Ingresos del mes</Text>
        <Text style={styles.totalValue}>{fmtMoney(total)}</Text>
      </View>

      <FlatList
        data={monthIncomes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <Text style={styles.empty}>Aún no registras ingresos este mes.{"\n"}Toca "+" para agregar el primero.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => openEdit(item)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowSource}>{item.source}</Text>
              <Text style={styles.rowDate}>{formatDate(item.date)}</Text>
            </View>
            <Text style={styles.rowAmount}>+{fmtMoney(item.amount)}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={openAdd}>
        <Text style={styles.fabText}>＋  Registrar ingreso</Text>
      </TouchableOpacity>

      <BottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editingId ? "Editar ingreso" : "Nuevo ingreso"}
      >
        <Text style={styles.label}>Monto</Text>
        <View style={styles.amountBox}>
          <Text style={styles.amountSign}>$</Text>
          <TextInput
            style={styles.amountInput}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            placeholderTextColor={COLORS.inkSoft}
          />
        </View>

        <Text style={styles.label}>Origen</Text>
        <TextInput
          style={styles.textInput}
          value={source}
          onChangeText={setSource}
          placeholder="Ej. Freelance, venta, propina..."
          placeholderTextColor={COLORS.inkSoft}
        />

        <Text style={styles.label}>Entra a la cuenta</Text>
        <View style={styles.chipGrid}>
          {accounts.map((a) => (
            <TouchableOpacity
              key={a.id}
              style={[styles.catChip, accountId === a.id && styles.catChipActive]}
              onPress={() => setAccountId(a.id)}
            >
              <Text style={[styles.catChipText, accountId === a.id && styles.catChipTextActive]}>{a.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Fecha (AAAA-MM-DD)</Text>
        <TextInput
          style={styles.textInput}
          value={date}
          onChangeText={setDate}
          placeholder="2026-09-07"
          placeholderTextColor={COLORS.inkSoft}
        />

        <View style={styles.actions}>
          {editingId && (
            <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={remove}>
              <Text style={{ color: COLORS.rust, fontWeight: "600" }}>Eliminar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => setSheetOpen(false)}>
            <Text style={{ color: COLORS.inkSoft, fontWeight: "600" }}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={save}>
            <Text style={{ color: COLORS.paper, fontWeight: "600" }}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </View>
  );
}

function formatDate(d) {
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  totalBlock: { alignItems: "center", marginVertical: 20 },
  totalLabel: { color: COLORS.inkSoft, fontSize: 12, marginBottom: 4 },
  totalValue: { color: COLORS.gold, fontSize: 34, fontWeight: "700" },
  empty: { textAlign: "center", color: COLORS.inkSoft, marginTop: 60, lineHeight: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  rowSource: { fontSize: 15, fontWeight: "600", color: COLORS.ink },
  rowDate: { fontSize: 12, color: COLORS.inkSoft, marginTop: 2 },
  rowAmount: { fontSize: 15, fontWeight: "700", color: COLORS.gold },
  fab: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: COLORS.ink,
    borderRadius: 26,
    paddingVertical: 15,
    alignItems: "center",
  },
  fabText: { color: COLORS.paper, fontWeight: "700", fontSize: 15 },
  label: { fontSize: 12, color: COLORS.inkSoft, marginTop: 14, marginBottom: 6 },
  amountBox: {
    flexDirection: "row",
    alignItems: "baseline",
    borderBottomWidth: 2,
    borderBottomColor: COLORS.line,
    paddingBottom: 8,
  },
  amountSign: { fontSize: 22, color: COLORS.inkSoft, marginRight: 6 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: "700", color: COLORS.ink, padding: 0 },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14.5,
    backgroundColor: COLORS.card,
    color: COLORS.ink,
  },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: {
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.card,
  },
  catChipActive: { backgroundColor: COLORS.ink, borderColor: COLORS.ink },
  catChipText: { fontSize: 13, color: COLORS.inkSoft },
  catChipTextActive: { color: COLORS.paper },
  actions: { flexDirection: "row", gap: 10, marginTop: 22 },
  btn: { flex: 1, paddingVertical: 13, borderRadius: 10, alignItems: "center" },
  btnPrimary: { backgroundColor: COLORS.ink },
  btnGhost: { borderWidth: 1, borderColor: COLORS.line },
  btnDanger: { backgroundColor: COLORS.rustBg },
});
