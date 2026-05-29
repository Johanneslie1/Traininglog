import React from 'react';
import type { CoachRatingsRow } from '@/types/coachRatings';
import {
  formatLoad,
  formatNumber,
  formatRatio,
  formatTrendChange,
  getAcwrClass,
  getMetricClass,
  getMetricStatus,
  getSrpeClass,
  getTrendClass,
  wellnessColumns,
} from '@/features/health-dashboard/healthDashboardFormatters';

interface HealthLoadTableProps {
  rows: CoachRatingsRow[];
  isDayMode: boolean;
  firstColumnHeader: React.ReactNode;
  renderFirstColumn: (row: CoachRatingsRow) => React.ReactNode;
  warningsEnabled?: boolean;
  showStatusColumn?: boolean;
  renderStatusColumn?: (row: CoachRatingsRow) => React.ReactNode;
  expandedRowId?: string | null;
  renderExpandedRow?: (row: CoachRatingsRow) => React.ReactNode;
  renderHelp?: (id: string, text: string) => React.ReactNode;
  wrapperClassName?: string;
  scrollClassName?: string;
  tableClassName?: string;
  firstColumnHeaderClassName?: string;
  firstColumnCellClassName?: string;
  stickyHeader?: boolean;
}

export const HealthLoadTable: React.FC<HealthLoadTableProps> = ({
  rows,
  isDayMode,
  firstColumnHeader,
  renderFirstColumn,
  warningsEnabled = true,
  showStatusColumn = false,
  renderStatusColumn,
  expandedRowId = null,
  renderExpandedRow,
  renderHelp,
  wrapperClassName = 'overflow-hidden rounded-lg border border-border bg-bg-secondary',
  scrollClassName = 'mobile-scroll-area overflow-x-auto overflow-y-auto pb-2',
  tableClassName = 'min-w-[1040px] w-full text-sm',
  firstColumnHeaderClassName = 'px-3 py-2 text-left',
  firstColumnCellClassName = 'px-3 py-3 font-medium text-text-primary',
  stickyHeader = false,
}) => {
  const topHeaderClassName = stickyHeader
    ? 'sticky top-0 z-30 bg-bg-primary px-3 py-2 text-center border-r border-border'
    : 'px-3 py-2 text-center border-r border-border';
  const secondHeaderClassName = stickyHeader
    ? 'sticky top-[33px] z-30 bg-bg-tertiary px-3 py-2 text-center'
    : 'px-3 py-2 text-center';
  const colSpan = 15 + (showStatusColumn ? 1 : 0);

  return (
    <div className={wrapperClassName}>
      <div className={scrollClassName}>
        <table className={tableClassName}>
          <thead>
            <tr className="bg-bg-primary text-xs uppercase tracking-wide text-text-tertiary">
              <th className={firstColumnHeaderClassName} rowSpan={2}>{firstColumnHeader}</th>
              <th className={topHeaderClassName} colSpan={3}>Health</th>
              <th className={topHeaderClassName} colSpan={6}>Well-being</th>
              <th className={topHeaderClassName} colSpan={5}>Training Load</th>
              {showStatusColumn ? (
                <th className={stickyHeader ? 'sticky top-0 z-30 bg-bg-primary px-3 py-2 text-left' : 'px-3 py-2 text-left'} rowSpan={2}>
                  Status & Warnings
                </th>
              ) : null}
            </tr>
            <tr className="bg-bg-tertiary text-xs text-text-tertiary">
              <th className={secondHeaderClassName}>Notes</th>
              <th className={`${secondHeaderClassName} border-r border-border`}>
                {isDayMode ? 'Total' : 'Week Avg'}
                {renderHelp?.('table-total', isDayMode
                  ? 'Daily score: the average Wellness Readiness Score for the selected date only.'
                  : 'Weekly score: the average Wellness Readiness Score across submitted days in the selected week.')}
              </th>
              <th className={`${secondHeaderClassName} border-r border-border`}>
                {isDayMode ? 'Trend' : 'Reported'}
                {renderHelp?.('table-trend', isDayMode
                  ? "Change from the athlete's previous logged wellness day plus a simple status from their own 28-day baseline."
                  : 'Number of reported well-being days included in this weekly average. Empty days are not included.')}
              </th>
              {wellnessColumns.map((column) => (
                <th key={column.key} className={secondHeaderClassName}>
                  {column.label}
                  {renderHelp?.(`table-${column.key}`, column.help)}
                </th>
              ))}
              <th className={secondHeaderClassName}>
                {isDayMode ? 'RPE' : 'Avg RPE'}
                {renderHelp?.('table-srpe', 'Logged session RPE from 1 to 10. Weekly view averages only reported days.')}
              </th>
              <th className={secondHeaderClassName}>
                {isDayMode ? 'Min' : 'RPE Days'}
                {renderHelp?.('table-min', 'Duration for day view, or number of reported RPE days in week view.')}
              </th>
              <th className={secondHeaderClassName}>
                Sports Load
                {renderHelp?.('table-load', isDayMode
                  ? 'Selected-day sports load. For each athlete: RPE x duration minutes.'
                  : 'Total sports load across the selected week.')}
              </th>
              <th className={secondHeaderClassName}>
                {isDayMode ? 'Week Load' : 'Chronic Avg'}
                {renderHelp?.('table-week-load', isDayMode
                  ? 'Total sports load across the selected week.'
                  : 'Chronic average sports load per reported day over the last 28 days. Empty days are excluded.')}
              </th>
              <th className={`${secondHeaderClassName} border-r border-border`}>
                ACWR
                {renderHelp?.('table-acwr', 'ACWR = acute average daily load divided by chronic average daily load, using reported days only. Amber starts around 1.3; red starts at 1.5.')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <React.Fragment key={row.athleteId}>
                <tr className="transition-colors hover:bg-bg-tertiary/60">
                  <td className={firstColumnCellClassName}>{renderFirstColumn(row)}</td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={row.wellnessSnapshot.hasNotes ? 'font-semibold text-success-text' : 'text-text-tertiary'}
                      title={row.wellnessSnapshot.notes || undefined}
                    >
                      {row.wellnessSnapshot.hasNotes ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className={`border-r border-border px-3 py-3 text-center ${getMetricClass(row.status, warningsEnabled)}`}>
                    <div>{formatNumber(row.wellnessSnapshot.score)}</div>
                    {!isDayMode ? null : !row.wellnessSnapshot.isSelectedDate && row.wellnessSnapshot.date ? (
                      <div className="text-[11px] text-text-tertiary">{row.wellnessSnapshot.date}</div>
                    ) : null}
                  </td>
                  <td className={`border-r border-border px-3 py-3 text-center ${getTrendClass(row.wellnessTrend, warningsEnabled)}`}>
                    {isDayMode ? (
                      <>
                        <div>{formatTrendChange(row.wellnessTrend.changeFromPrevious)}</div>
                        <div className="text-[11px] text-current opacity-80">{row.wellnessTrend.label}</div>
                      </>
                    ) : (
                      <>
                        <div>{row.wellnessSnapshot.submittedDays}/{row.wellnessSnapshot.totalDays}</div>
                        <div className="text-[11px] text-current opacity-80">reported days</div>
                      </>
                    )}
                  </td>
                  {wellnessColumns.map((column) => {
                    const value = row.wellnessSnapshot.metricValues[column.key];
                    const status = getMetricStatus(row, column.key);

                    return (
                      <td
                        key={column.key}
                        className={`px-3 py-3 text-center ${getMetricClass(status, warningsEnabled)}`}
                      >
                        {typeof value === 'number' ? formatNumber(value) : '-'}
                      </td>
                    );
                  })}
                  <td className={`px-3 py-3 text-center ${getSrpeClass(row, warningsEnabled)}`}>
                    {isDayMode ? formatNumber(row.dailySrpe.rpe) : formatNumber(row.weeklySrpe.averageRpe)}
                  </td>
                  <td className="px-3 py-3 text-center text-text-primary">
                    {isDayMode
                      ? row.dailySrpe.submitted ? row.dailySrpe.durationMinutes : '-'
                      : `${row.weeklySrpe.submittedDays}/${row.wellnessSnapshot.totalDays}`}
                  </td>
                  <td className="px-3 py-3 text-center text-text-primary">
                    {isDayMode ? formatLoad(row.dailySrpe.sessionLoad) : formatLoad(row.weeklySrpe.totalLoad)}
                  </td>
                  <td className="px-3 py-3 text-center text-text-primary">
                    {isDayMode ? (
                      formatLoad(row.weeklySrpe.totalLoad)
                    ) : (
                      <>
                        <div>{formatLoad(row.acwr.chronicDailyAverageLoad)}</div>
                        <div className="text-[11px] text-text-tertiary">{row.acwr.chronicReportedDays} days</div>
                      </>
                    )}
                  </td>
                  <td className={`border-r border-border px-3 py-3 text-center ${getAcwrClass(row, warningsEnabled)}`}>
                    <div>{formatRatio(row.acwr.ratio)}</div>
                    <div className="text-[11px] text-current opacity-80">{row.acwr.label}</div>
                  </td>
                  {showStatusColumn ? (
                    <td className="px-3 py-3">
                      {renderStatusColumn?.(row)}
                    </td>
                  ) : null}
                </tr>
                {expandedRowId === row.athleteId && renderExpandedRow ? (
                  <tr className="bg-bg-tertiary/40">
                    <td colSpan={colSpan} className="border-t border-border px-4 py-4">
                      {renderExpandedRow(row)}
                    </td>
                  </tr>
                ) : null}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
