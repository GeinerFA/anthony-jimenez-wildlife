// Abre /es en Chrome headless a ancho de celular, revisa si algo tapa el ícono de Instagram del
// footer y hace clic real (eventos de mouse) para ver si se abre una pestaña nueva y a qué URL.
const port = 9333;
const base = `http://127.0.0.1:${port}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function json(path, method = "GET") {
  for (let i = 0; i < 50; i++) {
    try { return await (await fetch(base + path, { method })).json(); } catch { await sleep(200); }
  }
  throw new Error("Chrome no respondió");
}

const target = await json("/json/new?http://localhost:3000/es", "PUT");
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
const events = [];
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  else events.push(msg);
};
const send = (method, params = {}) =>
  new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expression) =>
  (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.result?.value;

await send("Emulation.setDeviceMetricsOverride", { width: 417, height: 800, deviceScaleFactor: 2, mobile: true });
await send("Page.enable");
await send("Page.reload");
await sleep(6000);

const info = await evaluate(`(async () => {
  const a = document.querySelector('footer a[aria-label="Instagram"]');
  if (!a) return { error: "no se encontró el enlace" };
  a.scrollIntoView({ block: "center" });
  await new Promise(r => setTimeout(r, 1500));
  const r = a.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const top = document.elementFromPoint(x, y);
  const covering = top && !a.contains(top) ? (top.outerHTML.slice(0, 200)) : null;
  return { href: a.href, target: a.target, x, y, covering };
})()`);
console.log("enlace:", JSON.stringify(info, null, 1));

const before = (await json("/json/list")).filter((t) => t.type === "page").map((t) => t.id);
for (const type of ["mousePressed", "mouseReleased"]) {
  await send("Input.dispatchMouseEvent", { type, x: info.x, y: info.y, button: "left", clickCount: 1 });
}
await sleep(3000);
const after = (await json("/json/list")).filter((t) => t.type === "page");
const opened = after.filter((t) => !before.includes(t.id));
console.log("pestañas nuevas tras el clic:", opened.map((t) => t.url));
console.log("url de la página original:", await evaluate("location.href"));
ws.close();
process.exit(0);
