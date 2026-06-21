import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, IconButton,
  Tooltip, Stack, Typography, Box,
} from '@mui/material';
import {
  Warning, AddCircleOutlined,
  EditOutlined, DeleteOutlined, Inventory2Outlined,
} from '@mui/icons-material';

const CATEGORY_COLORS = {
  'мясо':     'error',
  'рыба':     'info',
  'молочное': 'primary',
  'овощи':    'success',
  'фрукты':   'warning',
  'крупы':    'default',
  'специи':   'secondary',
  'напитки':  'info',
  'прочее':   'default',
};

const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

export default function ProductsTable({ products, loading, onAddSupply, onEdit, onDelete }) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: 'background.default' }}>
            <TableCell><b>Название</b></TableCell>
            <TableCell align="center"><b>Категория</b></TableCell>
            <TableCell align="center"><b>Ед. изм.</b></TableCell>
            <TableCell align="right"><b>Остаток</b></TableCell>
            <TableCell align="right"><b>Минимум</b></TableCell>
            <TableCell align="center"><b>Статус</b></TableCell>
            <TableCell align="center"><b>Действия</b></TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                Загрузка...
              </TableCell>
            </TableRow>
          ) : products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                <Stack alignItems="center" spacing={1} sx={{ color: 'text.secondary' }}>
                  <Inventory2Outlined sx={{ fontSize: 36, opacity: 0.4 }} />
                  <Typography variant="body2">
                    Продукты не найдены
                  </Typography>
                </Stack>
              </TableCell>
            </TableRow>
          ) : products.map(p => {
            const isLow = p.quantity <= p.min_stock;

            const tooltipLines = [];
            if (p.storage_conditions) tooltipLines.push(p.storage_conditions);
            if (p.shelf_life_days)    tooltipLines.push(`Срок годности: ${p.shelf_life_days} дн.`);
            if (p.manufacturer)       tooltipLines.push(`Производитель: ${p.manufacturer}`);
            const tooltipText = tooltipLines.length > 0 ? tooltipLines.join(' · ') : null;

            const NameCell = (
              <TableCell sx={{ fontWeight: 500 }}>
                {p.name}
                {p.description && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {p.description}
                  </Typography>
                )}
              </TableCell>
            );

            return (
              <TableRow key={p.id} hover>
                {tooltipText ? (
                  <Tooltip title={tooltipText} placement="top" arrow>
                    {NameCell}
                  </Tooltip>
                ) : NameCell}

                <TableCell align="center">
                  <Chip
                    label={capitalize(p.category)}
                    size="small"
                    color={CATEGORY_COLORS[p.category] ?? 'default'}
                    variant="outlined"
                  />
                </TableCell>

                <TableCell align="center">{p.unit}</TableCell>

                <TableCell align="right">
                  <b style={{ color: isLow ? '#D62839' : 'inherit' }}>
                    {p.quantity} {p.unit}
                  </b>
                </TableCell>

                <TableCell align="right">
                  {p.min_stock} {p.unit}
                </TableCell>

                <TableCell align="center">
                  {isLow
                    ? <Chip icon={<Warning />} label="Мало"  color="error"   size="small" />
                    : <Chip                    label="ОК"    color="success" size="small" />
                  }
                </TableCell>

                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center' }}>
                    <Tooltip title="Добавить поставку">
                      <IconButton size="small" color="primary" onClick={() => onAddSupply(p)}>
                        <AddCircleOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Редактировать">
                      <IconButton size="small" color="default" onClick={() => onEdit(p)}>
                        <EditOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Удалить">
                      <IconButton size="small" color="error" onClick={() => onDelete(p)}>
                        <DeleteOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}