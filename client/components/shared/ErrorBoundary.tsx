import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { theme } from "@/constants/theme";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack: string } | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Something went wrong</Text>
              <Text style={styles.message}>
                The app encountered an unexpected error. Please try again.
              </Text>
            </View>

            {__DEV__ && this.state.error && (
              <View style={styles.debugSection}>
                <Text style={styles.debugTitle}>Error Details (Dev Only)</Text>
                <Text style={styles.debugText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo?.componentStack && (
                  <Text style={styles.debugText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}

            <Pressable
              style={styles.button}
              onPress={this.handleReset}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Dismiss error and try again"
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </Pressable>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  debugSection: {
    backgroundColor: theme.colors.error,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    maxWidth: "100%",
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  debugText: {
    fontSize: 11,
    color: "#fff",
    marginBottom: 4,
    fontFamily: "Courier New",
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 120,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
