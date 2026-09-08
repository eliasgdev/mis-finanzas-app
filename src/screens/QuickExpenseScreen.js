import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from "react-native";
import { COLORS, fmtMoney, monthKey, EXPENSE_CATEGORIES } from "../theme";
import BottomSheet from "../components/BottomSheet";

export default function QuickExpenseScreen({ quickExpenses, setQuickExpenses, currentMonth, accounts }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [accountId, setAccountId] = useState(accounts[0]?.id);
  const [date, setDate] = useState(todayStr());

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  const monthExpenses = useMemo(() => {
    const key = monthKey(currentMonth);
    return quickExpenses
      .filter((e) => e.date.startsWith(key))
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  }, [quickExpenses, currentMonth]);

  const total = monthExpenses.reduce((a, b) => a + b.amount, 0);

  function openAdd() {
    setEditingId(null);
    setAmount("");
    setComment("");
    setCategory(EXPENSE_CATEGORIES[0]);
    setAccountId(accounts[0]?.id);
    setDate(todayStr());
    setSheetOpen(true);
  }

  function openEdit(item) {
    setEditingId(item.id);
    setAmount(String(item.amount));
    setComment(item.comment);
    setCategory(item.category || EXPENSE_CATEGORIES[0]);
    setAccountId(item.accountId || accounts[0]?.id);
    setDate(item.date);
    setSheetOpen(true);
  }

  function save() {
    const num = parseFloat(amount.replace(/[^0-9.]/g, ""));
    if (!num || num <= 0) return;
    if (editingId) {
      setQuickExpenses(
        quickExpenses.map((e) =>
          e.id === editingId ? { ...e, amount: num, comment, category, accountId, date } : e
        )
      );
    } else {
      setQuickExpenses([
        ...quickExpenses,
        {
          id: "qx_" + Date.now(),
          amount: num,
          comment: comment.trim(),
          category,
          accountId,
          date,
          createdAt: Date.now(),
        },
      ]);
    }
    setSheetOpen(false);
  }

  function remove() {
    setQuickExpenses(quickExpenses.filter((e) => e.id !== editingId));
    setSheetOpen(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.totalBlock}>
        <Text style={styles.totalLabel}>Gastos express del mes</Text>
        <Text style={styles.totalValue}>{fmtMoney(total)}</Text>
      </View>

      <FlatList
        data={monthExpenses}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={{ gap: 10, paddingBottom: 100 }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Aún no registras gastos express este mes.{"\n"}Ideal para esos gastos sueltos del día a día.
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openEdit(item)}>
            <Text style={styles.cardAmount}>{fmtMoney(item.amount)}</Text>
            <Text style={styles.cardCategory}>{item.category}</Text>
            {!!item.comment && (
              <Text style={styles.cardComment} numberOfLines={2}>
                {item.comment}
              </Text>
            )}
            <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={openAdd}>
        <Text style={styles.fabText}>＋  Gasto express</Text>
      </TouchableOpacity>

      <BottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editingId ? "Editar gasto express" : "Nuevo gasto express"}
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

        <Text style={styles.label}>Pagado desde</Text>
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

        <Text style={styles.label}>Comentario (opcional)</Text>
        <TextInput
          style={[styles.textInput, { minHeight: 60, textAlignVertical: "top" }]}
          value={comment}
          onChangeText={setComment}
          placeholder="Ej. Taxi al médico, antojo..."
          placeholderTextColor={COLORS.inkSoft}
          multiline
        />

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
  return dt.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  totalBlock: { alignItems: "center", marginVertical: 20 },
  totalLabel: { color: COLORS.inkSoft, fontSize: 12, marginBottom: 4 },
  totalValue: { color: COLORS.rust, fontSize: 34, fontWeight: "700" },
  empty: { textAlign: "center", color: COLORS.inkSoft, marginTop: 60, lineHeight: 20, width: "100%" },
  card: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 14,
    minHeight: 100,
  },
  cardAmount: { fontSize: 17, fontWeight: "700", color: COLORS.rust, marginBottom: 2 },
  cardCategory: { fontSize: 11.5, color: COLORS.inkSoft, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.3 },
  cardComment: { fontSize: 12.5, color: COLORS.ink, lineHeight: 16, flex: 1 },
  cardDate: { fontSize: 11, color: COLORS.inkSoft, marginTop: 8, textTransform: "capitalize" },
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
