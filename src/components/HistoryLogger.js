import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const HistoryLogger = () => {
    const location = useLocation();
    const historyStack = useRef([]);

    useEffect(() => {
        // Detect if navigation was with replace
        const isReplace = window.history.state?.usr?.replace;

        if (isReplace && historyStack.current.length > 0) {
            // Replace last entry
            historyStack.current[historyStack.current.length - 1] = location.pathname;
        } else {
            // Push new entry
            historyStack.current.push(location.pathname);
        }

        console.log("📜 Current History Stack:", [...historyStack.current]);
    }, [location]);

    return null; // nothing visible in UI
};

export default HistoryLogger;