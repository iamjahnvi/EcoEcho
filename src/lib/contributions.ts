import * as Crypto from 'expo-crypto';
import type { ImagePickerAsset } from 'expo-image-picker';

import { getSupabaseClient, type ContributionRow } from '@/lib/supabase';

const contributionBucket = 'contribution-photos';

const imageFormats: Record<string, { extension: string; mimeType: string }> = {
  'image/jpeg': { extension: 'jpg', mimeType: 'image/jpeg' },
  'image/png': { extension: 'png', mimeType: 'image/png' },
  'image/webp': { extension: 'webp', mimeType: 'image/webp' },
  'image/heic': { extension: 'heic', mimeType: 'image/heic' },
  'image/heif': { extension: 'heif', mimeType: 'image/heif' },
};

export type PublicContribution = {
  id: string;
  userId: string;
  displayName: string;
  photoUrl: string;
  taskTitle: string;
  description: string | null;
  createdAt: string;
};

export type CreateContributionInput = {
  userId: string;
  displayName: string;
  photo: ImagePickerAsset;
  taskTitle: string;
  description: string;
};

export async function createPublicContribution({
  userId,
  displayName,
  photo,
  taskTitle,
  description,
}: CreateContributionInput): Promise<PublicContribution> {
  const format = imageFormats[photo.mimeType?.toLowerCase() ?? ''];
  if (!format) {
    throw new Error('Choose a JPEG, PNG, WebP, HEIC, or HEIF image.');
  }

  const supabase = getSupabaseClient();
  const photoPath = `${userId}/${Crypto.randomUUID()}.${format.extension}`;
  const photoBytes = await fetch(photo.uri).then(async (response) => {
    if (!response.ok) throw new Error('The selected photo could not be read. Please choose it again.');
    return response.arrayBuffer();
  });

  const { error: uploadError } = await supabase.storage
    .from(contributionBucket)
    .upload(photoPath, photoBytes, {
      cacheControl: '3600',
      contentType: format.mimeType,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  let contribution: ContributionRow;
  try {
    const { data, error: insertError } = await supabase
      .from('contributions')
      .insert({
        user_id: userId,
        display_name: displayName,
        photo_path: photoPath,
        task_title: taskTitle.trim(),
        description: description.trim() || null,
      })
      .select('id, user_id, display_name, photo_path, task_title, description, created_at')
      .single();

    if (insertError) throw insertError;
    if (!data) throw new Error('The contribution was not returned after saving.');
    contribution = data;
  } catch (error) {
    // Avoid leaving an unreferenced public photo if saving its row failed.
    await supabase.storage.from(contributionBucket).remove([photoPath]).catch(() => undefined);
    throw error;
  }

  const { data: publicImage } = supabase.storage.from(contributionBucket).getPublicUrl(contribution.photo_path);
  return {
    id: contribution.id,
    userId: contribution.user_id,
    displayName: contribution.display_name,
    photoUrl: publicImage.publicUrl,
    taskTitle: contribution.task_title,
    description: contribution.description,
    createdAt: contribution.created_at,
  };
}

export async function getPublicContributions(): Promise<PublicContribution[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('contributions')
    .select('id, user_id, display_name, photo_path, task_title, description, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;

  return data.map((contribution) => {
    const { data: publicImage } = supabase.storage
      .from(contributionBucket)
      .getPublicUrl(contribution.photo_path);

    return {
      id: contribution.id,
      userId: contribution.user_id,
      displayName: contribution.display_name,
      photoUrl: publicImage.publicUrl,
      taskTitle: contribution.task_title,
      description: contribution.description,
      createdAt: contribution.created_at,
    };
  });
}
