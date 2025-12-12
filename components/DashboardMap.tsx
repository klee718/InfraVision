import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, ExternalLink, DollarSign, Briefcase } from 'lucide-react'; 
import { InfrastructureReport } from '../types';
import { DISTRICT_30_CENTER } from '../constants';

// Fix Leaflet marker icons in React
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons based on severity
const getSeverityColor = (severity: number) => {
  if (severity >= 8) return 'red';
  if (severity >= 5) return 'orange';
  return 'green';
};

const createCustomIcon = (severity: number) => {
  const color = getSeverityColor(severity);
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });
};

interface DashboardMapProps {
  reports: InfrastructureReport[];
}

const MapUpdater: React.FC<{ center: { lat: number, lng: number }, reports: InfrastructureReport[] }> = ({ center, reports }) => {
  const map = useMap();
  useEffect(() => {
    // If a new report is added, fly to it
    if (reports.length > 0) {
      const latest = reports[reports.length - 1];
      map.flyTo([latest.latitude, latest.longitude], 16);
    }
  }, [reports, map]);
  return null;
};

export const DashboardMap: React.FC<DashboardMapProps> = ({ reports }) => {
  return (
    <div className="h-full w-full relative z-10">
      <MapContainer 
        center={[DISTRICT_30_CENTER.lat, DISTRICT_30_CENTER.lng]} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        <MapUpdater center={DISTRICT_30_CENTER} reports={reports} />

        {reports.map((report) => (
          <Marker 
            key={report.id} 
            position={[report.latitude, report.longitude]}
            icon={createCustomIcon(report.severity)}
          >
            <Popup className="leaflet-popup-custom">
              <div className="p-1 min-w-[220px]">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${
                    report.severity >= 8 ? 'bg-red-500' : report.severity >= 5 ? 'bg-orange-500' : 'bg-green-500'
                  }`}>
                    Severity: {report.severity}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(report.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                <h3 className="font-bold text-slate-800 text-sm mb-1">{report.type}</h3>

                {/* Address Display - Prominent */}
                {report.address && (
                    <div className="flex items-start gap-1.5 mb-2 text-xs font-semibold text-blue-700 bg-blue-50 p-1.5 rounded">
                        <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                        <span className="leading-tight">{report.address}</span>
                    </div>
                )}
                
                {report.thumbnail && (
                   <img 
                     src={`data:image/jpeg;base64,${report.thumbnail}`} 
                     alt="Incident" 
                     className="w-full h-24 object-cover rounded-md mb-2 border border-slate-200"
                   />
                )}

                <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                  {report.description}
                </p>
                
                <div className="flex flex-wrap gap-1 mb-2">
                  {report.waterDepthEstimate && report.waterDepthEstimate !== "N/A" && (
                    <div className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-1 rounded border border-slate-200 font-medium inline-flex items-center">
                       💧 {report.waterDepthEstimate}
                    </div>
                  )}
                  {report.department && (
                    <div className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-1 rounded border border-slate-200 font-medium inline-flex items-center gap-1">
                       <Briefcase size={10} /> {report.department}
                    </div>
                  )}
                </div>

                {/* Financial Impact Section */}
                <div className="bg-slate-50 border border-slate-200 rounded p-2 mb-2">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-slate-500">Repair Estimate:</span>
                        <span className="text-xs font-bold text-red-600">{report.repairCostEstimate || 'N/A'}</span>
                    </div>
                    {report.departmentBudgetTotal !== undefined && report.departmentBudgetTotal > 0 && (
                        <div className="flex justify-between items-center border-t border-slate-200 pt-1 mt-1">
                            <span className="text-[10px] text-slate-500">Dept Budget:</span>
                            <span className="text-xs font-semibold text-slate-700">
                                ${(report.departmentBudgetTotal / 1000000).toFixed(1)}M
                            </span>
                        </div>
                    )}
                </div>

                {/* Google Maps Source Link */}
                {report.googleMapsUrl && (
                  <a 
                    href={report.googleMapsUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-700 hover:underline mt-1"
                  >
                    <ExternalLink size={10} />
                    View on Google Maps
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Legend Overlay */}
      <div className="absolute bottom-6 right-6 bg-white p-3 rounded-lg shadow-md border border-slate-200 z-[1000] text-xs space-y-2">
        <h4 className="font-semibold text-slate-700 mb-1">Severity Levels</h4>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 border border-white shadow-sm"></div>
          <span>Critical (8-10)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500 border border-white shadow-sm"></div>
          <span>Moderate (5-7)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 border border-white shadow-sm"></div>
          <span>Low (1-4)</span>
        </div>
      </div>
    </div>
  );
};