import argon2 from "argon2";
import VendorType from "../models/VendorTypeModel.js";
import Vendor from "../models/VendorModel.js";
import User from "../models/UserModel.js";
import CookingRate from "../models/CookingRateModel.js";
import { getParamsParser, getRequestParser, postRequestParser } from "../util/index.js";

export const getVendorTypes = async (req, res) => {
    try {
        const types = await VendorType.findAll();
        res.status(200).json(types);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const createVendorType = async (req, res) => {
    const data = postRequestParser(req);
    try {
        const existing = await VendorType.findOne({
            where: { code: data.code }
        });
        if (existing) {
            return res.status(403).json({ msg: "Vendor type code already exists" });
        }
        const type = await VendorType.create({
            code: data.code,
            label: data.label,
            isActive: data.isActive ?? 1
        });
        res.status(201).json({ msg: type });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const updateVendorType = async (req, res) => {
    const params = getParamsParser(req);
    const data = postRequestParser(req);
    try {
        const type = await VendorType.findOne({
            where: { id: params.id }
        });
        if (!type) return res.status(403).json({ msg: "Vendor type id not found" });
        await type.update(Object.assign({}, data));
        res.status(200).json({ msg: type });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const deleteVendorType = async (req, res) => {
    const params = getParamsParser(req);
    try {
        const type = await VendorType.findOne({
            where: { id: params.id }
        });
        if (!type) return res.status(403).json({ msg: "Vendor type id not found" });
        await type.destroy();
        res.status(200).json({ msg: type });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const getVendors = async (req, res) => {
    const query = getRequestParser(req) || {};
    const where = {};
    if (query.vendorTypeId) {
        where.vendorTypeId = query.vendorTypeId;
    }
    try {
        const vendors = await Vendor.findAll({
            where,
            include: [
                { model: User, attributes: ["id", "name", "email", "role", "isActive"] },
                { model: VendorType }
            ]
        });
        res.status(200).json(vendors);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Public list for customers to choose a cooking vendor partner
export const getCookingVendorsForCustomer = async (req, res) => {
    try {
        const COOKING_VENDOR_CODE = "cooking_vendor";
        const vendors = await Vendor.findAll({
            where: { isActive: 1 },
            include: [
                {
                    model: VendorType,
                    where: { code: COOKING_VENDOR_CODE, isActive: 1 },
                },
                {
                    model: User,
                    attributes: ["id", "name", "email", "isActive"],
                },
                {
                    model: CookingRate,
                    where: { isActive: 1 },
                    required: false,
                },
            ],
        });
        const response = vendors.map((v) => {
            const obj = v.toJSON ? v.toJSON() : { ...v };
            return {
                id: obj.id,
                name: obj.name,
                location: obj.location,
                availableTimeSlots: obj.availableTimeSlots,
                user: obj.User || obj.user || null,
                rate: obj.CookingRate || obj.cooking_rate || null,
            };
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const getVendorById = async (req, res) => {
    const params = getParamsParser(req);
    try {
        const vendor = await Vendor.findOne({
            where: { id: params.id },
            include: [
                { model: User, attributes: ["id", "name", "email", "role", "isActive"] },
                { model: VendorType }
            ]
        });
        if (!vendor) return res.status(403).json({ msg: "Vendor id not found" });
        res.status(200).json(vendor);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const createVendor = async (req, res) => {
    const data = postRequestParser(req);
    const {
        name,
        email,
        password,
        confPassword,
        vendorTypeCode,
        vendorTypeId,
        location,
        availableTimeSlots,
        rateType,
        rateAmount,
        currency
    } = data;
    if (!password || password !== confPassword) {
        return res.status(403).json({ msg: "Password not match" });
    }
    try {
        const existingUser = await User.findOne({
            where: { email }
        });
        if (existingUser) {
            return res.status(403).json({ msg: "This Email already taken, can you try other email Id." });
        }
        let type = null;
        if (vendorTypeId) {
            type = await VendorType.findOne({ where: { id: vendorTypeId } });
        } else if (vendorTypeCode) {
            type = await VendorType.findOne({ where: { code: vendorTypeCode } });
        }
        if (!type) {
            return res.status(403).json({ msg: "Vendor type not found" });
        }
        const hashPassword = await argon2.hash(password);
        const user = await User.create({
            name,
            email,
            password: hashPassword,
            role: "vendor",
            isActive: 1
        });
        const vendor = await Vendor.create({
            userId: user.id,
            vendorTypeId: type.id,
            name,
            location: location || null,
            availableTimeSlots: availableTimeSlots || null,
            isActive: 1
        });
        if (rateType && rateAmount) {
            await CookingRate.create({
                vendorId: vendor.id,
                rateType,
                rateAmount,
                currency: currency || null,
                isActive: 1
            });
        }
        res.status(201).json({ msg: { user, vendor } });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const updateVendor = async (req, res) => {
    const params = getParamsParser(req);
    const data = postRequestParser(req);
    try {
        const vendor = await Vendor.findOne({
            where: { id: params.id }
        });
        if (!vendor) return res.status(403).json({ msg: "Vendor id not found" });
        await vendor.update(Object.assign({}, data));
        res.status(200).json({ msg: vendor });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const deleteVendor = async (req, res) => {
    const params = getParamsParser(req);
    try {
        const vendor = await Vendor.findOne({
            where: { id: params.id }
        });
        if (!vendor) return res.status(403).json({ msg: "Vendor id not found" });
        await vendor.destroy();
        res.status(200).json({ msg: vendor });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

