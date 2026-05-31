import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { TOTPSetupGuide } from '../components/auth/TOTPSetupGuide';
import { TwoFactorManagement } from '../components/auth/TwoFactorManagement';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// ── TOTPSetupGuide ────────────────────────────────────────────────────────────

describe('TOTPSetupGuide', () => {
  it('shows Get Started button on init stage', () => {
    render(<TOTPSetupGuide />);
    expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
  });

  it('QR scan simulation: calls initTOTP and renders QR image with secret', async () => {
    render(<TOTPSetupGuide />);
    fireEvent.click(screen.getByRole('button', { name: /get started/i }));

    await waitFor(() =>
      expect(screen.getByAltText('TOTP QR Code')).toBeInTheDocument()
    );
    expect(screen.getByAltText('TOTP QR Code')).toHaveAttribute('src', 'otpauth://totp/mock');
    expect(screen.getByText(/MOCK_SECRET/)).toBeInTheDocument();
  });

  it('code entry: enables Verify button only when 6 digits entered', async () => {
    render(<TOTPSetupGuide />);
    fireEvent.click(screen.getByRole('button', { name: /get started/i }));
    await waitFor(() => screen.getByAltText('TOTP QR Code'));

    const input = screen.getByPlaceholderText(/6-digit code/i);
    const verifyBtn = screen.getByRole('button', { name: /verify code/i });

    expect(verifyBtn).toBeDisabled();
    fireEvent.change(input, { target: { value: '12345' } });
    expect(verifyBtn).toBeDisabled();
    fireEvent.change(input, { target: { value: '123456' } });
    expect(verifyBtn).toBeEnabled();
  });

  it('code entry: submits code and shows backup codes', async () => {
    render(<TOTPSetupGuide />);
    fireEvent.click(screen.getByRole('button', { name: /get started/i }));
    await waitFor(() => screen.getByAltText('TOTP QR Code'));

    fireEvent.change(screen.getByPlaceholderText(/6-digit code/i), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: /verify code/i }));

    await waitFor(() =>
      expect(screen.getByText(/save backup codes/i)).toBeInTheDocument()
    );
    expect(screen.getByText('code1')).toBeInTheDocument();
    expect(screen.getByText('code2')).toBeInTheDocument();
    expect(screen.getByText('code3')).toBeInTheDocument();
  });

  it('backup code download: Copy All Codes writes all codes to clipboard', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<TOTPSetupGuide />);
    fireEvent.click(screen.getByRole('button', { name: /get started/i }));
    await waitFor(() => screen.getByAltText('TOTP QR Code'));
    fireEvent.change(screen.getByPlaceholderText(/6-digit code/i), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: /verify code/i }));
    await waitFor(() => screen.getByText(/save backup codes/i));

    fireEvent.click(screen.getByRole('button', { name: /copy all codes/i }));
    expect(writeText).toHaveBeenCalledWith('code1\ncode2\ncode3');
  });

  it('shows completion message after confirming saved codes', async () => {
    render(<TOTPSetupGuide />);
    fireEvent.click(screen.getByRole('button', { name: /get started/i }));
    await waitFor(() => screen.getByAltText('TOTP QR Code'));
    fireEvent.change(screen.getByPlaceholderText(/6-digit code/i), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: /verify code/i }));
    await waitFor(() => screen.getByText(/save backup codes/i));
    fireEvent.click(screen.getByRole('button', { name: /i have saved the codes/i }));

    await waitFor(() =>
      expect(screen.getByText(/two-factor authentication enabled/i)).toBeInTheDocument()
    );
  });

  it('shows error when verify API fails', async () => {
    server.use(
      http.post(`${API_URL}/auth/totp/verify`, () =>
        HttpResponse.json({ message: 'Invalid code' }, { status: 400 })
      )
    );

    render(<TOTPSetupGuide />);
    fireEvent.click(screen.getByRole('button', { name: /get started/i }));
    await waitFor(() => screen.getByAltText('TOTP QR Code'));
    fireEvent.change(screen.getByPlaceholderText(/6-digit code/i), {
      target: { value: '000000' },
    });
    fireEvent.click(screen.getByRole('button', { name: /verify code/i }));

    await waitFor(() =>
      expect(screen.getByText(/invalid verification code|invalid code/i)).toBeInTheDocument()
    );
  });
});

// ── TwoFactorManagement ───────────────────────────────────────────────────────

describe('TwoFactorManagement', () => {
  it('shows Not enabled when 2FA is disabled', async () => {
    render(<TwoFactorManagement />);
    await waitFor(() =>
      expect(screen.getByText(/not enabled/i)).toBeInTheDocument()
    );
  });

  it('shows Disable button when 2FA is enabled', async () => {
    server.use(
      http.get(`${API_URL}/auth/totp/status`, () =>
        HttpResponse.json({ enabled: true, last_verified: '2024-01-01T00:00:00Z' })
      )
    );

    render(<TwoFactorManagement />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /disable/i })).toBeInTheDocument()
    );
  });

  it('disable 2FA: shows code prompt and disables on valid code', async () => {
    server.use(
      http.get(`${API_URL}/auth/totp/status`, () =>
        HttpResponse.json({ enabled: true })
      )
    );

    render(<TwoFactorManagement />);
    await waitFor(() => screen.getByRole('button', { name: /disable/i }));
    fireEvent.click(screen.getByRole('button', { name: /disable/i }));

    expect(
      screen.getByPlaceholderText(/enter 6-digit code/i)
    ).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/enter 6-digit code/i), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: /disable 2fa/i }));

    await waitFor(() =>
      expect(screen.getByText(/not enabled/i)).toBeInTheDocument()
    );
  });

  it('disable 2FA: shows validation error for incomplete code', async () => {
    server.use(
      http.get(`${API_URL}/auth/totp/status`, () =>
        HttpResponse.json({ enabled: true })
      )
    );

    render(<TwoFactorManagement />);
    await waitFor(() => screen.getByRole('button', { name: /disable/i }));
    fireEvent.click(screen.getByRole('button', { name: /disable/i }));

    fireEvent.change(screen.getByPlaceholderText(/enter 6-digit code/i), {
      target: { value: '123' },
    });
    expect(screen.getByRole('button', { name: /disable 2fa/i })).toBeDisabled();
  });
});
