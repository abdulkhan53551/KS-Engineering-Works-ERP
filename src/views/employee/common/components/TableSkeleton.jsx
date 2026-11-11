import React from 'react';

/**
 * Reusable table skeleton loader with realistic shimmer placeholders.
 * 
 * @param {number} rows - Number of skeleton rows to render (default: 5)
 * @param {number} cols - Number of columns in table (default: 8)
 * @param {boolean} hasCheckbox - Whether first column contains a selection checkbox (default: false)
 * @param {boolean} hasAvatar - Whether there is a user avatar column (default: true)
 * @param {number} avatarColIndex - 0-indexed column position of the avatar (default: 1 if hasCheckbox, else 1)
 */
const TableSkeleton = ({
    rows = 5,
    cols = 8,
    hasCheckbox = false,
    hasAvatar = true,
    avatarColIndex = hasCheckbox ? 2 : 1
}) => {
    // Generate realistic column widths for columns
    const getColumnWidth = (colIdx) => {
        if (hasCheckbox && colIdx === 0) return '20px';
        if (hasAvatar && colIdx === avatarColIndex) return '140px';
        const widths = ['80px', '110px', '95px', '75px', '105px', '60px', '85px', '70px'];
        return widths[(colIdx + 2) % widths.length];
    };

    return (
        <>
            {Array.from({ length: rows }).map((_, rIdx) => (
                <tr key={`skeleton-row-${rIdx}`} className="skeleton-row align-middle">
                    {Array.from({ length: cols }).map((_, cIdx) => {
                        // Checkbox cell
                        if (hasCheckbox && cIdx === 0) {
                            return (
                                <td key={`skeleton-cell-${rIdx}-${cIdx}`} style={{ width: '40px' }}>
                                    <div
                                        className="skeleton-line rounded"
                                        style={{ width: '16px', height: '16px', display: 'block' }}
                                    />
                                </td>
                            );
                        }

                        // Avatar + name cell
                        if (hasAvatar && cIdx === avatarColIndex) {
                            return (
                                <td key={`skeleton-cell-${rIdx}-${cIdx}`}>
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="skeleton-circle" />
                                        <div className="d-flex flex-column gap-1 flex-grow-1" style={{ maxWidth: '160px' }}>
                                            <div
                                                className="skeleton-line"
                                                style={{ width: `${70 + (rIdx % 3) * 15}%`, height: '13px' }}
                                            />
                                            <div
                                                className="skeleton-line opacity-50"
                                                style={{ width: `${45 + (rIdx % 2) * 20}%`, height: '10px' }}
                                            />
                                        </div>
                                    </div>
                                </td>
                            );
                        }

                        // Status pill / action cell
                        if (cIdx === cols - 1) {
                            return (
                                <td key={`skeleton-cell-${rIdx}-${cIdx}`} className="text-end">
                                    <div
                                        className="skeleton-line rounded"
                                        style={{ width: '60px', height: '24px' }}
                                    />
                                </td>
                            );
                        }

                        // Standard text cell
                        return (
                            <td key={`skeleton-cell-${rIdx}-${cIdx}`}>
                                <div
                                    className="skeleton-line"
                                    style={{
                                        width: getColumnWidth(cIdx),
                                        height: '13px'
                                    }}
                                />
                            </td>
                        );
                    })}
                </tr>
            ))}
        </>
    );
};

export default React.memo(TableSkeleton);
