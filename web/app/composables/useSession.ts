// Composable for managing room session credentials

import { nanoid } from 'nanoid';
import { saveCredentials, getCredentials, clearCredentials } from '../database/operations';

export function useSession() {
  const roomId = useState<string | null>('session-roomId', () => null);
  const receiveToken = useState<string | null>('session-receiveToken', () => null);
  const isNewSession = useState<boolean>('session-isNew', () => false);
  const initialized = useState<boolean>('session-initialized', () => false);

  const initialize = async (): Promise<void> => {
    if (initialized.value) return;

    // Try to load existing credentials from IndexedDB
    const existing = await getCredentials();

    if (existing.roomId && existing.receiveToken) {
      roomId.value = existing.roomId;
      receiveToken.value = existing.receiveToken;
      isNewSession.value = false;
    } else {
      // Generate new credentials
      roomId.value = nanoid(12);
      receiveToken.value = nanoid(24);
      isNewSession.value = true;

      // Save to IndexedDB
      await saveCredentials(roomId.value, receiveToken.value);
    }

    initialized.value = true;
  };

  const resetSession = async (): Promise<void> => {
    // Clear existing credentials
    await clearCredentials();

    // Generate new credentials
    roomId.value = nanoid(12);
    receiveToken.value = nanoid(24);
    isNewSession.value = true;

    // Save to IndexedDB
    await saveCredentials(roomId.value, receiveToken.value);
  };

  const getDSN = (host: string): string => {
    if (!roomId.value) return '';
    return `https://${roomId.value}@${host}/0`;
  };

  const getOTLPEndpoint = (host: string): string => {
    if (!roomId.value) return '';
    return `https://${host}/r/${roomId.value}`;
  };

  return {
    roomId: readonly(roomId),
    receiveToken: readonly(receiveToken),
    isNewSession: readonly(isNewSession),
    initialized: readonly(initialized),
    initialize,
    resetSession,
    getDSN,
    getOTLPEndpoint,
  };
}
