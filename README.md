# Mis Finanzas (React Native / Expo)

App personal de finanzas:

- **Ingresos** no fijos, asignados a una cuenta.
- **Gastos fijos** con día de vencimiento, categoría y cuenta de pago — se marcan como pagados cada mes.
- **Gastos express** (gastos sueltos del día a día) con categoría, cuenta y comentario.
- **Cuentas/billeteras** (Efectivo, Nequi, Banco, etc.) con saldo real calculado automáticamente.
- **Notificaciones** el día del vencimiento y 7 días antes de cada gasto fijo.
- **Exportar historial completo a Excel** (todos los meses) desde el Resumen, con opción de compartir.

Todo se guarda en el celular con `AsyncStorage`, sin backend ni internet.

## Estructura

```
mis-finanzas-app/
├── App.js                        # entrada, tabs y carga/guardado de datos
├── app.json                      # configuración de Expo
├── package.json
├── babel.config.js
└── src/
    ├── theme.js                  # colores y helpers de formato
    ├── storage.js                # capa de persistencia (AsyncStorage)
    ├── exportExcel.js             # genera el .xlsx con TODO el historial y abre el selector para compartir/guardar
    ├── notifications.js           # permisos, canal Android y programación de avisos por gasto fijo
    ├── components/
    │   └── BottomSheet.js        # modal deslizable reutilizable
    └── screens/
        ├── SummaryScreen.js      # saldo del mes, navegación por mes, pendientes, botón de exportar
        ├── IncomeScreen.js       # registrar/editar/borrar ingresos, con cuenta destino
        ├── FixedExpensesScreen.js# gastos fijos: categoría, cuenta, estado pagado/pendiente, notificaciones
        ├── QuickExpenseScreen.js # gastos express en recuadros: categoría, cuenta y comentario
        └── AccountsScreen.js     # cuentas/billeteras con saldo real calculado
```

## Cómo correrla (probar en tu celular sin compilar)

1. Instala dependencias (ya incluyen `xlsx`, `expo-file-system`, `expo-sharing`, `expo-notifications` y `react-native-safe-area-context`):
   ```bash
   cd mis-finanzas-app
   rm -rf node_modules package-lock.json
   npm install
   npx expo install --fix   # alinea TODAS las versiones al SDK de Expo que tengas
   npx expo start -c        # -c limpia caché de Metro, útil tras cambiar versiones
   ```

### ⚠️ Importante sobre las notificaciones

Desde hace un par de versiones de Expo, **las notificaciones programadas dejaron de funcionar de forma confiable en Expo Go** en Android; necesitan un *development build* (una versión compilada de tu propia app, no el genérico Expo Go). Si al abrir la app en Expo Go ves que no llegan los avisos, es por esto — el resto de la app (ingresos, gastos, cuentas, Excel) funciona igual. Para tener notificaciones reales:

```bash
npx expo install expo-dev-client
eas build --platform android --profile development
```

Instala ese `.apk` en tu celular en vez de usar Expo Go, y ahí sí deberían llegar los recordatorios. Si vas a compilar el `.apk` final de todos modos (como planeas), no necesitas hacer nada extra — ahí las notificaciones funcionan normal.
2. Inicia el servidor de desarrollo:
   ```bash
   npx expo start
   ```
3. Instala **Expo Go** (App Store / Play Store) en tu celular y escanea el código QR que aparece en la terminal. La app corre en vivo en tu teléfono.

## Cómo compilarla como app instalable (APK / IPA)

Con **EAS Build** (el servicio de Expo, gratis para uso personal con límites):

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview   # genera un .apk instalable
eas build --platform ios --profile preview        # requiere cuenta de Apple Developer para IPA
```

El comando de Android te da un link para descargar el `.apk` y pasarlo directo a tu celular (no necesita Play Store). Para iOS necesitas una cuenta de Apple Developer (99 USD/año) o instalarlo vía Expo Go/desarrollo local con Xcode.

## Notas de diseño

- **Cuentas**: representan dónde está físicamente tu dinero (Efectivo, Nequi, Banco...). Cada cuenta tiene un saldo inicial que tú defines, y su saldo actual se calcula solo: inicial + ingresos asignados − gastos express asignados − gastos fijos **pagados** asignados. Así sabes cuánto deberías tener y en qué cuenta.
- **Ingresos**: se registran libremente (monto, origen, cuenta, fecha) porque son variables mes a mes.
- **Gastos fijos**: se crean una sola vez con nombre, monto, categoría, cuenta de pago y día del mes en que vencen. Cada mes los marcas como pagados con el check; el estado de pago se guarda por mes, así que en octubre vuelven a aparecer como pendientes. Al guardarlos se programan automáticamente los recordatorios.
- **Gastos express**: gastos sueltos del día a día, en recuadros con monto, categoría, cuenta y comentario. Restan del saldo proyectado del mes y del saldo real de su cuenta.
- El **Resumen** muestra el saldo proyectado del mes (ingresos − gastos fijos − gastos express) y la lista de lo que falta por pagar, ordenada por día de vencimiento.
- **Notificaciones**: cada gasto fijo programa dos avisos recurrentes cada mes — el día del vencimiento y 7 días antes (a las 9:00 a.m.). Se cancelan solos si borras el gasto, y se reprograman si lo editas.
- **Exportar a Excel**: el botón en Resumen genera un `.xlsx` con TODO el historial — hojas de Resumen mensual (mes a mes), Cuentas, Ingresos, Gastos fijos, Historial de pagos y Gastos express — y abre el selector nativo para guardarlo o compartirlo (WhatsApp, Drive, correo, etc).
- Todos los datos quedan solo en tu celular (AsyncStorage), no se sincronizan a ningún servidor.

## Fix de pantalla completa en Android (Samsung y similares)

El `SafeAreaView` de `react-native` **no aplica el margen superior en Android**, solo en iOS — por eso el encabezado se metía debajo de la barra de estado/cámara en tu Samsung. Ahora la app usa `react-native-safe-area-context` (`SafeAreaProvider` + `useSafeAreaInsets`), que sí calcula los márgenes reales del dispositivo (notch, cámara perforada, barra de gestos) en Android e iOS por igual. Si en algún dispositivo específico se sigue viendo algo pegado al borde, dime el modelo y ajusto el padding correspondiente.

## Personalizar

- Categorías de gastos fijos o express, iconos, notificaciones de vencimiento próximo, o filtros/gráficas en el Excel son fáciles de agregar sobre esta base — el estado vive todo en `App.js` y se pasa a cada pantalla por props.
