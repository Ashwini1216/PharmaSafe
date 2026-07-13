import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Pill, 
  AlertTriangle, 
  DollarSign, 
  Users, 
  ChevronRight,
  ShoppingCart
} from 'lucide-react';

interface DashboardProps {
  onViewChange: (view: string) => void;
}

interface Medicine {
  medicine_id: number;
  name: string;
}

interface Batch {
  batch_id: number;
  medicine_id: number;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  selling_price: number;
}

interface Sale {
  sale_id: number;
  customer_id: number;
  sale_date: string;
  total_amount: number;
}

interface Customer {
  customer_id: number;
  customer_name: string;
}

export default function Dashboard({ onViewChange }: DashboardProps) {
  const [stats, setStats] = useState({
    totalMedicines: 0,
    lowStockItems: 0,
    totalSales: 0,
    totalCustomers: 0
  });
  const [expiringBatches, setExpiringBatches] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [medicines, batches, sales, customers] = await Promise.all([
          api.get<Medicine[]>('/medicines'),
          api.get<Batch[]>('/batches'),
          api.get<Sale[]>('/sales'),
          api.get<Customer[]>('/customers')
        ]);

        // Calculate stats
        const medicineCount = medicines.length;
        const lowStock = batches.filter(b => b.quantity < 15).length;
        const salesSum = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);
        const customerCount = customers.length;

        setStats({
          totalMedicines: medicineCount,
          lowStockItems: lowStock,
          totalSales: salesSum,
          totalCustomers: customerCount
        });

        // Calculate expiring soon (next 120 days)
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + 120);

        const expiring = batches
          .filter(b => {
            const exp = new Date(b.expiry_date);
            return exp >= today && exp <= futureDate;
          })
          .map(b => {
            const med = medicines.find(m => m.medicine_id === b.medicine_id);
            const daysLeft = Math.ceil((new Date(b.expiry_date).getTime() - today.getTime()) / (1000 * 3600 * 24));
            return {
              ...b,
              medicineName: med ? med.name : 'Unknown Medicine',
              daysLeft
            };
          })
          .sort((a, b) => a.daysLeft - b.daysLeft)
          .slice(0, 5);

        setExpiringBatches(expiring);

        // Map recent sales with customer names
        const sortedSales = sales
          .sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime())
          .slice(0, 5)
          .map(s => {
            const cust = customers.find(c => c.customer_id === s.customer_id);
            return {
              ...s,
              customerName: cust ? cust.customer_name : 'Walk-in Customer'
            };
          });

        setRecentSales(sortedSales);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', fontSize: '1.2rem', fontWeight: 'bold' }}>
        Loading PharmaSafe Dashboard...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="header-bar">
        <div className="header-title">
          <h2>Dashboard Overview</h2>
          <p>Welcome back to PharmaSafe. Here is what is happening today.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => onViewChange('sales')}>
            Sales History
          </button>
          <button className="btn btn-primary" onClick={() => onViewChange('pos')}>
            <ShoppingCart style={{ width: '1.1rem', height: '1.1rem' }} />
            New POS Sale
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <h3>Total Medicines</h3>
            <p>{stats.totalMedicines}</p>
          </div>
          <div className="stat-icon-wrapper primary">
            <Pill className="stat-icon" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <h3>Low Stock Items</h3>
            <p style={{ color: stats.lowStockItems > 0 ? 'var(--danger)' : 'inherit' }}>
              {stats.lowStockItems}
            </p>
          </div>
          <div className="stat-icon-wrapper danger">
            <AlertTriangle className="stat-icon" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <h3>Total Sales</h3>
            <p>${stats.totalSales.toFixed(2)}</p>
          </div>
          <div className="stat-icon-wrapper success">
            <DollarSign className="stat-icon" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <h3>Registered Customers</h3>
            <p>{stats.totalCustomers}</p>
          </div>
          <div className="stat-icon-wrapper warning">
            <Users className="stat-icon" />
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Recent Sales Panel */}
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Recent Transactions</h3>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              onClick={() => onViewChange('sales')}
            >
              View All <ChevronRight style={{ width: '0.85rem', height: '0.85rem' }} />
            </button>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sale ID</th>
                  <th>Customer</th>
                  <th>Date & Time</th>
                  <th>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No sales transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentSales.map((sale) => (
                    <tr key={sale.sale_id}>
                      <td>#{sale.sale_id}</td>
                      <td>{sale.customerName}</td>
                      <td>{new Date(sale.sale_date).toLocaleString()}</td>
                      <td style={{ fontWeight: 700, color: 'var(--success)' }}>
                        ${Number(sale.total_amount).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expiring Soon Panel */}
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Expiring Soon</h3>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              onClick={() => onViewChange('batches')}
            >
              View All
            </button>
          </div>
          <div className="expiring-list">
            {expiringBatches.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No medicine batches expiring in the next 120 days.
              </div>
            ) : (
              expiringBatches.map((batch) => {
                const isCritical = batch.daysLeft < 30;
                return (
                  <div key={batch.batch_id} className="expiring-item">
                    <div className="expiring-meta">
                      <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{batch.medicineName}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Batch: {batch.batch_number} • Qty: {batch.quantity}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${isCritical ? 'badge-danger' : 'badge-warning'}`}>
                        {batch.daysLeft <= 0 ? 'Expired' : `${batch.daysLeft} days left`}
                      </span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {batch.expiry_date}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
