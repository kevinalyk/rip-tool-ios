import { Redirect } from 'expo-router';

import { useAuth } from '@/providers/auth-provider';

export default function IndexScreen() {
  const { state } = useAuth();
  return <Redirect href={state === 'authenticated' ? '/(tabs)' : '/login'} />;
}
