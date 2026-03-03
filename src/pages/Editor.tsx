import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Trash2,
  Play,
  Layers,
  Settings2,
  BarChart3,
  Info,
  ChevronDown,
  ChevronUp,
  Download,
  Zap,
  Edit3,
  Eye,
  X,
  Save,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  TMMSimulator,
  Layer,
  SimulationResult,
  AbsorptionProfilePoint,
  Polarization,
  MATERIALS,
  ColorUtils,
  SpectralPoint,
} from "../lib/tmm";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DEFAULT_LAYERS: Layer[] = [
  { id: "1", name: "Air", thickness: 0, n: 1.0, k: 0, isThick: false },
  { id: "2", name: "MgF2", thickness: 100, n: 1.38, k: 0, isThick: false },
  { id: "3", name: "Si", thickness: 50, n: 3.4, k: 0.1, isThick: false },
  { id: "4", name: "Glass", thickness: 0, n: 1.5, k: 0, isThick: false },
];

const PRESETS = {
  "Anti-Reflection": [
    { id: "p1-1", name: "Air", thickness: 0, n: 1.0, k: 0, isThick: false },
    { id: "p1-2", name: "MgF2", thickness: 100, n: 1.38, k: 0, isThick: false },
    { id: "p1-3", name: "Glass", thickness: 0, n: 1.5, k: 0, isThick: false },
  ],
  "Bragg Mirror": [
    { id: "p2-1", name: "Air", thickness: 0, n: 1.0, k: 0, isThick: false },
    { id: "p2-2", name: "TiO2", thickness: 55, n: 2.5, k: 0, isThick: false },
    { id: "p2-3", name: "SiO2", thickness: 95, n: 1.45, k: 0, isThick: false },
    { id: "p2-4", name: "TiO2", thickness: 55, n: 2.5, k: 0, isThick: false },
    { id: "p2-5", name: "SiO2", thickness: 95, n: 1.45, k: 0, isThick: false },
    { id: "p2-6", name: "TiO2", thickness: 55, n: 2.5, k: 0, isThick: false },
    { id: "p2-7", name: "SiO2", thickness: 95, n: 1.45, k: 0, isThick: false },
    { id: "p2-8", name: "Glass", thickness: 0, n: 1.5, k: 0, isThick: false },
  ],
  "Solar Cell (Simple)": [
    { id: "p3-1", name: "Air", thickness: 0, n: 1.0, k: 0, isThick: false },
    { id: "p3-2", name: "ITO", thickness: 80, n: 1.9, k: 0.01, isThick: false },
    {
      id: "p3-3",
      name: "Perovskite",
      thickness: 300,
      n: 2.5,
      k: 0.05,
      isThick: false,
    },
    {
      id: "p3-4",
      name: "Gold",
      thickness: 100,
      n: 0.2,
      k: 3.5,
      isThick: false,
    },
    { id: "p3-5", name: "Glass", thickness: 0, n: 1.5, k: 0, isThick: false },
  ],
};

