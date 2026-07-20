import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { ProfileViewPreferenceSync } from './ProfileViewPreferenceSync.tsx';

type ProfileViewPreferenceContextValue = {
  revision: number;
};

const ProfileViewPreferenceContext = createContext<ProfileViewPreferenceContextValue | null>(null);

export function ProfileViewPreferenceProvider({ children }: { children: ReactNode }) {
  const [revision, setRevision] = useState(0);
  const onApplied = useCallback(() => {
    setRevision((value) => value + 1);
  }, []);

  const value = useMemo(() => ({ revision }), [revision]);

  return (
    <ProfileViewPreferenceContext.Provider value={value}>
      <ProfileViewPreferenceSync onApplied={onApplied} />
      {children}
    </ProfileViewPreferenceContext.Provider>
  );
}

export function useProfileViewPreferenceRevision(): number {
  const context = useContext(ProfileViewPreferenceContext);
  return context?.revision ?? 0;
}
