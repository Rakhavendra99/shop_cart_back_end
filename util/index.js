export const getRequestParser = (req) => req.query;

export const postRequestParser = (req) => req.body;

export const getParamsParser = (req) => req.params;

export const getStoreId = (req) => req.session.storeId;

export const getUserId = (req) => req.session.userId

export const OrderStatus = {
    ORDER_INITIATE: 1,
    ORDER_ACCEPTED: 2,
    ORDER_DECLINE: 3,
    ORDER_REFUND_INITIATED: 4
}