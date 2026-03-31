import { VendorSubscriptionURL } from "../config/Socket.js";
import { EmitToSocketPost } from "../config/SocketPost.js";
import Stores from "../models/StoreModel.js";
import User from "../models/UserModel.js";
import Vendor from "../models/VendorModel.js";
import VendorType from "../models/VendorTypeModel.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";

export const Login = async (req, res) => {
    if (!req.body.email) return res.status(404).json({ msg: "Please Enter the email." })
    if (!req.body.password) return res.status(404).json({ msg: "Please Enter the password." })
    const user = await User.findOne({
        where: {
            email: req.body.email
        }
    });
    if (!user) return res.status(404).json({ msg: "This Email is Not Registered." });
    const storedHash = user.password;
    if (typeof storedHash !== "string" || !storedHash.trim()) {
        console.error("Login: user %s has missing or empty password hash (fix DB or reset password).", user.id);
        return res.status(500).json({
            msg: "This account has no password set. Ask an administrator to reset your password.",
        });
    }
    let match = false;
    try {
        match = await argon2.verify(storedHash, req.body.password);
    } catch (err) {
        console.error("Login: argon2.verify failed for user %s:", user.id, err?.message || err);
        return res.status(500).json({
            msg: "Login could not be completed. If this continues, contact support.",
        });
    }
    if (!match) return res.status(400).json({ msg: "Wrong Password" });
    req.session.userId = user.id;
    req.session.role = user.role;
    let vendorProfile = null;
    let vendorType = null;
    if (user.role === "vendor") {
        vendorProfile = await Vendor.findOne({
            where: { userId: user.id },
        });
        let cookingTypeCode = null;
        if (vendorProfile) {
            const t = await VendorType.findByPk(vendorProfile.vendorTypeId, { attributes: ["code"] });
            cookingTypeCode = t?.code || null;
        }
        const isCookingVendor = cookingTypeCode === "cooking_vendor";
        if (isCookingVendor) {
            vendorType = "cooking_vendor";
        }
        if (!isCookingVendor) {
            let findStore = await Stores.findOne({
                where: {
                    vendorId: user.id
                }
            });
            if (!findStore) return res.status(404).json({ msg: "Store Not Config this email, Please contact administrator." });
            let findStoreActive = await Stores.findOne({
                where: {
                    vendorId: user.id,
                    isActive: 1
                }
            });
            if (!findStoreActive) return res.status(404).json({ msg: "Your Store Disabled by Admin, Please contact administrator." });
            req.session.storeId = findStore.id;
        }
    }
    const id = user.id;
    const name = user.name;
    const email = user.email;
    let role = user.role;
    let VendorSocketUrl = await VendorSubscriptionURL(id)
    let adminToVendor = user && user.toJSON();
    adminToVendor.type = "LOGIN_SUCCESS"
    adminToVendor.message = "Login Success"
    let VendorSocketResponse = {
        url: VendorSocketUrl,
        response: adminToVendor
    }
    await EmitToSocketPost(VendorSocketResponse)
    const tokenPayload = { userId: id, role };
    if (req.session.storeId != null) {
        tokenPayload.storeId = req.session.storeId;
    }
    const accessToken = jwt.sign(
        tokenPayload,
        process.env.SESSION_SECRET || "123456789",
        { expiresIn: "7d" }
    );
    const response = {
        id,
        userId: id,
        name,
        email,
        role,
        accessToken,
    };
    if (vendorType) response.vendorType = vendorType;
    if (req.session.storeId != null) {
        response.storeId = req.session.storeId;
    }
    // Sequelize session store writes async; respond only after persist so Set-Cookie matches saved session.
    req.session.save((err) => {
        if (err) {
            console.error("Session save after login failed:", err);
            return res.status(500).json({ msg: "Could not create session. Try again." });
        }
        res.status(200).json(response);
    });
}

export const Me = async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            msg: "Not authenticated: no session cookie and no valid Bearer token. POST /login returns accessToken — send Authorization: Bearer <accessToken> on GET /me, or use same-site requests with withCredentials.",
            code: "SESSION_USER_MISSING",
            userId: null,
            id: null,
        });
    }
    const user = await User.findOne({
        attributes: ['id', 'name', 'email', 'role'],
        where: {
            id: req.session.userId
        }
    });
    if (!user) return res.status(404).json({ msg: "User Not found" });
    const row = typeof user.get === "function" ? user.get({ plain: true }) : user;
    const uid = row.id;
    const result = {
        id: uid,
        userId: uid,
        name: row.name,
        email: row.email,
        role: row.role,
    };
    if (user.role === "vendor") {
        const vendor = await Vendor.findOne({ where: { userId: uid } });
        if (vendor) {
            const t = await VendorType.findByPk(vendor.vendorTypeId, { attributes: ["code"] });
            if (t?.code === "cooking_vendor") {
                result.vendorType = "cooking_vendor";
            }
        }
    }
    if (req.session.storeId != null) {
        result.storeId = req.session.storeId;
    }
    res.status(200).json(result);
}

export const logOut = (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(400).json({ msg: "Something went wrong" });
        res.status(200).json({ msg: "Successfully Logout" });
    });
}