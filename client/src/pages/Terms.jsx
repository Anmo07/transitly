import React from 'react';
import { Card3D } from '../components/atoms/Card3D';
import { Badge } from '../components/atoms/Badge';
import { Icon } from '../components/atoms/Icon';

export const Terms = () => {
  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto py-4 text-[#191b24]">
      {/* Header */}
      <div className="space-y-2">
        <Badge variant="verified">LEGAL CONDITIONS OF CARRIAGE</Badge>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Terms of Service & Carriage SLA</h1>
        <p className="text-xs text-slate-500">Effective: September 2026 • Governing Law: Republic of India</p>
      </div>

      <Card3D className="p-6 border border-[#ecedfa] bg-white space-y-6 text-xs text-slate-600 leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-extrabold text-sm text-[#191b24] flex items-center gap-2">
            <Icon name="gavel" size="sm" className="text-[#0050cb]" />
            1. Nature of the Logistics Platform
          </h2>
          <p>
            Transitly operates an aggregated digital transport platform connecting parcel consignors with licensed state road transport corporations (SRTCs), private stage carriage bus operators, and independent on-demand first/last mile delivery partners. Transitly coordinates capacity reservations under the Carriage by Road Act, 2007.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-extrabold text-sm text-[#191b24] flex items-center gap-2">
            <Icon name="block" size="sm" className="text-red-600" />
            2. Strictly Prohibited Cargo
          </h2>
          <p>Consignors warrant that consignments do not contain any of the following items:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Explosives, firearms, fireworks, and munitions.</li>
            <li>Flammable compressed gases, petroleum products, and unsealed chemicals.</li>
            <li>Currency notes, bullion, precious gemstones, and unregistered bearer bonds.</li>
            <li>Contraband, narcotics, or items prohibited under the NDPS Act.</li>
          </ul>
          <p className="text-red-600 font-semibold">
            Any attempt to ship prohibited goods results in immediate confiscation, permanent account termination, and statutory police reporting.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-extrabold text-sm text-[#191b24] flex items-center gap-2">
            <Icon name="shield" size="sm" className="text-[#0050cb]" />
            3. Carrier Liability & Transitly Shield Protection
          </h2>
          <p>
            Standard carriage includes basic carrier liability capped at ₹2,000 or the invoice declared value, whichever is lower. Bookings opted with "Transitly Shield Protection" (₹10 surcharge) carry extended transit damage and total loss indemnity up to ₹15,000, subject to physical packaging compliance.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-extrabold text-sm text-[#191b24] flex items-center gap-2">
            <Icon name="pin" size="sm" className="text-[#0050cb]" />
            4. 4-Digit Verification PIN & Delivery Proof
          </h2>
          <p>
            Consignment delivery is legally established when the recipient discloses the unique 4-digit PIN generated for the order to the delivery partner within the geofenced delivery zone. Disclosure of the PIN constitutes conclusive legal receipt in sound condition.
          </p>
        </section>
      </Card3D>
    </div>
  );
};
