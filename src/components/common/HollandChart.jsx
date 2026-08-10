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
    <div className="w-full h-80 flex justify-center items-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }} />
          <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fontSize: 10 }} />
          <Radar
            name="ĐiểmHolland"
            dataKey="score"
            stroke="#059669"
            fill="#34d399"
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default HollandChart
