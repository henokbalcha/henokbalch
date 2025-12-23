
import React, { useState } from 'react';
import { StyledOutfit } from '../types';
import { editOutfitImage } from '../services/geminiService';

interface OutfitCardProps {
  outfit: StyledOutfit;
  onUpdate: (newImageUrl: string) => void;
}

const OutfitCard: React.FC<OutfitCardProps> = ({ outfit, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleEdit = async () => {
    if (!editPrompt.trim()) return;
    setIsProcessing(true);
    try {
      const updatedUrl = await editOutfitImage(outfit.imageUrl, editPrompt);
      onUpdate(updatedUrl);
      setEditPrompt('');
      setIsEditing(false);
    } catch (error) {
      console.error("Edit failed:", error);
      alert("Failed to edit image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transition-all hover:shadow-xl group">
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <img 
          src={outfit.imageUrl} 
          alt={outfit.type} 
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${isProcessing ? 'opacity-50 grayscale' : 'opacity-100'}`}
        />
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-gray-800 inline-block">
            {outfit.type}
          </div>
        </div>
      </div>
      
      <div className="p-5">
        <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-2 italic">
          "{outfit.description}"
        </p>

        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="w-full py-2.5 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Refine with AI
          </button>
        ) : (
          <div className="space-y-3">
            <textarea
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="e.g. 'Add a retro filter' or 'Make it warmer'"
              className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:outline-none resize-none h-20"
            />
            <div className="flex gap-2">
              <button 
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2 text-sm font-medium text-gray-500 hover:text-gray-800"
              >
                Cancel
              </button>
              <button 
                onClick={handleEdit}
                disabled={isProcessing || !editPrompt}
                className="flex-[2] bg-black text-white py-2 rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                Apply Edit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutfitCard;
