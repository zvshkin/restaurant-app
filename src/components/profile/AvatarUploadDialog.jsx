import { useState, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Slider, Typography, CircularProgress,
  IconButton,
} from '@mui/material';
import { Close, PhotoCamera } from '@mui/icons-material';
import Cropper from 'react-easy-crop';

import { uploadAvatar, validateAvatarFile } from '../../api/avatars';
import { useNotification }                  from '../../contexts/NotificationContext';

const getCroppedBlob = (imageSrc, cropPixels, mimeType) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = imageSrc;

    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = cropPixels.width;
      canvas.height = cropPixels.height;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(
        image,
        cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height,
        0, 0, cropPixels.width, cropPixels.height
      );

      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Не удалось обработать изображение')),
        mimeType,
        0.92
      );
    };

    image.onerror = () => reject(new Error('Не удалось загрузить изображение'));
  });
};

export default function AvatarUploadDialog({ open, onClose, onSuccess, targetUserId }) {
  const notify = useNotification();

  const [imageSrc,     setImageSrc]     = useState(null);  // dataURL выбранного файла
  const [mimeType,      setMimeType]     = useState('image/png');
  const [crop,          setCrop]         = useState({ x: 0, y: 0 });
  const [zoom,           setZoom]         = useState(1);
  const [croppedPixels,  setCroppedPixels] = useState(null);
  const [uploading,      setUploading]    = useState(false);

  const handleClose = () => {
    if (uploading) return;
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedPixels(null);
    onClose();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateAvatarFile(file);
    if (validationError) {
      notify.error(validationError);
      e.target.value = '';
      return;
    }

    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result);
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedPixels(croppedAreaPixels);
  }, []);

  const handleUpload = async () => {
    if (!imageSrc || !croppedPixels) return;

    setUploading(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedPixels, mimeType);
      const file = new File([blob], `avatar.${mimeType.split('/')[1]}`, { type: mimeType });

      const updatedProfile = await uploadAvatar(targetUserId, file);

      notify.success('Аватар обновлён');
      onSuccess?.(updatedProfile);
      handleClose();
    } catch (err) {
      notify.error('Ошибка загрузки: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Загрузка аватара
        <IconButton onClick={handleClose} size="small" disabled={uploading}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {!imageSrc ? (
          <Box
            sx={{
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <PhotoCamera sx={{ fontSize: 40, color: 'text.disabled' }} />
            <Typography variant="body2" color="text.secondary">
              PNG, JPG, JPEG или APNG — до 5 МБ
            </Typography>
            <Button component="label" variant="outlined" size="small">
              Выбрать файл
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/apng"
                hidden
                onChange={handleFileSelect}
              />
            </Button>
          </Box>
        ) : (
          <Box>
            <Box sx={{ position: 'relative', width: '100%', height: 280, bgcolor: 'grey.900', borderRadius: 1 }}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </Box>

            <Box sx={{ mt: 2, px: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Масштаб
              </Typography>
              <Slider
                value={zoom}
                min={1}
                max={3}
                step={0.05}
                onChange={(_, value) => setZoom(value)}
                disabled={uploading}
                size="small"
              />
            </Box>

            <Button
              size="small"
              onClick={() => setImageSrc(null)}
              disabled={uploading}
              sx={{ mt: 0.5 }}
            >
              Выбрать другое фото
            </Button>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={handleClose} disabled={uploading} color="inherit">
          Отмена
        </Button>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!imageSrc || uploading}
          sx={{ minWidth: 130 }}
        >
          {uploading
            ? <CircularProgress size={20} color="inherit" />
            : 'Сохранить'
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
}