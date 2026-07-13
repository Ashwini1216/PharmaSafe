import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Search, Eye, Trash2, Receipt } from 'lucide-react';

interface Sale {
  sale_id: number;
  customer_id: number;
  prescription_id: number | null;
  sale_date: string;
  total_amount: number;
}

interface SaleItem {
  sale_item_id: number;
  sale_id: number;
  medicine_id: number;
  batch_id: number;
  quantity: number;
  price: number;
  subtotal: number;
}

interface Customer {
  customer_id: number;
  customer_name: string;
}

interface Medicine {
  medicine_id: number;
  name: string;
}

interface Batch {
  batch_id: number;
  batch_number: string;
}

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [saleItems, setSaleItems] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [salesData, customersData, medicinesData, batchesData] = await Promise.all([
        api.get<Sale[]>('/sales'),
        api.get<Customer[]>('/customers'),
        api.get<Medicine[]>('/medicines'),
        api.get<Batch[]>('/batches')
      ]);
      setSales(salesData);
      setCustomers(customersData);
      setMedicines(medicinesData);
      setBatches(batchesData);
    } catch (err) {
      console.error('Error fetching sales history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleViewDetails = async (sale: Sale) => {
    try {
      setLoading(true);
      setSelectedSale(sale);
      const allItems = await api.get<SaleItem[]>('/sale-items');
      const filtered = allItems
        .filter(item => item.sale_id === sale.sale_id)
        .map(item => {
          const med = medicines.find(m => m.medicine_id === item.medicine_id);
          const bat = batches.find(b => b.batch_id === item.batch_id);
          return {
            ...item,
            medicineName: med ? med.name : `ID: ${item.medicine_id}`,
            batchNumber: bat ? bat.batch_number : `ID: ${item.batch_id}`
          };
        });
      setSaleItems(filtered);
      setShowViewModal(true);
    } catch (err) {
      console.error('Error loading sale items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this sale record? (Note: This will not automatically reverse stock adjustments).')) return;
    try {
      await api.delete(`/sales/${id}`);
      loadData();
    } catch (err) {
      console.error('Error deleting sale:', err);
      alert('Cannot delete sale record. It may have associated line items.');
    }
  };

  const filteredSales = sales.filter(s => {
    const cust = customers.find(c => c.customer_id === s.customer_id);
    const searchString = `${cust ? cust.customer_name : ''} Invoice#${s.sale_id}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="header-bar">
        <div className="header-title">
          <h2>Sales Transaction History</h2>
          <p>View past billing transactions, print invoices, and review medicine receipts.</p>
        </div>
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1.1rem', height: '1.1rem', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by customer name or Invoice ID..."
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading && sales.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', fontWeight: 'bold' }}>Loading sales history...</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Patient/Customer</th>
                  <th>Sale Date & Time</th>
                  <th>Prescription Rx</th>
                  <th>Total Amount</th>
                  <th style={{ width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No sales transaction records found.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((s) => {
                    const cust = customers.find(c => c.customer_id === s.customer_id);
                    return (
                      <tr key={s.sale_id}>
                        <td style={{ fontWeight: 600 }}>Invoice #{s.sale_id}</td>
                        <td style={{ fontWeight: 500 }}>{cust ? cust.customer_name : `ID: ${s.customer_id}`}</td>
                        <td>{new Date(s.sale_date).toLocaleString()}</td>
                        <td>
                          {s.prescription_id ? (
                            <span className="badge badge-success">Rx #{s.prescription_id}</span>
                          ) : (
                            <span className="badge badge-neutral">OTC (Over the counter)</span>
                          )}
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--success)' }}>
                          ${Number(s.total_amount).toFixed(2)}
                        </td>
                        <td className="actions-cell">
                          <button className="action-btn edit" title="View details" onClick={() => handleViewDetails(s)}>
                            <Eye style={{ width: '1.1rem', height: '1.1rem' }} />
                          </button>
                          <button className="action-btn delete" title="Delete" onClick={() => handleDelete(s.sale_id)}>
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

      {/* View Sale Details Modal */}
      {showViewModal && selectedSale && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Receipt className="sidebar-logo" style={{ color: 'var(--primary)' }} />
                Invoice #{selectedSale.sale_id} Details
              </h3>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>&times;</button>
            </div>
            
            <div style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div>
                <p><strong>Patient/Customer:</strong></p>
                <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  {customers.find(c => c.customer_id === selectedSale.customer_id)?.customer_name || 'N/A'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p><strong>Invoice Date:</strong></p>
                <p style={{ fontWeight: 600 }}>{new Date(selectedSale.sale_date).toLocaleDateString()}</p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>Billed Medicines</h4>
              <table className="data-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>Batch</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {saleItems.map((item) => (
                    <tr key={item.sale_item_id}>
                      <td style={{ fontWeight: 600 }}>{item.medicineName}</td>
                      <td>{item.batchNumber}</td>
                      <td>{item.quantity}</td>
                      <td>${Number(item.price).toFixed(2)}</td>
                      <td style={{ fontWeight: 600 }}>${Number(item.subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '1.5rem', borderTop: '1px dashed var(--border)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', fontSize: '1.1rem', fontWeight: 800 }}>
              <span>Total Invoice Amount: &nbsp;</span>
              <span style={{ color: 'var(--success)' }}>${Number(selectedSale.total_amount).toFixed(2)}</span>
            </div>

            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>Close Invoice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
