import { useState } from 'react';
import { ShopFlowOrder } from '@/hooks/useShopFlow';

interface NotesCardProps {
  orderId: string;
}

export const NotesCard = ({ orderId }: NotesCardProps) => {
  const [notes, setNotes] = useState('');

  return (
    <div className="bg-[#101016] border border-white/5 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-2">Notes</h3>
      <textarea
        className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-gray-200 text-sm"
        rows={3}
        placeholder="Add internal notes…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      ></textarea>
    </div>
  );
};
