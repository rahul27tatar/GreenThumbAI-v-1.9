import React from 'react';
import { PlantInfo, SavedPlant } from '../types';
import { Droplets, Sun, Thermometer, Sprout, Save, Share2 } from 'lucide-react';

interface PlantCardProps {
  plant: PlantInfo;
  image?: string;
  onSave?: (plant: PlantInfo) => void;
  isSaved?: boolean;
}

const PlantCard: React.FC<PlantCardProps> = ({ plant, image, onSave, isSaved }) => {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `GreenthumbAI: ${plant.name}`,
          text: `Check out this plant I identified with GreenthumbAI!\n\nName: ${plant.name} (${plant.scientificName})\nDescription: ${plant.description}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback for browsers without Web Share API
      navigator.clipboard.writeText(`Check out this plant: ${plant.name} - ${plant.description}`);
      alert('Plant info copied to clipboard!');
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-emerald-50 animate-fade-in-up">
      {image && (
        <div className="h-64 w-full relative">
          <img src={image} alt={plant.name} className="w-full h-full object-cover" />
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={handleShare}
              className="p-2 bg-black/20 backdrop-blur-md hover:bg-black/40 rounded-full text-white transition-all shadow-lg"
              title="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-20">
            <h2 className="text-3xl font-bold text-white mb-1">{plant.name}</h2>
            <p className="text-emerald-200 italic font-medium">{plant.scientificName}</p>
          </div>
        </div>
      )}
      
      {!image && (
        <div className="p-6 border-b border-emerald-100 bg-emerald-50 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-emerald-900 mb-1">{plant.name}</h2>
            <p className="text-emerald-700 italic font-medium">{plant.scientificName}</p>
          </div>
          <button
            onClick={handleShare}
            className="p-2 bg-emerald-100 hover:bg-emerald-200 rounded-full text-emerald-700 transition-all"
            title="Share"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="p-6 space-y-6">
        <p className="text-slate-600 leading-relaxed">{plant.description}</p>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
            <div className="flex items-center gap-2 mb-2 text-blue-700">
              <Droplets className="w-5 h-5" />
              <span className="font-semibold text-sm uppercase tracking-wider">Water</span>
            </div>
            <p className="text-sm text-blue-900">{plant.care.water}</p>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
            <div className="flex items-center gap-2 mb-2 text-amber-700">
              <Sun className="w-5 h-5" />
              <span className="font-semibold text-sm uppercase tracking-wider">Light</span>
            </div>
            <p className="text-sm text-amber-900">{plant.care.light}</p>
          </div>

          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
            <div className="flex items-center gap-2 mb-2 text-stone-700">
              <Sprout className="w-5 h-5" />
              <span className="font-semibold text-sm uppercase tracking-wider">Soil</span>
            </div>
            <p className="text-sm text-stone-900">{plant.care.soil}</p>
          </div>

          <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
            <div className="flex items-center gap-2 mb-2 text-rose-700">
              <Thermometer className="w-5 h-5" />
              <span className="font-semibold text-sm uppercase tracking-wider">Temp</span>
            </div>
            <p className="text-sm text-rose-900">{plant.care.temperature}</p>
          </div>
        </div>

        <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
          <h3 className="font-semibold text-emerald-900 mb-2">Did you know?</h3>
          <p className="text-emerald-800 text-sm">{plant.funFact}</p>
        </div>

        {onSave && (
          <button
            onClick={() => onSave(plant)}
            disabled={isSaved}
            className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all ${
              isSaved 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg hover:shadow-emerald-200'
            }`}
          >
            <Save className="w-5 h-5" />
            {isSaved ? 'Saved to Garden' : 'Save to Garden'}
          </button>
        )}
      </div>
    </div>
  );
};

export default PlantCard;