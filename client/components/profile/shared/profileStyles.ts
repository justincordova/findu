import { StyleSheet } from "react-native";
import { DARK, MUTED, PRIMARY, SECONDARY } from "@/constants/theme";

/**
 * Shared styles for profile section components
 * Extracted from profile.tsx to ensure UI consistency across all sections
 *
 * These styles are used by:
 * - HeaderSection.tsx
 * - BioSection.tsx
 * - InterestsSection.tsx
 * - AcademicSection.tsx
 * - PreferencesSection.tsx
 * - PhotosSection.tsx
 */
export const profileStyles = StyleSheet.create({
  // ============================================================================
  // Card Styles
  // ============================================================================

  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },

  cardTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: DARK,
  },

  // ============================================================================
  // Info Grid Styles (for displaying profile information in cards)
  // ============================================================================

  infoGrid: {
    gap: 16,
  },

  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  infoTextContainer: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 16,
    color: MUTED,
    fontWeight: "500",
    marginBottom: 2,
  },

  infoValue: {
    fontSize: 16,
    color: DARK,
    fontWeight: "600",
  },

  bioText: {
    fontSize: 16,
    lineHeight: 24,
    color: DARK,
  },

  // ============================================================================
  // Interest Badge Styles
  // ============================================================================

  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  interestBadge: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },

  interestText: {
    color: "#000",
    fontSize: 14,
  },

  editInterestBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
    gap: 8,
  },

  // ============================================================================
  // Modal Styles
  // ============================================================================

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "90%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },

  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },

  modalCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },

  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },

  modalSaveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: PRIMARY,
    alignItems: "center",
  },

  modalSaveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },

  modalTextArea: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 150,
    marginBottom: 20,
  },

  // ============================================================================
  // Form Styles
  // ============================================================================

  formContainer: {
    gap: 20,
  },

  formField: {
    gap: 8,
  },

  formLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },

  formInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "white",
  },

  formInputFilled: {
    borderColor: SECONDARY,
    borderWidth: 2,
  },

  // ============================================================================
  // Dropdown Styles
  // ============================================================================

  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "white",
  },

  dropdownText: {
    fontSize: 16,
    color: "#374151",
  },

  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  dropdownModalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    maxHeight: 400,
    minHeight: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    overflow: "hidden",
  },

  dropdownModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  dropdownOptionsContainer: {
    maxHeight: 300,
    flexGrow: 0,
  },

  dropdownOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  dropdownOptionText: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },

  // ============================================================================
  // Selection Button Styles (for multi-select options like gender preferences)
  // ============================================================================

  intentOptionsContainer: {
    gap: 16,
    marginTop: 16,
  },

  intentOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "white",
  },

  intentOptionSelected: {
    borderColor: PRIMARY,
    backgroundColor: PRIMARY,
  },

  intentOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },

  intentOptionTextSelected: {
    color: "white",
  },

  // ============================================================================
  // Interest Input Styles (for adding interests in edit mode)
  // ============================================================================

  addInterestContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  modalInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginRight: 12,
  },

  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },

  // ============================================================================
  // Utility Styles
  // ============================================================================

  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },

  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },

  errorContainer: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  errorContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  errorText: {
    fontSize: 16,
    color: "#ef4444",
    textAlign: "center",
  },
});
