import { useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as DocumentPicker from 'expo-document-picker';

type DocumentType = 'id_card' | 'certification' | 'license' | 'other';

interface UploadedDocument {
  type: DocumentType;
  name: string;
  uri: string;
  size: number;
}

export default function VerificationUploadScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);

  const documentTypes: { type: DocumentType; label: string; description: string }[] = [
    {
      type: 'id_card',
      label: 'Government ID',
      description: 'National ID, Driver\'s License, or Passport',
    },
    {
      type: 'certification',
      label: 'Professional Certification',
      description: 'Trade certificates or professional qualifications',
    },
    {
      type: 'license',
      label: 'Business License',
      description: 'Business registration or trade license',
    },
    {
      type: 'other',
      label: 'Other Documents',
      description: 'Any additional supporting documents',
    },
  ];

  async function pickDocument(type: DocumentType) {
    try {
      setLoading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        // Check file size (max 10MB)
        if (asset.size && asset.size > 10 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Please select a file smaller than 10MB');
          setLoading(false);
          return;
        }

        setDocuments((prev) => [
          ...prev,
          {
            type,
            name: asset.name,
            uri: asset.uri,
            size: asset.size || 0,
          },
        ]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function removeDocument(index: number) {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  }

  async function submitVerification() {
    if (documents.length === 0) {
      Alert.alert('No Documents', 'Please upload at least one document to proceed.');
      return;
    }

    try {
      setSubmitting(true);

      // Get artisan profile
      const { data: artisan } = await supabase
        .from('artisans')
        .select('id')
        .eq('profile_id', user?.id)
        .single();

      if (!artisan) {
        Alert.alert('Error', 'Artisan profile not found');
        setSubmitting(false);
        return;
      }

      // Upload documents to Supabase storage
      const uploadedDocs = [];

      for (const doc of documents) {
        // Read file as blob
        const response = await fetch(doc.uri);
        const blob = await response.blob();

        // Generate unique filename
        const fileExt = doc.name.split('.').pop();
        const fileName = `${artisan.id}/${doc.type}_${Date.now()}.${fileExt}`;

        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('verification-documents')
          .upload(fileName, blob, {
            contentType: blob.type,
            cacheControl: '3600',
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('verification-documents')
          .getPublicUrl(uploadData.path);

        uploadedDocs.push({
          document_type: doc.type,
          document_url: urlData.publicUrl,
          file_name: doc.name,
          file_size: doc.size,
        });
      }

      // Save document records to database
      for (const docData of uploadedDocs) {
        await supabase.from('verification_documents').insert({
          artisan_id: artisan.id,
          ...docData,
        });
      }

      // Create verification request
      const { error: requestError } = await supabase
        .from('verification_requests')
        .insert({
          artisan_id: artisan.id,
          status: 'pending',
        });

      if (requestError) {
        console.error('Request error:', requestError);
        throw requestError;
      }

      Alert.alert(
        'Success!',
        'Your verification documents have been submitted. We\'ll review them within 24-48 hours.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting verification:', error);
      Alert.alert('Error', 'Failed to submit verification. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <ScreenContainer>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <IconSymbol name="chevron.left" size={24} color="#0a7ea4" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">
                Verification Documents
              </Text>
              <Text className="text-muted mt-1">
                Upload documents to get verified
              </Text>
            </View>
          </View>

          {/* Info Card */}
          <View className="bg-primary/10 rounded-xl p-4 border border-primary/20 mb-4">
            <Text className="text-primary font-semibold mb-2">
              ✓ Why Get Verified?
            </Text>
            <Text className="text-foreground text-sm mb-1">
              • Build customer trust with a verified badge
            </Text>
            <Text className="text-foreground text-sm mb-1">
              • Appear higher in search results
            </Text>
            <Text className="text-foreground text-sm">
              • Access premium features and opportunities
            </Text>
          </View>
        </View>

        {/* Document Types */}
        <View className="px-6 pb-6">
          <Text className="text-lg font-bold text-foreground mb-3">
            Upload Documents
          </Text>

          {documentTypes.map((docType) => (
            <View
              key={docType.type}
              className="bg-surface rounded-xl p-4 mb-3 border border-border"
            >
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">
                    {docType.label}
                  </Text>
                  <Text className="text-muted text-xs mt-1">
                    {docType.description}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => pickDocument(docType.type)}
                  disabled={loading}
                  className="bg-primary rounded-lg px-4 py-2 ml-2"
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="text-white font-semibold text-sm">
                      Upload
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Show uploaded documents of this type */}
              {documents
                .map((doc, index) => ({ doc, index }))
                .filter(({ doc }) => doc.type === docType.type)
                .map(({ doc, index }) => (
                  <View
                    key={index}
                    className="bg-background rounded-lg p-3 mt-2 flex-row items-center"
                  >
                    <View className="flex-1">
                      <Text className="text-foreground font-medium text-sm">
                        {doc.name}
                      </Text>
                      <Text className="text-muted text-xs mt-1">
                        {formatFileSize(doc.size)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeDocument(index)}
                      className="ml-2"
                    >
                      <IconSymbol name="trash" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
            </View>
          ))}
        </View>

        {/* Submit Button */}
        {documents.length > 0 && (
          <View className="px-6 pb-6">
            <TouchableOpacity
              onPress={submitVerification}
              disabled={submitting}
              className="bg-primary rounded-xl p-4 items-center"
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">
                  Submit for Verification ({documents.length}{' '}
                  {documents.length === 1 ? 'document' : 'documents'})
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Guidelines */}
        <View className="px-6 pb-6">
          <Text className="text-base font-semibold text-foreground mb-2">
            Document Guidelines
          </Text>
          <View className="bg-surface rounded-xl p-4">
            <Text className="text-muted text-sm mb-2">
              • Documents must be clear and readable
            </Text>
            <Text className="text-muted text-sm mb-2">
              • Accepted formats: JPG, PNG, PDF
            </Text>
            <Text className="text-muted text-sm mb-2">
              • Maximum file size: 10MB per document
            </Text>
            <Text className="text-muted text-sm">
              • Review typically takes 24-48 hours
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
