import { getParamsParser, postRequestParser } from "../util/index.js";
import Stores from "../models/StoreModel.js";
import Users from "../models/UserModel.js";

export const getStores = async (req, res) => {
    try {
        let response = await Stores.findAll();
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const getStoreById = async (req, res) => {
    const data = getParamsParser(req)
    try {
        const findStore = await Stores.findOne({
            where: {
                id: data.id
            }
        });
        if (!findStore) return res.status(403).json({ msg: "Store Id not found" });
        res.status(200).json(findStore);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const createStore = async (req, res) => {
    const data = postRequestParser(req)
    try {
        let findStore = await Stores.findOne({
            where: {
                name: data.name
            }
        })
        if (findStore) {
            return res.status(403).json({ msg: "Store Name Already taken" });
        }
        let findUser = await Users.findOne({
            where: {
                id: data.vendorId,
                role: "vendor"
            }
        })
        if (!findUser) {
            return res.status(403).json({ msg: "Selected Vendor is Not a vendor role." });
        }
        let findExistingStore = await Stores.findOne({
            where: {
                vendorId: data.vendorId
            }
        })
        if(findExistingStore){
            return res.status(403).json({ msg: "There is already one store for the selected vendor." });
        }
        data.isActive = 1
        let product = await Stores.create(Object.assign({}, data));
        return res.status(201).json({ msg: product });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const updateStore = async (req, res) => {
    const params = getParamsParser(req)
    const data = postRequestParser(req)
    try {
        const findStore = await Stores.findOne({
            where: {
                id: params.id
            }
        });
        if (!findStore) return res.status(403).json({ msg: "Store Id not found" });
        await findStore.update(Object.assign({}, data))
        res.status(200).json({ msg: findStore });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const deleteStore = async (req, res) => {
    const params = getParamsParser(req)
    try {
        const findStore = await Stores.findOne({
            where: {
                id: params.id
            }
        });
        if (!findStore) return res.status(403).json({ msg: "Store id not found" });
        await findStore.destroy(Object.assign({}, params))
        res.status(200).json({ msg: findStore });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}
export const getStoreAddVendor = async (req, res) => {
    try {
        let response = await Users.findAll({
            attributes: ['id', 'name'],
            where: {
                role: "vendor"
            }
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}
export const getStoreUpdateVendor = async (req, res) => {
    try {
        let response = await Users.findAll({
            attributes: ['id', 'name'],
            where: {
                role: "vendor"
            }
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}
