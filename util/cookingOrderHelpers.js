import CookingRate from "../models/CookingRateModel.js";
import Vendor from "../models/VendorModel.js";
import Stores from "../models/StoreModel.js";
import { CookingWorkflowStatus } from "./index.js";
import { VendorSubscriptionURL } from "../config/Socket.js";
import { EmitToSocketPost } from "../config/SocketPost.js";

/**
 * Snapshot cooking fee from active CookingRate (per_order uses rateAmount as flat fee).
 */
export async function resolveCookingServiceFee(cookingVendorId) {
    if (!cookingVendorId) {
        return { cookingServiceFee: null, cookingWorkflowStatus: null };
    }
    const rate = await CookingRate.findOne({
        where: { vendorId: cookingVendorId, isActive: 1 },
    });
    const fee = rate ? Number(rate.rateAmount) : 0;
    return {
        cookingServiceFee: Number.isFinite(fee) && fee >= 0 ? fee : 0,
        cookingWorkflowStatus: CookingWorkflowStatus.AWAITING_ACCEPT,
    };
}

export async function emitOrderCreatedSockets(order) {
    const o = order.toJSON ? order.toJSON() : { ...order };
    const base = { ...o, type: "NEW_ORDER" };
    const store = await Stores.findOne({ where: { id: o.storeId } });
    if (store?.vendorId) {
        await EmitToSocketPost({
            url: VendorSubscriptionURL(store.vendorId),
            response: base,
        });
    }
    if (o.cookingVendorId) {
        const cook = await Vendor.findByPk(o.cookingVendorId);
        if (cook?.userId) {
            await EmitToSocketPost({
                url: VendorSubscriptionURL(cook.userId),
                response: { ...base, type: "NEW_COOKING_REQUEST" },
            });
        }
    }
}

export async function emitCookingCompletedToStoreVendor(order) {
    const o = order.toJSON ? order.toJSON() : { ...order };
    const store = await Stores.findOne({ where: { id: o.storeId } });
    if (!store?.vendorId) return;
    await EmitToSocketPost({
        url: VendorSubscriptionURL(store.vendorId),
        response: {
            ...o,
            type: "COOKING_COMPLETE",
            message: "Cooking partner finished — you can accept the order and contact the customer.",
        },
    });
}
