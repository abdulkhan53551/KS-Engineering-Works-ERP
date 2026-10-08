// components/PaginationBar.jsx
import React from 'react';
import { Box, Pagination, Typography } from '@mui/material';

const PaginationBar = ({
    page,
    pageSize,
    total,
    totalPages,
    currentPage,
    onPageChange,
    pagination
}) => {
    const curTotal = total !== undefined ? total : (pagination?.total !== undefined ? pagination.total : (totalPages ? totalPages : 0));
    const curPage = page || currentPage || pagination?.page || 1;
    const curPageSize = pageSize || pagination?.pageSize || 10;
    const curTotalPages = totalPages || pagination?.totalPages;

    if (!curTotal && !curTotalPages) return null;

    const count = Number(curTotalPages) || (curTotal && curPageSize ? Math.ceil(curTotal / curPageSize) : 1) || 1;

    return (
        <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={1}
        >
            <Pagination
                count={count}
                page={Number(curPage) || 1}
                onChange={(e, value) => onPageChange && onPageChange(value)}
                color="primary"
                shape="rounded"
                size="medium"
            />
        </Box>
    );
};

export default React.memo(PaginationBar);