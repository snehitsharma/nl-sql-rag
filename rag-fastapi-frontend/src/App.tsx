import { useState, useRef, useEffect } from 'react'

interface QueryResult {
  question: string
  sql: string
  result: {
    columns: string[]
    rows: (string | number)[][]
  }
}

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function App() {
  const [question, setQuestion] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [data, setData] = useState<QueryResult | null>(null)
  const [error, setError] = useState('')
  const [showSQL, setShowSQL] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const ask = async () => {
    if (!question.trim()) return
    setStatus('loading')
    setData(null)
    setError('')
    setShowSQL(false)
    try {
      const res = await fetch('http://localhost:8000/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Something went wrong')
      }
      const json: QueryResult = await res.json()
      setData(json)
      setStatus('success')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      setStatus('error')
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') ask()
  }

  const suggestions = [
    'Which customer placed the most orders?',
    'Show total revenue by month',
    'Top 5 products by quantity sold',
    'List all pending payments',
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0e0e10', color: '#e8e6e0', fontFamily: "'IBM Plex Mono', monospace", padding: '0' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #0e0e10; }

        .input-wrap {
          display: flex;
          align-items: center;
          background: #1a1a1e;
          border: 1px solid #2e2e35;
          border-radius: 4px;
          padding: 0 16px;
          gap: 12px;
          transition: border-color 0.2s;
        }
        .input-wrap:focus-within { border-color: #c8f060; }

        .input-wrap input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #e8e6e0;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 15px;
          padding: 16px 0;
          caret-color: #c8f060;
        }
        .input-wrap input::placeholder { color: #4a4a55; }

        .ask-btn {
          background: #c8f060;
          color: #0e0e10;
          border: none;
          border-radius: 3px;
          padding: 8px 20px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          letter-spacing: 0.04em;
          transition: background 0.15s, transform 0.1s;
          white-space: nowrap;
        }
        .ask-btn:hover { background: #d4f570; }
        .ask-btn:active { transform: scale(0.97); }
        .ask-btn:disabled { background: #2a2a30; color: #555; cursor: not-allowed; transform: none; }

        .chip {
          background: #1a1a1e;
          border: 1px solid #2a2a32;
          border-radius: 3px;
          padding: 7px 14px;
          font-size: 12px;
          color: #888;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
          white-space: nowrap;
          font-family: 'IBM Plex Mono', monospace;
        }
        .chip:hover { border-color: #c8f060; color: #c8f060; }

        .sql-toggle {
          background: none;
          border: 1px solid #2e2e35;
          border-radius: 3px;
          color: #888;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          padding: 5px 12px;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
          letter-spacing: 0.03em;
        }
        .sql-toggle:hover { border-color: #c8f060; color: #c8f060; }

        .sql-block {
          background: #141416;
          border: 1px solid #2a2a32;
          border-left: 3px solid #c8f060;
          border-radius: 4px;
          padding: 16px 20px;
          font-size: 13px;
          line-height: 1.7;
          color: #a0c060;
          overflow-x: auto;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .result-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .result-table th {
          text-align: left;
          padding: 10px 16px;
          color: #c8f060;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          font-size: 11px;
          border-bottom: 1px solid #2a2a32;
          background: #141416;
        }
        .result-table td {
          padding: 11px 16px;
          color: #ccc;
          border-bottom: 1px solid #1e1e24;
          font-variant-numeric: tabular-nums;
        }
        .result-table tr:last-child td { border-bottom: none; }
        .result-table tr:hover td { background: #1a1a1e; }

        .spinner {
          width: 18px; height: 18px;
          border: 2px solid #2a2a32;
          border-top-color: #c8f060;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .fade-in {
          animation: fadeUp 0.3s ease forwards;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .stat-row {
          display: flex;
          gap: 12px;
        }
        .stat {
          background: #141416;
          border: 1px solid #2a2a32;
          border-radius: 4px;
          padding: 10px 16px;
          font-size: 12px;
          color: #666;
          flex: 1;
        }
        .stat span {
          display: block;
          font-size: 20px;
          font-weight: 500;
          color: #c8f060;
          margin-bottom: 2px;
          font-family: 'Syne', sans-serif;
        }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: '1px solid #1e1e24', padding: '18px 48px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: 8, height: 8, background: '#c8f060', borderRadius: '50%' }} />
        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: '0.08em', color: '#e8e6e0' }}>QUERYBOT</span>
        <span style={{ color: '#333', fontSize: 13, marginLeft: 8 }}>natural language → SQL</span>
      </div>

      {/* Main */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '64px 24px 80px' }}>

        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 42, fontWeight: 800, lineHeight: 1.1, marginBottom: 8, color: '#e8e6e0', letterSpacing: '-0.02em' }}>
          Ask your<br />
          <span style={{ color: '#c8f060' }}>database</span> anything.
        </h1>
        <p style={{ color: '#555', fontSize: 14, marginBottom: 40, lineHeight: 1.6 }}>
          Type a question in plain English. SQL runs automatically.
        </p>

        {/* Input */}
        <div className="input-wrap">
          <span style={{ color: '#444', fontSize: 14 }}>›</span>
          <input
            ref={inputRef}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask something about your data..."
            disabled={status === 'loading'}
          />
          {status === 'loading'
            ? <div className="spinner" />
            : <button className="ask-btn" onClick={ask} disabled={!question.trim()}>Run</button>
          }
        </div>

        {/* Suggestions */}
        {status === 'idle' && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
            {suggestions.map(s => (
              <button key={s} className="chip" onClick={() => { setQuestion(s); inputRef.current?.focus() }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="fade-in" style={{ marginTop: 32, background: '#1a0f0f', border: '1px solid #3a1a1a', borderLeft: '3px solid #e24b4a', borderRadius: 4, padding: '14px 20px', color: '#e08080', fontSize: 13 }}>
            ⚠ {error}
          </div>
        )}

        {/* Result */}
        {status === 'success' && data && (
          <div className="fade-in" style={{ marginTop: 40 }}>

            {/* Stats row */}
            <div className="stat-row" style={{ marginBottom: 20 }}>
              <div className="stat">
                <span>{data.result.rows.length}</span>
                rows returned
              </div>
              <div className="stat">
                <span>{data.result.columns.length}</span>
                columns
              </div>
              <div className="stat" style={{ flex: 2 }}>
                <span style={{ fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", color: '#888', wordBreak: 'break-all' }}>"{data.question}"</span>
              </div>
            </div>

            {/* SQL toggle */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
              <button className="sql-toggle" onClick={() => setShowSQL(v => !v)}>
                {showSQL ? '▲ hide SQL' : '▼ view SQL'}
              </button>
            </div>

            {showSQL && (
              <div style={{ marginBottom: 16 }}>
                <div className="sql-block">{data.sql}</div>
              </div>
            )}

            {/* Table */}
            <div style={{ background: '#141416', border: '1px solid #2a2a32', borderRadius: 4, overflow: 'hidden' }}>
              {data.result.rows.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#444', fontSize: 13 }}>No rows returned</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="result-table">
                    <thead>
                      <tr>
                        {data.result.columns.map(col => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.result.rows.map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td key={j}>{cell === null ? <span style={{ color: '#444' }}>null</span> : String(cell)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  )
}