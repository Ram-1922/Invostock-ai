"use client";

import { useState } from "react";

interface DynamicFormProps {
  initialData: Record<string, any>;
  onSubmit: (confirmedData: Record<string, any>) => void;
}

export default function DynamicForm({ initialData, onSubmit }: DynamicFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleItemChange = (index: number, key: string, value: string) => {
    const updatedItems = [...(formData.items || [])];
    updatedItems[index] = { ...updatedItems[index], [key]: value };
    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  return (
    // <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-8">
    //   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    //     {Object.entries(formData).map(([key, value]) => {
    //       if (key === "items") return null; 
    //       return (
    //         <div key={key}>
    //           <label className="block text-sm font-bold text-slate-700 capitalize mb-2 ml-1">
    //             {key.replace(/([A-Z])/g, " $1")}
    //           </label>
    //           <input
    //             type="text"
    //             value={value as string}
    //             onChange={(e) => handleChange(key, e.target.value)}
    //             className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#10b983]/50 focus:border-[#10b983] focus:bg-white transition-all shadow-sm"
    //           />
    //         </div>
    //       );
    //     })}
    //   </div>

    //   {formData.items && Array.isArray(formData.items) && (
    //     <div className="mt-10">
    //       <h3 className="text-xl font-bold text-slate-800 mb-6">Extracted Products</h3>
    //       <div className="space-y-4">
    //         {formData.items.map((item, index) => (
    //           <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-5 border border-slate-100 rounded-3xl bg-white shadow-sm hover:shadow-md transition-shadow">
    //             {Object.entries(item).map(([itemKey, itemValue]) => (
    //               <div key={itemKey}>
    //                 <label className="block text-xs font-bold text-slate-500 capitalize mb-2 ml-1">
    //                   {itemKey}
    //                 </label>
    //                 <input
    //                   type="text"
    //                   value={itemValue as string}
    //                   onChange={(e) => handleItemChange(index, itemKey, e.target.value)}
    //                   className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10b983]/50 focus:border-[#10b983] transition-all"
    //                 />
    //               </div>
    //             ))}
    //           </div>
    //         ))}
    //       </div>
    //     </div>
    //   )}

    //   <div className="flex justify-end pt-6 border-t border-slate-100">
    //     <button type="submit" className="btn-primary text-base px-8 py-3">Confirm & Update Stock</button>
    //   </div>
    // </form>
    <div>hello</div>
  );
}