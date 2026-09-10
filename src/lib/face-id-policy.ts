export type FaceIdAvailability = 'available' | 'not-enrolled' | 'unavailable';

export function resolveFaceIdAvailability({
  hasHardware,
  isEnrolled,
  supportsFaceId,
}: {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportsFaceId: boolean;
}): FaceIdAvailability {
  if (!hasHardware || !supportsFaceId) return 'unavailable';
  return isEnrolled ? 'available' : 'not-enrolled';
}
