'use strict';
import { emitter } from '../socket/index.js'

const EmitHandler = async (req, res, next) => {
    const { url, response } = req.body;

    if (!url) {
        res.status(400).json({ msg: "Url is missing" });
    }

    if (!response) {
        res.status(400).json({ msg: 'response is missing' });
    }
    emitter(url, response);
    res.status(200).json({ msg: 'Success' });
}

export { EmitHandler };
