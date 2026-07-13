import { 
  LayoutDashboard, 
  ShoppingCart, 
  Pill, 
  Layers, 
  Truck, 
  Users, 
  Activity, 
  FileText, 
  FileSpreadsheet, 
  Receipt,
  ShieldCheck 
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'POS Checkout', icon: ShoppingCart },
    { id: 'medicines', label: 'Medicines', icon: Pill },
    { id: 'batches', label: 'Medicine Batches', icon: Layers },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'doctors', label: 'Doctors', icon: Activity },
    { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: FileSpreadsheet },
    { id: 'sales', label: 'Sales History', icon: Receipt },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <ShieldCheck className="sidebar-logo" />
        <span className="sidebar-title">PharmaSafe ERP</span>
      </div>
      <ul className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <button
                className={`menu-item ${activeView === item.id ? 'active' : ''}`}
                style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
                onClick={() => onViewChange(item.id)}
              >
                <Icon className="menu-icon" />
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
