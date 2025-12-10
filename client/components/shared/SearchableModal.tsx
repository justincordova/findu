// React core
import { useCallback, useMemo, useState } from "react";

// React Native
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  FlatList,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Reanimated
import Animated, {
  ZoomIn,
  ZoomOut,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";

// Third-party
import { ItemType } from "react-native-dropdown-picker";

// Project imports
import { BACKGROUND, DARK, MUTED, PRIMARY, SECONDARY } from "@/constants/theme";

// Types
interface SearchableModalProps {
  label: string;
  value: string | null | string[];
  items: ItemType<string>[];
  onValueChange: (value: string | string[]) => void;
  open: boolean;
  onOpenChange: () => void;
  placeholder?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
  showCompleted?: boolean;
  zIndex?: number;
  multiSelect?: boolean;
}

/**
 * Universal searchable modal component
 * Used for selecting from large lists (majors, interests, etc)
 * Features:
 * - Centered modal with blur background
 * - Keyboard-aware positioning
 * - Search filtering
 * - Selection checkmark and green border
 * - No shrinking when no results
 */
export default function SearchableModal({
  label,
  value,
  items,
  onValueChange,
  open,
  onOpenChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  noResultsText = "No results found",
  showCompleted = false,
  zIndex = 1,
  multiSelect = false,
}: SearchableModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    return items.filter((item) =>
      (item.label || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  const handleItemSelect = useCallback(
    (selectedValue: string) => {
      if (multiSelect) {
        const currentValues = Array.isArray(value) ? value : [];
        const newValues = currentValues.includes(selectedValue)
          ? currentValues.filter((v) => v !== selectedValue)
          : [...currentValues, selectedValue];
        onValueChange(newValues);
      } else {
        onValueChange(selectedValue);
        setSearchQuery("");
        Keyboard.dismiss();
        setTimeout(() => onOpenChange(), 100);
      }
    },
    [multiSelect, value, onValueChange, onOpenChange]
  );

  const handleModalClose = useCallback(() => {
    setSearchQuery("");
    Keyboard.dismiss();
    setTimeout(() => onOpenChange(), 50);
  }, [onOpenChange]);

  const selectedLabel = useMemo(() => {
    if (multiSelect && Array.isArray(value)) {
      return value.length === 0 ? "" : `${value.length} selected`;
    }
    return items.find((item) => item.value === value)?.label || "";
  }, [value, items, multiSelect]);

  // Determine if field is completed (for green border)
  const isCompleted = showCompleted && (
    multiSelect ? (Array.isArray(value) ? value.length > 0 : false) : value
  );

  return (
    <View style={[styles.fieldContainer, { zIndex }]}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
      </View>

      {/* Dropdown trigger button */}
      <TouchableOpacity
        style={[
          styles.dropdown,
          isCompleted && styles.dropdownCompleted,
        ]}
        onPress={onOpenChange}
        activeOpacity={0.7}
      >
        <Text
          style={[styles.dropdownValue, !value && { color: MUTED }]}
          numberOfLines={1}
        >
          {selectedLabel || placeholder}
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={20}
          color={isCompleted ? SECONDARY : PRIMARY}
          style={styles.dropdownIcon}
        />
      </TouchableOpacity>

      {/* Modal with centered dropdown box */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={handleModalClose}
        statusBarTranslucent
      >
        {/* Blurred background */}
        <BlurView intensity={60} style={StyleSheet.absoluteFill}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={handleModalClose}
            style={styles.blurOverlay}
          />
        </BlurView>

        {/* Centered dropdown box */}
        <Animated.View
          entering={ZoomIn.duration(250)}
          exiting={ZoomOut.duration(200)}
          style={styles.centeredBox}
        >
          <View style={styles.dropdownMenu}>
            {/* Header with title and close button */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity
                onPress={handleModalClose}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <Ionicons name="close" size={24} color={DARK} />
              </TouchableOpacity>
            </View>

            {/* Search input */}
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={18}
                color={MUTED}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder={searchPlaceholder}
                placeholderTextColor={MUTED}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={open}
                returnKeyType="done"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color={MUTED} />
                </TouchableOpacity>
              )}
            </View>

            {/* Results list - always shows fixed height */}
            <FlatList
              data={filteredItems}
              keyExtractor={(item, index) => `${item.value}-${index}`}
              scrollEnabled={filteredItems.length > 5}
              contentContainerStyle={[
                styles.listContent,
                filteredItems.length === 0 && styles.emptyListContent,
              ]}
              ListEmptyComponent={
                <View style={styles.noResults}>
                  <Ionicons name="search-outline" size={32} color={MUTED} />
                  <Text style={styles.noResultsText}>{noResultsText}</Text>
                  <Text style={styles.noResultsSubtext}>
                    Try a different search
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const isSelected = multiSelect
                  ? (Array.isArray(value) ? value.includes(item.value || "") : false)
                  : value === item.value;

                return (
                  <TouchableOpacity
                    style={[
                      styles.menuItem,
                      isSelected && styles.menuItemSelected,
                    ]}
                    onPress={() => handleItemSelect(item.value || "")}
                  >
                    <Text
                      style={[
                        styles.menuItemLabel,
                        isSelected && styles.menuItemLabelSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: 24,
    position: "relative",
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: DARK,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    minHeight: 48,
  },
  dropdownCompleted: {
    borderColor: SECONDARY,
    borderWidth: 2,
  },
  dropdownValue: {
    flex: 1,
    fontSize: 16,
    color: DARK,
    fontWeight: "500",
  },
  dropdownIcon: {
    marginLeft: 8,
  },
  blurOverlay: {
    flex: 1,
  },
  centeredBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  dropdownMenu: {
    width: "100%",
    maxWidth: 380,
    maxHeight: "70%",
    minHeight: 300,
    backgroundColor: BACKGROUND,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: DARK,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    backgroundColor: "#fafafa",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 15,
    color: DARK,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    minHeight: 150,
  },
  emptyListContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: "#f9f9f9",
  },
  menuItemSelected: {
    backgroundColor: `${PRIMARY}15`,
    borderWidth: 1.5,
    borderColor: PRIMARY,
  },
  menuItemLabel: {
    fontSize: 14,
    color: DARK,
    fontWeight: "500",
    flex: 1,
  },
  menuItemLabelSelected: {
    fontWeight: "700",
    color: PRIMARY,
  },
  noResults: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: "600",
    color: DARK,
    marginTop: 12,
    textAlign: "center",
  },
  noResultsSubtext: {
    fontSize: 13,
    color: MUTED,
    marginTop: 4,
    textAlign: "center",
  },
});
