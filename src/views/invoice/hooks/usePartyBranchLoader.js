import { useEffect, useRef, useState } from 'react';
import { getPartyDetailsById } from '../../party/api';

/**
 * Custom hook to load party details and branches in edit / duplicate mode
 * and hydrate the selected billing branch and shipping mode.
 */
export const usePartyBranchLoader = ({
   invoice,
   setSelectedParty,
   setPartyBranches,
   setSelectedBillingBranchId,
   resolveAndApplyShippingMode
}) => {
   const hasLoadedInitialBranchesRef = useRef(false);
   const [isLoadingBranches, setIsLoadingBranches] = useState(false);

   useEffect(() => {
      const pId = invoice?.party_id || invoice?.partyId;
      if (pId && !hasLoadedInitialBranchesRef.current) {
         hasLoadedInitialBranchesRef.current = true;
         setIsLoadingBranches(true);
         getPartyDetailsById(pId)
            .then((res) => {
               const details = res?.data ?? res;
               if (details && setSelectedParty) {
                  setSelectedParty(details);
               }
               const branches = details?.branches && Array.isArray(details.branches) ? details.branches : [];
               if (setPartyBranches) {
                  setPartyBranches(branches);
               }
               const bId = invoice.branch_id || invoice.branchId;
               if (bId && setSelectedBillingBranchId) {
                  setSelectedBillingBranchId(Number(bId));
               }
               if (resolveAndApplyShippingMode) {
                  resolveAndApplyShippingMode(invoice, branches, bId);
               }
            })
            .catch(() => {
               if (resolveAndApplyShippingMode) {
                  resolveAndApplyShippingMode(invoice, [], invoice?.branch_id || invoice?.branchId);
               }
            })
            .finally(() => {
               setIsLoadingBranches(false);
            });
      } else if (invoice?.id && !pId && !hasLoadedInitialBranchesRef.current) {
         hasLoadedInitialBranchesRef.current = true;
         if (resolveAndApplyShippingMode) {
            resolveAndApplyShippingMode(invoice, [], null);
         }
      }
   }, [invoice, setSelectedParty, setPartyBranches, setSelectedBillingBranchId, resolveAndApplyShippingMode]);

   return { isLoadingBranches };
};

export default usePartyBranchLoader;
