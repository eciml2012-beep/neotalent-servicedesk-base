// Hook PreToolUse (Bash) de Claude Code: puerta de calidad antes de commitear (skill qa-triaje).
// Si el comando que Claude va a ejecutar contiene `git commit`, pasa la regresión completa.
// Si falla, sale con código 2: Claude Code bloquea el commit y le enseña el error a Claude.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

let entrada = "";
for await (const trozo of process.stdin) entrada += trozo;
const comando = JSON.parse(entrada || "{}").tool_input?.command ?? "";
if (!/\bgit\s+commit\b/.test(comando)) process.exit(0);

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const r = spawnSync("npm", ["test", "--silent", "--", "--reporter=line"], { cwd: repo, encoding: "utf8", shell: true });
if (r.status === 0) process.exit(0);

const salida = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim().split("\n").slice(-40).join("\n");
process.stderr.write(
  `Commit bloqueado: la regresión (npm test) no está en verde. Decide contra el spec si falla la app o el test ` +
    `antes de tocar nada (skill qa-triaje).\n\n${salida}\n`
);
process.exit(2);
