import React, { useState } from 'react';
import { DatabaseService } from '../../services/supabase';

export const MonetaryDonationForm: React.FC = () => {
  const [contributorName, setContributorName] = useState('');
  const [amount, setAmount] = useState('');
  const [donationType, setDonationType] = useState<'tix' | 'usd'>('usd');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!contributorName.trim()) {
      setErrorMessage('Please enter a contributor name');
      setSubmitStatus('error');
      return;
    }
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Please enter a valid amount greater than 0');
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      await DatabaseService.addMonetaryDonation({
        contributor_name: contributorName.trim(),
        amount: numAmount,
        donation_type: donationType,
        notes: notes.trim() || undefined
      });

      // Success - reset form
      setContributorName('');
      setAmount('');
      setNotes('');
      setSubmitStatus('success');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to submit donation:', error);
      setErrorMessage('Failed to submit donation. Please try again.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Log Monetary Donation</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="contributor" className="block text-sm font-medium text-gray-700 mb-1">
            Contributor Name
          </label>
          <input
            id="contributor"
            type="text"
            value={contributorName}
            onChange={(e) => setContributorName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter name or 'anon'"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <div className="flex gap-2">
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              disabled={isSubmitting}
            />
            <select
              value={donationType}
              onChange={(e) => setDonationType(e.target.value as 'tix' | 'usd')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value="usd">USD ($)</option>
              <option value="tix">MTGO Tix</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Any additional notes..."
            disabled={isSubmitting}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 px-4 rounded-md font-medium text-white transition-colors ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Donation'}
        </button>
      </form>

      {/* Status messages */}
      {submitStatus === 'success' && (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
          ✅ Donation logged successfully!
        </div>
      )}
      
      {submitStatus === 'error' && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          ❌ {errorMessage}
        </div>
      )}

      {/* Info about the 1:1 conversion */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-md text-sm">
        ℹ️ MTGO Tix and USD are tracked at a 1:1 ratio
      </div>
    </div>
  );
};