import User from "../models/UserModel.js";
import Vendor from "../models/VendorModel.js";
import VendorType from "../models/VendorTypeModel.js";

export const verifyUser = async (req, res, next) =>{
    if(!req.session.userId){
        return res.status(401).json({msg: "Mohon login ke akun Anda!"});
    }
    const user = await User.findOne({
        where: {
            id: req.session.userId
        }
    });
    if(!user) return res.status(404).json({msg: "User tidak ditemukan"});
    req.userId = user.id;
    req.role = user.role; 
    next();
}

export const adminOnly = async (req, res, next) =>{
    const user = await User.findOne({
        where: {
            id: req.session.userId
        }
    });
    if(!user) return res.status(404).json({msg: "User tidak ditemukan"});
    if(user.role !== "admin") return res.status(403).json({msg: "Akses terlarang"});
    next();
}

export const cookingVendorOnly = async (req, res, next) => {
    const user = await User.findOne({ where: { id: req.session.userId } });
    if (!user) return res.status(404).json({ msg: "User tidak ditemukan" });
    const vendor = await Vendor.findOne({ where: { userId: user.id } });
    if (!vendor) {
        return res.status(403).json({ msg: "Cooking vendor access only" });
    }
    const typeRow = await VendorType.findByPk(vendor.vendorTypeId, { attributes: ["code", "isActive"] });
    if (!typeRow || typeRow.code !== "cooking_vendor" || Number(typeRow.isActive) !== 1) {
        return res.status(403).json({ msg: "Cooking vendor access only" });
    }
    req.cookingPartnerVendorId = vendor.id;
    next();
};