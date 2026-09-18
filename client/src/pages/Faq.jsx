import React, { useState } from 'react';
import { Card3D } from '../components/atoms/Card3D';
import { Button3D } from '../components/atoms/Button3D';
import { Icon } from '../components/atoms/Icon';
import { Badge } from '../components/atoms/Badge';
import { useNavigate } from 'react-router-dom';

export const Faq = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [openIdx, setOpenIdx] = useState(0);

  const FAQS = [
    {
      q: 'How does Transitly deliver parcels in under 6 hours across state lines?',
      a: 'Transitly partners with state road transport corporations (such as HRTC, UPSRTC, RSRTC, KSRTC) and private luxury Volvo fleets. We reserve secure undercarriage luggage bay compartments on already scheduled, non-stop intercity express buses. When combined with our local first-mile and last-mile electric courier fleet, your parcel travels on high-speed express corridors without airport wait times.',
      cat: 'Corridors'
    },
    {
      q: 'What is the starting price to send a parcel?',
      a: 'Intercity bus cargo starts at just ₹60 for documents and small pouches up to 1 kg on primary interstate corridors (such as Delhi ⇄ Chandigarh, Delhi ⇄ Jaipur, and Mumbai ⇄ Pune). Larger packages have a flat weight surcharge of ₹20 per additional kilogram.',
      cat: 'Pricing'
    },
    {
      q: 'How does the 4-Digit Delivery PIN protect my parcel?',
      a: 'Every consignment generates a cryptographically hashed 4-digit verification PIN. The delivery partner cannot complete the trip or unlock the delivery confirmation in the app unless the recipient provides this secret PIN upon physical inspection.',
      cat: 'Security'
    },
    {
      q: 'Can I track the exact location of the bus on the highway?',
      a: 'Yes! Transitly feeds real-time GPS telematics directly from the onboard vehicle tracking system (VLTD). You can watch the bus speed, distance to the next hub, and exact road position live on our interactive 3D map.',
      cat: 'Tracking'
    },
    {
      q: 'What items are strictly prohibited from being shipped?',
      a: 'To comply with central and state motor vehicle laws, we prohibit inflammable liquids, fireworks, uncertified lithium batteries over 100Wh, illegal substances, and hazardous chemicals. All packages undergo a physical tamper-evident seal inspection before stowage.',
      cat: 'Packaging'
    },
    {
      q: 'How can I join as a delivery partner?',
      a: 'If you have a two-wheeler, electric three-wheeler, or commercial van with a valid driving license and vehicle registration, you can sign up via our Delivery Partner portal. Onboarding takes less than 24 hours.',
      cat: 'Partner'
    }
  ];

  const filtered = FAQS.filter(
    (f) =>
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto py-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <Badge variant="verified">KNOWLEDGE BASE</Badge>
        <h1 className="text-2xl sm:text-3xl font-black text-[#191b24] tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Everything you need to know about intercity bus freight, telematics, and doorstep delivery
        </p>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <div className="absolute inset-y-0 left-3.5 flex items-center text-slate-400">
          <Icon name="search" size="sm" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search questions (e.g. tracking, rates, prohibited items)..."
          className="w-full h-12 pl-10 pr-4 bg-white border border-[#ecedfa] rounded-2xl text-xs font-semibold text-[#191b24] outline-none focus:border-[#0050cb] shadow-sm"
        />
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-3">
        {filtered.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <Card3D
              key={idx}
              className={`p-4 border transition-all cursor-pointer ${
                isOpen ? 'border-[#0050cb] shadow-md bg-white' : 'border-[#ecedfa] hover:border-slate-300'
              }`}
              onClick={() => setOpenIdx(isOpen ? -1 : idx)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#0050cb] flex items-center justify-center font-black text-[11px] shrink-0">
                    Q
                  </span>
                  <h3 className="font-extrabold text-xs sm:text-sm text-[#191b24]">{item.q}</h3>
                </div>
                <Icon
                  name={isOpen ? 'expand_less' : 'expand_more'}
                  size="sm"
                  className="text-slate-400 shrink-0"
                />
              </div>

              {isOpen && (
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 leading-relaxed animate-fade-in pl-8">
                  {item.a}
                </div>
              )}
            </Card3D>
          );
        })}
      </div>

      {/* Still Have Questions CTA */}
      <div className="p-6 bg-slate-100 rounded-3xl text-center space-y-2">
        <h3 className="font-black text-sm text-[#191b24]">Still have unanswered questions?</h3>
        <p className="text-xs text-slate-500">Our corridor logistics specialists are active 24x7.</p>
        <div className="pt-2 flex justify-center gap-2">
          <Button3D variant="primary" size="sm" onClick={() => navigate('/help-support')}>
            Open Support Ticket ➔
          </Button3D>
        </div>
      </div>
    </div>
  );
};
