# Reparaciones de datos aplicadas

Este documento registra dos reparaciones que hubo que hacer sobre datos ya
guardados en la base. **Ambas ya se aplicaron** sobre la base de desarrollo; queda
como referencia por si aparece el mismo problema en otra base (producción, una
copia, el entorno de otra persona).

Los scripts que se usaron eran de un solo uso y no se commitearon. Acá está el
procedimiento equivalente en `mongosh` para reproducirlo.

Antes de tocar cualquier cosa: **correr primero los comandos en modo lectura
(sin `updateMany`)**, revisar la lista, y recién después aplicar.

---

## 1. Planes de mantenimiento con periodicidad equivocada

### Qué pasó

El formulario de mantenimiento comparaba `form.periodo` contra los *labels*
("Trimestral", "Semestral") mientras el `<select>` guardaba los *values*. Como el
valor por defecto era el label "Trimestral", esta línea del código viejo se
cumplía siempre:

```js
if (periodo === "Trimestral") return { frequency: "custom", customDays: 90 };
```

Y del otro lado, para las frecuencias que sí existen en el backend
(`daily`, `weekly`, `monthly`, `yearly`), ganaba siempre el número de la caja
"cada N días", que venía en 90 por defecto. El resultado: **casi todos los planes
quedaban como `custom` con 90 días**, y su `nextDue` a 90 días en el futuro,
fuera de toda ventana de aviso. Es decir que nunca notificaban.

Además, al pasar un plan de `custom` a una frecuencia nativa el `customDays`
viejo quedaba en el documento (quedaba `frequency: "daily"` y `customDays: 45` al
mismo tiempo, que no significa nada). Eso también se corrigió en el service.

### Cómo reconocer los datos afectados

```js
use test   // el nombre de tu base

db.maintenanceplans.find(
  { frequency: "custom", customDays: 90 },
  { title: 1, machineId: 1, startDate: 1, nextDue: 1, _id: 0 }
)
```

Un plan trimestral legítimo es indistinguible de uno roto: los dos tienen
`customDays: 90`. Por eso hay que **mirar la lista y decidir**, no aplicar a ciegas.
Los que de verdad eran trimestrales se pueden dejar como están; el aviso de
mantenimiento ya anda bien para ellos.

### Aplicar

Recalcula `nextDue` como `startDate + 1 día` (la nueva frecuencia es diaria) y
borra `customDays`:

```js
db.maintenanceplans
  .find({ frequency: "custom", customDays: 90 })
  .forEach(function (plan) {
    var base = plan.startDate || new Date();
    var next = new Date(base.getTime());
    next.setDate(next.getDate() + 1);

    db.maintenanceplans.updateOne(
      { _id: plan._id },
      {
        $set: { frequency: "daily", nextDue: next },
        $unset: { customDays: "" },
      }
    );
  });
```

Verificar que no quedó nada:

```js
db.maintenanceplans.countDocuments({ frequency: "custom", customDays: 90 })  // 0
```

### Efecto secundario esperado

Al recalcular `nextDue` desde `startDate`, los planes cuya fecha de alta fue hace
más de un día quedan **ya vencidos**, y el próximo sweep les manda un aviso de
"venció". Es correcto (el mantenimiento venció y nadie lo hizo) pero conviene
saberlo antes de aplicar, porque genera notificaciones de golpe.

---

## 2. Máquinas sin `tipo`

### Qué pasó

El campo `Machine.tipo` (`"maquina"` / `"otro"`) se agregó después de que ya
existieran máquinas. Mongoose **no valida `required` en documentos que ya
existían**, así que quedaron equipos sin el campo.

Tanto Mis Máquinas como Mantenimiento reparten los equipos filtrando por tipo:

```js
items.filter((i) => i.tipo === "maquina")   // pestaña Máquinas
items.filter((i) => i.tipo === "otro")     // pestaña Otros
```

Una máquina sin `tipo` no entra en ninguno de los dos filtros, así que
**desaparecía de la pantalla** junto con sus planes de mantenimiento.

### Cómo reconocer los datos afectados

```js
db.machines.find(
  { $or: [ { tipo: { $exists: false } }, { tipo: null } ] },
  { name: 1, serialNumber: 1, createdAt: 1, _id: 0 }
)
```

### Aplicar

Las máquinas viejas no eran "otra cosa": son equipos comunes, así que van a
`"maquina"`:

```js
db.machines.updateMany(
  { $or: [ { tipo: { $exists: false } }, { tipo: null } ] },
  { $set: { tipo: "maquina" } }
);
```

Verificar:

```js
db.machines.countDocuments({
  $or: [ { tipo: { $exists: false } }, { tipo: null } ]
})  // 0
```

---

## Nota

Como defensa extra, el código ya no compara con igualdad estricta: tanto
`cliente/src/pages/mismaquinas.jsx` como `cliente/src/pages/mantenimiento.jsx`
tratan "sin `tipo`" como `"maquina"`. Así que si algún documento quedara sin el
campo, se sigue viendo en vez de desaparecer.

Los dos casos tienen tests que replican la lógica de la reparación dentro del
propio test, así que no dependen de estos pasos:

- `server/tests/maintenancePeriodMigration.test.js`
- `server/tests/machineTipoBackfill.test.js`