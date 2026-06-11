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
    (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
      if (url.includes('/trades')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ totalAmount: 100, assetType: 'other' }],
        });
      }
      if (url.includes('/portfolio')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ holdings: [] }),
        });
      }
      if (url.includes('/badges')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 'first_trade', title: 'First Trade' }],
        });
      }
      if (url.includes('/api/users/')) {
        if (options?.method === 'PATCH') {
          return Promise.resolve({ ok: true, json: async () => ({}) });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ badgeIds: [], email: 'user@test.com' }),
        });
      }
      return Promise.reject(new Error(`Unhandled: ${url}`));
    });

    await checkAndAwardBadges('user-new', mockToast);

    // Verify user update was called
    const patchCalls = (global.fetch as jest.Mock).mock.calls.filter(
      (call) => call[1]?.method === 'PATCH'
    );
    expect(patchCalls.length).toBeGreaterThan(0);
    const lastPatchCall = patchCalls[patchCalls.length - 1];
    expect(lastPatchCall[0]).toContain('/api/users/user-new');

    const body = JSON.parse(lastPatchCall[1].body);
    expect(body.badgeIds).toEqual(['first_trade']);
    expect(body.cashBalance).toBe(500);
    expect(body.balanceHistory[0].type).toBe('achievement');
    expect(body.balanceHistory[0].amount).toBe(500);
    expect(body.balanceHistory[0].reference).toBe('first_trade');
    expect(body.cashEarned).toBe(500);
    
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: '🎉 Achievement Unlocked!' }));
  });

  // Test Case 2: Do NOT Award a Duplicate Badge
  test('should not award a badge if the user already has it', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/trades')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ totalAmount: 100, assetType: 'other' }, { totalAmount: 200, assetType: 'other' }],
        });
      }
      if (url.includes('/portfolio')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ holdings: [] }),
        });
      }
      if (url.includes('/badges')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 'first_trade', title: 'First Trade' }],
        });
      }
      if (url.includes('/api/users/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ badgeIds: ['first_trade'], email: 'user@test.com' }),
        });
      }
      return Promise.reject(new Error(`Unhandled: ${url}`));
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
    const tenTrades = Array(10).fill({ totalAmount: 50, assetType: 'other' });

    (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
      if (url.includes('/trades')) {
        return Promise.resolve({
          ok: true,
          json: async () => tenTrades,
        });
      }
      if (url.includes('/portfolio')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ holdings: [] }),
        });
      }
      if (url.includes('/badges')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 'first_trade', title: 'First Trade' },
            { id: 'active_trader', title: 'Active Trader' },
          ],
        });
      }
      if (url.includes('/api/users/')) {
        if (options?.method === 'PATCH') {
          return Promise.resolve({ ok: true, json: async () => ({}) });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ badgeIds: [], email: 'user@test.com' }),
        });
      }
      return Promise.reject(new Error(`Unhandled: ${url}`));
    });

    await checkAndAwardBadges('user-active', mockToast);

    // Verify PATCH call
    const patchCalls = (global.fetch as jest.Mock).mock.calls.filter(
      (call) => call[1]?.method === 'PATCH'
    );
    expect(patchCalls.length).toBeGreaterThan(0);
    const lastPatchCall = patchCalls[patchCalls.length - 1];
    expect(lastPatchCall[0]).toContain('/api/users/user-active');

    const body = JSON.parse(lastPatchCall[1].body);
    expect(body.badgeIds).toEqual(['first_trade', 'active_trader']);
    expect(body.cashBalance).toBe(1000);
    expect(body.balanceHistory[0].reference).toBe('first_trade');
    expect(body.balanceHistory[1].reference).toBe('active_trader');
    expect(body.cashEarned).toBe(1000);
    
    expect(mockToast).toHaveBeenCalled();
  });

  // Test Case 4: Award "High Roller" Badge
  test('should award "high_roller" badge for a single trade over $10,000', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
      if (url.includes('/trades')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ totalAmount: 50, assetType: 'other' }, { totalAmount: 10001, assetType: 'other' }],
        });
      }
      if (url.includes('/portfolio')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ holdings: [] }),
        });
      }
      if (url.includes('/badges')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 'first_trade', title: 'First Trade' },
            { id: 'high_roller', title: 'High Roller' },
          ],
        });
      }
      if (url.includes('/api/users/')) {
        if (options?.method === 'PATCH') {
          return Promise.resolve({ ok: true, json: async () => ({}) });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ badgeIds: [], email: 'user@test.com' }),
        });
      }
      return Promise.reject(new Error(`Unhandled: ${url}`));
    });

    await checkAndAwardBadges('user-whale', mockToast);

    const patchCalls = (global.fetch as jest.Mock).mock.calls.filter(
      (call) => call[1]?.method === 'PATCH'
    );
    expect(patchCalls.length).toBeGreaterThan(0);
    const lastPatchCall = patchCalls[patchCalls.length - 1];
    expect(lastPatchCall[0]).toContain('/api/users/user-whale');
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

    (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
      if (url.includes('/trades')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      if (url.includes('/portfolio')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ holdings: fiveHoldings }),
        });
      }
      if (url.includes('/badges')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 'diversifier', title: 'Diversifier' }],
        });
      }
      if (url.includes('/api/users/')) {
        if (options?.method === 'PATCH') {
          return Promise.resolve({ ok: true, json: async () => ({}) });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ badgeIds: [], email: 'user@test.com' }),
        });
      }
      return Promise.reject(new Error(`Unhandled: ${url}`));
    });

    await checkAndAwardBadges('user-diversified', mockToast);

    const patchCalls = (global.fetch as jest.Mock).mock.calls.filter(
      (call) => call[1]?.method === 'PATCH'
    );
    expect(patchCalls.length).toBeGreaterThan(0);
    const lastPatchCall = patchCalls[patchCalls.length - 1];
    expect(lastPatchCall[0]).toContain('/api/users/user-diversified');
    expect(mockToast).toHaveBeenCalled();
  });
});
