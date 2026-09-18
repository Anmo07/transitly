import React from 'react';
import { Card3D } from '../components/atoms/Card3D';
import { Button3D } from '../components/atoms/Button3D';
import { Icon } from '../components/atoms/Icon';
import { useNavigate } from 'react-router-dom';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 animate-fade-in text-center">
      <div className="max-w-md w-full space-y-6">
        <div className="relative w-28 h-28 mx-auto">
          <div className="w-28 h-28 rounded-3xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-[#0050cb] shadow-lg">
            <Icon name="explore_off" size="xl" />
          </div>
          <span className="absolute -bottom-2 -right-2 px-3 py-1 bg-[#0050cb] text-white font-mono font-black text-xs rounded-full shadow-md">
            404
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-[#191b24] tracking-tight">
            Off-Route / Waypoint Not Found
          </h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            The intercity hub, parcel tracking waypoint, or corridor URL you requested does not exist or has been rerouted.
          </p>
        </div>

        <Card3D className="p-4 bg-white border border-[#ecedfa] flex flex-col gap-2">
          <Button3D
            variant="primary"
            size="md"
            icon="home"
            onClick={() => navigate('/')}
          >
            Return to Transitly Hub ➔
          </Button3D>

          <Button3D
            variant="secondary"
            size="md"
            icon="distance"
            onClick={() => navigate('/tracking')}
          >
            Track Active Consignment
          </Button3D>
        </Card3D>
      </div>
    </div>
  );
};
