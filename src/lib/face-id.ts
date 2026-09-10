import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

import { PRODUCT_NAME } from '@/constants/branding';
import { resolveFaceIdAvailability, type FaceIdAvailability } from '@/lib/face-id-policy';

const FACE_ID_ENABLED_KEY = 'inboxgop.face-id-enabled';

export type FaceIdResult = Awaited<ReturnType<typeof LocalAuthentication.authenticateAsync>>;

export async function getFaceIdAvailability(): Promise<FaceIdAvailability> {
  const [hasHardware, isEnrolled, supportedTypes] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
  ]);

  return resolveFaceIdAvailability({
    hasHardware,
    isEnrolled,
    supportsFaceId: supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION),
  });
}

export async function isFaceIdEnabled(): Promise<boolean> {
  return (await SecureStore.getItemAsync(FACE_ID_ENABLED_KEY)) === 'true';
}

export async function setFaceIdEnabled(enabled: boolean): Promise<void> {
  if (enabled) {
    await SecureStore.setItemAsync(FACE_ID_ENABLED_KEY, 'true', {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
    return;
  }

  await SecureStore.deleteItemAsync(FACE_ID_ENABLED_KEY);
}

export function authenticateWithFaceId(): Promise<FaceIdResult> {
  return LocalAuthentication.authenticateAsync({
    promptMessage: `Unlock ${PRODUCT_NAME}`,
    cancelLabel: 'Cancel',
    disableDeviceFallback: true,
    fallbackLabel: 'Use Password',
  });
}

export function faceIdErrorMessage(result: FaceIdResult): string | null {
  if (result.success) return null;

  switch (result.error) {
    case 'user_cancel':
    case 'app_cancel':
    case 'system_cancel':
    case 'user_fallback':
      return null;
    case 'not_enrolled':
      return 'Face ID is not set up on this iPhone.';
    case 'lockout':
      return 'Face ID is temporarily locked. Use your password instead.';
    default:
      return 'Face ID could not verify you. Try again or use your password.';
  }
}
