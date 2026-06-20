import { supabase } from './supabaseClient';

const BUCKET = 'avatars';
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/apng'];

export const validateAvatarFile = (file) => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Поддерживаются только PNG, JPG, JPEG, APNG';
  }
  if (file.size > MAX_SIZE_BYTES) {
    return 'Размер файла не должен превышать 5 МБ';
  }
  return null;
};

const extFromMime = (mime) => {
  const map = {
    'image/png':  'png',
    'image/jpeg': 'jpg',
    'image/jpg':  'jpg',
    'image/apng': 'png',
  };
  return map[mime] ?? 'png';
};

export const uploadAvatar = async (targetUserId, file) => {
  const validationError = validateAvatarFile(file);
  if (validationError) throw new Error(validationError);

  const ext  = extFromMime(file.type);
  const path = `${targetUserId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: '3600',
    });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);

  const bustedUrl = `${publicUrl}?t=${Date.now()}`;

  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_url: bustedUrl })
    .eq('id', targetUserId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const removeAvatar = async (targetUserId, currentAvatarUrl) => {
  if (currentAvatarUrl) {
    const pathsToTry = [`${targetUserId}/avatar.png`, `${targetUserId}/avatar.jpg`];
    await supabase.storage.from(BUCKET).remove(pathsToTry);
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', targetUserId)
    .select()
    .single();

  if (error) throw error;
  return data;
};