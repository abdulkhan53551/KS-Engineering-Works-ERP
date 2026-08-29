import { useMemo } from "react";
import moment from "moment";

export const DUE_PRESET_DAYS = [0, 15, 30, 45, 60, 90];

/**
 * Custom hook to manage Invoice Date, Due Date presets, and Flatpickr configurations
 */
export const useInvoiceDates = ({ invoiceDate, setValue }) => {
    // Due Date presets handler (0, 15, 30, 45, 60, 90 days)
    const handleDuePresetClick = (days) => {
        setValue("dueDays", days, { shouldValidate: true, shouldDirty: true });
        if (invoiceDate) {
            setValue(
                "dueDate",
                moment(invoiceDate).add(days, "days").toDate(),
                { shouldDirty: true, shouldValidate: true }
            );
        }
    };

    const invoiceDateOptons = useMemo(() => ({ dateFormat: "d/m/Y", defaultDate: ["today"] }), []);
    const dueDateOptons = useMemo(() => ({
        dateFormat: "d/m/Y",
        defaultDate: ["today"],
        minDate: invoiceDate || "today"
    }), [invoiceDate]);

    return {
        DUE_PRESET_DAYS,
        handleDuePresetClick,
        invoiceDateOptons,
        dueDateOptons
    };
};

export default useInvoiceDates;
