import {
  Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button, CircularProgress,
} from '@mui/material';
import { DeleteOutlined } from '@mui/icons-material';

export default function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  title       = 'Подтвердите удаление',
  description = 'Это действие необратимо. Вы уверены?',
  loading     = false,
}) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>
        {title}
      </DialogTitle>

      <DialogContent>
        <DialogContentText>
          {description}
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          color="inherit"
        >
          Отмена
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color="error"
          startIcon={
            loading
              ? <CircularProgress size={16} color="inherit" />
              : <DeleteOutlined />
          }
          sx={{ minWidth: 120 }}
        >
          {loading ? 'Удаление...' : 'Удалить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}