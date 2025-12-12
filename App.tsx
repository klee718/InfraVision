import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardMap } from './components/DashboardMap';
import { BudgetAnalysis } from './components/BudgetAnalysis';
import { SpatialAnalysis } from './components/SpatialAnalysis';
import { InfrastructureReport, Tab, SpatialAnalysisResult } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('map');
  const [reports, setReports] = useState<InfrastructureReport[]>([]);
  const [spatialResult, setSpatialResult] = useState<SpatialAnalysisResult | null>(null);

  const handleReportGenerated = (report: InfrastructureReport) => {
    setReports(prev => [...prev, report]);
  };

  const handleSpatialResult = (result: SpatialAnalysisResult) => {
    setSpatialResult(result);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      <Sidebar 
        onReportGenerated={handleReportGenerated} 
        onSpatialAnalysisGenerated={handleSpatialResult}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      
      <main className="flex-1 h-full relative">
        {activeTab === 'map' && <DashboardMap reports={reports} />}
        {activeTab === 'spatial' && <SpatialAnalysis result={spatialResult} />}
        {activeTab === 'budget' && <BudgetAnalysis />}
      </main>
    </div>
  );
};

export default App;