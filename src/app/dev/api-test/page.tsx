'use client';
/* eslint-disable no-restricted-globals, no-restricted-syntax */

import { useState, useEffect } from 'react';
import { Play, Copy, Download } from 'lucide-react';
import { getCurrentUTCDate, toISOString } from '@/lib/utils/date-utils';

// Available API endpoints for testing
const API_ENDPOINTS = [
  {
    name: 'Current User Info',
    value: '/api/auth/me',
    method: 'GET',
    description: 'Get current authenticated user information'
  },
  {
    name: 'Accounts',
    value: '/api/accounts',
    method: 'GET',
    description: 'Get all accounts with balance anchors'
  },
  {
    name: 'Account by ID',
    value: '/api/accounts/{id}',
    method: 'GET',
    description: 'Get specific account by ID'
  },
  {
    name: 'Account Balance History',
    value: '/api/accounts/{id}/balance-history',
    method: 'GET',
    description: 'Get balance history for account'
  },
  {
    name: 'Account Transactions with Balances',
    value: '/api/accounts/{id}/transactions-with-balances',
    method: 'GET',
    description: 'Get transactions with running balances'
  },
  {
    name: 'Account Sync Balance',
    value: '/api/accounts/{id}/sync-balance',
    method: 'GET',
    description: 'Sync account balance with latest transactions'
  },
  {
    name: 'Transactions',
    value: '/api/transactions',
    method: 'GET',
    description: 'Get all transactions'
  },
  {
    name: 'Health Check',
    value: '/api/health',
    method: 'GET',
    description: 'System health check'
  },
  {
    name: 'Cube Status',
    value: '/api/cube/status',
    method: 'GET',
    description: 'Get financial cube statistics and status'
  },
  {
    name: 'Cube Populate',
    value: '/api/cube/populate',
    method: 'POST',
    description: 'Populate cube data for date range'
  },
  {
    name: 'Cube Rebuild',
    value: '/api/cube/rebuild',
    method: 'POST',
    description: 'Rebuild cube data for date range'
  },
  {
    name: 'Trends - Categories',
    value: '/api/trends/categories',
    method: 'GET',
    description: 'Get category trends from cube'
  },
  {
    name: 'Trends - Accounts',
    value: '/api/trends/accounts',
    method: 'GET',
    description: 'Get account trends from cube'
  },
  {
    name: 'Trends - Income/Expense',
    value: '/api/trends/income-expense',
    method: 'GET',
    description: 'Get income vs expense trends from cube'
  }
];

interface ApiResponse {
  status: number;
  statusText: string;
  data: unknown;
  headers: Record<string, string>;
  timestamp: string;
}

