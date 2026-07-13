import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';

interface Customer {
  customer_id: number;
  customer_name: string;
  phone: string;
  email: string;
  address: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    email: '',
    address: ''
  });

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.get<Customer[]>('/customers');
      setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      customer_name: '',
      phone: '',
      email: '',
      address: ''
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormData({
      customer_name: cust.customer_name,
      phone: cust.phone || '',
      email: cust.email || '',
      address: cust.address || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_name.trim()) return;

    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.customer_id}`, formData);
      } else {
        await api.post('/customers', formData);
      }
      setShowModal(false);
      loadCustomers();
    } catch (err) {
      console.error('Error saving customer:', err);
      alert('Error saving customer.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) return;
    try {
      await api.delete(`/customers/${id}`);
      loadCustomers();
    } catch (err) {
      console.error('Error deleting customer:', err);
      alert('Cannot delete customer. It might be referenced by sales or prescriptions.');
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="header-bar">
        <div className="header-title">
          <h2>Customers Manager</h2>
          <p>Register and manage customer profiles, contact numbers, and billing records.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus style={{ width: '1.1rem', height: '1.1rem' }} /> Add Customer
        </button>
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1.1rem', height: '1.1rem', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name, phone, email..."
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', fontWeight: 'bold' }}>Loading Customers...</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No customers registered yet.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => (
                    <tr key={cust.customer_id}>
                      <td>#{cust.customer_id}</td>
                      <td style={{ fontWeight: 600 }}>{cust.customer_name}</td>
                      <td>{cust.phone || 'N/A'}</td>
                      <td>{cust.email || 'N/A'}</td>
                      <td>{cust.address || 'N/A'}</td>
                      <td className="actions-cell">
                        <button className="action-btn edit" onClick={() => handleOpenEditModal(cust)}>
                          <Edit2 />
                        </button>
                        <button className="action-btn delete" onClick={() => handleDelete(cust.customer_id)}>
                          <Trash2 />
                        </button>
                      </td>
                    </tr>
                  ))
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
              <h3>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Customer Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea
                  className="form-textarea"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingCustomer ? 'Update' : 'Add Customer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
