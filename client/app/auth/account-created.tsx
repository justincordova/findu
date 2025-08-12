import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { PRIMARY, DARK, MUTED } from "../../constants/theme";
import { verifyEmail } from "../../api/auth";

export default function AccountCreated() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setError("Missing verification token.");
        setLoading(false);
        return;
      }
      try {
        const res = await verifyEmail({ token });
        if (!res.success) {
          setError(res.message || "Verification failed.");
        }
      } catch (_e) {
        console.error(_e);
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [token]);

  const handleGoToLogin = () => {
    router.push("/auth");
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {loading ? (
          <View style={{ alignItems: "center" }}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={[styles.subtitle, { marginTop: 16 }]}>
              Verifying your account...
            </Text>
          </View>
        ) : error ? (
          <>
            <Text style={styles.title}>Verification Failed</Text>
            <Text style={styles.subtitle}>{error}</Text>
            <TouchableOpacity style={styles.button} onPress={handleGoToLogin}>
              <Text style={styles.buttonText}>Go to Login</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>Account Created!</Text>
            <Text style={styles.subtitle}>
              Your account has been successfully created and verified.
            </Text>
            <Text style={styles.message}>
              You can now log in to your FindU account and start connecting with
              other students.
            </Text>
            <TouchableOpacity style={styles.button} onPress={handleGoToLogin}>
              <Text style={styles.buttonText}>Go to Login</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: MUTED,
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 24,
  },
  message: {
    fontSize: 16,
    color: MUTED,
    marginBottom: 40,
    textAlign: "center",
    lineHeight: 22,
  },
  button: {
    backgroundColor: PRIMARY,
    borderRadius: 9999,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    minWidth: 200,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
