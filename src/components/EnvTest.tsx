
import React from 'react';

export const EnvTest = () => {
  const url = process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.REACT_APP_SUPABASE_ANON_KEY;
  
  return (
    <div style={{padding: '20px', backgroundColor: '#f0f0f0', margin: '20px'}}>
      <h3>Environment Variables Test</h3>
      <p><strong>URL:</strong> {url || 'NOT LOADED'}</p>
      <p><strong>Key:</strong> {key ? `${key.substring(0,20)}...` : 'NOT LOADED'}</p>
      <p><strong>Status:</strong> {url && key ? '✅ Both loaded' : '❌ Missing variables'}</p>
    </div>
  );
};
