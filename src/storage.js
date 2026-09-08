import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  INCOMES: "mf_incomes",
  FIXED_EXPENSES: "mf_fixed_expenses",
  PAYMENTS: "mf_payments",
  QUICK_EXPENSES: "mf_quick_expenses",
  ACCOUNTS: "mf_accounts",
};

async function load(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn("Error leyendo", key, e);
    return fallback;
  }
}

async function persist(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn("Error guardando", key, e);
    return false;
  }
}

export const Storage = {
  getIncomes: () => load(KEYS.INCOMES, []),
  saveIncomes: (v) => persist(KEYS.INCOMES, v),

  getFixedExpenses: () => load(KEYS.FIXED_EXPENSES, []),
  saveFixedExpenses: (v) => persist(KEYS.FIXED_EXPENSES, v),

  // payments: { "<expenseId>_<YYYY-MM>": { paid: true, paidDate: "2026-09-05" } }
  getPayments: () => load(KEYS.PAYMENTS, {}),
  savePayments: (v) => persist(KEYS.PAYMENTS, v),

  getQuickExpenses: () => load(KEYS.QUICK_EXPENSES, []),
  saveQuickExpenses: (v) => persist(KEYS.QUICK_EXPENSES, v),

  getAccounts: () => load(KEYS.ACCOUNTS, [{ id: "acc_default", name: "Efectivo", initialBalance: 0 }]),
  saveAccounts: (v) => persist(KEYS.ACCOUNTS, v),
};
