import React from 'react';
import styled from 'styled-components';

interface GradientButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
}

const GradientButton: React.FC<GradientButtonProps> = ({ 
  children, 
  onClick, 
  disabled = false, 
  className,
  type = 'button',
  fullWidth = false,
  ...props 
}) => {
  return (
    <StyledWrapper className={className} $fullWidth={fullWidth}>
      <button 
        onClick={onClick} 
        disabled={disabled}
        type={type}
        {...props}
      >
        <span className="text">{children}</span>
      </button>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div<{ $fullWidth?: boolean }>`
  button {
    align-items: center;
    background-image: linear-gradient(144deg, #af40ff, #5b42f3 50%, #00ddeb);
    border: 0;
    border-radius: 8px;
    box-shadow: rgba(151, 65, 252, 0.2) 0 15px 30px -5px;
    box-sizing: border-box;
    color: #ffffff;
    display: flex;
    font-size: 16px;
    justify-content: center;
    line-height: 1em;
    max-width: 100%;
    min-width: ${props => props.$fullWidth ? 'auto' : '140px'};
    width: ${props => props.$fullWidth ? '100%' : 'auto'};
    padding: 3px;
    text-decoration: none;
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.3s;
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  button:active,
  button:hover:not(:disabled) {
    outline: 0;
  }

  button span {
    background-color: rgb(5, 6, 45);
    padding: 6px 12px;
    border-radius: 6px;
    width: 100%;
    height: 100%;
    transition: 300ms;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  button:hover:not(:disabled) span {
    background: none;
  }

  button:active:not(:disabled) {
    transform: scale(0.9);
  }
`;

export default GradientButton; 