/**
 * Comprehensive Indian GST State Data & Aliases
 * Key: 2-digit GST state code string ('01' to '38', '97')
 * Value: { name: Standard Name, aliases: Array of spelling variants & abbreviations }
 */
export const GST_STATE_DATA = {
    "01": {
        name: "Jammu and Kashmir",
        aliases: ["jammu and kashmir", "jammu & kashmir", "jammu kashmir", "j&k", "jammu", "kashmir"]
    },
    "02": {
        name: "Himachal Pradesh",
        aliases: ["himachal pradesh", "himachal", "hp"]
    },
    "03": {
        name: "Punjab",
        aliases: ["punjab", "pb"]
    },
    "04": {
        name: "Chandigarh",
        aliases: ["chandigarh", "ch"]
    },
    "05": {
        name: "Uttarakhand",
        aliases: ["uttarakhand", "uttaranchal", "uttarkhand", "uk"]
    },
    "06": {
        name: "Haryana",
        aliases: ["haryana", "hr"]
    },
    "07": {
        name: "Delhi",
        aliases: ["delhi", "new delhi", "nct of delhi", "dl"]
    },
    "08": {
        name: "Rajasthan",
        aliases: ["rajasthan", "rj"]
    },
    "09": {
        name: "Uttar Pradesh",
        aliases: ["uttar pradesh", "up"]
    },
    "10": {
        name: "Bihar",
        aliases: ["bihar", "br"]
    },
    "11": {
        name: "Sikkim",
        aliases: ["sikkim", "sk"]
    },
    "12": {
        name: "Arunachal Pradesh",
        aliases: ["arunachal pradesh", "arunachal", "ar"]
    },
    "13": {
        name: "Nagaland",
        aliases: ["nagaland", "nl"]
    },
    "14": {
        name: "Manipur",
        aliases: ["manipur", "mn"]
    },
    "15": {
        name: "Mizoram",
        aliases: ["mizoram", "mz"]
    },
    "16": {
        name: "Tripura",
        aliases: ["tripura", "tr"]
    },
    "17": {
        name: "Meghalaya",
        aliases: ["meghalaya", "ml"]
    },
    "18": {
        name: "Assam",
        aliases: ["assam", "as"]
    },
    "19": {
        name: "West Bengal",
        aliases: ["west bengal", "bengal", "wb", "paschim banga"]
    },
    "20": {
        name: "Jharkhand",
        aliases: ["jharkhand", "jh"]
    },
    "21": {
        name: "Odisha",
        aliases: ["odisha", "orissa", "or", "od"]
    },
    "22": {
        name: "Chhattisgarh",
        aliases: [
            "chhattisgarh",
            "chattisgarh",
            "chhatisgarh",
            "chhattishgarh",
            "chhatisgadh",
            "cg",
            "ct"
        ]
    },
    "23": {
        name: "Madhya Pradesh",
        aliases: ["madhya pradesh", "mp"]
    },
    "24": {
        name: "Gujarat",
        aliases: ["gujarat", "gujrat", "gj"]
    },
    "26": {
        name: "Dadra and Nagar Haveli and Daman and Diu",
        aliases: [
            "dadra and nagar haveli and daman and diu",
            "dadra & nagar haveli and daman & diu",
            "dadra and nagar haveli",
            "dadra & nagar haveli",
            "daman and diu",
            "daman & diu",
            "dnh and dd",
            "dnh & dd",
            "dnh",
            "dd"
        ]
    },
    "27": {
        name: "Maharashtra",
        aliases: ["maharashtra", "maharastra", "mh"]
    },
    "28": {
        name: "Andhra Pradesh",
        aliases: ["andhra pradesh", "andhra", "ap", "andhra pradesh (old)"]
    },
    "29": {
        name: "Karnataka",
        aliases: ["karnataka", "ka"]
    },
    "30": {
        name: "Goa",
        aliases: ["goa", "ga"]
    },
    "31": {
        name: "Lakshadweep",
        aliases: ["lakshadweep", "lakshdweep", "lakshadeep", "lakshadweep islands", "ld"]
    },
    "32": {
        name: "Kerala",
        aliases: ["kerala", "kl"]
    },
    "33": {
        name: "Tamil Nadu",
        aliases: ["tamil nadu", "tamilnadu", "tamil nad", "tn"]
    },
    "34": {
        name: "Puducherry",
        aliases: ["puducherry", "pondicherry", "pondichery", "pondy", "py"]
    },
    "35": {
        name: "Andaman and Nicobar Islands",
        aliases: [
            "andaman and nicobar islands",
            "andaman & nicobar islands",
            "andaman and nicobar",
            "andaman & nicobar",
            "andaman",
            "an"
        ]
    },
    "36": {
        name: "Telangana",
        aliases: ["telangana", "telengana", "ts", "tg"]
    },
    "37": {
        name: "Andhra Pradesh",
        aliases: ["andhra pradesh", "andhra", "ap", "andhra pradesh (new)"]
    },
    "38": {
        name: "Ladakh",
        aliases: ["ladakh", "la"]
    },
    "97": {
        name: "Other Territory",
        aliases: ["other territory", "other"]
    }
};

