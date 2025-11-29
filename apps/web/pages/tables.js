import { useState, useEffect } from 'react';

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    capacity: 4,
    outletId: '',
  });

  const apiBase = process.env.NEXT_PUBLIC_API_BASE || '/api';

  useEffect(() => {
    fetchTables();
    fetchOutlets();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await fetch(`${apiBase}/pos/tables`);
      if (!response.ok) throw new Error('Failed to fetch tables');
      const data = await response.json();
      setTables(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchOutlets = async () => {
    try {
      const response = await fetch(`${apiBase}/pos/outlets`);
      if (response.ok) {
        const data = await response.json();
        setOutlets(data);
        if (data.length > 0 && !formData.outletId) {
          setFormData(prev => ({ ...prev, outletId: data[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch outlets:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${apiBase}/pos/tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create table');

      // Reset form and refresh list
      setFormData({ name: '', capacity: 4, outletId: formData.outletId });
      fetchTables();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this table?')) return;

    try {
      const response = await fetch(`${apiBase}/pos/tables/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete table');

      fetchTables();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? (parseInt(value, 10) || prev.capacity) : value,
    }));
  };

  if (loading) return <div style={styles.container}>Loading...</div>;

  return (
    <div style={styles.container}>
      <h1>Table Management</h1>

      {error && (
        <div style={styles.error}>
          Error: {error}
          <button onClick={() => setError(null)} style={styles.closeButton}>×</button>
        </div>
      )}

      <div style={styles.formSection}>
        <h2>Create New Table</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label htmlFor="name">Table Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="e.g., Table 1, VIP-A"
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="capacity">Capacity:</label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              min="1"
              required
              style={styles.input}
            />
          </div>

          {outlets.length > 0 && (
            <div style={styles.formGroup}>
              <label htmlFor="outletId">Outlet:</label>
              <select
                id="outletId"
                name="outletId"
                value={formData.outletId}
                onChange={handleChange}
                required
                style={styles.input}
              >
                {outlets.map(outlet => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button type="submit" style={styles.button}>Create Table</button>
        </form>
      </div>

      <div style={styles.tableSection}>
        <h2>Tables ({tables.length})</h2>
        {tables.length === 0 ? (
          <p style={styles.emptyMessage}>No tables found. Create your first table above.</p>
        ) : (
          <div style={styles.tableGrid}>
            {tables.map(table => (
              <div key={table.id} style={styles.tableCard}>
                <div style={styles.tableHeader}>
                  <h3>{table.name}</h3>
                  <button
                    onClick={() => handleDelete(table.id)}
                    style={styles.deleteButton}
                    title="Delete table"
                  >
                    🗑️
                  </button>
                </div>
                <div style={styles.tableDetails}>
                  <p><strong>Capacity:</strong> {table.capacity} seats</p>
                  {table.outlet && (
                    <p><strong>Outlet:</strong> {table.outlet.name}</p>
                  )}
                  <p style={styles.tableId}>ID: {table.id.substring(0, 8)}...</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.footer}>
        <a href="/" style={styles.link}>← Back to Home</a>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    fontFamily: 'system-ui, sans-serif',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c00',
    padding: '1rem',
    borderRadius: '4px',
    marginBottom: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#c00',
  },
  formSection: {
    backgroundColor: '#f9f9f9',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '2rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  input: {
    padding: '0.5rem',
    fontSize: '1rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  button: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    backgroundColor: '#0070f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  tableSection: {
    marginTop: '2rem',
  },
  emptyMessage: {
    color: '#666',
    fontStyle: 'italic',
  },
  tableGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1rem',
  },
  tableCard: {
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '1rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  tableDetails: {
    fontSize: '0.9rem',
    color: '#666',
  },
  tableId: {
    fontSize: '0.75rem',
    color: '#999',
    marginTop: '0.5rem',
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0.25rem',
  },
  footer: {
    marginTop: '2rem',
    paddingTop: '1rem',
    borderTop: '1px solid #ddd',
  },
  link: {
    color: '#0070f3',
    textDecoration: 'none',
  },
};
