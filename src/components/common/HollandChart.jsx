import React from 'react'
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts'

const HollandChart = ({ scores = {}, type = 'radar' }) => {
  const mapping = {
    R: 'Kỹ thuật (R)',
    I: 'Nghiên cứu (I)',
    A: 'Nghệ thuật (A)',
    S: 'Xã hội (S)',
    E: 'Quản lý (E)',
    C: 'Nghiệp vụ (C)'
  }

  const chartData = Object.keys(mapping).map(key => ({
    subject: mapping[key],
    score: scores[key] || 0,
  }))

  if (type === 'bar') {
    return (
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            layout="vertical"
          >
            <XAxis type="number" />
            <YAxis dataKey="subject" type="category" width={110} tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ background: '#1e293b', border: 'none', color: '#fff', fontSize: '12px', borderRadius: '2px' }}
              labelStyle={{ color: '#fbbf24', fontWeight: 'bold' }}
            />
            <Bar dataKey="score" fill="#059669" name="Điểm số" radius={[0, 2, 2, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="w-full h-[340px] flex justify-center items-center py-2 px-1">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart 
          cx="50%" 
          cy="50%" 
          outerRadius="60%" 
          margin={{ top: 20, right: 40, bottom: 20, left: 40 }} 
          data={chartData}
        >
          <PolarGrid stroke="#cbd5e1" strokeDasharray="3 3" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#1e293b', fontSize: 11, fontWeight: 600 }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fontSize: 9, fill: '#64748b' }} />
          <Radar
            name="Điểm Holland"
            dataKey="score"
            stroke="#059669"
            fill="#34d399"
            fillOpacity={0.45}
            dot={{ r: 3, fill: '#059669' }}
          />
          <Tooltip 
            contentStyle={{ background: '#0f172a', border: 'none', color: '#fff', fontSize: '12px', borderRadius: '6px' }}
            formatter={(value) => [`${value} điểm`, 'Điểm Holland']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default HollandChart
