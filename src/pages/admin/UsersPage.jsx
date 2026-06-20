import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  director: { label: 'Директор',       color: 'secondary' },
  admin:    { label: 'Администратор',  color: 'primary'   },
  chef:     { label: 'Повар',          color: 'warning'   },
  client:   { label: 'Клиент',         color: 'success'   },
};

const DIRECTOR_ASSIGNABLE = [
  { value: 'admin',  label: 'Администратор' },
  { value: 'chef',   label: 'Повар'         },
  { value: 'client', label: 'Клиент'        },
];

const ADMIN_ASSIGNABLE = [
  { value: 'chef',   label: 'Повар'  },
  { value: 'client', label: 'Клиент' },
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
  const { user, role: myRole } = useAuth();
  const notify   = useNotification();
  const navigate = useNavigate();

  const [profiles,  setProfiles]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const iAmDirector = myRole === 'director';

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

  const canEditRow = (targetProfile) => {
    if (targetProfile.id === user?.id) return false;
    if (iAmDirector)                   return true;
    return ['chef', 'client'].includes(targetProfile.role);
  };

  const assignableRoles = iAmDirector ? DIRECTOR_ASSIGNABLE : ADMIN_ASSIGNABLE;

  const handleRoleChange = async (profileId, newRole) => {
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
              const isSelf     = profile.id === user?.id;
              const isUpdating = updatingId === profile.id;
              const roleConf   = ROLE_CONFIG[profile.role] ?? { label: profile.role, color: 'default' };
              const initials   = getInitials(profile.full_name, profile.email);

              const isDirectorRow = profile.role === 'director';
              const editable       = !isDirectorRow && canEditRow(profile);

              let lockReason = '';
              if (isSelf)               lockReason = 'Нельзя изменить собственную роль';
              else if (isDirectorRow)   lockReason = 'Роль директора назначается только через базу данных';
              else if (!editable)       lockReason = 'Недостаточно прав для изменения этой роли';

              return (
                <TableRow
                  key={profile.id}
                  hover
                  sx={isSelf ? { bgcolor: 'action.hover' } : undefined}
                >
                  <TableCell>
                    <Stack
                      direction="row"
                      spacing={1.5}
                      onClick={() => navigate(isSelf ? '/profile' : `/admin/users/${profile.id}/profile`)}
                      sx={{ cursor: 'pointer', alignItems: 'center', width: 'fit-content' }}
                    >
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
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{ '&:hover': { textDecoration: 'underline' } }}
                        >
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
                    {!editable ? (
                      <Tooltip title={lockReason} placement="left">
                        <Typography variant="body2" color="text.disabled">
                          —
                        </Typography>
                      </Tooltip>
                    ) : (
                      <FormControl size="small" sx={{ minWidth: 160 }} disabled={isUpdating}>
                        <Select
                          value={profile.role}
                          onChange={e => handleRoleChange(profile.id, e.target.value)}
                          IconComponent={
                            isUpdating
                              ? () => <CircularProgress size={16} sx={{ mr: 1 }} />
                              : undefined
                          }
                        >
                          {assignableRoles.map(opt => (
                            <MenuItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {!iAmDirector && !loading && profiles.length > 0 && (
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 2 }}>
          Администратор может менять роли только сотрудников с ролью «Повар» и «Клиент».
          Роли «Администратор» и «Директор» назначаются директором.
        </Typography>
      )}
    </Box>
  );
}