// components/PaginationBar.jsx
import React from 'react';
import { Box, Pagination, Typography } from '@mui/material';

const PaginationBar = ({ page, pageSize, total, totalPages, onPageChange }) => {
    if (!total) return null;

    const count = Number(totalPages) || (total && pageSize ? Math.ceil(total / pageSize) : 1) || 1;

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
                page={Number(page) || 1}
                onChange={(e, value) => onPageChange && onPageChange(value)}
                color="primary"
                shape="rounded"
                size="medium"
            />
        </Box>
    );
};

export default PaginationBar;