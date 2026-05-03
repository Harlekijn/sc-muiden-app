import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export function useAvatarUpload() {
  const [uploading, setUploading] = useState(false);
  const { profile, setProfile } = useAuthStore();

  async function pickAndUpload(): Promise<string | null> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return null;

    const asset = result.assets[0];
    setUploading(true);

    try {
      const fileInfo = await FileSystem.getInfoAsync(asset.uri);
      if (!fileInfo.exists) throw new Error('File not found');

      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      const path = `${profile!.id}/${Date.now()}.${ext}`;

      const byteArray = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, byteArray, { contentType: mimeType, upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile!.id);

      if (updateError) throw updateError;

      if (profile) {
        setProfile({ ...profile, avatar_url: publicUrl });
      }

      return publicUrl;
    } finally {
      setUploading(false);
    }
  }

  return { uploading, pickAndUpload };
}
