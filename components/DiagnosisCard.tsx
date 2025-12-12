import React, { useState } from 'react';
import { DiagnosisResult, SearchResult, ProductRecommendation } from '../types';
import { AlertCircle, CheckCircle, HelpCircle, Activity, ShieldCheck, Pill, ShoppingBag, ExternalLink, Loader2, Share2, Tag, Image as ImageIcon } from 'lucide-react';

interface DiagnosisCardProps {
  result: DiagnosisResult;
  image?: string;
  onSearchProducts?: (diagnosis: string) => void;
  productsResult?: SearchResult | null;
  isSearchingProducts?: boolean;
}

const ProductRow: React.FC<{ product: ProductRecommendation, fallbackUrl?: string }> = ({ product, fallbackUrl }) => {
  const [imgError, setImgError] = useState(false);

  // Check if price is missing or contains "not found" text, and replace it
  const displayPrice = (!product.price || product.price.toLowerCase().includes('not found') || product.price.toLowerCase().includes('snippets')) 
    ? 'Visit the Site below' 
    : product.price;

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex gap-4 hover:shadow-md transition-shadow">
      <div className="w-20 h-20 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center border border-slate-200 relative">
        {!imgError && product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover" 
            onError={() => setImgError(true)}
          />
        ) : (
          <ImageIcon className="w-8 h-8 text-slate-300" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h4 className="font-semibold text-slate-900 text-sm line-clamp-2">{product.name}</h4>
          <span className={`px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap ml-2 ${displayPrice === 'Visit the Site below' ? 'bg-slate-100 text-slate-500' : 'text-emerald-700 bg-emerald-50'}`}>
            {displayPrice}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{product.description}</p>
        <a 
          href={product.productUrl || fallbackUrl || "#"} 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center text-xs font-medium text-emerald-600 hover:text-emerald-700"
        >
          View Product <ExternalLink className="w-3 h-3 ml-1" />
        </a>
      </div>
    </div>
  );
};

const DiagnosisCard: React.FC<DiagnosisCardProps> = ({ 
  result, 
  image, 
  onSearchProducts, 
  productsResult, 
  isSearchingProducts 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Healthy': return 'bg-green-100 text-green-700 border-green-200';
      case 'Sick': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Healthy': return <CheckCircle className="w-8 h-8" />;
      case 'Sick': return <AlertCircle className="w-8 h-8" />;
      default: return <HelpCircle className="w-8 h-8" />;
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `GreenthumbAI Diagnosis: ${result.healthStatus}`,
      text: `Plant Health: ${result.healthStatus}\n\nDiagnosis: ${result.diagnosis}\n\nTreatment: ${result.treatment.join(', ')}\n\nDiagnosed with GreenthumbAI`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.text}`);
      alert('Diagnosis copied to clipboard!');
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
      {image && (
        <div className="h-48 w-full relative">
          <img src={image} alt="Diagnosis target" className="w-full h-full object-cover" />
          <div className="absolute top-4 left-4 flex gap-2">
             <button
              onClick={handleShare}
              className="p-2 bg-black/30 backdrop-blur-md hover:bg-black/50 rounded-full text-white transition-all shadow-lg"
              title="Share Diagnosis"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
          <div className={`absolute top-4 right-4 px-4 py-2 rounded-full border flex items-center gap-2 font-bold shadow-sm backdrop-blur-md bg-white/90 ${getStatusColor(result.healthStatus)}`}>
            {getStatusIcon(result.healthStatus)}
            {result.healthStatus}
          </div>
        </div>
      )}

      <div className="p-6 space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
             <h3 className="text-lg font-semibold text-slate-900">Diagnosis Analysis</h3>
             {!image && (
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
             )}
          </div>
          <p className="text-slate-600 text-lg leading-relaxed">{result.diagnosis}</p>
        </div>

        <div className="space-y-4">
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
            <h4 className="flex items-center gap-2 font-semibold text-amber-900 mb-3">
              <Activity className="w-5 h-5" />
              Symptoms Detected
            </h4>
            <ul className="list-disc list-inside space-y-1 text-amber-800/80 text-sm">
              {result.symptoms.map((symptom, idx) => (
                <li key={idx}>{symptom}</li>
              ))}
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h4 className="flex items-center gap-2 font-semibold text-blue-900 mb-3">
              <Pill className="w-5 h-5" />
              Recommended Treatment
            </h4>
            <ul className="list-disc list-inside space-y-1 text-blue-800/80 text-sm">
              {result.treatment.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-xl border border-green-100">
            <h4 className="flex items-center gap-2 font-semibold text-green-900 mb-2">
              <ShieldCheck className="w-5 h-5" />
              Prevention
            </h4>
            <p className="text-green-800/80 text-sm">{result.prevention}</p>
          </div>

          {/* Product Recommendations Section */}
          {result.healthStatus !== 'Healthy' && (
            <div className="mt-8 border-t border-slate-100 pt-6">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-600" />
                  Recommended Products
                </h3>
              </div>
              
              {!productsResult && !isSearchingProducts && (
                 <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-200">
                   <p className="text-slate-600 mb-4">Find top-rated treatments available online for this issue.</p>
                   <button 
                    onClick={() => onSearchProducts && onSearchProducts(result.diagnosis)}
                    className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 flex items-center gap-2 mx-auto"
                   >
                     <ShoppingBag className="w-4 h-4" />
                     Find Treatments on Google
                   </button>
                 </div>
              )}

              {isSearchingProducts && (
                <div className="bg-slate-50 rounded-2xl p-8 flex flex-col items-center justify-center text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin mb-2 text-emerald-600" />
                  <p>Searching for the best products...</p>
                </div>
              )}

              {productsResult && productsResult.products && productsResult.products.length > 0 && (
                <div className="grid grid-cols-1 gap-4">
                  {productsResult.products.map((product, idx) => (
                    <ProductRow 
                      key={idx} 
                      product={product} 
                      fallbackUrl={productsResult.groundingChunks?.[idx]?.web?.uri} 
                    />
                  ))}
                  
                  {productsResult.groundingChunks && productsResult.groundingChunks.length > 0 && (
                    <div className="mt-2 text-center">
                      <p className="text-xs text-slate-400">Sources: {productsResult.groundingChunks.map(c => c.web?.title).filter(Boolean).slice(0, 3).join(', ')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiagnosisCard;