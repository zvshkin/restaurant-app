import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Tooltip,
} from '@mui/material';
import Add from '@mui/icons-material/Add';
import AddCircleOutlined from '@mui/icons-material/AddCircleOutlined';
import Warning from '@mui/icons-material/Warning';
import { getProducts } from '../api/products';
import AddSupplyModal from '../components/inventory/AddSupplyModal';

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      setProducts(await getProducts());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openSupplyModal = (product = null) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Склад</Typography>
        <Button variant="contained" startIcon={<Add />}
          onClick={() => openSupplyModal()}>
          Добавить поставку
        </Button>
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
              <TableCell align="center"><b>Поставка</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">Загрузка...</TableCell>
              </TableRow>
            ) : products.map(p => {
              const isLow = p.quantity <= p.min_stock;
              return (
                <TableRow key={p.id} hover>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.description}</TableCell>
                  <TableCell align="center">{p.unit}</TableCell>
                  <TableCell align="right">
                    <b style={{ color: isLow ? '#D62839' : 'inherit' }}>
                      {p.quantity} {p.unit}
                    </b>
                  </TableCell>
                  <TableCell align="right">{p.min_stock} {p.unit}</TableCell>
                  <TableCell align="center">
                    {isLow
                      ? <Chip icon={<Warning />} label="Мало" color="error" size="small" />
                      : <Chip label="ОК" color="success" size="small" />
                    }
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Добавить поставку">
                      <IconButton size="small" color="primary"
                        onClick={() => openSupplyModal(p)}>
                        <AddCircleOutlined />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <AddSupplyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        products={products}
        defaultProduct={selectedProduct}
        onSuccess={load}
      />
    </Box>
  );
}