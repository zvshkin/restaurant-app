import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Paper, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Stack, InputAdornment,
} from '@mui/material';
import { Search } from '@mui/icons-material';

import { getSupplyHistory } from '../api/supplies';
import { useNotification }  from '../contexts/NotificationContext';

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';

const formatMoney = (n) =>
  new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

export default function SupplyHistoryPage() {
  const notify = useNotification();

  const [supplies, setSupplies] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const [productFilter,  setProductFilter]  = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [dateFrom,         setDateFrom]        = useState('');
  const [dateTo,           setDateTo]          = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSupplies(await getSupplyHistory());
    } catch (err) {
      notify.error('Не удалось загрузить историю поставок: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { load(); }, [load]);

  const productOptions = useMemo(() => {
    const map = new Map();
    supplies.forEach(s => {
      if (s.products?.id && !map.has(s.products.id)) {
        map.set(s.products.id, s.products.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [supplies]);

  const filtered = useMemo(() => {
    const supplierQuery = supplierFilter.trim().toLowerCase();

    return supplies.filter(s => {
      if (productFilter !== 'all' && s.product_id !== productFilter) return false;
      if (supplierQuery && !(s.supplier ?? '').toLowerCase().includes(supplierQuery)) return false;
      if (dateFrom && s.arrived_at < dateFrom) return false;
      if (dateTo   && s.arrived_at > dateTo)   return false;
      return true;
    });
  }, [supplies, productFilter, supplierFilter, dateFrom, dateTo]);

  const totalSum = useMemo(
    () => filtered.reduce((sum, s) => sum + Number(s.total_price ?? s.quantity * s.price_per_unit), 0),
    [filtered]
  );

  const filtersActive = productFilter !== 'all' || supplierFilter || dateFrom || dateTo;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>История поставок</Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }}>
          <TextField
            select
            label="Продукт"
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="all">Все продукты</MenuItem>
            {productOptions.map(p => (
              <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
            ))}
          </TextField>

          <TextField
            label="Поставщик"
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 180 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            label="Дата с"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            size="small"
            sx={{ minWidth: 160 }}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            label="Дата по"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            size="small"
            sx={{ minWidth: 160 }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>
      </Paper>

      {filtersActive && !loading && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Показано {filtered.length} из {supplies.length} поставок
        </Typography>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'background.default' }}>
              <TableCell><b>Продукт</b></TableCell>
              <TableCell align="right"><b>Количество</b></TableCell>
              <TableCell align="right"><b>Цена/ед.</b></TableCell>
              <TableCell align="right"><b>Сумма</b></TableCell>
              <TableCell><b>Поставщик</b></TableCell>
              <TableCell><b>Кто добавил</b></TableCell>
              <TableCell><b>Дата</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Поставки не найдены
                </TableCell>
              </TableRow>
            ) : filtered.map(s => (
              <TableRow key={s.id} hover>
                <TableCell>{s.products?.name ?? '—'}</TableCell>
                <TableCell align="right">{s.quantity} {s.products?.unit}</TableCell>
                <TableCell align="right">{formatMoney(s.price_per_unit)} ₽</TableCell>
                <TableCell align="right">
                  <b>{formatMoney(s.total_price ?? s.quantity * s.price_per_unit)} ₽</b>
                </TableCell>
                <TableCell>{s.supplier || '—'}</TableCell>
                <TableCell>{s.author?.full_name ?? s.author?.email ?? '—'}</TableCell>
                <TableCell>{formatDate(s.arrived_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>

          {!loading && filtered.length > 0 && (
            <TableBody>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell colSpan={3} align="right">
                  <Typography variant="body2" fontWeight={700}>Итого:</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={700} color="primary.main">
                    {formatMoney(totalSum)} ₽
                  </Typography>
                </TableCell>
                <TableCell colSpan={3} />
              </TableRow>
            </TableBody>
          )}
        </Table>
      </TableContainer>
    </Box>
  );
}