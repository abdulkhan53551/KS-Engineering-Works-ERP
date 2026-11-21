/**
 * Delivery Challan Numbering Utilities
 * Provides consecutive numbering increment logic and zero-API-call React Query cache derivation.
 */

/**
 * Calculates the next sequential alphanumeric string from an existing number.
 * e.g. "DC-0005" -> "DC-0006", "INV-102" -> "DC-103", "12" -> "13"
 */
export const calculateNextSequentialNumber = (currentNo, defaultPrefix = 'DC-') => {
    if (!currentNo) return `${defaultPrefix}0001`;
    const str = String(currentNo).trim();
    const match = str.match(/\d+$/);
    if (!match) {
        return `${str}-0001`;
    }
    const numStr = match[0];
    const prefix = str.substring(0, str.length - numStr.length);
    const nextNum = String(Number(numStr) + 1).padStart(numStr.length, '0');
    return `${prefix}${nextNum}`;
};

/**
 * Derives the estimated preview next challan number directly from the React Query cache.
 * Makes 0 API calls. Checks existing invoice challan queries, or invoice queries, or falls back to 'DC-0001'.
 *
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @returns {string} Estimated next challan number
 */
export const getPreviewNextChallanNumber = (queryClient) => {
    if (!queryClient) return 'DC-0001';

    try {
        // 1. Check all cached invoice challan queries
        const challanQueries = queryClient.getQueriesData({ queryKey: ['invoiceChallanList'] }) || [];
        for (const [, data] of challanQueries) {
            if (Array.isArray(data) && data.length > 0) {
                const firstWithNo = data.find(it => it?.challanNo || it?.challan_no);
                if (firstWithNo) {
                    const rawNo = firstWithNo.challanNo || firstWithNo.challan_no;
                    return calculateNextSequentialNumber(rawNo, 'DC-');
                }
            }
        }

        // 2. Check cached challan pagination queries
        const paginationQueries = queryClient.getQueriesData({ queryKey: ['invoiceChallanPagination'] }) || [];
        for (const [, data] of paginationQueries) {
            const list = data?.data || data?.items || data?.pagination?.items;
            if (Array.isArray(list) && list.length > 0) {
                const firstWithNo = list.find(it => it?.challanNo || it?.challan_no);
                if (firstWithNo) {
                    const rawNo = firstWithNo.challanNo || firstWithNo.challan_no;
                    return calculateNextSequentialNumber(rawNo, 'DC-');
                }
            }
        }

        // 3. Check cached invoice queries as reference (as mentioned by user)
        const invoiceQueries = queryClient.getQueriesData({ queryKey: ['invoiceList'] }) || [];
        for (const [, data] of invoiceQueries) {
            const list = Array.isArray(data) ? data : data?.data;
            if (Array.isArray(list) && list.length > 0) {
                const firstWithNo = list.find(it => it?.invoiceNo || it?.invoice_no);
                if (firstWithNo) {
                    const rawNo = firstWithNo.invoiceNo || firstWithNo.invoice_no;
                    const numMatch = String(rawNo).match(/\d+$/);
                    if (numMatch) {
                        const numStr = numMatch[0];
                        const nextNum = String(Number(numStr) + 1).padStart(numStr.length, '0');
                        return `DC-${nextNum}`;
                    }
                }
            }
        }

        // 4. Default starting challan number
        return 'DC-0001';
    } catch (e) {
        return 'DC-0001';
    }
};

