import { useState, useEffect } from 'react';
import { getSignals } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#06d6d6'];

export default function Analytics({ project }) {
  const [signals, setSignals] = useState([]);
  useEffect(() => { getSignals(project?.id).then(setSignals); }, [project]);

  const riskDist = [
    { name: 'HIGH', value: signals.filter(s => s.risk_level === 'HIGH').length, color: '#ef4444' },
    { name: 'MEDIUM', value: signals.filter(s => s.risk_level === 'MEDIUM').length, color: '#f59e0b' },
    { name: 'LOW', value: signals.filter(s => s.risk_level === 'LOW').length, color: '#10b981' },
  ].filter(d => d.value > 0);

  const topSignals = signals.slice(0, 5).map(s => ({
    name: `${s.drug}-${s.symptom}`.substring(0, 20),
    confidence: Math.round(s.confidence_score * 100),
    mentions: s.mention_count,
    prr: s.prr_score,
  }));

  const timeData = signals[0]?.timeline || [];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>📊 Analytics</h2>
        <p>Signal analysis and trend visualization</p>
      </div>
      <div className="charts-grid">
        <div className="chart-card">
          <h4>Signal Trend (14 days)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={timeData}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06d6d6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06d6d6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#5a6580', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5a6580', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#131a2e', border: '1px solid #1e2a45', borderRadius: 8, color: '#e8ecf4' }} />
              <Area type="monotone" dataKey="count" stroke="#06d6d6" fill="url(#g1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h4>Risk Distribution</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={riskDist} cx="50%" cy="50%" outerRadius={80} innerRadius={50} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {riskDist.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#131a2e', border: '1px solid #1e2a45', borderRadius: 8, color: '#e8ecf4' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h4>Top Signals by Mentions</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topSignals}>
              <XAxis dataKey="name" tick={{ fill: '#5a6580', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5a6580', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#131a2e', border: '1px solid #1e2a45', borderRadius: 8, color: '#e8ecf4' }} />
              <Bar dataKey="mentions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h4>Confidence Scores</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topSignals} layout="vertical">
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#5a6580', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#5a6580', fontSize: 9 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip contentStyle={{ background: '#131a2e', border: '1px solid #1e2a45', borderRadius: 8, color: '#e8ecf4' }} />
              <Bar dataKey="confidence" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
