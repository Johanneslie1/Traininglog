import React, { useState } from 'react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (startDate?: Date, endDate?: Date, format?: 'csv' | 'json' | 'both') => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport }) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [useAllDates, setUseAllDates] = useState(true);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'both'>('both');

  if (!isOpen) return null;

  const handleExport = () => {
    if (useAllDates) {
      onExport(undefined, undefined, exportFormat);
    } else {
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;
      
      // Validate date range
      if (start && end && start > end) {
        alert('Start date must be before end date');
        return;
      }
      
      onExport(start, end, exportFormat);
    }
    onClose();
  };

  // Get today's date for max attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b border-border-secondary">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">Export Exercise Data</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-bg-secondary rounded-full transition-colors"
                aria-label="Close Modal"
              >
                <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-5">
            {/* File Format Selection */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-text-primary">File Format</h3>
              
              <div className="space-y-3">
                {/* CSV Option */}
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="formatOption"
                    value="csv"
                    checked={exportFormat === 'csv'}
                    onChange={(e) => setExportFormat(e.target.value as 'csv')}
                    className="w-4 h-4 text-primary-400 border-border-secondary bg-bg-primary focus:ring-primary-400 focus:ring-2"
                  />
                  <div>
                    <span className="text-text-primary font-medium">CSV only</span>
                    <p className="text-sm text-text-secondary">Spreadsheet format for analysis</p>
                  </div>
                </label>

                {/* JSON Option */}
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="formatOption"
                    value="json"
                    checked={exportFormat === 'json'}
                    onChange={(e) => setExportFormat(e.target.value as 'json')}
                    className="w-4 h-4 text-primary-400 border-border-secondary bg-bg-primary focus:ring-primary-400 focus:ring-2"
                  />
                  <div>
                    <span className="text-text-primary font-medium">JSON only</span>
                    <p className="text-sm text-text-secondary">Structured format for backup</p>
                  </div>
                </label>

                {/* Both Option */}
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="formatOption"
                    value="both"
                    checked={exportFormat === 'both'}
                    onChange={(e) => setExportFormat(e.target.value as 'both')}
                    className="w-4 h-4 text-primary-400 border-border-secondary bg-bg-primary focus:ring-primary-400 focus:ring-2"
                  />
                  <div>
                    <span className="text-text-primary font-medium">Both CSV and JSON</span>
                    <p className="text-sm text-text-secondary">Export in both formats</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Date Range Options */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-text-primary">Date Range</h3>
              
              {/* All Dates Option */}
              <label className="flex items-center space-x-3 p-2 rounded-lg hover:bg-bg-secondary/50 transition-colors cursor-pointer">
                <input
                  type="radio"
                  name="dateOption"
                  checked={useAllDates}
                  onChange={() => setUseAllDates(true)}
                  className="w-4 h-4 text-primary-400 border-border-secondary bg-bg-primary focus:ring-primary-400 focus:ring-2"
                />
                <span className="text-text-primary font-medium">Export all exercise logs</span>
              </label>

              {/* Custom Date Range Option */}
              <label className="flex items-center space-x-3 p-2 rounded-lg hover:bg-bg-secondary/50 transition-colors cursor-pointer">
                <input
                  type="radio"
                  name="dateOption"
                  checked={!useAllDates}
                  onChange={() => setUseAllDates(false)}
                  className="w-4 h-4 text-primary-400 border-border-secondary bg-bg-primary focus:ring-primary-400 focus:ring-2"
                />
                <span className="text-text-primary font-medium">Select custom date range</span>
              </label>

              {/* Date Range Inputs */}
              {!useAllDates && (
                <div className="ml-7 p-3 bg-bg-secondary/30 rounded-lg space-y-3 border border-border-secondary/50">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      max={today}
                      className="date-picker-dark w-full px-3 py-2 bg-bg-primary border border-border-secondary rounded-lg 
                                focus:ring-2 focus:ring-primary-400 focus:border-primary-400 
                                text-text-primary text-sm transition-colors duration-200
                                hover:border-primary-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      max={today}
                      min={startDate || undefined}
                      className="date-picker-dark w-full px-3 py-2 bg-bg-primary border border-border-secondary rounded-lg 
                                focus:ring-2 focus:ring-primary-400 focus:border-primary-400 
                                text-text-primary text-sm transition-colors duration-200
                                hover:border-primary-300"
                    />
                  </div>
                  {startDate && endDate && (
                    <div className="text-xs text-text-secondary">
                      📅 {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border-secondary flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              className="px-6 py-2 bg-primary-400 hover:bg-primary-500 text-white rounded-lg transition-colors font-medium"
            >
              Export {exportFormat === 'csv' ? 'CSV' : exportFormat === 'json' ? 'JSON' : 'Data'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExportModal;
