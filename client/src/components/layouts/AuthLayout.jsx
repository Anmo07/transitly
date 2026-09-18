import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-[#faf8ff] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#0050cb] text-white font-black text-2xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-blue-500/20">
            T
          </div>
          <h1 className="text-2xl font-black text-[#191b24] tracking-tight">Transitly</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Scheduled Intercity Bus Logistics</p>
        </div>
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#ecedfa]">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
