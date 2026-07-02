import api from "../../lib/axios";
import { requestMethod } from "../../utilities/api/constants";
import { asyncHandler } from "../../utilities/asyncHandler";

// Get eway bill
export const getEwayBillPagination = asyncHandler(async ({ page = 1, pageSize = 10, search = '' }) => {
    const res = await api.request({
        url: '/ewaybill/pagination',
        method: requestMethod.GET,
        params: { page, pageSize, search }
    });

    return res.data;
})

// Get eway bill
export const getEwayBill = asyncHandler(async ({ page = 1, pageSize = 10, search = '' }) => {
    const res = await api.request({
        url: '/ewaybill',
        method: requestMethod.GET,
        params: { page, pageSize, search }
    });

    return res.data;
})

// Get eway bill by id
export const getEwayBillById = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/ewaybill/${id}`,
        method: requestMethod.GET
    });

    return res.data;
})

// Create eway bill
export const createEwayBill = asyncHandler(async (request) => {
    const res = await api.request({
        url: '/ewaybill',
        method: requestMethod.POST,
        data: request
    });

    return res.data;
})

// Update eway bill
export const updateEwayBill = asyncHandler(async (id, request) => {
    const res = await api.request({
        url: `/ewaybill/${id}`,
        method: requestMethod.PATCH,
        data: request
    });

    return res.data;
})

// Delete eway bill
export const deleteEwayBill = asyncHandler(async ({id}) => {
    const res = await api.request({
        url: `/ewaybill/${id}`,
        method: requestMethod.DELETE
    });
    return res.data;
});