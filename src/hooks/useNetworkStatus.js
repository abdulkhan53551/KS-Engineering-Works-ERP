import { useEffect, useState } from "react";

const useNetworkStatus = () => {
    const [status, setStatus] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnOnline = () => setStatus(true);
        const handleOnOffline = () => setStatus(false);

        window.addEventListener('online', handleOnOnline)
        window.addEventListener('offline', handleOnOffline)

        return () => {
            window.removeEventListener('online', handleOnOnline);
            window.removeEventListener('offline', handleOnOffline);
        }
    }, [])

    return status;
}

export default useNetworkStatus;