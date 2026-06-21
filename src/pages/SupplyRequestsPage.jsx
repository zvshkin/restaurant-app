import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Paper, Button, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, Stack, Tabs, Tab, IconButton, Tooltip,
} from '@mui/material';
import { Send, CheckCircleOutlined, CancelOutlined, Refresh } from '@mui/icons-material';

import { getSupplyRequests, createSupplyRequest, reviewSupplyRequest } from '../api/supplyRequests';
import { getProducts }                                                  from '../api/products';
import { useAuth }                                                      from '../contexts/AuthContext';
import { useNotification }                                              from '../contexts/NotificationContext';
import ApproveSupplyRequestModal                                        from '../components/inventory/ApproveSupplyRequestModal';

const STATUS_CONFIG = {
  pending:  { label: 'Ожидает',   color: 'warning' },
  approved: { label: 'Одобрена',  color: 'success' },
  rejected: { label: 'Отклонена', color: 'error'   },
};

const formatDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

const emptyForm = { product_id: '', quantity: '', comment: '' };

export default function SupplyRequestsPage() {
  const { user, role } = useAuth();
  const notify          = useNotification();

  const isChef          = role === 'chef';
  const isReviewer       = role === 'admin' || role === 'director';

  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [products, setProducts] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSupplyRequests();
      setRequests(data);
    } catch (err) {
      notify.error('Не удалось загрузить заявки: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  const loadProducts = useCallback(async () => {
    try {
      setProducts(await getProducts());
    } catch (err) {
      notify.error('Не удалось загрузить продукты: ' + err.message);
    }
  }, [notify]);

  useEffect(() => { load(); loadProducts(); }, [load, loadProducts]);

  const [form, setForm]   = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const myRequests = useMemo(
    () => requests.filter(r => r.requested_by === user?.id),
    [requests, user]
  );

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const next = {};
    if (!form.product_id) next.product_id = 'Выберите продукт';
    if (!form.quantity || Number(form.quantity) <= 0) next.quantity = 'Укажите количество > 0';
    return next;
  };

  const handleCreateRequest = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await createSupplyRequest({
        product_id: form.product_id,
        quantity:   Number(form.quantity),
        comment:    form.comment.trim() || null,
      });
      notify.success('Заявка отправлена на рассмотрение');
      setForm(emptyForm);
      load();
    } catch (err) {
      notify.error('Ошибка: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const [reviewTab, setReviewTab] = useState(0);

  const pendingRequests = useMemo(
    () => requests.filter(r => r.status === 'pending'),
    [requests]
  );

  const [historyStatusFilter, setHistoryStatusFilter] = useState('all');

  const historyRequests = useMemo(() => {
    if (historyStatusFilter === 'all') return requests;
    return requests.filter(r => r.status === historyStatusFilter);
  }, [requests, historyStatusFilter]);

  const [approveTarget, setApproveTarget] = useState(null);
  const [approveOpen,    setApproveOpen]    = useState(false);

  const openApprove = (request) => {
    setApproveTarget(request);
    setApproveOpen(true);
  };

  const handleApproveConfirm = async (price_per_unit, supplier) => {
    try {
      await reviewSupplyRequest(approveTarget.id, 'approved', { price_per_unit, supplier });
      notify.success('Заявка одобрена, поставка добавлена на склад');
      setApproveOpen(false);
      setApproveTarget(null);
      load();
    } catch (err) {
      notify.error('Ошибка: ' + err.message);
    }
  };

  const [rejectingId, setRejectingId] = useState(null);

  const handleReject = async (request) => {
    setRejectingId(request.id);
    try {
      await reviewSupplyRequest(request.id, 'rejected');
      notify.success('Заявка отклонена');
      load();
    } catch (err) {
      notify.error('Ошибка: ' + err.message);
    } finally {
      setRejectingId(null);
    }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ mb: 3, justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Заявки на поставку</Typography>
        <Tooltip title="Обновить">
        <span>
            <IconButton onClick={load} disabled={loading}>
            <Refresh />
            </IconButton>
        </span>
        </Tooltip>
      </Stack>

      {isChef && (
        <>
          <Paper sx={{ p: 2.5, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Новая заявка
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'flex-start' }}>
              <TextField
                select
                name="product_id"
                label="Продукт *"
                value={form.product_id}
                onChange={handleFormChange}
                error={!!formErrors.product_id}
                helperText={formErrors.product_id}
                size="small"
                sx={{ flex: 2, minWidth: 180 }}
              >
                {products.map(p => (
                  <MenuItem key={p.id} value={p.id}>{p.name} ({p.unit})</MenuItem>
                ))}
              </TextField>

              <TextField
                name="quantity"
                label="Количество *"
                type="number"
                value={form.quantity}
                onChange={handleFormChange}
                error={!!formErrors.quantity}
                helperText={formErrors.quantity}
                size="small"
                sx={{ flex: 1, minWidth: 120 }}
                slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
              />

              <TextField
                name="comment"
                label="Комментарий"
                value={form.comment}
                onChange={handleFormChange}
                size="small"
                sx={{ flex: 2, minWidth: 180 }}
                placeholder="Необязательно"
              />

              <Button
                variant="contained"
                startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Send />}
                onClick={handleCreateRequest}
                disabled={submitting}
                sx={{ minWidth: 160, flexShrink: 0 }}
              >
                Отправить заявку
              </Button>
            </Stack>
          </Paper>

          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
            Мои заявки
          </Typography>
          <RequestsTable
            requests={myRequests}
            loading={loading}
            showRequester={false}
          />
        </>
      )}

      {isReviewer && (
        <>
          <Tabs value={reviewTab} onChange={(_, v) => setReviewTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Tab label={`Входящие заявки${pendingRequests.length > 0 ? ` (${pendingRequests.length})` : ''}`} />
            <Tab label="История заявок" />
          </Tabs>

          {reviewTab === 0 && (
            loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : pendingRequests.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                Нет заявок, ожидающих рассмотрения
              </Typography>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'background.default' }}>
                      <TableCell><b>Продукт</b></TableCell>
                      <TableCell align="right"><b>Количество</b></TableCell>
                      <TableCell><b>Комментарий</b></TableCell>
                      <TableCell><b>От кого</b></TableCell>
                      <TableCell><b>Дата</b></TableCell>
                      <TableCell align="center"><b>Действия</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingRequests.map(r => (
                      <TableRow key={r.id} hover>
                        <TableCell>{r.products?.name}</TableCell>
                        <TableCell align="right">{r.quantity} {r.products?.unit}</TableCell>
                        <TableCell sx={{ maxWidth: 200, color: 'text.secondary' }}>
                          {r.comment || '—'}
                        </TableCell>
                        <TableCell>{r.requester?.full_name ?? r.requester?.email}</TableCell>
                        <TableCell>{formatDateTime(r.created_at)}</TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="Одобрить">
                              <IconButton size="small" color="success" onClick={() => openApprove(r)}>
                                <CheckCircleOutlined fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Отклонить">
                            <span>
                                <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleReject(r)}
                                disabled={rejectingId === r.id}
                                >
                                {rejectingId === r.id
                                    ? <CircularProgress size={16} />
                                    : <CancelOutlined fontSize="small" />
                                }
                                </IconButton>
                            </span>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          )}

          {reviewTab === 1 && (
            <>
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <TextField
                  select
                  label="Статус"
                  value={historyStatusFilter}
                  onChange={(e) => setHistoryStatusFilter(e.target.value)}
                  size="small"
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value="all">Все статусы</MenuItem>
                  <MenuItem value="pending">Ожидает</MenuItem>
                  <MenuItem value="approved">Одобрена</MenuItem>
                  <MenuItem value="rejected">Отклонена</MenuItem>
                </TextField>
              </Stack>

              <RequestsTable
                requests={historyRequests}
                loading={loading}
                showRequester
                showReviewer
              />
            </>
          )}
        </>
      )}

      {!isChef && !isReviewer && (
        <Typography color="text.secondary">У вас нет доступа к этому разделу.</Typography>
      )}

      <ApproveSupplyRequestModal
        open={approveOpen}
        onClose={() => { setApproveOpen(false); setApproveTarget(null); }}
        onConfirm={handleApproveConfirm}
        request={approveTarget}
      />
    </Box>
  );
}

