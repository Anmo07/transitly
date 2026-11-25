import React, { useRef } from 'react';

export const OtpPinInput = ({ length = 4, value = '', onChange, onComplete }) => {
  const inputsRef = useRef([]);

  const digits = Array.from({ length }, (_, i) => value[i] || '');

  const handleChange = (index, e) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      const next = value.split('');
      next[index] = '';
      onChange(next.join(''));
      return;
    }

    if (raw.length > 1) {
      // Pasted or autofilled string
      const nextArr = value.split('');
      for (let i = 0; i < length; i++) {
        if (i < raw.length) {
          nextArr[i] = raw[i];
        }
      }
      const nextValue = nextArr.join('').slice(0, length);
      onChange(nextValue);
      const nextIndex = Math.min(raw.length, length - 1);
      inputsRef.current[nextIndex]?.focus();
      if (nextValue.length === length && onComplete) onComplete(nextValue);
      return;
    }

    const digit = raw[raw.length - 1];
    const nextArr = value.split('');
    nextArr[index] = digit;
    const nextValue = nextArr.join('');
    onChange(nextValue);

    if (window.navigator?.vibrate) window.navigator.vibrate(6);

    // Auto-advance to next input
    if (index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    if (nextValue.length === length && onComplete) {
      onComplete(nextValue);
    }
  };

  const handlePaste = (e) => {
    const pasted = (e.clipboardData || window.clipboardData)?.getData('text')?.replace(/\D/g, '') || '';
    if (pasted.length > 0) {
      const nextArr = value.split('');
      for (let i = 0; i < length; i++) {
        if (i < pasted.length) {
          nextArr[i] = pasted[i];
        }
      }
      const nextValue = nextArr.join('').slice(0, length);
      onChange(nextValue);
      const nextIndex = Math.min(pasted.length, length - 1);
      setTimeout(() => inputsRef.current[nextIndex]?.focus(), 0);
      if (nextValue.length === length && onComplete) onComplete(nextValue);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-center gap-2.5 my-2">
      {digits.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => (inputsRef.current[idx] = el)}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          aria-label={`Verification digit ${idx + 1} of ${length}`}
          maxLength={length}
          value={digit}
          onChange={(e) => handleChange(idx, e)}
          onPaste={handlePaste}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          placeholder="•"
          className="w-13 h-14 text-center text-2xl font-bold font-mono rounded-xl bg-[#f2f3ff] text-[#191b24] border-2 border-transparent focus:border-[#0050cb] focus:bg-white focus:outline-none transition-all shadow-inner"
        />
      ))}
    </div>
  );
};
