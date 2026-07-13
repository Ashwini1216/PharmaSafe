import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';

interface Batch {
  batch_id: number;
  medicine_id: number;
  supplier_id: number;
  purchase_id: number;
  batch_number: string;
  manufacture_date: string;
  expiry_date: string;
  quantity: number;
  cost_price: number;
  selling_price: number;
}

interface Medicine {
  medicine_id: number;
  name: string;
}

interface Supplier {
  supplier_id: number;
  supplier_name: string;
}

interface PurchaseOrder {
  purchase_id: number;
  purchase_date: string;
}

export default function Batches() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    medicine_id: '',
    supplier_id: '',
    purchase_id: '',
    batch_number: '',
    manufacture_date: '',
    expiry_date: '',
    quantity: '',
    cost_price: '',
    selling_price: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [batchesData, medicinesData, suppliersData, ordersData] = await Promise.all([
        api.get<Batch[]>('/batches'),
        api.get<Medicine[]>('/medicines'),
        api.get<Supplier[]>('/suppliers'),
        api.get<PurchaseOrder[]>('/purchase-orders')
      ]);
      setBatches(batchesData);
      setMedicines(medicinesData);
      setSuppliers(suppliersData);
      setPurchaseOrders(ordersData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingBatch(null);
    setFormData({
      medicine_id: medicines[0]?.medicine_id.toString() || '',
      supplier_id: suppliers[0]?.supplier_id.toString() || '',
      purchase_id: purchaseOrders[0]?.purchase_id.toString() || '',
      batch_number: '',
      manufacture_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      quantity: '',
      cost_price: '',
      selling_price: ''
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (batch: Batch) => {
    setEditingBatch(batch);
    setFormData({
      medicine_id: batch.medicine_id.toString(),
      supplier_id: batch.supplier_id.toString(),
      purchase_id: batch.purchase_id.toString(),
      batch_number: batch.batch_number,
      manufacture_date: batch.manufacture_date,
      expiry_date: batch.expiry_date,
      quantity: batch.quantity.toString(),
      cost_price: batch.cost_price.toString(),
      selling_price: batch.selling_price.toString()
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.batch_number.trim() || !formData.medicine_id || !formData.supplier_id || !formData.purchase_id) {
      alert('Please fill out all required fields.');
      return;
    }

    const payload = {
      medicine_id: Number(formData.medicine_id),
      supplier_id: Number(formData.supplier_id),
      purchase_id: Number(formData.purchase_id),
      batch_number: formData.batch_number,
      manufacture_date: formData.manufacture_date,
      expiry_date: formData.expiry_date,
      quantity: Number(formData.quantity),
      cost_price: Number(formData.cost_price),
      selling_price: Number(formData.selling_price)
    };

    try {
      if (editingBatch) {
        await api.put(`/batches/${editingBatch.batch_id}`, payload);
      } else {
        await api.post('/batches', payload);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      console.error('Error saving batch:', err);
      alert(err.message || 'Error saving batch. Ensure batch number is unique.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this medicine batch?')) return;
    try {
      await api.delete(`/batches/${id}`);
      loadData();
    } catch (err) {
      console.error('Error deleting batch:', err);
      alert('Cannot delete batch. It might be referenced by sale items.');
    }
  };

  const filteredBatches = batches.filter(b => {
    const med = medicines.find(m => m.medicine_id === b.medicine_id);
    const sup = suppliers.find(s => s.supplier_id === b.supplier_id);
    const searchString = `${med ? med.name : ''} ${sup ? sup.supplier_name : ''} ${b.batch_number}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="header-bar">
        <div className="header-title">
          <h2>Medicine Batches</h2>
          <p>Manage medicine stock batches, cost/selling prices, quantities, and expiration dates.</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handleOpenAddModal}
          disabled={medicines.length === 0 || suppliers.length === 0 || purchaseOrders.length === 0}
        >
          <Plus style={{ width: '1.1rem', height: '1.1rem' }} /> Add Stock Batch
        </button>
      </div>

      {(medicines.length === 0 || suppliers.length === 0 || purchaseOrders.length === 0) && !loading && (
        <div style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning-hover)', padding: '1rem', borderRadius: 'var(--radius-md)', fontWeight: 500 }}>
          Make sure you register at least one **Medicine**, one **Supplier**, and one **Purchase Order** before adding stock batches.
        </div>
      )}

      <div className="panel" style={{ padding: 0 }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1.1rem', height: '1.1rem', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by medicine, supplier, batch..."
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', fontWeight: 'bold' }}>Loading stock batches...</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Batch No.</th>
                  <th>Medicine</th>
                  <th>Supplier</th>
                  <th>Expiry Date</th>
                  <th>Cost Price</th>
                  <th>Selling Price</th>
                  <th>Qty Left</th>
                  <th style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No batches in stock.
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((b) => {
                    const med = medicines.find(m => m.medicine_id === b.medicine_id);
                    const sup = suppliers.find(s => s.supplier_id === b.supplier_id);
                    const isExpired = new Date(b.expiry_date) < new Date();
                    return (
                      <tr key={b.batch_id}>
                        <td style={{ fontWeight: 600 }}>{b.batch_number}</td>
                        <td style={{ fontWeight: 500 }}>{med ? med.name : `ID: ${b.medicine_id}`}</td>
                        <td>{sup ? sup.supplier_name : `ID: ${b.supplier_id}`}</td>
                        <td>
                          <span className={`badge ${isExpired ? 'badge-danger' : 'badge-neutral'}`}>
                            {b.expiry_date} {isExpired ? '(Expired)' : ''}
                          </span>
                        </td>
                        <td>${Number(b.cost_price).toFixed(2)}</td>
                        <td style={{ fontWeight: 600, color: 'var(--primary)' }}>${Number(b.selling_price).toFixed(2)}</td>
                        <td style={{ fontWeight: 700, color: b.quantity < 15 ? 'var(--danger)' : 'var(--success)' }}>
                          {b.quantity}
                        </td>
                        <td className="actions-cell">
                          <button className="action-btn edit" onClick={() => handleOpenEditModal(b)}>
                            <Edit2 />
                          </button>
                          <button className="action-btn delete" onClick={() => handleDelete(b.batch_id)}>
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
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3>{editingBatch ? 'Edit Stock Batch' : 'Add New Stock Batch'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Medicine *</label>
                  <select
                    className="form-select"
                    value={formData.medicine_id}
                    onChange={(e) => setFormData({ ...formData, medicine_id: e.target.value })}
                  >
                    {medicines.map(m => (
                      <option key={m.medicine_id} value={m.medicine_id}>{m.name}</option>
                    ))}
                  </select>
                </div>

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
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Purchase Order ID *</label>
                  <select
                    className="form-select"
                    value={formData.purchase_id}
                    onChange={(e) => setFormData({ ...formData, purchase_id: e.target.value })}
                  >
                    {purchaseOrders.map(o => (
                      <option key={o.purchase_id} value={o.purchase_id}>PO #{o.purchase_id} ({o.purchase_date})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Batch Number *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={formData.batch_number}
                    onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Manufacture Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.manufacture_date}
                    onChange={(e) => setFormData({ ...formData, manufacture_date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="form-input"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Cost Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    className="form-input"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Selling Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    className="form-input"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingBatch ? 'Update' : 'Add Batch'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
