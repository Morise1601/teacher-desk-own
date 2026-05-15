'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaMapMarkerAlt, FaTimes, FaSearch, FaGlobe, 
  FaCity, FaSchool, FaChevronRight, FaCheckCircle, 
  FaCompass, FaArrowLeft, FaUniversity, FaSync, FaSearchPlus, FaExclamationCircle
} from 'react-icons/fa';

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-slate-100 border-t-[var(--color-primary)] rounded-full animate-spin"></div>
    </div>
  )
});

interface MapPickerProps {
  onLocationSelect: (address: string) => void;
  onSelect?: (data: { name: string; address: string }) => void;
  onClose: () => void;
}

type Step = 'location' | 'institution';

export default function MapPicker({ onLocationSelect, onSelect, onClose }: MapPickerProps) {
  const [activeStep, setActiveStep] = useState<Step>('location');
  const [countries, setCountries] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedInst, setSelectedInst] = useState<any>(null);
  
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [instList, setInstList] = useState<any[]>([]);
  
  const [position, setPosition] = useState<[number, number]>([20.5937, 78.9629]); 
  const [address, setAddress] = useState<string>('');
  const [instSearch, setInstSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchCountries();
  }, []);

  const safeFetch = async (url: string, options?: RequestInit) => {
    try {
      const res = await fetch(url, options);
      if (!res.ok) return { _error: true, status: res.status };
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) return { _error: true, format: true };
      return await res.json();
    } catch (err: any) {
      return { _error: true };
    }
  };

  const fetchCountries = async () => {
    setDataLoading(true);
    const data = await safeFetch('https://restcountries.com/v3.1/all?fields=name,cca2');
    if (data && !data._error) {
        setCountries(data.sort((a: any, b: any) => a.name.common.localeCompare(b.name.common)));
    }
    setDataLoading(false);
  };

  const fetchRegions = async (countryName: string) => {
    setDataLoading(true); setStates([]);
    const data = await safeFetch('https://countriesnow.space/api/v0.1/countries/states', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: countryName })
    });
    if (data?.data?.states) setStates(data.data.states.sort((a: any, b: any) => a.name.localeCompare(b.name)));
    setDataLoading(false);
  };

  const fetchCities = async (stateName: string, countryName: string) => {
    setDataLoading(true); setCities([]);
    const data = await safeFetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: countryName, state: stateName })
    });
    if (data?.data) setCities(data.data.sort());
    setDataLoading(false);
  };

  const fetchInstitutions = async (city: string, state: string, country: string) => {
    setDataLoading(true); setInstList([]); setError(null);
    try {
      // PHASE 1: Try Nominatim with a massive set of keywords
      const categories = ['university', 'college', 'school', 'polytechnic', 'training institute', 'vocational center', 'academy'];
      let allFound: any[] = [];
      
      const searches = categories.map(cat => 
        safeFetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cat + ' in ' + city + ' ' + state)}&format=json&addressdetails=1&limit=20`)
      );

      const results = await Promise.all(searches);
      
      results.forEach(res => {
          if (res && Array.isArray(res)) {
              res.forEach((el: any) => {
                  allFound.push({
                      name: el.display_name.split(',')[0],
                      type: el.type || el.class || 'Education',
                      lat: parseFloat(el.lat),
                      lng: parseFloat(el.lon),
                      address: el.display_name
                  });
              });
          }
      });

      // Deduplicate by name
      const unique = Array.from(new Map(allFound.map(item => [item.name, item])).values());
      setInstList(unique);
      if (unique.length > 0) {
          setPosition([unique[0].lat, unique[0].lng]);
      }

      // PHASE 2: Super-Exhaustive Overpass Scan (Vocational, Training, Driving, etc.)
      const lat = unique[0]?.lat || 20.5937;
      const lon = unique[0]?.lng || 78.9629;
      // Scans for all possible educational amenities+buildings within 50km
      const opQuery = `[out:json][timeout:25];(node["amenity"~"university|college|school|kindergarten|language_school|music_school|driving_school"](around:50000,${lat},${lon});way["amenity"~"university|college|school|kindergarten|language_school|music_school|driving_school"](around:50000,${lat},${lon});node["building"~"university|college|school|kindergarten"](around:50000,${lat},${lon});way["building"~"university|college|school|kindergarten"](around:50000,${lat},${lon});node["office"="educational_institution"](around:50000,${lat},${lon}););out center;`;
      
      const mirrors = ['https://lz4.overpass-api.de/api/interpreter', 'https://overpass-api.de/api/interpreter'];
      for (const mirror of mirrors) {
          try {
              const opRes = await fetch(`${mirror}?data=${encodeURIComponent(opQuery)}`);
              if (opRes.ok) {
                  const opData = await opRes.json();
                  if (opData?.elements) {
                      const extra = opData.elements.map((el: any) => ({
                        name: el.tags.name || el.tags['name:en'] || "Campus",
                        type: el.tags.amenity === 'university' ? 'University' : 
                              el.tags.amenity === 'college' ? 'College' : 
                              el.tags.amenity === 'school' ? 'School' : 
                              el.tags.amenity || 'Vocational Center',
                        lat: el.lat || el.center.lat,
                        lng: el.lon || el.center.lon,
                        address: el.tags['addr:full'] || el.tags['addr:street'] || `${el.tags.name || 'Education Center'}, ${city}`
                      })).filter((el: any) => el.name !== "Campus");
                      
                      setInstList(prev => {
                          const seen = new Set(prev.map(p => p.name));
                          return [...prev, ...extra.filter((e: any) => !seen.has(e.name))];
                      });
                      break; 
                  }
              }
          } catch (e: any) { continue; }
      }
    } catch (err: any) { } finally { setDataLoading(false); }
  };

  const handleSmartSearch = async () => {
    if (!instSearch) return;
    setDataLoading(true); setError(null);
    const query = `${instSearch} ${selectedCity} ${selectedState} educational`;
    const data = await safeFetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=15`);
    
    if (data && Array.isArray(data)) {
        const mapped = data.map((el: any) => ({
            name: el.display_name.split(',')[0],
            type: el.type || el.class || 'College',
            lat: parseFloat(el.lat),
            lng: parseFloat(el.lon),
            address: el.display_name
        }));
        setInstList(prev => {
            const seen = new Set(prev.map(p => p.name));
            return [...mapped.filter((m: any) => !seen.has(m.name)), ...prev];
        });
    }
    setDataLoading(false);
  };

  useEffect(() => { if (selectedCountry) fetchRegions(selectedCountry.name.common); }, [selectedCountry]);
  useEffect(() => { if (selectedState) fetchCities(selectedState, selectedCountry.name.common); }, [selectedState]);
  useEffect(() => { if (selectedCity && activeStep === 'institution') fetchInstitutions(selectedCity, selectedState, selectedCountry.name.common); }, [selectedCity, activeStep]);

  const availableInstitutions = useMemo(() => {
    if (!instSearch) return instList;
    return instList.filter((i: any) => i.name.toLowerCase().includes(instSearch.toLowerCase()));
  }, [instList, instSearch]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-12 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-300">
      <motion.div initial={{ opacity: 0, scale: 0.98, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] w-full max-w-6xl h-full md:h-[80vh] overflow-hidden flex flex-col md:flex-row rounded-none md:rounded-[1.5rem] border border-slate-200">
        
        <div className="w-full md:w-[360px] h-full bg-slate-50/50 border-r border-slate-100 flex flex-col z-20 backdrop-blur-md">
          <div className="p-6 bg-white/95 border-b border-slate-100">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-bold text-slate-800 oswald-font tracking-tight capitalize">Campus Locator</h3>
               <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-400"><FaTimes size={16} /></button>
            </div>

            <div className="flex p-0.5 bg-slate-100 rounded-lg border border-slate-200/50">
              <button type="button" onClick={() => setActiveStep('location')}
                className={`flex-1 py-1.5 text-[10px] font-bold transition-all rounded-md flex items-center justify-center gap-2 ${activeStep === 'location' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-slate-400'}`}>
                <FaCompass size={12} /> Region
              </button>
              <button type="button" disabled={!selectedCity} onClick={() => setActiveStep('institution')}
                className={`flex-1 py-1.5 text-[10px] font-bold transition-all rounded-md flex items-center justify-center gap-2 ${activeStep === 'institution' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-slate-400'} disabled:opacity-30`}>
                <FaUniversity size={12} /> Institution
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto sidebar-scroll p-6 space-y-6">
            <AnimatePresence mode="wait">
              {activeStep === 'location' ? (
                <motion.div key="loc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Country</label>
                      <select value={selectedCountry?.cca2 || ''} 
                        onChange={(e) => { setSelectedCountry(countries.find(c => c.cca2 === e.target.value)); setSelectedState(''); setSelectedCity(''); }}
                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:border-[var(--color-primary)] outline-none shadow-sm cursor-pointer hover:border-slate-300 transition-colors">
                        <option value="">Select Country</option>
                        {countries.map(c => <option key={c.cca2} value={c.cca2}>{c.name.common}</option>)}
                      </select>
                   </div>
                   <div className={`space-y-1.5 transition-all ${selectedCountry ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">State / UT</label>
                      <select value={selectedState} onChange={(e) => { setSelectedState(e.target.value); setSelectedCity(''); }}
                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:border-[var(--color-primary)] outline-none shadow-sm cursor-pointer hover:border-slate-300 transition-colors">
                        <option value="">{dataLoading ? 'Loading...' : 'Select State'}</option>
                        {states.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                      </select>
                   </div>
                   <div className={`space-y-1.5 transition-all ${selectedState ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">City</label>
                      <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:border-[var(--color-primary)] outline-none shadow-sm cursor-pointer hover:border-slate-300 transition-colors">
                        <option value="">{dataLoading ? 'Loading...' : 'Select City'}</option>
                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                   </div>
                   {selectedCity && (
                     <button type="button" onClick={() => setActiveStep('institution')} 
                       className="w-full py-2.5 bg-[#143c64] hover:bg-[#1a4d80] text-white rounded-lg font-bold text-[10px] uppercase tracking-wider shadow-lg shadow-blue-900/10 transition-all flex items-center justify-center gap-2 mt-4 group">
                       Find Institutions <FaChevronRight size={8} className="group-hover:translate-x-0.5 transition-transform" />
                     </button>
                   )}
                </motion.div>
              ) : (
                <motion.div key="inst" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                   <button type="button" onClick={() => setActiveStep('location')} className="text-[10px] font-bold text-[var(--color-primary)] flex items-center gap-2 mb-2">
                     <FaArrowLeft size={8} /> Change Region
                   </button>
                   <div className="relative group">
                      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--color-primary)]" size={12} />
                      <input type="text" placeholder="Institution Name (SMVEC...)" value={instSearch} onChange={(e) => setInstSearch(e.target.value)}
                        className="w-full h-10 pl-9 pr-16 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:border-[var(--color-primary)] outline-none shadow-sm" />
                      <button type="button" onClick={handleSmartSearch} className="absolute right-1 top-1 h-8 px-2 bg-slate-100 text-[9px] font-bold rounded-md hover:bg-[var(--color-primary)] hover:text-white transition-all uppercase">Deep Search</button>
                   </div>
                   <div className="space-y-2.5 pt-2">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center justify-between">
                         Campus List
                         {dataLoading && <FaSync className="animate-spin" size={8} />}
                      </p>
                      {availableInstitutions.length > 0 ? (
                        availableInstitutions.map((inst, i) => (
                          <div key={inst.name + i} 
                            onClick={() => { 
                              setSelectedInst(inst); 
                              setPosition([inst.lat, inst.lng]); 
                              setAddress(inst.address); 
                            }}
                            onDoubleClick={() => {
                              if (onSelect) onSelect({ name: inst.name, address: inst.address });
                              onLocationSelect(inst.address);
                              onClose();
                            }}
                            className={`p-3 rounded-xl border cursor-pointer group transition-all hover:border-[var(--color-primary)] hover:shadow-md ${selectedInst?.name === inst.name ? 'border-[var(--color-primary)] bg-blue-50/50 shadow-sm' : 'border-slate-100 bg-white'}`}>
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors"><FaUniversity size={14} /></div>
                               <div className="flex-1 overflow-hidden">
                                  <h4 className="text-[11px] font-bold text-slate-800 leading-none truncate">{inst.name}</h4>
                                  <p className="text-[8px] text-slate-400 mt-1 uppercase font-bold tracking-tighter opacity-70 truncate">{inst.type} • {selectedCity}</p>
                               </div>
                               <button 
                                 type="button"
                                 onClick={(e) => { 
                                   e.stopPropagation(); 
                                   if (onSelect) onSelect({ name: inst.name, address: inst.address });
                                   onLocationSelect(inst.address); 
                                   onClose(); 
                                 }}
                                 className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-[var(--color-primary)] text-white text-[8px] font-bold rounded uppercase transition-all whitespace-nowrap">
                                 Select
                               </button>
                               {selectedInst?.name === inst.name && <FaCheckCircle className="text-emerald-500 animate-in zoom-in-50 duration-300 flex-shrink-0" size={14} />}
                            </div>
                          </div>
                        ))
                      ) : !dataLoading && (
                        <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl px-4">
                           <p className="text-[10px] font-bold text-slate-400 oswald-font uppercase">Search Suggestion</p>
                           <p className="text-[9px] text-slate-300 mt-1 uppercase tracking-tighter leading-tight">Server is busy scanning the map. Please type the University name above to find it instantly.</p>
                        </div>
                      )}
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-6 bg-white border-t border-slate-100 mt-auto">
             <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <FaMapMarkerAlt className={`${address ? "text-[var(--color-primary)]" : "text-slate-200"} mt-0.5`} size={12} />
                <p className="text-[10px] text-slate-500 leading-tight font-bold brcob-font truncate md:whitespace-normal">{address || 'Awaiting selection...'}</p>
             </div>
          </div>
        </div>

        <div className="flex-1 relative bg-slate-100 overflow-hidden">
          <MapComponent position={position} setPosition={setPosition} onLocationSelect={setAddress} loading={loading} setLoading={setLoading} setAddress={setAddress} />
           <div className="absolute top-6 right-6 z-[1000] hidden md:block">
              <button type="button" onClick={onClose} className="w-10 h-10 bg-white shadow-lg rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-all border border-slate-100"><FaTimes size={18} /></button>
           </div>
          <div className="absolute bottom-10 left-6 right-6 md:left-auto md:right-10 md:w-[400px] z-[1000]">
              <motion.button type="button" disabled={!address || loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} 
                onClick={() => { 
                  if (onSelect) onSelect({ name: selectedInst?.name || "New Institution", address: address });
                  onLocationSelect(address); 
                  onClose(); 
                }}
                className="w-full py-4 bg-[#143c64] hover:bg-[#1a4d80] shadow-xl shadow-blue-900/20 text-white rounded-xl font-bold oswald-font tracking-[0.2em] uppercase text-xs flex items-center justify-center gap-3 disabled:opacity-50 transition-all">
                Confirm Placement <FaCheckCircle size={14} />
              </motion.button>
          </div>
          {dataLoading && (
            <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] flex items-center justify-center z-[1001]">
              <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
