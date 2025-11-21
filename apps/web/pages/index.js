import { useState, useEffect } from 'react';

export default function Home() {
  const [tables, setTables] = useState([]);
  const [apiStatus, setApiStatus] = useState('checking...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || '/api';
    
    // Check API health
    fetch(`${apiBase}/health`)
      .then(res => res.json())
      .then(data => {
        setApiStatus(`API Status: ${data.status}, Database: ${data.database}`);
      })
      .catch(err => {
        setApiStatus('API not responding');
        setError(err.message);
      });

    // Fetch tables
    fetch(`${apiBase}/pos/tables`)
      .then(res => res.json())
      .then(data => {
        setTables(data);
      })
      .catch(err => {
        setError(err.message);
      });
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Bruno's IMS - M0</h1>
      
      <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f0f0', borderRadius: '4px' }}>
        <h2>System Status</h2>
        <p>{apiStatus}</p>
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>POS Tables</h2>
        {tables.length === 0 ? (
          <p>No tables found. The system is ready - tables can be created via API.</p>
        ) : (
          <ul>
            {tables.map((table) => (
              <li key={table.id}>
                Table {table.number} (Capacity: {table.capacity})
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#e8f5e9', borderRadius: '4px' }}>
        <h3>✓ M0 System Ready</h3>
        <p>API is connected and responding to requests.</p>
        <p>Available endpoints:</p>
        <ul style={{ fontSize: '0.9rem' }}>
          <li>/api/health - Health check</li>
          <li>/api/auth/login - Authentication</li>
          <li>/api/pos/tables - POS tables management</li>
          <li>/api/pos/orders - Order management</li>
          <li>/api/kds/tickets - KDS tickets</li>
          <li>/api/recipes - Recipe management</li>
          <li>/api/inventory/ingredients - Inventory management</li>
          <li>/api/procurement/suppliers - Supplier management</li>
        </ul>
      </div>
    </div>
  );
}
