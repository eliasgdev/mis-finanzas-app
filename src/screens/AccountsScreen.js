import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from "react-native";
import { COLORS, fmtMoney, computeAccountBalance } from "../theme";
import BottomSheet from "../components/BottomSheet";

export default function AccountsScreen({ accounts, setAccounts, incomes, fixedExpenses, quickExpenses, payments }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [initialBalance, setInitialBalance] = useState("");

  const totalBalance = accounts.reduce(
    (a, acc) => a + computeAccountBalance(acc, incomes, fixedExpenses, quickExpenses, payments),
    0
  );

  function openAdd() {
    setEditingId(null);
    setName("");
    setInitialBalance("");
    setSheetOpen(true);
  }

  function openEdit(acc) {
    setEditingId(acc.id);
    setName(acc.name);
    setInitialBalance(String(acc.initialBalance));
    setSheetOpen(true);
  }

  function save() {
    const num = parseFloat((initialBalance || "0").replace(/[^0-9.-]/g, "")) || 0;
    if (!name.trim()) return;
    if (editingId) {
      setAccounts(accounts.map((a) => (a.id === editingId ? { ...a, name: name.trim(), initialBalance: num } : a)));
    } else {
      setAccounts([...accounts, { id: "acc_" + Date.now(), name: name.trim(), initialBalance: num }]);
    }
    setSheetOpen(false);
  }

  function remove() {
    if (accounts.length <= 1) return;
    setAccounts(accounts.filter((a) => a.id !== editingId));
    setSheetOpen(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.totalBlock}>
        <Text style={styles.totalLabel}>Tienes en total</Text>
        <Text style={[styles.totalValue, totalBalance < 0 && { color: COLORS.rust }]}>{fmtMoney(totalBalance)}</Text>
      </View>

      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => {
          const bal = computeAccountBalance(item, incomes, fixedExpenses, quickExpenses, payments);
          return (
            <TouchableOpacity style={styles.row} onPress={() => openEdit(item)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowSub}>Saldo inicial: {fmtMoney(item.initialBalance)}</Text>
              </View>
              <Text style={[styles.rowBalance, bal < 0 && { color: COLORS.rust }]}>{fmtMoney(bal)}</Text>
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity style={styles.fab} onPress={openAdd}>
        <Text style={styles.fabText}>＋  Nueva cuenta</Text>
      </TouchableOpacity>

      <BottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editingId ? "Editar cuenta" : "Nueva cuenta"}
      >
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.textInput}
          value={name}
          onChangeText={setName}
          placeholder="Ej. Nequi, Bancolombia, Efectivo..."
          placeholderTextColor={COLORS.inkSoft}
        />

        <Text style={styles.label}>Saldo inicial (lo que tienes hoy en ella)</Text>
        <View style={styles.amountBox}>
          <Text style={styles.amountSign}>$</Text>
          <TextInput
            style={styles.amountInput}
            keyboardType="decimal-pad"
            value={initialBalance}
            onChangeText={setInitialBalance}
            placeholder="0"
            placeholderTextColor={COLORS.inkSoft}
          />
        </View>

        <View style={styles.actions}>
          {editingId && accounts.length > 1 && (
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
  totalValue: { color: COLORS.gold, fontSize: 34, fontWeight: "700" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  rowName: { fontSize: 15, fontWeight: "600", color: COLORS.ink },
  rowSub: { fontSize: 12, color: COLORS.inkSoft, marginTop: 2 },
  rowBalance: { fontSize: 16, fontWeight: "700", color: COLORS.gold },
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
  actions: { flexDirection: "row", gap: 10, marginTop: 22 },
  btn: { flex: 1, paddingVertical: 13, borderRadius: 10, alignItems: "center" },
  btnPrimary: { backgroundColor: COLORS.ink },
  btnGhost: { borderWidth: 1, borderColor: COLORS.line },
  btnDanger: { backgroundColor: COLORS.rustBg },
});
