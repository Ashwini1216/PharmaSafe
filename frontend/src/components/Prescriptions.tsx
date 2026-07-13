import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Plus, Trash2, Search, Eye, FileText } from 'lucide-react';

interface Prescription {
  prescription_id: number;
  customer_id: number;
  doctor_id: number;
  prescription_date: string;
  notes: string;
}

interface PrescriptionItem {
  prescription_item_id: number;
  prescription_id: number;
  medicine_id: number;
  quantity: number;
  dosage: string;
}

interface Customer {
  customer_id: number;
  customer_name: string;
}

interface Doctor {
  doctor_id: number;
  doctor_name: string;
}

interface Medicine {
  medicine_id: number;
  name: string;
}

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [prescriptionItems, setPrescriptionItems] = useState<any[]>([]);

  // Add Form State
  const [formData, setFormData] = useState({
    customer_id: '',
    doctor_id: '',
    prescription_date: '',
    notes: ''
  });

  // Prescription Items addition list
  const [itemsList, setItemsList] = useState<any[]>([]);
  const [itemInput, setItemInput] = useState({
    medicine_id: '',
    quantity: '1',
    dosage: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [rxData, customersData, doctorsData, medicinesData] = await Promise.all([
        api.get<Prescription[]>('/prescriptions'),
        api.get<Customer[]>('/customers'),
        api.get<Doctor[]>('/doctors'),
        api.get<Medicine[]>('/medicines')
      ]);
      setPrescriptions(rxData);
      setCustomers(customersData);
      setDoctors(doctorsData);
      setMedicines(medicinesData);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    setFormData({
      customer_id: customers[0]?.customer_id.toString() || '',
      doctor_id: doctors[0]?.doctor_id.toString() || '',
      prescription_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setItemsList([]);
    setItemInput({
      medicine_id: medicines[0]?.medicine_id.toString() || '',
      quantity: '1',
      dosage: '1 tablet daily'
    });
    setShowAddModal(true);
  };

  const handleAdditemToList = () => {
    if (!itemInput.medicine_id) return;
    const med = medicines.find(m => m.medicine_id === Number(itemInput.medicine_id));
    const name = med ? med.name : 'Unknown';
    
    // Check duplicate
    if (itemsList.some(item => item.medicine_id === Number(itemInput.medicine_id))) {
      alert('This medicine is already added to the prescription list.');
      return;
    }

    setItemsList([
      ...itemsList,
      {
        medicine_id: Number(itemInput.medicine_id),
        name,
        quantity: Number(itemInput.quantity),
        dosage: itemInput.dosage
      }
    ]);
  };

  const handleRemoveItemFromList = (index: number) => {
    setItemsList(itemsList.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id || !formData.doctor_id) return;
    if (itemsList.length === 0) {
      alert('Please add at least one medicine item to the prescription.');
      return;
    }

    try {
      setLoading(true);
      // 1. Create prescription
      const rxResponse = await api.post<{ message: string; prescription_id: number }>('/prescriptions', {
        customer_id: Number(formData.customer_id),
        doctor_id: Number(formData.doctor_id),
        prescription_date: formData.prescription_date,
        notes: formData.notes
      });

      const prescriptionId = rxResponse.prescription_id;

      // 2. Add prescription items
      for (const item of itemsList) {
        await api.post('/prescription-items', {
          prescription_id: prescriptionId,
          medicine_id: item.medicine_id,
          quantity: item.quantity,
          dosage: item.dosage
        });
      }

      setShowAddModal(false);
      loadData();
    } catch (err) {
      console.error('Error creating prescription:', err);
      alert('Error creating prescription.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (rx: Prescription) => {
    try {
      setLoading(true);
      setSelectedPrescription(rx);
      const allItems = await api.get<PrescriptionItem[]>('/prescription-items');
      const filtered = allItems
        .filter(item => item.prescription_id === rx.prescription_id)
        .map(item => {
          const med = medicines.find(m => m.medicine_id === item.medicine_id);
          return {
            ...item,
            medicineName: med ? med.name : `ID: ${item.medicine_id}`
          };
        });
      setPrescriptionItems(filtered);
      setShowViewModal(true);
    } catch (err) {
      console.error('Error getting details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this prescription record?')) return;
    try {
      await api.delete(`/prescriptions/${id}`);
      loadData();
    } catch (err) {
      console.error('Error deleting prescription:', err);
      alert('Cannot delete prescription. It might be referenced by sales logs or prescription items.');
    }
  };

  const filteredRx = prescriptions.filter(rx => {
    const cust = customers.find(c => c.customer_id === rx.customer_id);
    const doc = doctors.find(d => d.doctor_id === rx.doctor_id);
    const searchString = `${cust ? cust.customer_name : ''} ${doc ? doc.doctor_name : ''} Rx#${rx.prescription_id}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="header-bar">
        <div className="header-title">
          <h2>Prescriptions Directory</h2>
          <p>Record prescribing details, medicines prescribed, dosages, and notes.</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handleOpenAddModal}
          disabled={customers.length === 0 || doctors.length === 0 || medicines.length === 0}
        >
          <Plus style={{ width: '1.1rem', height: '1.1rem' }} /> Add Prescription
        </button>
      </div>

      {(customers.length === 0 || doctors.length === 0 || medicines.length === 0) && !loading && (
        <div style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning-hover)', padding: '1rem', borderRadius: 'var(--radius-md)', fontWeight: 500 }}>
          Make sure you register at least one **Customer**, one **Doctor**, and one **Medicine** before creating prescriptions.
        </div>
      )}

      <div className="panel" style={{ padding: 0 }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1.1rem', height: '1.1rem', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by customer, doctor or Rx ID..."
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading && prescriptions.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', fontWeight: 'bold' }}>Loading prescriptions...</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rx ID</th>
                  <th>Patient/Customer</th>
                  <th>Doctor</th>
                  <th>Prescribed Date</th>
                  <th>Notes</th>
                  <th style={{ width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRx.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No prescription records found.
                    </td>
                  </tr>
                ) : (
                  filteredRx.map((rx) => {
                    const cust = customers.find(c => c.customer_id === rx.customer_id);
                    const doc = doctors.find(d => d.doctor_id === rx.doctor_id);
                    return (
                      <tr key={rx.prescription_id}>
                        <td style={{ fontWeight: 600 }}>Rx #{rx.prescription_id}</td>
                        <td style={{ fontWeight: 500 }}>{cust ? cust.customer_name : `ID: ${rx.customer_id}`}</td>
                        <td>Dr. {doc ? doc.doctor_name : `ID: ${rx.doctor_id}`}</td>
                        <td>{rx.prescription_date}</td>
                        <td>{rx.notes || 'N/A'}</td>
                        <td className="actions-cell">
                          <button className="action-btn edit" title="View details" onClick={() => handleViewDetails(rx)}>
                            <Eye style={{ width: '1.1rem', height: '1.1rem' }} />
                          </button>
                          <button className="action-btn delete" title="Delete" onClick={() => handleDelete(rx.prescription_id)}>
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>Create Prescription</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Patient (Customer) *</label>
                  <select
                    className="form-select"
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  >
                    {customers.map(c => (
                      <option key={c.customer_id} value={c.customer_id}>{c.customer_name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Doctor *</label>
                  <select
                    className="form-select"
                    value={formData.doctor_id}
                    onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                  >
                    {doctors.map(d => (
                      <option key={d.doctor_id} value={d.doctor_id}>Dr. {d.doctor_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Prescription Date *</label>
                <input
                  type="date"
                  required
                  className="form-input"
                  value={formData.prescription_date}
                  onChange={(e) => setFormData({ ...formData, prescription_date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Diagnosis / General Notes</label>
                <textarea
                  className="form-textarea"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              {/* Prescription Items subform */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem', marginTop: '1.5rem', backgroundColor: '#f8fafc' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: '#0f172a' }}>Add Medicine Prescribed</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 2fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <select
                    className="form-select"
                    value={itemInput.medicine_id}
                    onChange={(e) => setItemInput({ ...itemInput, medicine_id: e.target.value })}
                  >
                    {medicines.map(m => (
                      <option key={m.medicine_id} value={m.medicine_id}>{m.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    className="form-input"
                    value={itemInput.quantity}
                    onChange={(e) => setItemInput({ ...itemInput, quantity: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Dosage (e.g. 1-0-1)"
                    className="form-input"
                    value={itemInput.dosage}
                    onChange={(e) => setItemInput({ ...itemInput, dosage: e.target.value })}
                  />
                </div>
                <button type="button" className="btn btn-secondary" style={{ width: '100%', padding: '0.5rem' }} onClick={handleAdditemToList}>
                  Add Item To Prescription List
                </button>

                <div style={{ marginTop: '1rem' }}>
                  {itemsList.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                      <span><strong>{item.name}</strong> (Qty: {item.quantity}) - {item.dosage}</span>
                      <button type="button" className="action-btn delete" onClick={() => handleRemoveItemFromList(i)}>
                        <Trash2 style={{ width: '0.95rem', height: '0.95rem' }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Prescription</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedPrescription && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText className="sidebar-logo" style={{ color: 'var(--primary)' }} />
                Rx #{selectedPrescription.prescription_id} Details
              </h3>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>&times;</button>
            </div>
            
            <div style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
              <p><strong>Patient Name:</strong> {customers.find(c => c.customer_id === selectedPrescription.customer_id)?.customer_name || 'N/A'}</p>
              <p><strong>Prescribed By:</strong> Dr. {doctors.find(d => d.doctor_id === selectedPrescription.doctor_id)?.doctor_name || 'N/A'}</p>
              <p><strong>Order Date:</strong> {selectedPrescription.prescription_date}</p>
              <p><strong>General Notes:</strong> {selectedPrescription.notes || 'N/A'}</p>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>Prescribed Medicines</h4>
              <table className="data-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>Qty</th>
                    <th>Dosage</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptionItems.map((item) => (
                    <tr key={item.prescription_item_id}>
                      <td style={{ fontWeight: 600 }}>{item.medicineName}</td>
                      <td>{item.quantity}</td>
                      <td>{item.dosage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>Close Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
