import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';

interface Medicine {
  medicine_id: number;
  name: string;
  category: string;
  manufacturer: string;
  requires_prescription: boolean;
  description: string;
}

export default function Medicines() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    manufacturer: '',
    requires_prescription: false,
    description: ''
  });

  const loadMedicines = async () => {
    try {
      setLoading(true);
      const data = await api.get<Medicine[]>('/medicines');
      setMedicines(data);
    } catch (err) {
      console.error('Error fetching medicines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, []);

  const handleOpenAddModal = () => {
    setEditingMedicine(null);
    setFormData({
      name: '',
      category: '',
      manufacturer: '',
      requires_prescription: false,
      description: ''
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (med: Medicine) => {
    setEditingMedicine(med);
    setFormData({
      name: med.name,
      category: med.category || '',
      manufacturer: med.manufacturer || '',
      requires_prescription: Boolean(med.requires_prescription),
      description: med.description || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (editingMedicine) {
        // Edit Medicine
        await api.put(`/medicines/${editingMedicine.medicine_id}`, formData);
      } else {
        // Add Medicine
        await api.post('/medicines', formData);
      }
      setShowModal(false);
      loadMedicines();
    } catch (err) {
      console.error('Error saving medicine:', err);
      alert('Error saving medicine.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this medicine? This action cannot be undone.')) return;
    try {
      await api.delete(`/medicines/${id}`);
      loadMedicines();
    } catch (err) {
      console.error('Error deleting medicine:', err);
      alert('Cannot delete medicine. It might be referenced by medicine batches or prescriptions.');
    }
  };

  const filteredMedicines = medicines.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="header-bar">
        <div className="header-title">
          <h2>Medicines Manager</h2>
          <p>Register, update, and manage the stock descriptions of medicines.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus style={{ width: '1.1rem', height: '1.1rem' }} /> Add Medicine
        </button>
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1.1rem', height: '1.1rem', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name, category, manufacturer..."
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', fontWeight: 'bold' }}>Loading Medicines...</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Medicine Name</th>
                  <th>Category</th>
                  <th>Manufacturer</th>
                  <th>Prescription Needed</th>
                  <th>Description</th>
                  <th style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMedicines.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No medicines registered yet.
                    </td>
                  </tr>
                ) : (
                  filteredMedicines.map((med) => (
                    <tr key={med.medicine_id}>
                      <td>#{med.medicine_id}</td>
                      <td style={{ fontWeight: 600 }}>{med.name}</td>
                      <td>{med.category || 'N/A'}</td>
                      <td>{med.manufacturer || 'N/A'}</td>
                      <td>
                        <span className={`badge ${med.requires_prescription ? 'badge-danger' : 'badge-success'}`}>
                          {med.requires_prescription ? 'Required' : 'No'}
                        </span>
                      </td>
                      <td>{med.description || 'No description provided'}</td>
                      <td className="actions-cell">
                        <button className="action-btn edit" onClick={() => handleOpenEditModal(med)}>
                          <Edit2 />
                        </button>
                        <button className="action-btn delete" onClick={() => handleDelete(med.medicine_id)}>
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
              <h3>{editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Medicine Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category (e.g. Syrup, Tablet, Capsule)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Manufacturer</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1.5rem 0' }}>
                <input
                  type="checkbox"
                  id="requires_prescription"
                  checked={formData.requires_prescription}
                  onChange={(e) => setFormData({ ...formData, requires_prescription: e.target.checked })}
                />
                <label htmlFor="requires_prescription" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
                  Requires Prescription
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingMedicine ? 'Update' : 'Add Medicine'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
