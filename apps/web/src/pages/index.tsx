import { useState, useEffect } from 'react'
import Head from 'next/head'

export default function Home() {
  const [apiHealth, setApiHealth] = useState<string>('checking...')

  useEffect(() => {
    // Check API health
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setApiHealth(data.status === 'ok' ? '✅ Connected' : '❌ Error'))
      .catch(() => setApiHealth('❌ Not reachable'))
  }, [])

  return (
    <>
      <Head>
        <title>Bruno&apos;s IMS - M0</title>
        <meta name="description" content="Bruno's Inventory Management System" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#333' }}>
          Bruno&apos;s IMS
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#666', marginBottom: '2rem' }}>
          M0 - Minimum Viable Build
        </p>
        
        <div style={{ 
          padding: '2rem', 
          border: '1px solid #ddd', 
          borderRadius: '8px',
          backgroundColor: '#f9f9f9',
          marginBottom: '2rem',
          minWidth: '300px'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>System Status</h2>
          <p><strong>Web App:</strong> ✅ Running</p>
          <p><strong>API:</strong> {apiHealth}</p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          width: '100%',
          maxWidth: '800px'
        }}>
          <div style={{ 
            padding: '1.5rem', 
            border: '1px solid #ddd', 
            borderRadius: '8px',
            backgroundColor: 'white',
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: '0.5rem' }}>POS</h3>
            <p style={{ fontSize: '0.875rem', color: '#666' }}>Point of Sale</p>
          </div>
          
          <div style={{ 
            padding: '1.5rem', 
            border: '1px solid #ddd', 
            borderRadius: '8px',
            backgroundColor: 'white',
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: '0.5rem' }}>KDS</h3>
            <p style={{ fontSize: '0.875rem', color: '#666' }}>Kitchen Display</p>
          </div>
          
          <div style={{ 
            padding: '1.5rem', 
            border: '1px solid #ddd', 
            borderRadius: '8px',
            backgroundColor: 'white',
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Recipes</h3>
            <p style={{ fontSize: '0.875rem', color: '#666' }}>Menu Management</p>
          </div>
          
          <div style={{ 
            padding: '1.5rem', 
            border: '1px solid #ddd', 
            borderRadius: '8px',
            backgroundColor: 'white',
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Inventory</h3>
            <p style={{ fontSize: '0.875rem', color: '#666' }}>Stock Management</p>
          </div>
          
          <div style={{ 
            padding: '1.5rem', 
            border: '1px solid #ddd', 
            borderRadius: '8px',
            backgroundColor: 'white',
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Procurement</h3>
            <p style={{ fontSize: '0.875rem', color: '#666' }}>Purchasing</p>
          </div>
        </div>

        <p style={{ 
          marginTop: '2rem', 
          fontSize: '0.875rem', 
          color: '#999',
          textAlign: 'center'
        }}>
          All API endpoints from OPENAPI.yaml are implemented and ready for integration.
        </p>
      </main>
    </>
  )
}
