import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { COLORS } from "./src/theme";
import { Storage } from "./src/storage";
import { ensureNotificationPermissions, setupAndroidChannel, scheduleExpenseReminders } from "./src/notifications";
import SummaryScreen from "./src/screens/SummaryScreen";
import IncomeScreen from "./src/screens/IncomeScreen";
import FixedExpensesScreen from "./src/screens/FixedExpensesScreen";
import QuickExpenseScreen from "./src/screens/QuickExpenseScreen";
import AccountsScreen from "./src/screens/AccountsScreen";

const TABS = [
  { key: "summary", label: "Resumen" },
  { key: "income", label: "Ingresos" },
  { key: "fixed", label: "Fijos" },
  { key: "quick", label: "Express" },
  { key: "accounts", label: "Cuentas" },
];

function Root() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState("summary");
  const [loaded, setLoaded] = useState(false);

  const [incomes, setIncomesState] = useState([]);
  const [fixedExpenses, setFixedExpensesState] = useState([]);
  const [payments, setPaymentsState] = useState({});
  const [quickExpenses, setQuickExpensesState] = useState([]);
  const [accounts, setAccountsState] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  useEffect(() => {
    (async () => {
      const [inc, fx, pay, qx, acc] = await Promise.all([
        Storage.getIncomes(),
        Storage.getFixedExpenses(),
        Storage.getPayments(),
        Storage.getQuickExpenses(),
        Storage.getAccounts(),
      ]);
      setIncomesState(inc);
      setFixedExpensesState(fx);
      setPaymentsState(pay);
      setQuickExpensesState(qx);
      setAccountsState(acc);
      setLoaded(true);

      // Notificaciones: pedir permiso, preparar canal y re-programar avisos de todos los gastos fijos existentes
      try {
        await setupAndroidChannel();
        const granted = await ensureNotificationPermissions();
        if (granted) {
          for (const expense of fx) {
            await scheduleExpenseReminders(expense);
          }
        }
      } catch (e) {
        // Si falla (p.ej. corriendo en Expo Go sin soporte), la app sigue funcionando sin notificaciones.
      }
    })();
  }, []);

  const setIncomes = useCallback((next) => {
    setIncomesState(next);
    Storage.saveIncomes(next);
  }, []);

  const setFixedExpenses = useCallback((next) => {
    setFixedExpensesState(next);
    Storage.saveFixedExpenses(next);
  }, []);

  const setPayments = useCallback((next) => {
    setPaymentsState(next);
    Storage.savePayments(next);
  }, []);

  const setQuickExpenses = useCallback((next) => {
    setQuickExpensesState(next);
    Storage.saveQuickExpenses(next);
  }, []);

  const setAccounts = useCallback((next) => {
    setAccountsState(next);
    Storage.saveAccounts(next);
  }, []);

  if (!loaded) {
    return (
      <View style={[styles.safe, styles.centered, { paddingTop: insets.top }]}>
        <Text style={{ color: COLORS.inkSoft }}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <Text style={styles.brand}>Libro de Cuentas</Text>

      <View style={styles.content}>
        {tab === "summary" && (
          <SummaryScreen
            incomes={incomes}
            fixedExpenses={fixedExpenses}
            quickExpenses={quickExpenses}
            payments={payments}
            accounts={accounts}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
          />
        )}
        {tab === "income" && (
          <IncomeScreen
            incomes={incomes}
            setIncomes={setIncomes}
            currentMonth={currentMonth}
            accounts={accounts}
          />
        )}
        {tab === "fixed" && (
          <FixedExpensesScreen
            fixedExpenses={fixedExpenses}
            setFixedExpenses={setFixedExpenses}
            payments={payments}
            setPayments={setPayments}
            currentMonth={currentMonth}
            accounts={accounts}
          />
        )}
        {tab === "quick" && (
          <QuickExpenseScreen
            quickExpenses={quickExpenses}
            setQuickExpenses={setQuickExpenses}
            currentMonth={currentMonth}
            accounts={accounts}
          />
        )}
        {tab === "accounts" && (
          <AccountsScreen
            accounts={accounts}
            setAccounts={setAccounts}
            incomes={incomes}
            fixedExpenses={fixedExpenses}
            quickExpenses={quickExpenses}
            payments={payments}
          />
        )}
      </View>

      <View style={[styles.tabBar, { paddingBottom: 6 + insets.bottom }]}>
        {TABS.map((t) => (
          <TouchableOpacity key={t.key} style={styles.tabItem} onPress={() => setTab(t.key)}>
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
            {tab === t.key && <View style={styles.tabDot} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Root />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.paper },
  centered: { alignItems: "center", justifyContent: "center" },
  brand: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.inkSoft,
    textAlign: "center",
    paddingTop: 6,
    paddingBottom: 4,
    letterSpacing: 0.3,
  },
  content: { flex: 1 },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    backgroundColor: COLORS.card,
    paddingTop: 6,
  },
  tabItem: { flex: 1, alignItems: "center", paddingVertical: 8 },
  tabLabel: { fontSize: 11, color: COLORS.inkSoft, fontWeight: "500" },
  tabLabelActive: { color: COLORS.ink, fontWeight: "700" },
  tabDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.ink, marginTop: 5 },
});
