import { serverCall } from "../../../utilities/api";
import { requestMethod } from "../../../utilities/api/constants";
import { failCustomerAdd, initCustomerAdd, successCustomerAdd } from "./action";

export function testCustomerApi() {
    return async (dispatch) => {
        dispatch(initCustomerAdd());
        const params = {
            // msisdn: selectedProfile.number_details.msisdn,
        };
        //   let result = await serverCall(
        //     endPoints.DS_VALIDATE_CONSENT,
        //     requestMethod.POST,
        //     params,
        //     headers,
        //   );

        const headers = {};
        const result = await serverCall('https://jsonplaceholder.typicode.com/users', requestMethod.GET, params, headers);
        console.log('Result => ', result);


        if (result.success) {
            dispatch(successCustomerAdd(result.data));
        } else {
            dispatch(failCustomerAdd());
        }
    };
}