import React, { useState, useEffect } from 'react';
import { AppMode, PlantInfo, DiagnosisResult, SavedPlant, ChatMessage, SearchResult } from './types';
import { identifyPlant, diagnosePlant, chatWithBotanist, searchProducts } from './services/geminiService';
import { initDB, getPlants, savePlant, deletePlant } from './services/dbService';
import Navigation from './components/Navigation';
import ImageUploader from './components/ImageUploader';
import PlantCard from './components/PlantCard';
import DiagnosisCard from './components/DiagnosisCard';
import { Sprout, Send, Bot, User, ArrowRight, Wind, Plus, Trash2, ExternalLink, MessageCircle, LayoutGrid, Leaf, Search, MapPin, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.HOME);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Identify State
  const [identifiedPlant, setIdentifiedPlant] = useState<PlantInfo | null>(null);
  const [identifyImage, setIdentifyImage] = useState<string | null>(null);

  // Diagnose State
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [diagnoseImage, setDiagnoseImage] = useState<string | null>(null);
  const [productsResult, setProductsResult] = useState<SearchResult | null>(null);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [zipCode, setZipCode] = useState('');
  const [zipCodeError, setZipCodeError] = useState('');

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hello! I am Greenthumb, your AI gardening assistant. Ask me anything about your plants!', timestamp: Date.now() }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Garden State
  const [myGarden, setMyGarden] = useState<SavedPlant[]>([]);
  const [gardenSearch, setGardenSearch] = useState('');
  const [isGardenLoading, setIsGardenLoading] = useState(true);

  // Initialize DB and load garden on mount
  useEffect(() => {
    const loadGarden = async () => {
      try {
        await initDB();
        const plants = await getPlants();
        // Sort by date added, newest first
        setMyGarden(plants.sort((a, b) => b.dateAdded - a.dateAdded));
      } catch (err) {
        console.error("Failed to load garden from database:", err);
      } finally {
        setIsGardenLoading(false);
      }
    };
    loadGarden();
  }, []);

  const saveToGarden = async (plant: PlantInfo) => {
    if (!identifyImage) return;
    
    const newPlant: SavedPlant = {
      ...plant,
      id: Date.now().toString(),
      imageUrl: `data:image/jpeg;base64,${identifyImage}`,
      dateAdded: Date.now()
    };

    try {
      await savePlant(newPlant);
      setMyGarden(prev => [newPlant, ...prev]);
    } catch (err) {
      console.error("Failed to save plant to database:", err);
      alert("Failed to save plant. Please try again.");
    }
  };

  const removeFromGarden = async (id: string) => {
    try {
      await deletePlant(id);
      setMyGarden(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error("Failed to delete plant from database:", err);
      alert("Failed to remove plant. Please try again.");
    }
  };

  const handleIdentify = async (base64: string) => {
    setIsLoading(true);
    setError(null);
    setIdentifyImage(base64);
    setIdentifiedPlant(null); // Clear previous
    try {
      const result = await identifyPlant(base64);
      setIdentifiedPlant(result);
    } catch (err) {
      setError("Could not identify the plant. Please try a clearer image.");
    } finally {
      setIsLoading(false);
    }
  };

  const validateZipCode = (zip: string) => {
    // Allows 5 digits, optional 4 digit extension
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(zip);
  };

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setZipCode(val);
    if (val && !validateZipCode(val)) {
       // Optional: live validation feedback, or just clear error if they are typing
       // keeping it simple: clear error on type
    }
    setZipCodeError('');
  };

  const handleDiagnose = async (base64: string) => {
    // Validate Zip Code if present
    if (zipCode.trim() && !validateZipCode(zipCode.trim())) {
      setZipCodeError("Please enter a valid 5-digit Zip Code (e.g. 94043)");
      return;
    }
    setZipCodeError('');

    setIsLoading(true);
    setError(null);
    setDiagnoseImage(base64);
    setDiagnosisResult(null); // Clear previous
    setProductsResult(null); // Clear previous products
    try {
      const result = await diagnosePlant(base64, zipCode);
      setDiagnosisResult(result);
    } catch (err) {
      setError("Could not diagnose the plant. Please try a clearer image.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchProducts = async (diagnosis: string) => {
    setIsSearchingProducts(true);
    try {
      const result = await searchProducts(diagnosis);
      setProductsResult(result);
    } catch (err) {
      console.error("Failed to fetch products", err);
      // Optional: set specific error state for products
    } finally {
      setIsSearchingProducts(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg: ChatMessage = { role: 'user', text: chatInput, timestamp: Date.now() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsLoading(true);

    try {
      // Format history for API
      const history = chatMessages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));
      
      const response = await chatWithBotanist(userMsg.text, history);
      
      if (response && response.text) {
        setChatMessages(prev => [...prev, { 
          role: 'model', 
          text: response.text, 
          timestamp: Date.now(),
          groundingMetadata: response.groundingMetadata
        }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting to my botanical database right now. Try again later.", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Simple parser to convert markdown images ![alt](url) to HTML img tags
  // and handle basic formatting
  const renderMessageText = (text: string) => {
    const parts = text.split(/(!\[.*?\]\(.*?\))/g);
    return parts.map((part, index) => {
      const imgMatch = part.match(/!\[(.*?)\]\((.*?)\)/);
      if (imgMatch) {
        return (
          <div key={index} className="my-2 rounded-xl overflow-hidden shadow-sm border border-slate-200">
            <img 
              src={imgMatch[2]} 
              alt={imgMatch[1]} 
              className="w-full max-h-64 object-cover" 
              onError={(e) => {
                 // Fallback if image load fails
                 (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            {imgMatch[1] && <p className="text-xs p-1 bg-slate-50 text-slate-500 text-center">{imgMatch[1]}</p>}
          </div>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const renderContent = () => {
    switch (mode) {
      case AppMode.HOME:
        return (
          <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 pb-24 animate-fade-in-up">
            {/* Hero Section */}
            <div className="relative w-full h-72 md:h-96 rounded-3xl overflow-hidden mb-8 shadow-2xl group">
              <img 
                src="https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?q=80&w=1200&auto=format&fit=crop" 
                alt="Lush Garden" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6 md:p-12 max-w-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-emerald-500/20 backdrop-blur-md rounded-lg border border-emerald-500/30">
                    <Sprout className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-emerald-400 font-semibold tracking-wide uppercase text-xs md:text-sm">Powered by Gemini AI</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight shadow-sm">
                  Greenthumb<span className="text-emerald-400">AI</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-200 leading-relaxed font-light shadow-sm max-w-lg">
                  Your intelligent companion for a thriving garden. Identify plants, diagnose diseases, and get expert care tips instantly.
                </p>
              </div>
            </div>

            {/* Main Action Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Identify Card */}
              <button 
                onClick={() => setMode(AppMode.IDENTIFY)}
                className="relative h-64 rounded-3xl overflow-hidden group shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent z-10"></div>
                <img 
                  src="https://images.unsplash.com/photo-1530968464165-7a1861cbaf9f?q=80&w=800&auto=format&fit=crop" 
                  alt="Identify Plant" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl w-fit mb-4 border border-white/10">
                        <Wind className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-1">Identify</h3>
                      <p className="text-slate-300 text-sm font-medium">Discover plant names & care guides</p>
                    </div>
                    <div className="bg-white rounded-full p-3 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                      <ArrowRight className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                </div>
              </button>

              {/* Diagnose Card */}
              <button 
                onClick={() => setMode(AppMode.DIAGNOSE)}
                className="relative h-64 rounded-3xl overflow-hidden group shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent z-10"></div>
                <img 
                  src="https://images.unsplash.com/photo-1463320898484-cdee8141c787?q=80&w=800&auto=format&fit=crop" 
                  alt="Diagnose Plant" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl w-fit mb-4 border border-white/10">
                        <Plus className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-1">Heal</h3>
                      <p className="text-slate-300 text-sm font-medium">Diagnose issues & find treatments</p>
                    </div>
                    <div className="bg-white rounded-full p-3 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                      <ArrowRight className="w-6 h-6 text-rose-500" />
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Secondary Actions */}
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              <button 
                onClick={() => setMode(AppMode.CHAT)}
                className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all text-left flex flex-col md:flex-row md:items-center gap-3 md:gap-4 group"
              >
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform w-fit">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Ask Expert</h4>
                  <p className="text-xs text-slate-500 mt-1">Chat with AI Botanist</p>
                </div>
              </button>

              <button 
                onClick={() => setMode(AppMode.GARDEN)}
                className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all text-left flex flex-col md:flex-row md:items-center gap-3 md:gap-4 group"
              >
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform w-fit">
                  <Leaf className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">My Garden</h4>
                  <p className="text-xs text-slate-500 mt-1">View saved plants</p>
                </div>
              </button>
            </div>
          </div>
        );

      case AppMode.IDENTIFY:
        return (
          <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Plant Identifier</h2>
            <p className="text-slate-500 mb-8">Snap a photo to uncover nature's mysteries.</p>
            
            <ImageUploader 
              onImageSelected={handleIdentify} 
              isLoading={isLoading} 
              label="Upload Plant Photo"
            />
            
            {error && (
              <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center justify-center">
                {error}
              </div>
            )}

            {identifiedPlant && (
              <div className="mt-8">
                 <PlantCard 
                    plant={identifiedPlant} 
                    image={identifyImage ? `data:image/jpeg;base64,${identifyImage}` : undefined}
                    onSave={saveToGarden}
                    isSaved={myGarden.some(p => p.name === identifiedPlant.name && p.scientificName === identifiedPlant.scientificName)} 
                 />
              </div>
            )}
          </div>
        );

      case AppMode.DIAGNOSE:
        return (
          <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Plant Doctor</h2>
            <p className="text-slate-500 mb-6">Get a custom diagnosis based on your location and plant symptoms.</p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Location (Optional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={zipCode}
                  onChange={handleZipCodeChange}
                  placeholder="Enter Zip Code (e.g. 90210)"
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-sm transition-colors ${
                    zipCodeError ? 'border-red-300 focus:ring-red-200 focus:border-red-500' : 'border-slate-200'
                  }`}
                />
              </div>
              {zipCodeError ? (
                <div className="mt-2 flex items-center gap-1 text-xs text-red-600 animate-fade-in-up">
                  <AlertCircle className="w-3 h-3" />
                  {zipCodeError}
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-500">Helps identify regional pests and climate-related issues.</p>
              )}
            </div>

            <ImageUploader 
              onImageSelected={handleDiagnose} 
              isLoading={isLoading}
              label="Upload Photo of Symptoms"
            />

            {error && (
              <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center justify-center">
                {error}
              </div>
            )}

            {diagnosisResult && (
              <div className="mt-8">
                <DiagnosisCard 
                  result={diagnosisResult}
                  image={diagnoseImage ? `data:image/jpeg;base64,${diagnoseImage}` : undefined}
                  onSearchProducts={handleSearchProducts}
                  productsResult={productsResult}
                  isSearchingProducts={isSearchingProducts}
                />
              </div>
            )}
          </div>
        );

      case AppMode.CHAT:
        return (
          <div className="max-w-2xl mx-auto h-[calc(100vh-5rem)] md:h-screen flex flex-col bg-white md:border-x border-slate-100">
            <div className="p-4 border-b border-slate-100 bg-white/95 backdrop-blur z-10 sticky top-0">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                   <Bot className="w-5 h-5 text-emerald-600" />
                </div>
                Botanist Chat
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-emerald-600 text-white rounded-tr-sm' 
                      : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                  }`}>
                    <div className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                      {renderMessageText(msg.text)}
                    </div>
                  </div>
                  
                  {/* Grounding/Search Sources */}
                  {msg.groundingMetadata && msg.groundingMetadata.groundingChunks && (
                    <div className="mt-2 max-w-[85%] flex flex-wrap gap-2">
                       {msg.groundingMetadata.groundingChunks.slice(0, 3).map((chunk: any, i: number) => {
                         if (!chunk.web) return null;
                         return (
                           <a 
                            key={i}
                            href={chunk.web.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-full text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition-colors"
                           >
                             <ExternalLink className="w-3 h-3" />
                             {chunk.web.title}
                           </a>
                         );
                       })}
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                   <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-sm flex gap-2 items-center">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                   </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-white pb-20 md:pb-4">
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about watering, soil, pests..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-slate-900 placeholder-slate-400 px-2"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isLoading || !chatInput.trim()}
                  className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        );

      case AppMode.GARDEN:
        const filteredGarden = myGarden.filter(plant => 
          plant.name.toLowerCase().includes(gardenSearch.toLowerCase()) || 
          plant.scientificName.toLowerCase().includes(gardenSearch.toLowerCase())
        );

        return (
          <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">My Garden</h2>
            <p className="text-slate-500 mb-8">Your personal collection of green friends.</p>

            {myGarden.length > 0 && (
              <div className="mb-6 relative">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                 <input 
                    type="text" 
                    placeholder="Search your garden..." 
                    value={gardenSearch}
                    onChange={(e) => setGardenSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                 />
              </div>
            )}
            
            {isGardenLoading ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
              </div>
            ) : myGarden.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <Sprout className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Your garden is empty</h3>
                <p className="text-slate-500 max-w-xs mx-auto mb-6">Start identifying plants to add them to your collection.</p>
                <button 
                  onClick={() => setMode(AppMode.IDENTIFY)}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                >
                  Identify a Plant
                </button>
              </div>
            ) : filteredGarden.length === 0 ? (
              <div className="text-center py-12">
                 <p className="text-slate-500">No plants found matching "{gardenSearch}"</p>
                 <button 
                   onClick={() => setGardenSearch('')}
                   className="mt-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                 >
                   Clear search
                 </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGarden.map((plant) => (
                  <div key={plant.id} className="relative group">
                    <PlantCard plant={plant} image={plant.imageUrl} />
                    <button
                      onClick={() => removeFromGarden(plant.id)}
                      className="absolute top-4 right-4 p-2 bg-white/90 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-white"
                      title="Remove from garden"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900 md:flex md:flex-row-reverse">
      <main className="flex-1 md:ml-0 md:h-screen md:overflow-y-auto">
        {renderContent()}
      </main>
      <Navigation currentMode={mode} setMode={setMode} />
    </div>
  );
};

export default App;