export default function ApiTestPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(API_ENDPOINTS[0].value);
  const [queryString, setQueryString] = useState('');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [authToken, setAuthToken] = useState('');

  // Get auth token from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        setAuthToken(token);
      }
    }
  }, []);

  const buildUrl = () => {
    let url = selectedEndpoint;

    // Replace {id} placeholder with actual ID if provided in query string
    if (url.includes('{id}') && queryString) {
      const params = new URLSearchParams(queryString);
      const id = params.get('id');
      if (id) {
        url = url.replace('{id}', id);
        params.delete('id');
        const remainingParams = params.toString();
        return remainingParams ? `${url}?${remainingParams}` : url;
      }
    }

    return queryString ? `${url}?${queryString}` : url;
  };

  const executeRequest = async () => {
    setLoading(true);
    setResponse(null);

    try {
      const url = buildUrl();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add auth token if available
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const startTime = Date.now();
      const res = await fetch(url, {
        method: 'GET',
        headers,
      });

      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      const endTime = Date.now();

      setResponse({
        status: res.status,
        statusText: res.statusText,
        data,
        headers: responseHeaders,
        timestamp: toISOString(getCurrentUTCDate()),
      });

      console.log(`API Request completed in ${endTime - startTime}ms:`, {
        url,
        status: res.status,
        data
      });

    } catch (error) {
      console.error('API Request failed:', error);
      setResponse({
        status: 0,
        statusText: 'Network Error',
        data: { error: error instanceof Error ? error.message : 'Unknown error' },
        headers: {},
        timestamp: toISOString(getCurrentUTCDate()),
      });
    } finally {
      setLoading(false);
    }
  };

  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response, null, 2));
    }
  };

  const downloadResponse = () => {
    if (response) {
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `api-response-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const selectedEndpointInfo = API_ENDPOINTS.find(ep => ep.value === selectedEndpoint);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">API Test Tool</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Request Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Request Configuration</h2>

              {/* Auth Token */}
              <div className="mb-4">
                <label htmlFor="authToken" className="block text-sm font-medium text-gray-700 mb-2">
                  Auth Token (Optional)
                </label>
                <input
                  type="password"
                  id="authToken"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="JWT access token (auto-filled from localStorage.accessToken)"
                />
              </div>

              {/* Endpoint Selection */}
              <div className="mb-4">
                <label htmlFor="endpoint" className="block text-sm font-medium text-gray-700 mb-2">
                  API Endpoint
                </label>
                <select
                  id="endpoint"
                  value={selectedEndpoint}
                  onChange={(e) => setSelectedEndpoint(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {API_ENDPOINTS.map((endpoint) => (
                    <option key={endpoint.value} value={endpoint.value}>
                      {endpoint.name} - {endpoint.method}
                    </option>
                  ))}
                </select>
                {selectedEndpointInfo && (
                  <p className="text-sm text-gray-600 mt-1">{selectedEndpointInfo.description}</p>
                )}
              </div>

              {/* Query String */}
              <div className="mb-4">
                <label htmlFor="queryString" className="block text-sm font-medium text-gray-700 mb-2">
                  Query Parameters
                </label>
                <input
                  type="text"
                  id="queryString"
                  value={queryString}
                  onChange={(e) => setQueryString(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., id=1&date_from=2024-01-01&date_to=2024-12-31"
                />
                <p className="text-sm text-gray-600 mt-1">
                  For endpoints with {'{id}'}, use &quot;id=123&quot; parameter
                </p>
              </div>

              {/* Final URL Preview */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Final URL
                </label>
                <div className="bg-gray-100 p-3 rounded-md font-mono text-sm">
                  {buildUrl()}
                </div>
              </div>

              {/* Execute Button */}
              <button
                onClick={executeRequest}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                {loading ? 'Executing...' : 'Execute Request'}
              </button>
            </div>
          </div>

          {/* Response Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Response</h2>
                {response && (
                  <div className="flex gap-2">
                    <button
                      onClick={copyResponse}
                      className="bg-gray-600 text-white py-1 px-3 rounded-md hover:bg-gray-700 flex items-center gap-1 text-sm"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                    <button
                      onClick={downloadResponse}
                      className="bg-green-600 text-white py-1 px-3 rounded-md hover:bg-green-700 flex items-center gap-1 text-sm"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </button>
                  </div>
                )}
              </div>

              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading...</span>
                </div>
              )}

              {response && (
                <div className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      response.status >= 200 && response.status < 300
                        ? 'bg-green-100 text-green-800'
                        : response.status >= 400
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {response.status} {response.statusText}
                    </span>
                  </div>

                  {/* Timestamp */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Timestamp:</span>
                    <span className="text-sm text-gray-600">{response.timestamp}</span>
                  </div>

                  {/* Response Data */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Response Data:</h3>
                    <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96 text-xs">
                      {JSON.stringify(response.data, null, 2)}
                    </pre>
                  </div>

                  {/* Headers */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Response Headers:</h3>
                    <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-32 text-xs">
                      {JSON.stringify(response.headers, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {!response && !loading && (
                <div className="text-center py-8 text-gray-500">
                  Execute a request to see the response here
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
