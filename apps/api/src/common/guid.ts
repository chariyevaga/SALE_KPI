/**
 * SQL Server generates sequential GUIDs whose version nibble is outside RFC 4122,
 * so class-validator's IsUUID rejects perfectly valid ids coming from our own tables.
 * Validate the shape instead.
 */
export const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
