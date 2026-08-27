import { env } from "cloudflare:workers";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function secret() {
  const value = (env as unknown as { GMAIL_TOKEN_ENCRYPTION_KEY?: string })
    .GMAIL_TOKEN_ENCRYPTION_KEY;
  if (!value) throw new Error("Gmail token encryption is not configured");
  return value;
}

function base64Url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function fromBase64Url(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

async function key(usage: KeyUsage[]) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(secret()));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, usage);
}

export async function encrypt(value: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await key(["encrypt"]),
    encoder.encode(value),
  );
  return `${base64Url(iv)}.${base64Url(new Uint8Array(encrypted))}`;
}

export async function decrypt(value: string) {
  const [iv, encrypted] = value.split(".");
  if (!iv || !encrypted) throw new Error("Invalid encrypted value");
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64Url(iv) },
    await key(["decrypt"]),
    fromBase64Url(encrypted),
  );
  return decoder.decode(decrypted);
}

export async function createState(payload: object) {
  return encrypt(JSON.stringify(payload));
}

export async function readState<T>(state: string) {
  return JSON.parse(await decrypt(state)) as T;
}
