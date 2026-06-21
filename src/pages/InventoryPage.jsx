import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Button, Paper,
  TextField, MenuItem, InputAdornment,
  FormControlLabel, Switch, Stack,
} from '@mui/material';
import { Add, AddCircleOutlined, Search } from '@mui/icons-material';

import { getProducts, deleteProduct } from '../api/products';
import { useNotification }            from '../contexts/NotificationContext';
import AddSupplyModal                 from '../components/inventory/AddSupplyModal';
import ProductFormModal               from '../components/inventory/ProductFormModal';
import ProductsTable                  from '../components/inventory/ProductsTable';
import DeleteConfirmDialog            from '../components/common/DeleteConfirmDialog';

const CATEGORIES = [
  'мясо', 'рыба', 'молочное', 'овощи',
  'фрукты', 'крупы', 'специи', 'напитки', 'прочее',
];

const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

export default function InventoryPage() {
  const notify = useNotification();

  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const [search,      setSearch]      = useState('');
  const [category,    setCategory]    = useState('all');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  const [supplyOpen,    setSupplyOpen]    = useState(false);
  const [supplyProduct, setSupplyProduct] = useState(null);

  const [productFormOpen,   setProductFormOpen]   = useState(false);
  const [productFormTarget, setProductFormTarget] = useState(null);

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

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter(p => {
      if (query && !p.name.toLowerCase().includes(query)) return false;
      if (category !== 'all' && p.category !== category)  return false;
      if (onlyLowStock && p.quantity > p.min_stock)        return false;
      return true;
    });
  }, [products, search, category, onlyLowStock]);

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

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
          <TextField
            placeholder="Поиск по названию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ flex: 2, minWidth: 200 }}
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
            select
            label="Категория"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            size="small"
            sx={{ flex: 1, minWidth: 160 }}
          >
            <MenuItem value="all">Все категории</MenuItem>
            {CATEGORIES.map(c => (
              <MenuItem key={c} value={c}>{capitalize(c)}</MenuItem>
            ))}
          </TextField>

          <FormControlLabel
            control={
              <Switch
                checked={onlyLowStock}
                onChange={(e) => setOnlyLowStock(e.target.checked)}
                color="error"
              />
            }
            label="Только с низким остатком"
            sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
          />
        </Stack>
      </Paper>

      {(search || category !== 'all' || onlyLowStock) && !loading && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Показано {filteredProducts.length} из {products.length}
        </Typography>
      )}

      <ProductsTable
        products={filteredProducts}
        loading={loading}
        onAddSupply={openSupplyModal}
        onEdit={openEditProduct}
        onDelete={openDeleteDialog}
      />

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