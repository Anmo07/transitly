import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button3D } from '../components/atoms/Button3D';
import { Input3D } from '../components/atoms/Input3D';
import { Card3D } from '../components/atoms/Card3D';
import { Badge } from '../components/atoms/Badge';
import { Icon } from '../components/atoms/Icon';
import { WebGLScrubber } from '../components/organisms/WebGLScrubber';

export const Home = () => {
  const navigate = useNavigate();
  const [pickupCity, setPickupCity] = useState('Delhi ISBT Kashmere Gate');
  const [dropCity, setDropCity] = useState('Chandigarh Sector 17');
  const [packageWeight, setPackageWeight] = useState('3 kg (Medium Parcel)');

  const corridors = [
    { from: 'Delhi', to: 'Chandigarh', time: '4h 15m', price: '₹149', buses: 'Every 20m', surge: null },
    { from: 'Delhi', to: 'Jaipur', time: '5h 00m', price: '₹189', buses: 'Every 30m', surge: '+15% High Demand' },
    { from: 'Delhi', to: 'Dehradun', time: '5h 30m', price: '₹199', buses: 'Every 45m', surge: null }
  ];

  return (
    <div className="space-y-6">
      {/* 3D Visual Hero with WebGL2 Texture Quad */}
      <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-200">
        <WebGLScrubber
          sequenceId="3D-BUS-HIGHWAY"
          frameCount={75}
          framePath="/assets/3d/3d-bus-highway/frame_%d.webp"
          aspectRatio="16/9"
        >
          <div className="p-6 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end text-white">
            <Badge variant="transit" pulse={true} className="self-start mb-2">
              EXPRESS CORRIDOR TELEMATICS
            </Badge>
            <h2 className="text-xl md:text-2xl font-black leading-tight">
              Same-Day Intercity Bus Freight
            </h2>
            <p className="text-xs md:text-sm text-slate-200 mt-1">
              Real-time highway telemetry with guaranteed delivery by nightfall.
            </p>
          </div>
        </WebGLScrubber>
      </div>

      {/* Quick Booking Card */}
      <Card3D className="space-y-4 shadow-md">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base text-[#191b24] flex items-center gap-2">
            <Icon name="local_shipping" size="sm" color="#0050cb" />
            Instant Corridor Booking
          </h3>
          <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
            ● 84 Buses Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input3D
            label="Pickup Bus Terminal"
            id="input-pickup"
            value={pickupCity}
            onChange={(e) => setPickupCity(e.target.value)}
            icon="trip_origin"
          />
          <Input3D
            label="Dropoff Bus Terminal"
            id="input-drop"
            value={dropCity}
            onChange={(e) => setDropCity(e.target.value)}
            icon="location_on"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Icon name="inventory_2" size="xs" />
            <span>Estimated Fare: <strong className="text-slate-900 font-bold text-sm">₹149.00</strong></span>
          </div>

          <Button3D
            variant="primary"
            size="md"
            icon="bolt"
            onClick={() => navigate('/tracking')}
            className="w-full sm:w-auto"
          >
            Dispatch Parcel Now
          </Button3D>
        </div>
      </Card3D>

      {/* Express Corridors List */}
      <div className="space-y-3">
        <h4 className="font-extrabold text-sm text-[#191b24] flex items-center gap-1.5">
          <Icon name="alt_route" size="sm" color="#0050cb" />
          Active Express Corridors
        </h4>

        <div className="grid grid-cols-1 gap-2.5">
          {corridors.map((c, i) => (
            <Card3D
              key={i}
              interactive={true}
              onClick={() => navigate('/tracking')}
              className="p-3.5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0050cb] flex items-center justify-center font-bold">
                  <Icon name="directions_bus" size="sm" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <span>{c.from}</span>
                    <span className="text-slate-400">➔</span>
                    <span>{c.to}</span>
                    {c.surge && <Badge variant="surge">{c.surge}</Badge>}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>⏱ {c.time}</span>
                    <span>•</span>
                    <span>🚌 {c.buses}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono font-extrabold text-sm text-[#0050cb]">{c.price}</div>
                <div className="text-[10px] text-slate-400">Base Fare</div>
              </div>
            </Card3D>
          ))}
        </div>
      </div>
    </div>
  );
};
