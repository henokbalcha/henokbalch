
import React, { useState, useCallback, useRef } from 'react';
import { analyzeItem, generateOutfitImage } from './services/geminiService';
import { AnalysisResult, StyledOutfit } from './types';
import OutfitCard from './components/OutfitCard';

const App: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [outfits, setOutfits] = useState<StyledOutfit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
        setAnalysis(null);
        setOutfits([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const processStyling = async () => {
    if (!image) return;

    setIsLoading(true);
    setLoadingStep('Analyzing your item...');
    try {
      const result = await analyzeItem(image);
      setAnalysis(result);
      
      const generatedOutfits: StyledOutfit[] = [];
      
      // Generate images one by one for better UX/stability
      for (let i = 0; i < result.outfits.length; i++) {
        const outfitSug = result.outfits[i];
        setLoadingStep(`Crafting your ${outfitSug.type} look...`);
        const imgUrl = await generateOutfitImage(image, outfitSug.imagePrompt);
        
        generatedOutfits.push({
          type: outfitSug.type,
          description: outfitSug.description,
          imageUrl: imgUrl,
          originalPrompt: outfitSug.imagePrompt
        });
      }
      
      setOutfits(generatedOutfits);
    } catch (error) {
      console.error("Styling failed:", error);
      alert("Something went wrong with the AI stylist. Please try again.");
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleOutfitUpdate = (index: number, newUrl: string) => {
    setOutfits(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], imageUrl: newUrl };
      return updated;
    });
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-serif text-lg">A</span>
            </div>
            <h1 className="font-serif text-xl tracking-tight text-gray-900">Aura Stylist</h1>
          </div>
          {image && !isLoading && (
            <button 
              onClick={() => { setImage(null); setAnalysis(null); setOutfits([]); }}
              className="text-sm font-medium text-gray-500 hover:text-black transition-colors"
            >
              Start Over
            </button>
          )}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-12">
        {!image ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <h2 className="text-4xl md:text-5xl font-serif text-gray-900 mb-6 leading-tight">
              What should I wear<br />with this?
            </h2>
            <p className="text-gray-500 max-w-lg mb-12 text-lg leading-relaxed">
              Upload a photo of any item—a bold skirt, a vintage blazer, or a pair of shoes—and our AI stylist will curate 3 complete looks for you.
            </p>
            
            <button 
              onClick={triggerUpload}
              className="group relative flex flex-col items-center justify-center w-full max-w-sm aspect-[4/3] bg-white border-2 border-dashed border-gray-300 rounded-3xl hover:border-black transition-all cursor-pointer hover:bg-gray-50"
            >
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 group-hover:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <span className="font-semibold text-gray-900">Upload Item Photo</span>
              <span className="text-sm text-gray-400 mt-1">JPEG, PNG or HEIC</span>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload} 
                className="hidden" 
                accept="image/*"
              />
            </button>
          </div>
        ) : (
          <div className="space-y-12 animate-in fade-in duration-700">
            {/* Initial Item Preview */}
            <div className="flex flex-col md:flex-row gap-12 items-start">
              <div className="w-full md:w-1/3">
                <div className="bg-white p-2 rounded-3xl shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
                  <img src={image} alt="Selected item" className="w-full rounded-2xl aspect-[3/4] object-cover" />
                </div>
              </div>
              
              <div className="w-full md:w-2/3 pt-6">
                {analysis ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">The Piece</h3>
                      <h2 className="text-4xl font-serif text-gray-900">{analysis.itemName}</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.colors.map((color, i) => (
                        <span key={i} className="px-4 py-1.5 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                          {color}
                        </span>
                      ))}
                      <span className="px-4 py-1.5 bg-black text-white rounded-full text-sm font-medium">
                        {analysis.style}
                      </span>
                    </div>
                    {outfits.length === 0 && !isLoading && (
                      <button 
                        onClick={processStyling}
                        className="bg-black text-white px-8 py-4 rounded-full font-bold hover:bg-gray-800 transition-all flex items-center gap-2"
                      >
                        Style My Item
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <h2 className="text-3xl font-serif text-gray-900">Ready to style?</h2>
                    <p className="text-gray-500 text-lg">Our AI will first analyze your garment's details to understand its unique character.</p>
                    <button 
                      onClick={processStyling}
                      disabled={isLoading}
                      className="bg-black text-white px-8 py-4 rounded-full font-bold hover:bg-gray-800 transition-all disabled:opacity-50"
                    >
                      {isLoading ? 'Processing...' : 'Analyze & Style'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Loading State Overlay */}
            {isLoading && (
              <div className="fixed inset-0 z-[60] bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 relative mb-8">
                  <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h3 className="text-2xl font-serif text-gray-900 mb-2">{loadingStep}</h3>
                <p className="text-gray-400 max-w-xs">High-fashion curation takes a moment. We're matching colors and textures for the perfect looks.</p>
              </div>
            )}

            {/* Outfit Results */}
            {outfits.length > 0 && (
              <div className="space-y-10 pt-10">
                <div className="flex items-end justify-between border-b border-gray-100 pb-4">
                  <h3 className="text-3xl font-serif text-gray-900">Your Curated Collection</h3>
                  <span className="text-sm font-bold text-gray-400">3 LOOKS GENERATED</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {outfits.map((outfit, idx) => (
                    <OutfitCard 
                      key={idx} 
                      outfit={outfit} 
                      onUpdate={(newUrl) => handleOutfitUpdate(idx, newUrl)} 
                    />
                  ))}
                </div>
                
                <div className="bg-gray-50 rounded-3xl p-8 text-center mt-20">
                  <h4 className="text-xl font-serif mb-3">Refine with Text</h4>
                  <p className="text-gray-500 text-sm max-w-lg mx-auto leading-relaxed">
                    Not quite right? You can use the "Refine" button on any look to give specific instructions like "add a vintage filter," "swap the bag for something leather," or "make the lighting moodier."
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="mt-20 border-t border-gray-100 pt-10 pb-10 text-center">
        <p className="text-gray-400 text-xs uppercase tracking-[0.2em]">&copy; 2024 Aura Stylist &bull; Powered by Gemini 3</p>
      </footer>
    </div>
  );
};

export default App;
