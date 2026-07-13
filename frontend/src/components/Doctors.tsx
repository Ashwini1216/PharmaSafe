import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';

interface Doctor {
  doctor_id: number;
  doctor_name: string;
  specialization: string;
  phone: string;
  hospital_name: string;
}

export default function Doctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    doctor_name: '',
    specialization: '',
    phone: '',
    hospital_name: ''
  });

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const data = await api.get<Doctor[]>('/doctors');
      setDoctors(data);
    } catch (err) {
      console.error('Error fetching doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const handleOpenAddModal = () => {
    setEditingDoctor(null);
    setFormData({
      doctor_name: '',
      specialization: '',
      phone: '',
      hospital_name: ''
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (doc: Doctor) => {
    setEditingDoctor(doc);
    setFormData({
      doctor_name: doc.doctor_name,
      specialization: doc.specialization || '',
      phone: doc.phone || '',
      hospital_name: doc.hospital_name || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.doctor_name.trim()) return;

    try {
      if (editingDoctor) {
        await api.put(`/doctors/${editingDoctor.doctor_id}`, formData);
      } else {
        await api.post('/doctors', formData);
      }
      setShowModal(false);
      loadDoctors();
    } catch (err) {
      console.error('Error saving doctor:', err);
      alert('Error saving doctor.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this doctor? This action cannot be undone.')) return;
    try {
      await api.delete(`/doctors/${id}`);
      loadDoctors();
    } catch (err) {
      console.error('Error deleting doctor:', err);
      alert('Cannot delete doctor. They might have prescriptions referenced in the system.');
    }
  };

  const filteredDoctors = doctors.filter(d => 
    d.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.hospital_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="header-bar">
        <div className="header-title">
          <h2>Doctors Manager</h2>
          <p>Register prescribing doctors, specializations, and associated hospital systems.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus style={{ width: '1.1rem', height: '1.1rem' }} /> Add Doctor
        </button>
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1.1rem', height: '1.1rem', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name, spec, hospital..."
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', fontWeight: 'bold' }}>Loading Doctors...</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Doctor Name</th>
                  <th>Specialization</th>
                  <th>Phone</th>
                  <th>Hospital Name</th>
                  <th style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDoctors.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No doctors registered yet.
                    </td>
                  </tr>
                ) : (
                  filteredDoctors.map((doc) => (
                    <tr key={doc.doctor_id}>
                      <td>#{doc.doctor_id}</td>
                      <td style={{ fontWeight: 600 }}>{doc.doctor_name}</td>
                      <td>{doc.specialization || 'N/A'}</td>
                      <td>{doc.phone || 'N/A'}</td>
                      <td>{doc.hospital_name || 'N/A'}</td>
                      <td className="actions-cell">
                        <button className="action-btn edit" onClick={() => handleOpenEditModal(doc)}>
                          <Edit2 />
                        </button>
                        <button className="action-btn delete" onClick={() => handleDelete(doc.doctor_id)}>
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
              <h3>{editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Doctor Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.doctor_name}
                  onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Specialization</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
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
                <label className="form-label">Hospital/Clinic Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.hospital_name}
                  onChange={(e) => setFormData({ ...formData, hospital_name: e.target.value })}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingDoctor ? 'Update' : 'Add Doctor'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
