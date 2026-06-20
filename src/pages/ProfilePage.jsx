import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, Button,
  Avatar, Stack, CircularProgress, Chip, Divider,
  IconButton, Tooltip,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';

import { getProfileById, updateProfile } from '../api/profiles';
import { useAuth }                       from '../contexts/AuthContext';
import { useNotification }               from '../contexts/NotificationContext';

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

const emptyForm = { full_name: '', phone: '', bio: '' };

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

  const load = useCallback(async () => {
    if (isOwnProfile) {
      if (myProfile) {
        setTargetProfile(myProfile);
        setForm({
          full_name: myProfile.full_name ?? '',
          phone:     myProfile.phone     ?? '',
          bio:       myProfile.bio       ?? '',
        });
      }
      return;
    }

    setLoading(true);
    try {
      const data = await getProfileById(targetId);
      setTargetProfile(data);
      setForm({
        full_name: data.full_name ?? '',
        phone:     data.phone     ?? '',
        bio:       data.bio       ?? '',
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
        full_name: form.full_name.trim(),
        phone:     form.phone.trim()  || null,
        bio:       form.bio.trim()    || null,
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

  if (loading || !targetProfile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const roleConf  = ROLE_CONFIG[targetProfile.role] ?? { label: targetProfile.role, color: 'default' };
  const initials  = getInitials(targetProfile.full_name, targetProfile.email);

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

        <Stack direction="row" spacing={3} sx={{ mb: 3, alignItems: 'center'}}>
          <Avatar
            sx={{
              width: 88,
              height: 88,
              fontSize: '1.75rem',
              bgcolor: 'primary.main',
            }}
          >
            {initials}
          </Avatar>
          <Box>
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
          </Box>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
          ОСНОВНЫЕ ДАННЫЕ
        </Typography>
        <Stack spacing={2} sx={{ mb: 3 }}>
          <TextField
            label="Email"
            value={targetProfile.email ?? ''}
            disabled
            fullWidth
          />
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
          <TextField
            name="phone"
            label="Телефон"
            value={form.phone}
            onChange={handleChange}
            disabled={!canEdit}
            placeholder="+7 (999) 123-45-67"
            fullWidth
          />
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
    </Box>
  );
}