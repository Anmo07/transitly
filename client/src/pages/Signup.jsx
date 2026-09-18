import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button3D } from '../components/atoms/Button3D';
import { Input3D } from '../components/atoms/Input3D';
import { useAuth } from '../hooks/useAuth';

export const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('CUSTOMER');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login({
        userId: 102,
        name: name || 'New Transitly User',
        email,
        phone,
        role
      });
      setLoading(false);
      navigate(role === 'CUSTOMER' ? '/' : '/rider-dashboard');
    }, 400);
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="font-extrabold text-lg text-[#191b24]">Create Transitly Account</h2>
        <p className="text-xs text-slate-500 mt-1">Intercity parcel logistics & last-mile delivery network</p>
      </div>

      <div className="flex bg-[#f2f3ff] p-1 rounded-2xl">
        <button
          type="button"
          onClick={() => setRole('CUSTOMER')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            role === 'CUSTOMER'
              ? 'bg-white text-[#0050cb] shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          I am a Customer
        </button>
        <button
          type="button"
          onClick={() => setRole('DELIVERY_PARTNER')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            role === 'DELIVERY_PARTNER'
              ? 'bg-white text-[#0050cb] shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Delivery Partner
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <Input3D
          label="Full Legal Name"
          id="signup-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          icon="person"
          required
        />
        <Input3D
          label="Email Address"
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon="mail"
          required
        />
        <Input3D
          label="Mobile Phone (+91)"
          id="signup-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          icon="phone"
          required
        />

        <Button3D
          variant="primary"
          size="full"
          type="submit"
          loading={loading}
          icon="person_add"
          className="mt-2"
        >
          Create Account & Sign In
        </Button3D>
      </form>

      <div className="pt-3 text-center border-t border-slate-100">
        <p className="text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#0050cb] hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
