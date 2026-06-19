import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow,
  Select, MenuItem, FormControl,
  Chip, CircularProgress, Tooltip,
  Avatar, Stack,
} from '@mui/material';
import { PeopleOutlined } from '@mui/icons-material';

import { getProfiles, updateProfileRole } from '../../api/profiles';
import { useAuth }                         from '../../contexts/AuthContext';
import { useNotification }                 from '../../contexts/NotificationContext';

const ROLE_CONFIG = {
  admin:  { label: 'Администратор', color: 'primary' },
  chef:   { label: 'Повар',         color: 'warning' },
  client: { label: 'Клиент',        color: 'success' },
};

const ROLE_OPTIONS = [
  { value: 'admin',  label: 'Администратор' },
  { value: 'chef',   label: 'Повар'         },
  { value: 'client', label: 'Клиент'        },
];

const getInitials = (fullName, email) => {
  if (fullName) {
    return fullName
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
  return email?.[0]?.toUpperCase() ?? '?';
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('ru-RU', {
    day:   '2-digit',
    month: '2-digit',
    year:  'numeric',
  });

export default function UsersPage() {
  const { user }  = useAuth();
  const notify    = useNotification();

  const [profiles,  setProfiles]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProfiles(await getProfiles());
    } catch (err) {
      notify.error('Не удалось загрузить пользователей: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { load(); }, [load]);

  const handleRoleChange = async (profileId, newRole) => {
    if (profileId === user?.id) {
      notify.warning('Нельзя изменить собственную роль');
      return;
    }

    setUpdatingId(profileId);
    try {
      await updateProfileRole(profileId, newRole);

      setProfiles(prev =>
        prev.map(p => p.id === profileId ? { ...p, role: newRole } : p)
      );

      const roleLabel = ROLE_CONFIG[newRole]?.label ?? newRole;
      notify.success(`Роль обновлена на «${roleLabel}»`);
    } catch (err) {
      notify.error('Ошибка при смене роли: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={1.5} sx={{ mb: 3, alignItems: 'center' }}>
        <PeopleOutlined sx={{ fontSize: 28, color: 'primary.main' }} />
        <Typography variant="h5">Управление пользователями</Typography>
        {!loading && (
          <Chip
            label={`${profiles.length} чел.`}
            size="small"
            color="default"
            variant="outlined"
          />
        )}
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'background.default' }}>
              <TableCell><b>Пользователь</b></TableCell>
              <TableCell><b>Email</b></TableCell>
              <TableCell align="center"><b>Роль</b></TableCell>
              <TableCell align="center"><b>Дата регистрации</b></TableCell>
              <TableCell align="center"><b>Изменить роль</b></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : profiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Пользователи не найдены
                </TableCell>
              </TableRow>
            ) : profiles.map(profile => {
              const isSelf      = profile.id === user?.id;
              const isUpdating  = updatingId === profile.id;
              const roleConf    = ROLE_CONFIG[profile.role] ?? { label: profile.role, color: 'default' };
              const initials    = getInitials(profile.full_name, profile.email);

              return (
                <TableRow
                  key={profile.id}
                  hover
                  sx={isSelf ? { bgcolor: 'action.hover' } : undefined}
                >
                  <TableCell>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          fontSize: '0.85rem',
                          bgcolor: isSelf ? 'primary.main' : 'grey.400',
                        }}
                      >
                        {initials}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {profile.full_name || '—'}
                        </Typography>
                        {isSelf && (
                          <Typography variant="caption" color="primary.main">
                            Вы
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {profile.email}
                    </Typography>
                  </TableCell>

                  <TableCell align="center">
                    <Chip
                      label={roleConf.label}
                      color={roleConf.color}
                      size="small"
                      sx={{ fontWeight: 600, minWidth: 120 }}
                    />
                  </TableCell>

                  <TableCell align="center">
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(profile.created_at)}
                    </Typography>
                  </TableCell>

                  <TableCell align="center">
                    <Tooltip
                      title={isSelf ? 'Нельзя изменить собственную роль' : ''}
                      placement="left"
                    >
                      <span>
                        <FormControl size="small" sx={{ minWidth: 160 }} disabled={isSelf || isUpdating}>
                          <Select
                            value={profile.role}
                            onChange={e => handleRoleChange(profile.id, e.target.value)}
                            IconComponent={
                              isUpdating
                                ? () => <CircularProgress size={16} sx={{ mr: 1 }} />
                                : undefined
                            }
                            sx={{
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: isSelf ? 'divider' : undefined,
                              },
                            }}
                          >
                            {ROLE_OPTIONS.map(opt => (
                              <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}