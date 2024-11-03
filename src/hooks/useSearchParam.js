import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

function useKsSearchParam() {
  const { search } = useLocation();
  return useMemo(() => SearchParams(search), [search]);
}

const SearchParams = (search) => {
    const queryParams = new URLSearchParams(search);
  
    // Convert search parameters to an object
    const paramsObject = {};
    queryParams.forEach((value, key) => {
      paramsObject[key] = value;
    });
  
    return {urlSearchParams: paramsObject};
  }

export default useKsSearchParam;