/**
 * Backward-compatible GST_STATE_CODES object (code -> name)
 */
export const GST_STATE_CODES = Object.fromEntries(
    Object.entries(GST_STATE_DATA).map(([code, data]) => [code, data.name])
);

/**
 * Normalizes state name for robust fuzzy matching
 * (Handles '&' vs 'and', lowercase, punctuation, extra spaces)
 */
export const normalizeStateName = (name) => {
    if (!name || typeof name !== 'string') return '';
    return name
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/\b(state|ut|union territory|india)\b/gi, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
};

/**
 * Finds the exact Database State Object matching a 2-digit GST State Code
 * @param {string|number} gstCode - 2-digit GST code (e.g. "22", "24", "27", "28", "07")
 * @param {Array} statesList - Array of state objects from DB (e.g. [{ id: 1, name: "Andhra Pradesh" }, ...])
 * @returns {Object|null} - Matching state object { id, name } or null
 */
export const findDbStateByGstCode = (gstCode, statesList = []) => {
    if (!gstCode || !Array.isArray(statesList) || statesList.length === 0) return null;

    const formattedCode = String(gstCode).trim().padStart(2, '0');
    const stateData = GST_STATE_DATA[formattedCode];
    if (!stateData) return null;

    const normalizedStandard = normalizeStateName(stateData.name);
    const normalizedAliases = stateData.aliases.map(normalizeStateName);

    // 1. Exact or Alias Normalized Name Match (e.g. "Chattisgarh" <-> "Chhattisgarh", "Gujrat" <-> "Gujarat")
    let found = statesList.find((s) => {
        const sNameNormalized = normalizeStateName(s.name || s.stateName);
        return (
            sNameNormalized === normalizedStandard ||
            normalizedAliases.includes(sNameNormalized)
        );
    });
    if (found) return found;

    // 2. Substring matching for compound names
    found = statesList.find((s) => {
        const sNameNormalized = normalizeStateName(s.name || s.stateName);
        if (!sNameNormalized || sNameNormalized.length < 3) return false;
        return normalizedAliases.some(
            (alias) => alias.length >= 4 && (sNameNormalized.includes(alias) || alias.includes(sNameNormalized))
        );
    });
    if (found) return found;

    // 3. Match by explicit state code column if provided by API (e.g. s.code / s.stateCode / s.tinCode)
    found = statesList.find((s) => {
        const sCode = String(s.code || s.stateCode || s.tinCode || '').trim().padStart(2, '0');
        return sCode === formattedCode;
    });
    if (found) return found;

    return null;
};

/**
 * Resolves the 2-digit GST State Code from a Database State ID or Object
 * @param {number|string|Object} stateIdOrObj - State ID (e.g. 1) or State Object
 * @param {Array} statesList - Array of state objects from DB
 * @returns {string|null} - 2-digit GST code (e.g. "27", "28") or null
 */
export const getGstCodeByDbState = (stateIdOrObj, statesList = []) => {
    if (!stateIdOrObj) return null;

    let stateName = '';
    let directCode = '';

    if (typeof stateIdOrObj === 'object' && stateIdOrObj !== null) {
        stateName = stateIdOrObj.name || stateIdOrObj.stateName || '';
        directCode = stateIdOrObj.code || stateIdOrObj.stateCode || stateIdOrObj.tinCode || '';
    } else if (Array.isArray(statesList) && statesList.length > 0) {
        const found = statesList.find((s) => Number(s.id || s.stateId) === Number(stateIdOrObj));
        if (found) {
            stateName = found.name || found.stateName || '';
            directCode = found.code || found.stateCode || found.tinCode || '';
        }
    }

    // Direct code if available and valid in GST map
    if (directCode) {
        const formatted = String(directCode).trim().padStart(2, '0');
        if (GST_STATE_DATA[formatted]) return formatted;
    }

    // Name lookup in GST map & aliases
    if (stateName) {
        const normalized = normalizeStateName(stateName);
        for (const [code, data] of Object.entries(GST_STATE_DATA)) {
            if (
                normalizeStateName(data.name) === normalized ||
                data.aliases.some((a) => normalizeStateName(a) === normalized)
            ) {
                return code;
            }
        }
        // Substring fallback
        for (const [code, data] of Object.entries(GST_STATE_DATA)) {
            if (
                data.aliases.some(
                    (a) => a.length >= 4 && (normalized.includes(normalizeStateName(a)) || normalizeStateName(a).includes(normalized))
                )
            ) {
                return code;
            }
        }
    }

    return null;
};

