// validators/userValidator.js
const { body, param } = require('express-validator');

const UserValidator = {
    createUser: [
        body('name').notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Email is invalid'),
    ],
    getUserByEmail: [
        param('email').isEmail().withMessage('Email is invalid'),
    ],
};

module.exports = UserValidator;
