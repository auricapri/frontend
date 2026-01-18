/**
 * MapPicker Component - React Native
 * Manual address picker (simplified version without map)
 */

import React, { useState, useCallback } from 'react';
import { View, Text, Modal, StyleSheet, TextInput, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { X, Check, Search } from '../ui/Icons';
import { AddressData } from './AddressForm';
import { rp, scaleFont, wp } from '../../utils/responsive';
import { useDebounce } from '../../hooks/useDebounce';

interface MapPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (address: AddressData, cep: string) => void;
  onCalculateLogistics: (cep: string) => void;
}

interface ManualAddress {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
}

export const MapPicker: React.FC<MapPickerProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onCalculateLogistics
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [manualAddress, setManualAddress] = useState<ManualAddress>({
    street: '',
    neighborhood: '',
    city: '',
    state: '',
    cep: ''
  });

  const executeSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      // Use ViaCEP API to search by address
      const res = await fetch(`https://viacep.com.br/ws/${encodeURIComponent(query)}/json/`);
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0 && !data[0].erro) {
        setSearchResults(data);
      } else if (!data.erro && data.cep) {
        setSearchResults([data]);
      } else {
        setSearchResults([]);
      }
    } catch (e) {
      console.error('Search error:', e);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const debouncedSearch = useDebounce(executeSearch, 400);

  const handlePickerSearch = () => {
    if (!searchQuery.trim()) return;
    debouncedSearch(searchQuery);
  };

  const handleSelectSearchResult = (result: any) => {
    const cepFormatted = result.cep ? result.cep.replace(/(\d{5})(\d{3})/, '$1-$2') : '';
    setManualAddress({
      street: result.logradouro || '',
      neighborhood: result.bairro || '',
      city: result.localidade || '',
      state: result.uf || '',
      cep: cepFormatted
    });
    setSearchResults([]);
    setSearchQuery('');
  };

  const confirmManualAddress = async () => {
    let finalCep = manualAddress.cep?.replace(/\D/g, '') || '';
    
    // If CEP is missing, try to fetch it
    if (!finalCep && manualAddress.street && manualAddress.city && manualAddress.state) {
      try {
        const searchUrl = `https://viacep.com.br/ws/${manualAddress.state}/${manualAddress.city}/${encodeURIComponent(manualAddress.street)}/json/`;
        const res = await fetch(searchUrl);
        const data = await res.json();
        
        if (Array.isArray(data) && data.length > 0 && !data[0].erro) {
          finalCep = data[0].cep?.replace(/\D/g, '') || '';
          if (finalCep) {
            setManualAddress(prev => ({
              ...prev,
              cep: finalCep.replace(/(\d{5})(\d{3})/, '$1-$2'),
              neighborhood: prev.neighborhood || data[0].bairro || ''
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching CEP from ViaCEP:', err);
      }
    }
    
    const formattedCep = finalCep ? finalCep.replace(/(\d{5})(\d{3})/, '$1-$2') : '';
    
    const addressData: AddressData = {
      logradouro: manualAddress.street,
      bairro: manualAddress.neighborhood || '',
      localidade: manualAddress.city,
      uf: manualAddress.state,
      cep: formattedCep || undefined
    };
    
    onConfirm(addressData, formattedCep);
    onCalculateLogistics(finalCep || 'Manual');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Localizador</Text>
              <Text style={styles.subtitle}>Confirme os detalhes do endereço</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#000000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Busque sua rua e cidade..."
                placeholderTextColor="#A3A3A3"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handlePickerSearch}
                returnKeyType="search"
              />
              <TouchableOpacity
                onPress={handlePickerSearch}
                style={styles.searchButton}
                disabled={isSearching}
              >
                {isSearching ? (
                  <Text style={styles.searchButtonText}>...</Text>
                ) : (
                  <Search size={16} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <View style={styles.searchResults}>
                {searchResults.map((res, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleSelectSearchResult(res)}
                    style={styles.searchResultItem}
                  >
                    <Text style={styles.searchResultText}>{res.logradouro || res.cep}</Text>
                    <Text style={styles.searchResultSubtext}>
                      {res.bairro}, {res.localidade} - {res.uf}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Manual Address Form */}
            <View style={styles.formSection}>
              <View style={styles.formField}>
                <Text style={styles.label}>Rua / Logradouro</Text>
                <TextInput
                  style={styles.input}
                  value={manualAddress.street}
                  onChangeText={(text) => setManualAddress({...manualAddress, street: text})}
                  placeholder="NOME DA RUA"
                  placeholderTextColor="#A3A3A3"
                  autoCapitalize="characters"
                />
              </View>
              
              <View style={styles.row}>
                <View style={[styles.formField, styles.halfField]}>
                  <Text style={styles.label}>Bairro</Text>
                  <TextInput
                    style={styles.input}
                    value={manualAddress.neighborhood}
                    onChangeText={(text) => setManualAddress({...manualAddress, neighborhood: text})}
                    placeholder="BAIRRO"
                    placeholderTextColor="#A3A3A3"
                    autoCapitalize="characters"
                  />
                </View>
                <View style={[styles.formField, styles.halfField]}>
                  <Text style={styles.label}>Cidade</Text>
                  <TextInput
                    style={styles.input}
                    value={manualAddress.city}
                    onChangeText={(text) => setManualAddress({...manualAddress, city: text})}
                    placeholder="CIDADE"
                    placeholderTextColor="#A3A3A3"
                    autoCapitalize="characters"
                  />
                </View>
              </View>
              
              <View style={styles.row}>
                <View style={[styles.formField, styles.halfField]}>
                  <Text style={styles.label}>Estado</Text>
                  <TextInput
                    style={styles.input}
                    value={manualAddress.state}
                    onChangeText={(text) => setManualAddress({...manualAddress, state: text.toUpperCase()})}
                    placeholder="UF"
                    placeholderTextColor="#A3A3A3"
                    autoCapitalize="characters"
                    maxLength={2}
                  />
                </View>
                <View style={[styles.formField, styles.halfField]}>
                  <Text style={styles.label}>CEP</Text>
                  <TextInput
                    style={styles.input}
                    value={manualAddress.cep}
                    onChangeText={(text) => {
                      const value = text.replace(/\D/g, '');
                      const formatted = value.replace(/(\d{5})(\d{3})/, '$1-$2');
                      setManualAddress({...manualAddress, cep: formatted});
                    }}
                    placeholder="00000-000"
                    placeholderTextColor="#A3A3A3"
                    keyboardType="numeric"
                    maxLength={9}
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={confirmManualAddress}
              disabled={!manualAddress.street || !manualAddress.city || !manualAddress.neighborhood}
              style={[
                styles.confirmButton,
                (!manualAddress.street || !manualAddress.city || !manualAddress.neighborhood) && styles.confirmButtonDisabled
              ]}
            >
              <Check size={16} color="#FFFFFF" />
              <Text style={styles.confirmButtonText}>Confirmar Localização</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: rp(12),
  },
  container: {
    width: wp(95), // 95% da largura da tela
    maxWidth: 600, // Máximo para tablets
    maxHeight: SCREEN_HEIGHT * 0.9, // 90% da altura da tela
    minHeight: SCREEN_HEIGHT * 0.6, // Mínimo 60% para garantir espaço
    backgroundColor: '#FFFFFF',
    borderRadius: rp(24),
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: rp(20),
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  headerText: {
    flex: 1,
    minWidth: 0, // Allow shrinking
  },
  title: {
    fontSize: scaleFont(20, 0.5),
    fontWeight: '900',
    textTransform: 'uppercase',
    fontStyle: 'italic',
    letterSpacing: -1,
    marginBottom: rp(6),
  },
  subtitle: {
    fontSize: scaleFont(9, 0.3),
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: scaleFont(9, 0.3) * 0.22,
    color: '#737373',
  },
  closeButton: {
    padding: rp(8),
    backgroundColor: '#FAFAFA',
    borderRadius: 20,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    padding: rp(20),
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: rp(12),
    gap: rp(8),
  },
  searchInput: {
    flex: 1,
    padding: rp(16),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F5F5F5',
    borderRadius: rp(16),
    fontSize: scaleFont(10, 0.3),
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: scaleFont(10, 0.3) * 0.2,
    color: '#000000',
    minWidth: 0, // Allow shrinking
  },
  searchButton: {
    width: rp(48),
    height: rp(48),
    backgroundColor: '#000000',
    borderRadius: rp(12),
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  searchResults: {
    backgroundColor: '#FFFFFF',
    borderRadius: rp(16),
    borderWidth: 1,
    borderColor: '#F5F5F5',
    marginBottom: rp(20),
    overflow: 'hidden',
  },
  searchResultItem: {
    padding: rp(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  searchResultText: {
    fontSize: scaleFont(10, 0.3),
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: scaleFont(10, 0.3) * 0.2,
    color: '#000000',
    marginBottom: rp(3),
  },
  searchResultSubtext: {
    fontSize: scaleFont(9, 0.3),
    color: '#737373',
  },
  formSection: {
    gap: rp(16),
  },
  formField: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: rp(12),
  },
  halfField: {
    flex: 1,
    minWidth: 0, // Allow shrinking
  },
  label: {
    fontSize: scaleFont(8, 0.3),
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: scaleFont(8, 0.3) * 0.25,
    color: '#737373',
    paddingHorizontal: rp(12),
  },
  input: {
    width: '100%',
    padding: rp(14),
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F5F5F5',
    borderRadius: rp(16),
    fontSize: scaleFont(11, 0.3),
    fontWeight: '900',
    textTransform: 'uppercase',
    color: '#000000',
  },
  footer: {
    padding: rp(20),
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  confirmButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rp(12),
    paddingVertical: rp(20),
    backgroundColor: '#000000',
    borderRadius: rp(24),
  },
  confirmButtonDisabled: {
    opacity: 0.2,
  },
  confirmButtonText: {
    fontSize: scaleFont(10, 0.3),
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: scaleFont(10, 0.3) * 0.64,
    color: '#FFFFFF',
  },
});

