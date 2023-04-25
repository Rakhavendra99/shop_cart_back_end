export const getRequestParser = (req) => req.query;

export const postRequestParser = (req) => req.body;

export const getParamsParser = (req) => req.params;

export const getStoreId = (req) => req.session.storeId;

export const getUserId = (req) => req.session.userId