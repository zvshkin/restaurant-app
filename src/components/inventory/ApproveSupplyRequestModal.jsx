import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, CircularProgress, Stack, Typography, Box,
} from '@mui/material';

export default function ApproveSupplyRequestModal({ open, onClose, onConfirm, request }) {
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [supplier,      setSupplier]     = useState('');
  const [errors,        setErrors]       = useState({});
  const [loading,        setLoading]      = useState(false);

  useEffect(() => {
    if (open) {
      setPricePerUnit('');
      setSupplier('');
      setErrors({});
    }
  }, [open]);

  const validate = () => {
    const next = {};
    if (!pricePerUnit || Number(pricePerUnit) < 0)
      next.pricePerUnit = 'Укажите корректную цену';
    if (!supplier.trim())
      next.supplier = 'Укажите поставщика';
    return next;
  };

  const handleConfirm = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await onConfirm(Number(pricePerUnit), supplier.trim());
    } finally {
      setLoading(false);
    }
  };

  if (!request) return null;

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Одобрить заявку</DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="body2" fontWeight={600}>
            {request.products?.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Запрошено: {request.quantity} {request.products?.unit}
            {request.requester?.full_name && ` · ${request.requester.full_name}`}
          </Typography>
        </Box>

        <Stack spacing={2}>
          <TextField
            label="Цена за единицу (₽) *"
            type="number"
            value={pricePerUnit}
            onChange={(e) => { setPricePerUnit(e.target.value); setErrors(p => ({ ...p, pricePerUnit: '' })); }}
            error={!!errors.pricePerUnit}
            helperText={errors.pricePerUnit}
            fullWidth
            autoFocus
            slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
          />
          <TextField
            label="Поставщик *"
            value={supplier}
            onChange={(e) => { setSupplier(e.target.value); setErrors(p => ({ ...p, supplier: '' })); }}
            error={!!errors.supplier}
            helperText={errors.supplier}
            fullWidth
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Отмена
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleConfirm}
          disabled={loading}
          sx={{ minWidth: 130 }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Одобрить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}