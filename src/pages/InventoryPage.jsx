import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Paper,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Tooltip,
  Stack,
} from '@mui/material';
import {
  Add, AddCircleOutlined, Warning,
  EditOutlined, DeleteOutlined,
} from '@mui/icons-material';

import { getProducts, deleteProduct } from '../api/products';
import { useNotification }            from '../contexts/NotificationContext';
import AddSupplyModal                 from '../components/inventory/AddSupplyModal';
import ProductFormModal               from '../components/inventory/ProductFormModal';
import DeleteConfirmDialog            from '../components/common/DeleteConfirmDialog';

export default function InventoryPage() {
  const notify = useNotification();

  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const [supplyOpen,       setSupplyOpen]       = useState(false);
  const [supplyProduct,    setSupplyProduct]     = useState(null);

  const [productFormOpen,    setProductFormOpen]    = useState(false);
  const [productFormTarget,  setProductFormTarget]  = useState(null);

  const [deleteOpen,    setDeleteOpen]    = useState(false);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProducts(await getProducts());
    } catch (err) {
      notify.error('Не удалось загрузить продукты: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { load(); }, [load]);

  const openSupplyModal = (product = null) => {
    setSupplyProduct(product);
    setSupplyOpen(true);
  };

  const openCreateProduct = () => {
    setProductFormTarget(null);
    setProductFormOpen(true);
  };

  const openEditProduct = (product) => {
    setProductFormTarget(product);
    setProductFormOpen(true);
  };

  const openDeleteDialog = (product) => {
    setDeleteTarget(product);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteProduct(deleteTarget.id);
      notify.success(`Продукт «${deleteTarget.name}» удалён`);
      setDeleteOpen(false);
      setDeleteTarget(null);
      load();
    } catch (err) {
      notify.error(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Склад</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={openCreateProduct}
          >
            Добавить продукт
          </Button>
          <Button
            variant="contained"
            startIcon={<AddCircleOutlined />}
            onClick={() => openSupplyModal()}
          >
            Добавить поставку
          </Button>
        </Stack>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'background.default' }}>
              <TableCell><b>Название</b></TableCell>
              <TableCell><b>Описание</b></TableCell>
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
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  Продукты не найдены. Добавьте первый продукт.
                </TableCell>
              </TableRow>
            ) : products.map(p => {
              const isLow = p.quantity <= p.min_stock;
              return (
                <TableRow key={p.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{p.name}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                    {p.description || '—'}
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
                        <IconButton size="small" color="primary" onClick={() => openSupplyModal(p)}>
                          <AddCircleOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Редактировать">
                        <IconButton size="small" color="default" onClick={() => openEditProduct(p)}>
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Удалить">
                        <IconButton size="small" color="error" onClick={() => openDeleteDialog(p)}>
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

      <AddSupplyModal
        open={supplyOpen}
        onClose={() => setSupplyOpen(false)}
        products={products}
        defaultProduct={supplyProduct}
        onSuccess={load}
      />

      <ProductFormModal
        open={productFormOpen}
        onClose={() => setProductFormOpen(false)}
        onSuccess={load}
        product={productFormTarget}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        title="Удалить продукт?"
        description={
          deleteTarget
            ? `Вы собираетесь удалить «${deleteTarget.name}». ` +
              'Это действие необратимо. Продукт нельзя удалить, если он используется в рецептах блюд.'
            : 'Это действие необратимо.'
        }
      />
    </Box>
  );
}