import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button3D } from '../components/atoms/Button3D';
import { Input3D } from '../components/atoms/Input3D';
import { Badge } from '../components/atoms/Badge';
import { useAuth } from '../hooks/useAuth';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState('CUSTOMER');
  const [identifier, setIdentifier] = useState('vikram@transitly.in');
  const [otp, setOtp] = useState('123456');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 400);
  };

  const handleVerify = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login({
        userId: 101,
        name: role === 'CUSTOMER' ? 'Vikram Malhotra' : 'Rider Partner',
        email: identifier,
        role
      });
      setLoading(false);
      navigate(role === 'CUSTOMER' ? '/' : '/rider-dashboard');
    }, 400);
  };

  return (
    <div className="space-y-5">
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
          Customer Portal
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
          Delivery Partner Cockpit
        </button>
      </div>

      <div className="text-center">
        <h2 className="font-extrabold text-lg text-[#191b24]">
          {role === 'CUSTOMER' ? 'Sign in to Send & Track' : 'Partner Cockpit Login'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {step === 1 ? 'Enter your mobile number or email address' : 'Enter the 6-digit verification code'}
        </p>
      </div>

      {step === 1 ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <Input3D
            label="Mobile or Email"
            id="login-id"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            icon="alternate_email"
            required
          />
          <Button3D
            variant="primary"
            size="full"
            type="submit"
            loading={loading}
            icon="arrow_forward"
          >
            Get Verification Code
          </Button3D>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-4">
          <Input3D
            label="6-Digit OTP Code"
            id="login-otp"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            icon="pin"
            maxLength={6}
            required
          />
          <Button3D
            variant="emerald"
            size="full"
            type="submit"
            loading={loading}
            icon="check"
          >
            Verify & Continue
          </Button3D>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-semibold"
          >
            ← Change Mobile Number
          </button>
        </form>
      )}

      <div className="pt-3 text-center border-t border-slate-100">
        <p className="text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/signup" className="font-bold text-[#0050cb] hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};