function RequestsTable({ requests, loading, showRequester, showReviewer }) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (requests.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        Заявок пока нет
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: 'background.default' }}>
            <TableCell><b>Продукт</b></TableCell>
            <TableCell align="right"><b>Количество</b></TableCell>
            <TableCell align="center"><b>Статус</b></TableCell>
            {showRequester && <TableCell><b>От кого</b></TableCell>}
            {showReviewer && <TableCell><b>Рассмотрел</b></TableCell>}
            <TableCell><b>Создана</b></TableCell>
            <TableCell><b>Рассмотрена</b></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {requests.map(r => {
            const statusConf = STATUS_CONFIG[r.status] ?? { label: r.status, color: 'default' };
            return (
              <TableRow key={r.id} hover>
                <TableCell>{r.products?.name}</TableCell>
                <TableCell align="right">{r.quantity} {r.products?.unit}</TableCell>
                <TableCell align="center">
                  <Chip label={statusConf.label} color={statusConf.color} size="small" />
                </TableCell>
                {showRequester && (
                  <TableCell>{r.requester?.full_name ?? r.requester?.email ?? '—'}</TableCell>
                )}
                {showReviewer && (
                  <TableCell>{r.reviewer?.full_name ?? r.reviewer?.email ?? '—'}</TableCell>
                )}
                <TableCell>{formatDateTime(r.created_at)}</TableCell>
                <TableCell>{formatDateTime(r.reviewed_at)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}