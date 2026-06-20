import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, Button,
  Avatar, Stack, CircularProgress, Chip, Divider,
  IconButton, Tooltip, Alert,
} from '@mui/material';
import { ArrowBack, Save, PhotoCamera, Email as EmailIcon } from '@mui/icons-material';

import { getProfileById, updateProfile, updateEmail } from '../api/profiles';
import { removeAvatar }                                from '../api/avatars';
import { useAuth }                                      from '../contexts/AuthContext';
import { useNotification }                              from '../contexts/NotificationContext';
import AvatarUploadDialog                                from '../components/profile/AvatarUploadDialog';
import PhoneInput                                        from '../components/profile/PhoneInput';

const ROLE_CONFIG = {
  director: { label: 'Директор',      color: 'secondary' },
  admin:    { label: 'Администратор', color: 'primary'   },
  chef:     { label: 'Повар',         color: 'warning'   },
  client:   { label: 'Клиент',        color: 'success'   },
};

const getInitials = (fullName, email) => {
  if (fullName) {
    return fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }
  return email?.[0]?.toUpperCase() ?? '?';
};

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';

const emptyForm = { full_name: '', phone: '', bio: '', birth_date: '' };

export default function ProfilePage() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const notify     = useNotification();
  const {
    user,
    profile: myProfile,
    role: myRole,
    refreshProfile,
  } = useAuth();

  const isOwnProfile = !id;
  const targetId      = isOwnProfile ? user?.id : id;

  const canEdit = isOwnProfile || ['director', 'admin'].includes(myRole);

  const [targetProfile, setTargetProfile] = useState(isOwnProfile ? myProfile : null);
  const [loading,        setLoading]       = useState(!isOwnProfile);
  const [form,            setForm]          = useState(emptyForm);
  const [saving,          setSaving]        = useState(false);

  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [avatarRemoving,    setAvatarRemoving]   = useState(false);

  const [newEmail,        setNewEmail]        = useState('');
  const [emailSaving,     setEmailSaving]      = useState(false);
  const [emailSentNotice, setEmailSentNotice]  = useState(false);

  const load = useCallback(async () => {
    if (isOwnProfile) {
      if (myProfile) {
        setTargetProfile(myProfile);
        setForm({
          full_name:  myProfile.full_name  ?? '',
          phone:      myProfile.phone      ?? '',
          bio:        myProfile.bio        ?? '',
          birth_date: myProfile.birth_date ?? '',
        });
      }
      return;
    }

    setLoading(true);
    try {
      const data = await getProfileById(targetId);
      setTargetProfile(data);
      setForm({
        full_name:  data.full_name  ?? '',
        phone:      data.phone      ?? '',
        bio:        data.bio        ?? '',
        birth_date: data.birth_date ?? '',
      });
    } catch (err) {
      notify.error('Не удалось загрузить профиль: ' + err.message);
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  }, [isOwnProfile, myProfile, targetId, notify, navigate]);

  useEffect(() => { load(); }, [load]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const updated = await updateProfile(targetId, {
        full_name:  form.full_name.trim(),
        phone:      form.phone.trim()      || null,
        bio:        form.bio.trim()        || null,
        birth_date: form.birth_date        || null,
      });

      setTargetProfile(updated);

      if (isOwnProfile && refreshProfile) {
        await refreshProfile();
      }

      notify.success('Профиль обновлён');
    } catch (err) {
      notify.error('Ошибка при сохранении: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarSuccess = async (updatedProfile) => {
    setTargetProfile(updatedProfile);
    if (isOwnProfile && refreshProfile) {
      await refreshProfile();
    }
  };

  const handleAvatarRemove = async () => {
    setAvatarRemoving(true);
    try {
      const updated = await removeAvatar(targetId, targetProfile.avatar_url);
      setTargetProfile(updated);
      if (isOwnProfile && refreshProfile) {
        await refreshProfile();
      }
      notify.success('Аватар удалён');
    } catch (err) {
      notify.error('Ошибка: ' + err.message);
    } finally {
      setAvatarRemoving(false);
    }
  };

  const handleEmailSubmit = async () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      notify.warning('Введите корректный email');
      return;
    }
    if (newEmail.trim() === targetProfile.email) {
      notify.warning('Это текущий email');
      return;
    }

    setEmailSaving(true);
    try {
      await updateEmail(newEmail.trim());
      setEmailSentNotice(true);
      notify.success('Письмо с подтверждением отправлено');
    } catch (err) {
      notify.error('Ошибка: ' + err.message);
    } finally {
      setEmailSaving(false);
    }
  };

  if (loading || !targetProfile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const roleConf = ROLE_CONFIG[targetProfile.role] ?? { label: targetProfile.role, color: 'default' };
  const initials = getInitials(targetProfile.full_name, targetProfile.email);

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto' }}>

      {!isOwnProfile && (
        <Tooltip title="Назад к списку пользователей">
          <IconButton onClick={() => navigate('/admin/users')} sx={{ mb: 1 }}>
            <ArrowBack />
          </IconButton>
        </Tooltip>
      )}

      <Paper sx={{ p: { xs: 3, sm: 4 } }}>

        <Stack direction="row" spacing={3} sx={{ mb: 3, alignItems: 'center' }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={targetProfile.avatar_url || undefined}
              sx={{
                width: 88,
                height: 88,
                fontSize: '1.75rem',
                bgcolor: 'primary.main',
              }}
            >
              {initials}
            </Avatar>

            {canEdit && (
              <Tooltip title="Изменить аватар">
                <IconButton
                  size="small"
                  onClick={() => setAvatarDialogOpen(true)}
                  sx={{
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    bgcolor: 'background.paper',
                    border: '2px solid',
                    borderColor: 'background.paper',
                    boxShadow: 1,
                    '&:hover': { bgcolor: 'grey.100' },
                  }}
                >
                  <PhotoCamera fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" fontWeight={700}>
              {targetProfile.full_name || 'Без имени'}
            </Typography>
            <Chip
              label={roleConf.label}
              color={roleConf.color}
              size="small"
              sx={{ mt: 1, fontWeight: 600 }}
            />
            {isOwnProfile && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Это ваш профиль
              </Typography>
            )}

            {canEdit && targetProfile.avatar_url && (
              <Button
                size="small"
                color="inherit"
                onClick={handleAvatarRemove}
                disabled={avatarRemoving}
                sx={{ display: 'block', mt: 0.5, color: 'text.disabled' }}
              >
                {avatarRemoving ? 'Удаление...' : 'Удалить аватар'}
              </Button>
            )}
          </Box>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
          EMAIL
        </Typography>
        <Stack spacing={1.5} sx={{ mb: 3 }}>
          <TextField
            label="Текущий email"
            value={targetProfile.email ?? ''}
            disabled
            fullWidth
          />

          {isOwnProfile && (
            <>
              {emailSentNotice && (
                <Alert severity="info" onClose={() => setEmailSentNotice(false)}>
                  Письма с подтверждением отправлены на старый и новый адрес.
                  Email изменится только после перехода по ссылке в письме.
                </Alert>
              )}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  label="Новый email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="new-email@example.com"
                  fullWidth
                  size="small"
                />
                <Button
                  variant="outlined"
                  startIcon={emailSaving ? <CircularProgress size={16} /> : <EmailIcon />}
                  onClick={handleEmailSubmit}
                  disabled={emailSaving || !newEmail.trim()}
                  sx={{ minWidth: 180, flexShrink: 0 }}
                >
                  {emailSaving ? 'Отправка...' : 'Сменить email'}
                </Button>
              </Stack>
            </>
          )}
        </Stack>

        <Divider sx={{ mb: 3 }} />

        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
          ОСНОВНЫЕ ДАННЫЕ
        </Typography>
        <Stack spacing={2} sx={{ mb: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Роль"
              value={roleConf.label}
              disabled
              fullWidth
            />
            <TextField
              label="Дата регистрации"
              value={formatDate(targetProfile.created_at)}
              disabled
              fullWidth
            />
          </Stack>
        </Stack>

        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
          {canEdit ? 'РЕДАКТИРУЕМЫЕ ДАННЫЕ' : 'ДОПОЛНИТЕЛЬНО'}
        </Typography>
        <Stack spacing={2}>
          <TextField
            name="full_name"
            label="Полное имя"
            value={form.full_name}
            onChange={handleChange}
            disabled={!canEdit}
            fullWidth
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <PhoneInput
              name="phone"
              label="Телефон"
              value={form.phone}
              onChange={handleChange}
              disabled={!canEdit}
              fullWidth
            />
            <TextField
              name="birth_date"
              label="Дата рождения"
              type="date"
              value={form.birth_date}
              onChange={handleChange}
              disabled={!canEdit}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>

          <TextField
            name="bio"
            label="О себе"
            value={form.bio}
            onChange={handleChange}
            disabled={!canEdit}
            multiline
            minRows={3}
            maxRows={6}
            placeholder="Краткая заметка о сотруднике..."
            fullWidth
          />
        </Stack>

        {canEdit && (
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />}
              onClick={handleSubmit}
              disabled={saving}
              sx={{ minWidth: 200 }}
            >
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
          </Box>
        )}
      </Paper>

      <AvatarUploadDialog
        open={avatarDialogOpen}
        onClose={() => setAvatarDialogOpen(false)}
        onSuccess={handleAvatarSuccess}
        targetUserId={targetId}
      />
    </Box>
  );
}