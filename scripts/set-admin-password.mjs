// Mengganti password admin. Yang disimpan hanya hash scrypt + salt (bukan password asli).
// Pemakaian: npm run admin:password -- "PasswordBaru"
import { randomBytes, scryptSync } from "node:crypto";
import { writeFileSync } from "node:fs";

const password = process.argv[2];
if (!password || password.length < 8) {
  console.error('Pemakaian: npm run admin:password -- "PasswordBaru"  (minimal 8 karakter)');
  process.exit(1);
}

const N = 32768, r = 8, p = 1;
const salt = randomBytes(16);
const hash = scryptSync(password.normalize("NFKC"), salt, 64, { N, r, p, maxmem: 128 * N * r * 2 });
const passwordHash = `scrypt$${N}$${r}$${p}$${salt.toString("base64")}$${hash.toString("base64")}`;

writeFileSync("admin.config.json", JSON.stringify({ passwordHash }, null, 2) + "\n");
console.log("✓ Hash password admin disimpan ke admin.config.json");
