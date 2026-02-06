// Minimal test page - no dependencies
export default function WebsiteQuotesTest() {
  console.log('[WebsiteQuotesTest] RENDERING!');

  return (
    <div style={{
      padding: '40px',
      backgroundColor: '#1a1a2e',
      minHeight: '100vh',
      color: 'white'
    }}>
      <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>
        Website Quotes Test Page
      </h1>
      <p style={{ fontSize: '18px', color: '#10B981' }}>
        If you can see this, the route is working!
      </p>
      <p style={{ marginTop: '20px', color: '#94a3b8' }}>
        Timestamp: {new Date().toISOString()}
      </p>
    </div>
  );
}
