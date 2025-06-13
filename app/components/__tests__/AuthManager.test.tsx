import { render } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';
import AuthManager from '../AuthManager';
import { useAuth } from '@/app/context/AuthContext';
import { useAccount } from 'wagmi';

// Mock the dependencies
vi.mock('@/app/context/AuthContext');
vi.mock('wagmi');

const useAuthMock = useAuth as Mock;
const useAccountMock = useAccount as Mock;

describe('AuthManager component', () => {
  let signInMock: Mock;

  beforeEach(() => {
    // Reset mocks before each test
    signInMock = vi.fn();
    useAuthMock.mockReturnValue({
      signIn: signInMock,
      session: null,
      loading: false,
    });
    useAccountMock.mockReturnValue({
      isConnected: false,
      isConnecting: false,
    });
  });

  it('does not call signIn when wallet is not connected', () => {
    render(<AuthManager />);
    expect(signInMock).not.toHaveBeenCalled();
  });

  it('calls signIn when wallet is connected and there is no session', () => {
    useAccountMock.mockReturnValue({
      isConnected: true,
      isConnecting: false,
    });
    render(<AuthManager />);
    expect(signInMock).toHaveBeenCalledTimes(1);
  });

  it('does not call signIn if a session already exists', () => {
    useAccountMock.mockReturnValue({
      isConnected: true,
      isConnecting: false,
    });
    useAuthMock.mockReturnValue({
      signIn: signInMock,
      session: { user: {}, expires_at: 9999999999 }, // Mock session object
      loading: false,
    });
    render(<AuthManager />);
    expect(signInMock).not.toHaveBeenCalled();
  });

  it('does not call signIn if auth is in a loading state', () => {
    useAccountMock.mockReturnValue({
      isConnected: true,
      isConnecting: false,
    });
    useAuthMock.mockReturnValue({
      signIn: signInMock,
      session: null,
      loading: true,
    });
    render(<AuthManager />);
    expect(signInMock).not.toHaveBeenCalled();
  });

  it('does not call signIn if the wallet is in the process of connecting', () => {
    useAccountMock.mockReturnValue({
      isConnected: false,
      isConnecting: true,
    });
    render(<AuthManager />);
    expect(signInMock).not.toHaveBeenCalled();
  });

  it('calls signIn only once even with multiple re-renders', () => {
    useAccountMock.mockReturnValue({
      isConnected: true,
      isConnecting: false,
    });
    const { rerender } = render(<AuthManager />);
    // Rerender with the same props
    rerender(<AuthManager />);
    rerender(<AuthManager />);
    expect(signInMock).toHaveBeenCalledTimes(1);
  });
}); 