import { VendorSubscriptionURL } from "../config/Socket.js";
import { EmitToSocketPost } from "../config/SocketPost.js";
import Stores from "../models/StoreModel.js";
import User from "../models/UserModel.js";
import argon2 from "argon2";

export const Login = async (req, res) => {
    if (!req.body.email) return res.status(404).json({ msg: "Please Enter the email." })
    if (!req.body.password) return res.status(404).json({ msg: "Please Enter the password." })
    const user = await User.findOne({
        where: {
            email: req.body.email
        }
    });
    if (!user) return res.status(404).json({ msg: "This Email is Not Registered." });
    const match = await argon2.verify(user.password, req.body.password);
    if (!match) return res.status(400).json({ msg: "Wrong Password" });
    req.session.userId = user.id;
    req.session.role = user.role;
    if (user.role === "vendor") {
        let findStore = await Stores.findOne({
            where: {
                vendorId: user.id
            }
        })
        if (!findStore) return res.status(404).json({ msg: "Store Not Config this email, Please contact administrator." });
        let findStoreActive = await Stores.findOne({
            where: {
                vendorId: user.id,
                isActive: 1
            }
        })
        if (!findStoreActive) return res.status(404).json({ msg: "Your Store Disabled by Admin, Please contact administrator." });
        req.session.storeId = findStore.id
    }
    const id = user.id;
    const name = user.name;
    const email = user.email;
    const role = user.role;
    let VendorSocketUrl = await VendorSubscriptionURL(id)
    let adminToVendor = user && user.toJSON();
    adminToVendor.type = "LOGIN_SUCCESS"
    adminToVendor.message = "Login Success"
    let VendorSocketResponse = {
        url: VendorSocketUrl,
        response: adminToVendor
    }
    await EmitToSocketPost(VendorSocketResponse)
    res.status(200).json({ id, name, email, role });
}

export const Me = async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ msg: "Session userId not found." });
    }
    const user = await User.findOne({
        attributes: ['id', 'name', 'email', 'role'],
        where: {
            id: req.session.userId
        }
    });
    if (!user) return res.status(404).json({ msg: "User Not found" });
    res.status(200).json(user);
}

export const logOut = (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(400).json({ msg: "Something went wrong" });
        res.status(200).json({ msg: "Successfully Logout" });
    });
}