const path = require('path');
const fs = require('fs');
const MuseumModel = require('../models/museumModel');

let verifiedSeniorSet = null;
function getVerifiedSeniorSet() {
    if (!verifiedSeniorSet) {
        try {
            const verPath = path.join(__dirname, '..', 'data', 'museum-hours-prices-verification.json');
            if (fs.existsSync(verPath)) {
                const list = JSON.parse(fs.readFileSync(verPath, 'utf8'));
                verifiedSeniorSet = new Set(
                    list.filter(m => m.senior_pricing_status === 'Officially Published').map(m => m.id)
                );
            } else {
                verifiedSeniorSet = new Set([1, 4, 7, 11, 20, 22, 23, 33, 38, 45, 55, 72, 77]);
            }
        } catch (e) {
            verifiedSeniorSet = new Set([1, 4, 7, 11, 20, 22, 23, 33, 38, 45, 55, 72, 77]);
        }
    }
    return verifiedSeniorSet;
}

function attachStartingPrice(museum) {
    if (!museum) return museum;
    const seniorSet = getVerifiedSeniorSet();

    const rawAdult = parseFloat(museum.adult_price);
    const rawChild = (museum.child_price !== null && museum.child_price !== undefined) ? parseFloat(museum.child_price) : null;
    const rawSenior = (museum.senior_price !== null && museum.senior_price !== undefined) ? parseFloat(museum.senior_price) : null;

    // Use the exact ticket prices resolved on the booking page:
    // booking.html evaluates:
    //   PRICES.adult = parseFloat(selectedMuseumData.adult_price || 150)
    //   PRICES.child = parseFloat(selectedMuseumData.child_price || 75)
    //   PRICES.senior = parseFloat(selectedMuseumData.senior_price || 100)
    const bookingAdult = (!rawAdult || isNaN(rawAdult)) ? 150 : rawAdult;
    const bookingChild = (!rawChild || isNaN(rawChild)) ? 75 : rawChild;
    const bookingSenior = (!rawSenior || isNaN(rawSenior)) ? 100 : rawSenior;

    if (seniorSet.has(museum.id) && !isNaN(bookingSenior)) {
        museum.senior_price_verified = true;
    } else {
        museum.senior_price_verified = false;
    }

    museum.starting_price = bookingAdult;
    return museum;
}

class MuseumController {
    static async getAllMuseums(req, res, next) {
        try {
            const { state, city, search, limit, offset } = req.query;
            const museums = await MuseumModel.getAll({ state, city, search, limit, offset });
            const decorated = museums.map(attachStartingPrice);
            const total = decorated.length;

            res.status(200).json({
                success: true,
                count: total,
                data: decorated
            });
        } catch (err) {
            next(err);
        }
    }

    static async getMuseumById(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid museum ID'
                });
            }

            const museum = await MuseumModel.getById(id);
            if (!museum) {
                return res.status(404).json({
                    success: false,
                    message: 'Museum not found'
                });
            }

            res.status(200).json({
                success: true,
                data: attachStartingPrice(museum)
            });
        } catch (err) {
            next(err);
        }
    }

    static async searchMuseums(req, res, next) {
        try {
            const query = req.query.q || req.query.search || '';
            if (!query.trim()) {
                const all = await MuseumModel.getAll();
                const decoratedAll = all.map(attachStartingPrice);
                return res.status(200).json({
                    success: true,
                    count: decoratedAll.length,
                    data: decoratedAll
                });
            }

            const results = await MuseumModel.search(query);
            const decorated = results.map(attachStartingPrice);
            res.status(200).json({
                success: true,
                count: decorated.length,
                data: decorated
            });
        } catch (err) {
            next(err);
        }
    }

    static async getMuseumsByState(req, res, next) {
        try {
            const state = req.params.state;
            if (!state) {
                return res.status(400).json({
                    success: false,
                    message: 'State parameter is required'
                });
            }

            const museums = await MuseumModel.getByState(state);
            const decorated = museums.map(attachStartingPrice);
            res.status(200).json({
                success: true,
                state,
                count: decorated.length,
                data: decorated
            });
        } catch (err) {
            next(err);
        }
    }

    static async getStates(req, res, next) {
        try {
            const states = await MuseumModel.getDistinctStates();
            res.status(200).json({
                success: true,
                count: states.length,
                data: states
            });
        } catch (err) {
            next(err);
        }
    }

    static async addMuseum(req, res, next) {
        try {
            const {
                name, state, city, description,
                opening_time, closing_time,
                adult_price, child_price, senior_price, image
            } = req.body;

            if (!name || !state) {
                return res.status(400).json({
                    success: false,
                    message: 'Museum name and state are required'
                });
            }

            const created = await MuseumModel.create({
                name, state, city, description,
                opening_time, closing_time,
                adult_price, child_price, senior_price, image
            });

            res.status(201).json({
                success: true,
                message: 'Museum added successfully',
                data: created
            });
        } catch (err) {
            next(err);
        }
    }

    static async updateMuseum(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            const existing = await MuseumModel.getById(id);
            if (!existing) {
                return res.status(404).json({
                    success: false,
                    message: 'Museum not found'
                });
            }

            const updated = await MuseumModel.update(id, req.body);
            res.status(200).json({
                success: true,
                message: 'Museum updated successfully',
                data: updated
            });
        } catch (err) {
            next(err);
        }
    }

    static async deleteMuseum(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            const deleted = await MuseumModel.delete(id);
            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Museum not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Museum deleted successfully'
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = MuseumController;
