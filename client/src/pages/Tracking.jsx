import React, { useState } from 'react';
import { Card3D } from '../components/atoms/Card3D';
import { Button3D } from '../components/atoms/Button3D';
import { Badge } from '../components/atoms/Badge';
import { Icon } from '../components/atoms/Icon';
import { TelematicsHud } from '../components/molecules/TelematicsHud';
import { OtpPinInput } from '../components/molecules/OtpPinInput';
import { LiveMap } from '../components/organisms/LiveMap';
import { WebGLScrubber } from '../components/organisms/WebGLScrubber';

export const Tracking = () => {
  const [pin, setPin] = useState('4820');
  const [showPinModal, setShowPinModal] = useState(false);

  return (
    <div className="space-y-5">
      {/* Map & 3D Scrubber Viewport */}
      <div className="relative w-full h-[320px] rounded-3xl overflow-hidden shadow-lg border border-slate-200">
        <LiveMap
          center={[30.7333, 76.7794]}
          zoom={13}
          interactive={true}
          surgeRadius={1200}
        />
        {/* Floating Tracking Badge */}
        <div className="absolute top-3 left-3 z-10">
          <Badge variant="transit" pulse={true} className="shadow-md bg-white/95">
            LIVE • TRK-88219 (Delhi ➔ Chandigarh)
          </Badge>
        </div>
      </div>

      {/* Live Telematics Overlay */}
      <TelematicsHud
        speed={82}
        distance="34.2 km"
        eta="26 mins"
        carrierPlate="HR-68-A-1001"
        corridor="Delhi ➔ Chandigarh Express"
        progress={72}
        live={true}
      />

      {/* Custody Handoff & Recipient PIN Card */}
      <Card3D className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Icon name="verified_user" size="sm" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#191b24]">Doorstep Custody Lock</h3>
              <p className="text-[11px] text-slate-500">Provide this 4-digit code to partner upon arrival</p>
            </div>
          </div>
          <Badge variant="online">Protected</Badge>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-200/60">
          <div>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Your Recipient PIN</span>
            <div className="font-mono text-2xl font-black text-[#0050cb] tracking-widest mt-0.5">
              {pin}
            </div>
          </div>
          <Button3D
            variant="secondary"
            size="sm"
            icon="key"
            onClick={() => setShowPinModal(true)}
          >
            Enter Keypad
          </Button3D>
        </div>
      </Card3D>

      {/* PIN Verification Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-base text-[#191b24]">Doorstep Delivery PIN</h3>
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                <Icon name="close" size="xs" />
              </button>
            </div>

            <div className="h-40 rounded-2xl overflow-hidden mb-4">
              <WebGLScrubber
                sequenceId="3D-HANDOFF-PIN"
                frameCount={45}
                framePath="/assets/3d/3d-handoff-pin/frame_%d.webp"
                aspectRatio="1/1"
              />
            </div>

            <OtpPinInput
              length={4}
              value={pin}
              onChange={setPin}
              onComplete={(val) => {
                setTimeout(() => setShowPinModal(false), 500);
              }}
            />

            <p className="text-center text-xs text-slate-400 mt-3 font-medium">
              4-digit cryptographic recipient proof of custody
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
