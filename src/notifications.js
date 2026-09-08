import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermissions() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") return true;
  const { status: asked } = await Notifications.requestPermissionsAsync();
  return asked === "granted";
}

export async function setupAndroidChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("pagos", {
      name: "Recordatorios de pago",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

// Día "una semana antes" del vencimiento, evitando problemas con meses de distinta longitud.
// Si el vencimiento cae en los primeros 7 días del mes, el aviso se manda el día 28 (seguro en cualquier mes).
function weekBeforeDay(dueDay) {
  const d = dueDay - 7;
  return d > 0 ? d : 28 + d;
}

function idsFor(expenseId) {
  return {
    due: `mf_due_${expenseId}`,
    week: `mf_week_${expenseId}`,
  };
}

export async function scheduleExpenseReminders(expense) {
  const { due, week } = idsFor(expense.id);
  await cancelExpenseReminders(expense.id);

  await Notifications.scheduleNotificationAsync({
    identifier: due,
    content: {
      title: "Pago vence hoy",
      body: `${expense.name} · ${formatMoney(expense.amount)}`,
      channelId: "pagos",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
      day: expense.dueDay,
      hour: 9,
      minute: 0,
      repeats: true,
    },
  });

  await Notifications.scheduleNotificationAsync({
    identifier: week,
    content: {
      title: "Pago en una semana",
      body: `${expense.name} vence el día ${expense.dueDay} · ${formatMoney(expense.amount)}`,
      channelId: "pagos",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
      day: weekBeforeDay(expense.dueDay),
      hour: 9,
      minute: 0,
      repeats: true,
    },
  });
}

export async function cancelExpenseReminders(expenseId) {
  const { due, week } = idsFor(expenseId);
  try {
    await Notifications.cancelScheduledNotificationAsync(due);
  } catch (e) {}
  try {
    await Notifications.cancelScheduledNotificationAsync(week);
  } catch (e) {}
}

function formatMoney(n) {
  return "$" + Math.round(n).toLocaleString("es-CO");
}
