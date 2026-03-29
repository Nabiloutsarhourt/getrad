// Composant de sélection multiple (pour spécialités, services, régions)
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/constants';

const MultiSelect = ({ label, options, selectedValues, onSelect, error }) => {
  const isSelected = (value) => selectedValues.includes(value);

  const toggleSelection = (value) => {
    if (isSelected(value)) {
      // Désélectionner
      onSelect(selectedValues.filter(v => v !== value));
    } else {
      // Sélectionner
      onSelect([...selectedValues, value]);
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollContainer}
      >
        <View style={styles.optionsContainer}>
          {options.map((option, index) => {
            const value = typeof option === 'string' ? option : option.id;
            const displayLabel = typeof option === 'string' ? option : option.label;
            const selected = isSelected(value);

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.option,
                  selected && styles.optionSelected
                ]}
                onPress={() => toggleSelection(value)}
              >
                <Text style={[
                  styles.optionText,
                  selected && styles.optionTextSelected
                ]}>
                  {displayLabel}
                </Text>
                {selected && <Ionicons name="checkmark" size={14} color={COLORS.onPrimary} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {error && <Text style={styles.errorText}>{error}</Text>}
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
  scrollContainer: {
    maxHeight: 200,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  optionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: 14,
    color: COLORS.onSurface,
  },
  optionTextSelected: {
    color: COLORS.onPrimary,
    fontWeight: '600',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default MultiSelect;
