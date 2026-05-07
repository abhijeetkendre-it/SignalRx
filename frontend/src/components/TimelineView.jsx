import { useState, useEffect } from 'react';
import { getTimeline } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function TimelineView({ project }) {
  const [data, setData] = useState([]);
  useEffect(() => { getTimeline(project?.id).then(setData); }, [project]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>📅 Timeline</h2>
        <p>Temporal evolution of detected signals and mentions</p>
      </div>
      <div className="chart-card">
        <h4>Signal Timeline — Mentions, Signals & Adverse Events</h4>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06d6d6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06d6d6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fill: '#5a6580', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#5a6580', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#131a2e', border: '1px solid #1e2a45', borderRadius: 8, color: '#e8ecf4' }} />
            <Legend wrapperStyle={{ color: '#8892a8', fontSize: 12 }} />
            <Area type="monotone" dataKey="mentions" stroke="#3b82f6" fill="url(#gm)" strokeWidth={2} name="Mentions" />
            <Area type="monotone" dataKey="signals" stroke="#06d6d6" fill="url(#gs)" strokeWidth={2} name="Signals" />
            <Area type="monotone" dataKey="adverse" stroke="#ef4444" fill="url(#ga)" strokeWidth={2} name="Adverse" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
