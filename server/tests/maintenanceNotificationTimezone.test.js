import { describe, expect, it } from "vitest";

// Réplica exacta de `startOfToday` de maintenanceDue.job.js. Se replica porque el
// módulo lee `process.env` al importarse y fijarlo requiere otra maquinaria de
// pruebas; si la fórmula cambia, hay que cambiar ambos lados.
function startOfToday(tz, now = new Date()) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const get = (tipo) => Number(partes.find((p) => p.type === tipo)?.value);
  return new Date(Date.UTC(get("year"), get("month") - 1, get("day")));
}

const iso = (d) => d.toISOString().slice(0, 10);

// El instante en que corre el cron: 08:00 en la zona del taller.
function instanteDelSweep(tz, y, m, d) {
  const guess = new Date(Date.UTC(y, m, d, 8, 0));
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(guess);
  const g = (t) => Number(p.find((x) => x.type === t)?.value);
  const comoUtc = Date.UTC(
    g("year"),
    g("month") - 1,
    g("day"),
    g("hour") % 24,
    g("minute"),
  );
  return new Date(Date.UTC(y, m, d, 8, 0) - (comoUtc - guess.getTime()));
}

const fechaLocal = (tz, d) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);

describe("ventana de avisos y zona horaria", () => {
  // El bug: la hora del cron venía del `TZ` del proceso y la ventana usaba UTC.
  // En una zona UTC+ el cron dispara antes de la medianoche UTC, así que
  // "hoy" en la ventana era el día ANTERIOR y todo se corría un día.
  const zonas = [
    "America/Buenos_Aires", // UTC-3, el caso actual
    "America/Mexico_City", // UTC-6
    "UTC", // contenedores por defecto
    "Europe/London", // UTC+0/+1
    "Asia/Tokyo", // UTC+9: el que fallaba
    "Pacific/Auckland", // UTC+12
  ];

  for (const tz of zonas) {
    it(`${tz}: un plan que vence hoy se ve como "hoy", no como "en 1 día"`, () => {
      for (const [y, m, d] of [
        [2026, 9, 6],
        [2026, 0, 15],
        [2026, 6, 4],
      ]) {
        const sweep = instanteDelSweep(tz, y, m, d);
        const from = startOfToday(tz, sweep);

        // El plan vence ese día; el service lo guarda como medianoche UTC.
        const nextDue = new Date(Date.UTC(y, m, d));
        const dias = Math.round((nextDue - from) / 86_400_000);

        expect(
          dias,
          `en ${tz}, sweep ${sweep.toISOString()}: un plan de hoy se vio a ${dias} días`,
        ).toBe(0);

        // Y la fecha de la ventana tiene que ser la del calendario del taller.
        expect(iso(from)).toBe(fechaLocal(tz, sweep).padStart(10, "0"));
      }
    });
  }

  it("Buenos Aires: el sweep de las 08:00 cae a las 11:00 UTC", () => {
    const sweep = instanteDelSweep("America/Buenos_Aires", 2026, 9, 6);
    // 08:00 ART = 11:00 UTC (UTC-3, sin horario de verano desde 2009).
    expect(sweep.getUTCHours()).toBe(11);
  });

  it("con el server en UTC el aviso igual sale a las 08:00 de Buenos Aires", () => {
    // El riesgo del despliegue: si `TZ` del proceso fuera UTC y la ventana
    // também UTC, el usuario recibiría el aviso a las 05:00.
    const sweep = instanteDelSweep("UTC", 2026, 9, 6);
    expect(sweep.getUTCHours()).toBe(8);

    // Con NOTIFICATION_TIMEZONE en Buenos Aires, la ventana sigue siendo el día
    // local del taller aunque el cron se dispare a las 08:00 UTC.
    const from = startOfToday("America/Buenos_Aires", sweep);
    expect(iso(from)).toBe("2026-10-06");
  });

  it("el cambio de horario de verano no mueve la ventana", () => {
    // Argentina no usa horario de verano desde 2009, pero una zona que sí lo
    // use no debe desalinear la fecha: el sweep sigue siendo 08:00 local y la
    // ventana sigue siendo ese día local.
    for (const [y, m, d] of [
      [2026, 0, 15], // invierno enLondon (UTC+0)
      [2026, 6, 15], // verano en London (UTC+1)
    ]) {
      const sweep = instanteDelSweep("Europe/London", y, m, d);
      const from = startOfToday("Europe/London", sweep);
      expect(iso(from)).toBe(
        fechaLocal("Europe/London", sweep).padStart(10, "0"),
      );
    }
  });

  it("startOfToday devuelve medianoche UTC, no un instante local", () => {
    const d = startOfToday("Asia/Tokyo", new Date("2026-10-05T23:00:00Z"));
    // 23:00 UTC del 5 ya es el 6 en Tokio.
    expect(d.toISOString()).toBe("2026-10-06T00:00:00.000Z");
  });
});