// Composant pour ajouter des paires de langues (source → cible)
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, LANGUAGES } from '../config/constants';
import Button from './Button';

const LanguagePairSelector = ({ languages, onAdd, onRemove }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [level, setLevel] = useState('professionnel');

  const levels = [
    { value: 'natif', label: 'Natif' },
    { value: 'bilingue', label: 'Bilingue' },
    { value: 'certifié', label: 'Certifié' },
    { value: 'professionnel', label: 'Professionnel' },
  ];

  const handleAdd = () => {
    if (sourceLanguage && targetLanguage) {
      onAdd({
        source: sourceLanguage,
        target: targetLanguage,
        level: level
      });

      // Réinitialiser
      setSourceLanguage('');
      setTargetLanguage('');
      setLevel('professionnel');
      setModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Langues pratiquées</Text>

      {/* Liste des langues ajoutées */}
      {languages.length > 0 ? (
        <View style={styles.languagesList}>
          {languages.map((lang, index) => (
            <View key={index} style={styles.languageItem}>
              <View style={styles.languageInfo}>
                <Text style={styles.languagePair}>
                  {lang.source} → {lang.target}
                </Text>
                <Text style={styles.languageLevel}>{lang.level}</Text>
              </View>
              <TouchableOpacity
                onPress={() => onRemove(index)}
                style={styles.removeButton}
              >
                <Ionicons name="close-circle" size={22} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>Aucune langue ajoutée</Text>
      )}

      {/* Bouton pour ajouter */}
      <Button
        title="+ Ajouter une langue"
        variant="outline"
        onPress={() => setModalVisible(true)}
        style={styles.addButton}
      />

      {/* Modal de sélection */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajouter une paire de langues</Text>

            <ScrollView style={styles.modalScroll}>
              {/* Langue source */}
              <Text style={styles.sectionLabel}>Langue source :</Text>
              <View style={styles.languageOptions}>
                {LANGUAGES.map((lang, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.languageOption,
                      sourceLanguage === lang && styles.languageOptionSelected
                    ]}
                    onPress={() => setSourceLanguage(lang)}
                  >
                    <Text style={[
                      styles.languageOptionText,
                      sourceLanguage === lang && styles.languageOptionTextSelected
                    ]}>
                      {lang}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Langue cible */}
              <Text style={styles.sectionLabel}>Langue cible :</Text>
              <View style={styles.languageOptions}>
                {LANGUAGES.map((lang, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.languageOption,
                      targetLanguage === lang && styles.languageOptionSelected
                    ]}
                    onPress={() => setTargetLanguage(lang)}
                  >
                    <Text style={[
                      styles.languageOptionText,
                      targetLanguage === lang && styles.languageOptionTextSelected
                    ]}>
                      {lang}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Niveau */}
              <Text style={styles.sectionLabel}>Niveau :</Text>
              <View style={styles.levelOptions}>
                {levels.map((lvl, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.levelOption,
                      level === lvl.value && styles.levelOptionSelected
                    ]}
                    onPress={() => setLevel(lvl.value)}
                  >
                    <Text style={[
                      styles.levelOptionText,
                      level === lvl.value && styles.levelOptionTextSelected
                    ]}>
                      {lvl.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Boutons d'action */}
            <View style={styles.modalActions}>
              <Button
                title="Annuler"
                variant="outline"
                onPress={() => setModalVisible(false)}
                style={styles.modalButton}
              />
              <Button
                title="Ajouter"
                onPress={handleAdd}
                disabled={!sourceLanguage || !targetLanguage}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
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
  languagesList: {
    marginBottom: 12,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  languageInfo: {
    flex: 1,
  },
  languagePair: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.onSurface,
    marginBottom: 4,
  },
  languageLevel: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  removeButton: {
    padding: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  addButton: {
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.onSurface,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 400,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
    marginTop: 16,
    marginBottom: 8,
  },
  languageOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  languageOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  languageOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  languageOptionText: {
    fontSize: 13,
    color: COLORS.onSurface,
  },
  languageOptionTextSelected: {
    color: COLORS.onPrimary,
    fontWeight: '600',
  },
  levelOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  levelOption: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 10,
    alignItems: 'center',
  },
  levelOptionSelected: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  levelOptionText: {
    fontSize: 14,
    color: COLORS.onSurface,
  },
  levelOptionTextSelected: {
    color: COLORS.onPrimary,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
  },
});

export default LanguagePairSelector;
