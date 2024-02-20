import { User } from '../db/models/user.js';
import * as SharedService from './sharedService.js';

interface LoginResult {
    success: boolean;
    email?: string;
    role?: string;
}

export const loginUser = async (email: string, password: string) => {
    const result: LoginResult = {
        success: false
    }

    const user = await User.findOne({
        where: {
            email
        }
    });

    if (user) {
        const passwordMatch = await SharedService.passwordMatch(user.password, password);

        if (passwordMatch) {
            await User.update({ lastLogin: new Date().getTime() }, {
                where: {
                    id: user.id
                }
            });

            result.success = true;
            result.email = user.email;
            result.role = user.role;
        }
    }

    return result;
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
    return User.findAll({
        attributes: ['id', 'name', 'email', 'role', 'lastLogin'],
        order: ['name', 'email']
    });
};

export const getUser = async (userId: string) => {
    return await User.findByPk(userId, {
        attributes: ['id', 'name', 'email', 'role', 'lastLogin', 'createdAt', 'updatedAt']
    });
};

export const getUserByEmail = async (email: string) => {
    return await User.findOne({
        attributes: ['id'],
        where: {
            email
        }
    });
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

export const updateUser = async (currentUser: User, name?: string, email?: string, password?: string, role?: string) => {
    const newUser: any = {};

    if (name) {
        newUser.name = name;
    }

    if (email) {
        newUser.email = email;
    }

    if (password) {
        newUser.password = await SharedService.hashPassword(password);
    }

    if (role) {
        newUser.role = role;
    }

    await User.update(newUser, {
        where: {
            id: currentUser.id
        }
    });
};
