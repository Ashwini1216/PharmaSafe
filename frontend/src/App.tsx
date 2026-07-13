import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Medicines from './components/Medicines';
import Suppliers from './components/Suppliers';
import Customers from './components/Customers';
import Doctors from './components/Doctors';
import Batches from './components/Batches';
import Prescriptions from './components/Prescriptions';
import PurchaseOrders from './components/PurchaseOrders';
import Sales from './components/Sales';
import POSCheckout from './components/POSCheckout';
import './App.css';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onViewChange={setCurrentView} />;
      case 'pos':
        return <POSCheckout />;
      case 'medicines':
        return <Medicines />;
      case 'batches':
        return <Batches />;
      case 'suppliers':
        return <Suppliers />;
      case 'customers':
        return <Customers />;
      case 'doctors':
        return <Doctors />;
      case 'prescriptions':
        return <Prescriptions />;
      case 'purchase-orders':
        return <PurchaseOrders />;
      case 'sales':
        return <Sales />;
      default:
        return <Dashboard onViewChange={setCurrentView} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeView={currentView} onViewChange={setCurrentView} />
      <main className="main-content">
        {renderView()}
      </main>
    </div>
  );
}