export default function App() {
  const [layers, setLayers] = useState<Layer[]>(DEFAULT_LAYERS);
  const [wavelengthRange, setWavelengthRange] = useState({
    min: 300,
    max: 1200,
    step: 2,
  });
  const [angle, setAngle] = useState(0);
  const [polarization, setPolarization] = useState<Polarization>("s");
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [profile, setProfile] = useState<AbsorptionProfilePoint[]>([]);
  const [selectedWavelength, setSelectedWavelength] = useState(550);
  const [isSimulating, setIsSimulating] = useState(false);
  const [profileMode, setProfileMode] = useState<"absorption" | "field">(
    "absorption",
  );
  const [savedDesigns, setSavedDesigns] = useState<string[]>([]);
  const [editingSpectralLayerId, setEditingSpectralLayerId] = useState<
    string | null
  >(null);
  const [savedMaterials, setSavedMaterials] = useState<Layer[]>([]);
  const [profileWavelengths, setProfileWavelengths] = useState<string>("550");

  useEffect(() => {
    const saved = localStorage.getItem("optilayer_designs");
    if (saved) setSavedDesigns(JSON.parse(saved));
    const savedMats = localStorage.getItem("optilayer_materials");
    if (savedMats) setSavedMaterials(JSON.parse(savedMats));
  }, []);

  const saveDesign = () => {
    const name = prompt("Enter design name:");
    if (!name) return;
    const design = { name, layers, wavelengthRange, angle, polarization };
    const all = [...savedDesigns, JSON.stringify(design)];
    setSavedDesigns(all);
    localStorage.setItem("optilayer_designs", JSON.stringify(all));
  };

  const loadDesign = (json: string) => {
    const design = JSON.parse(json);
    setLayers(design.layers);
    setWavelengthRange(design.wavelengthRange);
    setAngle(design.angle);
    setPolarization(design.polarization);
  };

  const deleteDesign = (index: number) => {
    const all = savedDesigns.filter((_, i) => i !== index);
    setSavedDesigns(all);
    localStorage.setItem("optilayer_designs", JSON.stringify(all));
  };

  const saveMaterial = (layer: Layer) => {
    const name = prompt("Enter material name:", layer.name);
    if (!name) return;

    const existingIndex = savedMaterials.findIndex((m) => m.name === name);
    let all = [...savedMaterials];

    if (existingIndex >= 0) {
      if (window.confirm(`Material "${name}" already exists. Overwrite?`)) {
        all[existingIndex] = { ...layer, id: all[existingIndex].id, name };
      } else {
        return;
      }
    } else {
      const newMat = {
        ...layer,
        id: Math.random().toString(36).substr(2, 9),
        name,
      };
      all.push(newMat);
    }

    setSavedMaterials(all);
    localStorage.setItem("optilayer_materials", JSON.stringify(all));
  };

  const deleteMaterial = (id: string) => {
    const all = savedMaterials.filter((m) => m.id !== id);
    setSavedMaterials(all);
    localStorage.setItem("optilayer_materials", JSON.stringify(all));
  };

  const [expandedElectrical, setExpandedElectrical] = useState<
    Record<string, boolean>
  >({});

  const toggleElectrical = (id: string) => {
    setExpandedElectrical((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const reflectedColor = useMemo(() => {
    if (results.length === 0) return "#000000";
    return ColorUtils.spectrumToRGB(results);
  }, [results]);

  const runSimulation = () => {
    setIsSimulating(true);
    // Use a timeout to allow UI to show loading state if needed
    setTimeout(() => {
      const simulationLayers = layers.slice(1, -1);
      const nStart = layers[0].n;
      const nEnd = layers[layers.length - 1].n;

      const newResults: SimulationResult[] = [];
      for (
        let w = wavelengthRange.min;
        w <= wavelengthRange.max;
        w += wavelengthRange.step
      ) {
        newResults.push(
          TMMSimulator.calculate(
            w,
            angle,
            polarization,
            simulationLayers,
            nStart,
            nEnd,
          ),
        );
      }
      setResults(newResults);

      const wavelengths = profileWavelengths
        .split(",")
        .map((s) => parseFloat(s.trim()))
        .filter((n) => !isNaN(n));
      if (wavelengths.length === 0) wavelengths.push(550);

      let combinedProfile: AbsorptionProfilePoint[] = [];

      wavelengths.forEach((w, idx) => {
        const p = TMMSimulator.calculateAbsorptionProfile(
          w,
          angle,
          polarization,
          simulationLayers,
          nStart,
          nEnd,
        );
        if (idx === 0) {
          combinedProfile = p.map((point) => ({ ...point }));
        } else {
          p.forEach((point, i) => {
            if (combinedProfile[i]) {
              combinedProfile[i].absorption += point.absorption;
              combinedProfile[i].fieldIntensity += point.fieldIntensity;
            }
          });
        }
      });

      if (wavelengths.length > 1) {
        combinedProfile.forEach((point) => {
          point.absorption /= wavelengths.length;
          point.fieldIntensity /= wavelengths.length;
        });
      }

      setProfile(combinedProfile);
      setIsSimulating(false);
    }, 100);
  };

  useEffect(() => {
    runSimulation();
  }, []);

  const addLayer = () => {
    const newLayer: Layer = {
      id: Math.random().toString(36).substr(2, 9),
      name: "New Layer",
      thickness: 100,
      n: 1.5,
      k: 0,
      isThick: false,
    };
    const newLayers = [...layers];
    newLayers.splice(layers.length - 1, 0, newLayer);
    setLayers(newLayers);
  };

  const removeLayer = (id: string) => {
    if (layers.length <= 2) return;
    setLayers(layers.filter((l) => l.id !== id));
  };

  const updateLayer = (id: string, updates: Partial<Layer>) => {
    setLayers(layers.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  const handleSpectralUpload = (
    layerId: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n");
      const data: SpectralPoint[] = [];

      lines.forEach((line) => {
        const parts = line.trim().split(/[\s,]+/);
        if (parts.length >= 3) {
          const wavelength = parseFloat(parts[0]);
          const n = parseFloat(parts[1]);
          const k = parseFloat(parts[2]);
          if (!isNaN(wavelength) && !isNaN(n) && !isNaN(k)) {
            data.push({ wavelength, n, k });
          }
        }
      });

      if (data.length > 0) {
        updateLayer(layerId, { spectralData: data });
      } else {
        alert(
          "Could not parse spectral data. Format should be: wavelength n k (space or comma separated)",
        );
      }
    };
    reader.readAsText(file);
  };

  const updateSpectralPoint = (
    layerId: string,
    pointIndex: number,
    updates: Partial<SpectralPoint>,
  ) => {
    setLayers(
      layers.map((l) => {
        if (l.id === layerId && l.spectralData) {
          const newData = [...l.spectralData];
          newData[pointIndex] = { ...newData[pointIndex], ...updates };
          return {
            ...l,
            spectralData: newData.sort((a, b) => a.wavelength - b.wavelength),
          };
        }
        return l;
      }),
    );
  };

  const addSpectralPoint = (layerId: string) => {
    setLayers(
      layers.map((l) => {
        if (l.id === layerId) {
          const newData = l.spectralData ? [...l.spectralData] : [];
          newData.push({ wavelength: 500, n: 1.5, k: 0 });
          return {
            ...l,
            spectralData: newData.sort((a, b) => a.wavelength - b.wavelength),
          };
        }
        return l;
      }),
    );
  };

  const removeSpectralPoint = (layerId: string, pointIndex: number) => {
    setLayers(
      layers.map((l) => {
        if (l.id === layerId && l.spectralData) {
          const newData = l.spectralData.filter((_, i) => i !== pointIndex);
          return {
            ...l,
            spectralData: newData.length > 0 ? newData : undefined,
          };
        }
        return l;
      }),
    );
  };

  const moveLayer = (index: number, direction: "up" | "down") => {
    if (index <= 0 || index >= layers.length - 1) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex <= 0 || newIndex >= layers.length - 1) return;

    const newLayers = [...layers];
    const temp = newLayers[index];
    newLayers[index] = newLayers[newIndex];
    newLayers[newIndex] = temp;
    setLayers(newLayers);
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Header */}
      <header className="border-b border-[#141414] p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <a href="/" className="flex items-center gap-3">
          <img src="/assets/icons/logo.ico" alt="Marzia Logo" className="w-12 h-12 opacity-100" />
          <div className="hidden md:block">
            <h1 className="text-4xl font-serif italic tracking-tight">Marzia</h1>
            <p className="text-xs uppercase tracking-widest opacity-50 mt-1 font-mono">
              Multilayer Film Simulator / TMM Engine
            </p>
          </div>
        </a>
        <div className="flex gap-4">
          <button
            onClick={saveDesign}
            disabled={isSimulating}
            className="flex items-center gap-2 border border-[#141414] px-4 py-2 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span className="font-mono text-xs uppercase">Save Design</span>
          </button>
          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className="flex items-center gap-2 bg-[#141414] text-[#E4E3E0] px-6 py-3 rounded-none hover:bg-opacity-90 transition-all disabled:opacity-50"
          >
            <Zap className={cn("w-4 h-4", isSimulating && "animate-pulse")} />
            <span className="font-mono text-sm uppercase tracking-wider">
              Run Simulation
            </span>
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-100px)] relative">
        {isSimulating && (
          <div className="absolute inset-0 bg-[#E4E3E0]/50 backdrop-blur-[2px] z-40 flex items-center justify-center">
            <div className="bg-[#141414] text-[#E4E3E0] px-6 py-4 flex items-center gap-3 shadow-2xl border border-[#E4E3E0]/20 animate-in fade-in zoom-in duration-200">
              <Zap className="w-5 h-5 animate-pulse text-[#F27D26]" />
              <span className="font-mono text-xs uppercase tracking-widest">
                Computing Simulation...
              </span>
            </div>
          </div>
        )}
        {/* Sidebar: Layer Editor */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#141414] p-4 md:p-6 overflow-y-auto w-full">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              <h2 className="font-serif italic text-xl">Structure</h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const middle = [...layers.slice(1, -1)].reverse();
                  setLayers([layers[0], ...middle, layers[layers.length - 1]]);
                }}
                disabled={isSimulating}
                title="Reverse middle layers"
                className="p-2 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors disabled:opacity-50"
              >
                <Play className="w-4 h-4 rotate-180" />
              </button>
              <button
                onClick={() =>
                  setLayers([layers[0], layers[layers.length - 1]])
                }
                disabled={isSimulating}
                title="Clear all middle layers"
                className="p-2 border border-[#141414] hover:bg-red-50 text-red-600 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={addLayer}
                disabled={isSimulating}
                className="p-2 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Visual Stack Diagram */}
            <div className="border border-[#141414] p-2 bg-white mb-6">
              <div className="flex flex-col-reverse w-full h-32 border border-[#141414] overflow-hidden">
                {layers.map((l, i) => (
                  <div
                    key={l.id}
                    className="w-full border-t border-[#141414]/20 flex items-center justify-center overflow-hidden"
                    style={{
                      height:
                        l.thickness === 0
                          ? "15%"
                          : `${Math.max(5, (l.thickness / layers.reduce((a, b) => a + b.thickness, 0)) * 70)}%`,
                      backgroundColor:
                        i === 0 || i === layers.length - 1
                          ? "#eee"
                          : `rgba(20, 20, 20, ${0.1 + (i % 5) * 0.1})`,
                    }}
                  >
                    <span className="font-mono text-[8px] uppercase truncate px-1">
                      {l.name}
                    </span>
                  </div>
                ))}
              </div>
              <p className="font-mono text-[8px] uppercase opacity-50 mt-1 text-center">
                Structure Visualization
              </p>
            </div>

            {layers.map((layer, index) => (
              <div
                key={layer.id}
                className={cn(
                  "border border-[#141414] p-4 transition-all",
                  index === 0 || index === layers.length - 1
                    ? "bg-[#D4D3D0]"
                    : "bg-white",
                )}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] opacity-50">
                      0{index + 1}
                    </span>
                    <select
                      value={layer.name}
                      disabled={isSimulating}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (MATERIALS[val]) {
                          const mat = MATERIALS[val];
                          updateLayer(layer.id, {
                            n: mat.n,
                            k: mat.k,
                            name: val,
                            spectralData: undefined,
                          });
                        } else {
                          const savedMat = savedMaterials.find(
                            (m) => m.name === val,
                          );
                          if (savedMat) {
                            updateLayer(layer.id, {
                              n: savedMat.n,
                              k: savedMat.k,
                              name: savedMat.name,
                              spectralData: savedMat.spectralData,
                              bandgap: savedMat.bandgap,
                              affinity: savedMat.affinity,
                              dopingType: savedMat.dopingType,
                              dopingConc: savedMat.dopingConc,
                              mobilityN: savedMat.mobilityN,
                              mobilityP: savedMat.mobilityP,
                              bandwidth: savedMat.bandwidth,
                            });
                          } else {
                            updateLayer(layer.id, { name: val });
                          }
                        }
                      }}
                      className="font-serif italic text-sm bg-transparent border-none focus:ring-0 p-0 w-32 cursor-pointer"
                    >
                      <optgroup label="Presets">
                        {Object.keys(MATERIALS).map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </optgroup>
                      {savedMaterials.length > 0 && (
                        <optgroup label="Saved Materials">
                          {savedMaterials.map((m) => (
                            <option key={m.id} value={m.name}>
                              {m.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {!Object.keys(MATERIALS).includes(layer.name) &&
                        !savedMaterials.find((m) => m.name === layer.name) && (
                          <option value={layer.name}>{layer.name}</option>
                        )}
                    </select>
                  </div>
                  <div className="flex gap-1">
                    {savedMaterials.find((m) => m.name === layer.name) && (
                      <button
                        onClick={() => {
                          const mat = savedMaterials.find(
                            (m) => m.name === layer.name,
                          );
                          if (
                            mat &&
                            window.confirm(`Delete material "${mat.name}"?`)
                          ) {
                            deleteMaterial(mat.id);
                          }
                        }}
                        disabled={isSimulating}
                        title="Delete Material from Library"
                        className="p-1 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={() => saveMaterial(layer)}
                      disabled={isSimulating}
                      title="Save Material to Library"
                      className="p-1 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors disabled:opacity-50"
                    >
                      <Save className="w-3 h-3" />
                    </button>
                    {index > 1 && index < layers.length - 1 && (
                      <button
                        onClick={() => moveLayer(index, "up")}
                        disabled={isSimulating}
                        title="Move Up"
                        className="p-1 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors disabled:opacity-50"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                    )}
                    {index > 0 && index < layers.length - 2 && (
                      <button
                        onClick={() => moveLayer(index, "down")}
                        disabled={isSimulating}
                        title="Move Down"
                        className="p-1 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors disabled:opacity-50"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    )}
                    {index !== 0 && index !== layers.length - 1 && (
                      <button
                        onClick={() => removeLayer(layer.id)}
                        disabled={isSimulating}
                        title="Remove Layer"
                        className="p-1 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 2xl:grid-cols-6 gap-2 w-full">
                  <div className="col-span-1">
                    <label className="block font-mono text-[9px] uppercase opacity-50 mb-1">
                      Thickness
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        disabled={
                          index === 0 ||
                          index === layers.length - 1 ||
                          isSimulating
                        }
                        value={layer.thickness}
                        onChange={(e) =>
                          updateLayer(layer.id, {
                            thickness: Number(e.target.value),
                          })
                        }
                        className="w-full font-mono text-xs border border-[#141414] p-1 bg-transparent disabled:opacity-30"
                      />
                      <span className="absolute right-1 top-1 font-mono text-[8px] opacity-30">
                        nm
                      </span>
                    </div>
                  </div>
                  <div className="col-span-1">
                    <label className="block font-mono text-[9px] uppercase opacity-50 mb-1">
                      n
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      disabled={isSimulating}
                      value={layer.n}
                      onChange={(e) =>
                        updateLayer(layer.id, { n: Number(e.target.value) })
                      }
                      className="w-full font-mono text-xs border border-[#141414] p-1 bg-transparent disabled:opacity-50"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block font-mono text-[9px] uppercase opacity-50 mb-1">
                      k
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      disabled={isSimulating}
                      value={layer.k}
                      onChange={(e) =>
                        updateLayer(layer.id, { k: Number(e.target.value) })
                      }
                      className="w-full font-mono text-xs border border-[#141414] p-1 bg-transparent disabled:opacity-50"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block font-mono text-[9px] uppercase opacity-50 mb-1">
                      Coherence
                    </label>
                    <button
                      disabled={
                        index === 0 ||
                        index === layers.length - 1 ||
                        isSimulating
                      }
                      onClick={() =>
                        updateLayer(layer.id, { isThick: !layer.isThick })
                      }
                      className={cn(
                        "w-full font-mono text-[9px] border border-[#141414] p-1 uppercase disabled:opacity-30",
                        layer.isThick
                          ? "bg-[#141414] text-white"
                          : "bg-transparent",
                      )}
                    >
                      {layer.isThick ? "Incoherent" : "Coherent"}
                    </button>
                  </div>
                  <div className="col-span-1">
                    <label className="block font-mono text-[9px] uppercase opacity-50 mb-1">
                      BW (nm)
                    </label>
                    <input
                      type="number"
                      step="1"
                      disabled={isSimulating}
                      value={layer.bandwidth || 0}
                      onChange={(e) =>
                        updateLayer(layer.id, {
                          bandwidth: Number(e.target.value),
                        })
                      }
                      className="w-full font-mono text-xs border border-[#141414] p-1 bg-transparent disabled:opacity-50"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block font-mono text-[9px] uppercase opacity-50 mb-1">
                      Coherence
                    </label>
                    <button
                      disabled={
                        index === 0 ||
                        index === layers.length - 1 ||
                        layer.isThick ||
                        isSimulating
                      }
                      onClick={() =>
                        updateLayer(layer.id, {
                          forceIncoherent: !layer.forceIncoherent,
                        })
                      }
                      className={cn(
                        "w-full font-mono text-[9px] border border-[#141414] p-1 uppercase disabled:opacity-30",
                        layer.forceIncoherent
                          ? "bg-amber-100 text-amber-800 border-amber-600"
                          : "bg-transparent",
                      )}
                    >
                      {layer.forceIncoherent ? "Incoh" : "Coh"}
                    </button>
                  </div>
                </div>

                {index > 0 && index < layers.length - 1 && (
                  <div className="mt-3 pt-3 border-t border-[#141414]/10 flex justify-between items-center">
                    <button
                      onClick={() => toggleElectrical(layer.id)}
                      disabled={isSimulating}
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1 border border-[#141414] transition-all disabled:opacity-50",
                        expandedElectrical[layer.id]
                          ? "bg-[#141414] text-[#E4E3E0]"
                          : "hover:bg-gray-50",
                      )}
                    >
                      <Zap className="w-3 h-3" />
                      <span className="font-mono text-[9px] uppercase">
                        Electrical Params
                      </span>
                    </button>

                    <div className="relative">
                      <input
                        type="file"
                        id={`spectral-${layer.id}`}
                        className="hidden"
                        accept=".csv,.txt,.tsv"
                        disabled={isSimulating}
                        onChange={(e) => handleSpectralUpload(layer.id, e)}
                      />
                      <button
                        onClick={() => {
                          if (!layer.spectralData) {
                            const data = [
                              { wavelength: 300, n: layer.n, k: layer.k },
                              { wavelength: 1200, n: layer.n, k: layer.k },
                            ];
                            updateLayer(layer.id, { spectralData: data });
                          }
                          setEditingSpectralLayerId(layer.id);
                        }}
                        disabled={isSimulating}
                        className={cn(
                          "flex items-center gap-1.5 px-2 py-1 border border-[#141414] transition-all disabled:opacity-50",
                          layer.spectralData
                            ? "bg-emerald-50 border-emerald-600 text-emerald-700"
                            : "hover:bg-gray-50",
                        )}
                      >
                        <BarChart3 className="w-3 h-3" />
                        <span className="font-mono text-[9px] uppercase">
                          {layer.spectralData
                            ? `Data (${layer.spectralData.length})`
                            : "Spectral Data"}
                        </span>
                      </button>
                      {layer.spectralData && (
                        <div className="flex gap-1 absolute -right-1 -top-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSpectralLayerId(layer.id);
                            }}
                            disabled={isSimulating}
                            className="w-4 h-4 bg-[#141414] text-white rounded-full flex items-center justify-center text-[8px] hover:bg-gray-800 disabled:opacity-50"
                            title="Edit Data"
                          >
                            <Edit3 className="w-2 h-2" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateLayer(layer.id, {
                                spectralData: undefined,
                              });
                            }}
                            disabled={isSimulating}
                            className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px] hover:bg-red-600 disabled:opacity-50"
                            title="Clear Data"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {expandedElectrical[layer.id] && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-gray-50 border border-[#141414]/10 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="space-y-1">
                      <label className="block font-mono text-[8px] uppercase opacity-50">
                        Bandgap (eV)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        disabled={isSimulating}
                        value={layer.bandgap || 0}
                        onChange={(e) =>
                          updateLayer(layer.id, {
                            bandgap: Number(e.target.value),
                          })
                        }
                        className="w-full font-mono text-[10px] border border-[#141414]/20 p-1 bg-white disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-mono text-[8px] uppercase opacity-50">
                        Affinity (eV)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        disabled={isSimulating}
                        value={layer.affinity || 0}
                        onChange={(e) =>
                          updateLayer(layer.id, {
                            affinity: Number(e.target.value),
                          })
                        }
                        className="w-full font-mono text-[10px] border border-[#141414]/20 p-1 bg-white disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-mono text-[8px] uppercase opacity-50">
                        Doping
                      </label>
                      <div className="flex border border-[#141414]/20">
                        {["n", "i", "p"].map((t) => (
                          <button
                            key={t}
                            disabled={isSimulating}
                            onClick={() =>
                              updateLayer(layer.id, { dopingType: t as any })
                            }
                            className={cn(
                              "flex-1 font-mono text-[8px] uppercase p-1 disabled:opacity-50",
                              (layer.dopingType || "i") === t
                                ? "bg-[#141414] text-white"
                                : "bg-white hover:bg-gray-100",
                            )}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block font-mono text-[8px] uppercase opacity-50">
                        Conc. (cm⁻³)
                      </label>
                      <input
                        type="number"
                        disabled={isSimulating}
                        value={layer.dopingConc || 0}
                        onChange={(e) =>
                          updateLayer(layer.id, {
                            dopingConc: Number(e.target.value),
                          })
                        }
                        className="w-full font-mono text-[10px] border border-[#141414]/20 p-1 bg-white disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-mono text-[8px] uppercase opacity-50">
                        μₙ (cm²/Vs)
                      </label>
                      <input
                        type="number"
                        disabled={isSimulating}
                        value={layer.mobilityN || 0}
                        onChange={(e) =>
                          updateLayer(layer.id, {
                            mobilityN: Number(e.target.value),
                          })
                        }
                        className="w-full font-mono text-[10px] border border-[#141414]/20 p-1 bg-white disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-mono text-[8px] uppercase opacity-50">
                        μₚ (cm²/Vs)
                      </label>
                      <input
                        type="number"
                        disabled={isSimulating}
                        value={layer.mobilityP || 0}
                        onChange={(e) =>
                          updateLayer(layer.id, {
                            mobilityP: Number(e.target.value),
                          })
                        }
                        className="w-full font-mono text-[10px] border border-[#141414]/20 p-1 bg-white disabled:opacity-50"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-[#141414]">
            <div className="flex items-center gap-2 mb-4">
              <Download className="w-5 h-5" />
              <h2 className="font-serif italic text-xl">Saved Designs</h2>
            </div>
            <div className="space-y-2">
              {savedDesigns.length === 0 && (
                <p className="font-mono text-[10px] opacity-30 italic">
                  No saved designs yet.
                </p>
              )}
              {savedDesigns.map((json, i) => {
                const d = JSON.parse(json);
                return (
                  <div key={i} className="flex border border-[#141414]">
                    <button
                      onClick={() => loadDesign(json)}
                      disabled={isSimulating}
                      className="flex-1 text-left font-mono text-[10px] uppercase p-2 hover:bg-[#141414] hover:text-[#E4E3E0] truncate disabled:opacity-50"
                    >
                      {d.name}
                    </button>
                    <button
                      onClick={() => deleteDesign(i)}
                      disabled={isSimulating}
                      className="p-2 border-l border-[#141414] hover:bg-red-50 text-red-600 disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-[#141414]">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5" />
              <h2 className="font-serif italic text-xl">Presets</h2>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(PRESETS).map(([name, presetLayers]) => (
                <button
                  key={name}
                  onClick={() => setLayers(presetLayers)}
                  disabled={isSimulating}
                  className="text-left font-mono text-[10px] uppercase tracking-widest border border-[#141414] p-2 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all disabled:opacity-50"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-[#141414]">
            <div className="flex items-center gap-2 mb-6">
              <Settings2 className="w-5 h-5" />
              <h2 className="font-serif italic text-xl">Parameters</h2>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[9px] uppercase opacity-50 mb-1">
                    Wavelength Min (nm)
                  </label>
                  <input
                    type="number"
                    value={wavelengthRange.min}
                    onChange={(e) =>
                      setWavelengthRange({
                        ...wavelengthRange,
                        min: Number(e.target.value),
                      })
                    }
                    disabled={isSimulating}
                    className="w-full font-mono text-xs border border-[#141414] p-2 bg-transparent disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[9px] uppercase opacity-50 mb-1">
                    Wavelength Max (nm)
                  </label>
                  <input
                    type="number"
                    value={wavelengthRange.max}
                    onChange={(e) =>
                      setWavelengthRange({
                        ...wavelengthRange,
                        max: Number(e.target.value),
                      })
                    }
                    disabled={isSimulating}
                    className="w-full font-mono text-xs border border-[#141414] p-2 bg-transparent disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[9px] uppercase opacity-50 mb-1">
                  Incident Angle (deg)
                </label>
                <input
                  type="range"
                  min="0"
                  max="89"
                  value={angle}
                  onChange={(e) => setAngle(Number(e.target.value))}
                  disabled={isSimulating}
                  className="w-full accent-[#141414] disabled:opacity-50"
                />
                <div className="flex justify-between font-mono text-[10px] mt-1">
                  <span>0°</span>
                  <span>{angle}°</span>
                  <span>89°</span>
                </div>
              </div>

              <div>
                <label className="block font-mono text-[9px] uppercase opacity-50 mb-1">
                  Polarization
                </label>
                <div className="flex border border-[#141414]">
                  <button
                    onClick={() => setPolarization("s")}
                    disabled={isSimulating}
                    className={cn(
                      "flex-1 py-2 font-mono text-xs uppercase tracking-widest transition-all disabled:opacity-50",
                      polarization === "s"
                        ? "bg-[#141414] text-[#E4E3E0]"
                        : "hover:bg-gray-100",
                    )}
                  >
                    S-Pol
                  </button>
                  <button
                    onClick={() => setPolarization("p")}
                    disabled={isSimulating}
                    className={cn(
                      "flex-1 py-2 font-mono text-xs uppercase tracking-widest transition-all disabled:opacity-50",
                      polarization === "p"
                        ? "bg-[#141414] text-[#E4E3E0]"
                        : "hover:bg-gray-100",
                    )}
                  >
                    P-Pol
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content: Charts */}
        <div className="lg:col-span-8 p-4 md:p-6 space-y-4 md:space-y-8 overflow-y-auto w-full">
          {/* R/T/A Chart */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-8">
            <div className="xl:col-span-3 bg-white border border-[#141414] p-4 md:p-6 w-full max-w-full overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  <h2 className="font-serif italic text-xl">
                    Optical Response
                  </h2>
                </div>
                <div className="flex gap-4 font-mono text-[10px] uppercase opacity-50">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-[#141414]"></div> Reflection
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-[#F27D26]"></div> Transmission
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-[#00FF00]"></div> Absorption
                  </div>
                </div>
              </div>

              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={results}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis
                      dataKey="wavelength"
                      label={{
                        value: "Wavelength (nm)",
                        position: "insideBottom",
                        offset: -5,
                        fontSize: 10,
                        fontFamily: "monospace",
                      }}
                      tick={{ fontSize: 10, fontFamily: "monospace" }}
                    />
                    <YAxis
                      domain={[0, 1]}
                      tick={{ fontSize: 10, fontFamily: "monospace" }}
                    />
                    <Tooltip
                      contentStyle={{
                        fontFamily: "monospace",
                        fontSize: "10px",
                        borderRadius: 0,
                        border: "1px solid #141414",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="R"
                      stroke="#141414"
                      strokeWidth={2}
                      dot={false}
                      name="Reflection"
                    />
                    <Line
                      type="monotone"
                      dataKey="T"
                      stroke="#F27D26"
                      strokeWidth={2}
                      dot={false}
                      name="Transmission"
                    />
                    <Line
                      type="monotone"
                      dataKey="A"
                      stroke="#00FF00"
                      strokeWidth={2}
                      dot={false}
                      name="Absorption"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-[#141414] p-6 flex flex-col items-center justify-center text-center">
              <h3 className="font-mono text-[10px] uppercase opacity-50 mb-4 tracking-widest">
                Reflected Color
              </h3>
              <div
                className="w-32 h-32 rounded-full border border-[#141414] shadow-inner mb-4 transition-colors duration-500"
                style={{ backgroundColor: reflectedColor }}
              />
              <p className="font-mono text-[10px] opacity-50 uppercase">
                {reflectedColor}
              </p>
              <p className="font-serif italic text-xs mt-2 opacity-80">
                Predicted appearance under white light
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#141414] p-4 md:p-6 w-full overflow-hidden">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                <h2 className="font-serif italic text-xl">Internal Profile</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex border border-[#141414] mr-4">
                  <button
                    onClick={() => setProfileMode("absorption")}
                    disabled={isSimulating}
                    className={cn(
                      "px-3 py-1 font-mono text-[9px] uppercase tracking-widest transition-all disabled:opacity-50",
                      profileMode === "absorption"
                        ? "bg-[#141414] text-[#E4E3E0]"
                        : "hover:bg-gray-100",
                    )}
                  >
                    Absorption
                  </button>
                  <button
                    onClick={() => setProfileMode("field")}
                    disabled={isSimulating}
                    className={cn(
                      "px-3 py-1 font-mono text-[9px] uppercase tracking-widest transition-all disabled:opacity-50",
                      profileMode === "field"
                        ? "bg-[#141414] text-[#E4E3E0]"
                        : "hover:bg-gray-100",
                    )}
                  >
                    |E|² Field
                  </button>
                </div>
                <label className="font-mono text-[9px] uppercase opacity-50">
                  At Wavelength(s):
                </label>
                <input
                  type="text"
                  value={profileWavelengths}
                  onChange={(e) => setProfileWavelengths(e.target.value)}
                  placeholder="e.g. 550 or 400,500"
                  disabled={isSimulating}
                  className="w-32 font-mono text-xs border border-[#141414] p-1 disabled:opacity-50"
                  title="Comma-separated wavelengths in nm"
                />
                <button
                  onClick={runSimulation}
                  disabled={isSimulating}
                  className="p-1 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] disabled:opacity-50"
                >
                  <Play className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={profile}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorAbs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00FF00" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#00FF00" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis
                    dataKey="z"
                    label={{
                      value: "Depth (nm)",
                      position: "insideBottom",
                      offset: -5,
                      fontSize: 10,
                      fontFamily: "monospace",
                    }}
                    tick={{ fontSize: 10, fontFamily: "monospace" }}
                  />
                  <YAxis tick={{ fontSize: 10, fontFamily: "monospace" }} />
                  <Tooltip
                    contentStyle={{
                      fontFamily: "monospace",
                      fontSize: "10px",
                      borderRadius: 0,
                      border: "1px solid #141414",
                    }}
                    formatter={(value: number) => [
                      value.toFixed(4),
                      profileMode === "absorption" ? "Abs. Rate" : "|E|²",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey={
                      profileMode === "absorption"
                        ? "absorption"
                        : "fieldIntensity"
                    }
                    stroke="#00FF00"
                    fillOpacity={1}
                    fill="url(#colorAbs)"
                    name={
                      profileMode === "absorption"
                        ? "Absorption Rate"
                        : "Electric Field Intensity"
                    }
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="font-mono text-[10px] opacity-50 mt-4 italic">
              * The absorption profile shows where light is being absorbed
              within the structure at {selectedWavelength}nm.
            </p>
          </div>

          {/* Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-[#141414] p-6 bg-[#D4D3D0]">
              <h3 className="font-serif italic text-lg mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" /> Theory
              </h3>
              <p className="text-sm leading-relaxed opacity-80">
                This simulator uses the{" "}
                <strong>Transfer Matrix Method (TMM)</strong> to solve Maxwell's
                equations in planar multilayer structures. It accounts for
                multiple internal reflections and interference effects, which
                are critical for thin films where layer thickness is comparable
                to the wavelength of light.
              </p>
            </div>
            <div className="border border-[#141414] p-6 bg-[#D4D3D0]">
              <h3 className="font-serif italic text-lg mb-2 flex items-center gap-2">
                <Download className="w-4 h-4" /> Export
              </h3>
              <p className="text-sm leading-relaxed opacity-80 mb-4">
                Download the simulation results as a CSV file for further
                analysis in external tools.
              </p>
              <button
                onClick={() => {
                  const csvContent =
                    "data:text/csv;charset=utf-8," +
                    "Wavelength,Reflection,Transmission,Absorption\n" +
                    results
                      .map((r) => `${r.wavelength},${r.R},${r.T},${r.A}`)
                      .join("\n");
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", "simulation_results.csv");
                  document.body.appendChild(link);
                  link.click();
                }}
                disabled={isSimulating}
                className="w-full border border-[#141414] py-2 font-mono text-xs uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] transition-all disabled:opacity-50"
              >
                Download CSV
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#141414] p-4 text-center">
        <p className="font-mono text-[10px] opacity-30 uppercase tracking-[0.2em]">
          Built with Precision / Marzia v1.0.0
        </p>
      </footer>

      {/* Spectral Data Editor Modal */}
      {editingSpectralLayerId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#E4E3E0] border-2 border-[#141414] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-[#141414] flex justify-between items-center bg-[#141414] text-[#E4E3E0]">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                <h2 className="font-serif italic text-xl">
                  Spectral Data:{" "}
                  {layers.find((l) => l.id === editingSpectralLayerId)?.name}
                </h2>
              </div>
              <button
                onClick={() => setEditingSpectralLayerId(null)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Left: Table Editor */}
              <div className="w-full md:w-1/2 border-r border-[#141414] flex flex-col">
                <div className="p-4 border-b border-[#141414] flex justify-between items-center bg-white/50">
                  <span className="font-mono text-[10px] uppercase opacity-50">
                    Data Points
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      id={`spectral-upload-modal`}
                      className="hidden"
                      accept=".csv,.txt,.tsv"
                      onChange={(e) => {
                        if (editingSpectralLayerId) {
                          handleSpectralUpload(editingSpectralLayerId, e);
                        }
                      }}
                    />
                    <button
                      onClick={() =>
                        document
                          .getElementById(`spectral-upload-modal`)
                          ?.click()
                      }
                      className="flex items-center gap-1 px-2 py-1 border border-[#141414] font-mono text-[9px] uppercase hover:bg-gray-50"
                    >
                      Upload CSV
                    </button>
                    <button
                      onClick={() => addSpectralPoint(editingSpectralLayerId)}
                      className="flex items-center gap-1 px-2 py-1 bg-[#141414] text-white font-mono text-[9px] uppercase hover:bg-gray-800"
                    >
                      <Plus className="w-3 h-3" /> Add Point
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <table className="w-full font-mono text-[10px]">
                    <thead className="sticky top-0 bg-[#E4E3E0] z-10">
                      <tr className="border-b border-[#141414]">
                        <th className="text-left p-2 uppercase opacity-50">
                          λ (nm)
                        </th>
                        <th className="text-left p-2 uppercase opacity-50">
                          n
                        </th>
                        <th className="text-left p-2 uppercase opacity-50">
                          k
                        </th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {layers
                        .find((l) => l.id === editingSpectralLayerId)
                        ?.spectralData?.map((point, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-[#141414]/10 hover:bg-white/30"
                          >
                            <td className="p-1">
                              <input
                                type="number"
                                value={point.wavelength}
                                onChange={(e) =>
                                  updateSpectralPoint(
                                    editingSpectralLayerId,
                                    idx,
                                    { wavelength: Number(e.target.value) },
                                  )
                                }
                                className="w-full bg-transparent p-1 focus:bg-white outline-none"
                              />
                            </td>
                            <td className="p-1">
                              <input
                                type="number"
                                step="0.01"
                                value={point.n}
                                onChange={(e) =>
                                  updateSpectralPoint(
                                    editingSpectralLayerId,
                                    idx,
                                    { n: Number(e.target.value) },
                                  )
                                }
                                className="w-full bg-transparent p-1 focus:bg-white outline-none"
                              />
                            </td>
                            <td className="p-1">
                              <input
                                type="number"
                                step="0.001"
                                value={point.k}
                                onChange={(e) =>
                                  updateSpectralPoint(
                                    editingSpectralLayerId,
                                    idx,
                                    { k: Number(e.target.value) },
                                  )
                                }
                                className="w-full bg-transparent p-1 focus:bg-white outline-none"
                              />
                            </td>
                            <td className="p-1">
                              <button
                                onClick={() =>
                                  removeSpectralPoint(
                                    editingSpectralLayerId,
                                    idx,
                                  )
                                }
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right: Visualization */}
              <div className="w-full md:w-1/2 flex flex-col bg-white">
                <div className="p-4 border-b border-[#141414] bg-gray-50">
                  <span className="font-mono text-[10px] uppercase opacity-50">
                    Visualization (n & k)
                  </span>
                </div>
                <div className="flex-1 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={
                        layers.find((l) => l.id === editingSpectralLayerId)
                          ?.spectralData || []
                      }
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#eee"
                      />
                      <XAxis
                        dataKey="wavelength"
                        type="number"
                        domain={["auto", "auto"]}
                        label={{
                          value: "Wavelength (nm)",
                          position: "insideBottom",
                          offset: -5,
                          fontSize: 10,
                          fontFamily: "monospace",
                        }}
                        tick={{ fontSize: 10, fontFamily: "monospace" }}
                      />
                      <YAxis
                        yId="left"
                        label={{
                          value: "n",
                          angle: -90,
                          position: "insideLeft",
                          fontSize: 10,
                          fontFamily: "monospace",
                        }}
                        tick={{ fontSize: 10, fontFamily: "monospace" }}
                      />
                      <YAxis
                        yId="right"
                        orientation="right"
                        label={{
                          value: "k",
                          angle: 90,
                          position: "insideRight",
                          fontSize: 10,
                          fontFamily: "monospace",
                        }}
                        tick={{ fontSize: 10, fontFamily: "monospace" }}
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: "10px",
                          fontFamily: "monospace",
                          border: "1px solid #141414",
                        }}
                      />
                      <Legend
                        wrapperStyle={{
                          fontSize: "10px",
                          fontFamily: "monospace",
                        }}
                      />
                      <Line
                        yId="left"
                        type="monotone"
                        dataKey="n"
                        stroke="#141414"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#141414" }}
                        activeDot={{ r: 5 }}
                        name="Refractive Index (n)"
                      />
                      <Line
                        yId="right"
                        type="monotone"
                        dataKey="k"
                        stroke="#F27D26"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#F27D26" }}
                        activeDot={{ r: 5 }}
                        name="Extinction Coefficient (k)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#141414] flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => setEditingSpectralLayerId(null)}
                className="px-6 py-2 border border-[#141414] font-mono text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
              >
                Close
              </button>
              <button
                onClick={() => {
                  runSimulation();
                  setEditingSpectralLayerId(null);
                }}
                className="px-6 py-2 bg-[#141414] text-[#E4E3E0] font-mono text-xs uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save & Run
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
