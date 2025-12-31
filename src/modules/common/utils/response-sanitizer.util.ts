import { isPublicId, isUuid } from './public-id.util';

const RELATION_KEY_MAP: Record<string, string> = {
  routeId: 'route',
  driverId: 'driver',
  passengerId: 'passenger',
  bookingId: 'booking',
  payoutId: 'payout',
  paymentId: 'payment',
  vehicleId: 'vehicle',
  documentId: 'document',
  stopId: 'stop',
  userId: 'user',
  fromUserId: 'fromUser',
  toUserId: 'toUser',
};

const ALLOWED_UUID_KEYS = new Set([
  'paypalOrderId',
  'paypalCaptureId',
  'paypalBatchId',
]);

const USER_REFERENCE_KEYS = new Set([
  'userId',
  'passengerId',
  'fromUserId',
  'toUserId',
]);

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  if (Array.isArray(value)) {
    return false;
  }
  if (value instanceof Date) {
    return false;
  }
  if (Buffer.isBuffer(value)) {
    return false;
  }
  return true;
};

const getExternalIdFromRelation = (
  relation: Record<string, unknown>,
  preferAlias: boolean,
): string | undefined => {
  const alias = relation.alias;
  if (preferAlias && typeof alias === 'string' && alias.trim().length > 0) {
    return alias;
  }

  const publicId = relation.publicId;
  if (typeof publicId === 'string' && publicId.trim().length > 0) {
    return publicId;
  }

  if (!preferAlias && typeof alias === 'string' && alias.trim().length > 0) {
    return alias;
  }

  const id = relation.id;
  if (typeof id === 'string' && !isUuid(id)) {
    return id;
  }

  return undefined;
};

export const sanitizeResponseData = (
  input: unknown,
  seen: WeakSet<object> = new WeakSet(),
): unknown => {
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeResponseData(item, seen));
  }

  if (!isPlainObject(input)) {
    return input;
  }

  if (seen.has(input)) {
    return undefined;
  }
  seen.add(input);

  const obj = input as Record<string, unknown>;
  const hasPublicId = typeof obj.publicId === 'string';

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (key === 'id') {
      if (hasPublicId) {
        continue;
      }
      if (typeof value === 'string' && isUuid(value)) {
        continue;
      }
      sanitized[key] = sanitizeResponseData(value, seen);
      continue;
    }

    if (key === 'publicId') {
      sanitized[key] = value;
      continue;
    }

    const relationKey = RELATION_KEY_MAP[key];
    if (typeof value === 'string' && isUuid(value)) {
      if (relationKey) {
        const relationValue = obj[relationKey];
        if (isPlainObject(relationValue)) {
          const externalId = getExternalIdFromRelation(
            relationValue,
            USER_REFERENCE_KEYS.has(key),
          );
          if (externalId) {
            sanitized[key] = externalId;
          }
        }
      }
      if (key.endsWith('Id') && !ALLOWED_UUID_KEYS.has(key)) {
        continue;
      }
    }

    if (relationKey && typeof value === 'string' && isPublicId(value)) {
      sanitized[key] = value;
      continue;
    }

    sanitized[key] = sanitizeResponseData(value, seen);
  }

  return sanitized;
};
