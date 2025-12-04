import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DropZone } from './components/DropZone';
import { LoadingView } from './components/LoadingView';
import { generateFigureImage } from './services/geminiService';
import { GenerationStatus, GeneratedResult, FigureConfig } from './types';

const PRESET_ITEMS = ["Banana", "Katana", "Bubble Tea", "Game Controller", "Lightsaber", "Coffee Mug", "Magic Wand", "Guitar"];

const STYLES = [
  { id: 'realistic', label: 'Realistic' },
  { id: 'chibi', label: 'Chibi / Nendoroid' },
  { id: 'cyberpunk', label: 'Cyberpunk' },
  { id: 'voxel', label: 'Voxel / Lego' },
  { id: 'clay', label: 'Claymation' },
  { id: 'anime', label: 'Anime Figure' },
  { id: 'low-poly', label: 'Low Poly Retro' },
  { id: 'plushie', label: 'Soft Plushie' },
  { id: 'steampunk', label: 'Steampunk' },
  { id: 'neon-noir', label: 'Neon Noir' },
  { id: 'vintage', label: 'Vintage Toy' },
  { id: 'funko', label: 'Pop Vinyl Style' },
];

const POSES = [
  { id: 'standing heroic', label: 'Heroic Stand' },
  { id: 'action jump', label: 'Action Jump' },
  { id: 'sitting relaxed', label: 'Sitting' },
  { id: 'victory peace', label: 'Peace Sign' },
  { id: 'crossed arms', label: 'Crossed Arms' },
  { id: 'kneeling battle', label: 'Battle Kneel' },
  { id: 'floating magic', label: 'Floating' },
  { id: 'running dynamic', label: 'Running' },
];

const MATERIALS = [
  { id: 'pvc plastic', label: 'PVC Plastic' },
  { id: 'resin hand-painted', label: 'Hand-painted Resin' },
  { id: 'die-cast metal', label: 'Die-cast Metal' },
  { id: 'gold', label: 'Solid Gold' },
  { id: 'transparent crystal', label: 'Crystal / Ice' },
  { id: 'wood', label: 'Carved Wood' },
  { id: 'yarn', label: 'Knitted Yarn' },
  { id: 'glowing energy', label: 'Glowing Energy' },
];

const ENVIRONMENTS = [
  { id: 'computer desk', label: 'Computer Desk' },
  { id: 'collectors shelf', label: 'Collector Shelf' },
  { id: 'sci-fi lab', label: 'Sci-Fi Laboratory' },
  { id: 'enchanted forest', label: 'Enchanted Forest' },
  { id: 'museum pedestal', label: 'Museum Display' },
  { id: 'cyberpunk street', label: 'Cyberpunk Street' },
  { id: 'white studio', label: 'Minimalist Studio' },
  { id: 'underwater', label: 'Underwater' },
];

const LIGHTING = [
  { id: 'studio soft', label: 'Studio Soft' },
  { id: 'cinematic dramatic', label: 'Cinematic' },
  { id: 'neon cyberpunk', label: 'Neon Blue/Pink' },
  { id: 'golden hour', label: 'Golden Hour' },
  { id: 'spooky dark', label: 'Spooky / Dark' },
  { id: 'bioluminescent', label: 'Bioluminescent' },
];

