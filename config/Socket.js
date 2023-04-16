export const EmitToSocketURL = `/api/socket`;

export const VendorSubscriptionURL = (userId) => {
    return `/SOCKET/VENDOR/${userId}`;
}

export const CustomerSubscriptionURL = (userId) => {
    return `/SOCKET/CUSTOMER/${userId}`;
}

export const AdminSubscriptionURL = (userId) => {
    return `/SOCKET/ADMIN/${userId}`;
}