import React from 'react';
import { useStore } from '../context/StoreContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Toast: React.FC = () => {
  const { toasts, dismissToast } = useStore();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border flex items-start gap-3 backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-[#1C1111]/95 border-[#EF4444]/40 text-white'
                : toast.type === 'info'
                ? 'bg-[#141414]/95 border-[#3B82F6]/40 text-white'
                : 'bg-[#161616]/95 border-[#FF7A00]/50 text-white shadow-[#FF7A00]/10'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-[#EF4444]" />
              ) : toast.type === 'info' ? (
                <Info className="w-5 h-5 text-[#3B82F6]" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-[#FF7A00]" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold font-sans text-white">{toast.title}</h4>
              <p className="text-[11px] text-[#AAAAAA] mt-0.5 font-sans leading-tight">{toast.message}</p>
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="text-[#777777] hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
