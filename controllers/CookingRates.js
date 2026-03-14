import CookingRate from "../models/CookingRateModel.js";
import Vendor from "../models/VendorModel.js";
import VendorType from "../models/VendorTypeModel.js";
import { getUserId, postRequestParser } from "../util/index.js";

const COOKING_VENDOR_CODE = "cooking_vendor";

export const getVendorCookingRate = async (req, res) => {
    const userId = getUserId(req);
    try {
        const vendor = await Vendor.findOne({
            where: { userId },
            include: [
                {
                    model: VendorType,
                    where: { code: COOKING_VENDOR_CODE }
                }
            ]
        });
        if (!vendor) {
            return res.status(403).json({ msg: "Cooking vendor not found for this user" });
        }
        const rate = await CookingRate.findOne({
            where: { vendorId: vendor.id, isActive: 1 }
        });
        res.status(200).json(rate);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const upsertVendorCookingRate = async (req, res) => {
    const userId = getUserId(req);
    const data = postRequestParser(req);
    const { rateType, rateAmount, currency } = data;
    if (!rateType || !rateAmount) {
        return res.status(403).json({ msg: "rateType and rateAmount are required" });
    }
    try {
        const vendor = await Vendor.findOne({
            where: { userId },
            include: [
                {
                    model: VendorType,
                    where: { code: COOKING_VENDOR_CODE }
                }
            ]
        });
        if (!vendor) {
            return res.status(403).json({ msg: "Cooking vendor not found for this user" });
        }
        let rate = await CookingRate.findOne({
            where: { vendorId: vendor.id }
        });
        if (!rate) {
            rate = await CookingRate.create({
                vendorId: vendor.id,
                rateType,
                rateAmount,
                currency: currency || null,
                isActive: 1
            });
        } else {
            await rate.update({
                rateType,
                rateAmount,
                currency: currency || null
            });
        }
        res.status(200).json({ msg: rate });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const getAllCookingRates = async (req, res) => {
    try {
        const rates = await CookingRate.findAll({
            include: [{ model: Vendor }]
        });
        res.status(200).json(rates);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

