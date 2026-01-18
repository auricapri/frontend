/**
 * ProductReviewForm Component - React Native
 * Form for submitting product reviews
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Star, X, Upload, Loader2 } from '../ui/Icons';
import { ProductReview, ProductReviewMedia, OrderItemForReview } from '../../types';
import { ProductReviewsApi } from '../../api/product-reviews.api';
import { supabase } from '../../utils/supabase';

interface ProductReviewFormProps {
  orderId: string;
  orderItem: OrderItemForReview;
  existingReview?: ProductReview | null;
  onSuccess: (review: ProductReview) => void;
  onCancel: () => void;
}

export const ProductReviewForm: React.FC<ProductReviewFormProps> = ({
  orderId,
  orderItem,
  existingReview,
  onSuccess,
  onCancel
}) => {
  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [mediaUris, setMediaUris] = useState<string[]>([]);
  const [existingMedia, setExistingMedia] = useState<ProductReviewMedia[]>(existingReview?.media || []);
  const [mediaToRemove, setMediaToRemove] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getLoc = (obj: any): string => {
    if (!obj) return "";
    if (typeof obj === 'string') return obj;
    return obj.pt || obj.en || Object.values(obj)[0] || "";
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar suas fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newUris = result.assets.map(asset => asset.uri);
      setMediaUris(prev => [...prev, ...newUris]);
    }
  };

  const removeMedia = (index: number) => {
    setMediaUris(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingMedia = (mediaId: string) => {
    setExistingMedia(prev => prev.filter(m => m.id !== mediaId));
    setMediaToRemove(prev => [...prev, mediaId]);
  };

  const uriToFile = async (uri: string, fileName: string): Promise<File> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new File([blob], fileName, { type: blob.type });
  };

  const handleSubmit = async () => {
    if (!rating) return;

    setIsSubmitting(true);
    const api = new ProductReviewsApi();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      let review: ProductReview;

      const mediaFiles: File[] = [];
      for (let i = 0; i < mediaUris.length; i++) {
        const uri = mediaUris[i];
        const fileName = `review-${Date.now()}-${i}.${uri.split('.').pop()}`;
        const file = await uriToFile(uri, fileName);
        mediaFiles.push(file);
      }

      if (existingReview) {
        review = await api.update(existingReview.id, {
          rating,
          comment: comment || undefined,
          media: mediaFiles.length > 0 ? mediaFiles : undefined,
          remove_media_ids: mediaToRemove.length > 0 ? mediaToRemove : undefined
        });
      } else {
        const createData: any = {
          order_id: orderId,
          order_item_id: orderItem.order_item_id,
          product_id: orderItem.product_id,
          variant_id: orderItem.variant_id,
          rating,
          comment: comment || undefined,
          variant_size: orderItem.variant_size,
          variant_color: orderItem.variant_color,
          media: mediaFiles.length > 0 ? mediaFiles : undefined
        };

        if (!userId) {
          const { OrdersApi } = await import('../../api/orders.api');
          const ordersApi = new OrdersApi();
          const order = await ordersApi.getById(orderId);
          if (order?.user_id) {
            createData.user_id = order.user_id;
          }
        }

        review = await api.create(createData);
      }

      onSuccess(review);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao salvar avaliação');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.productInfo}>
        <Image 
          source={{ uri: orderItem.image }} 
          style={styles.productImage}
        />
        <View style={styles.productDetails}>
          <Text style={styles.productName}>{getLoc(orderItem.product_name)}</Text>
          <Text style={styles.productVariant}>
            {getLoc(orderItem.variant_color)} | {orderItem.variant_size}
          </Text>
          <Text style={styles.productQuantity}>Qtd: {orderItem.quantity}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Avaliação</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              style={styles.starButton}
            >
              <Star
                size={32}
                color={star <= rating ? '#3B82F6' : '#D1D5DB'}
                fill={star <= rating ? '#3B82F6' : 'none'}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Comentário</Text>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Compartilhe sua experiência..."
          multiline
          numberOfLines={4}
          style={styles.textInput}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Fotos e Vídeos</Text>
        <View style={styles.mediaContainer}>
          {existingMedia.map((media) => (
            <View key={media.id} style={styles.mediaItem}>
              {media.media_type === 'image' ? (
                <Image source={{ uri: media.media_url }} style={styles.mediaPreview} />
              ) : (
                <View style={styles.mediaPreview}>
                  <Text style={styles.videoLabel}>Vídeo</Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => removeExistingMedia(media.id)}
                style={styles.removeButton}
              >
                <X size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}

          {mediaUris.map((uri, index) => (
            <View key={index} style={styles.mediaItem}>
              <Image source={{ uri }} style={styles.mediaPreview} />
              <TouchableOpacity
                onPress={() => removeMedia(index)}
                style={styles.removeButton}
              >
                <X size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity onPress={pickImage} style={styles.uploadButton}>
          <Upload size={20} color="#000000" />
          <Text style={styles.uploadText}>Adicionar fotos/vídeos</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Salvando...</Text>
            </>
          ) : (
            <Text style={styles.submitButtonText}>Salvar avaliação</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  productInfo: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  productVariant: {
    fontSize: 12,
    color: '#737373',
    marginBottom: 2,
  },
  productQuantity: {
    fontSize: 11,
    color: '#A3A3A3',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
  },
  mediaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  mediaItem: {
    position: 'relative',
  },
  mediaPreview: {
    width: 96,
    height: 96,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoLabel: {
    fontSize: 12,
    color: '#737373',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 8,
    gap: 8,
  },
  uploadText: {
    fontSize: 14,
    color: '#000000',
  },
  actions: {
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: '#000000',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#737373',
  },
});

