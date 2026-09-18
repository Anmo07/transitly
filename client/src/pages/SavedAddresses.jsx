import React, { useState } from 'react';
import { Card3D } from '../components/atoms/Card3D';
import { Button3D } from '../components/atoms/Button3D';
import { Icon } from '../components/atoms/Icon';
import { Input3D } from '../components/atoms/Input3D';
import { useNavigate } from 'react-router-dom';

export const SavedAddresses = () => {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([
    {
      id: 1,
      type: 'HOME',
      title: 'Home (Defence Colony)',
      address: 'B-42, Defence Colony, New Delhi, Delhi 110024',
      contact: 'Anmol Verma • +91 98765 43210',
      isDefault: true
    },
    {
      id: 2,
      type: 'WORK',
      title: 'Logistics Hub Okhla',
      address: 'Phase III, Okhla Industrial Area, New Delhi, Delhi 110020',
      contact: 'Transitly Dispatch • +91 11 4050 9999',
      isDefault: false
    },
    {
      id: 3,
      type: 'WAREHOUSE',
      title: 'Sector 43 Hub Chandigarh',
      address: 'Shop 14, Opposite Interstate Bus Terminal, Sector 43, Chandigarh 160043',
      contact: 'Warehouse Manager • +91 98140 12345',
      isDefault: false
    }
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newType, setNewType] = useState('HOME');

  const handleAddAddress = (e) => {
    e.preventDefault();
    if (!newTitle || !newAddress) return;

    const newItem = {
      id: Date.now(),
      type: newType,
      title: newTitle,
      address: newAddress,
      contact: newContact || 'Default Contact',
      isDefault: false
    };

    setAddresses([newItem, ...addresses]);
    setIsAdding(false);
    setNewTitle('');
    setNewAddress('');
    setNewContact('');
  };

  const handleDelete = (id) => {
    setAddresses(addresses.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100"
          >
            <Icon name="arrow_back" size="sm" />
          </button>
          <div>
            <h1 className="text-xl font-black text-[#191b24]">Saved Addresses</h1>
            <p className="text-xs text-slate-500">Pickups, doorstep destinations & corridor hubs</p>
          </div>
        </div>
        <Button3D
          variant="primary"
          size="sm"
          icon="add"
          onClick={() => setIsAdding(true)}
        >
          Add New
        </Button3D>
      </div>

      {/* Add Modal / Form */}
      {isAdding && (
        <Card3D className="p-5 border-2 border-[#0050cb] shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="font-bold text-sm text-[#191b24]">Add New Address</h2>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <Icon name="close" size="xs" />
            </button>
          </div>

          <form onSubmit={handleAddAddress} className="space-y-3">
            <div className="flex gap-2">
              {['HOME', 'WORK', 'WAREHOUSE'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNewType(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    newType === t
                      ? 'bg-[#0050cb] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <Input3D
              label="Location Name (e.g. My Office)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Noida Warehouse"
            />
            <Input3D
              label="Complete Street Address & Pincode"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="Building, Street, Landmark, City, PIN"
            />
            <Input3D
              label="Contact Person & Phone Number"
              value={newContact}
              onChange={(e) => setNewContact(e.target.value)}
              placeholder="Name • +91 99999 99999"
            />

            <div className="flex gap-2 pt-2">
              <Button3D
                type="button"
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => setIsAdding(false)}
              >
                Cancel
              </Button3D>
              <Button3D
                type="submit"
                variant="primary"
                size="md"
                className="flex-1"
              >
                Save Address
              </Button3D>
            </div>
          </form>
        </Card3D>
      )}

      {/* Address List */}
      <div className="space-y-3">
        {addresses.map((item) => (
          <Card3D key={item.id} className="p-4 border border-[#ecedfa]">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0050cb] flex items-center justify-center shrink-0 mt-0.5">
                  <Icon
                    name={
                      item.type === 'HOME'
                        ? 'home'
                        : item.type === 'WORK'
                        ? 'business'
                        : 'warehouse'
                    }
                    size="md"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-[#191b24]">{item.title}</span>
                    {item.isDefault && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-100 text-[#0050cb]">
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{item.address}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{item.contact}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg transition"
                title="Delete address"
              >
                <Icon name="delete" size="xs" />
              </button>
            </div>
          </Card3D>
        ))}
      </div>
    </div>
  );
};
