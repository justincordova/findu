import React, { useState } from 'react';
import { Modal, StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DANGER, DARK, MUTED } from '@/constants/theme';

interface ActionOption {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
}

interface ActionMenuProps {
  options: ActionOption[];
  style?: any;
  iconColor?: string;
  iconSize?: number;
}

/**
 * Reusable action menu component with three-dot button
 * Opens a modal with action options when tapped
 */
export default function ActionMenu({
  options,
  style,
  iconColor = '#000',
  iconSize = 24,
}: ActionMenuProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <>
      <Pressable
        style={[styles.menuButton, style]}
        onPress={() => setShowMenu(true)}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="More options"
      >
        <Ionicons name="ellipsis-vertical" size={iconSize} color={iconColor} />
      </Pressable>

      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            {options.map((option, index) => (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  styles.option,
                  pressed && styles.optionPressed,
                ]}
                onPress={() => {
                  option.onPress();
                  setShowMenu(false);
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={option.label}
              >
                <View style={styles.optionContent}>
                  {option.icon && (
                    <Ionicons
                      name={option.icon}
                      size={20}
                      color={option.destructive ? DANGER : DARK}
                      style={styles.optionIcon}
                    />
                  )}
                  <Text
                    style={[
                      styles.optionLabel,
                      option.destructive && styles.destructiveLabel,
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 200,
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionPressed: {
    backgroundColor: '#F9FAFB',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: DARK,
  },
  destructiveLabel: {
    color: DANGER,
    fontWeight: '600',
  },
});
