import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import MajorExplorer from './MajorExplorer'
import UniversityExplorer from './UniversityExplorer'
import { 
  GraduationCap, 
  School, 
  SearchCheck, 
  Sparkles, 
  ShieldAlert, 
  Lightbulb, 
  ArrowRight,
  TrendingUp,
  Brain
} from 'lucide-react'

const FactCheckHub = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentTab = searchParams.get('tab') || 'majors'

  const handleTabChange = (tabName) => {
    setSearchParams({ tab: tabName })
  }

  return (
    <div className="min-h-full">
      {/* Dynamic Tab Content */}
      {currentTab === 'universities' ? (
        <UniversityExplorer />
      ) : (
        <MajorExplorer />
      )}
    </div>
  )
}

export default FactCheckHub
