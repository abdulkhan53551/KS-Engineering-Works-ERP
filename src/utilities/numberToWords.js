/**
 * Converts a numeric amount to Indian Rupee Words format
 * e.g. 76703.50 => "Rupees Seventy-Six Thousand Seven Hundred Three and Fifty Paise Only"
 * e.g. 100000 => "Rupees One Lakh Only"
 */
export function numberToIndianRupeesWords(amount) {
    const num = Number(amount);
    if (isNaN(num) || num === 0) {
        return "Rupees Zero Only";
    }

    const singleDigits = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const twoDigits = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tensMultiple = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    function convertTwoDigit(n) {
        if (n < 10) return singleDigits[n];
        if (n >= 10 && n < 20) return twoDigits[n - 10];
        const tens = Math.floor(n / 10);
        const unit = n % 10;
        return tensMultiple[tens] + (unit ? " " + singleDigits[unit] : "");
    }

    function convertThreeDigit(n) {
        let str = "";
        const hundred = Math.floor(n / 100);
        const rest = n % 100;
        if (hundred > 0) {
            str += singleDigits[hundred] + " Hundred";
            if (rest > 0) str += " and ";
        }
        if (rest > 0) {
            str += convertTwoDigit(rest);
        }
        return str.trim();
    }

    const absolute = Math.abs(num);
    const rupees = Math.floor(absolute);
    const paise = Math.round((absolute - rupees) * 100);

    let words = "";

    // Indian Numbering System: Crores, Lakhs, Thousands, Hundreds
    const crore = Math.floor(rupees / 10000000);
    const remCrore = rupees % 10000000;

    const lakh = Math.floor(remCrore / 100000);
    const remLakh = remCrore % 100000;

    const thousand = Math.floor(remLakh / 1000);
    const remThousand = remLakh % 1000;

    const hundred = remThousand;

    if (crore > 0) {
        words += convertThreeDigit(crore) + " Crore ";
    }
    if (lakh > 0) {
        words += convertTwoDigit(lakh) + " Lakh ";
    }
    if (thousand > 0) {
        words += convertTwoDigit(thousand) + " Thousand ";
    }
    if (hundred > 0) {
        words += convertThreeDigit(hundred);
    }

    words = words.trim();
    if (!words) {
        words = "Zero";
    }

    let result = (num < 0 ? "Minus Rupees " : "Rupees ") + words;

    if (paise > 0) {
        result += " and " + convertTwoDigit(paise) + " Paise";
    }

    result += " Only";

    return result;
}

export default numberToIndianRupeesWords;
