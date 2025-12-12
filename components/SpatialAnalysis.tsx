import React, { useState } from 'react';
import { SpatialAnalysisResult } from '../types';
import { Target, AlertTriangle, Map, Info } from 'lucide-react';

interface SpatialAnalysisProps {
  result: SpatialAnalysisResult | null;
}

export const SpatialAnalysis: React.FC<SpatialAnalysisProps> = ({ result }) => {
  const [hoveredBoxIndex, setHoveredBoxIndex] = useState<number | null>(null);

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center bg-slate-50">
        <Map className="w-20 h-20 mb-4 opacity-20" />
        <h3 className="text-xl font-semibold text-slate-600 mb-2">Spatial Reasoning Mode</h3>
        <p className="max-w-md">
          Upload a satellite image of a neighborhood via the sidebar to identify 
          <span className="font-semibold text-slate-700"> transportation deserts</span>.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Powered by Gemini 3's spatial understanding capabilities.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-slate-100 overflow-hidden">
      {/* Main Image View */}
      <div className="flex-1 relative bg-black flex items-center justify-center p-4">
        <div className="relative max-h-full max-w-full shadow-2xl">
          <img 
            src={`data:image/jpeg;base64,${result.imageBase64}`} 
            alt="Analyzed Satellite View" 
            className="max-h-[85vh] object-contain rounded-sm"
          />
          
          {/* Bounding Box Overlay */}
          <div className="absolute inset-0">
            {result.boxes.map((box, idx) => (
              <div
                key={idx}
                className={`absolute border-2 transition-all duration-200 cursor-help ${
                  hoveredBoxIndex === idx 
                    ? 'border-red-400 bg-red-500/20 z-10' 
                    : 'border-red-500/70 hover:border-red-400 hover:bg-red-500/10'
                }`}
                style={{
                  top: `${box.ymin * 100}%`,
                  left: `${box.xmin * 100}%`,
                  height: `${(box.ymax - box.ymin) * 100}%`,
                  width: `${(box.xmax - box.xmin) * 100}%`
                }}
                onMouseEnter={() => setHoveredBoxIndex(idx)}
                onMouseLeave={() => setHoveredBoxIndex(null)}
              >
                {/* Tooltip on Hover */}
                {hoveredBoxIndex === idx && (
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg z-20 pointer-events-none">
                    {box.label}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Overlay Title */}
        <div className="absolute top-6 left-6 bg-slate-900/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg border border-slate-700 shadow-lg">
            <div className="flex items-center gap-2">
                <Target className="text-red-400 w-4 h-4" />
                <span className="font-medium text-sm">Spatial Analysis Overlay</span>
            </div>
        </div>
      </div>

      {/* Analysis Side Panel */}
      <div className="w-[380px] bg-white border-l border-slate-200 flex flex-col h-full shadow-xl z-10">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="text-orange-500 w-5 h-5" />
            Transportation Deserts
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gemini 3 Analysis Findings
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" /> Summary
            </h3>
            <p className="text-sm text-blue-800 leading-relaxed">
              {result.summary}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Identified Areas ({result.boxes.length})
            </h3>
            <div className="space-y-3">
              {result.boxes.map((box, idx) => (
                <div 
                  key={idx}
                  className={`border rounded-lg p-3 transition-colors duration-200 cursor-pointer ${
                    hoveredBoxIndex === idx 
                      ? 'bg-red-50 border-red-200 shadow-sm' 
                      : 'bg-white border-slate-200 hover:border-red-200 hover:bg-slate-50'
                  }`}
                  onMouseEnter={() => setHoveredBoxIndex(idx)}
                  onMouseLeave={() => setHoveredBoxIndex(null)}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-semibold text-slate-700 text-sm">{box.label}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                        #{idx + 1}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {box.reasoning}
                  </p>
                </div>
              ))}
              
              {result.boxes.length === 0 && (
                <div className="text-sm text-slate-500 italic text-center py-4">
                    No obvious transportation deserts identified in this view.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};