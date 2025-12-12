import React, { useState, useRef } from 'react';
import { Upload, Video, Image as ImageIcon, Loader2, AlertCircle, FileText, Map as MapIcon, MapPin, ScanEye } from 'lucide-react';
import { extractFramesFromVideo, fileToBase64 } from '../utils/media';
import { analyzeInfrastructureMedia, geocodeAddress, analyzeSpatialImage } from '../services/geminiService';
import { InfrastructureReport, Tab, SpatialAnalysisResult } from '../types';
import { DISTRICT_30_CENTER, MOCK_BUDGET_DATA } from '../constants';

interface SidebarProps {
  onReportGenerated: (report: InfrastructureReport) => void;
  onSpatialAnalysisGenerated: (result: SpatialAnalysisResult) => void;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  onReportGenerated, 
  onSpatialAnalysisGenerated,
  activeTab, 
  setActiveTab 
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMapFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!address.trim()) {
        setError("Please enter an address first.");
        // Reset the input so the user can select the file again if they want
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      let images: string[] = [];
      let thumbnail = '';

      if (file.type.startsWith('video/')) {
        // Extract 3 frames from video
        images = await extractFramesFromVideo(file, 3);
        thumbnail = images[0];
      } else if (file.type.startsWith('image/')) {
        const b64 = await fileToBase64(file);
        images = [b64];
        thumbnail = b64;
      } else {
        throw new Error("Unsupported file type");
      }

      // Execute both Analysis (Vision) and Geocoding (Maps Tool) in parallel
      const [analysisResult, locationResult] = await Promise.all([
        analyzeInfrastructureMedia(images),
        geocodeAddress(address)
      ]);

      // Calculate total budget for the identified department
      let departmentBudgetTotal = 0;
      if (analysisResult.department) {
        departmentBudgetTotal = MOCK_BUDGET_DATA
            .filter(item => item.department.toLowerCase().includes(analysisResult.department.toLowerCase()) || analysisResult.department.toLowerCase().includes(item.department.toLowerCase()))
            .reduce((sum, item) => sum + item.cost, 0);
      }

      const newReport: InfrastructureReport = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        latitude: locationResult.latitude,
        longitude: locationResult.longitude,
        severity: analysisResult.severity,
        type: analysisResult.type,
        waterDepthEstimate: analysisResult.waterDepth,
        description: analysisResult.description,
        thumbnail: thumbnail,
        address: address.trim(),
        googleMapsUrl: locationResult.googleMapsUrl,
        repairCostEstimate: analysisResult.repairCost,
        department: analysisResult.department,
        departmentBudgetTotal: departmentBudgetTotal
      };

      onReportGenerated(newReport);
      setAddress(''); // Clear address after successful submission

    } catch (err) {
      console.error(err);
      setError("Failed to analyze media or find location. Please try again.");
    } finally {
      setIsAnalyzing(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSpatialFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
        setError("Please upload an image file (JPG/PNG) for spatial analysis.");
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
        const b64 = await fileToBase64(file);
        const result = await analyzeSpatialImage(b64);
        onSpatialAnalysisGenerated(result);
    } catch (err) {
        console.error(err);
        setError("Failed to perform spatial analysis.");
    } finally {
        setIsAnalyzing(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  };

  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full shadow-lg z-20">
      <div className="p-6 border-b border-slate-200 bg-slate-50">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <span className="text-blue-600">Infra</span>Vision
        </h1>
        <div className="mt-2 text-xs text-slate-500 font-medium">
          <p>Council District 30 Monitor</p>
          <p className="mt-0.5">Councilman Phil Wong</p>
        </div>
      </div>

      <nav className="flex p-2 gap-1 bg-slate-50 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('map')}
          className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-md text-[10px] font-medium transition-colors ${
            activeTab === 'map' 
              ? 'bg-blue-100 text-blue-700' 
              : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          <MapIcon size={16} className="mb-1" />
          Map
        </button>
        <button
          onClick={() => setActiveTab('spatial')}
          className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-md text-[10px] font-medium transition-colors ${
            activeTab === 'spatial' 
              ? 'bg-purple-100 text-purple-700' 
              : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          <ScanEye size={16} className="mb-1" />
          Spatial
        </button>
        <button
          onClick={() => setActiveTab('budget')}
          className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-md text-[10px] font-medium transition-colors ${
            activeTab === 'budget' 
              ? 'bg-emerald-100 text-emerald-700' 
              : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          <FileText size={16} className="mb-1" />
          Budget
        </button>
      </nav>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'map' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-blue-900 mb-3 uppercase tracking-wide">
                Report Incident
              </h2>
              
              <div className="mb-4">
                <label className="block text-xs font-semibold text-blue-800 mb-1">
                  Location / Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-blue-400" />
                  </div>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="e.g. 55-02 Queens Blvd"
                    className="w-full pl-8 pr-3 py-2 text-sm border border-blue-200 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700 placeholder-slate-400"
                    disabled={isAnalyzing}
                  />
                </div>
              </div>

              <p className="text-sm text-blue-700 mb-4">
                Upload a photo or video. Gemini will analyze the issue and use Google Maps to find the location.
              </p>
              
              <label className={`
                flex flex-col items-center justify-center w-full h-32 
                border-2 border-dashed rounded-lg cursor-pointer 
                transition-all duration-200
                ${isAnalyzing 
                  ? 'border-blue-300 bg-blue-50 opacity-50 cursor-wait' 
                  : 'border-slate-300 bg-white hover:bg-slate-50 hover:border-blue-400'
                }
              `}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                      <p className="text-sm text-blue-600 font-medium">Analyzing...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-sm text-slate-500 font-medium">Click to upload</p>
                      <p className="text-xs text-slate-400 mt-1">MP4, JPG, PNG</p>
                    </>
                  )}
                </div>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  className="hidden" 
                  accept="image/*,video/*"
                  onChange={handleMapFileChange}
                  disabled={isAnalyzing}
                />
              </label>

              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-md flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-700">Instructions</h3>
              <ul className="text-sm text-slate-600 space-y-2 list-disc pl-4">
                <li>Enter the specific street address above.</li>
                <li>Upload media of the infrastructure failure.</li>
                <li>Infra Vision uses <strong>Google Maps</strong> to verify the location.</li>
                <li>Results are plotted precisely on the map.</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'spatial' && (
             <div className="space-y-6">
             <div className="bg-purple-50 border border-purple-100 rounded-xl p-5">
               <h2 className="text-sm font-semibold text-purple-900 mb-3 uppercase tracking-wide">
                 Identify Deserts
               </h2>
 
               <p className="text-sm text-purple-800 mb-4">
                 Upload a satellite image of a neighborhood. Gemini 3 will analyze density vs. transit access.
               </p>
               
               <label className={`
                 flex flex-col items-center justify-center w-full h-32 
                 border-2 border-dashed rounded-lg cursor-pointer 
                 transition-all duration-200
                 ${isAnalyzing 
                   ? 'border-purple-300 bg-purple-50 opacity-50 cursor-wait' 
                   : 'border-slate-300 bg-white hover:bg-slate-50 hover:border-purple-400'
                 }
               `}>
                 <div className="flex flex-col items-center justify-center pt-5 pb-6">
                   {isAnalyzing ? (
                     <>
                       <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-2" />
                       <p className="text-sm text-purple-600 font-medium">Scanning Image...</p>
                     </>
                   ) : (
                     <>
                       <ScanEye className="w-8 h-8 text-slate-400 mb-2" />
                       <p className="text-sm text-slate-500 font-medium">Upload Satellite Map</p>
                       <p className="text-xs text-slate-400 mt-1">JPG, PNG</p>
                     </>
                   )}
                 </div>
                 <input 
                   ref={fileInputRef}
                   type="file" 
                   className="hidden" 
                   accept="image/*"
                   onChange={handleSpatialFileChange}
                   disabled={isAnalyzing}
                 />
               </label>
 
               {error && (
                 <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-md flex items-start gap-2">
                   <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                   {error}
                 </div>
               )}
             </div>
 
             <div className="space-y-2">
               <h3 className="text-sm font-semibold text-slate-700">How it works</h3>
               <p className="text-sm text-slate-600">
                 Gemini 3 uses "Pixel Pointing" to detect:
               </p>
               <ul className="text-sm text-slate-600 space-y-2 list-disc pl-4">
                 <li>High-density residential clusters.</li>
                 <li>Lack of visible bus/train infrastructure.</li>
                 <li>Areas needing transit expansion.</li>
               </ul>
             </div>
           </div>
        )}
        
        {activeTab === 'budget' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-300 rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-800 mb-2">
                Budget Assistant
              </h2>
              <p className="text-sm text-slate-600">
                Ask questions about District 30 spending. Gemini has access to the latest CSV data.
              </p>
            </div>
            <div className="text-sm text-slate-500 italic">
              Use the chat interface on the right to interact with the budget data.
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            KL
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">Kevin Lee</p>
            <p className="text-xs text-slate-500">District 30, Queens</p>
          </div>
        </div>
      </div>
    </div>
  );
};