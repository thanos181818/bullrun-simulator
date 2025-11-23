
import { checkAndAwardBadges } from './badge-service';
import * as firestore from 'firebase/firestore';
import type { Trade, Holding } from './types';

// This line tells Jest to mock the entire 'firebase/firestore' module.
jest.mock('firebase/firestore');

// We cast the mocked module to a typed version for better autocompletion and type safety.
const mockedFirestore = firestore as jest.Mocked<typeof firestore>;

// We create a mock function for the toast notifications to check if they are called.
const mockToast = jest.fn();

// This is the main test suite for our badge service.
describe('Badge Service - checkAndAwardBadges', () => {

  // This function runs before each test to reset mocks.
  beforeEach(() => {
    jest.clearAllMocks();

    // --- NEW: Centralized Mocking Setup ---
    // Mock the functions that are used inside checkAndAwardBadges.
    // This solves the "undefined" error.
    mockedFirestore.doc.mockReturnValue({ path: 'mock/path' } as any);
    mockedFirestore.arrayUnion.mockImplementation((value) => `arrayUnion(${value})` as any);
    // Default: no portfolio exists unless a test overrides it
    mockedFirestore.getDoc.mockResolvedValue({ exists: () => false, data: () => ({}) } as any);
  });

  // Test Case 1: Award "First Trade" Badge
  test('should award "first_trade" badge for a new user making their first trade', async () => {
    // ARRANGE: Set up the mock database responses for this specific test.
    // Mock the user document to simulate a user with no badges.
    mockedFirestore.getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ badgeIds: [] }),
    } as any);

    // Mock the 'all badges' collection call (first getDocs call)
    mockedFirestore.getDocs.mockResolvedValueOnce({
      empty: false,
      docs: [{ id: 'first_trade', data: () => ({ title: 'First Trade' }) }],
    } as any);

    // Mock the trades collection to simulate the user having exactly one trade (second getDocs call)
    mockedFirestore.getDocs.mockResolvedValueOnce({
      empty: false,
      docs: [{ data: () => ({ totalAmount: 100, assetType: 'stock' } as Trade) }],
    } as any);

    // ACT: Run the function we are testing.
    await checkAndAwardBadges(mockedFirestore as any, 'user-new', mockToast);

    // ASSERT: Check if the function behaved as expected.
    expect(mockedFirestore.updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      { badgeIds: "arrayUnion(first_trade)" }
    );
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: '🏆 Achievement Unlocked!' }));
  });

  // Test Case 2: Do NOT Award a Duplicate Badge
  test('should not award a badge if the user already has it', async () => {
    // ARRANGE
    // Mock user who already has the 'first_trade' badge.
    mockedFirestore.getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ badgeIds: ['first_trade'] }),
    } as any);
    
    // Mock the 'all badges' collection call (first getDocs call)
    mockedFirestore.getDocs.mockResolvedValueOnce({
      empty: false,
      docs: [{ id: 'first_trade', data: () => ({ title: 'First Trade' }) }],
    } as any);

    // Mock user having multiple trades (second getDocs call)
    mockedFirestore.getDocs.mockResolvedValueOnce({
      empty: false,
      docs: [
        { data: () => ({ totalAmount: 100 } as Trade) },
        { data: () => ({ totalAmount: 200 } as Trade) }
      ],
    } as any);

    // ACT
    await checkAndAwardBadges(mockedFirestore as any, 'user-experienced', mockToast);

    // ASSERT
    // The key expectation: updateDoc was NOT called.
    expect(mockedFirestore.updateDoc).not.toHaveBeenCalled();
    expect(mockToast).not.toHaveBeenCalled();
  });
  
  // Test Case 3: Award "Active Trader" Badge
  test('should award "active_trader" badge upon reaching 10 trades', async () => {
    // ARRANGE
    // Mock the 'all badges' collection call (first getDocs call)
    mockedFirestore.getDocs.mockResolvedValueOnce({
      empty: false,
      docs: [{ id: 'active_trader', data: () => ({ title: 'Active Trader' }) }],
    } as any);

    // Mock user doc
    mockedFirestore.getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ badgeIds: [] }) } as any);

    // Mock an array of 10 trades (second getDocs call)
    const tenTrades = Array(10).fill({ data: () => ({ totalAmount: 50 } as Trade) });
    mockedFirestore.getDocs.mockResolvedValueOnce({ empty: false, docs: tenTrades } as any);

    // ACT
    await checkAndAwardBadges(mockedFirestore as any, 'user-active', mockToast);

    // ASSERT
    expect(mockedFirestore.updateDoc).toHaveBeenCalledWith(expect.anything(), { badgeIds: "arrayUnion(active_trader)" });
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ description: expect.stringContaining('"Active Trader"') }));
  });

  // Test Case 4: Award "High Roller" Badge
  test('should award "high_roller" badge for a single trade over $10,000', async () => {
    // ARRANGE
    // Mock the 'all badges' collection call (first getDocs call)
    mockedFirestore.getDocs.mockResolvedValueOnce({
      empty: false,
      docs: [{ id: 'high_roller', data: () => ({ title: 'High Roller' }) }],
    } as any);

    // Mock user doc
    mockedFirestore.getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ badgeIds: [] }) } as any);

    // Mock trades including one very large trade (second getDocs call)
    mockedFirestore.getDocs.mockResolvedValueOnce({
      empty: false,
      docs: [
        { data: () => ({ totalAmount: 50 } as Trade) },
        { data: () => ({ totalAmount: 10001, assetType: 'stock' } as Trade) },
      ],
    } as any);

    // ACT
    await checkAndAwardBadges(mockedFirestore as any, 'user-whale', mockToast);

    // ASSERT
    expect(mockedFirestore.updateDoc).toHaveBeenCalledWith(expect.anything(), { badgeIds: "arrayUnion(high_roller)" });
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ description: expect.stringContaining('"High Roller"') }));
  });

  // Test Case 5: Award "Diversifier" Badge
  test('should award "diversifier" badge when portfolio holds 5 unique assets', async () => {
    // ARRANGE
    const portfolioWith5Assets = {
        exists: () => true,
        data: () => ({ 
            holdings: [
                { assetSymbol: 'AAPL' }, { assetSymbol: 'BTC' },
                { assetSymbol: 'TSLA' }, { assetSymbol: 'ETH' },
                { assetSymbol: 'GOOGL' },
            ] as Holding[],
        }),
    };
    
    // Mock the 'all badges' collection call (first getDocs call)
    mockedFirestore.getDocs.mockResolvedValueOnce({
      empty: false,
      docs: [{ id: 'diversifier', data: () => ({ title: 'Diversifier' }) }],
    } as any);

    // Mock getDoc to return user data, then portfolio data.
    mockedFirestore.getDoc
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ badgeIds: [] }) } as any) // User doc
      .mockResolvedValueOnce(portfolioWith5Assets as any); // Portfolio doc

    // Mock trades as empty since this badge doesn't depend on them (second getDocs call)
    mockedFirestore.getDocs.mockResolvedValueOnce({ empty: false, docs: [] } as any);
    
    // ACT
    await checkAndAwardBadges(mockedFirestore as any, 'user-diversified', mockToast);
    
    // ASSERT
    expect(mockedFirestore.updateDoc).toHaveBeenCalledWith(expect.anything(), { badgeIds: "arrayUnion(diversifier)" });
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ description: expect.stringContaining('"Diversifier"') }));
  });
});
