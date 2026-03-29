/**
 * Ensures vendor_type "cooking_vendor" exists and creates demo cooking vendor:
 *   email: cookingvendor@gmail.com
 *   name: Suba
 *   default password: SubaCook@2026
 *
 * Run from shop_cart_back_end:  npm run seed:cooking-vendor
 */
import dotenv from "dotenv";
import argon2 from "argon2";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

import db from "../config/Database.js";
import User from "../models/UserModel.js";
import VendorType from "../models/VendorTypeModel.js";
import Vendor from "../models/VendorModel.js";
import CookingRate from "../models/CookingRateModel.js";

const EMAIL = "cookingvendor@gmail.com";
const NAME = "Suba";
const DEFAULT_PASSWORD = "SubaCook@2026";
const COOKING_CODE = "cooking_vendor";

async function main() {
    await db.authenticate();

    const [vendorType] = await VendorType.findOrCreate({
        where: { code: COOKING_CODE },
        defaults: {
            code: COOKING_CODE,
            label: "Cooking vendor",
            isActive: 1
        }
    });
    if (!vendorType.isActive) {
        await vendorType.update({ isActive: 1 });
    }

    let user = await User.findOne({ where: { email: EMAIL } });
    if (user) {
        if (user.role !== "vendor") {
            console.error(`User ${EMAIL} exists with role "${user.role}". Remove or change that user, then re-run.`);
            process.exit(1);
        }
    } else {
        const hash = await argon2.hash(DEFAULT_PASSWORD);
        user = await User.create({
            name: NAME,
            email: EMAIL,
            password: hash,
            role: "vendor",
            isActive: 1
        });
        console.log(`Created user ${EMAIL} (password: ${DEFAULT_PASSWORD})`);
    }

    let vendor = await Vendor.findOne({ where: { userId: user.id } });
    if (vendor) {
        await vendor.update({
            vendorTypeId: vendorType.id,
            name: NAME,
            location: vendor.location || "Chennai",
            availableTimeSlots: vendor.availableTimeSlots || "Mon–Sat 10:00–20:00",
            cookingDescription: vendor.cookingDescription || "South Indian meals, tiffin, and home-style daily cooking.",
            isActive: 1
        });
        console.log(`Updated existing vendor id=${vendor.id} for ${EMAIL}`);
    } else {
        vendor = await Vendor.create({
            userId: user.id,
            vendorTypeId: vendorType.id,
            name: NAME,
            location: "Chennai",
            availableTimeSlots: "Mon–Sat 10:00–20:00",
            cookingDescription: "South Indian meals, tiffin, and home-style daily cooking.",
            isActive: 1
        });
        console.log(`Created vendor id=${vendor.id} for ${EMAIL}`);
    }

    const existingRate = await CookingRate.findOne({ where: { vendorId: vendor.id } });
    if (!existingRate) {
        await CookingRate.create({
            vendorId: vendor.id,
            rateType: "per_order",
            rateAmount: 99,
            currency: "INR",
            isActive: 1
        });
        console.log("Created cooking rate ₹99 per_order");
    } else {
        await existingRate.update({ isActive: 1 });
        console.log(`Cooking rate already present (id=${existingRate.id})`);
    }

    console.log("Done. Customer UI lists this vendor at GET /customer/cooking-vendors");
    await db.close();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
