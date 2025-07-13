import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

export default function App() {
  return (
    <SafeAreaProvider>
      <Stack />
    </SafeAreaProvider>
  );
}
