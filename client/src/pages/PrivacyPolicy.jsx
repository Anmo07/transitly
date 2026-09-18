import React from 'react';
import { Card3D } from '../components/atoms/Card3D';
import { Badge } from '../components/atoms/Badge';
import { Icon } from '../components/atoms/Icon';
import { useNavigate } from 'react-router-dom';

export const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto py-4 text-[#191b24]">
      {/* Header */}
      <div className="space-y-2">
        <Badge variant="verified">COMPLIANCE WITH DPDP ACT 2023</Badge>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Privacy & Telematics Data Policy</h1>
        <p className="text-xs text-slate-500">Last updated: September 2026 • Transitly Logistics Technologies Pvt. Ltd.</p>
      </div>

      <Card3D className="p-6 border border-[#ecedfa] bg-white space-y-6 text-xs text-slate-600 leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-extrabold text-sm text-[#191b24] flex items-center gap-2">
            <Icon name="verified_user" size="sm" className="text-[#0050cb]" />
            1. Overview & Commitment
          </h2>
          <p>
            At Transitly, we are deeply committed to protecting the privacy, confidentiality, and security of all personal and telemetry data collected through our web applications, carrier hubs, and mobile portals in strict adherence to the Digital Personal Data Protection Act (DPDP), 2023.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-extrabold text-sm text-[#191b24] flex items-center gap-2">
            <Icon name="location_on" size="sm" className="text-[#0050cb]" />
            2. High-Precision Telematics & GPS Location Data
          </h2>
          <p>
            We collect continuous GPS coordinates, speed, and heading data from delivery partner vehicles and onboard bus vehicle location tracking devices (VLTD). This data is strictly utilized for:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Calculating live estimated time of arrival (ETA) for senders and recipients.</li>
            <li>Enforcing strict geofence radius checks (&lt;100m) for cryptographic 4-digit PIN handoffs.</li>
            <li>Detecting route anomalies, unscheduled stoppages, or tamper events in express bus luggage bays.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-extrabold text-sm text-[#191b24] flex items-center gap-2">
            <Icon name="lock" size="sm" className="text-[#0050cb]" />
            3. Data Retention & Cryptographic Encryption
          </h2>
          <p>
            All network communication is encrypted end-to-end using TLS 1.3 with AES-256 cipher suites. High-resolution 3-second GPS pings are pruned and aggregated after 30 days of trip completion. Financial transaction records and tax invoices are retained for the statutory period required by Indian law.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-extrabold text-sm text-[#191b24] flex items-center gap-2">
            <Icon name="manage_accounts" size="sm" className="text-[#0050cb]" />
            4. Data Principal Rights
          </h2>
          <p>
            Under the DPDP Act 2023, you have the right to request access to your personal data summary, correct inaccurate data, or request permanent deletion of your account and personal identifiers by contacting our Grievance Officer.
          </p>
        </section>

        <section className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
          <div className="font-bold text-slate-800">Grievance & Data Protection Officer</div>
          <div>Name: Priya Sharma, Head of Security & Legal</div>
          <div>Email: grievance@transitly.in</div>
          <div>Address: Transitly Technology Hub, Connaught Place, New Delhi 110001</div>
        </section>
      </Card3D>
    </div>
  );
};
