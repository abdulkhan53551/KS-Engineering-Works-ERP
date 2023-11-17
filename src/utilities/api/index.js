// import NetInfo from '@react-native-community/netinfo';
import axios from 'axios'
import { BASE_URL, TIME_OUT, requestMethod } from './constants';
// import { BASE_URL } from './constants';
// import { navigationRef } from '../../Route/Routes';
import useNetworkStatus from '../../hooks/useNetworkStatus';
import { strings } from './errorMessages';

// export const networkAvailable = () => new Promise((resolve, reject) => NetInfo.fetch().then(state => state.isConnected ? resolve(true) : resolve(false)))

export const serverCall = async (url, method, data, additionalHeader, selectedUser, isFromPromo = false) => new Promise(async (resolve, reject) => {
    // let screenName = navigationRef.current?.getCurrentRoute().name;
    let screenName = null;

    const CancelToken = axios.CancelToken;
    const source = CancelToken.source();

    var headers = {
        'Content-Type': 'application/json',
    }

    headers = { ...headers, ...additionalHeader }

    var timeout = TIME_OUT
    let baseURL = BASE_URL
    let requestObject = {}

    if (method == requestMethod.GET) {
        requestObject = {
            url, method, baseURL: `${baseURL}`, timeout, timeoutErrorMessage: strings.request_timeout, responseType: 'json', headers, cancelToken: source.token
        }
    } else {
        requestObject = {
            url, method, baseURL: `${baseURL}`, data, timeout, timeoutErrorMessage: strings.request_timeout, responseType: 'json', headers, cancelToken: source.token
        }
    }

    // let net = await networkAvailable()
    // let net = useNetworkStatus();
    let net = true;

    if (!net) {
        resolve({ success: false, data: {}, message: strings.no_internet })
    } else {
        let timer;
        let isRequestTimeout = false;
        let response = null;

        timer = setTimeout(() => {
            if (response === null) {
                isRequestTimeout = true;
                source.cancel();
            }
        }, timeout);

        var startTime = performance.now();

        axios.request(requestObject)
            .then(async (response) => {
                clearTimeout(timer);
                var EndTime = performance.now();

                let responseTimeInSeconds = (((EndTime - startTime) / 1000) % 60).toFixed(2);

                if (response.status === 200) {
                    resolve({ success: true, data: response.data, message: response.data.message ?? null, requestObject, responseTimeInSeconds, screenName })
                } else {
                    resolve({ success: false, data: {}, message: '', requestObject, responseTimeInSeconds, screenName })
                }
            })
            .catch(async (error) => {
                clearTimeout(timer);
                console.log('API ERROR:-', error.response ? JSON.stringify(error.response) : JSON.stringify(error));

                const isCanceled = error?.toString()?.includes('CanceledError: canceled') || false
                if (error.isAxiosError) {
                    if (error.toString().includes(strings.request_timeout)) {
                        if (isRequestTimeout) {
                            resolve({ success: false, message: strings.request_timeout, requestObject })
                        }
                        else {
                            resolve({ success: false, message: strings.poor_network, requestObject })
                        }
                    } else if (error.toString().includes('Network Error')) {
                        resolve({ success: false, message: strings.poor_network, requestObject })
                    } else if (isCanceled) {
                        resolve({ success: false, message: strings.request_timeout, requestObject });
                    } else {
                        resolve({ success: false, data: error.response.data, message: strings.server_error, requestObject })
                    }
                } else if (axios.isCancel(error)) {
                    if (isRequestTimeout || isCanceled) {
                        resolve({ success: false, message: strings.request_timeout, requestObject })
                    } else {
                        resolve({ success: false, message: strings.poor_network, requestObject })
                    }
                } else if (isCanceled) {
                    resolve({ success: false, message: strings.request_timeout, requestObject });
                } else {
                    resolve({ success: false, data: error.response.data, message: strings.server_error, requestObject })
                }
            })
    }
})