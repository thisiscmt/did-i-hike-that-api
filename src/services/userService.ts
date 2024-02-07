import { User } from '../db/models/user.js';
import * as SharedService from './sharedService.js';

export const loginUser = async (email: string, password: string) => {
    let success = false;

    const user = await User.findOne({
        where: {
            email
        }
    });

    if (user) {
        success = await SharedService.passwordMatch(user.password, password);

        if (success) {
            await User.update({ lastLogin: new Date().getTime() }, {
                where: {
                    id: user.id
                }
            });
        }
    }

    return success;
};

export const validUser = async (email: string) => {
    let valid = false

    const userRecord = await User.findOne({
        where: {
            email
        }
    });

    if (userRecord) {
        valid = true;
    }

    return valid;
};

export const getUsers = () => {

};

export const createUser = async (name: string, email: string, password: string, role = 'Standard') => {
    const storedPassword = await SharedService.hashPassword(password);

    await User.create({
        name,
        email,
        password: storedPassword,
        role,
        lastLogin: 0
    });
};

export const updateUser = () => {

};
