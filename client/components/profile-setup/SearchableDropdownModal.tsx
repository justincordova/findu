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
import { BACKGROUND, DARK, MUTED, PRIMARY } from "@/constants/theme";

// Types
interface SearchableDropdownModalProps {
  label: string;
  value: string | null;
  items: ItemType<string>[];
  onValueChange: (value: string) => void;
  open: boolean;
  onOpenChange: () => void;
  placeholder?: string;
  required?: boolean;
  zIndex?: number;
}

/**
 * Centered modal dropdown with blur background
 * Shows searchable dropdown in a box with Step3 screen blurred behind
 */
export default function SearchableDropdownModal({
  label,
  value,
  items,
  onValueChange,
  open,
  onOpenChange,
  placeholder = "Select an option...",
  required = false,
  zIndex = 1,
}: SearchableDropdownModalProps) {
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
      onValueChange(selectedValue);
      setSearchQuery("");
      onOpenChange();
    },
    [onValueChange, onOpenChange]
  );

  const handleModalClose = useCallback(() => {
    setSearchQuery("");
    setTimeout(() => onOpenChange(), 50);
  }, [onOpenChange]);

  const selectedLabel = useMemo(() => {
    return items.find((item) => item.value === value)?.label || "";
  }, [value, items]);

  return (
    <View style={[styles.fieldContainer, { zIndex }]}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.required}>*</Text>}
      </View>

      {/* Dropdown trigger button */}
      <TouchableOpacity
        style={styles.dropdown}
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
          color={PRIMARY}
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
                placeholder="Search majors..."
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

            {/* Results list */}
            {filteredItems.length > 0 ? (
              <FlatList
                data={filteredItems}
                keyExtractor={(item, index) => `${item.value}-${index}`}
                scrollEnabled={true}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.menuItem,
                      value === item.value && styles.menuItemSelected,
                    ]}
                    onPress={() => handleItemSelect(item.value || "")}
                  >
                    <Text
                      style={[
                        styles.menuItemLabel,
                        value === item.value && styles.menuItemLabelSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {value === item.value && (
                      <Ionicons name="checkmark" size={20} color={PRIMARY} />
                    )}
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.noResults}>
                <Ionicons name="search-outline" size={32} color={MUTED} />
                <Text style={styles.noResultsText}>No majors found</Text>
                <Text style={styles.noResultsSubtext}>
                  Try a different search
                </Text>
              </View>
            )}
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
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: DARK,
  },
  required: {
    fontSize: 16,
    color: "#ef4444",
    marginLeft: 4,
    fontWeight: "700",
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: BACKGROUND,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    minHeight: 48,
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
    maxHeight: "65%",
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
