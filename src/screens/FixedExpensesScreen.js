import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from "react-native";
import { COLORS, fmtMoney, monthKey, EXPENSE_CATEGORIES } from "../theme";
import BottomSheet from "../components/BottomSheet";
import { scheduleExpenseReminders, cancelExpenseReminders } from "../notifications";

export default function FixedExpensesScreen({
  fixedExpenses, setFixedExpenses, payments, setPayments, currentMonth, accounts,
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [accountId, setAccountId] = useState(accounts[0]?.id);

  const mKey = monthKey(currentMonth);
  const today = new Date();
  const isCurrentRealMonth = monthKey(today) === mKey;

  const sorted = useMemo(() => [...fixedExpenses].sort((a, b) => a.dueDay - b.dueDay), [fixedExpenses]);

  const total = fixedExpenses.reduce((a, b) => a + b.amount, 0);
  const paidCount = fixedExpenses.filter((e) => payments[`${e.id}_${mKey}`]?.paid).length;

  function togglePaid(expenseId) {
    const pKey = `${expenseId}_${mKey}`;
    const current = payments[pKey]?.paid;
    setPayments({
      ...payments,
      [pKey]: { paid: !current, paidDate: !current ? new Date().toISOString().slice(0, 10) : null },
    });
  }

  function openAdd() {
    setEditingId(null);
    setName("");
    setAmount("");
    setDueDay("");
    setCategory(EXPENSE_CATEGORIES[0]);
    setAccountId(accounts[0]?.id);
    setSheetOpen(true);
  }

  function openEdit(item) {
    setEditingId(item.id);
    setName(item.name);
    setAmount(String(item.amount));
    setDueDay(String(item.dueDay));
    setCategory(item.category || EXPENSE_CATEGORIES[0]);
    setAccountId(item.accountId || accounts[0]?.id);
    setSheetOpen(true);
  }

  async function save() {
    const num = parseFloat(amount.replace(/[^0-9.]/g, ""));
    const day = Math.min(31, Math.max(1, parseInt(dueDay || "1", 10)));
    if (!num || num <= 0 || !name.trim()) return;

    let saved;
    if (editingId) {
      saved = { id: editingId, name: name.trim(), amount: num, dueDay: day, category, accountId };
      setFixedExpenses(fixedExpenses.map((e) => (e.id === editingId ? saved : e)));
    } else {
      saved = { id: "fx_" + Date.now(), name: name.trim(), amount: num, dueDay: day, category, accountId };
      setFixedExpenses([...fixedExpenses, saved]);
    }
    setSheetOpen(false);
    try {
      await scheduleExpenseReminders(saved);
    } catch (e) {}
  }

  async function remove() {
    setFixedExpenses(fixedExpenses.filter((e) => e.id !== editingId));
    setSheetOpen(false);
    try {
      await cancelExpenseReminders(editingId);
    } catch (e) {}
  }

  function dueStatus(dueDay) {
    if (!isCurrentRealMonth) return null;
    const diff = dueDay - today.getDate();
    if (diff < 0) return { text: `Venció hace ${Math.abs(diff)} día(s)`, overdue: true };
    if (diff === 0) return { text: "Vence hoy", overdue: true };
    return { text: `Vence en ${diff} día(s)`, overdue: false };
  }

  return (
    <View style={styles.container}>
      <View style={styles.totalBlock}>
        <Text style={styles.totalLabel}>Gastos fijos del mes · {paidCount}/{fixedExpenses.length} pagados</Text>
        <Text style={styles.totalValue}>{fmtMoney(total)}</Text>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <Text style={styles.empty}>Aún no tienes gastos fijos.{"\n"}Agrega arriendo, servicios, suscripciones...</Text>
        }
        renderItem={({ item }) => {
          const pKey = `${item.id}_${mKey}`;
          const paid = !!payments[pKey]?.paid;
          const status = dueStatus(item.dueDay);
          const acc = accounts.find((a) => a.id === item.accountId);
          return (
            <TouchableOpacity style={styles.row} onPress={() => openEdit(item)}>
              <TouchableOpacity
                style={[styles.checkbox, paid && styles.checkboxChecked]}
                onPress={() => togglePaid(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {paid && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.rowName, paid && styles.rowNamePaid]}>{item.name}</Text>
                <Text style={styles.rowDue}>
                  {item.category} · Día {item.dueDay} · {acc?.name || "Sin cuenta"}
                  {status ? `  ·  ${status.text}` : ""}
                </Text>
              </View>
              <Text style={[styles.rowAmount, paid && styles.rowAmountPaid]}>{fmtMoney(item.amount)}</Text>
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity style={styles.fab} onPress={openAdd}>
        <Text style={styles.fabText}>＋  Agregar gasto fijo</Text>
      </TouchableOpacity>

      <BottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editingId ? "Editar gasto fijo" : "Nuevo gasto fijo"}
      >
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.textInput}
          value={name}
          onChangeText={setName}
          placeholder="Ej. Arriendo, Internet, Netflix..."
          placeholderTextColor={COLORS.inkSoft}
        />

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

        <Text style={styles.label}>Día de vencimiento (1-31)</Text>
        <TextInput
          style={styles.textInput}
          value={dueDay}
          onChangeText={setDueDay}
          keyboardType="number-pad"
          placeholder="Ej. 5"
          placeholderTextColor={COLORS.inkSoft}
        />

        <Text style={styles.label}>Categoría</Text>
        <View style={styles.chipGrid}>
          {EXPENSE_CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.catChip, category === c && styles.catChipActive]}
              onPress={() => setCategory(c)}
            >
              <Text style={[styles.catChipText, category === c && styles.catChipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Se paga desde</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  totalBlock: { alignItems: "center", marginVertical: 20 },
  totalLabel: { color: COLORS.inkSoft, fontSize: 12, marginBottom: 4 },
  totalValue: { color: COLORS.rust, fontSize: 34, fontWeight: "700" },
  empty: { textAlign: "center", color: COLORS.inkSoft, marginTop: 60, lineHeight: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.line,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  checkmark: { color: COLORS.card, fontWeight: "700", fontSize: 14 },
  rowName: { fontSize: 15, fontWeight: "600", color: COLORS.ink },
  rowNamePaid: { color: COLORS.inkSoft, textDecorationLine: "line-through" },
  rowDue: { fontSize: 11.5, color: COLORS.inkSoft, marginTop: 2 },
  rowAmount: { fontSize: 15, fontWeight: "700", color: COLORS.rust },
  rowAmountPaid: { color: COLORS.inkSoft },
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
