/**
 * MVP: 간단 암호화 (AES-256-GCM)
 * 운영: KMS/HSM 등으로 마스터키 관리 권장
 */
const crypto = require("crypto");

function getKey() {
  // derive from JWT secret for demo; in production use dedicated KMS-managed key
  const base = process.env.JWT_ACCESS_SECRET || "change-me-access";
  return crypto.createHash("sha256").update(base).digest(); // 32 bytes
}

function encrypt(plain) {
  const iv = crypto.randomBytes(12);
  const key = getKey();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(String(plain), "utf-8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

function decrypt(ciphertextB64) {
  const raw = Buffer.from(ciphertextB64, "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const enc = raw.subarray(28);
  const key = getKey();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString("utf-8");
}

module.exports = { encrypt, decrypt };
