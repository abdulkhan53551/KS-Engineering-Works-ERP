// components/PaginationBar.jsx
import React from 'react';
import { Box, Pagination, Typography } from '@mui/material';

const PaginationBar = ({ page, pageSize, total, totalPages, onPageChange }) => {
    if (!total) return null;

    // const totalPages = Math.ceil(total / pageSize);
    // const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
    // const pageEnd = Math.min(page * pageSize, total);

    return (
        <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            // mt={2}
            flexWrap="wrap"
            gap={1}
        >
            {/* <Typography variant="body2" color="text.secondary">
                Showing {pageStart}–{pageEnd} of {total} entries
            </Typography> */}

            <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => onPageChange(value)}
                color="primary"
                shape="rounded"
                size="medium"
            />
        </Box>
    );
};

export default PaginationBar;