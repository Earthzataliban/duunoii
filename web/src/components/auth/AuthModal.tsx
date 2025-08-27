'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, defaultMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);

  const handleSuccess = () => {
    onClose();
  };

  const switchToRegister = () => setMode('register');
  const switchToLogin = () => setMode('login');

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50" />
        <Dialog.Content className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 bg-white p-6 shadow-lg duration-200 rounded-lg">
          <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Dialog.Close>
          
          <div className="mt-6">
            {mode === 'login' ? (
              <LoginForm onSuccess={handleSuccess} onSwitchToRegister={switchToRegister} />
            ) : (
              <RegisterForm onSuccess={handleSuccess} onSwitchToLogin={switchToLogin} />
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}