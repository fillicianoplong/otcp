import { useEffect } from 'react';

import { useAuth } from '../auth/useAuth.ts';
import {
  clearProfilePreferenceSyncTimer,
  configureProfilePreferenceSync,
  loadAndApplyProfilePreferences,
  resetProfilePreferenceLoadGeneration,
} from './profileViewPreferences.ts';

type ProfileViewPreferenceSyncProps = {
  onApplied: () => void;
};

/** Loads profile view prefs after sign-in; debounces write-back while signed in. */
export function ProfileViewPreferenceSync({ onApplied }: ProfileViewPreferenceSyncProps) {
  const { configured, loading, session } = useAuth();
  const userId = session?.user?.id ?? null;

  useEffect(() => {
    configureProfilePreferenceSync({
      userId,
      onApplied,
    });
  }, [userId, onApplied]);

  useEffect(() => {
    if (!configured || loading) {
      return;
    }
    if (!userId) {
      resetProfilePreferenceLoadGeneration();
      clearProfilePreferenceSyncTimer();
      return;
    }

    void loadAndApplyProfilePreferences(userId);

    return () => {
      resetProfilePreferenceLoadGeneration();
      clearProfilePreferenceSyncTimer();
    };
  }, [configured, loading, userId]);

  return null;
}
