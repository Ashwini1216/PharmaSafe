import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ShoppingCart, Search, Plus, Minus, Trash2, CheckCircle2 } from 'lucide-react';

interface Customer {
  customer_id: number;
  customer_name: string;
  phone: string;
}

interface Medicine {
  medicine_id: number;
  name: string;
  category: string;
}

interface Batch {
  batch_id: number;
  medicine_id: number;
  batch_number: string;
  quantity: number;
  selling_price: number;
  expiry_date: string;
}

interface CartItem {
  batch_id: number;
  medicine_id: number;
  medicine_name: string;
  batch_number: string;
  quantity: number;
  price: number;
  max_quantity: number;
}

export default function POSCheckout() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkoutStatus, setCheckoutStatus] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [customersData, medicinesData, batchesData] = await Promise.all([
          api.get<Customer[]>('/customers'),
          api.get<Medicine[]>('/medicines'),
          api.get<Batch[]>('/batches')
        ]);
        
        setCustomers(customersData);
        if (customersData.length > 0) {
          setSelectedCustomerId(customersData[0].customer_id);
        }
        setMedicines(medicinesData);
        
        // Filter out expired batches and batches with 0 quantity
        const today = new Date();
        const activeBatches = batchesData.filter(b => b.quantity > 0 && new Date(b.expiry_date) > today);
        setBatches(activeBatches);
      } catch (err) {
        console.error('Error loading POS data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const addToCart = (batch: Batch) => {
    const med = medicines.find(m => m.medicine_id === batch.medicine_id);
    const medName = med ? med.name : 'Unknown Medicine';

    const existingIndex = cart.findIndex(item => item.batch_id === batch.batch_id);

    if (existingIndex > -1) {
      const updatedCart = [...cart];
      if (updatedCart[existingIndex].quantity < batch.quantity) {
        updatedCart[existingIndex].quantity += 1;
        setCart(updatedCart);
      } else {
        alert(`Cannot add more. Only ${batch.quantity} items available in this batch.`);
      }
    } else {
      setCart([
        ...cart,
        {
          batch_id: batch.batch_id,
          medicine_id: batch.medicine_id,
          medicine_name: medName,
          batch_number: batch.batch_number,
          quantity: 1,
          price: Number(batch.selling_price),
          max_quantity: batch.quantity
        }
      ]);
    }
  };

  const updateQuantity = (batchId: number, change: number) => {
    const updatedCart = cart.map(item => {
      if (item.batch_id === batchId) {
        const newQty = item.quantity + change;
        if (newQty > 0 && newQty <= item.max_quantity) {
          return { ...item, quantity: newQty };
        }
      }
      return item;
    });
    setCart(updatedCart);
  };

  const removeFromCart = (batchId: number) => {
    setCart(cart.filter(item => item.batch_id !== batchId));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const cartTax = cartSubtotal * 0.05; // 5% flat GST/Tax
  const cartTotal = cartSubtotal + cartTax;

  const handleCheckout = async () => {
    if (!selectedCustomerId) {
      alert('Please select a customer.');
      return;
    }
    if (cart.length === 0) {
      alert('Your checkout cart is empty.');
      return;
    }

    try {
      setLoading(true);
      // Create Sale Record
      const saleResponse = await api.post<{ message: string; sale_id: number }>('/sales', {
        customer_id: Number(selectedCustomerId),
        prescription_id: null,
        sale_date: new Date().toISOString().slice(0, 19), // YYYY-MM-DDTHH:MM:SS
        total_amount: Number(cartTotal.toFixed(2))
      });

      const saleId = saleResponse.sale_id;

      // Add Sale Items
      for (const item of cart) {
        await api.post('/sale-items', {
          sale_id: saleId,
          medicine_id: item.medicine_id,
          batch_id: item.batch_id,
          quantity: item.quantity,
          price: item.price,
          subtotal: Number((item.quantity * item.price).toFixed(2))
        });
      }

      setCheckoutStatus({
        success: true,
        message: `Sale #${saleId} completed successfully! Reciept generated.`
      });
      setCart([]);
      
      // Reload batches to reflect updated stock levels
      const updatedBatches = await api.get<Batch[]>('/batches');
      const today = new Date();
      setBatches(updatedBatches.filter(b => b.quantity > 0 && new Date(b.expiry_date) > today));
    } catch (err: any) {
      console.error('Checkout error:', err);
      alert(err.message || 'Checkout failed. Please check stock levels.');
    } finally {
      setLoading(false);
    }
  };

  // Filter batches based on medicine name search
  const filteredBatches = batches.filter(batch => {
    const med = medicines.find(m => m.medicine_id === batch.medicine_id);
    const searchString = `${med ? med.name : ''} ${batch.batch_number}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  if (loading && customers.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', fontSize: '1.2rem', fontWeight: 'bold' }}>
        Loading POS Interface...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      <div className="header-bar">
        <div className="header-title">
          <h2>POS Billing Terminal</h2>
          <p>Create new walk-in and customer invoices instantly.</p>
        </div>
      </div>

      {checkoutStatus && (
        <div 
          style={{ 
            backgroundColor: 'var(--success-light)', 
            border: '1px solid var(--success)', 
            color: 'var(--success-hover)',
            borderRadius: 'var(--radius-md)', 
            padding: '1rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            fontWeight: 500
          }}
        >
          <CheckCircle2 style={{ width: '1.5rem', height: '1.5rem' }} />
          <span>{checkoutStatus.message}</span>
          <button 
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', fontWeight: 'bold', cursor: 'pointer' }}
            onClick={() => setCheckoutStatus(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="pos-layout">
        {/* Medicine Picker Section */}
        <div className="pos-products">
          <div className="pos-header">
            <div className="search-bar" style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
              <div style={{ position: 'relative', flexGrow: 1 }}>
                <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1.1rem', height: '1.1rem', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search medicine name or batch number..."
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="pos-grid">
            {filteredBatches.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No active medicine batches in stock matching search term.
              </div>
            ) : (
              filteredBatches.map((batch) => {
                const med = medicines.find(m => m.medicine_id === batch.medicine_id);
                const isInCart = cart.some(item => item.batch_id === batch.batch_id);
                return (
                  <div 
                    key={batch.batch_id} 
                    className={`pos-item-card ${batch.quantity === 0 ? 'disabled' : ''}`}
                    onClick={() => batch.quantity > 0 && addToCart(batch)}
                    style={{ border: isInCart ? '2px solid var(--primary)' : '1px solid var(--border)' }}
                  >
                    <p className="pos-item-title">{med ? med.name : 'Unknown'}</p>
                    <p className="pos-item-meta">Batch: {batch.batch_number} • Exp: {batch.expiry_date}</p>
                    <div className="pos-item-price-row">
                      <span className="pos-item-price">${Number(batch.selling_price).toFixed(2)}</span>
                      <span className="pos-item-stock" style={{ color: batch.quantity < 15 ? 'var(--danger)' : 'var(--success)' }}>
                        Qty: {batch.quantity}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Checkout Cart Section */}
        <div className="pos-cart">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingCart style={{ width: '1.25rem', height: '1.25rem' }} /> Active Cart
          </h3>

          <div className="form-group">
            <label className="form-label">Billing Customer</label>
            <select 
              className="form-select"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
            >
              <option value="">-- Choose Customer --</option>
              {customers.map(c => (
                <option key={c.customer_id} value={c.customer_id}>
                  {c.customer_name} {c.phone ? `(${c.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="cart-items">
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Cart is empty. Add products from the left panel.
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.batch_id} className="cart-item">
                  <div className="cart-item-info">
                    <p className="cart-item-title">{item.medicine_name}</p>
                    <p className="cart-item-subtitle">Batch: {item.batch_number} • Price: ${item.price.toFixed(2)}</p>
                  </div>
                  <div className="cart-item-qty">
                    <button className="qty-btn" onClick={() => updateQuantity(item.batch_id, -1)}>
                      <Minus style={{ width: '0.75rem', height: '0.75rem' }} />
                    </button>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', width: '20px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button className="qty-btn" onClick={() => updateQuantity(item.batch_id, 1)}>
                      <Plus style={{ width: '0.75rem', height: '0.75rem' }} />
                    </button>
                  </div>
                  <div className="cart-item-subtotal">
                    ${(item.quantity * item.price).toFixed(2)}
                  </div>
                  <button 
                    className="action-btn delete" 
                    style={{ marginLeft: '0.5rem' }}
                    onClick={() => removeFromCart(item.batch_id)}
                  >
                    <Trash2 style={{ width: '1rem', height: '1rem' }} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="pos-summary">
            <div className="summary-row">
              <span style={{ color: 'var(--text-muted)' }}>Items Subtotal</span>
              <span style={{ marginLeft: 'auto', fontWeight: 600 }}>${cartSubtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span style={{ color: 'var(--text-muted)' }}>GST/Sales Tax (5%)</span>
              <span style={{ marginLeft: 'auto', fontWeight: 600 }}>${cartTax.toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>Total Bill</span>
              <span style={{ marginLeft: 'auto' }}>${cartTotal.toFixed(2)}</span>
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
            disabled={cart.length === 0 || loading}
            onClick={handleCheckout}
          >
            {loading ? 'Processing Billing...' : `Proceed Checkout ($${cartTotal.toFixed(2)})`}
          </button>
        </div>
      </div>
    </div>
  );
}
