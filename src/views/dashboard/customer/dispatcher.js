// export function validateConsent(selectedProfile, parrentUser, promoCode) {
//     return async (dispatch) => {
//       dispatch(initDSValidateConsent());
      
//       let requestId = Math.floor(100000 + Math.random() * 900000);
//       let headers = {
//         "CircleID": selectedProfile.number_details.circleId,
//         "Provider": selectedProfile.number_details.provider,
//         "SubscriptionType": selectedProfile.number_details.subscriptionType
//       }
//       let params = {
//         msisdn: selectedProfile.number_details.msisdn,
//         requestId: requestId,
//         validateType: 'MSISDN',
//         validateIdentifier: selectedProfile.number_details.msisdn,
//         customerType: "VI",
//         firstName: selectedProfile?.user_details?.givenName,
//         lastname: selectedProfile?.user_details?.familyName,
//         emailAddress: selectedProfile?.user_details?.contactMedium[0]?.emailAddress
//         // emailAddress: "someEmail@gmail.com"
//       };
//       let result = await serverCall(
//         endPoints.DS_VALIDATE_CONSENT,
//         requestMethod.POST,
//         params,
//         headers,
//       );
  
//       console.log('============VALIDATE RESULT 2 ========================');
//       console.log(result);
//       console.log('===============VALIDATE RESULT 2 =====================');

  
//       if (result.success && result.data) {
//           dispatch(successDSCustomer(customer));//  Store customer related data
//         } else {
//           dispatch(failDSValidateConsent());
//         }
//     };
//   }