const App: React.FC = () => {
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Configuration State
  const [config, setConfig] = useState<FigureConfig>({
    heldItem: 'banana',
    style: 'realistic',
    boxLabel: 'PCM 電腦廣場',
    pose: 'standing heroic',
    material: 'pvc plastic',
    environment: 'computer desk',
    lighting: 'studio soft'
  });

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const triggerGeneration = async (base64: string, mimeType: string, currentConfig: FigureConfig) => {
    setStatus(GenerationStatus.PROCESSING);
    setError(null);
    setResult(null);

    try {
      const generatedData = await generateFigureImage(base64, mimeType, currentConfig);
      setResult(generatedData);
      setStatus(GenerationStatus.COMPLETED);
    } catch (err) {
      setStatus(GenerationStatus.ERROR);
      setError("Failed to generate figure. Please try again.");
    }
  };

  const handleFileSelect = useCallback(async (file: File) => {
    setImageMimeType(file.type);
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setOriginalImage(base64String);
      // Trigger generation with current config
      triggerGeneration(base64String, file.type, config);
    };
    reader.readAsDataURL(file);
  }, [config]);

  const handleRegenerate = () => {
    if (originalImage && imageMimeType) {
      triggerGeneration(originalImage, imageMimeType, config);
    }
  };

  const handleReset = () => {
    stopCamera();
    setStatus(GenerationStatus.IDLE);
    setOriginalImage(null);
    setResult(null);
    setError(null);
  };

  const handleRandomize = () => {
    const randomItem = PRESET_ITEMS[Math.floor(Math.random() * PRESET_ITEMS.length)];
    const randomStyle = STYLES[Math.floor(Math.random() * STYLES.length)].id;
    const randomPose = POSES[Math.floor(Math.random() * POSES.length)].id;
    const randomMaterial = MATERIALS[Math.floor(Math.random() * MATERIALS.length)].id;
    const randomEnv = ENVIRONMENTS[Math.floor(Math.random() * ENVIRONMENTS.length)].id;
    const randomLight = LIGHTING[Math.floor(Math.random() * LIGHTING.length)].id;

    setConfig(prev => ({
      ...prev,
      heldItem: randomItem.toLowerCase(),
      style: randomStyle,
      pose: randomPose,
      material: randomMaterial,
      environment: randomEnv,
      lighting: randomLight
    }));
  };

  // Camera Functions
  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera", err);
      setError("Could not access camera. Please check permissions.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        // Draw video frame to canvas
        // Optional: flip horizontally if using front camera for mirror effect, 
        // but typically generating a figure works better with raw image.
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const base64 = canvas.toDataURL('image/jpeg', 0.9);
        
        stopCamera();
        setOriginalImage(base64);
        setImageMimeType('image/jpeg');
        triggerGeneration(base64, 'image/jpeg', config);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={handleReset}>
            <span className="text-2xl">🍌</span>
            <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-200 to-yellow-500 bg-clip-text text-transparent">
              Banana Figure Maker
            </h1>
          </div>
          <div className="text-xs font-medium px-2 py-1 rounded bg-gray-800 border border-gray-700 text-gray-400">
            Powered by Gemini 2.5 Flash
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar / Configuration Controls */}
        <div className="w-full lg:w-1/3 space-y-4">
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 h-fit overflow-y-auto max-h-[calc(100vh-8rem)] custom-scrollbar">
            
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-gray-800/95 backdrop-blur-md z-10 py-2 -mx-2 px-2 border-b border-gray-700/50">
              <h2 className="text-lg font-bold text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                Settings
              </h2>
              <button 
                onClick={handleRandomize}
                className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded-full transition flex items-center gap-1 shadow-lg shadow-purple-900/20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Surprise Me
              </button>
            </div>

            {/* Held Item */}
            <div className="space-y-3 mb-6">
              <label className="text-xs uppercase font-bold text-gray-500 tracking-wider">Held Item</label>
              <input 
                type="text" 
                value={config.heldItem}
                onChange={(e) => setConfig({...config, heldItem: e.target.value})}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all text-sm"
                placeholder="e.g. A golden chalice"
              />
              <div className="flex flex-wrap gap-2">
                {PRESET_ITEMS.map(item => (
                  <button
                    key={item}
                    onClick={() => setConfig({...config, heldItem: item.toLowerCase()})}
                    className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                      config.heldItem.toLowerCase() === item.toLowerCase() 
                      ? 'bg-yellow-400/20 border-yellow-400 text-yellow-400' 
                      : 'bg-gray-900 border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Box Label */}
            <div className="space-y-3 mb-6">
              <label className="text-xs uppercase font-bold text-gray-500 tracking-wider">Box Brand / Logo</label>
              <input 
                type="text" 
                value={config.boxLabel}
                onChange={(e) => setConfig({...config, boxLabel: e.target.value})}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all text-sm"
                placeholder="e.g. My Collection"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               {/* Style */}
               <div className="space-y-2 col-span-2">
                <label className="text-xs uppercase font-bold text-gray-500 tracking-wider">Art Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {STYLES.map(style => (
                    <button
                    key={style.id}
                    onClick={() => setConfig({...config, style: style.id})}
                    className={`text-xs px-2 py-2 rounded-lg border transition-all text-left truncate ${
                      config.style === style.id 
                      ? 'bg-yellow-400/20 border-yellow-400 text-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.15)]' 
                      : 'bg-gray-900 border-gray-600 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {style.label}
                  </button>
                  ))}
                </div>
              </div>

               {/* Pose */}
               <div className="space-y-2 col-span-2">
                <label className="text-xs uppercase font-bold text-gray-500 tracking-wider">Pose</label>
                <select 
                  value={config.pose}
                  onChange={(e) => setConfig({...config, pose: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                >
                  {POSES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>

              {/* Material */}
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-gray-500 tracking-wider">Material</label>
                <select 
                  value={config.material}
                  onChange={(e) => setConfig({...config, material: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                >
                  {MATERIALS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </div>

              {/* Lighting */}
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-gray-500 tracking-wider">Lighting</label>
                <select 
                  value={config.lighting}
                  onChange={(e) => setConfig({...config, lighting: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                >
                  {LIGHTING.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>
              </div>
            </div>

            {/* Environment */}
            <div className="space-y-2 mb-6 mt-4">
              <label className="text-xs uppercase font-bold text-gray-500 tracking-wider">Environment</label>
              <div className="grid grid-cols-2 gap-2">
                {ENVIRONMENTS.map(env => (
                   <button
                   key={env.id}
                   onClick={() => setConfig({...config, environment: env.id})}
                   className={`text-xs px-2 py-2 rounded-lg border transition-all text-left truncate ${
                     config.environment === env.id 
                     ? 'bg-blue-500/20 border-blue-400 text-blue-300' 
                     : 'bg-gray-900 border-gray-600 text-gray-400 hover:border-gray-500'
                   }`}
                 >
                   {env.label}
                 </button>
                ))}
              </div>
            </div>

            {/* Action Buttons for non-idle states */}
            {status !== GenerationStatus.IDLE && status !== GenerationStatus.PROCESSING && (
              <button
                onClick={handleRegenerate}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-4 rounded-xl shadow-lg transform transition active:scale-[0.98] flex items-center justify-center space-x-2 sticky bottom-0 z-20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Update Figure</span>
              </button>
            )}
          </div>
          
           {/* Intro text when idle */}
           {status === GenerationStatus.IDLE && (
            <div className="p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
              <p className="text-sm text-gray-400">
                <span className="text-yellow-400 font-bold">Tip:</span> Adjust the settings above or click "Surprise Me" before dropping your image.
              </p>
            </div>
           )}
        </div>

        {/* Right Side: DropZone & Results */}
        <div className="w-full lg:w-2/3 flex flex-col h-full min-h-[500px]">
          
          {/* IDLE STATE */}
          {status === GenerationStatus.IDLE && (
             <div className="flex flex-col h-full">
               <div className="text-center space-y-4 mb-8">
                <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                  Turn anything into a <br />
                  <span className="text-yellow-400">Collectible Figure</span>
                </h2>
                <p className="text-lg text-gray-400">
                  Drag & Drop an image below or use your camera to start the magic.
                </p>
              </div>
               
               <div className="flex-grow flex flex-col gap-4">
                 {isCameraOpen ? (
                   <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-700 aspect-video flex flex-col items-center justify-center group">
                     <video 
                       ref={videoRef} 
                       autoPlay 
                       playsInline 
                       muted // Mute locally to avoid feedback, though we are capturing video only.
                       className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                     />
                     <canvas ref={canvasRef} className="hidden" />
                     
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-100 flex items-end justify-center pb-6 gap-6">
                       <button 
                         onClick={stopCamera} 
                         className="bg-gray-700/80 hover:bg-gray-600 text-white px-6 py-3 rounded-full font-medium backdrop-blur-sm transition"
                       >
                         Cancel
                       </button>
                       <button 
                         onClick={capturePhoto} 
                         className="bg-red-600 hover:bg-red-500 text-white p-4 rounded-full shadow-lg border-4 border-white/20 transform transition active:scale-95"
                         aria-label="Capture Photo"
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                         </svg>
                       </button>
                     </div>
                   </div>
                 ) : (
                   <>
                    <DropZone onFileSelect={handleFileSelect} />
                    <div className="flex items-center justify-center gap-4 text-gray-500 text-sm py-2">
                      <div className="h-px w-24 bg-gray-700"></div>
                      <span>OR</span>
                      <div className="h-px w-24 bg-gray-700"></div>
                    </div>
                    <button 
                      onClick={startCamera}
                      className="bg-gray-800 hover:bg-gray-700 hover:text-yellow-400 text-white font-medium py-4 px-6 rounded-2xl border-2 border-dashed border-gray-600 hover:border-yellow-400 transition-all flex items-center justify-center gap-3 group"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Take a Photo
                    </button>
                   </>
                 )}
               </div>
             </div>
          )}

          {/* ACTIVE STATES */}
          {(status === GenerationStatus.PROCESSING || status === GenerationStatus.COMPLETED || status === GenerationStatus.ERROR) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              
              {/* Original Image */}
              <div className="flex flex-col space-y-3">
                <h3 className="text-sm uppercase font-bold text-gray-500 tracking-wider">Original</h3>
                <div className="relative rounded-2xl overflow-hidden border border-gray-700 bg-gray-800 shadow-xl aspect-square group">
                  {originalImage && (
                    <img 
                      src={originalImage} 
                      alt="Original" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  {status !== GenerationStatus.PROCESSING && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <button 
                        onClick={handleReset}
                        className="bg-white/10 hover:bg-white/20 backdrop-blur text-white px-4 py-2 rounded-lg text-sm font-medium border border-white/30"
                      >
                        Upload New Image
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Generated Result */}
              <div className="flex flex-col space-y-3">
                <h3 className="text-sm uppercase font-bold text-yellow-500 tracking-wider flex items-center gap-2">
                  Generated {config.style} Figure
                  {status === GenerationStatus.PROCESSING && <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-ping"></span>}
                </h3>

                <div className="relative rounded-2xl overflow-hidden border border-yellow-500/20 bg-gray-800 shadow-[0_0_30px_rgba(0,0,0,0.3)] aspect-square">
                  
                  {status === GenerationStatus.PROCESSING && <LoadingView />}

                  {status === GenerationStatus.ERROR && (
                    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-red-200 font-medium mb-4">{error}</p>
                      <button 
                        onClick={handleRegenerate}
                        className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition shadow-lg"
                      >
                        Try Again
                      </button>
                    </div>
                  )}

                  {status === GenerationStatus.COMPLETED && result?.imageUrl && (
                    <div className="w-full h-full group relative">
                      <img 
                        src={result.imageUrl} 
                        alt="Generated Figure" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-6">
                        <a 
                          href={result.imageUrl} 
                          download={`figure-${config.style}-${config.heldItem}.png`}
                          className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-4 rounded-xl text-center shadow-lg transform transition hover:scale-[1.02]"
                        >
                          Download Image
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 mt-auto bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
           Generates realistic figures with "{config.boxLabel}" branding.
        </div>
      </footer>
    </div>
  );
};

export default App;