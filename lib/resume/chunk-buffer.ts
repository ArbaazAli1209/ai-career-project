import "server-only";

export function toNodeBuffer(value: unknown) {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (!value || typeof value !== "object") {
    throw new TypeError("Stored resume chunk is not binary data.");
  }

  const binary = value as { buffer?: unknown; position?: unknown };
  if (binary.buffer instanceof Uint8Array) {
    const length = typeof binary.position === "number"
      ? Math.min(binary.position, binary.buffer.byteLength)
      : binary.buffer.byteLength;
    return Buffer.from(binary.buffer.subarray(0, length));
  }

  throw new TypeError("Stored resume chunk is not a supported binary value.");
}