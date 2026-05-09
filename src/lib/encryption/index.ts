import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function getSecretKey() {
  const secret = process.env.ENCRYPTION_SECRET_KEY
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET_KEY is not defined in environment variables')
  }
  // The key must be exactly 32 bytes for aes-256-gcm
  // Assuming the provided key is a 32-byte hex string (64 chars) or we pad/hash it
  if (secret.length === 64) {
      return Buffer.from(secret, 'hex')
  }

  // If it's just a random string, create a deterministic 32-byte hash from it
  return crypto.createHash('sha256').update(String(secret)).digest()
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const key = getSecretKey()
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag().toString('hex')

  // Format: iv:encrypted_data:auth_tag
  return `${iv.toString('hex')}:${encrypted}:${authTag}`
}

export function decrypt(encryptedData: string): string {
  const parts = encryptedData.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format')
  }

  const [ivHex, encryptedHex, authTagHex] = parts

  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const key = getSecretKey()

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
