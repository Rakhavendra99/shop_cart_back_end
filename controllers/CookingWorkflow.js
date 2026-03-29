import Orders from "../models/OrderModel.js";
import Users from "../models/UserModel.js";
import { CookingWorkflowStatus, getParamsParser, postRequestParser } from "../util/index.js";
import { emitCookingCompletedToStoreVendor } from "../util/cookingOrderHelpers.js";

export const listCookingVendorOrders = async (req, res) => {
    try {
        const orders = await Orders.findAll({
            where: { cookingVendorId: req.cookingPartnerVendorId },
            include: [Users],
            order: [["createdAt", "DESC"]],
        });
        return res.status(200).json(orders);
    } catch (e) {
        return res.status(500).json({ msg: e.message });
    }
};

export const patchCookingWorkflow = async (req, res) => {
    const params = getParamsParser(req);
    const body = postRequestParser(req);
    const action = body.action;
    try {
        const order = await Orders.findOne({
            where: { id: params.id, cookingVendorId: req.cookingPartnerVendorId },
        });
        if (!order) return res.status(404).json({ msg: "Order not found" });
        const updates = {};
        if (action === "accept") {
            if (order.cookingWorkflowStatus !== CookingWorkflowStatus.AWAITING_ACCEPT) {
                return res.status(400).json({ msg: "Cannot accept in this state" });
            }
            updates.cookingWorkflowStatus = CookingWorkflowStatus.ACCEPTED;
        } else if (action === "start") {
            if (order.cookingWorkflowStatus !== CookingWorkflowStatus.ACCEPTED) {
                return res.status(400).json({ msg: "Accept the request first" });
            }
            updates.cookingWorkflowStatus = CookingWorkflowStatus.IN_PROGRESS;
            updates.cookingStartedAt = new Date();
        } else if (action === "complete") {
            if (order.cookingWorkflowStatus !== CookingWorkflowStatus.IN_PROGRESS) {
                return res.status(400).json({ msg: "Start cooking before completing" });
            }
            updates.cookingWorkflowStatus = CookingWorkflowStatus.COOKING_DONE;
            updates.cookingCompletedAt = new Date();
        } else {
            return res.status(400).json({ msg: "action must be accept, start, or complete" });
        }
        await order.update(updates);
        if (action === "complete") {
            await emitCookingCompletedToStoreVendor(order);
        }
        await order.reload();
        return res.status(200).json({ msg: order });
    } catch (e) {
        return res.status(500).json({ msg: e.message });
    }
};