/**
 * Derives the Supplier Firm's 2-digit GST State Code
 * @param {number|string|Object} companyStateIdOrObj - Firm GSTIN, 2-digit GST code, DB state ID, or firm object (default: Maharashtra 27)
 * @param {Array} statesList - Master states list from API
 * @returns {string} - 2-digit GST code (e.g., "27")
 */
export const resolveSupplierGstCode = (companyStateIdOrObj, statesList = []) => {
    // 1. If an object is passed (e.g. firm object or invoice master with firm_gstin)
    if (typeof companyStateIdOrObj === 'object' && companyStateIdOrObj !== null) {
        const gstin = companyStateIdOrObj.gstin || companyStateIdOrObj.firm_gstin || companyStateIdOrObj.firmGstin;
        if (gstin && String(gstin).trim().length >= 2) {
            const prefix = String(gstin).trim().substring(0, 2).toUpperCase();
            if (GST_STATE_DATA[prefix]) return prefix;
        }
        if (companyStateIdOrObj.stateId) {
            return resolveSupplierGstCode(companyStateIdOrObj.stateId, statesList);
        }
    }

    // 2. If a string is passed
    if (typeof companyStateIdOrObj === 'string') {
        const str = companyStateIdOrObj.trim().toUpperCase();
        // 15-character GSTIN
        if (str.length >= 15 && GST_STATE_DATA[str.substring(0, 2)]) {
            return str.substring(0, 2);
        }
        // Explicit 2-digit GST Code string (e.g. "27", "24")
        if (str.length === 2 && GST_STATE_DATA[str]) {
            return str;
        }
    }

    // 3. If a DB State ID is passed, resolve via database statesList
    // (Excluding 27, which in legacy usage represented Maharashtra's GST code rather than Pondicherry's DB ID)
    if (companyStateIdOrObj && companyStateIdOrObj !== 27) {
        const code = getGstCodeByDbState(companyStateIdOrObj, statesList);
        if (code) return code;
    }

    // Default supplier firm is Maharashtra (GST code "27")
    return "27";
};

/**
 * Derives the Recipient / Place of Supply 2-digit GST State Code
 * Strictly adheres to Chapter V of the IGST Act, 2017:
 * - Sec 10(1)(b) & Sec 12(2)(a): In Bill-To / Ship-To transactions and registered B2B supplies,
 *   the Place of Supply (POS) is legally deemed to be the Buyer's principal place of business (Bill-To State / GSTIN).
 * - Sec 10(1)(a): Direct supplies terminate at the buyer's destination.
 * 
 * Hierarchy:
 * 1. Registered Buyer GSTIN: The 2-digit state code prefix of the Bill-To GSTIN (Sec 12(2)(a) & Sec 10(1)(b)).
 * 2. Billing Address State ID: Buyer's registered/principal place of business (Sec 10(1)(b)).
 * 3. Shipping Address State ID: Destination fallback if billing state is unspecified.
 *
 * @param {Object} params - { hasGst, gstNumber, billingStateId, shippingStateId }
 * @param {Array} statesList - Master states list from API
 * @returns {string|null} - 2-digit GST code of Place of Supply
 */
export const resolveRecipientGstCode = ({ hasGst, gstNumber, billingStateId, shippingStateId }, statesList = []) => {
    // 1. If GST is enabled and valid 2-digit GSTIN prefix is present, registered buyer GSTIN strictly defines POS
    if (hasGst && gstNumber && String(gstNumber).trim().length >= 2) {
        const gstPrefix = String(gstNumber).trim().substring(0, 2).toUpperCase();
        if (GST_STATE_DATA[gstPrefix]) {
            return gstPrefix;
        }
    }

    // 2. Billing State ID: In "Bill-To / Ship-To" (Sec 10(1)(b)), POS is deemed to be the Buyer's principal place of business (Bill-To State)
    if (billingStateId) {
        const billingGstCode = getGstCodeByDbState(billingStateId, statesList);
        if (billingGstCode) return billingGstCode;
    }

    // 3. Fallback to Shipping State ID if billing state is not provided
    if (shippingStateId) {
        const shippingGstCode = getGstCodeByDbState(shippingStateId, statesList);
        if (shippingGstCode) return shippingGstCode;
    }

    return null;
};

/**
 * Determines whether an invoice is Inter-State (IGST) or Intra-State (CGST + SGST)
 * @param {string} supplierGstCode - 2-digit GST code of Supplier (e.g., "27")
 * @param {string} recipientGstCode - 2-digit GST code of Recipient (e.g., "28")
 * @returns {boolean} - true for IGST (Inter-State), false for CGST+SGST (Intra-State)
 */
export const determineIsInterState = (supplierGstCode, recipientGstCode) => {
    if (!supplierGstCode || !recipientGstCode) return false;
    return String(supplierGstCode).trim() !== String(recipientGstCode).trim();
};
