import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Plus, Trash2, Search } from 'lucide-react';

interface PurchaseOrder {
  purchase_id: number;
  supplier_id: number;
  purchase_date: string;
  total_amount: number;
}

interface Supplier {
  supplier_id: number;
  supplier_name: string;
}

export default function PurchaseOrders() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    supplier_id: '',
    purchase_date: '',
    total_amount: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, suppliersData] = await Promise.all([
        api.get<PurchaseOrder[]>('/purchase-orders'),
        api.get<Supplier[]>('/suppliers')
      ]);
      setOrders(ordersData);
      setSuppliers(suppliersData);
    } catch (err) {
      console.error('Error fetching PO data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    setFormData({
      supplier_id: suppliers[0]?.supplier_id.toString() || '',
      purchase_date: new Date().toISOString().split('T')[0],
      total_amount: ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplier_id || !formData.total_amount) return;

    try {
      await api.post('/purchase-orders', {
        supplier_id: Number(formData.supplier_id),
        purchase_date: formData.purchase_date,
        total_amount: Number(formData.total_amount)
      });
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error('Error creating PO:', err);
      alert('Error creating Purchase Order.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this purchase order?')) return;
    try {
      await api.delete(`/purchase-orders/${id}`);
      loadData();
    } catch (err) {
      console.error('Error deleting purchase order:', err);
      alert('Cannot delete purchase order. It might be referenced by medicine stock batches.');
    }
  };

  const filteredOrders = orders.filter(o => {
    const sup = suppliers.find(s => s.supplier_id === o.supplier_id);
    const searchString = `${sup ? sup.supplier_name : ''} PO#${o.purchase_id}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="header-bar">
        <div className="header-title">
          <h2>Purchase Orders</h2>
          <p>Create and record purchase transactions from suppliers.</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handleOpenAddModal}
          disabled={suppliers.length === 0}
        >
          <Plus style={{ width: '1.1rem', height: '1.1rem' }} /> Add Purchase Order
        </button>
      </div>

      {suppliers.length === 0 && !loading && (
        <div style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning-hover)', padding: '1rem', borderRadius: 'var(--radius-md)', fontWeight: 500 }}>
          You must register at least one **Supplier** before adding purchase orders.
        </div>
      )}

      <div className="panel" style={{ padding: 0 }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1.1rem', height: '1.1rem', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by supplier name or PO ID..."
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', fontWeight: 'bold' }}>Loading purchase orders...</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>PO ID</th>
                  <th>Supplier</th>
                  <th>Order Date</th>
                  <th>Total Amount</th>
                  <th style={{ width: '80px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No purchase orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => {
                    const sup = suppliers.find(s => s.supplier_id === o.supplier_id);
                    return (
                      <tr key={o.purchase_id}>
                        <td style={{ fontWeight: 600 }}>PO #{o.purchase_id}</td>
                        <td style={{ fontWeight: 500 }}>{sup ? sup.supplier_name : `ID: ${o.supplier_id}`}</td>
                        <td>{o.purchase_date}</td>
                        <td style={{ fontWeight: 700, color: 'var(--success)' }}>
                          ${Number(o.total_amount).toFixed(2)}
                        </td>
                        <td className="actions-cell">
                          <button className="action-btn delete" onClick={() => handleDelete(o.purchase_id)}>
                            <Trash2 />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create Purchase Order</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Supplier *</label>
                <select
                  className="form-select"
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                >
                  {suppliers.map(s => (
                    <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Order Date *</label>
                <input
                  type="date"
                  required
                  className="form-input"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Total Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="form-input"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
