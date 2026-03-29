export const getRequestParser = (req) => req.query;

export const postRequestParser = (req) => req.body;

export const getParamsParser = (req) => req.params;

export const getStoreId = (req) => req.session.storeId;

export const getUserId = (req) => req.session.userId

export const getRole = (req) => req.session.role


export const OrderStatus = {
    ORDER_INITIATE: 1,
    ORDER_ACCEPTED: 2,
    ORDER_DECLINE: 3,
    ORDER_REFUND_INITIATED: 4
}

/** When customer picks a cooking partner, order rows use these before store vendor accepts fulfillment. */
export const CookingWorkflowStatus = {
    AWAITING_ACCEPT: 10,
    ACCEPTED: 11,
    IN_PROGRESS: 12,
    COOKING_DONE: 13
}