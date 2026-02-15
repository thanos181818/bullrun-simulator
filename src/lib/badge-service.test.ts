import { checkAndAwardBadges } from './badge-service';
import type { Trade, Holding } from './types';

// Mock fetch globally
global.fetch = jest.fn();

const mockToast = jest.fn();

describe('Badge Service - checkAndAwardBadges', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  // Test Case 1: Award "First Trade" Badge
  test('should award "first_trade" badge for a new user making their first trade', async () => {
    // Mock user data
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ badgeIds: [], email: 'user@test.com' }),
      })
      // Mock badges data
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 'first_trade', title: 'First Trade' }],
      })
      // Mock trades data
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ totalAmount: 100, assetType: 'stock' }],
      })
      // Mock portfolio data
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ holdings: [] }),
      })
      // Mock user update
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    await checkAndAwardBadges('user-new', mockToast);

    // Verify user update was called with first_trade badge
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/users/user-new'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ badgeIds: ['first_trade'] }),
      })
    );
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: '🏆 Achievement Unlocked!' }));
  });

  // Test Case 2: Do NOT Award a Duplicate Badge
  test('should not award a badge if the user already has it', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ badgeIds: ['first_trade'], email: 'user@test.com' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 'first_trade', title: 'First Trade' }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ totalAmount: 100 }, { totalAmount: 200 }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ holdings: [] }),
      });

    await checkAndAwardBadges('user-experienced', mockToast);

    // Verify no PATCH calls were made
    const patchCalls = (global.fetch as jest.Mock).mock.calls.filter(
      (call) => call[1]?.method === 'PATCH'
    );
    expect(patchCalls).toHaveLength(0);
    expect(mockToast).not.toHaveBeenCalled();
  });

  // Test Case 3: Award "Active Trader" Badge
  test('should award "active_trader" badge upon reaching 10 trades', async () => {
    const tenTrades = Array(10).fill({ totalAmount: 50 });

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ badgeIds: [], email: 'user@test.com' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 'active_trader', title: 'Active Trader' }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => tenTrades,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ holdings: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    await checkAndAwardBadges('user-active', mockToast);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/users/user-active'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ badgeIds: ['first_trade', 'active_trader'] }),
      })
    );
    expect(mockToast).toHaveBeenCalled();
  });

  // Test Case 4: Award "High Roller" Badge
  test('should award "high_roller" badge for a single trade over $10,000', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ badgeIds: [], email: 'user@test.com' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 'high_roller', title: 'High Roller' }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ totalAmount: 50 }, { totalAmount: 10001, assetType: 'stock' }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ holdings: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    await checkAndAwardBadges('user-whale', mockToast);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/users/user-whale'),
      expect.objectContaining({
        method: 'PATCH',
      })
    );
    expect(mockToast).toHaveBeenCalled();
  });

  // Test Case 5: Award "Diversifier" Badge
  test('should award "diversifier" badge when portfolio holds 5 unique assets', async () => {
    const fiveHoldings = [
      { assetSymbol: 'AAPL' },
      { assetSymbol: 'BTC' },
      { assetSymbol: 'TSLA' },
      { assetSymbol: 'ETH' },
      { assetSymbol: 'GOOGL' },
    ];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ badgeIds: [], email: 'user@test.com' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 'diversifier', title: 'Diversifier' }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ holdings: fiveHoldings }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    await checkAndAwardBadges('user-diversified', mockToast);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/users/user-diversified'),
      expect.objectContaining({
        method: 'PATCH',
      })
    );
    expect(mockToast).toHaveBeenCalled();
  });
});
