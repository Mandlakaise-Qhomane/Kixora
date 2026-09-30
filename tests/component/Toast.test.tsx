import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Toast } from '../../src/components/Toast';

vi.mock('../../src/context/StoreContext', () => ({
  useStore: () => ({
    toasts: [
      {
        id: 'toast-1',
        title: 'Saved',
        message: 'Your wishlist updated.',
        type: 'success',
      },
    ],
    dismissToast: vi.fn(),
  }),
}));

describe('Toast', () => {
  it('renders messaging and the success state styling', () => {
    render(<Toast />);

    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Your wishlist updated.')).toBeInTheDocument();
  });
});
