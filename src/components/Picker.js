// Composant Picker personnalisé pour sélectionner une valeur
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { COLORS } from '../config/constants';

const Picker = ({ label, value, onValueChange, options, placeholder, error }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (selectedValue) => {
    onValueChange(selectedValue);
    setModalVisible(false);
  };

  const displayValue = value || placeholder || 'Sélectionner...';
  const hasValue = !!value;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[
          styles.pickerButton,
          error && styles.pickerButtonError
        ]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[
          styles.pickerText,
          !hasValue && styles.pickerTextPlaceholder
        ]}>
          {displayValue}
        </Text>
        <Ionicons name="chevron-down" size={14} color={COLORS.onSurfaceVariant} />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Sélectionner'}</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={COLORS.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.optionsList}>
              {options.map((option, index) => {
                const optionValue = typeof option === 'string' ? option : option.value;
                const optionLabel = typeof option === 'string' ? option : option.label;
                const isSelected = value === optionValue;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.option,
                      isSelected && styles.optionSelected
                    ]}
                    onPress={() => handleSelect(optionValue)}
                  >
                    <Text style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected
                    ]}>
                      {optionLabel}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
    marginBottom: 8,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerButtonError: {
    borderColor: COLORS.error,
  },
  pickerText: {
    fontSize: 16,
    color: COLORS.onSurface,
  },
  pickerTextPlaceholder: {
    color: COLORS.onSurfaceVariant,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  closeButton: {
    padding: 4,
  },
  optionsList: {
    maxHeight: 400,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  optionSelected: {
    backgroundColor: COLORS.primaryFixed,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.onSurface,
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});

export default Picker;
