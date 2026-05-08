import React, { useState, useRef, useEffect } from 'react';
import './OTPInputBoxes.css';

export default function OTPInputBoxes({ length = 6, onComplete }) {
  const [otp, setOtp] = useState(new Array(length).fill(''));
  const inputRefs = useRef([]);

  useEffect(() => {
    // Focus the first input initially when component mounts
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Focus next input
    if (element.value && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }
    
    // Check if complete
    if (newOtp.every(val => val !== '')) {
      onComplete(newOtp.join(''));
    } else {
      onComplete(''); // Reset complete status if backspaced
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length).split('');
    if (pastedData.some(isNaN)) return;
    
    const newOtp = [...otp];
    pastedData.forEach((value, i) => {
      newOtp[i] = value;
    });
    setOtp(newOtp);
    
    if (pastedData.length === length) {
      onComplete(pastedData.join(''));
      inputRefs.current[length - 1].focus();
    } else {
      inputRefs.current[pastedData.length].focus();
    }
  };

  return (
    <div className="otp-boxes-container">
      {otp.map((data, index) => (
        <input
          className="otp-box"
          type="text"
          name="otp"
          maxLength="1"
          key={index}
          value={data}
          onChange={e => handleChange(e.target, index)}
          onKeyDown={e => handleKeyDown(e, index)}
          onPaste={handlePaste}
          ref={el => inputRefs.current[index] = el}
        />
      ))}
    </div>
  );
}
